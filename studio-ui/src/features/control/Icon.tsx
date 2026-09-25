const paths: Record<string, string> = {
  graph:
    'M12 4v6m-1 2-6 6m8-6 6 6M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4M4 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4M20 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
  risk: 'm12 3 10 18H2L12 3Zm0 5v6m0 3v1',
  person: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 22v-3a9 9 0 0 1 18 0v3Z',
  document: 'M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8m-8 4h8',
  settings: 'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 7 7',
  play: 'm8 4 13 8-13 8Z',
  shield: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6ZM7 12l4 4 6-8',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 8v7m0-11v1',
  check: 'm4 12 5 5L20 5',
  stop: 'M5 5h14v14H5Z',
  visual: 'M2 3h20v18H2Zm2 14 5-6 4 4 3-3 5 6M15 6h2v2h-2Z',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20',
  history: 'M3 11a9 9 0 1 1 3 8M3 5v6h6M12 7v6l4 2',
};
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <svg
      className={`cp-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.document} />
    </svg>
  );
}
