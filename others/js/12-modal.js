/* ===== 12-modal.js：浮层无障碍统一接管（焦点陷阱 / ESC / 焦点归还 / 滚动锁定） =====
 * 零侵入：不改任何业务模块的开关函数，用 MutationObserver 监听各浮层
 * class 的 open/on 切换，自动完成：
 *   1) 打开时：记住触发焦点 → 焦点移入浮层 → 锁定 body 滚动
 *   2) Tab 在浮层内循环，不会跑到浮层背后的页面
 *   3) ESC 关闭（点各浮层自己的关闭按钮，业务状态不会错乱）
 *   4) 关闭时：解锁滚动 → 焦点归还触发按钮
 * 接入范围：AI设置 #aiMask / 家长专区 #familyMask / 测评 #testMask
 *           科普话题 #topicMask / 感官体验 #senseOverlay
 */
(function () {
  'use strict';

  var OPEN_CLASSES = ['open', 'on'];
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var CLOSE_BTN = {
    aiMask: '#aiMaskClose',
    familyMask: '#familyClose',
    clinicMask: '#clinicClose',
    testMask: '#testClose',
    topicMask: '#topicBack',
    senseOverlay: '#senseClose'
  };

  var active = null;      // 当前激活浮层
  var lastFocus = null;   // 打开前的焦点元素

  function isOpen(el) {
    for (var i = 0; i < OPEN_CLASSES.length; i++) { if (el.classList.contains(OPEN_CLASSES[i])) return true; }
    return false;
  }

  function focusableIn(el) {
    var list = el.querySelectorAll(FOCUSABLE);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (r.width > 0 || r.height > 0 || list[i].offsetParent) out.push(list[i]);
    }
    // 兜底：极少数环境（无头/动画被禁）下 rect 可能为 0，此时不过滤，保证焦点陷阱仍工作
    if (!out.length) { for (var j = 0; j < list.length; j++) out.push(list[j]); }
    return out;
  }

  function onKeydown(e) {
    if (!active) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      var sel = CLOSE_BTN[active.id];
      var btn = sel ? active.querySelector(sel) : null;
      if (btn && !btn.disabled) { btn.click(); return; }
      // 兜底：直接移除开启类（各业务 close 均为幂等的 classList.remove）
      active.classList.remove('open', 'on');
      return;
    }
    if (e.key !== 'Tab') return;
    var items = focusableIn(active);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    var cur = document.activeElement;
    if (!active.contains(cur)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
  }

  function activate(el) {
    if (active === el) return;
    if (active) deactivate();
    active = el;
    try { lastFocus = document.activeElement; } catch (e) { lastFocus = null; }
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    // 等浮层过渡动画把可见元素渲染出来再移入焦点
    setTimeout(function () {
      if (!active) return;
      var items = focusableIn(active);
      var target = items[0] || active;
      try { target.focus({ preventScroll: true }); } catch (e) { try { target.focus(); } catch (e2) {} }
    }, 80);
  }

  function deactivate() {
    if (!active) return;
    active = null;
    try { document.body.style.overflow = ''; } catch (e) {}
    if (lastFocus && lastFocus.focus && document.body.contains(lastFocus)) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { try { lastFocus.focus(); } catch (e2) {} }
    }
    lastFocus = null;
  }

  document.addEventListener('keydown', onKeydown, true);

  // 页面加载时浮层若已处于打开态（理论不会，但兜底）
  var nodes = Array.prototype.slice.call(document.querySelectorAll('#aiMask,#familyMask,#clinicMask,#testMask,#topicMask,#senseOverlay'));
  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var el = muts[i].target;
      if (isOpen(el)) activate(el);
      else if (active === el) deactivate();
    }
  });
  nodes.forEach(function (el) {
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    if (isOpen(el)) activate(el);
  });

  window.__modal = { activate: activate, deactivate: deactivate };
})();
