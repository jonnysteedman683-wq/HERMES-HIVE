// FPS probe: count rAF frames over 3s in headless Edge
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9335;
const URL = 'file:///C:/Users/jonny/HERMES-HIVE/homepage/variant-B/index.html';
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'hive-fps-'));
const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + PROFILE, '--no-first-run', '--no-default-browser-check', '--window-size=1440,900', 'about:blank'],
  { stdio: 'ignore' });

async function getJson(p) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch('http://127.0.0.1:' + PORT + p); if (r.ok) return await r.json(); } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('CDP not ready');
}

(async () => {
  const list = await getJson('/json/list');
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result); pending.delete(m.id); } };
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: URL });
  await new Promise(r => setTimeout(r, 2500)); // warmup
  const res = await send('Runtime.evaluate', {
    expression: `new Promise(res => {
      let n = 0, t0 = performance.now();
      (function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / 3); })();
    })`,
    awaitPromise: true, returnByValue: true
  });
  console.log('FPS ' + res.result.value.toFixed(1));
  ws.close(); proc.kill();
  setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error('FAIL ' + e.message); process.exit(1); });
