import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/** Fixed OS handler and argument boundaries: never a shell or a repository command. */
export function reviewOpenCommand(file: string, platform: string = process.platform): [string, string[]] {
  const url = pathToFileURL(file).href;
  if (platform === 'darwin') return ['/usr/bin/open', [url]];
  if (platform === 'win32') return ['rundll32.exe', ['url.dll,FileProtocolHandler', url]];
  if (platform === 'linux') return ['xdg-open', [url]];
  throw new Error(`Automatic review opening is unavailable on ${platform}; open the generated HTML in your browser.`);
}
export function openReview(file: string): void {
  const [command, args] = reviewOpenCommand(file);
  const result = spawnSync(command, args, { shell: false, stdio: 'ignore', timeout: 15000 });
  if (result.error || result.status !== 0) throw new Error(`The browser could not be opened. The generated report is preserved at ${file}; open it manually.`);
}
