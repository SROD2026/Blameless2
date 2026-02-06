export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// 0..1 based on max(|x|,|y|) where x,y in [-7..7]
export function intensity01(x, y) {
  const d = Math.max(Math.abs(x), Math.abs(y));
  return clamp(d / 7, 0, 1);
}

export function getQuadrant(x, y) {
  // Force center as anger/disgust palette
  if (x === 0 && y === 0) return "ANGER_DISGUST";

  // Nudge axis values into a consistent quadrant for coloring
  const nx = x === 0 ? -0.0001 : x;  // x=0 treated as left
  const ny = y === 0 ?  0.0001 : y;  // y=0 treated as top

  if (nx < 0 && ny > 0) return "ANGER_DISGUST"; // top-left
  if (nx > 0 && ny > 0) return "SURPRISED";     // top-right
  if (nx < 0 && ny < 0) return "SAD_AFRAID";    // bottom-left
  return "SAD_SHAME";                            // bottom-right
}

const HUES = {
  ANGER_DISGUST: 8,   // red-orange
  SURPRISED: 48,      // yellow
  SAD_AFRAID: 205,    // blue
  SAD_SHAME: 285      // purple
};

export function cellColor(x, y) {
  const q = getQuadrant(x, y);
  const t = intensity01(x, y);

  const hue = HUES[q] ?? 210;

  // Corners more intense
  const sat = 38 + t * 44;           // 38 -> 82
  const light = 46 - t * 18;         // 46 -> 28
  const alpha = 0.95;

  return `hsla(${hue} ${sat}% ${light}% / ${alpha})`;
}
