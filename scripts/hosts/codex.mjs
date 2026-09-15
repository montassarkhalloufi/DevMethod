/** Codex CLI 0.147.0 adapter. Optional tooling, never part of offline init. */
export const codexVersion = 'codex-cli 0.147.0';
export function codexArguments({ directory, model }) {
  if (model !== 'gpt-5.6-sol') throw new Error('This pilot pins gpt-5.6-sol.');
  return [
    'exec',
    '--ignore-user-config',
    '--ephemeral',
    '--json',
    '--color',
    'never',
    '--disable',
    'apps',
    '--disable',
    'plugins',
    '--disable',
    'remote_plugin',
    '--sandbox',
    'workspace-write',
    '-C',
    directory,
    '--model',
    model,
    '-c',
    'model_reasoning_effort="low"',
    '-c',
    'approval_policy="never"',
    '-c',
    'web_search="disabled"',
    '-c',
    'sandbox_workspace_write.network_access=false',
    '-c',
    'sandbox_workspace_write.exclude_tmpdir_env_var=true',
    '-c',
    'sandbox_workspace_write.exclude_slash_tmp=true',
    '-c',
    'features.multi_agent=false',
    '-c',
    'shell_environment_policy.inherit="core"',
    '-c',
    'shell_environment_policy.ignore_default_excludes=false',
    '-',
  ];
}
export function codexUsage(lines) {
  const turns = lines.filter((e) => e.type === 'turn.completed');
  if (!turns.length) return null;
  const fields = ['input_tokens', 'output_tokens'];
  if (turns.some((t) => fields.some((k) => !Number.isSafeInteger(t.usage?.[k]) || t.usage[k] < 0)))
    return null;
  return {
    inputTokens: turns.reduce((n, t) => n + t.usage.input_tokens, 0),
    outputTokens: turns.reduce((n, t) => n + t.usage.output_tokens, 0),
    cachedInputTokens: turns.every((t) => Number.isSafeInteger(t.usage.cached_input_tokens))
      ? turns.reduce((n, t) => n + t.usage.cached_input_tokens, 0)
      : null,
    costUSD: null,
  };
}

export function codexEnvironment(source = process.env) {
  const allowed = [
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'TMPDIR',
    'TEMP',
    'TMP',
    'SystemRoot',
    'SYSTEMROOT',
    'WINDIR',
    'COMSPEC',
    'PATHEXT',
    'LANG',
    'LC_ALL',
    'CODEX_HOME',
  ];
  return Object.fromEntries(
    allowed.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]),
  );
}
