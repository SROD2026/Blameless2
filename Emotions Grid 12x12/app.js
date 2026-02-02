// 12 non-zero integer coordinates for each axis
const AXIS = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];

let EMOTIONS = [];
let EMO_INDEX = new Map();

const gridEl = document.getElementById("grid");
const moodValueEl = document.getElementById("moodValue");
const intensityValueEl = document.getElementById("intensityValue");
const matchesListEl = document.getElementById("matchesList");
const clearBtn = document.getElementById("clearBtn");

let selected = null;

// ---------- Helpers ----------
function keyXY(x, y) {
  return `${x},${y}`;
}
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
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

// Bilinear blend of 4 corners
function bilerpRGB(cBL, cBR, cTL, cTR, u, v) {
  // u: left->right (0..1), v: bottom->top (0..1)
  const bottom = lerpRGB(cBL, cBR, u);
  const top = lerpRGB(cTL, cTR, u);
  return lerpRGB(bottom, top, v);
}

function setCellSpectrumColor(cell, x, y) {
  // Normalize x,y from [-6..+6] excluding 0; map to 0..1
  // We treat -6 as 0, +6 as 1
  const u = (x + 6) / 12; // left->right
  const v = (y + 6) / 12; // bottom->top

  // Corner colors (RGB)
  // TL = Red, BL = Blue, BR = Green, TR = Yellow
    const TL = [255, 60, 40];   // red
    const BL = [60, 100, 255];  // blue
    const BR = [80, 230, 110];  // green
    const TR = [255, 255, 80];  // yellow

  // Blend the corners smoothly
  const [r, g, b] = bilerpRGB(BL, BR, TL, TR, clamp01(u), clamp01(v));

  // Optional: increase "intensity" upward (slightly brighter at top)
  // Keep subtle so labels remain readable
  const intensityBoost = lerp(0.90, 1.10, clamp01(v));

  const rr = Math.round(r * intensityBoost);
  const gg = Math.round(g * intensityBoost);
  const bb = Math.round(b * intensityBoost);

  cell.style.background = `rgb(${rr}, ${gg}, ${bb})`;
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

function quadrantClass(x, y) {
  if (x < 0 && y > 0) return "q-neg-high";
  if (x < 0 && y < 0) return "q-neg-low";
  if (x > 0 && y < 0) return "q-pos-low";
  if (x > 0 && y > 0) return "q-pos-high";
  return "";
}

// ---------- Data loading ----------
async function loadTSV() {
  const res = await fetch("./data.tsv");
  if (!res.ok) throw new Error(`Could not load data.tsv (${res.status})`);

  const text = await res.text();
  const lines = text.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) throw new Error("data.tsv looks empty or missing rows.");

  // skip header
  const rows = lines.slice(1);

  EMOTIONS = rows.map((line, i) => {
    const parts = line.split("\t");
    if (parts.length < 3) throw new Error(`Bad TSV line ${i + 2}: ${line}`);

    const word = parts[0].trim();
    const mood = Number(parts[1]);
    const intensity = Number(parts[2]);

    if (!word) throw new Error(`Missing word on line ${i + 2}`);
    if (Number.isNaN(mood) || Number.isNaN(intensity)) {
      throw new Error(`Non-number mood/intensity on line ${i + 2}: ${line}`);
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

  // Lane index (0..12). After 6 cells (0..5), we insert the lane at index 6.
  const LANE_I = 6;

  // y from high (+6) to low (-6)
  const yVals = [...AXIS].sort((a, b) => b - a);

  // Build 13 columns / rows using indexes (0..12)
  // Map indexes to axis values, skipping the lane slot.
  function xFromCol(col) {
    // col 0..5 => AXIS[0..5], col 7..12 => AXIS[6..11]
    return col < LANE_I ? AXIS[col] : AXIS[col - 1];
  }
  function yFromRow(row) {
    // row 0..5 => yVals[0..5], row 7..12 => yVals[6..11]
    return row < LANE_I ? yVals[row] : yVals[row - 1];
  }

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {

      // Center lane: entire middle row OR middle column
      const isLane = (row === LANE_I || col === LANE_I);

      const cell = document.createElement("div");

      if (isLane) {
        cell.className = "cell gapCell";
        cell.textContent = "";  // keep empty so it’s “space”
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

      cell.title = label
        ? `${label} (Mood ${x}, Intensity ${y})`
        : `Mood ${x}, Intensity ${y}`;

      cell.addEventListener("click", () => {
        selected = { mood: x, intensity: y };
        renderGrid();
        renderMatches();
      });

      if (selected && selected.mood === x && selected.intensity === y) {
        cell.classList.add("selected");
      }

      gridEl.appendChild(cell);
    }
  }

  console.log("Grid children:", gridEl.children.length); // should be 169
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
  renderMatches();
})();
