// 停止按钮 CDP 驱动测试：真实时序，无虚拟时间干扰
const http = require('http');

const CDP_PORT = 9223;
const APP = 'http://127.0.0.1:8643/index.html?view=chat';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function httpGetJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch(e){rej(e);} }); }).on('error', rej);
  });
}

(async () => {
  // 启动 Edge
  const { spawn } = require('child_process');
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + CDP_PORT,
     '--window-size=1300,900', '--user-data-dir=' + process.env.TEMP + '\\edge_cdp_test_' + Date.now() + '', 'about:blank'],
    { stdio: 'ignore' });

  // 等 CDP 就绪
  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { targets = await httpGetJSON(`http://127.0.0.1:${CDP_PORT}/json`); if (targets && targets.length) break; } catch (e) {}
  }
  if (!targets) { console.log('CDP 连接失败'); edge.kill(); process.exit(1); }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 0;
  const pending = {};
  const consoleErrs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
    if (m.method === 'Runtime.exceptionThrown') consoleErrs.push(m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || JSON.stringify(m.params.exceptionDetails).slice(0,200));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrs.push(m.params.args.map(a=>a.value||a.description||'').join(' ').slice(0,200));
  };
  function send(method, params, sessionId) {
    return new Promise(res => { const i = ++id; pending[i] = res; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  }
  async function evalJS(expr, awaitPromise) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: !!awaitPromise });
    return r.result && r.result.result ? r.result.result.value : undefined;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: APP });
  await sleep(2500);

  // 写入配置并 reload
  await evalJS(`localStorage.setItem('star_ai_cfg_v1', JSON.stringify({provider:'custom',apiKey:'sk-test',model:'test-model',endpoint:'/mock/v1/chat/completions',enabled:true})); localStorage.removeItem('star_ai_history_v1'); 'cfg-ok'`);
  await send('Page.reload');
  await sleep(2500);

  const L = [];
  const log = s => { L.push(s); console.log(s); };

  // 第 1 轮发送
  log('T0 发送: ' + await evalJS(`(function(){var i=document.getElementById('chatInput'),b=document.getElementById('chatSend');i.value='你好呀';b.click();return b.textContent.trim();})()`));
  // 等流式内容出现
  let streamTxt = '';
  for (let i = 0; i < 60; i++) {
    await sleep(200);
    streamTxt = await evalJS(`(function(){var t=document.querySelector('#chatMsgs .msg.bot .bubble .txt');return t?t.textContent:'';})()`) || '';
    const btn = await evalJS(`document.getElementById('chatSend').textContent.trim()`);
    if (streamTxt.length >= 6 && btn.indexOf('停') >= 0) break;
  }
  log('T1 流式中: [' + streamTxt.slice(0, 14) + '…] btn 停止中');
  // 点停止
  log('T2 点停止: ' + await evalJS(`(function(){var b=document.getElementById('chatSend');b.click();return 'clicked';})()`));
  let recovered = false;
  for (let i = 0; i < 30; i++) {
    await sleep(200);
    const btn = await evalJS(`document.getElementById('chatSend').textContent.trim()`);
    if (btn.indexOf('发') >= 0) { recovered = true; break; }
  }
  log('T3 停止后按钮恢复为发送: ' + recovered + ' stats=' + JSON.stringify(await evalJS('window.__aiStats ? __aiStats() : null')));
  // 第 2 轮：再发送
  log('T4 再发送: ' + await evalJS(`(function(){var i=document.getElementById('chatInput'),b=document.getElementById('chatSend');i.value='再说一句';b.click();return b.textContent.trim();})()`));
  let done2 = false;
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    const btn = await evalJS(`document.getElementById('chatSend').textContent.trim()`);
    if (btn.indexOf('发') >= 0) { done2 = true; break; }
  }
  const last = await evalJS(`(function(){var t=document.querySelectorAll('#chatMsgs .msg.bot .bubble .txt');return t.length?t[t.length-1].textContent.slice(0,40):'(无)';})()`);
  log('T5 第二轮完成: ' + done2 + ' 最后一条AI=[' + last + ']');
  log('页面报错: ' + (consoleErrs.length ? consoleErrs.join(' ;; ') : '(无)'));
  log('RESULT ' + (recovered && done2 ? 'PASS' : 'FAIL'));

  ws.close(); edge.kill();
  process.exit(recovered && done2 ? 0 : 2);
})().catch(e => { console.error('驱动异常:', e.message); process.exit(1); });
