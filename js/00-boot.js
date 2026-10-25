/* ===== 00-boot.js：全局错误兜底 + Service Worker 注册（最先加载） ===== */
(function () {
  'use strict';

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
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
