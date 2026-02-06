import { useMemo, useState } from "react";

export default function EmotionModal({ open, onClose, cell, meta }) {
  const [observe, setObserve] = useState("");
  const [need, setNeed] = useState("");

  const emotion = cell?.emotion ?? "";

  const needs = useMemo(() => {
    const m = meta?.[emotion];
    return Array.isArray(m?.needs) ? m.needs : [];
  }, [meta, emotion]);

  const template = useMemo(() => {
    const m = meta?.[emotion];
    if (m?.nvc_template) return m.nvc_template;
    return "When I observe ____, I feel ____ because I need ____.";
  }, [meta, emotion]);

  // reset when opening new cell
  useMemo(() => {
    if (open) {
      setObserve("");
      setNeed(needs?.[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, emotion]);

  if (!open) return null;

  const finalSentence =
    `When I observe ${observe || "____"}, ` +
    `I feel ${emotion || "____"} ` +
    `because I need ${need || "____"}.`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 14,
        zIndex: 9999
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: "rgba(15, 20, 28, 0.98)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 18px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)" }}>
              Emotion
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {emotion}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              ({cell?.x},{cell?.y})
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
              padding: "10px 12px",
              fontSize: 14,
              cursor: "pointer",
              touchAction: "manipulation"
            }}
          >
            Close
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)" }}>
              Observation (what you saw/heard — concrete)
            </div>
            <input
              value={observe}
              onChange={(e) => setObserve(e.target.value)}
              placeholder="e.g., “The plan changed 10 minutes before we left.”"
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.92)",
                padding: 12,
                fontSize: 14,
                outline: "none"
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)" }}>
              Need (choose what might be unmet)
            </div>

            <select
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.92)",
                padding: 12,
                fontSize: 14,
                outline: "none"
              }}
            >
              {needs.length ? (
                needs.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))
              ) : (
                <option value="">(No needs found for this emotion)</option>
              )}
            </select>
          </label>

          <div
            style={{
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: 12,
              fontSize: 14,
              lineHeight: 1.4
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginBottom: 6 }}>
              Your NVC sentence
            </div>
            <div style={{ fontWeight: 600 }}>{finalSentence}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
