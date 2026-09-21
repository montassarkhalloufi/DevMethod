const paths: Record<string, string> = {
  file: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6',
  folder: 'M3 7h18v13H3zM3 7V4h6l2 3',
  code: 'm8 6-5 6 5 6m8-12 5 6-5 6m-3-15-2 18',
  graph: 'M12 8v6M5 14h14M5 14v3M19 14v3M9 3h6v5H9zM2 17h6v4H2zM16 17h6v4h-6z',
  focus: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  search: 'M15 15l6 6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  refresh: 'M20 7a9 9 0 1 0 1 8M20 3v5h-5',
  check: 'm5 12 4 4L19 6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m7 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
};
export function ProjectIcon({ name = 'file' }: { name?: string }) {
  return (
    <svg
      className="project-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.file} />
    </svg>
  );
}
