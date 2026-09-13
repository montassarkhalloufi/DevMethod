const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');
const moduleObject = { exports: {} };
const code = ts.transpileModule(readFileSync(resolve(__dirname, '../web/features/tasks/model/tasks.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('exports', 'module', code)(moduleObject.exports, moduleObject);
const { filterTasks, parseTasks } = moduleObject.exports;
test('filtering is normalized and does not mutate server data', () => {
  const tasks = Object.freeze([Object.freeze({ id: '1', title: 'Review ADR' }), Object.freeze({ id: '2', title: 'Ship fixture' })]);
  assert.deepEqual(filterTasks(tasks, '  REVIEW  '), [tasks[0]]);
  assert.deepEqual(filterTasks(tasks, 'missing'), []);
  assert.deepEqual(filterTasks(tasks, ''), tasks);
});
test('the server boundary rejects malformed data and strips unknown fields', () => {
  for (const value of [null, {}, [{ id: 12, title: 'wrong' }], new Array(101).fill({ id: '1', title: 'x' })]) {
    assert.throws(() => parseTasks(value), /Unexpected tasks response/);
  }
  assert.deepEqual(parseTasks([{ id: '1', title: 'Read ADR', secret: 'never serialize' }]), [{ id: '1', title: 'Read ADR' }]);
});
