// 汉堡菜单与导航分组下拉（桌面点击切换 + 移动端展开，v12.30 修复收不回）
(function(){
  var burger = document.getElementById('navBurger');
  var box = document.getElementById('siteLinks');
  if(!burger || !box) return;
  var finePointer = false;
  try{ finePointer = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches; }catch(e){}
  function closeGroups(){
    box.querySelectorAll('.nav-group').forEach(function(x){ x.classList.remove('open','sup'); });
  }
  burger.addEventListener('click', function(e){
    e.stopPropagation();
    box.classList.toggle('open');
  }, false);
  box.addEventListener('click', function(e){
    var gb = e.target.closest ? e.target.closest('.nav-drop-btn') : null;
    if(!gb) return;
    e.stopPropagation();
    var g = gb.parentNode;
    var was = g.classList.contains('open');
    closeGroups();
    if(!was){ g.classList.add('open'); }
    else if(finePointer){ g.classList.add('sup'); }  // 桌面端鼠标仍悬停，抑制 hover 立即重开
  }, false);
  // 点击菜单项跳转后收起所有分组
  box.querySelectorAll('.nav-drop a').forEach(function(a){
    a.addEventListener('click', closeGroups);
  });
  // 鼠标离开分组后解除 hover 抑制
  box.querySelectorAll('.nav-group').forEach(function(g){
    g.addEventListener('mouseleave', function(){ g.classList.remove('sup'); });
  });
  // 点击导航以外区域：收起移动端面板与所有下拉
  // 用捕获阶段监听：品牌 logo / 跳转按钮等 stopPropagation 的元素也能触发收回（v12.30）
  document.addEventListener('click', function(e){
    if(!box.contains(e.target) && e.target !== burger){
      box.classList.remove('open');
      closeGroups();
    }
  }, true);
  // ESC 收起
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){ box.classList.remove('open'); closeGroups(); }
  }, false);
})();
// 品牌 / 迷你返回
document.querySelectorAll('.site-brand, #siteBackMini').forEach(function(el){
  el.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    switchView('home');
  }, false);
});
// 首页板块卡片
document.querySelectorAll('.site-card[data-view]').forEach(function(c){
  c.addEventListener('click', function(e){
    if(e.target.closest('button')) return;
    switchView(c.getAttribute('data-view'));
  }, false);
});
// 板块内跳转按钮（data-goto）
document.querySelectorAll('[data-goto]').forEach(function(b){
  b.addEventListener('click', function(e){
    e.stopPropagation();
    siteGo(b.getAttribute('data-goto'));
  }, false);
});

// ---- 轻提示 ----
var siteToastEl = document.getElementById('siteToast');
var siteToastTimer = null;
function siteToast(msg){
  if(!siteToastEl) return;
  siteToastEl.textContent = msg;
  siteToastEl.classList.add('show');
  if(siteToastTimer) clearTimeout(siteToastTimer);
  siteToastTimer = setTimeout(function(){ siteToastEl.classList.remove('show'); }, 3200);
}

// ---- 志愿者报名（本地演示）----
var volForm = document.getElementById('volForm');
if(volForm){
  volForm.addEventListener('submit', function(e){
    e.preventDefault();
    var nm = (document.getElementById('volName').value || '').trim();
    var ct = (document.getElementById('volContact').value || '').trim();
    if(!nm || !ct){ siteToast('请填写称呼与联系方式'); return; }
    try{ localStorage.setItem('xyn_vol_' + Date.now(), nm + '|' + ct + '|' + document.getElementById('volWay').value); }catch(err){}
    volForm.reset();
    if(typeof paintDash === 'function') paintDash();
    siteToast('感谢您 ' + nm + ' 的登记，公益组织将尽快与您联系，愿星光常伴。');
  }, false);
}

