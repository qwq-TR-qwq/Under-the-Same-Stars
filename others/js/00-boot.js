/* ===== 00-boot.js：全局错误兜底 + Service Worker 注册（最先加载） ===== */
(function () {
  'use strict';

  // ---- 偏好预应用（渲染前生效，避免首屏"闪一下"再切换）----
  // 状态只写在 <html class="motion-off|theme-light"> / <body class="a11y-lg">，
  // 其余模块直接查询类名即可，无需依赖加载顺序。
  try {
    var mv = localStorage.getItem('xyn_motion');
    if (mv === null || mv === undefined) {
      // 兼容旧版「低刺激模式」存档：旧值为 1（减少动效）则沿用，并回写为新键
      if (localStorage.getItem('xyn_low_stim') === '1') {
        mv = '0';
        try { localStorage.setItem('xyn_motion', '0'); } catch (e2) {}
      } else { mv = '1'; }
    }
    if (mv === '0') document.documentElement.classList.add('motion-off');
    if (localStorage.getItem('xyn_theme') === 'light') document.documentElement.classList.add('theme-light');
  } catch (e) {}
  try {
    if (localStorage.getItem('xyn_font') === 'lg') document.body.classList.add('a11y-lg');
  } catch (e) {}

  // ---- 全局错误兜底：任何未捕获错误 / Promise 拒绝 → 友好提示，杜绝演示白屏 ----
  var errShown = 0;
  function toast(msg) {
    var now = Date.now();
    if (now - errShown < 4000) return; // 节流：4 秒内只提示一次
    errShown = now;
    var el = document.getElementById('siteToast');
    if (!el) { try { console.warn(msg); } catch (e) {} return; }
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3200);
  }
  window.addEventListener('error', function (e) {
    // 资源加载失败（图片/视频）静默，脚本错误才提示
    if (e && e.message) toast('小星星打了个盹，部分功能可能受限，刷新一下就好 ✦');
  });
  window.addEventListener('unhandledrejection', function (e) {
    toast('网络似乎不太稳定，星语会自动切换本地模式 ✦');
    try { e.preventDefault(); } catch (err) {}
  });

  // ---- PWA：注册 Service Worker（https / localhost 下生效，file:// 打开自动跳过） ----
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('others/sw.js').catch(function () {});
    });
  }

  // ---- 离线就绪提示：断网时星语自动切换本地知识库，明确告诉用户"仍然能用" ----
  // （答辩演示点：拔掉网线刷新页面，对话、科普、家长专区全部照常工作）
  window.addEventListener('DOMContentLoaded', function () {
    function offlineHint() {
      var el = document.getElementById('siteToast');
      if (!el) return;
      el.textContent = '当前处于离线状态：星语已切换到本地知识库模式，科普与对话功能不受影响 ✦';
      el.classList.add('show');
      setTimeout(function () { el.classList.remove('show'); }, 5000);
    }
    if (navigator.onLine === false) offlineHint();
    else window.addEventListener('offline', offlineHint, false);
  });
})();
