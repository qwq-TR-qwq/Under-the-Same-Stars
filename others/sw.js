/* 星夜入眠 · Service Worker
 * 策略：静态资源缓存优先（Cache First），HTML 与 AI 接口网络优先（Network First）。
 * 目的：断网/弱网时站点仍可完整演示（配合本地知识库兜底，实现真正的"离线可用"）。
 */
var CACHE = 'starry-night-v38';
var CORE = [
  './',
  '../index.html',
  '../css/style.css?v=1223',
  './js/00-boot.js?v=1223',
  './js/01-book.js?v=1223',
  './js/02-chat.js?v=1223',
  './js/03-ai-core.js?v=1223',
  './js/04-sensory.js?v=1223',
  './js/05-tests-community.js?v=1223',
  './js/06-site-shell.js?v=1223',
  './js/07-nav-community.js?v=1223',
  './js/08-policy.js?v=1223',
  './js/09-voice.js?v=1223',
  './js/10-family.js?v=1223',
  './js/11-settings.js?v=1223',
  './js/12-modal.js?v=1223',
  './js/13-clinic.js?v=1223',
  './js/14-safety.js?v=1223',
  './js/15-misslog.js?v=1223',
  './js/16-plan.js?v=1223',
  './js/data/stats.js?v=1223',
  './data/stats.json',
  './manifest.json',
  '../images/og-cover.jpg',
  './audio/bgm.mp3'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) {
    // AI 接口等跨域请求：直连网络，不缓存
    return;
  }

  // 视频/音频体积大且基本不变：缓存优先
  var isMedia = /\.(mp4|mp3|png|jpe?g|webp|svg|ico)$/i.test(url.pathname);
  var isHTML = url.pathname.endsWith('/') || /index\.html$/.test(url.pathname);

  if (isMedia || (!isHTML)) {
    // 静态资源：缓存优先，未命中再拉网络并写入缓存
    e.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () { return hit; });
      })
    );
  } else {
    // HTML：网络优先，失败回退缓存（保证更新可见、断网可用）
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
      })
    );
  }
});