// ---- 家长互助留言墙（星光弹幕 · 横向滚动）----
var MW_KEY = 'xyn_community_msgs';
function mwLoad(){
  try{ var raw = localStorage.getItem(MW_KEY); return raw ? JSON.parse(raw) : []; }catch(err){ return []; }
}
function mwSave(list){
  try{ localStorage.setItem(MW_KEY, JSON.stringify(list)); }catch(err){}
}
var MW_POOL = [
  {name:'辰星妈妈', txt:'孩子今天第一次主动拉了我的手。这一路真的很难，但值得。'},
  {name:'阿哲爸爸', txt:'刚确诊那阵子整夜睡不着，现在学会先照顾好自己了。大家都加油！'},
  {name:'小满妈妈', txt:'别怕，孩子的每个微小进步都算数——他今天多看了我一眼，我就开心了一整天。'},
  {name:'乐乐爸爸', txt:'带娃出门被人误解过，也遇到过善良的人说“你的孩子很特别”。愿温柔的人多一些。'},
  {name:'星星外婆', txt:'外孙三岁确诊，现在九岁了，会唱整首儿歌。老人们也慢慢学会了理解。'},
  {name:'东东妈妈', txt:'机构干预一年多，孩子会主动叫妈妈了。那一声，我等了四年。'},
  {name:'小宇爸爸', txt:'崩溃过、自责过，后来明白：先照顾好自己，才能接住孩子的情绪。'},
  {name:'一位特教老师', txt:'每个孩子都有自己的节奏。不着急，我们慢慢来，等他们准备好。'},
  {name:'米粒妈妈', txt:'我把家里的日程做成图片贴在墙上，孩子的不安少了很多。分享给需要的家长。'},
  {name:'一位家长', txt:'最难的时候拨过 12356 心理热线，接电话的人很温柔。谢谢你，那条热线。'},
  {name:'然然爸爸', txt:'亲戚不理解时，我学会了一句话：他生病了，不是他不懂事。'},
  {name:'默默妈妈', txt:'孩子画了一幅画送给我，画里有我。原来他什么都懂。'},
  {name:'布丁妈妈', txt:'不要把孩子藏起来。多带他出门，世界才能看见，他也需要被看见。'},
  {name:'小北爸爸', txt:'如果你也在深夜崩溃，记得你并不孤单——这里的每个人都懂那种滋味。'},
  {name:'一位康复师', txt:'早发现、早干预真的很重要。各位家长，你们已经做得很好了。'},
  {name:'康康妈妈', txt:'孩子学会自己扣扣子了，虽然用了两个月，但这是他人生第一个自己完成的事。'},
  {name:'一位志愿者', txt:'第一次陪星宝画画，他递给我一支蜡笔——那一刻，我的心都化了。'},
  {name:'果果爸爸', txt:'别总盯着“还不会”，多看看“已经会了”。孩子每天都在悄悄长大。'},
  {name:'桐桐妈妈', txt:'把“不行”换成“我们试试”，把“快点”换成“慢慢来”，家里笑声变多了。'},
  {name:'安安奶奶', txt:'以前觉得丢人，现在敢带孙子出门了。别人问，我就说：他是我最特别的小孙子。'},
  {name:'糖糖妈妈', txt:'情绪崩溃时，我先给自己泡杯热茶，等平静了再去抱孩子。妈妈也需要充电。'},
  {name:'一位儿科医生', txt:'诊断不是判决书。越早干预，孩子未来的路越宽。请一定抓住黄金期。'},
  {name:'小树爸爸', txt:'我们申请了康复补助，家里压力小了很多。政策真的能帮上忙。'},
  {name:'琪琪妈妈', txt:'孩子喜欢旋转的物体，我就每天陪他看风扇、转轮盘，那成了我们的亲子时刻。'},
  {name:'一位康复师', txt:'训练不是逼迫。把目标藏进游戏里，孩子开心了，进步就来了。'},
  {name:'浩浩妈妈', txt:'亲戚不理解时，我发了一篇科普文章到家族群。慢慢地，他们开始帮忙带孩子了。'},
  {name:'朵朵爸爸', txt:'别吝啬夸奖。哪怕只是他看了我一眼，我也说“你真棒”——他听得到。'},
  {name:'一位社工', txt:'很多家庭缺的不是爱，是信息。康复资源、补助政策，知道的人太少了。'},
  {name:'阳阳妈妈', txt:'我们加入了本地的家长群，周末一起带孩子爬山。原来我们不是孤岛。'},
  {name:'乐乐奶奶', txt:'以前总觉得是我没带好，后来医生说这不是任何人的错，我才慢慢放下自责。'},
  {name:'一位特教老师', txt:'教了十年星宝，最感动的是毕业那天，有个孩子回头朝我笑了。'},
  {name:'欣欣妈妈', txt:'孩子第一次主动牵我的手过马路，我哭了整整一条街。他比我想象的更爱我。'},
  {name:'小哲爸爸', txt:'把每天要做的流程画成图，贴在他床头，他情绪平稳了很多。'},
  {name:'一位心理咨询师', txt:'家长的情绪健康同样重要。先安顿好自己，才能成为孩子的港湾。'},
  {name:'月月妈妈', txt:'带娃参加了一次融合活动，普通孩子主动来牵她的手。善意是教出来的。'},
  {name:'晨晨爸爸', txt:'孩子刻板地背广告词，我录下来，后来发现那是他独特的歌声。'},
  {name:'一位大学生志愿者', txt:'每周去陪星宝读绘本，他记住我的名字那天，我开心了一整周。'},
  {name:'囡囡妈妈', txt:'不跟别人比进度了。他今天比昨天多说了两个字，我就赢了。'},
  {name:'洋洋爸爸', txt:'我学会了把孩子抱紧——他挣扎时，我知道他只是感官太敏感，不是不要我。'},
  {name:'一位康复老师', txt:'家长才是孩子最好的老师。我把方法教给妈妈，比我自己教效果好十倍。'},
  {name:'皓皓妈妈', txt:'孩子确诊那年我辞了职。现在他进步很大，我的付出都值得。'},
  {name:'一位医生', txt:'请记住：自闭症不是性格孤僻，也不是教养失败。它是神经发育的差异。'},
  {name:'甜甜妈妈', txt:'女儿喜欢把积木排成一排，那幅作品我拍了照，是家里最珍贵的画。'},
  {name:'亮亮爸爸', txt:'在电梯里有人夸孩子有礼貌，我鼻子一酸——被看见的感觉真好。'},
  {name:'一位残联工作者', txt:'符合条件的家庭记得申请康复救助项目，一年能省下不少钱。'},
  {name:'泡泡妈妈', txt:'孩子不会说话，但他会画画。他把我们的家画了下来，墙上挂满了家。'},
  {name:'石头爸爸', txt:'我给自己设了喘息时间，每周三晚上去打羽毛球。回来之后耐心翻倍。'},
  {name:'一位老教师', txt:'退休后做了志愿者。这些孩子不是不可爱，是需要我们用不同的方式去爱。'},
  {name:'沐沐妈妈', txt:'孩子把香蕉当月亮，我觉得他的想象力比谁都丰富。他教会了我另一种看世界的方式。'},
  {name:'小海爸爸', txt:'别让任何人定义你的孩子。他走得慢，但他一直在走，这就足够了。'},
];
var dmLastAt = [0, 0, 0, 0, 0];   // 各轨道最后一次发射时间（预置弹幕与自己的留言共用）
function mwRender(){
  var stage = document.getElementById('mwStage');
  if(!stage) return;
  var local = mwLoad();
  var pool = MW_POOL.concat(local.map(function(m){ return {name:m.name, txt:m.txt}; }));
  var lanes = [10, 58, 106, 154, 202];
  var seq = 0;
  function spawn(item, highlight){
    var el = document.createElement('div');
    el.className = 'mw-dm' + (highlight ? ' mine' : '');
    var now = Date.now();
    var li = 0, best = 0;
    for(var i = 1; i < lanes.length; i++){ if(now - dmLastAt[i] > now - dmLastAt[best]) best = i; }
    if(now - dmLastAt[best] < 5200) return;   // 所有轨道都太近，跳过本拍，保证每条留言之间有距离
    li = best;
    dmLastAt[li] = now;
    el.style.top = lanes[li] + 'px';
    var who = document.createElement('span');
    who.className = 'dm-who';
    who.textContent = (highlight ? '✦ 我 · ' : '') + (item.name || '匿名');
    el.appendChild(who);
    el.appendChild(document.createTextNode(' ' + (item.txt || '')));
    stage.appendChild(el);
    var w = stage.clientWidth || stage.parentNode.clientWidth || 800;
    var tw = el.offsetWidth || 240;
    var speed = 85;
    el.style.setProperty('--w', w + 'px');
    var dur = (w + tw) / speed;
    el.style.animationDuration = dur + 's';
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, dur * 1000 + 400);
  }
  if(window._mwTimer) clearInterval(window._mwTimer);
  var pi = 0;
  window._mwTimer = setInterval(function(){
    var st = document.getElementById('mwStage');
    if(!st) return;
    if(document.documentElement.classList.contains('motion-off')) return;   // 减少动效模式：暂停弹幕滚动
    var r = st.getBoundingClientRect();
    if(r.width === 0 && r.height === 0) return;
    var item = pool[pi % pool.length]; pi++;
    spawn(item, false);
  }, 1800);
}
var mwSend = document.getElementById('mwSend');
if(mwSend){
  mwSend.addEventListener('click', function(){
    var nm = (document.getElementById('mwName').value || '').trim();
    var tx = (document.getElementById('mwText').value || '').trim();
    if(!tx){ siteToast('写点什么再发布吧'); return; }
    var list = mwLoad();
    var d = new Date();
    list.unshift({name: nm || '匿名', txt: tx, when: d.getFullYear() + '-' + ('0' + (d.getMonth()+1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2)});
    mwSave(list);
    document.getElementById('mwName').value = '';
    document.getElementById('mwText').value = '';
    mwRender();
    // 自己的留言：立即以金色高亮弹幕划出
    var stage = document.getElementById('mwStage');
    if(stage && !document.documentElement.classList.contains('motion-off')){
      var el = document.createElement('div');
      el.className = 'mw-dm mine';
      var now2 = Date.now();
      var bi = 0;
      var lanes2 = [10, 58, 106, 154, 202];
      for(var i2 = 1; i2 < lanes2.length; i2++){ if(now2 - dmLastAt[i2] > now2 - dmLastAt[bi]) bi = i2; }
      dmLastAt[bi] = now2;
      el.style.top = lanes2[bi] + 'px';
      var who = document.createElement('span');
      who.className = 'dm-who';
      who.textContent = '✦ 我 · ' + (nm || '匿名');
      el.appendChild(who);
      el.appendChild(document.createTextNode(' ' + tx));
      stage.appendChild(el);
      var w = stage.clientWidth || stage.parentNode.clientWidth || 800;
      var tw = el.offsetWidth || 260;
      el.style.setProperty('--w', w + 'px');
      var dur = (w + tw) / 85;
      el.style.animationDuration = dur + 's';
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, dur * 1000 + 400);
    }
    siteToast('已发布！你的星光弹幕正划过夜空 ✦');
  }, false);
}

