/* ===== 09-voice.js：星语播报声线（默认温柔女声 · 音色/语速/音调个性化） =====
 * 职责：
 *   1) 统一管理朗读（speechSynthesis）的选音、语速、音调，默认挑温柔中文女声；
 *   2) 朗读前清洗文本：括号里的提示/注释、markdown 符号、emoji、链接一律不读；
 *   3) 提供 window.__starVoice 给 02/03 调用（点击 🔊 与自动朗读共用同一套声线）。
 * 配置存放：localStorage['xingya_voice_cfg_v1']
 */
(function () {
  'use strict';

  var KEY = 'xingya_voice_cfg_v1';
  var HAS_TTS = ('speechSynthesis' in window) && (typeof SpeechSynthesisUtterance !== 'undefined');

  // ---- 音色预设：hints 按优先级排列，用于在系统语音里找最贴近的那个 ----
  var PRESETS = [
    { id: 'gentle', name: '温柔女声（默认）', rate: 0.92, pitch: 1.06, hints: [
      'xiaoxiao', 'xiaoyi', 'xiaohan', 'xiaomo', 'xiaorui', 'xiaoshuang',
      'huihui', 'yaoyao', 'tingting', 'meijia', 'yating', 'sinji', 'hiugaai',
      '晓晓', '晓伊', '晓涵', '晓墨', '慧慧', '瑶瑶', '婷婷', '美佳', '小艺',
      'female', '女'
    ] },
    { id: 'whisper', name: '轻声细语（更慢更轻）', rate: 0.82, pitch: 1.02, hints: [
      'xiaoxiao', 'xiaoyi', 'huihui', 'yaoyao', 'tingting', 'meijia',
      '晓晓', '晓伊', '慧慧', '瑶瑶', '婷婷', '美佳', 'female', '女'
    ] },
    { id: 'bright', name: '明亮少女（清亮一点）', rate: 1.06, pitch: 1.22, hints: [
      'xiaoxuan', 'xiaoyan', 'xiaomeng', 'xiaoxiao', 'xiaoyi', 'huihui', 'yaoyao',
      '晓萱', '晓颜', '晓梦', '晓晓', '晓伊', '慧慧', '瑶瑶', 'female', '女'
    ] },
    { id: 'calm', name: '沉稳旁白（中性低沉）', rate: 0.98, pitch: 0.94, hints: [
      'yunxi', 'yunjian', 'yunyang', 'kangkang', 'yunxia', 'male',
      '云希', '云健', '云扬', '康康', '男'
    ] }
  ];

  var cfg = { preset: 'gentle', voiceURI: '', rate: 0.92, pitch: 1.06, auto: false };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (typeof saved.preset === 'string') cfg.preset = saved.preset;
      if (typeof saved.voiceURI === 'string') cfg.voiceURI = saved.voiceURI;
      if (typeof saved.rate === 'number') cfg.rate = saved.rate;
      if (typeof saved.pitch === 'number') cfg.pitch = saved.pitch;
      if (typeof saved.auto === 'boolean') cfg.auto = saved.auto;
    }
  } catch (e) {}
  if (!presetOf(cfg.preset)) cfg.preset = 'gentle';

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
  // 选音：用户指定 > 预设 hints 命中 > 第一个中文语音 > 系统默认
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
    for (var h = 0; h < p.hints.length; h++) {
      for (var j = 0; j < pool.length; j++) {
        if (String(pool[j].name || '').toLowerCase().indexOf(p.hints[h].toLowerCase()) >= 0) return pool[j];
      }
    }
    return pool[0];
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
    // 括号内容：连续两轮，兼顾一层嵌套
    for (var i = 0; i < 2; i++) { t = t.replace(PROMPT_PAT, ' '); }
    t = t.replace(/[*_`#>~|]+/g, ' ');                      // markdown 符号
    t = t.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ');  // emoji（代理对）
    t = t.replace(/[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F\u200D]/g, ' ');
    t = t.replace(/^[\s·•▪◦\-–—*+]+/gm, '');                // 行首项目符号
    t = t.replace(/[ \t\u3000]+/g, ' ');
    t = t.replace(/\n{2,}/g, '\n');
    return t.replace(/^\s+|\s+$/g, '');
  }
  // 超长文本按句末截断，避免念到一半被硬切
  function trimSentence(t, max) {
    if (t.length <= max) return t;
    var cut = t.slice(0, max);
    var m = cut.match(/[\s\S]*[。！？!?；;\n]/);
    return (m ? m[0] : cut).replace(/^\s+|\s+$/g, '');
  }

  // ---- 朗读 / 停止 ----
  var speakingFlag = false;
  var keepAlive = 0;
  function speak(text, cb) {
    cb = typeof cb === 'function' ? cb : function () {};
    if (!HAS_TTS) { cb(false); return; }
    var say = cleanForSpeech(text);
    if (!say) { cb(false); return; }
    say = trimSentence(say, 1200);
    try { window.speechSynthesis.cancel(); } catch (e) {}
    stopKeepAlive();
    var u = new SpeechSynthesisUtterance(say);
    var v = resolveVoice();
    if (v) { u.voice = v; u.lang = v.lang || 'zh-CN'; } else { u.lang = 'zh-CN'; }
    u.rate = clamp(cfg.rate, 0.6, 1.6);
    u.pitch = clamp(cfg.pitch, 0.5, 1.6);
    u.volume = 1;
    u.onstart = function () { speakingFlag = true; startKeepAlive(); };
    u.onend = function () { speakingFlag = false; stopKeepAlive(); cb(false); };
    u.onerror = function () { speakingFlag = false; stopKeepAlive(); cb(false); };
    speakingFlag = true;
    try { window.speechSynthesis.speak(u); cb(true); } catch (e) { speakingFlag = false; cb(false); }
  }
  // Chrome 桌面端长文本约 15 秒会停，定时 resume 兜底
  function startKeepAlive() {
    stopKeepAlive();
    keepAlive = setInterval(function () {
      try {
        if (!window.speechSynthesis.speaking) { stopKeepAlive(); return; }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } catch (e) { stopKeepAlive(); }
    }, 10000);
  }
  function stopKeepAlive() { if (keepAlive) { clearInterval(keepAlive); keepAlive = 0; } }
  function stop() {
    if (!HAS_TTS) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    speakingFlag = false;
    stopKeepAlive();
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
    var html = '<option value="">跟随音色预设（推荐）</option>';
    for (var i = 0; i < pool.length; i++) {
      var v = pool[i];
      var label = String(v.name || '语音 ' + (i + 1)) + (v.lang ? '（' + v.lang + '）' : '');
      html += '<option value="' + String(v.voiceURI || v.name).replace(/"/g, '&quot;') + '">' + label + '</option>';
    }
    elName.innerHTML = html;
    elName.value = cfg.voiceURI || '';
    elName.disabled = false;
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
      speak('晚上好，我是星语。今天也辛苦了，慢慢说，我一直在听。（这句括号里的提示不会被朗读）', function (on) {
        elTest.textContent = on ? '停止试听' : '试听这段声音';
      });
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

  // 声音暂停/恢复：页面隐藏时停掉朗读，避免后台一直念
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
  }, false);

  window.__starVoice = {
    speak: speak,
    stop: stop,
    isSpeaking: isSpeaking,
    auto: function () { return !!cfg.auto; },
    clean: cleanForSpeech,
    cfg: cfg
  };
})();
