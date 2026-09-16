import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { atomicJSON, safeFile, mimeType, digest } from './files.mjs';
import { body, send, sameOrigin, errorResponse } from './http.mjs';

const selectorScript = `<script>
(()=>{let selecting=false,previous=null;const studioOrigin=STUDIO_ORIGIN;
const locate=el=>{const parts=[];for(let node=el;node&&node.nodeType===1;node=node.parentElement){if(node.id){const id='#'+CSS.escape(node.id);if(document.querySelectorAll(id).length===1){parts.unshift(id);break;}}let part=node.tagName.toLowerCase();if(node.parentElement)part+=':nth-child('+(Array.from(node.parentElement.children).indexOf(node)+1)+')';parts.unshift(part);}return parts.join(' > ');};
const clear=()=>{if(previous){previous.style.outline=previous.dataset.dmOutline||'';delete previous.dataset.dmOutline;previous=null;}};
addEventListener('message',e=>{if(e.source===parent&&e.origin===studioOrigin&&e.data?.type==='devmethod-select'){selecting=!!e.data.enabled;if(!selecting)clear();}});
addEventListener('keydown',e=>{if(e.key==='Escape'){selecting=false;clear();}});
addEventListener('pointerover',e=>{if(!selecting)return;clear();previous=e.target;previous.dataset.dmOutline=previous.style.outline;previous.style.outline='2px solid #0866ff';},true);
addEventListener('click',e=>{if(!selecting)return;e.preventDefault();e.stopImmediatePropagation();const el=e.target;const selector=locate(el);parent.postMessage({type:'devmethod-element',selector,text:(el.innerText||el.getAttribute('aria-label')||'').slice(0,500)},studioOrigin);selecting=false;clear();},true);
})();</script>`;

function runtimeObserver(origin, buildId) {
  return `<script>(()=>{
const studioOrigin=${JSON.stringify(origin)},buildId=${JSON.stringify(buildId)};
const bounded=value=>{try{return String(value??'').slice(0,2000);}catch{return 'Erreur sans message lisible';}};
const report=(message,file,line)=>{let relative=bounded(file);try{relative=new URL(relative,location.href).pathname.replace('/builds/'+buildId+'/','').replace(/^\\//,'');}catch{}parent.postMessage({type:'devmethod-runtime-error',message:bounded(message),file:relative||'index.html',line:Number.isSafeInteger(line)?line:null,buildId},studioOrigin);};
addEventListener('error',event=>report(event.message||'Erreur de chargement ou d’exécution',event.filename||location.href,event.lineno));
addEventListener('unhandledrejection',event=>report(event.reason?.message??event.reason,location.href,null));
})();</script>`.replaceAll('\n', '');
}

function instrumentHTML(content, origin, id, reportRuntimeErrors) {
  let html = content.toString('utf8');
  if (reportRuntimeErrors) {
    const offset = /^\uFEFF?\s*<!doctype[^>]*>/i.exec(html)?.[0].length ?? 0;
    html = html.slice(0, offset) + runtimeObserver(origin, id) + html.slice(offset);
  }
  return Buffer.from(html + selectorScript.replace('STUDIO_ORIGIN', JSON.stringify(origin)));
}

async function dataRoute(request, response, origin, readData, dataFile) {
  if (request.method === 'GET') return send(response, 200, readData());
  if (request.method !== 'POST') return send(response, 405, { error: 'Méthode non autorisée.' });
  sameOrigin(request, origin);
  const input = await body(request, 1024 * 1024),
    current = readData();
  if (input.version !== current.version)
    return send(response, 409, {
      error: 'Des données ont changé. Rechargez avant de réessayer ; votre saisie est à conserver.',
      version: current.version,
    });
  if (!input.data || typeof input.data !== 'object' || Array.isArray(input.data))
    throw new Error('Les données doivent être un objet.');
  const next = { version: current.version + 1, data: input.data };
  atomicJSON(dataFile, next);
  return send(response, 200, next);
}

export function createPreview({
  workspace,
  getState,
  getStudioOrigin = () => null,
  revisionPrefix = 'revisions',
  reportRuntimeErrors = false,
}) {
  const dataFile = safeFile(workspace, '.devmethod/data.json');
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  if (!fs.existsSync(dataFile)) atomicJSON(dataFile, { version: 1, data: {} });
  const readData = () => {
    safeFile(workspace, '.devmethod/data.json');
    const value = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    if (
      !Number.isSafeInteger(value.version) ||
      value.version < 1 ||
      !value.data ||
      typeof value.data !== 'object' ||
      Array.isArray(value.data)
    )
      throw new Error('Données locales invalides ; aucune remise à zéro effectuée.');
    return value;
  };
  readData();
  const server = http.createServer(async (request, response) => {
    try {
      const origin = 'http://127.0.0.1:' + server.address().port;
      if (request.headers.host !== new URL(origin).host)
        return send(response, 403, { error: 'Hôte non autorisé.' });
      const url = new URL(request.url, origin);
      if (url.pathname === '/api/data')
        return await dataRoute(request, response, origin, readData, dataFile);
      if (request.method !== 'GET') return send(response, 405, { error: 'Lecture uniquement.' });
      const state = getState();
      const match = new RegExp(`^/${revisionPrefix}/([a-zA-Z0-9-]+)/(.*)$`).exec(
        decodeURIComponent(url.pathname),
      );
      const id = match?.[1] ?? state.activeRevision;
      const revision = state.revisions.find((r) => r.id === id);
      if (!revision)
        return send(response, 404, 'Aucune version d’application disponible.', 'text/plain');
      const relative = match
        ? match[2] || 'index.html'
        : url.pathname === '/'
          ? 'index.html'
          : url.pathname.slice(1);
      const expected = revision.files.find((f) => f.path === relative);
      if (!expected) return send(response, 404, 'Fichier absent de cette version.', 'text/plain');
      const file = safeFile(workspace, 'revisions/' + id + '/app/' + relative);
      let content = fs.readFileSync(file);
      if (digest(content) !== expected.sha256)
        throw new Error(
          'Ce fichier a été modifié hors de sa version. Préparez une nouvelle demande.',
        );
      if (path.extname(file) === '.html' && getStudioOrigin())
        content = instrumentHTML(content, getStudioOrigin(), id, reportRuntimeErrors);
      response.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'",
      );
      send(response, 200, content, mimeType(file));
    } catch (error) {
      errorResponse(response, error);
    }
  });
  return server;
}
