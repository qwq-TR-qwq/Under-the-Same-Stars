// 导航下拉收回回归测试（v12.30）：展开后点击外部/再点按钮必须能收回
const http = require('http');
const CDP_PORT = 9225;
const APP = 'http://127.0.0.1:8643/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
function httpGetJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch(e){rej(e);} }); }).on('error', rej);
  });
}
(async () => {
  const { spawn } = require('child_process');
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + CDP_PORT, '--window-size=1300,900', '--user-data-dir=' + process.env.TEMP + '\\edge_cdp_nav_' + Date.now(), 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 40; i++) { await sleep(250); try { targets = await httpGetJSON(`http://127.0.0.1:${CDP_PORT}/json`); if (targets && targets.length) break; } catch (e) {} }
  if (!targets) { console.log('CDP 连接失败'); edge.kill(); process.exit(1); }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = {};
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  function send(method, params) { return new Promise(res => { const i = ++id; pending[i] = res; ws.send(JSON.stringify({ id: i, method, params: params || {} })); }); }
  async function evalJS(expr) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result && r.result.result ? r.result.result.value : undefined; }

  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: APP });
  await sleep(2500);

  const vis = `(function(){var d=document.querySelector('.nav-group .nav-drop');return d?getComputedStyle(d).visibility:'none';})()`;
  console.log('finePointer=' + await evalJS(`window.matchMedia('(hover:hover) and (pointer:fine)').matches`));

  // T1 点击展开
  await evalJS(`document.querySelector('.nav-drop-btn').click(); 'clicked'`);
  await sleep(300);
  console.log('T1 点击按钮后下拉可见性: ' + await evalJS(vis) + ' open=' + await evalJS(`document.querySelector('.nav-group').className`));

  // T2 点击页面其他区域 → 必须收回
  await evalJS(`document.querySelector('.site-brand').click(); 'brand'`);
  await sleep(300);
  const v2 = await evalJS(vis);
  console.log('T2 点外部后下拉可见性: ' + v2 + ' open=' + await evalJS(`document.querySelector('.nav-group').className`));
  const outsideClosed = v2 === 'hidden';

  // T3 再展开 → 再点按钮 → 收回（鼠标悬停抑制）
  await evalJS(`document.querySelector('.nav-drop-btn').click(); 'again'`);
  await sleep(250);
  const v3a = await evalJS(vis);
  await evalJS(`document.querySelector('.nav-drop-btn').click(); 'toggle'`);
  await sleep(250);
  const v3b = await evalJS(vis);
  // 模拟鼠标移开
  await evalJS(`document.querySelector('.nav-group').classList.remove('sup'); 'mouseleave-sim'`);
  await sleep(150);
  console.log('T3 再展开=' + v3a + ' → 再点按钮=' + v3b);
  const toggleClosed = v3b === 'hidden';

  // T4 ESC 收起
  await evalJS(`document.querySelector('.nav-drop-btn').click(); 'open3'`);
  await sleep(250);
  await evalJS(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); 'esc'`);
  await sleep(400);
  const v4 = await evalJS(vis);
  console.log('T4 ESC 后可见性: ' + v4);
  const escClosed = v4 === 'hidden';

  console.log('RESULT ' + (outsideClosed && toggleClosed && escClosed ? 'PASS' : 'FAIL') + ` (点外部收回:${outsideClosed} 再点按钮收回:${toggleClosed} ESC收回:${escClosed})`);
  ws.close(); edge.kill();
  process.exit(outsideClosed && toggleClosed && escClosed ? 0 : 2);
})().catch(e => { console.error('驱动异常:', e.message); process.exit(1); });
