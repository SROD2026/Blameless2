// 20 non-zero integer coordinates for each axis (lane at 0)
// Needs axis: -10..-1, 1..10
// Intensity axis: -10..-1, 1..10
const AXIS = [
  -10, -9, -8, -7, -6, -5, -4, -3, -2, -1,
   1,   2,  3,  4,  5,  6,  7,  8,  9, 10
];

// ---------- Device ----------
const isTouchDevice = matchMedia("(pointer: coarse)").matches;

// ---------- State ----------
let EMOTIONS = [];
let EMO_INDEX = new Map();
let selected = null;

// ---------- DOM ----------
const gridEl = document.getElementById("grid");
const moodValueEl = document.getElementById("moodValue");
const intensityValueEl = document.getElementById("intensityValue");
const matchesListEl = document.getElementById("matchesList");
const clearBtn = document.getElementById("clearBtn");

const viewportEl = document.getElementById("viewport");
const zoomLayerEl = document.getElementById("zoomLayer");

// ---------- Zoom/Pan state ----------
const BASE_CELL = 48;
const BASE_FONT = 12;
let zoom = 1;
let panX = 0, panY = 0;

// ---------- Helpers ----------
function keyXY(x, y) {
  return `${x},${y}`;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpRGB(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}
function bilerpRGB(cBL, cBR, cTL, cTR, u, v) {
  const bottom = lerpRGB(cBL, cBR, u);
  const top = lerpRGB(cTL, cTR, u);
  return lerpRGB(bottom, top, v);
}

function setCellSpectrumColor(cell, x, y) {
  const u = (x + 10) / 20;
  const v = (y + 10) / 20;

  const TL = [255, 60, 40];
  const BL = [60, 100, 255];
  const BR = [80, 230, 110];
  const TR = [255, 255, 80];

  const [r, g, b] = bilerpRGB(BL, BR, TL, TR, clamp01(u), clamp01(v));
  const intensityBoost = lerp(0.90, 1.10, clamp01(v));

  cell.style.background = `rgb(${Math.round(r * intensityBoost)}, ${Math.round(g * intensityBoost)}, ${Math.round(b * intensityBoost)})`;
}

function manhattan(a, b) {
  return Math.abs(a.mood - b.mood) + Math.abs(a.intensity - b.intensity);
}

function buildEmotionIndex(emotions) {
  const map = new Map();
  for (const e of emotions) {
    const k = keyXY(e.mood, e.intensity);
    if (map.has(k)) map.set(k, `${map.get(k)}, ${e.word}`);
    else map.set(k, e.word);
  }
  return map;
}

// ---------- Fit text ----------
function fitTextToCell(cell, {
  minPx = 7,
  maxPx = 16,
  maxLines = 3,
  step = 0.5
} = {}) {
  if (!cell || cell.classList.contains("empty") || cell.classList.contains("gapCell")) return;

  const text = cell.textContent.trim();
  if (!text || text === "·") return;

  cell.style.whiteSpace = "normal";
  cell.style.hyphens = "none";
  cell.style.wordBreak = "keep-all";
  cell.style.overflowWrap = "normal";
  cell.style.textAlign = "center";
  cell.style.overflow = "hidden";

  if (!cell._fitSpan) {
    const span = document.createElement("span");
    span.className = "fitSpan";
    span.style.display = "block";
    span.style.width = "100%";
    cell.textContent = "";
    cell.appendChild(span);
    cell._fitSpan = span;
  }

  const span = cell._fitSpan;
  span.textContent = text;
  span.style.lineHeight = "1.05";

  function fits() {
    const withinBox =
      span.scrollWidth <= cell.clientWidth &&
      span.scrollHeight <= cell.clientHeight;

    const lh = parseFloat(getComputedStyle(span).lineHeight);
    const lines = Math.ceil(span.scrollHeight / lh);

    return withinBox && lines <= maxLines;
  }

  let size = maxPx;
  span.style.fontSize = `${size}px`;

  while (!fits() && size > minPx) {
    size -= step;
    span.style.fontSize = `${size}px`;
  }
}

// ---------- Data loading ----------
async function loadTSV() {
  const res = await fetch("./data2.tsv");
  if (!res.ok) throw new Error(`Could not load data2.tsv (${res.status})`);

  const text = await res.text();
  const lines = text.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) throw new Error("data2.tsv looks empty or missing rows.");

  const rows = lines.slice(1);

  EMOTIONS = rows.map((line, i) => {
    const parts = line.split("\t");
    if (parts.length !== 3) {
      throw new Error(`Expected 3 columns (word, needs, intensity) on line ${i + 2}`);
    }

    const word = parts[0].trim();
    const mood = Number(parts[1]);
    const intensity = Number(parts[2]);

    if (!word) throw new Error(`Missing word on line ${i + 2}`);
    if (Number.isNaN(mood) || Number.isNaN(intensity)) {
      throw new Error(`Non-number needs/intensity on line ${i + 2}: ${line}`);
    }

    return { word, mood, intensity };
  });

  EMO_INDEX = buildEmotionIndex(EMOTIONS);
  console.log("Loaded emotions:", EMOTIONS.length);
}

