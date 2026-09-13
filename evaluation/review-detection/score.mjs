/** Score separately adjudicated findings, never infer a match from keywords or JSON validity. */
export function scoreDetection(expectedIds, findings, adjudications) {
  const expected = new Set(expectedIds);
  const ids = new Set(findings.map(f => f.id));
  if (expected.size !== expectedIds.length || ids.size !== findings.length) throw new Error('Duplicate IDs');
  const judged = new Set(), detected = new Set(), falsePositives = [], unresolved = [];
  for (const item of adjudications) {
    if (!ids.has(item.findingId) || judged.has(item.findingId)) throw new Error('Unknown or duplicate finding adjudication');
    judged.add(item.findingId);
    if (item.verdict === 'matched') {
      if (!Array.isArray(item.defectIds) || !item.defectIds.length || item.defectIds.some(id => !expected.has(id))) throw new Error('Unknown or empty defect match');
      const finding = findings.find(f => f.id === item.findingId);
      if (finding.confidence !== 'confirmed') throw new Error('An unconfirmed risk is not a confirmed detection');
      if (!item.evidenceReviewed || !item.impactJustified) throw new Error('Match requires reviewed evidence and justified impact');
      item.defectIds.forEach(id => detected.add(id));
    } else if (item.verdict === 'false-positive') falsePositives.push(item.findingId);
    else if (item.verdict === 'unresolved') unresolved.push(item.findingId);
    else throw new Error('Unknown adjudication verdict');
  }
  return {
    expected: expected.size, detected: [...detected], missed: expectedIds.filter(id => !detected.has(id)),
    falsePositives, unresolved, unadjudicated: findings.filter(f => !judged.has(f.id)).map(f => f.id),
    recall: expected.size ? detected.size / expected.size : null,
    limitation: 'Separate evidence-based adjudication required; fixture/score tests alone do not measure model detection.',
  };
}
