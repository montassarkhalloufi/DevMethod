export const MAX_BYTES = 32 * 1024 * 1024;
export const ALLOWED_PACKAGES = [
    'react',
    'react-dom',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    '@radix-ui/react-slot',
];
export function problem(message, file = 'build') {
    return {
        severity: 'error',
        file,
        message: message.slice(0, 2000),
        direction: 'Corriger la source puis reconstruire.',
    };
}
