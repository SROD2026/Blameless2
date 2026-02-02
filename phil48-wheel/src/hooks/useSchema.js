import { useEffect, useState } from "react";
import { buildIndexes } from "../utils/indexSchema";

export function useSchema() {
  const [schema, setSchema] = useState(null);
  const [indexes, setIndexes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/data/unified_wheels_schema.json");
        if (!res.ok) throw new Error(`Failed to load schema: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setSchema(data);
        setIndexes(buildIndexes(data));
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { schema, indexes, error };
}
