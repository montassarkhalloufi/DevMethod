export function createStudioApi(fetcher = fetch) {
  async function request(path, options = {}) {
    const response = await fetcher(path, { cache: 'no-store', ...options });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('Le serveur a renvoyé une réponse illisible. Votre saisie est conservée.');
    }
    if (!response.ok) {
      const error = new Error(result.error || 'Cette action n’a pas pu être enregistrée.');
      error.status = response.status;
      throw error;
    }
    return result;
  }
  return {
    state: () => request('/api/state'),
    runtime: () => request('/api/runtime'),
    source: ({ revisionId, path, signal, scope }) =>
      request(
        '/api/source?' +
          new URLSearchParams({ revision: revisionId, path, ...(scope ? { scope } : {}) }),
        { signal },
      ),
    change: (route, version, input) =>
      request('/api/' + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, ...input }),
      }),
  };
}

export function readReference(file, Reader = FileReader) {
  const markdown = file.name.toLowerCase().endsWith('.md');
  const mime = markdown ? 'text/markdown' : file.type;
  if (!['image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/markdown'].includes(mime))
    return Promise.reject(new Error('Choisissez une image PNG, JPEG, WebP ou un texte .txt/.md.'));
  if (!file.size || file.size > 8 * 1024 * 1024)
    return Promise.reject(new Error('La référence doit contenir entre 1 octet et 8 Mio.'));
  return new Promise((resolve, reject) => {
    const reader = new Reader();
    reader.onerror = () => reject(new Error('Impossible de lire cette référence.'));
    reader.onload = () =>
      resolve({ name: file.name, mime, base64: String(reader.result).split(',')[1] });
    reader.readAsDataURL(file);
  });
}
