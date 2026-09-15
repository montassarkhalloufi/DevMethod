export async function searchEquipment(query: string, signal?: AbortSignal): Promise<string[]> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, query.length === 1 ? 90 : 10);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); }, {once:true});
  });
  return ['Projector', 'Lamp'].filter(name => name.toLowerCase().includes(query.toLowerCase()));
}