// ---- 访问计数与运营数据看板 ----
function countVisits(){
  try{
    var v = parseInt(localStorage.getItem('xyn_visits') || '0', 10);
    localStorage.setItem('xyn_visits', String(v + 1));
    return v + 1;
  }catch(err){ return 1; }
}
function dashValue(){
  try{
    var msgs = mwLoad().length;
    var vols = 0, fbk = 0, lights = parseInt(localStorage.getItem('xyn_star_lights') || '0', 10);
    var keys = Object.keys(localStorage);
    for(var i = 0; i < keys.length; i++){
      if(keys[i].indexOf('xyn_vol_') === 0) vols++;
      else if(keys[i].indexOf('xyn_fbk_') === 0) fbk++;
    }
    return { visits: countVisits(), msgs: msgs, vols: vols, fbk: fbk, lights: lights };
  }catch(err){
    return { visits: 1, msgs: 0, vols: 0, fbk: 0, lights: 0 };
  }
}
function paintDash(){
  var d = dashValue();
  var el;
  el = document.getElementById('stVisits'); if(el) el.textContent = d.visits;
  el = document.getElementById('stMsgs');   if(el) el.textContent = d.msgs;
  el = document.getElementById('stVols');   if(el) el.textContent = d.vols;
  el = document.getElementById('stLights'); if(el) el.textContent = d.lights;
  el = document.getElementById('starLightCount'); if(el) el.textContent = d.lights;
}
paintDash();

// ---- 点亮一颗星 ----
var lightBtn = document.getElementById('lightStar');
if(lightBtn){
  lightBtn.addEventListener('click', function(){
    try{ localStorage.setItem('xyn_star_lights', String(parseInt(localStorage.getItem('xyn_star_lights') || '0', 10) + 1)); }catch(err){}
    paintDash();
    siteToast('你为星宝点亮了一颗星，谢谢你的祝福 ✦');
  }, false);
}

// ---- 用户反馈表单 ----
var fbkForm = document.getElementById('fbkForm');
if(fbkForm){
  fbkForm.addEventListener('submit', function(e){
    e.preventDefault();
    var tx = (document.getElementById('fbkText').value || '').trim();
    var nm = (document.getElementById('fbkName').value || '').trim();
    var tp = document.getElementById('fbkType') ? document.getElementById('fbkType').value : '';
    if(!tx){ siteToast('请填写反馈内容'); return; }
    try{ localStorage.setItem('xyn_fbk_' + Date.now(), nm + '|' + tp + '|' + tx); }catch(err){}
    fbkForm.reset();
    paintDash();
    siteToast('感谢你的反馈，我们会认真对待每一条建议 ✦');
  }, false);
}

// ---- 感官体验遮罩 ----
var senseOverlay = document.getElementById('senseOverlay');
var senseCtx = null, senseNoise = null, senseGain = null, sensePlaying = false;
function senseStopSound(){
  if(sensePlaying && senseGain){ try{ senseGain.gain.setValueAtTime(0, senseCtx.currentTime); }catch(err){} }
  sensePlaying = false;
  var sb = document.getElementById('senseSound');
  if(sb) sb.textContent = '开启模拟声音';
}
var senseOpen = document.getElementById('senseOpen');
if(senseOpen){
  senseOpen.addEventListener('click', function(){
    switchView('science'); setTimeout(function(){ if(typeof show==='function') show(10); }, 400);
  }, false);
}
var senseClose = document.getElementById('senseClose');
if(senseClose){
  senseClose.addEventListener('click', function(){
    if(!senseOverlay) return;
    senseOverlay.classList.remove('on');
    document.body.style.overflow = '';
    senseStopSound();
  }, false);
}
var senseSound = document.getElementById('senseSound');
if(senseSound){
  senseSound.addEventListener('click', function(){
    if(sensePlaying){ senseStopSound(); return; }
    if(!senseCtx){
      try{ senseCtx = new (window.AudioContext || window.webkitAudioContext)(); if(senseCtx.state === 'suspended' && senseCtx.resume) senseCtx.resume(); }catch(err){ siteToast('当前浏览器不支持声音模拟'); return; }
      var bufferSize = 2 * senseCtx.sampleRate;
      senseNoise = senseCtx.createBuffer(1, bufferSize, senseCtx.sampleRate);
      var data = senseNoise.getChannelData(0);
      for(var i = 0; i < bufferSize; i++){ data[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.random()); }
      var src = senseCtx.createBufferSource();
      src.buffer = senseNoise; src.loop = true;
      senseGain = senseCtx.createGain(); senseGain.gain.value = 0;
      src.connect(senseGain); senseGain.connect(senseCtx.destination);
      src.start(0);
    }
    sensePlaying = true;
    if(senseGain){ try{ senseGain.gain.setValueAtTime(0.12, senseCtx.currentTime); }catch(err){} }
    senseSound.textContent = '关闭模拟声音';
  }, false);
}
// Esc 退出体验
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && senseOverlay && senseOverlay.classList.contains('on')){
    senseOverlay.classList.remove('on');
    document.body.style.overflow = '';
    senseStopSound();
  }
}, false);

