import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { atomicJSON, safeFile, mimeType, digest } from './files.mjs';
import { body, send, sameOrigin, errorResponse } from './http.mjs';
import { installComparisonGuard } from './public/comparison-guard.js';

const selectorScript = `<script>
(()=>{let selecting=false,previous=null;const studioOrigin=STUDIO_ORIGIN;
const locate=el=>{const parts=[];for(let node=el;node&&node.nodeType===1;node=node.parentElement){if(node.id){const id='#'+CSS.escape(node.id);if(document.querySelectorAll(id).length===1){parts.unshift(id);break;}}let part=node.tagName.toLowerCase();if(node.parentElement)part+=':nth-child('+(Array.from(node.parentElement.children).indexOf(node)+1)+')';parts.unshift(part);}return parts.join(' > ');};
const clear=()=>{if(previous){previous.style.outline=previous.dataset.dmOutline||'';delete previous.dataset.dmOutline;previous=null;}};
let focusObserver,focusDeadline,lastFocus;
const focusTarget=selector=>{if(typeof selector!=='string'||selector.length>2000||selector===lastFocus)return;lastFocus=selector;focusObserver?.disconnect();clearTimeout(focusDeadline);const find=()=>{let target;try{target=document.querySelector(selector);}catch{return true;}if(!target)return false;target.scrollIntoView({block:'center',behavior:'instant'});parent.postMessage({type:'devmethod-focus-result',selector,found:true},studioOrigin);return true;};if(find())return;focusObserver=new MutationObserver(()=>{if(find()){focusObserver.disconnect();clearTimeout(focusDeadline);}});focusObserver.observe(document.documentElement,{childList:true,subtree:true});focusDeadline=setTimeout(()=>{focusObserver.disconnect();parent.postMessage({type:'devmethod-focus-result',selector,found:false},studioOrigin);},5000);};
addEventListener('message',e=>{if(e.source===parent&&e.origin===studioOrigin&&e.data?.type==='devmethod-focus')focusTarget(e.data.selector);});
addEventListener('message',e=>{if(e.source===parent&&e.origin===studioOrigin&&e.data?.type==='devmethod-select'){selecting=!!e.data.enabled;if(!selecting)clear();}});
addEventListener('keydown',e=>{if(e.key==='Escape'){selecting=false;clear();}});
addEventListener('pointerover',e=>{if(!selecting)return;clear();previous=e.target;previous.dataset.dmOutline=previous.style.outline;previous.style.outline='2px solid #0866ff';},true);
const selectElement=e=>{if(!selecting)return;e.preventDefault();e.stopImmediatePropagation();const el=e.target;const selector=locate(el);parent.postMessage({type:'devmethod-element',selector,text:(el.innerText||el.getAttribute('aria-label')||'').slice(0,500)},studioOrigin);selecting=false;clear();};
addEventListener('click',selectElement,true);
addEventListener('pointerdown',e=>{if(e.target.closest?.('[disabled][data-devmethod-readonly-control]'))selectElement(e);},true);
})();</script>`;

function runtimeObserver(origin, buildId, prefix) {
  return `<script>(()=>{
const studioOrigin=${JSON.stringify(origin)},buildId=${JSON.stringify(buildId)},prefix=${JSON.stringify(prefix)};
const bounded=value=>{try{return String(value??'').slice(0,2000);}catch{return 'Erreur sans message lisible';}};
const report=(message,file,line)=>{let relative=bounded(file);try{relative=new URL(relative,location.href).pathname.replace('/'+prefix+'/'+buildId+'/','').replace(/^\\//,'');}catch{}parent.postMessage({type:'devmethod-runtime-error',message:bounded(message),file:relative||'index.html',line:Number.isSafeInteger(line)&&line>0?line:null,buildId},studioOrigin);};
addEventListener('error',event=>report(event.message||'Erreur de chargement ou d’exécution',event.filename||location.href,event.lineno));
addEventListener('unhandledrejection',event=>report(event.reason?.message??event.reason,location.href,null));
})();</script>`.replaceAll('\n', '');
}

