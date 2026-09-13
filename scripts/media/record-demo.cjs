// Requires Playwright and Chrome; both demo servers must be running on loopback.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const output = process.env.DEMO_OUTPUT || '/private/tmp/devmethod-video';
const scenes = JSON.parse(fs.readFileSync('docs/media/from-zero/scenes.json','utf8'));
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
function card(s,i){
 const visual=i===3?`<img class="visual" src="data:image/png;base64,${fs.readFileSync('examples/visual-pilot/directions-v1.png').toString('base64')}" alt="Trois directions du pilote Lisière">`:'';
 return `<!doctype html><html lang="fr"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#142c29;color:#fbf5e8;font-family:Arial,sans-serif;width:1280px;height:720px;overflow:hidden}.frame{padding:65px 76px;height:100%;position:relative}.brand{font-size:23px;letter-spacing:2px}.eyebrow{color:#f4b793;letter-spacing:3px;font-size:15px;margin:70px 0 25px}h1{font:normal 74px/1.05 Georgia,serif;letter-spacing:-2px;max-width:920px;margin:0 0 25px}p{font-size:25px;line-height:1.5;white-space:pre-line;max-width:920px;color:#dce5da;margin:0}.line{height:2px;background:#c4633b;width:90px;margin-bottom:26px}.foot{position:absolute;bottom:32px;left:76px;right:76px;display:flex;justify-content:space-between;color:#b5c6bd;font-size:15px}.visual{position:absolute;right:45px;top:150px;width:700px;border-radius:6px}.with-visual h1{font-size:49px;max-width:390px}.with-visual p{font-size:21px;max-width:360px}.with-visual .eyebrow{margin-top:62px}.num{position:absolute;right:72px;top:55px;font:italic 46px Georgia;color:#54736c}</style><div class="frame ${visual?'with-visual':''}"><div class="brand">DevMethod<span class="num">0${i+1}</span></div><div class="eyebrow">${esc(s.eyebrow)}</div><div class="line"></div><h1>${esc(s.title)}</h1><p>${esc(s.text)}</p>${visual}<div class="foot"><span>Du besoin aux preuves.</span><span>Essais réels encadrés · Septembre 2026</span></div></div></html>`;
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 for(let i=0;i<scenes.length;i++){
  const s=scenes[i];const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:output,size:{width:1280,height:720}}});const page=await context.newPage();
  if(s.kind==='app'){
   await page.goto('http://127.0.0.1:8766');
   // Action sequence lives separately, grounded in the finished app's controls.
   const actions=require(path.join(root,'scripts/media/demo-actions.cjs'));
   await actions.prepare(page);
   await page.screenshot({path:path.join(output,`scene-${i}.png`)});
   const start=Date.now();await actions.perform(page);await sleep(Math.max(0,s.duration*1000-(Date.now()-start)));
  }else{await page.setContent(card(s,i));await page.screenshot({path:path.join(output,`scene-${i}.png`)});await sleep(s.duration*1000);}
  const video=page.video();await context.close();fs.copyFileSync(await video.path(),path.join(output,`scene-${i}.webm`));console.log(`Scene ${i+1}/${scenes.length} recorded`);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
