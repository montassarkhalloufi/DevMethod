export function HomeIcon({ kind }: { kind: 'new' | 'imported' | 'existing' | 'folder' }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d={
          {
            new: 'M12 5v14M5 12h14',
            imported: 'M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6',
            existing: 'M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2',
            folder: 'M3 7h18v13H3zM3 7V4h6l2 3',
          }[kind]
        }
      />
    </svg>
  );
}
