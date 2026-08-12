// Headless Edge + CDP verification: two viewports, console/exception capture, collision probe, screenshots
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9334;
const URL = 'file:///C:/Users/jonny/HERMES-HIVE/homepage/variant-B/index.html';
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'hive-ver2-'));
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

const proc = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

async function getJson(p) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + p);
      if (r.ok) return await r.json();
    } catch (e) { /* retry */ }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('CDP endpoint not ready');
}

const COLLIDE = `(()=>{
  const rectOf = s => { const el = document.querySelector(s); const r = el.getBoundingClientRect(); return {l:r.left,t:r.top,r:r.right,b:r.bottom}; };
  const hits = [];
  const check = (label, rect, pos, pad) => {
    const cx = pos.x, cy = pos.y, rr = pad || 30;
    const nx = Math.max(rect.l, Math.min(cx, rect.r));
    const ny = Math.max(rect.t, Math.min(cy, rect.b));
    const d = Math.hypot(cx - nx, cy - ny);
    if (d < rr) hits.push(label + '@' + Math.round(d) + 'px');
  };
  const pos = window.__hivePos || [];
  if (pos.length) {
    const ui = ['h1', '.tagline', '.status', '.cta'];
    for (let i = 0; i < pos.length; i++) {
      for (const s of ui) check('node' + i + 'vs' + s, rectOf(s), pos[i], 26);
    }
  }
  return JSON.stringify({hits: hits});
})()`;

(async () => {
  const list = await getJson('/json/list');
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result); pending.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') {
      const ed = m.params.exceptionDetails;
      events.push('EXCEPTION: ' + ((ed.exception && ed.exception.description) || ed.text));
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      events.push('LOG: ' + m.params.entry.text);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      events.push('CONSOLE: ' + m.params.args.map(a => a.value || a.description).join(' '));
    }
  };
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');

  for (const vp of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width, height: vp.height,
      deviceScaleFactor: vp.width === 390 ? 3 : 1,
      mobile: vp.width === 390
    });
    await send('Page.navigate', { url: URL });
    await new Promise(r => setTimeout(r, 5200));

    const state = await send('Runtime.evaluate', {
      expression: `(()=>{const c=document.getElementById('hive');const g=c&&c.getContext('2d');let px=null;
        if(g){const d=g.getImageData(0,0,c.width,c.height).data;let lit=0;
          for(let i=3;i<d.length;i+=97){if(d[i]>12)lit++;}
          px={w:c.width,h:c.height,litPx:lit};}
        return JSON.stringify({ready:window.__hiveReady||null,stats:window.__hive||null,px:px,
          title:document.title,cta:!!document.getElementById('enterBtn'),
          statsCount:document.querySelectorAll('.status .stat').length});})()`,
      returnByValue: true
    });
    const coll = await send('Runtime.evaluate', { expression: COLLIDE, returnByValue: true });
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(__dirname, '_verify-' + vp.name + '.png');
    fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
    console.log('[' + vp.name + '] ' + state.result.value);
    console.log('[' + vp.name + '] COLLIDE ' + coll.result.value);
    console.log('[' + vp.name + '] SHOT ' + p + ' ' + fs.statSync(p).size + ' bytes');
  }
  console.log('EVENTS ' + (events.length ? events.join(' | ') : 'none'));
  ws.close();
  proc.kill();
})().catch(e => { console.error('FAIL ' + e.message); try { proc.kill(); } catch (_) {} process.exit(1); });
