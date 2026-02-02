// App.jsx
import React, { useEffect, useMemo, useState } from "react";

const CORE_COLORS = {
  Trust: "#2E7D32",
  Joy: "#F4B400",
  Sadness: "#1E5AA8",
  Anger: "#C62828",
  Fear: "#6A1B9A",
  Anticipation: "#EF6C00",
  Surprise: "#00838F",
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }

  row.push(cur);
  if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => String(h || "").trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => (obj[h] = r[idx] ?? ""));
    return obj;
  });
}

function normalizeKey(s) {
  return String(s ?? "").trim().toLowerCase();
}

function getValidationForSelection(validationRows, selection) {
  if (!selection?.expr?.label) return null;
  const word = normalizeKey(selection.expr.label);
  const branch = normalizeKey(selection.branch?.label);

  const matches = (validationRows || []).filter(
    (r) => normalizeKey(r["Emotion"]) === word
  );

  if (matches.length === 0) return null;
  if (matches.length === 1)
    return String(matches[0]["Christian Validation"] || "").trim();

  const scored = matches.map((r) => {
    const subtype = normalizeKey(r["Subtype"]);
    let score = 0;
    if (subtype && branch && (branch.includes(subtype) || subtype.includes(branch)))
      score += 3;

    const tokens = branch.split("/").map((t) => normalizeKey(t));
    for (const t of tokens) {
      if (t && subtype && (subtype.includes(t) || t.includes(subtype))) score += 1;
    }

    return { r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return String(scored[0].r["Christian Validation"] || "").trim();
}

/** ---------- color helpers ---------- **/
function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full || "0", 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex({ r, g, b }) {
  const to = (n) => Number(n).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  const d = max - min;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (0 <= h && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (60 <= h && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (120 <= h && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (180 <= h && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (240 <= h && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}
function shiftHue(hex, degrees) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const h2 = (h + degrees + 360) % 360;
  return rgbToHex(hslToRgb(h2, s, l));
}
function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const lerp = (x, y) => Math.round(x + (y - x) * t);
  return rgbToHex({ r: lerp(a.r, b.r), g: lerp(a.g, b.g), b: lerp(a.b, b.b) });
}
function lighten(hex, t = 0.35) {
  return mix(hex, "#ffffff", t);
}
function darken(hex, t = 0.25) {
  return mix(hex, "#000000", t);
}

/** ---------- svg helpers ---------- **/
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutSlicePath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}
function midAngle(a1, a2) {
  return (a1 + a2) / 2;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** ---------- trait helpers ---------- **/
function TraitPill({ trait }) {
  const t = String(trait || "").trim();
  if (!t) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e5e5e5",
        background: "#fafafa",
        fontWeight: 900,
        letterSpacing: 0.3,
        fontSize: 12,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
      title="Philippians 4:8 focus for this step"
    >
      <span style={{ opacity: 0.7 }}>Phil 4:8</span>
      <span style={{ opacity: 0.35 }}>•</span>
      <span>{t}</span>
    </span>
  );
}
function getTraitLabel(step) {
  const t = step?.philippians_trait ?? step?.trait;
  if (t === true || t === false || t == null) return null;
  return String(t).trim();
}

function normalize(s) {
  return (s ?? "").trim().toLowerCase();
}
function findNextSteps(schema, coreLabel, branchLabel, expressionLabel) {
  const tree = schema?.trees?.next_steps_wheel;
  if (!tree) return { groupLabel: null, steps: [] };

  const coreNode = tree.find((c) => c.label === coreLabel);
  if (!coreNode) return { groupLabel: null, steps: [] };

  const branch = normalize(branchLabel);
  const word = normalize(expressionLabel);

  let best = { groupLabel: null, steps: [], score: 0 };

  for (const group of coreNode.outer_emotions || []) {
    const candidates =
      group.match_words && group.match_words.length > 0
        ? group.match_words.map(normalize)
        : String(group.label || "").split("/").map(normalize);

    let score = 0;
    for (const c of candidates) {
      if (!c) continue;
      if (branch.includes(c)) score = Math.max(score, 3);
      if (word === c) score = Math.max(score, 2);
      if (word.includes(c) || c.includes(word)) score = Math.max(score, 1);
    }

    if (score > best.score) best = { groupLabel: group.label, steps: group.steps || [], score };
  }

  if (best.score === 0) return { groupLabel: null, steps: [] };
  return { groupLabel: best.groupLabel, steps: best.steps };
}

/** ---------- wheel component (now reports active middle color) ---------- **/
function EmotionWheel({ data, onPickExpression, onActiveColorChange }) {
  const defaultCore = data?.[0] ?? null;
  const [activeCoreId, setActiveCoreId] = useState(defaultCore?.id ?? null);

  useEffect(() => {
    if (!activeCoreId && defaultCore?.id) setActiveCoreId(defaultCore.id);
  }, [activeCoreId, defaultCore?.id]);

  const activeCore = useMemo(() => {
    return data?.find((c) => c.id === activeCoreId) ?? defaultCore;
  }, [data, activeCoreId, defaultCore]);

  const branches = activeCore?.branches ?? [];
  const defaultBranch = branches[0] ?? null;
  const [activeBranchId, setActiveBranchId] = useState(defaultBranch?.id ?? null);

  useEffect(() => {
    const first = branches[0];
    if (first?.id) setActiveBranchId(first.id);
  }, [activeCore?.id]);

  const activeBranch = useMemo(() => {
    const b = branches.find((br) => br.id === activeBranchId);
    return b ?? defaultBranch;
  }, [branches, activeBranchId, defaultBranch]);

  const expressions = activeBranch?.expressions ?? [];

  const coreBase = CORE_COLORS[activeCore?.label] || "#374151";
  const branchHueStep = 18;

  const branchColors = useMemo(() => {
    const n = Math.max(branches.length, 1);
    return branches.map((br, i) => {
      const offset = (i - (n - 1) / 2) * branchHueStep;
      return { id: br.id, hex: shiftHue(coreBase, offset) };
    });
  }, [coreBase, branches]);

  const getBranchBase = (branchId) =>
    branchColors.find((x) => x.id === branchId)?.hex || coreBase;

  const activeBranchBase = getBranchBase(activeBranchId);

  // ✅ send a softened version of the middle-ring color upward for background
  useEffect(() => {
    // “slightly decreased intensity” → mix heavily toward white
    const bg = lighten(activeBranchBase, 0.90); // tweak 0.86–0.92 if you want stronger/weaker tint
    onActiveColorChange?.(bg);
  }, [activeBranchBase, onActiveColorChange]);

  const midInactive = (hex) => lighten(hex, 0.72);
  const midActive = (hex) => lighten(hex, 0.55);

  const outerFill = lighten(activeBranchBase, 0.8);
  const outerStroke = lighten(activeBranchBase, 0.55);

  const size = 720;
  const cx = size / 2;
  const cy = size / 2;

  const r0 = 80;
  const r1 = 160;
  const r2 = 270;
  const r3 = 360;

  const coreCount = Math.max(data?.length ?? 0, 1);
  const coreStep = 360 / coreCount;

  const branchCount = Math.max(branches.length, 1);
  const branchStep = 360 / branchCount;

  const exprCount = Math.max(expressions.length, 1);
  const exprStep = 360 / exprCount;

  const tap = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.();
  };

  const showOuterLabels = exprStep >= 14;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "min(94vw, 900px)",
          height: "auto",
          maxHeight: "72vh",
          display: "block",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none",
        }}
      >
        <circle cx={cx} cy={cy} r={r3} fill="#ffffff" />

        {/* OUTER RING */}
        {expressions.map((expr, i) => {
          const start = i * exprStep;
          const end = (i + 1) * exprStep;
          const path = donutSlicePath(cx, cy, r3, r2, start, end);
          const a = midAngle(start, end);
          const lp = polarToCartesian(cx, cy, (r2 + r3) / 2, a);

          return (
            <g key={expr.id} style={{ cursor: "pointer" }}>
              <path
                d={path}
                fill={outerFill}
                stroke={outerStroke}
                strokeWidth="1"
                onPointerDown={tap(() => onPickExpression?.(activeCore, activeBranch, expr))}
              />
              {showOuterLabels && (
                <text
                  x={lp.x}
                  y={lp.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={clamp(exprStep * 0.9, 9, 14)}
                  fill="#222"
                  pointerEvents="none"
                >
                  {expr.label}
                </text>
              )}
            </g>
          );
        })}

        {/* MIDDLE RING */}
        {branches.map((br, i) => {
          const start = i * branchStep;
          const end = (i + 1) * branchStep;
          const path = donutSlicePath(cx, cy, r2, r1, start, end);
          const a = midAngle(start, end);
          const lp = polarToCartesian(cx, cy, (r1 + r2) / 2, a);

          const isActive = br.id === activeBranchId;
          const brBase = getBranchBase(br.id);

          return (
            <g key={br.id} style={{ cursor: "pointer" }}>
              <path
                d={path}
                fill={isActive ? midActive(brBase) : midInactive(brBase)}
                stroke={lighten(brBase, 0.45)}
                strokeWidth={isActive ? "2" : "1"}
                onPointerDown={tap(() => setActiveBranchId(br.id))}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={clamp(branchStep * 0.9, 11, 16)}
                fill="#111"
                pointerEvents="none"
              >
                {br.label}
              </text>
            </g>
          );
        })}

        {/* INNER RING */}
        {data.map((core, i) => {
          const start = i * coreStep;
          const end = (i + 1) * coreStep;
          const path = donutSlicePath(cx, cy, r1, r0, start, end);
          const a = midAngle(start, end);
          const lp = polarToCartesian(cx, cy, (r0 + r1) / 2, a);

          const isActive = core.id === activeCoreId;

          const thisCoreBase = CORE_COLORS[core.label] || "#374151";
          const thisCoreFill = isActive ? darken(thisCoreBase, 0.18) : darken(thisCoreBase, 0.38);
          const thisCoreStroke = darken(thisCoreBase, 0.55);

          return (
            <g key={core.id} style={{ cursor: "pointer" }}>
              <path
                d={path}
                fill={thisCoreFill}
                stroke={thisCoreStroke}
                strokeWidth="1"
                onPointerDown={tap(() => setActiveCoreId(core.id))}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={14}
                fill="#fff"
                fontWeight={700}
                pointerEvents="none"
              >
                {core.label}
              </text>
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={r0 - 10} fill="#ffffff" stroke="#e5e5e5" />
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fill="#111"
          fontWeight={700}
          pointerEvents="none"
        >
          Select
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill="#555"
          pointerEvents="none"
        >
          core → branch → word
        </text>
      </svg>

      <div style={{ marginTop: 10, opacity: 0.85, textAlign: "center", padding: "0 10px" }}>
        <strong>{activeCore?.label}</strong> {"  "}→{"  "}
        <strong>{activeBranch?.label}</strong>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{expressions.length} words</div>
      </div>
    </div>
  );
}

function ValidationModal({ open, onClose, onContinue, selection, validationText }) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const DURATION = 420;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setShow(false);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setShow(true));
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
    setShow(false);
    const t = setTimeout(() => setMounted(false), DURATION);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  const title = selection
    ? `${selection.core.label} → ${selection.branch.label} → ${selection.expr.label}`
    : "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1200,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          opacity: show ? 0.45 : 0,
          transition: `opacity ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(94vw, 760px)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "white",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0px) scale(1)" : "translateY(14px) scale(0.985)",
          transition: `opacity ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1), transform ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 800 }}>You selected</div>
            <div style={{ fontSize: 18, fontWeight: 950, lineHeight: 1.2 }}>{title}</div>
            <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.45 }}>
              Before redirecting, take a moment to acknowledge what you’re feeling.
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #ccc",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 800,
              background: "#fff",
              height: "fit-content",
            }}
          >
            Close
          </button>
        </div>

        <hr style={{ margin: "16px 0" }} />

        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 14,
            padding: 14,
            background: "#fbfbfb",
            lineHeight: 1.5,
            fontSize: 15,
          }}
        >
          <div style={{ fontWeight: 900, opacity: 0.7, marginBottom: 8 }}>Validation</div>
          <div>{validationText || "You’re allowed to notice this feeling without rushing to fix it."}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button
            onClick={onContinue}
            style={{
              border: "1px solid #111827",
              borderRadius: 12,
              padding: "12px 14px",
              cursor: "pointer",
              fontWeight: 900,
              background: "#111827",
              color: "#fff",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function NextStepsModal({ open, onClose, selection, steps }) {
  const DURATION = 900;

  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  const [snapSelection, setSnapSelection] = useState(null);
  const [snapSteps, setSnapSteps] = useState([]);

  useEffect(() => {
    if (open) {
      setSnapSelection(selection ?? null);
      setSnapSteps(Array.isArray(steps) ? steps : []);
    }
  }, [open, selection, steps]);

  const candidateSteps = useMemo(() => (snapSteps || []).slice(0, 4), [snapSteps]);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const step = candidateSteps[activeStepIndex] || null;
  const traitLabel = useMemo(() => getTraitLabel(step), [step]);

  const softSuggestions = useMemo(() => {
    if (!step) return [];
    const arr = Array.isArray(step.soft_suggestions) ? step.soft_suggestions : [];
    if (arr.length) return arr;
    return step.soft_suggestion ? [step.soft_suggestion] : [];
  }, [step]);

  const softSuggestion =
    softSuggestions.length ? softSuggestions[activeSuggestionIndex] : null;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setShow(false);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setShow(true));
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
    setShow(false);
    const t = setTimeout(() => setMounted(false), DURATION);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!candidateSteps.length) return;
    const si = Math.floor(Math.random() * candidateSteps.length);
    setActiveStepIndex(si);
    setActiveSuggestionIndex(0);
  }, [
    open,
    snapSelection?.core?.id,
    snapSelection?.branch?.id,
    snapSelection?.expr?.id,
    candidateSteps.length,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!softSuggestions.length) return;
    setActiveSuggestionIndex(Math.floor(Math.random() * softSuggestions.length));
  }, [open, step?.id, softSuggestions.length]);

  const pickAnotherStep = () => {
    if (candidateSteps.length <= 1) return;
    let next = activeStepIndex;
    while (next === activeStepIndex) next = Math.floor(Math.random() * candidateSteps.length);
    setActiveStepIndex(next);
    setActiveSuggestionIndex(0);
  };

  const pickAnotherSuggestion = () => {
    if (softSuggestions.length <= 1) return;
    let next = activeSuggestionIndex;
    while (next === activeSuggestionIndex) next = Math.floor(Math.random() * softSuggestions.length);
    setActiveSuggestionIndex(next);
  };

  if (!mounted) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          opacity: show ? 0.45 : 0,
          transition: `opacity ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(94vw, 820px)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "white",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0px) scale(1)" : "translateY(16px) scale(0.982)",
          transition:
            `opacity ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1), ` +
            `transform ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 950, lineHeight: 1.15 }}>
              {snapSelection?.core?.label} → {snapSelection?.branch?.label} →{" "}
              {snapSelection?.expr?.label}
            </div>

            <span style={{ fontSize: 13, opacity: 0.75 }}>
              Redirect attention toward what is{" "}
              <strong>true, honorable, just, pure, lovely, commendable</strong>.
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #ccc",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 700,
              height: "fit-content",
              background: "#fff",
            }}
          >
            Close
          </button>
        </div>

        <hr style={{ margin: "16px 0" }} />

        {!step ? (
          <div style={{ opacity: 0.75, fontSize: 15 }}>
            No next steps found for this emotion yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderLeft: traitLabel ? "6px solid #111827" : "1px solid #e5e5e5",
                borderRadius: 16,
                padding: 16,
                background: "#fff",
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 950, fontSize: 18, lineHeight: 1.2 }}>
                  {step.label}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <TraitPill trait={traitLabel} />
                  {candidateSteps.length > 1 && (
                    <button
                      onClick={pickAnotherStep}
                      style={{
                        border: "1px solid #e5e5e5",
                        borderRadius: 12,
                        padding: "10px 12px",
                        cursor: "pointer",
                        background: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Another step
                    </button>
                  )}
                </div>
              </div>

              {traitLabel ? (
                <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.35 }}>
                  <span style={{ fontWeight: 800 }}>How this redirects:</span>{" "}
                  This step is meant to move attention toward{" "}
                  <span style={{ fontWeight: 900 }}>{traitLabel}</span> (Philippians 4:8).
                </div>
              ) : null}

              {step ? (
                <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, opacity: 0.65, marginBottom: 6 }}>
                    Scripture
                  </div>
                  <div>{step.scripture_1}</div>
                  <div>{step.scripture_2}</div>
                </div>
              ) : null}

              {(step?.soft_suggestions?.length || step?.soft_suggestion) && (
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.45,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #eee",
                    background: "#fbfbfb",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 800, opacity: 0.65 }}>Soft suggestion</div>
                    {softSuggestions.length > 1 && (
                      <button
                        onClick={pickAnotherSuggestion}
                        style={{
                          border: "1px solid #e5e5e5",
                          borderRadius: 12,
                          padding: "10px 12px",
                          cursor: "pointer",
                          background: "#fff",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Another suggestion
                      </button>
                    )}
                  </div>
                  <div>{softSuggestion}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------- app (background fade added) ---------- **/
export default function App() {
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState(null);

  const [picked, setPicked] = useState(null);
  const [stage, setStage] = useState(null);
  const [validationRows, setValidationRows] = useState([]);

  // ✅ background that fades between branch colors
  const [bgColor, setBgColor] = useState("#ffffff");

  useEffect(() => {
    fetch("/data/unified_wheels_schema.json?v=5")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load schema JSON");
        return res.json();
      })
      .then(setSchema)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    fetch("/data/emotions_wheel.csv")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load validation CSV");
        return res.text();
      })
      .then((txt) => setValidationRows(parseCSV(txt)))
      .catch(() => setValidationRows([]));
  }, []);

  const validationText = useMemo(
    () => getValidationForSelection(validationRows, picked),
    [validationRows, picked?.core?.id, picked?.branch?.id, picked?.expr?.id]
  );

  const nextStepsResult = useMemo(() => {
    if (!schema || !picked) return { groupLabel: null, steps: [] };
    return findNextSteps(schema, picked.core.label, picked.branch.label, picked.expr.label);
  }, [schema, picked?.core?.id, picked?.branch?.id, picked?.expr?.id]);

  const closeAll = () => {
    setStage(null);
    setPicked(null);
  };

  const openValidation = (selection) => {
    setPicked(selection);
    setStage("validate");
  };

  const continueToSteps = () => setStage("steps");

  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  if (!schema) return <div style={{ padding: 20 }}>Loading…</div>;

  const discernment = schema?.trees?.discernment_wheel ?? [];
  const nextSteps = nextStepsResult.steps;

  return (
  <div
    style={{
      backgroundColor: bgColor,
      transition: "background-color 1400ms cubic-bezier(0.22, 0.61, 0.36, 1)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",

      // safe areas
      paddingTop: "max(16px, env(safe-area-inset-top))",
      paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      paddingLeft: "max(16px, env(safe-area-inset-left))",
      paddingRight: "max(16px, env(safe-area-inset-right))",
    }}
  >
    {/* Header pinned at top */}
    <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: "min(980px, 100%)", padding: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.1, alignItems: "center" }}>Blameless emotions Wheel</h1>
        <p style={{ opacity: 0.9, marginTop: 6, marginBottom: 0, fontSize: 14, alignItems: "center" }}>
          Tap a core emotion, then a category, then an outer descriptive feeling.
        </p>
      </div>
    </div>

    {/* Wheel area centered in remaining space */}
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 12,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "min(980px, 100%)", padding: 16 }}>
        <EmotionWheel
          data={discernment}
          onPickExpression={(core, branch, expr) => openValidation({ core, branch, expr })}
          onActiveColorChange={setBgColor}
        />
      </div>
    </div>

    <ValidationModal
      open={stage === "validate"}
      onClose={closeAll}
      onContinue={continueToSteps}
      selection={picked}
      validationText={validationText}
    />

    <NextStepsModal
      open={stage === "steps"}
      onClose={closeAll}
      selection={picked}
      steps={nextSteps}
    />
  </div>
);

}