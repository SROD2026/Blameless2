export default function NextStepsModal({ open, onClose, selection, maxOptions = 4 }) {
  if (!open || !selection) return null;

  const { core, branch, expression, outerGroup, steps } = selection;

  // show up to 4 (you can randomize later)
  const shown = (steps || []).slice(0, maxOptions);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 999
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: "white",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.75 }}>Selected</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {core} → {branch} → {expression}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              Next-step group: {outerGroup || "—"}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "1px solid #ccc", borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
            Close
          </button>
        </div>

        <hr style={{ margin: "12px 0" }} />

        {shown.length === 0 ? (
          <div style={{ opacity: 0.8 }}>
            No next steps found for this expression yet. (This usually means the expression
            didn’t match an outer group label.)
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {shown.map((s) => (
              <div key={s.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{s.trait}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  {s.scripture_1} · {s.scripture_2}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