// 默认进入网站首页（?view= 深链直达时不覆盖，见 06-site-shell）
if (!window.__viewDeep) switchView('home');
// 留言墙初始渲染（示例留言）
mwRender();


// ---- 自闭症数据看板：canvas 绘制（数据来自 others/data/stats.json 数据层，带来源与口径） ----
(function(){
  // 兜底数据：仅当 others/js/data/stats.js 未加载时使用，保证看板不会白屏
  var FALLBACK = {
    meta:{ updated:'2026-04', reviewCycle:'每季度复核', caliber:'科普示意 · 非医疗统计口径' },
    sources:[],
    trend:{
      years:[2013,2015,2016,2020,2022,2025],
      count:[{v:1000,kind:'reported'},{v:1050,kind:'estimate'},{v:1075,kind:'estimate'},
             {v:1175,kind:'estimate'},{v:1225,kind:'estimate'},{v:1300,kind:'reported'}],
      rate:[{year:2015,v:3.5,caliber:'儿童总体 · Meta 分析'},{year:2020,v:18,caliber:'0—6 岁 · 1.8%'},
            {year:2022,v:7,caliber:'0—6 岁 · 规范引用值'}]
    },
    countries:{ unit:'万', worldTotal:6700, items:[
      {n:'中国',v:1300,kind:'reported'},{n:'印度',v:1000,kind:'estimate'},{n:'美国',v:550,kind:'estimate'},
      {n:'巴西',v:240,kind:'reported'},{n:'日本',v:230,kind:'estimate'},{n:'英国',v:70,kind:'estimate'},
      {n:'其他国家',v:3310,kind:'derived'}] },
    ages:{ unit:'万', items:[{n:'0-6 岁',v:150,kind:'estimate'},{n:'7-12 岁',v:200,kind:'estimate'},
      {n:'13-18 岁',v:150,kind:'estimate'},{n:'18 岁以上',v:800,kind:'estimate'}] }
  };
  function STATS(){
    var s = window.XYN_STATS;
    if(s && s.trend && s.trend.years && s.countries && s.ages) return s;
    return FALLBACK;
  }
  function srcOf(id){
    var list = STATS().sources || [];
    for(var i=0;i<list.length;i++){ if(list[i].id===id) return list[i]; }
    return null;
  }
  function kindText(kind){
    return kind === 'reported' ? '已发布' : (kind === 'derived' ? '差额推算' : '估算');
  }

  // 主题调色板：深色为星夜底，浅色为纸白底；切换主题时通过 theme:change 事件重绘
  function chartPal(){
    var light = document.documentElement.classList.contains('theme-light');
    return light ? {
      bg:'#fffdf6', grid:'rgba(43,48,90,.16)', axis:'#77809f', year:'#4a5378',
      note:'#8a8fa8', numLabel:'#7a5a00', preLabel:'#2b5f9e', hoverLegend:'#1a1f4a',
      tipBg:'rgba(255,253,247,.97)', tipBorder:'rgba(190,140,20,.55)', tipText:'#243060', tipDim:'#6b7495'
    } : {
      bg:'rgba(10,15,45,.9)', grid:'rgba(255,255,255,.08)', axis:'#8fa0d8', year:'#c9d3f2',
      note:'#6a7299', numLabel:'#ffe9b8', preLabel:'#bcd6ff', hoverLegend:'#fff',
      tipBg:'rgba(8,12,34,.94)', tipBorder:'rgba(255,217,100,.6)', tipText:'#ffffff', tipDim:'#a9b6dd'
    };
  }
  function dprFix(cv){ var ctx=cv.getContext('2d'); ctx.setTransform(1,0,0,1,0,0); return ctx; }
  function fitText(ctx, str, maxW){
    if(ctx.measureText(str).width <= maxW) return str;
    var s = str;
    while(s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s + '…';
  }

  function lineChart(cv, hoverKey){
    var P = chartPal();
    var D = STATS(), t = D.trend;
    var ctx = dprFix(cv); var W=cv.width, H=cv.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=P.bg; ctx.fillRect(0,0,W,H);
    var yrs = t.years, cnt = t.count, rate = t.rate || [];
    var vals = cnt.map(function(c){ return c.v; });
    var numMin = Math.floor((Math.min.apply(null, vals) - 100) / 100) * 100;
    var numMax = Math.ceil((Math.max.apply(null, vals) + 100) / 100) * 100;
    var rateVals = rate.map(function(r){ return r.v; });
    var rateMax = Math.max(20, Math.ceil((Math.max.apply(null, rateVals.concat([0])) * 1.1) / 5) * 5);
    var padL=58, padR=70, padT=44, padB=46;
    var iw=W-padL-padR, ih=H-padT-padB;
    var x=function(y){ return padL + (y-yrs[0])/(yrs[yrs.length-1]-yrs[0])*iw; };
    var yN=function(v){ return padT + ih - (v-numMin)/(numMax-numMin)*ih; };
    var yP=function(v){ return padT + ih - (v-0)/(rateMax-0)*ih; };
    ctx.strokeStyle=P.grid; ctx.fillStyle=P.axis; ctx.font='11px sans-serif'; ctx.textAlign='right';
    var step = (numMax-numMin) > 700 ? 200 : 100;
    for(var g=numMin; g<=numMax; g+=step){
      ctx.beginPath(); ctx.moveTo(padL,yN(g)); ctx.lineTo(W-padR,yN(g)); ctx.stroke();
      ctx.fillText(g+'万', padL-6, yN(g)+4);
    }
    ctx.textAlign='center';
    for(var i=0;i<yrs.length;i++){ ctx.fillStyle=P.year; ctx.fillText(yrs[i], x(yrs[i]), H-padB+18); }
    ctx.fillStyle=P.axis; ctx.save(); ctx.translate(16,H/2); ctx.rotate(-Math.PI/2); ctx.fillText('中国患者人数（万人）',0,0); ctx.restore();
    ctx.textAlign='left';
    for(var g2=0; g2<=rateMax; g2+=5){ ctx.fillStyle=P.axis; ctx.fillText(g2+'‰', W-padR+8, yP(g2)+4); }
    ctx.fillStyle=P.axis; ctx.save(); ctx.translate(W-8,H/2); ctx.rotate(Math.PI/2); ctx.fillText('儿童患病率（‰）',0,0); ctx.restore();

    // 人数折线
    ctx.strokeStyle='#ffd98a'; ctx.lineWidth=2.4; ctx.beginPath();
    for(var n=0;n<cnt.length;n++){ if(n===0) ctx.moveTo(x(yrs[n]),yN(cnt[n].v)); else ctx.lineTo(x(yrs[n]),yN(cnt[n].v)); }
    ctx.stroke();
    for(var n2=0;n2<cnt.length;n2++){
      var isH = (hoverKey === 'c'+n2);
      ctx.beginPath(); ctx.arc(x(yrs[n2]),yN(cnt[n2].v), isH?8:4, 0, 7);
      ctx.fillStyle='#ffd98a'; ctx.fill();
      if(isH){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); }
      ctx.fillStyle=P.numLabel; ctx.font= isH?'bold 13px sans-serif':'11px sans-serif';
      var mark = cnt[n2].kind === 'estimate' ? '*' : '';
      ctx.fillText(cnt[n2].v+mark, x(yrs[n2]), yN(cnt[n2].v)-12);
    }
    // 患病率：各点口径不同，只画散点不连线
    for(var p=0;p<rate.length;p++){
      var isHP = (hoverKey === 'r'+p);
      ctx.beginPath(); ctx.arc(x(rate[p].year),yP(rate[p].v), isHP?8:4.5, 0, 7);
      ctx.fillStyle='#7fb3ff'; ctx.fill();
      if(isHP){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); }
      ctx.fillStyle=P.preLabel; ctx.font= isHP?'bold 13px sans-serif':'11px sans-serif';
      var dy = (p===1) ? 20 : -12;
      ctx.fillText(rate[p].v+'‰', x(rate[p].year), yP(rate[p].v)+dy);
    }
    ctx.font='11px sans-serif'; ctx.textAlign='left';
    ctx.strokeStyle='#ffd98a'; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.moveTo(padL+8, 14); ctx.lineTo(padL+30, 14); ctx.stroke();
    ctx.fillStyle='#ffd98a'; ctx.fillText('中国患者人数（左轴）', padL+36, 17);
    ctx.strokeStyle='#7fb3ff';
    ctx.beginPath(); ctx.moveTo(padL+8, 30); ctx.lineTo(padL+30, 30); ctx.stroke();
    ctx.fillStyle='#7fb3ff'; ctx.fillText('儿童患病率（右轴·各点口径不同，未连线）', padL+36, 33);
    ctx.fillStyle=P.note; ctx.fillText('* 中间年份为按公开增速估算', W-padR, 17);
    cv._legend = [ {y:14, type:'num'}, {y:30, type:'pre'} ];

    // hover tooltip
    if(hoverKey){
      var isRate = String(hoverKey).indexOf('r')===0;
      var idx = parseInt(String(hoverKey).slice(1), 10);
      var lines = [], tx;
      if(isRate){
        var r = rate[idx]; if(!r) { return; }
        tx = x(r.year);
        lines.push({c:'#7fb3ff', t:r.year+'年 · '+r.v+'‰'});
        if(r.caliber) lines.push({c:P.tipDim, t:r.caliber});
        var rs = srcOf(r.src); if(rs) lines.push({c:P.tipDim, t:'来源：'+rs.org+'（'+rs.year+'）'});
      } else {
        var c = cnt[idx]; if(!c) { return; }
        tx = x(yrs[idx]);
        lines.push({c:'#ffd98a', t:yrs[idx]+'年 · 约'+c.v+'万人（'+kindText(c.kind)+'）'});
        var s2 = srcOf(c.src);
        if(s2) lines.push({c:P.tipDim, t:'来源：'+s2.org+'（'+s2.year+'）'});
        else if(c.basis) lines.push({c:P.tipDim, t:'来源：'+c.basis});
      }
      ctx.font='12px "Microsoft YaHei",sans-serif';
      var tw=0; for(var li=0;li<lines.length;li++) tw=Math.max(tw, ctx.measureText(lines[li].t).width+22);
      tw = Math.min(tw, 330);
      var th = lines.length*20 + 10;
      var baseY = isRate ? yP(rate[idx].v) : yN(cnt[idx].v);
      var ty = isRate ? baseY + 14 : baseY - th - 10;
      if(ty < 4) ty = baseY + 14;
      if(ty + th > H-4) ty = baseY - th - 10;
      var bx = Math.max(4, Math.min(tx-tw/2, W-tw-4));
      ctx.fillStyle=P.tipBg; ctx.strokeStyle=P.tipBorder; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(bx, ty, tw, th, 6); ctx.fill(); ctx.stroke();
      ctx.textAlign='left';
      for(var lj=0;lj<lines.length;lj++){
        ctx.fillStyle=lines[lj].c;
        ctx.fillText(fitText(ctx, lines[lj].t, tw-20), bx+11, ty+18+lj*20);
      }
    }
    cv._hitPts = [];
    for(var i2=0;i2<cnt.length;i2++) cv._hitPts.push({k:'c'+i2, x:x(yrs[i2]), y:yN(cnt[i2].v)});
    for(var hp=0;hp<rate.length;hp++) cv._hitPts.push({k:'r'+hp, x:x(rate[hp].year), y:yP(rate[hp].v)});
  }

  function pieChart(cv, items, unit, hoverIdx){
    var P = chartPal();
    var ctx = dprFix(cv); var W=cv.width, H=cv.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=P.bg; ctx.fillRect(0,0,W,H);
    var colors=['#ffd98a','#7fb3ff','#9be3a8','#f09bbd','#c3a6ff','#6fd6d0','#8fa0d8'];
    var cx=230, cy=182, R=124;
    var total=0; for(var k=0;k<items.length;k++) total+=items[k].v;
    var a0=-Math.PI/2;
    cv._slices = [];
    for(var i=0;i<items.length;i++){
      var a1=a0 + items[i].v/total*Math.PI*2;
      var isH = (hoverIdx === i);
      var rr = isH ? R+8 : R;
      var mid=(a0+a1)/2;
      var dx = isH ? Math.cos(mid)*6 : 0;
      var dy = isH ? Math.sin(mid)*6 : 0;
      ctx.beginPath(); ctx.moveTo(cx+dx,cy+dy); ctx.arc(cx+dx,cy+dy,rr,a0,a1); ctx.closePath();
      ctx.fillStyle=colors[i%colors.length]; ctx.globalAlpha = isH?1:0.92; ctx.fill();
      ctx.globalAlpha=1;
      ctx.strokeStyle = isH ? '#fff' : P.bg;
      ctx.lineWidth = isH?3:2; ctx.stroke();
      if(items[i].v/total>0.045){
        ctx.fillStyle='#0b1030'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
        var lx=cx+dx+Math.cos(mid)*rr*0.62, ly=cy+dy+Math.sin(mid)*rr*0.62;
        ctx.fillText(items[i].v+unit, lx, ly+4);
      }
      cv._slices.push({a0:a0, a1:a1, cx:cx+dx, cy:cy+dy, r:rr});
      a0=a1;
    }
    var ly=30;
    ctx.textAlign='left'; ctx.font='12px "Microsoft YaHei",sans-serif';
    for(var j=0;j<items.length;j++){
      var isLH = (hoverIdx === j);
      ctx.fillStyle=colors[j%colors.length];
      ctx.globalAlpha = isLH?1:0.8;
      var lw = isLH?15:12;
      ctx.fillRect(cx+R+26, ly-9, lw, lw);
      ctx.globalAlpha=1;
      ctx.fillStyle = isLH ? P.hoverLegend : P.year;
      ctx.font = isLH ? 'bold 13px "Microsoft YaHei",sans-serif' : '12px "Microsoft YaHei",sans-serif';
      ctx.fillText(items[j].n+'：'+items[j].v+unit+'（'+(items[j].v/total*100).toFixed(1)+'%）', cx+R+44, ly);
      cv._slices[j].legendY = ly;
      ly+=22;
    }
    cv._total = total; cv._items = items; cv._unit = unit;
    cv._cx = cx; cv._cy = cy; cv._R = R;
    ctx.fillStyle=P.note; ctx.font='11px sans-serif'; ctx.textAlign='left';
    var note = '* 部分国家/年龄组为估算，详见下方数据来源清单';
    if(hoverIdx !== null && hoverIdx !== undefined && items[hoverIdx]){
      var s = srcOf(items[hoverIdx].src);
      note = '来源：' + (s ? s.org+'（'+s.year+'）' : (items[hoverIdx].basis || '估算')) ;
      note = fitText(ctx, note, W-40);
    }
    ctx.fillText(note, 24, H-14);
  }

  function bindLineHover(cv){
    cv.addEventListener('mousemove', function(e){
      var r = cv.getBoundingClientRect();
      if(!r.width) return;
      var mx = (e.clientX-r.left) * cv.width / r.width;
      var my = (e.clientY-r.top) * cv.height / r.height;
      var best = null, bd = 22;
      if(cv._hitPts){
        for(var i=0;i<cv._hitPts.length;i++){
          var d = Math.hypot(mx-cv._hitPts[i].x, my-cv._hitPts[i].y);
          if(d<bd){ bd=d; best=cv._hitPts[i].k; }
        }
      }
      lineChart(cv, best);
    });
    cv.addEventListener('mouseleave', function(){ lineChart(cv, null); });
  }
  function bindPieHover(cv){
    cv.addEventListener('mousemove', function(e){
      var r = cv.getBoundingClientRect();
      if(!r.width) return;
      var mx = (e.clientX-r.left) * cv.width / r.width;
      var my = (e.clientY-r.top) * cv.height / r.height;
      var best = null;
      if(cv._slices){
        for(var j=0;j<cv._slices.length;j++){
          var ly=cv._slices[j].legendY;
          if(mx > cv._cx+cv._R+20 && mx < cv.width-20 && Math.abs(my-ly)<10){ best=j; break; }
        }
        if(best===null){
          var dx = mx-cv._cx, dy = my-cv._cy;
          var dist = Math.hypot(dx,dy);
          if(dist < cv._R+12){
            var ang = Math.atan2(dy,dx);
            if(ang < -Math.PI/2) ang += Math.PI*2;
            for(var i=0;i<cv._slices.length;i++){
              if(ang >= cv._slices[i].a0 && ang < cv._slices[i].a1){ best=i; break; }
            }
          }
        }
      }
      pieChart(cv, cv._items, cv._unit, best);
    });
    cv.addEventListener('mouseleave', function(){ pieChart(cv, cv._items, cv._unit, null); });
  }

  // ---- 数据来源清单与元信息渲染 ----
  function el(id){ return document.getElementById(id); }
  function renderMeta(){
    var D = STATS(), m = D.meta || {};
    var pts = (D.trend.count || []).length + (D.trend.rate || []).length
      + ((D.countries.items || []).length) + ((D.ages.items || []).length);
    if(el('dashUpdated')) el('dashUpdated').textContent = m.updated || '—';
    if(el('dashPoints')) el('dashPoints').textContent = pts;
    if(el('dashCaliber')) el('dashCaliber').textContent = m.caliber || '科普示意 · 非医疗统计口径';
    if(el('dashReview')) el('dashReview').textContent = m.reviewCycle || '定期复核';
    var list = el('dashSrcList');
    if(list){
      var html = '';
      (D.sources || []).forEach(function(s, i){
        var link = s.url
          ? '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">查看原文页 ↗</a>'
          : '<span class="src-nolink">无公开稳定链接</span>';
        html += '<li><b>' + s.org + '（' + s.year + '）</b>'
              + '<span class="src-type">' + (s.type || '来源') + '</span>'
              + '<p>' + s.title + '</p>' + link + '</li>';
      });
      if(!html) html = '<li class="src-empty">数据层未加载，当前使用内置兜底数据。</li>';
      list.innerHTML = html;
    }
    if(el('dashSrcCount')) el('dashSrcCount').textContent = (D.sources || []).length;
    if(el('capTrend')) el('capTrend').textContent = '人数 6 个数据点（首末为发布值，中间为估算）· 患病率 3 个口径点，未连线';
    if(el('capCountry')) el('capCountry').textContent = '含全球约 6700 万（WHO）对照，「其他国家」为差额推算';
    if(el('capAge')) el('capAge').textContent = '按 14 岁以下约 500 万（人民日报·民生周刊 2025）拆分示意';
  }

  function init(){
    renderMeta();
    var c1=el('chartLine'); if(c1){ lineChart(c1); bindLineHover(c1); }
    var c2=el('chartPie1'); if(c2){ pieChart(c2, STATS().countries.items, STATS().countries.unit); bindPieHover(c2); }
    var c3=el('chartPie2'); if(c3){ pieChart(c3, STATS().ages.items, STATS().ages.unit); bindPieHover(c3); }
  }
  // 仅重绘不重复绑定（浅色主题切换 / 数据刷新时调用）
  function redrawAll(){
    var c1=el('chartLine'); if(c1) lineChart(c1, null);
    var c2=el('chartPie1'); if(c2 && c2._items) pieChart(c2, c2._items, c2._unit, null);
    var c3=el('chartPie2'); if(c3 && c3._items) pieChart(c3, c3._items, c3._unit, null);
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
  document.addEventListener('theme:change', redrawAll);

  // 线上（http/https）：再取一次 others/data/stats.json，改了 JSON 不用重新生成 JS 也能生效；
  // 本地双击（file://）无法 fetch 本地文件，直接用 <script> 注入的 XYN_STATS，离线不受影响。
  function usable(j){
    return j && j.trend && j.trend.years && j.countries && j.ages && j.sources;
  }
  if(location.protocol === 'http:' || location.protocol === 'https:'){
    try{
      fetch('others/data/stats.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
        .then(function(j){ if(usable(j)){ window.XYN_STATS = j; renderMeta(); redrawAll(); } })
        .catch(function(){});
    }catch(e){}
  }
})();

// ---- AI 星空寄语卡片：LLM 生成寄语 + Canvas 绘制可保存卡片 ----
(function(){
  var themeInput = document.getElementById('wishTheme');
  var genBtn = document.getElementById('wishGen');
  var canvas = document.getElementById('wishCanvas');
  if(!themeInput || !genBtn || !canvas) return;
  var ctx = canvas.getContext('2d');
  var WISH_FALLBACK = [
    '愿每一颗星星，都被温柔看见。',
    '你慢慢来，我们都在等你发光。',
    '夜再长，星星也从不缺席。',
    '理解不是靠近一瞬间，而是愿意一直等。',
    '你的节奏，就是最好的节奏。',
    '不同，不是距离；看见，就是照亮。',
    '每一颗星，都有自己的轨道和光。',
    '温柔地对待不一样，世界就宽了一寸。',
    '今天也谢谢你，愿意多懂一点。',
    '把善意说出口，它就会发光。',
    '晚风会替我们，把祝福送到每一扇窗。',
    '不急，星星在天上，也在路上。'
  ];
  var drawing = false;
  function pickOne(l){ return l[Math.floor(Math.random() * l.length)]; }
  function localWish(){ return pickOne(WISH_FALLBACK); }
  function wrapText(text, font, maxWidth){
    ctx.font = font;
    var lines = [], line = '';
    for(var i = 0; i < text.length; i++){
      var test = line + text.charAt(i);
      if(ctx.measureText(test).width > maxWidth && line){ lines.push(line); line = text.charAt(i); }
      else { line = test; }
    }
    if(line) lines.push(line);
    return lines;
  }
  function drawStar(x, y, r){
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffd964';
    ctx.strokeStyle = '#ffd964';
    ctx.lineWidth = r * 0.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for(var i = 0; i < 5; i++){
      var a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      var b = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(b) * r * 0.45, Math.sin(b) * r * 0.45);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function drawCard(text, theme){
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070b22'); g.addColorStop(0.55, '#141b45'); g.addColorStop(1, '#232c66');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for(var i = 0; i < 90; i++){
      var x = Math.random() * W, y = Math.random() * H * 0.9, r = Math.random() * 1.6 + 0.4;
      ctx.globalAlpha = Math.random() * 0.7 + 0.25;
      ctx.fillStyle = Math.random() > 0.85 ? '#ffd964' : '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,217,100,.5)'; ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,217,100,.8)';
    ctx.font = '13px "Microsoft YaHei",sans-serif';
    ctx.fillText('星 夜 入 眠 · 星 语 寄 语', W / 2, 66);
    var top = 140;
    if(theme){
      ctx.fillStyle = 'rgba(255,217,100,.92)';
      ctx.font = '15px "Microsoft YaHei",sans-serif';
      ctx.fillText('「' + theme + '」', W / 2, top);
      top += 46;
    }
    var serif = '500 24px "Noto Serif SC","Songti SC","Microsoft YaHei",serif';
    var lines = wrapText(text, serif, W - 120);
    var areaTop = top + 20, areaBottom = H - 130;
    var startY = areaTop + (areaBottom - areaTop) / 2 - (lines.length - 1) * 21;
    ctx.fillStyle = '#f2f5ff';
    ctx.font = serif;
    for(var li = 0; li < lines.length; li++){
      ctx.fillText(lines[li], W / 2, startY + li * 42);
    }
    drawStar(W / 2, startY + lines.length * 42 + 26, 11);
    ctx.fillStyle = 'rgba(230,235,255,.55)';
    ctx.font = '12px "Microsoft YaHei",sans-serif';
    ctx.fillText('以星为灯 · 照亮来自星星的孩子', W / 2, H - 74);
    var d = new Date();
    ctx.fillText(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), W / 2, H - 52);
  }
  genBtn.addEventListener('click', function(e){
    e.stopPropagation();
    if(drawing) return;
    var theme = themeInput.value.replace(/^\s+|\s+$/g, '');
    drawing = true;
    genBtn.disabled = true;
    genBtn.textContent = '✦ 星语正在写…';
    function done(text){
      drawCard(text, theme);
      drawing = false;
      genBtn.disabled = false;
      genBtn.textContent = '✦ 再生成一张';
    }
    var settled = false;
    function fallback(){
      if(settled) return;
      settled = true;
      done(localWish());
    }
    if(window.starWishAI){
      var timer = setTimeout(fallback, 12000);
      window.starWishAI(theme, function(text){
        clearTimeout(timer);
        if(settled) return;
        settled = true;
        done(text || localWish());
      });
    } else {
      fallback();
    }
  }, false);
  drawCard(WISH_FALLBACK[0], '');
})();

