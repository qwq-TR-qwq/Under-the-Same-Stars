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
      html += '<option value="' + k + '">' + AI_PROVIDERS[k].name + provSuffix(k) + '</option>';
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
    paintProviderCond();
  }
  // ===== 服务商可用条件：选项直接标注环境状态，点「可用条件」看条件清单 =====
  var aiTipEl = document.getElementById('aiProviderTip');
  var aiCondBtn = document.getElementById('aiProviderCond');
  var aiTipPinned = false;
  // 同域 /api/ai 是否存在：file:// 与纯静态托管没有后端函数
  function proxyEnvState(){
    var h = String((typeof location !== 'undefined' && location.hostname) || '');
    var p = String((typeof location !== 'undefined' && location.protocol) || '');
    if(p === 'file:') return { lv:'no', why:'页面是直接打开的本地文件（file://），没有同域后端' };
    if(/(^|\.)(github\.io|gitee\.io)$/.test(h)) return { lv:'no', why:'纯静态托管（' + h + '）没有 /api/ai 这个路径' };
    if(h === 'localhost' || h === '127.0.0.1' || h === '') return { lv:'maybe', why:'本机预览需要同时运行代理函数' };
    return { lv:'maybe', why:'请确认已部署 api/ai 代理函数' };
  }
  function provSuffix(k){
    if(k === 'proxy') return proxyEnvState().lv === 'no' ? ' · 当前环境不可用' : ' · 需已部署 /api/ai';
    if(k === 'remote') return ' · 需填 REMOTE_PROXY';
    return '';
  }
  function provCondHTML(k){
    if(k === 'proxy'){
      var st = proxyEnvState();
      return '<b>后端中转：什么情况下能用</b><ul>'
        + '<li>站点与代理函数<b>同域</b>部署：根目录放 <code>api/ai.js</code>（Vercel / Netlify 自动识别为函数）</li>'
        + '<li>服务端配好 <code>AI_PROXY_KEY</code>，可选 <code>AI_PROXY_ENDPOINT</code> / <code>AI_PROXY_MODEL</code> / <code>AI_PROXY_TOKEN</code></li>'
        + '<li>浏览器打开 <code>你的域名/api/ai</code> 能返回健康检查 JSON</li>'
        + '</ul><p>' + (st.lv === 'no'
          ? '<span class="h-tag warn">当前不可用</span>' + st.why + '——选中后会 404，星语自动降级为本地知识库应答。</p>'
          : '当前：' + st.why + '；条件不满足时同样会 404 并降级。</p>');
    }
    if(k === 'remote'){
      return '<b>在线演示通道：什么情况下能用</b><ul>'
        + '<li>Worker 已部署且地址可访问</li>'
        + '<li><code>03-ai-core.js</code> 顶部 <code>REMOTE_PROXY</code> 已填该地址</li>'
        + '<li>若 Worker 设了口令，<code>REMOTE_TOKEN</code> 要与之一致</li>'
        + '</ul><p>' + (REMOTE_PROXY
          ? '<span class="h-tag ok">已配置</span><code>' + REMOTE_PROXY + '</code>'
          : '<span class="h-tag warn">未配置</span>常量为空，本项不会出现在下拉列表里') + '</p>';
    }
    if(k === 'pollinations'){
      return '<b>免费体验接口：什么情况下能用</b><ul><li>页面能联网即可，不需要 Key</li>'
        + '<li>高峰期可能限流，失败时自动降级为本地知识库</li></ul>';
    }
    if(k === 'deepseek'){
      return '<b>DeepSeek：什么情况下能用</b><ul><li>已填入 platform.deepseek.com 的 Key</li>'
        + '<li>浏览器可直连 <code>api.deepseek.com</code>（实测放行，国内可用）</li>'
        + '<li>Key 只存本机 localStorage，换电脑或清缓存后需重填</li></ul>';
    }
    if(k === 'zhipu'){
      return '<b>智谱 GLM：什么情况下能用</b><ul><li>官方接口没有 CORS 头，浏览器直连会被拦，必须先经代理</li>'
        + '<li>已填入 open.bigmodel.cn 的 Key</li>'
        + '<li>在「后端中转」或「自定义」里指向代理后使用</li></ul>';
    }
    if(k === 'qwen'){
      return '<b>通义千问：什么情况下能用</b><ul><li>已填入 dashscope.console.aliyun.com 的 Key（有免费额度）</li>'
        + '<li>浏览器可直连，适合作为备用通道</li></ul>';
    }
    if(k === 'custom'){
      return '<b>自定义：什么情况下能用</b><ul><li>填入完整的 <code>/chat/completions</code> 地址</li>'
        + '<li>填入该服务商要求的 Key 与模型名</li></ul>';
    }
    return '';
  }
  function showTip(){
    if(!aiTipEl || !provCondHTML(aiProviderEl.value)) return;
    aiTipEl.hidden = false;
    aiCondBtn.setAttribute('aria-expanded', 'true');
  }
  function hideTip(force){
    if(!aiTipEl) return;
    if(aiTipPinned && !force) return;
    aiTipEl.hidden = true;
    aiCondBtn.setAttribute('aria-expanded', 'false');
  }
  function paintProviderCond(){
    if(!aiTipEl) return;
    aiTipEl.innerHTML = provCondHTML(aiProviderEl.value);
    if(aiTipEl.hidden === false) showTip();
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
    paintProviderCond();
  });
  // 「可用条件」气泡：悬停即看，点击固定，点外部或 ESC 关闭
  if(aiCondBtn){
    aiCondBtn.addEventListener('click', function(e){
      e.stopPropagation();
      aiTipPinned = !aiTipPinned;
      if(aiTipPinned){ showTip(); } else { hideTip(true); }
    }, false);
    aiCondBtn.addEventListener('mouseenter', function(){ paintProviderCond(); showTip(); }, false);
    var provWrap = aiCondBtn.parentNode;
    if(provWrap){
      provWrap.addEventListener('mouseleave', function(){ hideTip(); }, false);
    }
    document.addEventListener('click', function(e){
      if(aiTipPinned || !aiTipEl || aiTipEl.hidden) return;
      if(aiCondBtn.contains(e.target) || aiTipEl.contains(e.target)) return;
      hideTip(true);
    }, false);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && aiTipEl && !aiTipEl.hidden){ aiTipPinned = false; hideTip(true); }
    }, false);
  }
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
