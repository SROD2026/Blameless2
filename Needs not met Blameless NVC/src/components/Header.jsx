export default function Header() {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <h1 style={{ margin: 0, fontSize: 20, letterSpacing: 0.2 }}>
        Needs Not Met — Blameless NVC
      </h1>
      <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 13, lineHeight: 1.35 }}>
        Tap an emotion to open an NVC modal:{" "}
        <b>When I observe ____, I feel ____ because I need ____.</b>
      </div>
    </div>
  );
}
