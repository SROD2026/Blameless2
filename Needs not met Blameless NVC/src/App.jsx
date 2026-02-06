import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import EmotionGrid from "./components/EmotionGrid.jsx";
import EmotionModal from "./components/EmotionModal.jsx";
import { loadEmotionMeta, loadNNMGrid } from "./utils/data.js";
import "./App.css";

export default function App() {
  const [grid, setGrid] = useState([]);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const g = await loadNNMGrid();
        const m = await loadEmotionMeta();

        setGrid(Array.isArray(g) ? g : []);
        setMeta(m && typeof m === "object" ? m : {});
      } catch (e) {
        setErr(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      <div className="appShell">
        <div className="panel">
          <div className="metaRow">
            <Header />
            <div className="smallMuted">
              {loading ? "Loading…" : err ? `Error: ${err}` : `Loaded ${grid.length} entries`}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="gridWrap">
            <EmotionGrid grid={grid} onPick={setSelected} />
          </div>
        </div>

        <EmotionModal
          open={!!selected}
          onClose={() => setSelected(null)}
          cell={selected}
          meta={meta}
        />
      </div>
    </div>
  );
}