// ---------- Rendering ----------
function renderMatches() {
  matchesListEl.innerHTML = "";

  if (!selected) {
    moodValueEl.textContent = "—";
    intensityValueEl.textContent = "—";
    return;
  }

  moodValueEl.textContent = String(selected.mood);
  intensityValueEl.textContent = String(selected.intensity);

  const ranked = EMOTIONS
    .map((e) => ({ ...e, d: manhattan(e, selected) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5);

  ranked.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.word} (d=${item.d})`;
    matchesListEl.appendChild(li);
  });
}

function renderGrid() {
  gridEl.innerHTML = "";

  const LANE_I = 10;
  const yVals = [...AXIS].sort((a, b) => b - a);

  function xFromCol(col) {
    return col < LANE_I ? AXIS[col] : AXIS[col - 1];
  }
  function yFromRow(row) {
    return row < LANE_I ? yVals[row] : yVals[row - 1];
  }

  for (let row = 0; row < 21; row++) {
    for (let col = 0; col < 21; col++) {
      const isLane = (row === LANE_I || col === LANE_I);
      const cell = document.createElement("div");

      if (isLane) {
        cell.className = "cell gapCell";
        cell.textContent = "";
        cell.style.background = "rgba(255,255,255,0.03)";
        cell.style.cursor = "default";
        gridEl.appendChild(cell);
        continue;
      }

      const x = xFromCol(col);
      const y = yFromRow(row);

      cell.className = "cell";
      setCellSpectrumColor(cell, x, y);

      const label = EMO_INDEX.get(keyXY(x, y));
      if (label) {
        cell.textContent = label;
        cell.classList.remove("empty");
      } else {
        cell.textContent = "·";
        cell.classList.add("empty");
      }

      cell.title = label ? `${label} (Needs ${x}, Intensity ${y})` : `Needs ${x}, Intensity ${y}`;

      cell.addEventListener("click", () => {
        selected = { mood: x, intensity: y };
        renderGrid();
        renderMatches();
      });

      if (selected && selected.mood === x && selected.intensity === y) {
        cell.classList.add("selected");
      }

      gridEl.appendChild(cell);

      requestAnimationFrame(() => {
        fitTextToCell(cell, { minPx: 7, maxPx: 16, maxLines: 3 });
      });
    }
  }
}

// ---------- Zoom / Pan (transform) ----------
function setTransform() {
  zoomLayerEl.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
}
function applyPan() { setTransform(); }
function applyZoom() {
  const cell = Math.round(BASE_CELL * zoom);
  const font = Math.round(BASE_FONT * zoom * 0.92);
  document.documentElement.style.setProperty("--cell", `${cell}px`);
  document.documentElement.style.setProperty("--font", `${Math.max(8, font)}px`);
  setTransform();
}

// Desktop wheel zoom
viewportEl.addEventListener("wheel", (e) => {
  e.preventDefault();
  const step = (-e.deltaY) > 0 ? 1.06 : 0.94;
  zoom = clamp(zoom * step, 0.7, 2.2);
  applyZoom();
}, { passive: false });

// Mobile pinch + one-finger pan
{
  let pointers = new Map();
  let lastPanPt = null;
  let startDist = 0;
  let startZoom = 1;

  function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }
  function mid(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  viewportEl.addEventListener("pointerdown", (e) => {
    viewportEl.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      lastPanPt = { x: e.clientX, y: e.clientY };
    }
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      startDist = dist(pts[0], pts[1]);
      startZoom = zoom;
    }
  });

  viewportEl.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const center = mid(pts[0], pts[1]);

      const factor = d / startDist;
      const newZoom = clamp(startZoom * factor, 0.7, 2.2);

      const scaleChange = newZoom / zoom;
      zoom = newZoom;

      panX = center.x - scaleChange * (center.x - panX);
      panY = center.y - scaleChange * (center.y - panY);

      applyZoom();
      return;
    }

    if (pointers.size === 1) {
      const pt = pointers.get(e.pointerId);
      if (!lastPanPt) lastPanPt = { ...pt };

      panX += (pt.x - lastPanPt.x);
      panY += (pt.y - lastPanPt.y);
      lastPanPt = { ...pt };

      applyPan();
    }
  });

  viewportEl.addEventListener("pointerup", (e) => {
    pointers.delete(e.pointerId);
    try { viewportEl.releasePointerCapture(e.pointerId); } catch {}

    if (pointers.size === 0) lastPanPt = null;
    if (pointers.size === 1) {
      const pt = [...pointers.values()][0];
      lastPanPt = { ...pt };
    }
  });

  viewportEl.addEventListener("pointercancel", () => {
    pointers.clear();
    lastPanPt = null;
  });
}

// Desktop ctrl-pan + ctrl-doubleclick reset (desktop only)
if (!isTouchDevice) {
  let isPanning = false;
  let startX = 0, startY = 0, startPanX = 0, startPanY = 0;

  function isCellTarget(el) {
    return el && el.closest && el.closest(".cell");
  }

  viewportEl.addEventListener("pointerdown", (e) => {
    const ctrl = e.ctrlKey;
    if (!ctrl && isCellTarget(e.target)) return;

    isPanning = true;
    viewportEl.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;
    startPanX = panX;
    startPanY = panY;
  });

  viewportEl.addEventListener("pointermove", (e) => {
    if (!isPanning) return;
    panX = startPanX + (e.clientX - startX);
    panY = startPanY + (e.clientY - startY);
    requestAnimationFrame(applyPan);
  });

  viewportEl.addEventListener("pointerup", (e) => {
    if (!isPanning) return;
    isPanning = false;
    try { viewportEl.releasePointerCapture(e.pointerId); } catch {}
  });

  viewportEl.addEventListener("pointercancel", () => {
    isPanning = false;
  });

  viewportEl.addEventListener("dblclick", (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    zoom = 1;
    panX = 0;
    panY = 0;
    applyZoom();
    applyPan();
  });
}

// ---------- Events ----------
clearBtn.addEventListener("click", () => {
  selected = null;
  renderGrid();
  renderMatches();
});

// ---------- Init ----------
(async function init() {
  try {
    await loadTSV();
  } catch (e) {
    console.error(e);
    alert(e.message || String(e));
  }
  renderGrid();
  applyZoom();
  applyPan();
  renderMatches();
})();
