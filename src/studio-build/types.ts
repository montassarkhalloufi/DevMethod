export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  file: string;
  line?: number;
  message: string;
  direction: string;
}
export interface ManifestFile {
  path: string;
  bytes: number;
  sha256: string;
}
export interface InputFile {
  path: string;
  content: string;
}
export interface CompilerInput {
  sourceRoot: string;
  files: InputFile[];
}
export interface CompilerOutput {
  ok: boolean;
  diagnostics: Diagnostic[];
  outputs: InputFile[];
  versions: Record<string, string>;
}
export interface BuildOptions {
  sourceRoot: string;
  outputRoot: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}
export interface BuildResult {
  ok: boolean;
  protocol: 'react-strict-v1';
  diagnostics: Diagnostic[];
  files: ManifestFile[];
  sourceManifest: ManifestFile[];
  versions: Record<string, string>;
}
export const MAX_BYTES = 32 * 1024 * 1024;
export const ALLOWED_PACKAGES = [
  'react',
  'react-dom',
  'clsx',
  'tailwind-merge',
  'class-variance-authority',
  '@radix-ui/react-slot',
];

export function problem(message: string, file = 'build'): Diagnostic {
  return {
    severity: 'error',
    file,
    message: message.slice(0, 2000),
    direction: 'Corriger la source puis reconstruire.',
  };
}
