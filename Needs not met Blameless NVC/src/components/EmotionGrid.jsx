import { cellColor } from "../utils/color.js";

export default function EmotionGrid({ grid, onPick }) {
  // We expect x,y in -7..7.
  // Build lookup map for quick access
  const map = new Map(grid.map((c) => [`${c.x},${c.y}`, c]));

  const coords = [];
  for (let y = 7; y >= -7; y--) {
    for (let x = -7; x <= 7; x++) {
      coords.push({ x, y });
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(15, minmax(48px, 1fr))",
        gap: 8,
        padding: 8,
        minWidth: 15 * 56, // allows horizontal scroll on small screens
      }}
    >
      {coords.map(({ x, y }) => {
        const cell = map.get(`${x},${y}`);
        const label = cell?.emotion ?? "";

        const bg = cellColor(x, y);

        const isEmpty = !cell;
        return (
          <button
            key={`${x},${y}`}
            disabled={isEmpty}
            onClick={() => cell && onPick(cell)}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: isEmpty ? "rgba(255,255,255,0.03)" : bg,
              color: "rgba(255,255,255,0.92)",
              padding: 8,
              fontSize: 11,
              lineHeight: 1.15,
              textAlign: "left",
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
              cursor: isEmpty ? "default" : "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
            title={label ? `${label} (${x},${y})` : `(${x},${y})`}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 10, opacity: 0.9 }}>
                {x},{y}
              </div>
              <div style={{ opacity: isEmpty ? 0.35 : 1 }}>
                {label || "—"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
