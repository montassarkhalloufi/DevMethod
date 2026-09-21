import { spawn } from 'node:child_process';
import { codexEnvironment } from '../hosts/codex.mjs';

function inspectCommand(args) {
  return new Promise((resolve) => {
    const child = spawn('codex', args, {
      env: codexEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '',
      settled = false;
    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, output });
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(null);
    }, 5000);
    const collect = (chunk) => {
      output = (output + chunk).slice(0, 8192);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', () => finish(null));
    child.on('close', finish);
  });
}

// Only classified facts leave this adapter. CLI output can contain credential fragments.
export async function probeCodex(inspect = inspectCommand) {
  const version = await inspect(['--version']);
  const match = /\bcodex-cli (\d+\.\d+\.\d+(?:[-+][\w.-]+)?)/.exec(version.output);
  const checkedAt = new Date().toISOString();
  if (version.code !== 0 || !match)
    return {
      available: false,
      connected: false,
      access: 'unknown',
      version: null,
      checkedAt,
      message: 'Codex CLI indisponible. Installez-le ou rendez-le accessible au processus Studio.',
    };
  const login = await inspect(['login', 'status']);
  const access = /logged in using chatgpt/i.test(login.output)
    ? 'chatgpt'
    : /logged in using (?:an? )?api key/i.test(login.output)
      ? 'api-key'
      : 'unknown';
  const connected = login.code === 0 && access !== 'unknown';
  return {
    available: true,
    connected,
    access: connected ? access : 'unknown',
    version: match[0],
    checkedAt,
    message: connected
      ? 'Accès Codex existant détecté. Les limites de cet accès restent applicables.'
      : 'Connexion Codex non établie. Connectez Codex dans votre terminal, puis vérifiez à nouveau.',
  };
}
