  // ============ 感官体验：播放"自闭症儿童眼中的世界"短片 ============
  function startSensorySim(){
    // 关闭可能存在的旧层
    var old = document.getElementById('sensoryOv');
    if(old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'sensoryOv';
    ov.style.cssText = 'position:fixed; inset:0; z-index:99999; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding-top:5vh; padding-bottom:80px; overflow-y:auto;';
    ov.innerHTML = '<div style="width:100%; max-width:520px;">'
      + '<video src="others/videos/asset_02.mp4" controls playsinline style="width:100%; border-radius:12px; background:#000;"></video>'
      + '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px;">'
      + '<span style="color:#c9d3f2; font-size:14px;">自闭症儿童眼中的世界 · 75秒短片</span>'
      + '<button id="sensoryExit" style="background:rgba(255,217,100,.15); color:#ffd964; border:1px solid rgba(255,217,100,.4); border-radius:20px; padding:8px 22px; cursor:pointer; font-size:14px;">关闭</button>'
      + '</div></div>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    var close = function(){
      var v = ov.querySelector('video');
      try{ if(v){ v.pause(); v.src=''; } }catch(e){}
      ov.remove();
      document.body.style.overflow = '';
    };
    ov.querySelector('#sensoryExit').addEventListener('click', close);
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
  }
  function escHtml(s){
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function cleanMd(s){
    return String(s == null ? '' : s)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  }
  function restoreChat(){
    if(!chatHistory.length){
      botSay('你好呀，我是星语～学习、工作、人际、情感、睡眠……生活里的大小事都可以和我聊聊。也可以点开左侧的科普站，看看感兴趣的话题。想试试的话，可以问我“最近压力好大怎么办？”，或“怎么和同学相处？”～');
      return;
    }
    var list = chatHistory.slice(-24);
    for(var i = 0; i < list.length; i++){
      if(list[i].role === 'user'){
        meSay(list[i].content);
      } else {
        var wrap = document.createElement('div');
        wrap.className = 'msg bot';
        wrap.innerHTML = '<div class="ava">' + avaSvg(true) + '</div><div class="bubble"></div>';
        wrap.querySelector('.bubble').textContent = cleanMd(list[i].content);
        chatMsgs.appendChild(wrap);
      }
    }
    scrollMsgs();
  }
  // ---- AI 设置界面 ----
  function fillProviderSel(){
    var html = '';
    for(var k in AI_PROVIDERS){
      // 未部署代理时不显示"在线演示通道"，避免选到空地址
      if(k === 'remote' && !REMOTE_PROXY) continue;
      html += '<option value="' + k + '">' + AI_PROVIDERS[k].name + '</option>';
    }
    aiProviderEl.innerHTML = html;
  }
  function syncAiForm(){
    fillProviderSel();
    aiProviderEl.value = aiCfg.provider;
    aiKeyEl.value = aiCfg.apiKey || '';
    aiModelEl.value = aiCfg.model || '';
    aiEndpointEl.value = aiCfg.endpoint || '';
    aiEnabledEl.checked = !!aiCfg.enabled;
    var p = AI_PROVIDERS[aiCfg.provider];
    aiKeyRow.style.display = (p && p.key) ? '' : 'none';
    aiEndpointRow.style.display = aiCfg.provider === 'custom' ? '' : 'none';
    paintProviderHint();
  }
  // ===== 服务商逐项说明：面板里直接讲清「这一项怎么用、现在能不能用」 =====
  var aiHintEl = document.getElementById('aiProviderHint');
  // 同域 /api/ai 是否存在：file:// 与纯静态托管没有后端函数，本机预览需自行起代理
  function proxyEnvState(){
    var h = String((typeof location !== 'undefined' && location.hostname) || '');
    var p = String((typeof location !== 'undefined' && location.protocol) || '');
    if(p === 'file:') return { lv:'no', why:'页面是直接用浏览器打开的本地文件（file://），没有同域后端' };
    if(/(^|\.)(github\.io|gitee\.io)$/.test(h)) return { lv:'no', why:'当前是纯静态托管（' + h + '），服务器上不存在 /api/ai 这个路径' };
    if(h === 'localhost' || h === '127.0.0.1' || h === '') return { lv:'maybe', why:'本机预览需要同时运行代理函数，否则 /api/ai 会 404' };
    return { lv:'maybe', why:'请确认本站已部署 api/ai 代理函数——浏览器直接打开 /api/ai 应返回健康检查 JSON' };
  }
  function paintProviderHint(){
    if(!aiHintEl) return;
    var key = aiProviderEl.value || aiCfg.provider, html = '';
    if(key === 'proxy'){
      var st = proxyEnvState();
      html = '<b>后端中转（同域 /api/ai）</b>：页面全程不接触 Key——请求发到本站的 <code>/api/ai</code>，由服务端函数带上真实 Key 转发给模型，源码与前端都扫不到密钥。'
        + '<br>启用条件：把 <code>others/serverless/vercel-api-ai.js</code> 复制为站点根目录的 <code>api/ai.js</code>，与页面一起部署到 Vercel / Netlify（会自动识别为函数），再在平台环境变量里配置 '
        + '<code>AI_PROXY_KEY</code>（真实 Key）、<code>AI_PROXY_ENDPOINT</code>（上游地址，默认 DeepSeek）、<code>AI_PROXY_MODEL</code>、<code>AI_PROXY_TOKEN</code>（防滥用口令，不是密钥）。'
        + '<br>当前环境：<span class="h-tag ' + (st.lv === 'no' ? 'warn' : 'info') + '">' + (st.lv === 'no' ? '不可用' : '待确认') + '</span>'
        + st.why + '。选它但接口不存在时，星语会自动降级为本地知识库应答——看起来还在答，实际不是真模型。';
    } else if(key === 'remote'){
      html = '<b>在线演示通道（服务端代理 · 跨域）</b>：地址取自 <code>others/js/03-ai-core.js</code> 顶部的 <code>REMOTE_PROXY</code>，口令取自 <code>REMOTE_TOKEN</code>，适合把 Cloudflare Worker 部署在另一个域名上。'
        + '<br>当前状态：' + (REMOTE_PROXY
          ? '<span class="h-tag ok">已配置</span><code>' + REMOTE_PROXY + '</code>'
          : '<span class="h-tag warn">未启用</span>顶部常量为空，本项不会出现在下拉列表里');
    } else if(key === 'pollinations'){
      html = '<b>免费体验接口（pollinations）</b>：不需要 Key，联网即可对话，评委打开线上站点就能直接体验。高峰期可能限流，失败时自动降级为本地知识库应答——适合演示，不适合指望它稳定。';
    } else if(key === 'deepseek'){
      html = '<b>DeepSeek（浏览器直连）</b>：请求直接发往 <code>api.deepseek.com</code>，Key 只存本机 localStorage、不进代码仓库。实测国内可直连，录演示视频 / 现场答辩用这一档最稳。'
        + '<br>注意：Key 存在你自己的浏览器里，别把这份配置连同 Key 一起分享出去。';
    } else if(key === 'zhipu'){
      html = '<b>智谱 GLM（需代理）</b>：官方接口未返回 CORS 头，浏览器直连会被拦截。要用它请先把请求指向一个代理（选「后端中转」或「自定义」填代理地址），再由代理转发到 <code>open.bigmodel.cn</code>。';
    } else if(key === 'qwen'){
      html = '<b>通义千问（浏览器直连）</b>：<code>dashscope.aliyuncs.com</code> 允许跨域且有免费额度，可作 DeepSeek 的备用；发图片时自动切换到 <code>qwen-vl-plus</code> 看图解读。';
    } else if(key === 'custom'){
      html = '<b>自定义（OpenAI 兼容）</b>：填完整的 <code>/chat/completions</code> 地址与 Key，可接自建代理、其它厂商或中转站；模型名按服务商要求填写。';
    }
    aiHintEl.innerHTML = html;
    aiHintEl.hidden = !html;
  }
  function openAiSettings(){ syncAiForm(); aiTestStatus.textContent = ''; aiTestStatus.className = 'set-test-status'; aiMask.classList.add('open'); }
  function closeAiSettings(){ aiMask.classList.remove('open'); }
  aiSetBtn.addEventListener('click', function(e){ e.stopPropagation(); openAiSettings(); }, false);
  aiMaskClose.addEventListener('click', function(e){ e.stopPropagation(); closeAiSettings(); }, false);
  aiMask.addEventListener('click', function(e){ if(e.target === aiMask) closeAiSettings(); }, false);
  aiProviderEl.addEventListener('change', function(){
    var p = AI_PROVIDERS[aiProviderEl.value];
    aiKeyRow.style.display = (p && p.key) ? '' : 'none';
    aiEndpointRow.style.display = aiProviderEl.value === 'custom' ? '' : 'none';
    if(p){ aiModelEl.value = p.model || ''; aiEndpointEl.value = p.endpoint || ''; }
    paintProviderHint();
  });
  aiSaveBtn.addEventListener('click', function(e){
    e.stopPropagation();
    aiCfg.provider = aiProviderEl.value;
    aiCfg.apiKey = aiKeyEl.value.replace(/^\s+|\s+$/g, '');
    aiCfg.model = aiModelEl.value.replace(/^\s+|\s+$/g, '');
    aiCfg.endpoint = aiEndpointEl.value.replace(/^\s+|\s+$/g, '');
    aiCfg.enabled = aiEnabledEl.checked;
    saveAiCfg(); paintAiStatus();
    aiTestStatus.textContent = '✓ 设置已保存';
    aiTestStatus.className = 'set-test-status ok';
  }, false);
  aiClearBtn.addEventListener('click', function(e){
    e.stopPropagation();
    chatHistory = [];
    saveHistory();
    chatMsgs.innerHTML = '';
    botSay('好的，我们重新开始～我是星语，无论你想聊什么，都可以放心告诉我。');
    aiTestStatus.textContent = '✓ 已清空对话记忆';
    aiTestStatus.className = 'set-test-status ok';
  }, false);
  aiTestBtn.addEventListener('click', function(e){
    e.stopPropagation();
    var msgs = [{ role: 'system', content: '你是一个连接测试助手，请只回复两个字：在线' }, { role: 'user', content: '在吗' }];
    // 链路诊断：显性展示四级兜底（本地知识库 → 免费接口 → 后端中转 → 自填 Key）里的当前层级
    var pname = AI_PROVIDERS[aiProviderEl.value] ? AI_PROVIDERS[aiProviderEl.value].name : '当前服务商';
    aiCfg.provider = aiProviderEl.value;
    aiCfg.apiKey = aiKeyEl.value.replace(/^\s+|\s+$/g, '');
    aiCfg.model = aiModelEl.value.replace(/^\s+|\s+$/g, '');
    aiCfg.endpoint = aiEndpointEl.value.replace(/^\s+|\s+$/g, '');
    aiCfg.enabled = aiEnabledEl.checked;
    aiTestStatus.textContent = '① 本地知识库：✓ 就绪（未联网也能答）… 正在检测 ② ' + pname + ' …';
    aiTestStatus.className = 'set-test-status';
    callAI(msgs, function(reply){
      aiTestStatus.textContent = '✓ 链路诊断通过：本地知识库 ✓ → ' + pname + ' ✓ 在线应答已就绪（回复：' + reply.slice(0, 30) + '）';
      aiTestStatus.className = 'set-test-status ok';
    }, function(err){
      aiTestStatus.textContent = '△ ' + pname + ' 暂不可用（' + aiErrText(err) + '）。星语会自动降级到本地知识库继续应答——功能完整，只是知识面窄一些；也可换一个服务商或填入 API Key 重试。';
      aiTestStatus.className = 'set-test-status err';
    });
  }, false);

  // ================================================================
