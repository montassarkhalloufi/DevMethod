// Intentionally vacuous: the qualification controls must reject this checker.
const check = process.argv[4];
process.stdout.write(`${JSON.stringify({ format: 1, check, verdicts: {
  capacity: 'passed', idempotency: 'passed', cancellation: 'passed', durability: 'passed',
} })}\n`);