// ---- 快速问卷：3 题，答完显示科普贴士 ----
(function(){
  var opts = document.querySelectorAll('.quiz-opt');
  if(!opts.length) return;
  var tips = [
    '自闭症是先天神经发育差异，不是心理疾病，也不是性格或教养问题。',
    '只有少数谱系个体具备特殊才能，更多孩子需要长期支持——神话化同样是标签。',
    '不围观、不指责、留出空间，是公共场所最温柔的做法。'
  ];
  var answered = {};
  var score = 0;
  opts.forEach(function(b){
    b.addEventListener('click', function(){
      var q = +b.parentNode.getAttribute('data-q');
      if(answered[q] === undefined){ /* 首次作答才计分 */ }
      var firstTime = !answered[q];
      b.parentNode.querySelectorAll('.quiz-opt').forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
      var right = (q===0 && /先天神经发育差异/.test(b.textContent)) || (q===1 && /少数人有/.test(b.textContent)) || (q===2 && /不围观/.test(b.textContent));
      if(firstTime){
        answered[q] = 1;
        if(right) score++;
      }
      var fb = document.querySelector('.quiz-fb[data-q="'+q+'"]');
      if(fb){ fb.textContent = (right ? '✓ 答对了：' : '✦ 小贴士：') + tips[q]; }
      if(answered[0] && answered[1] && answered[2]){
        var done = document.getElementById('quizDone');
        if(done){
          var tier = score === 3 ? '🌟 了解指数 100：三题全对！你对自闭症的认知已经很到位'
            : score === 2 ? '✨ 了解指数 ' + (60 + score * 10) + '：答对 ' + score + ' / 3 题，已经有不错的认知基础'
            : '✦ 了解指数 ' + (30 + score * 10) + '：答对 ' + score + ' / 3 题，正好从这里开始走近他们';
          done.textContent = tier + '——把这份了解分享给身边的人，就是一份善意。';
          if(!document.getElementById('quizGoBtn')){
            var gb = document.createElement('button');
            gb.className = 'film-btn'; gb.id = 'quizGoBtn'; gb.type = 'button';
            gb.textContent = '继续深入了解 →';
            gb.style.marginTop = '14px';
            gb.addEventListener('click', function(e){
              e.stopPropagation();
              if(typeof switchView === 'function') switchView('science');
            });
            done.parentNode.appendChild(gb);
          }
        }
      }
    });
  });
})();

