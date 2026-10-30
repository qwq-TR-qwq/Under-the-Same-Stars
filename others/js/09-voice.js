/* ===== 09-voice.js：星语播报声线（温柔女声 / 温润男声 · 尽量接近真人） =====
 * 职责：
 *   1) 统一管理朗读（speechSynthesis）的选音、语速、音调，默认挑温柔中文女声；
 *   2) 尽量去掉"人机感"：优先选用系统里最自然的神经语音（Natural / Neural / Online），
 *      按句分段合成、句间留自然停顿，语速音调默认贴近真人说话；
 *   3) 朗读前清洗文本：括号里的提示/注释、markdown 符号、emoji、链接一律不读；
 *   4) 提供 window.__starVoice 给 02/03 调用（点击 🔊 与自动朗读共用同一套声线）。
 * 配置存放：localStorage['xingya_voice_cfg_v1']
 */
(function () {
  'use strict';

  var KEY = 'xingya_voice_cfg_v1';
  var CFG_VER = 2;
  var HAS_TTS = ('speechSynthesis' in window) && (typeof SpeechSynthesisUtterance !== 'undefined');

  // ---- 音色预设：hints 按优先级排列，用于在系统语音里找最贴近的那个 ----
  // ---- 男声候选：拼音与中文并收（Edge 的在线语音以中文名出现，如"云希"） ----
  var MALE_WARM = ['yunxi', '云希', 'yunze', '云泽', 'yunfeng', '云枫', 'yunjian', '云健',
    'yunyang', '云扬', 'yunxia', '云夏', 'kangkang', '康康', 'male', '男'];
  var MALE_DEEP = ['yunjian', '云健', 'yunyang', '云扬', 'yunhao', '云皓', 'yunye', '云野',
    'yunlong', '云龙', '雲龍', 'yunzhe', '云哲', '雲哲', 'kangkang', '康康',
    'yunxi', '云希', 'male', '男'];
  var MALE_ALL = MALE_WARM.concat(MALE_DEEP, ['xiaobei', '晓北', '曉北']);
  var FEMALE_HINTS = [
    'xiaoxiao', '晓晓', 'xiaoyi', '晓伊', 'xiaohan', '晓涵', 'xiaomo', '晓墨',
    'xiaorui', 'xiaoshuang', 'xiaoni', '晓妮', 'huihui', '慧慧', 'yaoyao', '瑶瑶',
    'tingting', '婷婷', 'meijia', '美佳', 'yating', '雅婷', 'sinji', 'hiugaai',
    'xiaoman', '晓曼', 'xiaoyu', '晓雨', 'xiaozhen', '晓臻', 'xiaojia', '晓佳',
    'xiaoyan', '晓颜', 'xiaoxuan', '晓萱',
    'female', '女'
  ];
  var PRESETS = [
    { id: 'gentle', name: '温柔女声（默认）', rate: 0.94, pitch: 1.0, hints: FEMALE_HINTS },
    { id: 'whisper', name: '轻声细语（更慢更轻）', rate: 0.86, pitch: 1.0, hints: FEMALE_HINTS },
    { id: 'bright', name: '明亮少女（清亮一点）', rate: 1.02, pitch: 1.1, hints: FEMALE_HINTS },
    { id: 'mellow', name: '温润男声（自然亲和）', rate: 0.95, pitch: 0.96, hints: MALE_WARM },
    { id: 'deep', name: '低沉男声（稳重安抚）', rate: 0.9, pitch: 0.88, hints: MALE_DEEP },
    { id: 'calm', name: '沉稳旁白（中性低沉）', rate: 0.96, pitch: 0.92, hints: MALE_DEEP }
  ];

  var cfg = { v: CFG_VER, preset: 'gentle', voiceURI: '', rate: 0.94, pitch: 1.0, auto: false };
  var savedV = 0;
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (typeof saved.preset === 'string') cfg.preset = saved.preset;
      if (typeof saved.voiceURI === 'string') cfg.voiceURI = saved.voiceURI;
      if (typeof saved.auto === 'boolean') cfg.auto = saved.auto;
      if (typeof saved.v === 'number') savedV = saved.v;
      // 旧版配置的语速/音调偏"电子味"（pitch 1.06），升级到 v2 时回到新版预设默认值
      if (savedV === CFG_VER) {
        if (typeof saved.rate === 'number') cfg.rate = saved.rate;
        if (typeof saved.pitch === 'number') cfg.pitch = saved.pitch;
      }
    }
  } catch (e) {}
  if (!presetOf(cfg.preset)) cfg.preset = 'gentle';
  if (savedV !== CFG_VER) {
    var _p = presetOf(cfg.preset);
    cfg.rate = _p.rate;
    cfg.pitch = _p.pitch;
  }

  function presetOf(id) {
    for (var i = 0; i < PRESETS.length; i++) { if (PRESETS[i].id === id) return PRESETS[i]; }
    return null;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }
  function clamp(n, a, b) { n = Number(n); if (!isFinite(n)) n = a; return Math.min(b, Math.max(a, n)); }

  // ---- 系统语音列表（部分浏览器异步加载，需监听 voiceschanged） ----
  var cache = [];
  function refreshVoices() {
    if (!HAS_TTS) return cache;
    try { cache = window.speechSynthesis.getVoices() || []; } catch (e) { cache = []; }
    return cache;
  }
  function isZh(v) {
    var lang = String(v.lang || '');
    var name = String(v.name || '');
    return /^zh/i.test(lang) || /chinese|mandarin|中文|普通话|國語|国语/i.test(name);
  }
  function zhVoices() {
    var list = refreshVoices();
    var zh = [];
    for (var i = 0; i < list.length; i++) { if (isZh(list[i])) zh.push(list[i]); }
    return zh;
  }
  function isMaleVoice(v) {
    var n = String(v.name || '').toLowerCase();
    for (var i = 0; i < MALE_ALL.length; i++) { if (n.indexOf(MALE_ALL[i].toLowerCase()) >= 0) return true; }
    return false;
  }
  // 自然度打分：神经语音（Natural/Neural/Online）远好于老式 SAPI 桌面语音
  function naturalScore(v) {
    var n = (String(v.name || '') + ' ' + String(v.voiceURI || '')).toLowerCase();
    var s = 0;
    if (/natural|neural|online|premium|enhanced|神经/.test(n)) s += 12;
    if (/google/.test(n)) s += 6;          // Chrome 内置普通话，韵律较自然
    if (/microsoft/.test(n)) s += 2;
    if (/desktop|sapi|espeak|compact/.test(n)) s -= 4;
    return s;
  }
  // 普通话优先：粤语 / 台普等其他中文变体降权，避免男声预设落到听不懂的方言上
  function mandarinScore(v) {
    var lang = String(v.lang || '').toLowerCase().replace('_', '-');
    var n = String(v.name || '').toLowerCase();
    if (lang.indexOf('zh-cn') === 0 || lang.indexOf('zh-hans') === 0) return 8;
    if (/mandarin, simplified|普通话/.test(n)) return 8;
    if (/cantonese|粤|粵|hong kong|zh-hk|zh-yue/.test(n + ' ' + lang)) return -10;
    if (/taiwan|zh-tw|國語/.test(n + ' ' + lang)) return -4;
    return 0;
  }
  // 选音：用户指定 > 预设 hints 命中（同分取最自然的）> 最自然的中文语音 > 系统默认
  function resolveVoice() {
    var list = refreshVoices();
    if (!list.length) return null;
    if (cfg.voiceURI) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].voiceURI === cfg.voiceURI || list[i].name === cfg.voiceURI) return list[i];
      }
    }
    var pool = zhVoices();
    if (!pool.length) pool = list;
    var p = presetOf(cfg.preset) || PRESETS[0];
    var wantMale = (p.hints === MALE_WARM || p.hints === MALE_DEEP);
    var best = null, bestScore = -999;
    for (var h = 0; h < p.hints.length; h++) {
      for (var j = 0; j < pool.length; j++) {
        var name = String(pool[j].name || '').toLowerCase();
        if (name.indexOf(p.hints[h].toLowerCase()) < 0) continue;
        // 命中越靠前的 hint 越贴题；同 hint 内按自然度 + 普通话优先取更高者
        var score = (p.hints.length - h) * 100 + naturalScore(pool[j]) + mandarinScore(pool[j]);
        if (score > bestScore) { bestScore = score; best = pool[j]; }
      }
    }
    if (best) return best;
    // 兜底：按自然度挑一个（男声预设尽量避开明显女声与方言）
    var fallback = null, fbScore = -999;
    for (var k = 0; k < pool.length; k++) {
      var sc = naturalScore(pool[k]) + mandarinScore(pool[k]);
      if (wantMale && !isMaleVoice(pool[k])) sc -= 20;
      if (sc > fbScore) { fbScore = sc; fallback = pool[k]; }
    }
    return fallback || pool[0];
  }

  // ---- 朗读文本清洗：括号注释 / markdown / emoji / 链接 都不念 ----
  var PROMPT_PAT = /（[^（）]*）|\([^()]*\)|【[^【】]*】|〔[^〔〕]*〕|\[[^\[\]]*\]/g;
  function cleanForSpeech(s) {
    var t = String(s == null ? '' : s);
    if (!t) return '';
    t = t.replace(/```[\s\S]*?```/g, ' ');
    t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');           // 图片
    t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');          // 链接保留文字
    t = t.replace(/https?:\/\/\S+/g, ' ');
    for (var i = 0; i < 2; i++) { t = t.replace(PROMPT_PAT, ' '); }   // 兼顾一层嵌套
    t = t.replace(/[*_`#>~|]+/g, ' ');                      // markdown 符号
    t = t.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ');  // emoji（代理对）
    t = t.replace(/[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F\u200D]/g, ' ');
    t = t.replace(/^[\s·•▪◦\-–—*+]+/gm, '');                // 行首项目符号
    t = t.replace(/[ \t\u3000]+/g, ' ');
    t = t.replace(/\n{2,}/g, '\n');
    return t.replace(/^\s+|\s+$/g, '');
  }

  // ---- 分段：按句切，短句合并、长句按逗号再切，读起来才有呼吸感 ----
  function splitForSpeech(text) {
    var arr = String(text).match(/[^。！？!?；;\n]+[。！？!?；;]?/g) || [String(text)];
    var merged = [], buf = '';
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i].replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
      if (!s) continue;
      buf += s;
      if (buf.length >= 26 || /[。！？!?；;]$/.test(s)) { merged.push(buf); buf = ''; }
    }
    if (buf) merged.push(buf);
    var out = [];
    for (var j = 0; j < merged.length; j++) {
      var seg = merged[j];
      while (seg.length > 80) {
        var cut = seg.lastIndexOf('，', 80);
        if (cut < 20) cut = 80;
        out.push(seg.slice(0, cut + 1));
        seg = seg.slice(cut + 1);
      }
      if (seg.replace(/\s/g, '')) out.push(seg);
    }
    return out.length ? out : [String(text)];
  }

  // ---- 朗读 / 停止（分段合成 + 句间停顿，降低机械感） ----
  var speakingFlag = false;
  var seq = 0;
  var activeCb = null;   // 当前这段朗读的状态回调，stop 时也要通知它，按钮才不会卡在“停止”态
  var activeSrc = '';    // 朗读来源：chat（回复朗读）/ test（设置面板试听）
  function speak(text, cb, src) {
    cb = typeof cb === 'function' ? cb : function () {};
    if (!HAS_TTS) { cb(false); return; }
    var say = cleanForSpeech(text);
    if (!say) { cb(false); return; }
    // 回复朗读只在对话页有效：自动朗读的延时触发若已离开对话页，直接丢弃
    if ((src || 'chat') === 'chat' && !inChatView()) { cb(false); return; }
    if (say.length > 1500) say = say.slice(0, 1500);
    // 打断上一段前，先让它把按钮状态复位
    if (activeCb) { var prev = activeCb; activeCb = null; activeSrc = ''; try { prev(false); } catch (e) {} }
    var mySeq = ++seq;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    var voice = resolveVoice();
    var parts = splitForSpeech(say);
    var i = 0;
    speakingFlag = true;
    activeCb = cb;
    activeSrc = src || 'chat';
    function end(on) {
      var f = activeCb;
      activeCb = null; activeSrc = '';
      if (f) { try { f(on); } catch (e) {} }
    }
    cb(true);
    function next() {
      if (mySeq !== seq) return;
      if (i >= parts.length) { speakingFlag = false; end(false); return; }
      var seg = parts[i++];
      var u = new SpeechSynthesisUtterance(seg);
      if (voice) { u.voice = voice; u.lang = voice.lang || 'zh-CN'; } else { u.lang = 'zh-CN'; }
      u.rate = clamp(cfg.rate, 0.6, 1.6);
      u.pitch = clamp(cfg.pitch, 0.5, 1.6);
      u.volume = 1;
      // 句间留白：句号停久一点，逗号短一点 —— 这是"像真人"的关键
      var gap = /[。！？!?]$/.test(seg) ? 260 : 150;
      var guard = 0;
      function done(ok) {
        if (guard) { clearTimeout(guard); guard = 0; }
        if (mySeq !== seq) return;
        if (!ok) { speakingFlag = false; end(false); return; }
        setTimeout(next, gap);
      }
      u.onend = function () { done(true); };
      u.onerror = function () { done(false); };
      // 兜底：个别浏览器不触发 onend，按字数估时接管，避免卡住
      guard = setTimeout(function () { guard = 0; done(true); }, Math.round(seg.length * 300 / clamp(cfg.rate, 0.6, 1.6)) + 4000);
      try { window.speechSynthesis.speak(u); }
      catch (e) { done(false); }
    }
    next();
  }
  function stop() {
    seq++;
    if (HAS_TTS) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    speakingFlag = false;
    // 关键：主动打断时也要通知状态回调，否则按钮会一直停在“⏹ 停止朗读”
    var f = activeCb;
    activeCb = null; activeSrc = '';
    if (f) { try { f(false); } catch (e) {} }
  }
  function isSpeaking() {
    if (!HAS_TTS) return false;
    try { return speakingFlag || window.speechSynthesis.speaking; } catch (e) { return speakingFlag; }
  }

  // ---- 设置面板绑定 ----
  var elPreset = document.getElementById('voicePreset');
  var elName = document.getElementById('voiceName');
  var elRate = document.getElementById('voiceRate');
  var elPitch = document.getElementById('voicePitch');
  var elRateVal = document.getElementById('voiceRateVal');
  var elPitchVal = document.getElementById('voicePitchVal');
  var elAuto = document.getElementById('voiceAuto');
  var elTest = document.getElementById('voiceTest');
  var voiceBox = document.querySelector('.voice-box');

  function fmtRate(v) { return (Math.round(v * 100) / 100).toFixed(2) + '×'; }
  function fmtPitch(v) { return (Math.round(v * 100) / 100).toFixed(2); }

  function paintPresets() {
    if (!elPreset) return;
    var html = '';
    for (var i = 0; i < PRESETS.length; i++) {
      html += '<option value="' + PRESETS[i].id + '">' + PRESETS[i].name + '</option>';
    }
    elPreset.innerHTML = html;
    elPreset.value = cfg.preset;
  }
  function paintVoiceList() {
    if (!elName) return;
    var list = refreshVoices();
    var zh = zhVoices();
    var pool = zh.length ? zh : list;
    // 按自然度排序：最像真人的排在前面
    pool = pool.slice().sort(function (a, b) { return naturalScore(b) - naturalScore(a); });
    var html = '<option value="">跟随音色预设（推荐）</option>';
    for (var i = 0; i < pool.length; i++) {
      var v = pool[i];
      var label = String(v.name || '语音 ' + (i + 1)) + (v.lang ? '（' + v.lang + '）' : '');
      if (isMaleVoice(v)) label += ' · 男声';
      html += '<option value="' + String(v.voiceURI || v.name).replace(/"/g, '&quot;') + '">' + label + '</option>';
    }
    elName.innerHTML = html;
    elName.value = cfg.voiceURI || '';
  }
  function paintSliders() {
    if (elRate) elRate.value = cfg.rate;
    if (elPitch) elPitch.value = cfg.pitch;
    if (elRateVal) elRateVal.textContent = fmtRate(cfg.rate);
    if (elPitchVal) elPitchVal.textContent = fmtPitch(cfg.pitch);
  }
  function paintAll() { paintPresets(); paintVoiceList(); paintSliders(); if (elAuto) elAuto.checked = !!cfg.auto; }

  if (elPreset) {
    elPreset.addEventListener('change', function () {
      var p = presetOf(elPreset.value) || PRESETS[0];
      cfg.preset = p.id;
      cfg.rate = p.rate;
      cfg.pitch = p.pitch;
      cfg.v = CFG_VER;
      paintSliders();
      save();
    }, false);
  }
  if (elName) {
    elName.addEventListener('change', function () { cfg.voiceURI = elName.value || ''; save(); }, false);
  }
  if (elRate) {
    elRate.addEventListener('input', function () {
      cfg.rate = clamp(elRate.value, 0.7, 1.3);
      if (elRateVal) elRateVal.textContent = fmtRate(cfg.rate);
      save();
    }, false);
  }
  if (elPitch) {
    elPitch.addEventListener('input', function () {
      cfg.pitch = clamp(elPitch.value, 0.7, 1.4);
      if (elPitchVal) elPitchVal.textContent = fmtPitch(cfg.pitch);
      save();
    }, false);
  }
  if (elAuto) {
    elAuto.addEventListener('change', function () { cfg.auto = !!elAuto.checked; save(); }, false);
  }
  if (elTest) {
    elTest.addEventListener('click', function () {
      if (isSpeaking()) { stop(); elTest.textContent = '试听这段声音'; return; }
      elTest.textContent = '停止试听';
      speak('晚上好，我是星语。今天辛苦了，慢慢说，我一直在听。不用急着把话说完整，想到哪儿说到哪儿就好。（这句括号里的提示不会被朗读）', function (on) {
        elTest.textContent = on ? '停止试听' : '试听这段声音';
      }, 'test');
    }, false);
  }

  if (HAS_TTS) {
    paintAll();
    refreshVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', function () { paintVoiceList(); }, false);
    } else {
      window.speechSynthesis.onvoiceschanged = function () { paintVoiceList(); };
    }
    // 部分浏览器首次 getVoices 为空，延迟再取一次
    setTimeout(function () { paintVoiceList(); }, 400);
    setTimeout(function () { paintVoiceList(); }, 1500);
  } else if (voiceBox) {
    voiceBox.style.display = 'none';
  }

  // 页面隐藏时停掉朗读，避免后台一直念
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
  }, false);

  // ---- 离开对话页立即停止朗读 ----
  // 覆盖三种离开方式：翻回前面的书页、点导航切到别的板块、切到首页。
  // 只在“本来在对话页、现在不在了”这一跳变时停，避免误伤正常朗读。
  function inChatView() {
    var b = document.body;
    return b.classList.contains('book-on') && b.classList.contains('chat-open');
  }
  var wasInChat = inChatView();
  function checkLeaveChat() {
    var now = inChatView();
    if (wasInChat && !now) stop();
    wasInChat = now;
  }
  if (window.MutationObserver) {
    try {
      new MutationObserver(checkLeaveChat).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
  }
  // 兜底：点击/方向键翻页后延时复查（无 MutationObserver 的环境也能停）
  document.addEventListener('click', function () { setTimeout(checkLeaveChat, 80); }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      setTimeout(checkLeaveChat, 80);
    }
  }, true);
  window.addEventListener('hashchange', function () { setTimeout(checkLeaveChat, 80); }, false);

  // 设置面板关闭时，若还在试听就停掉
  var aiMask = document.getElementById('aiMask');
  if (aiMask && window.MutationObserver) {
    try {
      new MutationObserver(function () {
        if (!aiMask.classList.contains('open') && activeSrc === 'test') stop();
      }).observe(aiMask, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
  }

  window.__starVoice = {
    speak: speak,
    stop: stop,
    isSpeaking: isSpeaking,
    auto: function () { return !!cfg.auto; },
    clean: cleanForSpeech,
    split: splitForSpeech,
    cfg: cfg
  };
})();
