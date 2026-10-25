  // 星语 AI：真实大模型对话（接入大模型 API · 带上下文记忆）
  // ================================================================
  var aiStatusEl = document.getElementById('aiStatus');
  var aiSetBtn = document.getElementById('aiSetBtn');
  var aiMask = document.getElementById('aiMask');
  var aiMaskClose = document.getElementById('aiMaskClose');
  var aiProviderEl = document.getElementById('aiProvider');
  var aiKeyEl = document.getElementById('aiKey');
  var aiModelEl = document.getElementById('aiModel');
  var aiEndpointEl = document.getElementById('aiEndpoint');
  var aiEnabledEl = document.getElementById('aiEnabled');
  var aiTestBtn = document.getElementById('aiTest');
  var aiSaveEl = document.getElementById('aiSave');
  var aiSaveBtn = aiSaveEl;
  var aiClearBtn = document.getElementById('aiClear');
  var aiTestStatus = document.getElementById('aiTestStatus');
  var aiKeyRow = document.getElementById('aiKeyRow');
  var aiEndpointRow = document.getElementById('aiEndpointRow');

  var AI_PROVIDERS = {
    pollinations: { name: '免费体验接口（无需 Key，联网即用）', model: 'openai', endpoint: 'https://text.pollinations.ai/', key: false, vision: 'openai' },
    proxy:        { name: '后端中转（推荐部署，Key 不落前端）', model: 'deepseek-chat', endpoint: '/api/ai', key: false, vision: null },
    deepseek:    { name: 'DeepSeek（推荐）', model: 'deepseek-chat', endpoint: 'https://api.deepseek.com/chat/completions', key: true, vision: null },
    zhipu:       { name: '智谱 GLM', model: 'glm-4-flash', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', key: true, vision: 'glm-4v-flash' },
    qwen:        { name: '通义千问', model: 'qwen-turbo', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', key: true, vision: 'qwen-vl-plus' },
    custom:      { name: '自定义（OpenAI 兼容）', model: '', endpoint: '', key: true, vision: null }
  };
  var aiCfg = { provider: 'pollinations', apiKey: '', model: 'openai', endpoint: 'https://text.pollinations.ai/', enabled: true };
  try {
    var _savedCfg = JSON.parse(localStorage.getItem('star_ai_cfg_v1') || 'null');
    if(_savedCfg){ for(var _ck in aiCfg){ if(_savedCfg[_ck] !== undefined && _savedCfg[_ck] !== null) aiCfg[_ck] = _savedCfg[_ck]; } }
  } catch(e){}
  var chatHistory = [];
  try {
    var _hist = JSON.parse(localStorage.getItem('star_ai_history_v1') || '[]');
    if(_hist instanceof Array) chatHistory = _hist;
  } catch(e){}
  function saveAiCfg(){ try{ localStorage.setItem('star_ai_cfg_v1', JSON.stringify(aiCfg)); }catch(e){} }
  function saveHistory(){ try{ localStorage.setItem('star_ai_history_v1', JSON.stringify(chatHistory.slice(-40))); }catch(e){} }

  var SYSTEM_PROMPT = '你是"星语"，一个温柔、真诚、有生活经验的心理与生活陪伴助手，来自公益科普互动页《以星为灯 · 照亮来自星星的孩子》。' +
    '你要针对用户具体说的事情深入回答，不要泛泛而谈。比如用户说"我明天面试紧张"，你就具体讲面试前一晚怎么准备、进门前怎么调整、坐下来怎么开口；用户说"和男朋友吵架了"，你就先问清楚因为什么吵、现在是谁在冷战、你希望怎样，再顺着这件事聊。不要不管用户说什么都只回"要放松、要调整心态、多和朋友聊聊"这种万能套话。' +
    '回答要求：①开头先用一两句接住他具体的情绪和事情，比如"面试前一晚紧张得睡不着，这种感觉我懂"，不要一上来就讲道理；②围绕他说的具体事情展开，给2-3条真的能落地的建议，用聊天语气自然说出来，不要机械分"第一第二第三"，不要列提纲；③篇幅200-400字，把这件事说透，不要一两句话结束；④如果他说的信息不够，先问清楚关键细节再给建议，不要瞎猜；⑤结尾轻轻引导他接着说，比如"那你明天面试是什么岗位呀"。' +
    '语气像一个温柔、有耐心、真正懂生活的朋友在面对面聊天，不要学术腔、不要冷冰冰、不要公式化。涉及疾病时说明"仅供参考，不能替代专业诊断"，必要时建议正规医院或拨打12356。记住并联系他之前说过的内容。';
  function aiModeName(){ var p = AI_PROVIDERS[aiCfg.provider]; return p ? p.name : '自定义'; }
  function aiKeyOk(){ return aiCfg.provider === 'pollinations' || aiCfg.provider === 'proxy' || (aiCfg.apiKey && aiCfg.apiKey.length >= 6); }
  function paintAiStatus(){
    if(!aiStatusEl) return;
    var on = aiCfg.enabled && aiKeyOk();
    aiStatusEl.className = 'ai-status' + (on ? ' on' : '');
    aiStatusEl.style.display = on ? 'none' : '';
    aiStatusEl.innerHTML = on ? '' : '<i class="p"></i>本地应答模式';
    aiStatusEl.title = on ? '已接入真实大模型 API，对话具备上下文记忆' : '未配置 API Key，使用内置应答。点击右上角 ⚙ 配置真实 AI';
  }
  var _lastUserText = '';
  var _lastHits = [];
  // ===== AI 安全：危机干预兜底（优先级最高，直接本地响应，不经大模型） =====
  var CRISIS_PAT = /(自杀|轻生|不想活|想去死|想死|活不下去|自残|自伤|割腕|跳楼|结束生命|结束自己|了结自己|吞安眠药|写遗书|kill ?myself|suicide)/i;
  var CRISIS_REPLY = '谢谢你愿意把这么难受的感受说出来，这本身就需要很大的勇气。\n\n请现在、立刻，让真实的人帮到你：\n· 全国心理援助热线：12356（24 小时免费）\n· 北京心理危机研究与干预中心：010-82951332\n· 紧急情况请直接拨打 120 或 110\n\n把你的感受告诉任何一个你信得过的人——家人、朋友、老师都可以。你的痛苦是真实的，但它可以被帮助、也会过去。我在这儿陪着你，但我更希望有一双真实的手，现在就握住你。';
  function isCrisis(text){ return CRISIS_PAT.test(String(text || '')); }
  // ===== Function Calling：大模型可调用的站内工具（OpenAI tools 协议） =====
  var AI_TOOLS = [
    { type: 'function', function: { name: 'navigate_view', description: '当用户想前往网站某个板块、或需要站内功能入口时调用。可跳转板块：science(认识自闭症科普)、myth(辟谣专区)、guide(行动指南)、stories(真实故事)、gallery(儿童作品展)、family(家庭支持)、policy(政策与救助)、charity(公益参与)、community(家长互助社群/留言祝福/电子公益证书)、news(公益动态)、about(关于我们)、feedback(反馈支持)、home(首页)', parameters: { type: 'object', properties: { view: { type: 'string', description: '板块标识，见描述中的取值' }, reason: { type: 'string', description: '一句话说明为什么推荐该板块' } }, required: ['view'] } } },
    { type: 'function', function: { name: 'search_knowledge', description: '检索本站自闭症科普知识库（权威科普条目）。当用户询问自闭症相关问题、需要站内资料佐证时调用', parameters: { type: 'object', properties: { query: { type: 'string', description: '检索关键词' } }, required: ['query'] } } },
    { type: 'function', function: { name: 'sensory_experience', description: '为用户打开"星星的视角"感官体验模拟（模拟自闭症儿童在商场等嘈杂环境中的真实感受）。当用户想亲身体验星星孩子的感官世界时调用', parameters: { type: 'object', properties: {} } } }
  ];
  var VIEW_NAMES = { home: '首页', science: '认识自闭症', family: '家庭支持站', gallery: '儿童作品展', stories: '真实故事', charity: '公益参与', community: '互助社群', guide: '行动指南', myth: '辟谣专区', policy: '政策救助', news: '公益动态', about: '关于我们', feedback: '反馈支持' };
  function execTool(name, args){
    if(name === 'navigate_view'){
      var view = (args && args.view) || 'home';
      if(!VIEW_NAMES[view]) view = 'home';
      return { text: '已为用户准备好前往「' + VIEW_NAMES[view] + '」的入口按钮，请在回复末尾自然地提示用户点击按钮前往。', button: { view: view, label: '去「' + VIEW_NAMES[view] + '」看看' } };
    }
    if(name === 'search_knowledge'){
      var hits = searchKB((args && args.query) || _lastUserText);
      if(!hits.length) return { text: '知识库中没有找到直接相关条目，请基于常识温和回答，不要编造具体数据或医疗建议。' };
      var s = '';
      for(var i = 0; i < hits.length; i++){ s += '- ' + hits[i].t + '：' + hits[i].c + '\n'; }
      return { text: '以下是知识库检索结果：\n' + s };
    }
    if(name === 'sensory_experience'){
      return { text: '已为用户准备好感官体验入口按钮，请自然地提示用户点击体验。', button: { view: null, label: '🌌 进入"星星的视角"体验', sensory: true } };
    }
    return { text: '该工具暂不支持。' };
  }
  function buildMessages(){
    var sys = SYSTEM_PROMPT + ragContext(_lastUserText);
    var msgs = [{ role: 'system', content: sys }];
    var hist = chatHistory.slice(-30);
    for(var hi = 0; hi < hist.length; hi++){
      var m = hist[hi];
      if(m.image){
        msgs.push({ role: m.role, content: [
          { type: 'text', text: m.content || '请看看这张图片' },
          { type: 'image_url', image_url: { url: m.image } }
        ] });
      } else {
        msgs.push({ role: m.role, content: m.content });
      }
    }
    return msgs;
  }
  // ===== 大模型调用：SSE 流式输出 + tool_calls 解析 =====
  function callAI(messages, done, fail, onDelta, useTools){
    if(aiCfg.provider === 'pollinations'){
      var ctrlP = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timerP = ctrlP ? setTimeout(function(){ ctrlP.abort(); }, 6000) : null;
      fetch(aiCfg.endpoint || 'https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages, model: aiCfg.model || 'openai' }),
        signal: ctrlP ? ctrlP.signal : undefined
      }).then(function(r){
          if(!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        }).then(function(txt){
          if(timerP) clearTimeout(timerP);
          var out = (txt || '').replace(/^\s+|\s+$/g, '');
          if(!out) throw new Error('空回复');
          done(out, null);
        }).catch(function(err){ if(timerP) clearTimeout(timerP); fail(err); });
      return;
    }
    var body = { model: aiCfg.model, messages: messages, temperature: 0.75, max_tokens: 1500, stream: true };
    if(useTools){ body.tools = AI_TOOLS; body.tool_choice = 'auto'; }
    var headers = { 'Content-Type': 'application/json' };
    if(aiKeyOk() && aiCfg.provider !== 'proxy') headers['Authorization'] = 'Bearer ' + aiCfg.apiKey;
    var proxyToken = '';
    try{ proxyToken = localStorage.getItem('star_ai_proxy_token') || ''; }catch(e){}
    if(aiCfg.provider === 'proxy' && proxyToken) headers['X-Proxy-Token'] = proxyToken;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, 60000) : null;
    fetch(aiCfg.endpoint, {
      method: 'POST', headers: headers, body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function(r){
        if(!r.ok) throw new Error('HTTP ' + r.status);
        if(!r.body || !r.body.getReader){ return r.json().then(function(j){ parseNonStream(j); }); }
        var reader = r.body.getReader();
        var dec = new TextDecoder('utf-8');
        var buf = '', full = '', toolAcc = {};
        function handleChunk(){
          var lines = buf.split('\n');
          buf = lines.pop();
          for(var i = 0; i < lines.length; i++){
            var line = lines[i].replace(/^\s+|\s+$/g, '');
            if(!line || line.charAt(0) === ':') continue;
            if(line.indexOf('data:') !== 0) continue;
            var d = line.slice(5).replace(/^\s+/, '');
            if(d === '[DONE]') continue;
            var j = null;
            try{ j = JSON.parse(d); }catch(e){ continue; }
            var ch = j && j.choices && j.choices[0];
            if(!ch) continue;
            var delta = ch.delta || {};
            if(delta.content){ full += delta.content; if(onDelta) onDelta(full); }
            if(delta.tool_calls){
              for(var t = 0; t < delta.tool_calls.length; t++){
                var tc = delta.tool_calls[t];
                var idx = (typeof tc.index === 'number') ? tc.index : 0;
                if(!toolAcc[idx]) toolAcc[idx] = { id: tc.id || ('call_' + idx), type: 'function', function: { name: '', arguments: '' } };
                if(tc.id) toolAcc[idx].id = tc.id;
                if(tc.function){
                  if(tc.function.name) toolAcc[idx].function.name += tc.function.name;
                  if(tc.function.arguments) toolAcc[idx].function.arguments += tc.function.arguments;
                }
              }
            }
          }
        }
        function parseNonStream(j){
          if(timer) clearTimeout(timer);
          var out = '';
          var tcs = null;
          if(j && j.choices && j.choices[0] && j.choices[0].message){
            var msg = j.choices[0].message;
            out = msg.content || '';
            if(msg.tool_calls && msg.tool_calls.length){
              tcs = msg.tool_calls.map(function(tc, k){
                return { id: tc.id || ('call_' + k), type: 'function', function: { name: tc.function && tc.function.name || '', arguments: (tc.function && tc.function.arguments) || '{}' } };
              });
            }
          }
          else if(j && j.error){ throw new Error(String(j.error.message || j.error)); }
          if(tcs && tcs.length){ done(out, tcs); return; }
          out = (out || '').replace(/^\s+|\s+$/g, '');
          if(!out) throw new Error('空回复');
          done(out, null);
        }
        function finalize(){
          if(timer) clearTimeout(timer);
          var keys = Object.keys(toolAcc);
          if(keys.length){
            var tcs = keys.map(function(k){
              var t = toolAcc[k];
              t.function.arguments = t.function.arguments || '{}';
              return t;
            });
            done(full, tcs);
            return;
          }
          full = full.replace(/^\s+|\s+$/g, '');
          if(!full){ fail(new Error('空回复')); return; }
          done(full, null);
        }
        (function pump(){
          return reader.read().then(function(res){
            if(res.done){ try{ handleChunk(); }catch(e){} finalize(); return; }
            buf += dec.decode(res.value, { stream: true });
            handleChunk();
            if(timer){ clearTimeout(timer); timer = setTimeout(function(){ ctrl.abort(); }, 60000); }
            return pump();
          });
        })();
      })
      .catch(function(err){ if(timer) clearTimeout(timer); fail(err); });
  }
  // ===== 流式渲染：把增量文本写入思考气泡 =====
  function streamInto(think, partial){
    if(!think || !think.parentNode || !partial) return;
    if(think._streamed !== true){
      think._streamed = true;
      think.className = 'msg bot';
      var b = think.querySelector('.bubble');
      if(b) b.innerHTML = '<span class="txt"></span><i class="caret"></i>';
    }
    var txt = think.querySelector('.bubble .txt');
    if(txt){ txt.textContent = partial; scrollMsgs(); }
  }
  // ===== 对话气泡内的工具跳转按钮 =====
  function addChatBubbleBtn(bubble, btnCfg){
    if(!bubble || !btnCfg) return;
    var b = document.createElement('button');
    b.className = 'chat-goto-btn';
    b.type = 'button';
    b.textContent = '✦ ' + btnCfg.label;
    b.addEventListener('click', function(e){
      e.stopPropagation();
      if(btnCfg.sensory){ if(typeof startSensorySim === 'function') startSensorySim(); return; }
      if(typeof switchView === 'function') switchView(btnCfg.view);
    }, false);
    bubble.appendChild(b);
  }
  // ===== TTS 朗读（Web Speech API） =====
  function addTTSBtn(bubble, text){
    if(!bubble || !('speechSynthesis' in window)) return;
    var b = document.createElement('button');
    b.className = 'chat-tts-btn';
    b.type = 'button';
    b.title = '朗读这条回复';
    b.textContent = '🔊';
    b.addEventListener('click', function(e){
      e.stopPropagation();
      try{
        if(window.speechSynthesis.speaking){ window.speechSynthesis.cancel(); b.textContent = '🔊'; return; }
        var u = new SpeechSynthesisUtterance(String(text || '').slice(0, 900));
        u.lang = 'zh-CN'; u.rate = 1;
        u.onend = function(){ b.textContent = '🔊'; };
        u.onerror = function(){ b.textContent = '🔊'; };
        b.textContent = '⏹';
        window.speechSynthesis.speak(u);
      }catch(err){}
    }, false);
    bubble.appendChild(b);
  }
  function finishReply(think, reply, note, opts){
    opts = opts || {};
    if(note) reply = note + reply;
    reply = cleanMd(reply);
    chatHistory.push({ role: 'assistant', content: reply });
    saveHistory();
    if(opts.streamed && think && think._streamed && think.parentNode){
      // 流式输出：原位收尾，不重复打字机
      think.className = 'msg bot';
      var bubble = think.querySelector('.bubble');
      var caret = bubble ? bubble.querySelector('.caret') : null;
      if(caret && caret.parentNode) caret.parentNode.removeChild(caret);
      if(opts.buttons && opts.buttons.length){
        for(var bi = 0; bi < opts.buttons.length; bi++) addChatBubbleBtn(bubble, opts.buttons[bi]);
      }
      addTTSBtn(bubble, reply);
      scrollMsgs();
    } else {
      if(think && think.parentNode) think.parentNode.removeChild(think);
      botSay(reply, opts.buttons);
    }
    chatting = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
  function aiChat(text, think, imageDataUrl){
    chatHistory.push({ role: 'user', content: text, image: imageDataUrl || null });
    saveHistory();
    _lastUserText = text;
    // AI 安全兜底：危机干预优先于一切常规回复
    if(isCrisis(text) && !imageDataUrl){
      finishReply(think, CRISIS_REPLY, '');
      return;
    }
    // 多模态：检查当前服务商是否支持看图
    if(imageDataUrl && !(AI_PROVIDERS[aiCfg.provider] && AI_PROVIDERS[aiCfg.provider].vision)){
      finishReply(think, '当前服务商（' + aiModeName() + '）暂不支持图片理解。可以点右上角 ⚙ 设置，切换到「智谱 GLM」或「通义千问」（都有免费额度），我就能看图啦～', '');
      return;
    }
    if(imageDataUrl && aiCfg.provider !== 'pollinations' && !/(v|vl|vision|4o)/i.test(aiCfg.model)){
      aiCfg.model = AI_PROVIDERS[aiCfg.provider].vision;
      saveAiCfg(); paintAiStatus();
    }
    var useTools = !imageDataUrl && aiCfg.provider !== 'pollinations';
    var localFallback = function(){
      var kwTool = detectTool(text);
      var kwBtns = kwTool ? [{ view: kwTool.view, label: '去「' + (VIEW_NAMES[kwTool.view] || kwTool.name) + '」看看' }] : null;
      finishReply(think, addFollowup(replyFor(text)), '〔AI 接口暂不可用，已切换本地知识库应答〕\n', { buttons: kwBtns });
    };
    if(!(aiCfg.enabled && aiKeyOk())){ localFallback(); return; }
    if(typeof navigator !== 'undefined' && navigator.onLine === false){ localFallback(); return; }
    var msgs = buildMessages();
    // RAG 检索可视化：在思考气泡中展示命中的站内科普条目数
    var hits = searchKB(text);
    _lastHits = hits;
    if(think && hits.length){
      var thinkBubble = think.querySelector('.bubble');
      if(thinkBubble && !think._streamed){
        thinkBubble.innerHTML = '<span class="rag-hint">🔍 已检索到 ' + hits.length + ' 条站内科普资料 · 星语思考中…</span>';
      }
    }
    var pendingButtons = [];
    callAI(msgs, function(content, toolCalls){
      if(toolCalls && toolCalls.length){
        // Function Calling：执行工具 → 回填结果 → 二次请求生成最终回复
        msgs.push({ role: 'assistant', content: content || '', tool_calls: toolCalls });
        (function runTools(i){
          if(i >= toolCalls.length){
            callAI(msgs, function(finalText){
              finishReply(think, finalText, '', { streamed: true, buttons: pendingButtons });
            }, function(err){ localFallback(); }, function(partial){ streamInto(think, partial); }, useTools);
            return;
          }
          var tc = toolCalls[i];
          var args = {};
          try{ args = JSON.parse(tc.function.arguments || '{}'); }catch(e){}
          var result = execTool(tc.function.name, args);
          if(result.button) pendingButtons.push(result.button);
          msgs.push({ role: 'tool', tool_call_id: tc.id, content: result.text });
          runTools(i + 1);
        })(0);
        return;
      }
      // 免费接口不支持 tools 协议：用本地关键词意图识别作为降级，同样给出板块入口按钮
      var kwBtns = pendingButtons.slice();
      if(!imageDataUrl && aiCfg.provider === 'pollinations'){
        var kwTool = detectTool(text);
        if(kwTool) kwBtns.push({ view: kwTool.view, label: '去「' + (VIEW_NAMES[kwTool.view] || kwTool.name) + '」看看' });
      }
      finishReply(think, content, '', { streamed: true, buttons: kwBtns });
    }, function(err){
      localFallback();
    }, function(partial){
      streamInto(think, partial);
    }, useTools);
  }

  // ============ 对外暴露：星空寄语卡片生成（社区板块使用） ============
  window.starWishAI = function(theme, cb){
    if(!(aiCfg.enabled && aiKeyOk()) || (typeof navigator !== 'undefined' && navigator.onLine === false)){ cb(null); return; }
    var msgs = [
      { role: 'system', content: '你为公益科普网站《星夜入眠》生成星空贺卡上的寄语。根据用户给的关键词或心情，写一句温柔、有力量、适合印在星空卡片上的中文寄语。要求：不超过40个字，只输出寄语本身，不要引号、不要解释、不要称呼。风格：温暖、诗意但不做作，可以联系"星星、夜晚、光"的意象。' },
      { role: 'user', content: '关键词/心情：' + (theme || '随机的温柔祝福') }
    ];
    callAI(msgs, function(content, toolCalls){
      var out = (content || '').replace(/^\s+|\s+$/g, '').replace(/^["「']|["」']$/g, '').slice(0, 60);
      cb(out || null);
    }, function(err){ cb(null); }, null, false);
  };

  // ============ RAG 本地知识库（站内科普条目检索） ============
  var KNOWLEDGE_BASE = [
    { t:'什么是自闭症', k:['自闭症','自闭症','是什么','什么是','定义','是病吗','心理疾病','ASD'], c:'自闭症（又叫自闭症，全称"自闭症谱系障碍"，ASD）是一种与生俱来的神经发育差异——说人话就是，他们的大脑处理信息的方式和大多数人不太一样。主要有三个特点：社交沟通有点费劲、兴趣比较专注狭窄、会有重复的小动作或刻板行为。它不是性格内向，不是心理疾病，更不是家长冷漠或教育失败造成的。每个孩子差异很大，有的话多有的话少，有的在某些方面特别有天赋，有的需要长期支持，没有"标准答案"。' },
    { t:'早期信号与干预黄金期', k:['早期','信号','几岁','黄金','干预','表现','症状','怀疑','可能有','怎么办','几个月','几岁发现'], c:'0-6岁是早期干预的黄金期，越早开始，效果越明显。如果宝宝出现这些情况，建议尽早找医生看看：叫名字常常没反应、不会用手指东西给你看、眼神对视少、语言比同龄人慢、喜欢反复做同一个动作。不用自己吓自己，也别拖着，去正规医院儿童发育行为科做个评估最踏实——查出来没事最好，有事早干预。' },
    { t:'常见误区辟谣', k:['误区','谣言','偏见','天才','内向','冷漠','治好','治愈','教育','冷漠的妈妈','冰箱母亲','能治好吗','神童'], c:'几个最常见的误解帮你澄清：①"自闭症孩子都是天才"——其实只有约10%在某些方面有超常能力，大多数孩子需要长期支持，别把个别案例当成全部；②"多带出去玩、多讲道理就能治好"——自闭症目前无法根治，但早期科学干预能显著提升生活自理和社交能力；③"是家长带得不好才这样"——真相是基因和神经发育因素为主，跟家长冷不冷漠、会不会教育没有关系，家长已经很辛苦了。' },
    { t:'如何与星星孩子相处', k:['怎么相处','如何相处','陪伴','沟通','公共场合','情绪','崩溃','爆发','围观','不理解','遇到'], c:'在公共场合遇到星星的孩子，记住这几点就够了：①别盯着看、别拍视频、别贴标签；②如果需要交流，语速慢一点、句子短一点、多等几秒钟——他们可能只是反应慢半拍，不是没礼貌；③如果孩子突然情绪激动哭闹，不要围观、不要指责家长，家长心里已经比谁都着急；④不要突然从背后拍他或抱他，很多孩子对意外触碰非常敏感。一份不打扰的善意，就已经很好了。' },
    { t:'感官敏感是什么', k:['感官','噪音','敏感','怕吵','听觉','视觉','光线','触觉','刺耳','刺眼','为什么怕吵'], c:'很多星星的孩子有感官敏感，简单说就是神经系统对外界信息"放大"了。对我们来说正常的商场广播，在他们耳朵里可能像警笛一样刺耳；普通的灯光可能像闪光灯一样晃眼；别人不小心碰他一下，可能像被针扎一样难受。这不是矫情，也不是故意捣乱，是他们的神经系统天生就这么处理信息。知道这一点，下次遇到就多一份耐心。' },
    { t:'给家长的话', k:['家长','家庭','压力','焦虑','互助','妈妈','爸爸','照顾','疲惫','崩溃','自责'], c:'想跟自闭症孩子的爸爸妈妈说几句：你已经做得很好了，别再自责。这条路很长很难，但是——第一，允许自己累，允许自己求助，照顾好孩子之前先照顾好自己；第二，找到当地的家长互助群体，有人一起聊会轻松很多，别一个人硬扛；第三，干预要坚持，但不用焦虑到每个细节都较劲；第四，家里人分工搭把手，别让妈妈一个人扛。你不是一个人在战斗。' },
    { t:'去哪里评估和求助', k:['政策','补助','补贴','福利','机构','残联','诊断','医院','哪里','求助','哪里评估','康复'], c:'如果你怀疑孩子有这方面需要，可以这样走：第一步，先去正规医院的儿童发育行为科、儿童精神科或心理科做评估诊断；第二步，确诊后联系当地残联，了解康复训练补贴、定点机构和相关福利政策；第三步，全国心理援助热线12356是24小时的，情绪撑不住的时候可以打。温馨提示：本站只做科普，不能替代医生诊断。' },
    { t:'普通人能怎么帮忙', k:['志愿','志愿者','参与','捐款','公益','活动','画展','文创','我能做什么'], c:'普通人不用捐钱也能帮上忙：第一，公共场合多一份耐心，看到星星的孩子别围观别指点；第二，主动了解正确知识，身边有人乱说的时候温和地纠正一下；第三，如果有星星孩子家庭的文创作品，可以多支持。想做志愿者的话要注意：需要经过专业培训才能参与，不能随便接触孩子哦。' },
    { t:'志愿者共情过载', k:['志愿者','共情','过载','心情低落','接触','难过','疲惫','情绪'], c:'你心地善良、共情力强，才会承接别人的苦难和情绪。公益志愿最需要建立情绪边界：我可以帮助，但我不用背负别人的人生。每次志愿服务结束后，主动做一个"抽离仪式"——路上听听歌、到家换件衣服，把工作情绪留在现场。另外，别反复回想让你难受的画面，每天只花几分钟想想今天哪个瞬间是温暖的就够了。你愿意来帮忙，本身就已经很了不起。' },
    { t:'他们长大了会怎样', k:['长大','未来','成年','能上学吗','能工作吗','能独立吗'], c:'很多人关心星星的孩子长大后会怎样。答案是：差异很大。经过早期干预和持续支持，一部分孩子可以正常上学、参加高考、融入职场；也有一部分需要长期的家庭或社会支持。重要的不是"能不能变成正常人"，而是帮助他们发展出适合自己的生活能力，被社会温柔地接纳。' },
    { t:'为什么叫"星星的孩子"', k:['为什么叫','星星的孩子','由来','昵称','别称'], c:'"星星的孩子"是对自闭症孩子的温柔称呼——他们像遥远的星星，在自己的轨道上安静地发光，看起来和我们隔着距离，但每一颗都有自己的光芒。这个称呼提醒我们：不是他们"有问题"，而是他们用自己的方式在这个世界上存在着。' },
    { t:'自闭症会遗传吗', k:['遗传','基因','二胎','再生一个','再生育','家族'], c:'研究显示自闭症有较强的遗传因素：同卵双胞胎共患率较高，已生育一个自闭症孩子的家庭，再生育时风险高于普通人群。但这不等于"一定会遗传"——绝大多数情况下是基因与环境因素复杂交织的结果。如果计划再生育，建议先到正规医院的遗传咨询门诊做专业评估，比上网自己吓自己靠谱得多。' },
    { t:'诊断评估流程', k:['诊断流程','确诊','评估流程','挂什么科','做什么检查','怎么诊断'], c:'一般流程是：先到正规医院的儿童保健科、发育行为儿科或儿童精神科初诊，医生会问发育史、做观察和量表评估（如ADOS、ADI-R等专业工具），部分孩子需要听力检查、智力测验等辅助评估。诊断不是一次定终身，医生通常会建议随访观察。评估时家长如实描述孩子的日常表现最重要，不用教孩子"表演"，也不用刻意隐瞒。' },
    { t:'常见干预方法', k:['ABA','干预方法','康复训练','结构化教学','感统','dtt','回合式'], c:'主流循证干预包括：ABA应用行为分析（把目标拆小、逐步强化）、结构化教学TEACCH（用视觉日程帮孩子建立秩序感）、言语训练、社交技能训练等。没有哪一种方法对所有孩子都最优，关键是有资质、有督导、尊重孩子节奏。警惕"包治好""几天见效"的机构，也谨慎对待未经科学验证的"神奇疗法"。' },
    { t:'融合教育与上学', k:['融合教育','随班就读','上学','幼儿园','普校','特校','影子老师'], c:'自闭症孩子能不能上学？答案是：很多孩子可以，路径也多样——普通幼儿园/小学随班就读（融合教育）、配备资源教师或影子老师辅助、或选择特教学校。政策上"随班就读"有明确支持依据。关键是提前和学校沟通、准备好孩子的能力基础（如基本的课堂规则、表达需求的方式）。每个孩子适合的路径不同，不必和别人比。' },
    { t:'青春期与成年支持', k:['青春期','成年','就业','支持性就业','托养','职前'], c:'星宝也会长大，青春期会面临情绪波动、性教育需求等新课题；成年后的出路包括支持性就业（有辅导员辅助的工作）、庇护性工场、社区托养等。这几年国家在推进大龄星宝的就业与托养服务，各地残联有相关项目。对孩子来说，从小的自理能力训练就是为成年铺路；对家长来说，尽早了解当地成年服务体系会心里更有底。' },
    { t:'怎么向孩子解释自闭症', k:['告诉孩子','怎么解释','同伴','同学问起','班级里'], c:'如果班级里、亲戚家有星星的孩子，可以让孩子这样理解："他的大脑用不一样的方式认识世界，就像有人戴眼镜、有人不戴。他不是不想和你玩，只是需要多一点时间。你慢慢说、不打扰他，就是很棒的朋友。"不用讲深奥的医学术语，孩子比大人想象的更能理解"每个人都不一样"这件事。' },
    { t:'如何向身边人科普', k:['科普','向别人解释','朋友不理解','家人不理解','怎么宣传'], c:'身边有人说"自闭症就是内向/被惯坏了"，可以这样温和纠正：第一，摆事实——它是先天的神经发育差异，和养育方式无关（"冰箱母亲"理论早被推翻）；第二，举例子——就像有人天生近视一样，不是谁的错；第三，给行动建议——"遇到这样的孩子，不围观、不指责、多等几秒就是帮忙"。改变一个人很难，但一次温和的纠正可能比十篇科普文有用。' },
    { t:'自闭症与智力的关系', k:['智力','智商','智力障碍','聪明','天才','超常'], c:'自闭症和智力是两回事。谱系孩子的智力分布和其他人群一样广泛：有的伴随智力障碍，有的智力正常，少数在某方面（绘画、音乐、记忆、计算）有超常能力（约10%）。所以"都是天才"和"都是智力障碍"都是刻板印象。更准确的说法是：他们的能力 profile 很不均匀——可能某方面很强、某方面很弱，需要个性化的支持。' },
    { t:'语言发育迟缓与自闭症', k:['语言发育迟缓','说话晚','不说话','不开口','只会叫妈妈'], c:'孩子说话晚，可能是单纯的语言发育迟缓，也可能是自闭症的表现之一，也可能是听力问题——这正是需要专业评估的原因。一个简单的区分方向：单纯语言迟缓的孩子，通常非语言沟通是好的（会用手指、会用眼神、会互动）；如果同时存在不看、不指、不应答，自闭症的可能性就要认真评估。别在网上对号入座，去医院做一次评估最踏实。' }
  ];
  // ===== RAG 检索升级：字符二元组向量化 + 余弦相似度，与关键词计分混合排序 =====
  function bigramVec(s){
    var t = String(s || '').toLowerCase(), m = {};
    for(var i = 0; i < t.length - 1; i++){
      var g = t.substr(i, 2);
      if(/[\u4e00-\u9fa5a-z0-9]/.test(g.charAt(0)) && /[\u4e00-\u9fa5a-z0-9]/.test(g.charAt(1))) m[g] = (m[g] || 0) + 1;
    }
    return m;
  }
  function cosineSim(a, b){
    var dot = 0, na = 0, nb = 0, k;
    for(k in a){ na += a[k] * a[k]; if(b[k]) dot += a[k] * b[k]; }
    for(k in b){ nb += b[k] * b[k]; }
    if(!na || !nb) return 0;
    return dot / Math.sqrt(na * nb);
  }
  var KB_VECS = null;
  function kbVecs(){
    if(!KB_VECS) KB_VECS = KNOWLEDGE_BASE.map(function(e){ return bigramVec(e.t + ' ' + e.k.join(' ') + ' ' + e.c); });
    return KB_VECS;
  }
  function searchKB(q){
    var t = String(q || '').toLowerCase();
    var qv = bigramVec(q);
    var vecs = kbVecs();
    var scored = [];
    for(var i = 0; i < KNOWLEDGE_BASE.length; i++){
      var e = KNOWLEDGE_BASE[i], kw = 0;
      for(var j = 0; j < e.k.length; j++){ if(t.indexOf(e.k[j].toLowerCase()) >= 0) kw += 2; }
      var sim = cosineSim(qv, vecs[i]);
      var s = kw + sim * 4;
      if(s > 0.3) scored.push({ s: s, e: e });
    }
    scored.sort(function(a, b){ return b.s - a.s; });
    return scored.slice(0, 3).map(function(x){ return x.e; });
  }
  function ragContext(q){
    var hits = searchKB(q);
    if(!hits.length) return '';
    var s = '\n\n【本站知识库参考内容（回答相关问题时优先依据，不要编造数据）】\n';
    for(var i=0;i<hits.length;i++){ s += '- '+hits[i].t+'：'+hits[i].c+'\n'; }
    s += '请这样回答：先用一两句真正接住对方的情绪——他焦虑你就说理解他为什么焦虑，他难过你就说这种感受特别正常，别一上来就讲道理；然后顺着他的具体情况，用聊天的语气自然地把信息讲清楚，不要机械地分"第一第二第三"，不要列提纲，不要用套话结尾；回答要有足够的篇幅把事情说透，不要一两句话就打发，也不要写成说明书；最后可以轻轻带一句鼓励或共情，但不要每句都喊口号。整体像一个温柔、有耐心、真正懂这件事的朋友在跟他面对面聊天。不要学术腔、不要冷冰冰列数据、不要公式化。如果问题本站没有直接资料，可以基于常识温和回应，但不要编造具体数据或医疗建议。\n';
    return s;
  }
  // ============ Function Calling：意图识别 → 跳转站内工具 ============
  var TOOLS = [
    { name:'快速小测验', keys:['小测','测试一下','问卷','测验','了解多少','知识问答','我想测'], view:'science' },
    { name:'留言祝福墙', keys:['留言','祝福','写一句','寄语','送祝福'], view:'community' },
    { name:'电子公益证书', keys:['证书','打卡','完成学习','领证','电子证书'], view:'community' },
    { name:'辟谣专区', keys:['误区','谣言','辟谣','偏见','真的吗','是不是真的'], view:'myth' },
    { name:'政策与救助', keys:['政策','补助','补贴','福利','残联','机构','去哪里','哪里医院','哪里评估'], view:'policy' },
    { name:'真实故事', keys:['故事','案例','真实','家庭日常','他们的一天'], view:'stories' },
    { name:'儿童作品展', keys:['画展','作品','画画','绘画','艺术作品'], view:'gallery' },
    { name:'公益参与', keys:['志愿者','参与公益','捐款','公益活动'], view:'charity' },
    { name:'家庭支持站', keys:['家长怎么办','家庭','压力大','妈妈','家人怎么帮'], view:'family' },
    { name:'行动指南', keys:['怎么相处','如何相处','陪伴','沟通','公共场合遇到'], view:'guide' }
  ];
  function detectTool(q){
    var t = String(q||'');
    for(var i=0;i<TOOLS.length;i++){
      for(var j=0;j<TOOLS[i].keys.length;j++){
        if(t.indexOf(TOOLS[i].keys[j])>=0) return TOOLS[i];
      }
    }
    return null;
  }
