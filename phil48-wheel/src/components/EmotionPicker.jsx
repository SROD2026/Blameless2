export default function EmotionPicker({ indexes, onPick }) {
  const cores = Array.from(indexes.expressionsByCore.keys()).sort();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {cores.map((core) => {
        const items = indexes.expressionsByCore.get(core) || [];
        // You can limit to top N for now if you want
        return (
          <div key={core} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <h3 style={{ margin: "0 0 8px" }}>{core}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {items.map((it) => (
                <button
                  key={`${it.core}-${it.branch}-${it.expression}`}
                  onClick={() => onPick(it.expression)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #ccc",
                    background: "white",
                    cursor: "pointer"
                  }}
                >
                  {it.expression}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
