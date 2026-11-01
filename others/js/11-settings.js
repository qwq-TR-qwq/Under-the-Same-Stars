/* ===== 11-settings.js：偏好设置中心（主题外观 / 网页动态效果 / 字号 / 背景音乐） =====
 * 所有个性化调整统一收口在「⚙ 设置」面板（#setMask）里，状态各自持久化到 localStorage：
 *   1) 主题外观    xyn_theme  'dark' | 'light'   → <html class="theme-light">
 *   2) 网页动态效果 xyn_motion '1' | '0'          → <html class="motion-off">
 *      （"减少动效"即原「低刺激模式」：压平动画、停背景音乐/弹幕/视差，保留换页叙事动画）
 *   3) 字号大小    xyn_font   'std' | 'lg'       → <body class="a11y-lg">
 *   4) 背景音乐    与书页右上角音乐按钮（#musicBtn）双向同步
 * 对外 API：window.__set / window.__theme / window.__motion（兼容旧 window.__stim）。
 * 联动事件：document 上的 'theme:change' / 'motion:change'（detail 携带当前状态）。
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;

  function toast(msg) {
    if (typeof window.siteToast === 'function') { window.siteToast(msg); return; }
    var el = document.getElementById('siteToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ================= 1. 主题外观（深色星夜 / 浅色日光） ================= */
  function isLight() { return root.classList.contains('theme-light'); }
  function applyTheme(light, silent) {
    root.classList.toggle('theme-light', light);
    store('xyn_theme', light ? 'light' : 'dark');
    paintSeg('segTheme', light ? 'light' : 'dark');
    document.dispatchEvent(new CustomEvent('theme:change', { detail: { light: light } }));
    if (!silent) toast(light ? '已切换到浅色模式：日光纸白，正文深色更醒目 ☀' : '已切换到深色模式：回到星夜 🌙');
  }

  /* ================= 2. 网页动态效果（原低刺激模式） ================= */
  function isMotionOff() { return root.classList.contains('motion-off'); }
  function applyMotion(on, silent) {
    root.classList.toggle('motion-off', !on);
    store('xyn_motion', on ? '1' : '0');
    paintSeg('segMotion', on ? 'on' : 'off');
    noteInStage(!on);
    document.dispatchEvent(new CustomEvent('motion:change', { detail: { on: on } }));
    if (!silent) toast(on ? '已恢复全部网页动效 ✦' : '已减少动效：动画、背景音乐与弹幕暂停，换页动画保留 🌙');
  }

  // 留言墙弹幕：减少动效下清空滚动弹幕并给出静态说明
  function noteInStage(off) {
    var stage = document.getElementById('mwStage');
    if (!stage) return;
    var note = stage.querySelector('.mw-motion-note');
    if (off) {
      var dms = stage.querySelectorAll('.mw-dm');
      for (var i = 0; i < dms.length; i++) { if (dms[i].parentNode) dms[i].parentNode.removeChild(dms[i]); }
      if (!note) {
        note = document.createElement('div');
        note.className = 'mw-motion-note';
        note.textContent = '已减少网页动效：弹幕滚动暂停，留言仍可正常发布与查看';
        stage.appendChild(note);
      }
    } else if (note && note.parentNode) {
      note.parentNode.removeChild(note);
    }
  }

  /* ================= 3. 字号大小（标准 / 大字） ================= */
  function isLgFont() { return body.classList.contains('a11y-lg'); }
  function applyFont(lg, silent) {
    body.classList.toggle('a11y-lg', lg);
    store('xyn_font', lg ? 'lg' : 'std');
    paintSeg('segFont', lg ? 'lg' : 'std');
    if (!silent) toast(lg ? '已切换为大字模式：正文与标题整体放大 🔍' : '已恢复标准字号');
  }

  /* ================= 4. 背景音乐（与书页音乐按钮同步） ================= */
  function musicBtn() { return document.getElementById('musicBtn'); }
  function isMusicOn() {
    var b = musicBtn();
    if (b) return !b.classList.contains('off');
    return typeof window.musicOn === 'undefined' ? true : !!window.musicOn;
  }
  function applyMusic(on, silent) {
    var b = musicBtn();
    if (!b) return;
    if (isMusicOn() !== on) b.click();   // 复用书页开关逻辑（含动效关闭时的引导提示）
    paintSeg('segMusic', isMusicOn() ? 'on' : 'off');   // 以实际状态回显（减少动效时音乐强制关闭）
    if (!silent && isMotionOff() && on) toast('减少动效模式下背景音乐保持关闭；如需音乐请先把动态效果设为「开启全部动效」');
  }

  /* ================= 设置面板（#setMask） ================= */
  var mask = null;
  function openPanel() {
    mask = mask || document.getElementById('setMask');
    if (!mask) return;
    paintAll();
    mask.classList.add('open');
  }
  function closePanel() { if (mask) mask.classList.remove('open'); }

  function paintSeg(id, val) {
    var seg = document.getElementById(id);
    if (!seg) return;
    var btns = seg.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-v') === val;
      btns[i].classList.toggle('on', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  function paintAll() {
    paintSeg('segTheme', isLight() ? 'light' : 'dark');
    paintSeg('segMotion', isMotionOff() ? 'off' : 'on');
    paintSeg('segFont', isLgFont() ? 'lg' : 'std');
    paintSeg('segMusic', isMusicOn() ? 'on' : 'off');
  }

  function bindSeg(id, fn) {
    var seg = document.getElementById(id);
    if (!seg) return;
    seg.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b || !seg.contains(b)) return;
      e.stopPropagation();
      fn(b.getAttribute('data-v'));
    }, false);
  }

  function init() {
    mask = document.getElementById('setMask');
    var openBtns = [document.getElementById('settingsBtn'), document.getElementById('settingsFab')];
    openBtns.forEach(function (b) {
      if (!b) return;
      b.addEventListener('click', function (e) { e.stopPropagation(); openPanel(); }, false);
    });
    if (mask) {
      mask.addEventListener('click', function (e) {
        if (e.target === mask) closePanel();
      }, false);
      var closeBtn = document.getElementById('setClose');
      if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closePanel(); }, false);
    }

    bindSeg('segTheme', function (v) { if ((v === 'light') !== isLight()) applyTheme(v === 'light', false); });
    bindSeg('segMotion', function (v) { if ((v === 'off') !== isMotionOff()) applyMotion(v === 'on', false); });
    bindSeg('segFont', function (v) { if ((v === 'lg') !== isLgFont()) applyFont(v === 'lg', false); });
    bindSeg('segMusic', function (v) { if ((v === 'on') !== isMusicOn()) applyMusic(v === 'on', false); });

    // 音乐状态可能被书页按钮直接改变：面板打开时以按钮实际状态为准
    document.addEventListener('motion:change', function () { if (mask && mask.classList.contains('open')) paintAll(); }, false);

    paintAll();
    noteInStage(isMotionOff());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, false);
  else init();

  // 键盘快捷键：Shift + L 快速切换动态效果（给不方便找设置入口的人留一条路）
  document.addEventListener('keydown', function (e) {
    if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'L' || e.key === 'l')) {
      var t = e.target;
      var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || (t && t.isContentEditable)) return;
      e.preventDefault();
      applyMotion(isMotionOff(), false);   // 当前已减少 → 恢复；当前全开 → 减少
    }
  }, false);

  /* ================= 对外 API ================= */
  window.__motion = {
    isOff: isMotionOff,
    set: function (on) { applyMotion(!!on, true); },
    toggle: function () { applyMotion(isMotionOff(), false); }
  };
  window.__stim = window.__motion;   // 兼容旧引用
  window.__theme = {
    isLight: isLight,
    set: function (light) { applyTheme(!!light, true); },
    toggle: function () { applyTheme(!isLight(), false); }
  };
  window.__set = { open: openPanel, close: closePanel };
})();
