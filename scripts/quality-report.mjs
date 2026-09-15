import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';

// Diagnostic threshold zero lists every positive score. This is a review aid;
// the lint gate retains the project's reviewed threshold of fifteen.
const analyzer = new ESLint({
  overrideConfig: {
    rules: { 'sonarjs/cognitive-complexity': ['warn', 0] },
  },
});
const results = await analyzer.lintFiles([
  'src',
  'scripts',
  'tests',
  'examples/pocket-tasks',
  'examples/clair-from-zero',
  'examples/fullstack',
  '*.config.mjs',
]);
const functions = results.flatMap((result) =>
  result.messages
    .filter((message) => message.ruleId === 'sonarjs/cognitive-complexity')
    .map((message) => ({
      file: path.relative(process.cwd(), result.filePath).split(path.sep).join('/'),
      line: message.line,
      score: Number(message.message.match(/from (\d+) to/)?.[1]),
    })),
);
if (functions.some((item) => !Number.isSafeInteger(item.score))) {
  throw new Error('Analyzer diagnostic format changed; inspect score extraction.');
}
const versions = JSON.parse(fs.readFileSync('package.json', 'utf8')).devDependencies;
const report = {
  format: 1,
  scope:
    'Maintained CLI, review UI, tooling, tests and three maintained applications; other fixtures and generated code excluded.',
  analyzer: { eslint: versions.eslint, sonarjs: versions['eslint-plugin-sonarjs'] },
  files: results.length,
  threshold: 15,
  maximum: Math.max(0, ...functions.map((item) => item.score)),
  overThreshold: functions.filter((item) => item.score > 15).length,
  positiveScores: functions.sort(
    (left, right) =>
      right.score - left.score || left.file.localeCompare(right.file) || left.line - right.line,
  ),
  limitations:
    'Cognitive complexity is a static heuristic, not a correctness, readability or scalability proof. Functions scoring zero are omitted.',
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
