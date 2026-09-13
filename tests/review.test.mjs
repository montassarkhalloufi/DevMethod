import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateReview, sanitizedReview, summarizeReview, filterFindings, reviewFreshness, reviewMarkdown, reviewUrl } from '../dist/review-model.js';
const fixture = () => JSON.parse(fs.readFileSync(new URL('../examples/review/review.json', import.meta.url)));

test('review format 1 preserves evidence and rejects missing, foreign, duplicate or dangling fields', () => {
 const r = fixture(); assert.deepEqual(validateReview(r), r);
 for (const mutate of [r => r.format = 2, r => delete r.scope, r => r.extra = true, r => r.findings[0].confidence = 'high', r => r.findings[0].evidenceIds = ['missing'], r => r.sources[0].access = 'consulted', r => r.checks[2].reason = null, r => r.checks.push(r.checks[0]), r => r.findings[0].resolution = 'resolved', r => r.findings[0].location.line = -1]) {
  const invalid = fixture(); mutate(invalid); assert.throws(() => validateReview(invalid));
 }
 const copy = validateReview(r); copy.findings[0].title = 'Changed'; assert.notEqual(copy.findings[0].title, r.findings[0].title);
});
test('counts distinguish finding severity, confidence and checks; readiness is bounded by explicit policy', () => {
 const r = fixture(); let s = summarizeReview(r);
 assert.equal(s.severities.moderate, 1); assert.equal(s.severities.minor, 1); assert.equal(s.suspected, 1); assert.equal(s.checks.failed, 1); assert.equal(s.conclusion, 'corrections');
 r.findings = []; r.checks[0].status = 'passed'; assert.equal(summarizeReview(r).conclusion, 'incomplete');
 r.checks[2].status = 'blocked'; assert.equal(summarizeReview(r).conclusion, 'blocked');
 r.checks[2].status = 'out-of-scope'; assert.equal(summarizeReview(r).conclusion, 'ready');
 r.checks = []; assert.equal(summarizeReview(r).conclusion, 'incomplete');
});
test('filters compose without changing full-review counts or resolution', () => {
 const r=fixture(), all={query:'',domain:'',severity:'',confidence:'',resolution:''};
 assert.equal(filterFindings(r,all).length,2);
 assert.deepEqual(filterFindings(r,{...all,query:'silencieux',domain:'Accessibilité',severity:'moderate',confidence:'confirmed',resolution:'open'}).map(f=>f.id),['R-01']);
 assert.equal(filterFindings(r,{...all,query:'absent'}).length,0);
 assert.equal(summarizeReview(r).severities.moderate,1); assert.equal(r.findings[0].resolution,'open');
});
test('revision drift signals reassessment while preserving independent historical checks', () => {
 const r=fixture(); const before=JSON.stringify(r);
 assert.equal(reviewFreshness(r,null,[]).state,'unknown');
 assert.equal(reviewFreshness(r,r.revision.commit,[]).state,'same');
 assert.deepEqual(reviewFreshness(r,'new-revision',['save-status']),{state:'different',affectedChecks:['C-01'],affectedFindings:['R-01']});
 assert.equal(JSON.stringify(r),before);
});
test('untrusted destinations and raw credentials are not distributed; Markdown is escaped', () => {
 for(const url of ['javascript:alert(1)','data:text/html,x','file:///etc/passwd','https://user:pass@example.org','//example.org','https://example.org/\\evil']) assert.equal(reviewUrl(url),false);
 const r=fixture(); r.findings[0].title='<script>alert(1)</script>'; r.evidence[0].content='token=private-test-value\nreader@example.invalid';
 const safe=sanitizedReview(r); assert.doesNotMatch(safe.evidence[0].content,/private-test-value|reader@/);
 assert.match(r.evidence[0].content,/private-test-value/);
 assert.match(reviewMarkdown(safe),/\\<script\\>/);
 r.evidence[0].image={mime:'image/svg+xml',base64:'evil',alt:'x',origin:'captured',privacyReviewed:true}; assert.throws(()=>validateReview(r));
});
test('report derives controls, finding resolution, references, evidence and limits from the same record', () => {
 const r=fixture();const report=reviewMarkdown(r);
 for(const value of ['R-01','R-02','C-01','C-02','C-03','E-01','WAI','Non exécuté','À vérifier','demo-revision-1']) assert.ok(report.includes(value),value);
 assert.equal((report.match(/### R-01/g)||[]).length,1);
});

test('browser HTML contains only inert escaped data and a CSP-pinned local program', async () => {
 const {renderReviewHTML}=await import('../dist/review.js');const r=fixture(); r.title='</script><script>alert(9)</script>';r.evidence[0].content='password=PRIVATE_VALUE';
 const html=renderReviewHTML({review:r});
 assert.ok(!html.includes(r.title)); assert.ok(html.includes('\\u003c/script\\u003e'));
 assert.doesNotMatch(html,/PRIVATE_VALUE/); assert.match(html,/connect-src 'none'/);assert.match(html,/script-src 'sha256-/);assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=/);
 assert.equal((html.match(/<script[ >]/g)||[]).length,2);
 const legacy=renderReviewHTML({legacy:'# Old\n<script>evil</script>'});assert.ok(!legacy.includes('<script>evil'));
 assert.ok(renderReviewHTML({}).includes('"review":null'));
});

test('CLI derives reports and preserves outputs, legacy text and source bytes without executing content', async t => {
 const os=await import('node:os'), path=await import('node:path'), {spawnSync}=await import('node:child_process');
 const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'devmethod-review-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const run=(args)=>spawnSync(process.execPath,[path.resolve('dist/cli.js'),'review','--dest',root,...args],{encoding:'utf8'});
 fs.writeFileSync(path.join(root,'review.json'),JSON.stringify(fixture())); const source=fs.readFileSync(path.join(root,'review.json'));
 const out=run(['--review','review.json','--output','report/review.html','--markdown','report/REVIEW.md','--json']); assert.equal(out.status,0,out.stderr);assert.equal(JSON.parse(out.stdout).status,'corrections');
 assert.match(fs.readFileSync(path.join(root,'report/review.html'),'utf8'),/DevMethod · Review/);assert.match(fs.readFileSync(path.join(root,'report/REVIEW.md'),'utf8'),/R-01/);
 const collision=run(['--review','review.json','--output','new.html','--markdown','report/REVIEW.md']);assert.equal(collision.status,2);assert.ok(!fs.existsSync(path.join(root,'new.html')));assert.deepEqual(fs.readFileSync(path.join(root,'review.json')),source);
 fs.writeFileSync(path.join(root,'legacy.md'),'# Legacy\n<script>no execution</script>');assert.equal(run(['--legacy','legacy.md','--output','legacy.html']).status,0);assert.equal(run(['--legacy','legacy.md','--json']).status,0);
 for(const args of [['--review','../outside.json'],['--output','../outside.html'],['--demo','--review','review.json'],['--review','review.json','--tool','codex'],['--markdown','empty.md']])assert.equal(run(args).status,2);
 fs.writeFileSync(path.join(root,'invalid.json'),'PRIVATE_SENTINEL');const bad=run(['--review','invalid.json']);assert.equal(bad.status,2);assert.doesNotMatch(bad.stderr,/PRIVATE_SENTINEL/);
 fs.symlinkSync(path.join(root,'review.json'),path.join(root,'link.json'));assert.equal(run(['--review','link.json']).status,2);
 assert.equal(run(['--output','empty.html']).status,0);assert.equal(run(['--demo','--output','demo.html']).status,0);
});

test('report links reject Markdown/HTML delimiters; declared raster evidence remains supported', () => {
 for(const url of ['https://example.org/<script>','https://example.org/`code`','https://example.org/[image]']) assert.equal(reviewUrl(url),false);
 const r=fixture();r.evidence[0].image={mime:'image/jpeg',base64:'/9j/AA==',alt:'Raster fixture, not a claimed execution capture',origin:'explanatory',privacyReviewed:true};assert.equal(validateReview(r).evidence[0].image.mime,'image/jpeg');
 r.evidence[0].image.privacyReviewed=false;assert.throws(()=>validateReview(r));
});

test('checked-in review report is derived exactly from its structured owner', () => {
 const record=JSON.parse(fs.readFileSync(new URL('../docs/missions/workflow-0.3-reviews/interface/review.json',import.meta.url)));
 const report=fs.readFileSync(new URL('../docs/missions/workflow-0.3-reviews/interface/REVIEW.md',import.meta.url),'utf8');
 assert.equal(report,reviewMarkdown(sanitizedReview(record)));
});
