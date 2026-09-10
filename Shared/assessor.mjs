export function validateRubric(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) throw Error('Invalid rubric.');
  if (typeof r.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(r.id)) throw Error('Invalid rubric ID.');
  if (typeof r.title !== 'string' || !r.title.trim() || r.title.length > 120) throw Error('Invalid rubric title.');
  if (!Array.isArray(r.criteria) || r.criteria.length === 0 || r.criteria.length > 32) throw Error('Invalid rubric criteria count.');
  if (typeof r.passThreshold !== 'number' || r.passThreshold < 0 || r.passThreshold > 100) throw Error('Invalid pass threshold.');

  const ids = new Set();
  for (const c of r.criteria) {
    if (!c || typeof c !== 'object') throw Error('Invalid criterion.');
    if (typeof c.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(c.id) || ids.has(c.id)) throw Error('Invalid criterion ID.');
    ids.add(c.id);
    if (typeof c.label !== 'string' || !c.label.trim() || c.label.length > 120) throw Error('Invalid criterion label.');
    if (typeof c.weight !== 'number' || c.weight <= 0 || c.weight > 1000) throw Error('Invalid criterion weight.');
    if (c.requiredActivities !== undefined && (!Array.isArray(c.requiredActivities) || c.requiredActivities.some(id => typeof id !== 'string'))) throw Error('Invalid required activities.');
    if (c.requiredHotspots !== undefined && (!Array.isArray(c.requiredHotspots) || c.requiredHotspots.some(id => typeof id !== 'string'))) throw Error('Invalid required hotspots.');
    if (c.minEvidenceCount !== undefined && (!Number.isInteger(c.minEvidenceCount) || c.minEvidenceCount < 0)) throw Error('Invalid min evidence count.');
    if (c.maxHints !== undefined && (!Number.isInteger(c.maxHints) || c.maxHints < 0)) throw Error('Invalid max hints.');
  }
  return r;
}

export function evaluateAttempt(rubric, eventLog) {
  validateRubric(rubric);
  if (!Array.isArray(eventLog)) throw Error('Event log must be an array.');

  const respondedActivities = new Set();
  const selectedHotspots = new Set();
  let evidenceCount = 0;
  const hintsUsedByActivity = new Map();
  let scenarioCompleted = false;

  for (const ev of eventLog) {
    if (!ev || typeof ev !== 'object') continue;
    if (ev.type === 'activity.responded' && ev.activityId) respondedActivities.add(ev.activityId);
    if (ev.type === 'hotspot.selected' && ev.hotspotId) selectedHotspots.add(ev.hotspotId);
    if (ev.type === 'evidence.requested') evidenceCount++;
    if (ev.type === 'hint.used' && ev.activityId) {
      hintsUsedByActivity.set(ev.activityId, (hintsUsedByActivity.get(ev.activityId) || 0) + 1);
    }
    if (ev.type === 'scenario.completed') scenarioCompleted = true;
  }

  let totalScore = 0;
  let maxScore = 0;
  const criteriaResults = [];

  for (const c of rubric.criteria) {
    maxScore += c.weight;
    const reqActs = c.requiredActivities || [];
    const missingActs = reqActs.filter(id => !respondedActivities.has(id));
    const reqSpots = c.requiredHotspots || [];
    const missingSpots = reqSpots.filter(id => !selectedHotspots.has(id));
    const minEv = c.minEvidenceCount || 0;
    const maxH = c.maxHints !== undefined ? c.maxHints : Infinity;

    let totalHints = 0;
    for (const actId of reqActs) totalHints += hintsUsedByActivity.get(actId) || 0;

    const met = missingActs.length === 0 &&
                missingSpots.length === 0 &&
                evidenceCount >= minEv &&
                totalHints <= maxH;

    const score = met ? c.weight : 0;
    totalScore += score;

    criteriaResults.push({
      criterionId: c.id,
      label: c.label,
      met,
      score,
      maxScore: c.weight,
      missingActivities: missingActs,
      missingHotspots: missingSpots,
      evidenceCount,
      hintsUsed: totalHints
    });
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passed = percentage >= rubric.passThreshold && scenarioCompleted;

  return {
    rubricId: rubric.id,
    rubricTitle: rubric.title,
    score: totalScore,
    maxScore,
    percentage,
    passed,
    scenarioCompleted,
    criteriaResults,
    evaluatedAt: new Date().toISOString()
  };
}
