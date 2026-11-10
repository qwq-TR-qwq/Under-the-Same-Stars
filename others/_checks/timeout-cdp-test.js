// 超时误报回归测试（v12.29）：请求超时必须显示「超时」而非「已停止生成」
// 场景：pollinations 通道 + 永不响应的 /hang 端点 → 20 秒后应出现超时提示
const http = require('http');

const CDP_PORT = 9224;
const APP = 'http://127.0.0.1:8643/index.html?view=chat';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function httpGetJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch(e){rej(e);} }); }).on('error', rej);
  });
}

(async () => {
  const { spawn } = require('child_process');
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + CDP_PORT,
     '--window-size=1300,900', '--user-data-dir=' + process.env.TEMP + '\\edge_cdp_timeout_' + Date.now(), 'about:blank'],
    { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { targets = await httpGetJSON(`http://127.0.0.1:${CDP_PORT}/json`); if (targets && targets.length) break; } catch (e) {}
  }
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

  // pollinations 通道指向永不响应的 /hang
  await evalJS(`localStorage.setItem('star_ai_cfg_v1', JSON.stringify({provider:'pollinations',apiKey:'',model:'openai',endpoint:'/hang',enabled:true})); localStorage.removeItem('star_ai_history_v1'); 'cfg-ok'`);
  await send('Page.reload');
  await sleep(2500);

  console.log('T0 发送: ' + await evalJS(`(function(){var i=document.getElementById('chatInput'),b=document.getElementById('chatSend');i.value='你好';b.click();return 'sent';})()`));

  // 最多等 40 秒，轮询最后一条 AI 气泡
  let last = '';
  for (let i = 0; i < 80; i++) {
    await sleep(500);
    last = await evalJS(`(function(){var t=document.querySelectorAll('#chatMsgs .msg.bot .bubble .txt');return t.length?t[t.length-1].textContent.slice(0,120):'';})()`) || '';
    if (last.indexOf('超时') >= 0 || last.indexOf('已停止生成') >= 0) break;
  }
  console.log('T1 最终气泡: [' + last + ']');
  const btn = await evalJS(`document.getElementById('chatSend').textContent.trim()`);
  const stats = await evalJS('window.__aiStats ? JSON.stringify(__aiStats()) : null');
  console.log('T2 按钮=' + btn + ' stats=' + stats);

  const isTimeout = last.indexOf('超时') >= 0;
  const notStop = last.indexOf('已停止生成') < 0;
  const recovered = String(btn).indexOf('发') >= 0;
  console.log('RESULT ' + (isTimeout && notStop && recovered ? 'PASS' : 'FAIL') + ' (超时提示:' + isTimeout + ' 未误报停止:' + notStop + ' 按钮恢复:' + recovered + ')');

  ws.close(); edge.kill();
  process.exit(isTimeout && notStop && recovered ? 0 : 2);
})().catch(e => { console.error('驱动异常:', e.message); process.exit(1); });
