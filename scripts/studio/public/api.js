import { t } from './i18n.js';
export function createStudioApi(fetcher = fetch) {
  async function request(path, options = {}) {
    const response = await fetcher(path, { cache: 'no-store', ...options });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(
        t(
          'Le serveur a renvoyé une réponse illisible. Votre saisie est conservée.',
          'The server returned an unreadable response. Your input is preserved.',
        ),
      );
    }
    if (!response.ok) {
      const error = new Error(
        result.error ||
          t('Cette action n’a pas pu être enregistrée.', 'This action could not be saved.'),
      );
      error.status = response.status;
      throw error;
    }
    return result;
  }
  return {
    state: () => request('/api/state'),
    runtime: () => request('/api/runtime'),
    loadCandidateRequest: (revisionId, signal) =>
      request('/api/candidate-request?' + new URLSearchParams({ revision: revisionId }), {
        signal,
      }),
    requestCandidateChanges: (input) =>
      request('/api/candidate-request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    activationReview: (revisionId, signal) =>
      request('/api/activation-review?' + new URLSearchParams({ revision: revisionId }), {
        signal,
      }),
    interventionReview: (revisionId, signal) =>
      request('/api/intervention-review?' + new URLSearchParams({ revision: revisionId }), {
        signal,
      }),
    interventionDecision: (input) =>
      request('/api/intervention-review', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    runtimeObservation: (input) =>
      request('/api/runtime/observations', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    progress: (jobId, signal) =>
      request('/api/jobs/progress?' + new URLSearchParams({ jobId }), { signal }),
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
    return Promise.reject(
      new Error(
        t(
          'Choisissez une image PNG, JPEG, WebP ou un texte .txt/.md.',
          'Choose a PNG, JPEG or WebP image, or a .txt/.md text file.',
        ),
      ),
    );
  if (!file.size || file.size > 8 * 1024 * 1024)
    return Promise.reject(
      new Error(
        t(
          'La référence doit contenir entre 1 octet et 8 Mio.',
          'The reference must contain between 1 byte and 8 MiB.',
        ),
      ),
    );
  return new Promise((resolve, reject) => {
    const reader = new Reader();
    reader.onerror = () =>
      reject(new Error(t('Impossible de lire cette référence.', 'Unable to read this reference.')));
    reader.onload = () =>
      resolve({ name: file.name, mime, base64: String(reader.result).split(',')[1] });
    reader.readAsDataURL(file);
  });
}
