function norm(s) {
  return String(s || "").trim().toLowerCase();
}

// outer group label like "Panicked / Flooded" → ["panicked","flooded"]
function splitOuterGroupLabel(label) {
  return String(label)
    .split("/")
    .map(x => norm(x));
}

export function buildIndexes(schema) {
  const discernment = schema?.trees?.discernment_wheel || [];
  const nextStepsTree = schema?.trees?.next_steps_wheel || [];

  // Map: (core -> list of expressions)
  const expressionsByCore = new Map();
  // Map: expression -> { core, branch, expression }
  const expressionMeta = new Map();

  for (const coreNode of discernment) {
    const core = coreNode.label;
    const exprList = [];
    for (const br of coreNode.branches || []) {
      for (const ex of br.expressions || []) {
        const word = ex.label;
        exprList.push({ core, branch: br.label, expression: word });
        expressionMeta.set(norm(word), { core, branch: br.label, expression: word });
      }
    }
    expressionsByCore.set(core, exprList);
  }

  // Build: (core -> outerGroupLabel -> steps[])
  const stepsByCoreOuterGroup = new Map();
  for (const coreNode of nextStepsTree) {
    const core = coreNode.label;
    const outerMap = new Map();
    for (const og of coreNode.outer_emotions || []) {
      outerMap.set(og.label, og.steps || []);
    }
    stepsByCoreOuterGroup.set(core, outerMap);
  }

  // Build: expression -> steps[] (best-match)
  const stepsByExpression = new Map();

  for (const [exprKey, meta] of expressionMeta.entries()) {
    const core = meta.core;
    const outerMap = stepsByCoreOuterGroup.get(core);

    if (!outerMap) continue;

    let matchedGroupLabel = null;

    // Find outer group where label contains the expression token
    for (const [groupLabel] of outerMap.entries()) {
      const tokens = splitOuterGroupLabel(groupLabel);
      if (tokens.includes(exprKey)) {
        matchedGroupLabel = groupLabel;
        break;
      }
    }

    if (!matchedGroupLabel) continue;

    const steps = outerMap.get(matchedGroupLabel) || [];
    stepsByExpression.set(exprKey, {
      ...meta,
      outerGroup: matchedGroupLabel,
      steps
    });
  }

  return {
    expressionsByCore,
    stepsByExpression
  };
}
