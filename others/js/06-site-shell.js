// ================= 网站壳：视图切换与板块交互 =================
var siteViews = Array.prototype.slice.call(document.querySelectorAll('.site-view'));
var siteLinks = Array.prototype.slice.call(document.querySelectorAll('.site-links a'));
var bookBox = document.querySelector('.viewport');

function switchView(name){
  // 离开页面时暂停所有视频，避免后台继续播放
  try{ document.querySelectorAll('video').forEach(function(v){ try{ v.pause(); }catch(e){} }); }catch(e){}
  var toBook = (name === 'science' || name === 'chat');
  document.body.classList.toggle('book-on', toBook);
  document.body.classList.toggle('site-view-on', !toBook);
  siteViews.forEach(function(v){ v.classList.toggle('on', v.getAttribute('data-view') === name); });
  siteLinks.forEach(function(l){ l.classList.toggle('on', l.getAttribute('data-view') === name); });
  if(toBook){
    if(bookBox) bookBox.style.display = '';
    if(name === 'science') show(0);
    else show(total - 1);
    fit();
  } else {
    if(bookBox) bookBox.style.display = 'none';
    if(name === 'home') resetHero();
  }
  if(window.scrollTo) window.scrollTo(0, 0);
}

function siteGo(goto){
  // 形如 science@5 / chat@ / family
  var sp = goto.split('@');
  var view = sp[0], idx = sp[1];
  switchView(view);
  if(idx) show(parseInt(idx, 10));
}

// 支持 ?view=xxx 深链直达：评审 / 分享链接可直接落到指定板块（如 ?view=policy、?view=chat）
(function () {
  var v = '';
  try { v = new URLSearchParams(location.search).get('view') || ''; } catch (e) {}
  window.__viewDeep = v; // 供 07-nav 判断是否跳过「默认回首页」
  if (!v) return;
  if (v === 'chat' || siteViews.some(function (x) { return x.getAttribute('data-view') === v; })) switchView(v);
})();

// 导航栏链接（含键盘可达性：Tab 聚焦后回车/空格触发）
siteLinks.forEach(function(l){
  l.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    switchView(l.getAttribute('data-view'));
    var lb = document.getElementById('siteLinks');
    if(lb) lb.classList.remove('open');
  }, false);
  l.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); l.click(); }
  }, false);
});
// 品牌区键盘可达
document.querySelectorAll('.site-brand').forEach(function(el){
  el.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); switchView('home'); }
  }, false);
});