function instrumentHTML(content, origin, id, reportRuntimeErrors, readOnlyData, prefix) {
  let html = content.toString('utf8');
  const selector = origin ? selectorScript.replace('STUDIO_ORIGIN', JSON.stringify(origin)) : '';
  if (reportRuntimeErrors || readOnlyData) {
    const offset = /^\uFEFF?\s*<!doctype[^>]*>/i.exec(html)?.[0].length ?? 0;
    const runtime = reportRuntimeErrors ? runtimeObserver(origin, id, prefix) : '';
    // Register the element inspector first so explicit targeting still wins over the guard.
    const comparison = readOnlyData
      ? selector + `<script>(${installComparisonGuard.toString()})();</script>`
      : '';
    html = html.slice(0, offset) + runtime + comparison + html.slice(offset);
  }
  return Buffer.from(html + (readOnlyData ? '' : selector));
}

async function dataRoute(request, response, origin, readData, dataFile, readOnlyData) {
  if (request.method === 'GET') return send(response, 200, readData());
  if (readOnlyData) {
    response.setHeader('Allow', 'GET');
    return send(response, 405, {
      error:
        'Les données de cet aperçu de comparaison sont en lecture seule. Revenez à l’application active pour les modifier.',
    });
  }
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

function previewUnavailable(revision) {
  if (revision.profile === 'react-ts' && !revision.compilation)
    return {
      status: 409,
      message: 'Candidat React non compilé. Consultez les diagnostics avant de le corriger.',
    };
  if (revision.profile === 'source-only')
    return {
      status: 501,
      message:
        'Sources importées disponibles dans Code. Aucun aperçu ni runtime compatible n’est configuré pour ce projet ; aucun script n’a été exécuté.',
    };
  return null;
}

export function createPreview({
  workspace,
  getState,
  getStudioOrigin = () => null,
  revisionPrefix = 'revisions',
  reportRuntimeErrors = false,
  readOnlyData = false,
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
        return await dataRoute(request, response, origin, readData, dataFile, readOnlyData);
      if (request.method !== 'GET') return send(response, 405, { error: 'Lecture uniquement.' });
      const state = getState();
      const match = new RegExp(`^/${revisionPrefix}/([a-zA-Z0-9-]+)/(.*)$`).exec(
        decodeURIComponent(url.pathname),
      );
      const id = match?.[1] ?? state.activeRevision;
      const revision = state.revisions.find((r) => r.id === id);
      if (!revision)
        return send(response, 404, 'Aucune version d’application disponible.', 'text/plain');
      const unavailable = previewUnavailable(revision);
      if (unavailable) return send(response, unavailable.status, unavailable.message, 'text/plain');
      const relative = match
        ? match[2] || 'index.html'
        : url.pathname === '/'
          ? 'index.html'
          : decodeURIComponent(url.pathname.slice(1));
      const expected = (revision.compilation?.files ?? revision.files).find(
        (f) => f.path === relative,
      );
      if (!expected) return send(response, 404, 'Fichier absent de cette version.', 'text/plain');
      const file = safeFile(
        workspace,
        'revisions/' + id + (revision.compilation ? '/compiled/' : '/app/') + relative,
      );
      let content = fs.readFileSync(file);
      if (digest(content) !== expected.sha256)
        throw new Error(
          'Ce fichier a été modifié hors de sa version. Préparez une nouvelle demande.',
        );
      if (path.extname(file) === '.html' && (getStudioOrigin() || readOnlyData))
        content = instrumentHTML(
          content,
          getStudioOrigin(),
          id,
          reportRuntimeErrors,
          readOnlyData,
          revisionPrefix,
        );
      response.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action " +
          (readOnlyData ? "'none'" : "'self'"),
      );
      send(response, 200, content, mimeType(file));
    } catch (error) {
      errorResponse(response, error);
    }
  });
  return server;
}
