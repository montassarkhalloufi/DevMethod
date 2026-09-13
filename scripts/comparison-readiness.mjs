import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Admission requirements for an unattended BMAD/DevMethod comparison.
 * Evidence is operator supplied; this check does not certify a host.
 */
export function comparisonReadiness(evidence) {
  const required = [
    'bmadInitializationPassed', 'taskLocalTemporaryDirectory',
    'methodArtifactsAllowed', 'gitMetadataWritable',
    'synchronousSubagentsAvailable', 'descendantUsageMeasured',
    'descendantCancellationVerified', 'equalHostPermissions',
    'frozenMethodRevisions', 'independentAcceptanceChecks',
  ];
  const missing = required.filter(key => evidence[key] !== true);
  return { ready: missing.length === 0, missing,
    limitation: 'Requires reviewed native evidence. A true label alone proves no capability.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node scripts/comparison-readiness.mjs EVIDENCE_JSON');
  const result = comparisonReadiness(JSON.parse(fs.readFileSync(file, 'utf8')));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) process.exitCode = 2;
}
