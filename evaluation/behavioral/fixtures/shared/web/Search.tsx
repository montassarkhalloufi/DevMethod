import { useState } from 'react';
import { searchEquipment } from './search-api';
export function Search() {
  const [results, setResults] = useState<string[]>([]);
  async function search(query: string) { setResults(await searchEquipment(query)); }
  return <section><input aria-label="Search equipment" onChange={event => search(event.target.value)} /><ul>{results.map(name => <li key={name}>{name}</li>)}</ul></section>;
}
