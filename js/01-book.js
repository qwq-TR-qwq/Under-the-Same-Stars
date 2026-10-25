  // 对话页并入书框：保证对话框与科普站始终显示在“书”背景框内（手机端 fixed 会脱离书框）
  var bookEl = document.getElementById('book');
  var chatPageEl = document.querySelector('.chat-page');
  if(bookEl && chatPageEl && chatPageEl.parentNode !== bookEl){
    bookEl.appendChild(chatPageEl);
  }
  var book = document.getElementById('book');
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  var progress = document.getElementById('progress');
  var navHint = document.getElementById('navHint');
  var hero = pages[0];
  var total = pages.length + 1;   // 书内页 + 独立对话层
  var cur = 0;
  var heroGo = false;
  var heroDone = false;
  var heroTimer = null;

  // 书等比缩放至视口
  function fit(){
    var s = Math.min(window.innerWidth / 2279, window.innerHeight / 1280);
    book.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  window.addEventListener('orientationchange', function(){ setTimeout(fit, 120); });
  fit();

  function show(n){
    cur = n;
    if(n === 0) resetHero();   // 返回首页时重置入眠动画，恢复原有画面
    pages.forEach(function(p, i){ p.classList.toggle('active', i === n); });
    progress.textContent = (n + 1) + ' / ' + total;
    navHint.classList.toggle('hidden', n === 0 || n === total - 1);
    navBack.classList.toggle('hidden', n === 0 || n === total - 1);
    backZone.classList.toggle('on', n > 0 && n !== total - 1);
    ensureMusic();
    ensureVideo();
    document.body.classList.toggle('chat-open', n === total - 1);
    if(n === total - 1){ navHint.classList.add('hidden'); navBack.classList.add('hidden'); if(chatInput){ setTimeout(function(){ chatInput.focus(); }, 420); } }
  }

  function playHero(){
    if(heroGo) return;
    heroGo = true;
    hero.classList.add('go');
    heroTimer = setTimeout(function(){ heroDone = true; show(1); }, 2000);
  }
  function resetHero(){
    heroGo = false;
    heroDone = false;
    if(heroTimer){ clearTimeout(heroTimer); heroTimer = null; }
    hero.classList.remove('go');
  }

  // 点击翻页：首页先触发入眠动画，动画结束后再点击进入下一页；故事页淡入淡出翻页
  document.addEventListener('click', function(e){
    if(document.body.classList.contains('book-on') === false) return;   // 网站板块视图下不翻页
    if(e.target.closest('#navBack') && cur > 0){ show(cur - 1); return; }   // 仅左下方按钮返回上一页
    if(e.target.closest('button')) return;   // 按钮自行处理
    if(e.target.closest('video')) return;   // 点视频是播放/暂停，不翻页
    if(cur === 0){
      if(!heroGo) playHero();
      return;
    }
    if(cur < total - 2) show(cur + 1);   // 致谢页（倒数第二页）之后不再跳转对话页
  }, false);

  // 回到首页
  document.getElementById('home').addEventListener('click', function(e){
    e.stopPropagation(); resetHero(); switchView('home');
  }, false);

  // 键盘翻页
  document.addEventListener('keydown', function(e){
    if(document.body.classList.contains('book-on') === false) return;   // 网站板块视图下不翻页
    var kt = e.target;
    if(kt && (kt.tagName === 'INPUT' || kt.tagName === 'TEXTAREA')) return;   // 输入框内不触发翻页
    if(e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      if(cur === 0){
        if(!heroGo) playHero();
      } else if(cur < total - 2){ show(cur + 1); }
    } else if(e.key === 'ArrowLeft'){
      e.preventDefault();
      if(cur > 0) show(cur - 1);
    }
  }, false);

  // ===== 悬停提示音：所有 hover 反馈动画元素，鼠标移入时同步播放轻微清脆提示音 =====
  var tickCtx = null;
  function playTick(){
    if(!musicOn) return;   // 提示音与背景音乐同开关控制
    try{
      if(!tickCtx) tickCtx = new (window.AudioContext || window.webkitAudioContext)();
      if(tickCtx.state === 'suspended') tickCtx.resume();
      var t = tickCtx.currentTime;
      var osc = tickCtx.createOscillator();
      var gain = tickCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.10, t + 0.012);   // 提示音音量固定
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain);
      gain.connect(tickCtx.destination);
      osc.start(t); osc.stop(t + 0.18);
    }catch(e){}
  }
  document.querySelectorAll('.card,.fact,.stat,.tile,.item,.back').forEach(function(el){
    el.addEventListener('mouseenter', playTick);
  });

  // ===== 背景音乐控制（开关 + 独立音量）=====
  var bgm = document.getElementById('bgm');
  var musicBox = document.getElementById('musicBox');
  var musicBtn = document.getElementById('musicBtn');
  var volBtn = document.getElementById('volBtn');
  var volRange = document.getElementById('volRange');
  var musicOn = true;
  var musicStarted = false;
  var bgmVol = 0.25;
  function paintVol(){
    var p = Math.round(bgmVol * 100);
    volRange.style.background = 'linear-gradient(to top, #ffd98c ' + p + '%, rgba(255,255,255,.22) ' + p + '%)';
  }
  function startBgm(force){
    if(!musicOn) return;
    if(cur === 8 && !force) return;          // 自动场景下，B 站视频页（第9页）不启动背景音乐
    musicStarted = true;
    bgm.volume = bgmVol;
    bgm.currentTime = bgm.currentTime;
    bgm.play().catch(function(){});
  }
  function stopBgm(){ try{ bgm.pause(); bgm.volume = 0; }catch(e){} }
  function syncMusicBtn(){
    musicBtn.classList.toggle('off', !musicOn);
    musicBtn.title = musicOn ? '关闭背景音乐' : '开启背景音乐';
  }
  function toggleMusic(){
    musicOn = !musicOn;
    syncMusicBtn();
    if(musicOn){ startBgm(true); } else { stopBgm(); }
  }
  function ensureMusic(){
    if(cur === 8){ stopBgm(); }              // 进入视频页暂停背景音乐
    else if(musicOn && musicStarted){ bgm.volume = bgmVol; bgm.play().catch(function(){}); }
  }
  // 短片已外置为 videos/ 下独立 mp4 文件（减小 HTML 体积）：进入短片页尝试播放，离开时暂停（避免其他页出声）
  // 若主源加载失败（触发 error），降级尝试其他视频文件
  function ensureVideo(){
    // 遍历所有页面内的视频：不在当前激活页面的视频一律暂停并回到开头
    var vs = document.querySelectorAll('section.page video');
    for(var i = 0; i < vs.length; i++){
      var vd = vs[i];
      if(!vd) continue;
      var pg = vd.closest ? vd.closest('.page') : null;
      var active = pg && pg.classList.contains('active');
      if(!active){
        try{ if(!vd.paused) vd.pause(); vd.currentTime = 0; }catch(e){}
      }
    }
  }
  (function(){
    var vd0 = document.querySelector('.video-wrap video');
    if(!vd0) return;
    var tries = 0;
    vd0.addEventListener('error', function(){
      if(tries >= 2) return;
      tries++;
      // 降级：换备用视频文件
      vd0.src = 'videos/asset_01.mp4';
      if(vd0.paused){ vd0.play().catch(function(){}); }
    }, false);
  })();
  // 背景视差：全书星空随鼠标晃动；首页全部内容（星空底+上层图片+文字+提示）整体同步晃动；其他页仅背景晃动
  var bgPar = document.querySelector('.book-bg');
  var heroPar = document.querySelector('.hero-par');
  var parRAF = null;
  document.addEventListener('mousemove', function(e){
    var rx = (e.clientX / window.innerWidth) - 0.5;
    var ry = (e.clientY / window.innerHeight) - 0.5;
    if(parRAF) return;
    parRAF = requestAnimationFrame(function(){
      parRAF = null;
      var t = 'translate(' + Math.round(rx * 90) + 'px,' + Math.round(ry * 66) + 'px)';
      if(bgPar) bgPar.style.transform = t;
      if(heroPar) heroPar.style.transform = t;
    });
  });
  musicBtn.addEventListener('click', function(e){
    e.stopPropagation();
    toggleMusic();
  }, false);
  volBtn.addEventListener('click', function(e){
    e.stopPropagation();
    musicBox.classList.toggle('vol-open');
  }, false);
  volRange.addEventListener('input', function(){
    bgmVol = parseFloat(this.value);
    bgm.volume = bgmVol;
    paintVol();
  });
  volRange.addEventListener('click', function(e){ e.stopPropagation(); });
  // 首次点击屏幕（非音乐控件）时解锁浏览器自动播放限制
  document.addEventListener('pointerdown', function(e){
    if(e.target && e.target.closest && e.target.closest('#musicBox')) return;
    if(musicOn && !musicStarted){
      musicStarted = true;
      bgm.volume = bgmVol;
      bgm.play().catch(function(){});
    }
  }, true);
  // 页面加载时尝试直接播放（部分环境允许自动播放则直接响起）
  bgm.volume = bgmVol;
  paintVol();
  bgm.play().catch(function(){});

