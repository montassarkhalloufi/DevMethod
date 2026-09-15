export function createFakeProvider() {
  const completions = new Map();
  return { completions,
    async generate(id, mode = 'ok') {
      const result = {summary:'A fictional projector is available.', sources:['catalog:projector']};
      completions.set(id, result);
      if (mode === 'malformed') return '{broken';
      if (mode === 'timeout-after-completion') throw new Error('TIMEOUT');
      return JSON.stringify(result);
    },
  };
}
