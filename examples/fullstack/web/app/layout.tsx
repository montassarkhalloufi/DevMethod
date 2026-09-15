import type { ReactNode } from 'react';
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '3rem auto', padding: '1rem' }}
      >
        {children}
      </body>
    </html>
  );
}
