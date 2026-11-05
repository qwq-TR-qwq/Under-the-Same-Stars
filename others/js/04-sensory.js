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
