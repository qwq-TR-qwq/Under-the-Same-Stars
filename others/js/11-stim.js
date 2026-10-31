/* ===== 11-stim.js：全站低刺激模式（感官友好） =====
 * 面向自闭症谱系与感官敏感人群：一键降低动态视觉、背景音与弹幕刺激。
 * 状态统一写在 <html class="stim-low"> 上，任何模块都能用
 * document.documentElement.classList.contains('stim-low') 查询，
 * 不依赖脚本加载顺序，也不会出现"各页表现不一致"。
 * 与其他模块的联动通过 document 上的 'stim:change' 事件完成。
 */
(function () {
  'use strict';

  var KEY = 'xyn_low_stim';
  var root = document.documentElement;
  var toggles = Array.prototype.slice.call(document.querySelectorAll('.low-stim-toggle'));

  function isOn() { return root.classList.contains('stim-low'); }

  function toast(msg) {
    if (typeof window.siteToast === 'function') { window.siteToast(msg); return; }
    var el = document.getElementById('siteToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function paint() {
    var on = isOn();
    toggles.forEach(function (b) {
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (b.getAttribute('data-stim-text') === '1') {
        b.textContent = on ? '🌙 低刺激：开' : '🌙 低刺激：关';
      }
      b.title = on
        ? '已开启低刺激：动态效果、背景音乐与弹幕已暂停，点击恢复正常'
        : '低刺激模式：暂停动态效果、背景音乐与弹幕滚动，适合感官敏感人群';
    });
  }

  // 留言墙弹幕：低刺激下清空滚动弹幕并给出静态说明
  function noteInStage(on) {
    var stage = document.getElementById('mwStage');
    if (!stage) return;
    var note = stage.querySelector('.mw-stim-note');
    if (on) {
      var dms = stage.querySelectorAll('.mw-dm');
      for (var i = 0; i < dms.length; i++) { if (dms[i].parentNode) dms[i].parentNode.removeChild(dms[i]); }
      if (!note) {
        note = document.createElement('div');
        note.className = 'mw-stim-note';
        note.textContent = '🌙 低刺激模式：弹幕滚动已暂停，留言仍可正常发布与查看';
        stage.appendChild(note);
      }
    } else if (note && note.parentNode) {
      note.parentNode.removeChild(note);
    }
  }

  function apply(on, silent) {
    root.classList.toggle('stim-low', on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    paint();
    noteInStage(on);
    document.dispatchEvent(new CustomEvent('stim:change', { detail: { on: on } }));
    if (silent) return;
    toast(on ? '已开启低刺激模式：动效、背景音乐与弹幕已暂停 🌙' : '已恢复常规模式 ✦');
  }

  toggles.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      apply(!isOn(), false);
    }, false);
  });

  // 键盘快捷键：Shift + L（给不方便找按钮的人留一条路）
  document.addEventListener('keydown', function (e) {
    if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'L' || e.key === 'l')) {
      var t = e.target;
      var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || (t && t.isContentEditable)) return;
      e.preventDefault();
      apply(!isOn(), false);
    }
  }, false);

  paint();
  noteInStage(isOn());

  window.__stim = {
    isOn: isOn,
    set: function (on) { apply(!!on, true); },
    toggle: function () { apply(!isOn(), false); }
  };
})();