// ---- 电子公益证书：canvas 实时生成 ----
(function(){
  var nameInput = document.getElementById('certName');
  var canvas = document.getElementById('certCanvas');
  if(!nameInput || !canvas) return;
  var ctx = canvas.getContext('2d');
  var bgImg = new Image();
  bgImg.src = 'images/asset_20.webp';
  function draw(){
    var name = nameInput.value.trim() || '一位有爱的你';
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    if(bgImg.complete && bgImg.naturalWidth){
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      var g = ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#0b1030'); g.addColorStop(1,'#1b2458');
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    }
    bgImg.onload = draw;
    ctx.strokeStyle = 'rgba(255,217,138,.7)'; ctx.lineWidth = 3; ctx.strokeRect(18,18,w-36,h-36);
    ctx.strokeStyle = 'rgba(255,217,138,.25)'; ctx.lineWidth = 1; ctx.strokeRect(28,28,w-56,h-56);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd98a'; ctx.font = 'bold 38px "Microsoft YaHei",sans-serif';
    ctx.fillText('公益科普 · 电子证书', w/2, 92);
    ctx.font = '20px "Microsoft YaHei",sans-serif'; ctx.fillStyle = '#c9d3f2';
    ctx.fillText('星夜入眠 · 关爱自闭症儿童科普站', w/2, 130);
    ctx.fillStyle = '#e6ebff'; ctx.font = '19px "Microsoft YaHei",sans-serif';
    ctx.fillText('兹证明', w/2, 192);
    ctx.font = 'bold 30px "Microsoft YaHei",sans-serif'; ctx.fillStyle = '#ffffff';
    ctx.fillText(name, w/2, 240);
    ctx.font = '17px "Microsoft YaHei",sans-serif'; ctx.fillStyle = '#c9d3f2';
    ctx.fillText('已了解自闭症科普知识，愿意以理解与包容', w/2, 288);
    ctx.fillText('守护每一颗来自星星的孩子', w/2, 318);
    var d = new Date(); var ds = d.getFullYear() + ' 年 ' + (d.getMonth()+1) + ' 月 ' + d.getDate() + ' 日';
    ctx.fillStyle = '#8fa0d8'; ctx.font = '15px "Microsoft YaHei",sans-serif';
    ctx.fillText('颁发日期：' + ds, w/2, 374);
    ctx.fillText('星夜入眠 · 以星为灯', w/2, 406);
  }
  nameInput.addEventListener('input', draw);
  draw();
})();

// ---- 一键分享 ----
(function(){
  var btn = document.getElementById('shareBtn');
  if(!btn) return;
  btn.addEventListener('click', function(){
    var url = location.href;
    var text = '走进星星的孩子，学会用温柔的方式爱他们——「星夜入眠」公益科普站';
    if(navigator.share){
      navigator.share({title:'星夜入眠', text:text, url:url}).catch(function(){});
    } else if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text + ' ' + url).then(function(){
        alert('链接已复制，快去分享给朋友吧 ✦');
      }).catch(function(){ alert('请复制网址分享给朋友 ✦'); });
    } else {
      alert('请复制网址分享给朋友 ✦');
    }
  });
})();

// ---- 无障碍字号：已收口到「⚙ 设置」面板（11-settings.js 统一管理，此处保留空位避免旧引用报错） ----
