export async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  const text = await res.text();

  if (text.trim().startsWith("<!doctype") || text.trim().startsWith("<html")) {
    throw new Error(`Fetch ${path} returned HTML (not JSON). Check public/ file path & name.`);
  }

  return JSON.parse(text);
}

function normalizeMeta(meta) {
  if (!meta || typeof meta !== "object") return {};

  const out = {};
  for (const [emotion, entry] of Object.entries(meta)) {
    const needsRaw = entry?.needs;

    // Allow needs to be: string, array, or missing
    let needs = [];
    if (Array.isArray(needsRaw)) needs = needsRaw.filter(Boolean);
    else if (typeof needsRaw === "string" && needsRaw.trim()) needs = [needsRaw.trim()];

    out[emotion] = {
      needs,
      nvc_template:
        typeof entry?.nvc_template === "string" && entry.nvc_template.trim()
          ? entry.nvc_template
          : `When I observe ____, I feel ${emotion} because I need ____.`
    };
  }
  return out;
}

export async function loadNNMGrid() {
  const data = await loadJSON("/NNM.json");
  return Array.isArray(data) ? data : [];
}

export async function loadEmotionMeta() {
  const meta = await loadJSON("/emotion_meta.json");
  return normalizeMeta(meta);
}
  export async function loadEmotionMeta() {
  const meta = await loadJSON("/emotion_meta.json");

  // DEBUG: confirm what is actually loaded
  console.log("META pressured needs:", meta?.["pressured"]?.needs);

  return normalizeMeta(meta); // if you have normalizeMeta
}
