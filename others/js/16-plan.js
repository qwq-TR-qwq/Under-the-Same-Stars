/* ===== 16-plan.js：一周陪伴计划（三步规划工作流） =====
 * 与"单轮问答"的区别：这里 AI 要先自己做规划——
 *   第 1 步 家长一句话描述困境
 *   第 2 步 AI 自己判断"还缺什么信息"，追问 2–3 个问题（缺信息就不硬编计划）
 *   第 3 步 生成可执行的一周计划卡，存本机、逐日打卡
 *   第 4 步 下周回来，按执行情况重排（计划是活的，不是一次性文案）
 * 断网 / 接口失败：用本地规则库拼一张保守模板卡，绝不留白屏。
 * 所有数据只存 localStorage，不上传。
 */
(function () {
  'use strict';

  var KEY = 'xyn_plan_v1';
  var HIST = 'xyn_plan_hist_v1';

  var elOpen = document.getElementById('planOpen');
  var elMask = document.getElementById('planMask');
  var elBody = document.getElementById('planBody');
  var elClose = document.getElementById('planClose');
  if (!elOpen || !elMask || !elBody) return;

  var CHIPS = ['一到商场就崩溃', '晚上不肯睡', '快三岁还不太说话', '在幼儿园坐不住', '只吃白米饭', '换个路线就炸'];

  var S = { step: 'intro', draft: '', questions: [], answers: [], plan: null, note: '', busy: false, from: 'none' };

  /* ---------- 小工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function now() { return Date.now(); }
  function dayIndex(ts) { var d = new Date(ts); return (d.getDay() + 6) % 7; } // 周一=0

  function checksCount(p) {
    if (!p || !p.checks) return 0;
    var n = 0;
    for (var i = 0; i < 7; i++) { if (p.checks['d' + i]) n++; }
    return n;
  }

  /* ---------- 本地规则库（断网兜底） ---------- */
  var PRESETS = [
    { k: ['超市', '商场', '吵', '人多', '崩溃', '尖叫', '躺地', '出门'], tag: 'public',
      today: '出门前先给他看一张"要去哪、买什么、多久回"的三格图，到门口先站 30 秒再进去',
      weekly: '这周外出 2 次，每次不超过 20 分钟，能自己走出商场就算成功',
      avoid: ['别在孩子崩溃时讲道理，他此刻听不进任何语言', '别为了"练胆量"硬拉他进更吵的地方', '别在围观人群前训斥或强行抱走，先撤离再说'],
      seek: ['出现撞头、抓伤自己等自伤行为', '连续两周每天都有一次以上崩溃，且越来越难安抚'],
      basis: '感官过载下的崩溃不是"不听话"，先降刺激再谈规则，比事后教育有效。' },
    { k: ['睡', '夜醒', '入睡', '不肯睡', '半夜', '起床'], tag: 'sleep',
      today: '固定今晚的睡前顺序：洗澡 → 关大灯 → 同一首轻音乐 → 上床，全程不说话不催促',
      weekly: '这周七天里做到五天同一时间上床，入睡时间波动不超过 30 分钟',
      avoid: ['别用"再不睡就不要你了"这类威胁，睡眠问题会变成情绪问题', '别睡前玩追逐打闹或看快节奏动画', '别每天换哄睡方式，越换越难建立预期'],
      seek: ['连续一周每晚醒来超过 3 次且难以再入睡', '出现打鼾憋气、白天异常困倦'],
      basis: '自闭症孩子对"顺序"高度依赖，固定的睡前流程本身就是最强的安抚信号。' },
    { k: ['不说话', '语言', '开口', '不会说', '发音', '词'], tag: 'speech',
      today: '把他最爱的零食放进透明罐子，拧紧但不锁死，等他自己看你、指或发声，再打开',
      weekly: '这周制造 10 次"必须沟通才能得到"的机会，记录他用了哪种方式（看/指/声/词）',
      avoid: ['别一直追问"你说啊，说这是什么"，压力会让开口更难', '别他一指就立刻递过去，会跳过沟通这一步', '别拿"别人家孩子都会背诗了"做比较'],
      seek: ['两岁还没有任何有意义的词', '原本会说的词明显减少甚至消失'],
      basis: '沟通动机先于语言形式，先让他体验到"表达有用"，词才会长出来。' },
    { k: ['幼儿园', '上学', '老师', '坐不住', '课堂', '小学'], tag: 'school',
      today: '和老师约定一个只有你们懂的"求助手势"，今天教会孩子：难受时举一下手就可以离开',
      weekly: '这周记录 3 次他在园里的"能待住"时长，而不是记录他闹了几次',
      avoid: ['别一放学就问"今天乖不乖"，换成"今天哪件事最难"', '别要求老师"多包容"却不给具体做法', '别用请长假的方式回避，退回去再进更难'],
      seek: ['连续一周拒绝进教室并伴随呕吐、发烧等身体反应', '出现被同学欺负或老师明显排斥的情况'],
      basis: '先给一个体面的退出通道，孩子才敢待在教室里；能退出才谈得上融入。' },
    { k: ['吃', '挑食', '只吃', '不吃饭', '吃饭', '菜'], tag: 'food',
      today: '把一种新食物切成小块放在他碗边，不要求吃，只要求它"在场"，坚持三天',
      weekly: '这周让 2 种新食物稳定出现在餐桌上，能碰一下或闻一下就算达成',
      avoid: ['别把新食物藏进他爱吃的饭里，一次被骗会让他更抗拒', '别在餐桌上僵持超过 20 分钟，撤走比硬塞好', '别用甜食做奖励，会把食物分成好坏两等'],
      seek: ['体重下降或长期只吃 3 种以内食物', '吃饭时频繁干呕、呛咳'],
      basis: '新食物的接受平均需要 8–15 次"无害接触"，脱敏比说服有效。' },
    { k: ['情绪', '打人', '咬', '发脾气', '哭', '摔东西', '自伤'], tag: 'emotion',
      today: '准备一张"我现在很生气"的卡片，在他情绪起来前教他递给你，今天练 3 次',
      weekly: '这周做到：情绪爆发时不讲道理、不围观，先带离现场，事后 1 小时再复盘',
      avoid: ['别在他爆发时问"你为什么这样"，他答不出来会更急', '别用更大的音量压住他，那只是把恐惧当服从', '别事后翻旧账，复盘只谈下一次怎么做'],
      seek: ['出现打头、咬手等自伤并留下伤痕', '情绪爆发后长时间（超过 1 小时）无法平复'],
      basis: '情绪爆发时大脑的"讲道理通道"是关闭的，先降 arousal，再谈规则。' },
    { k: ['如厕', '尿', '拉', '马桶', '裤子'], tag: 'toilet',
      today: '把马桶时间固定成每 60 分钟一次，坐 2 分钟就起来，不要求一定尿出来',
      weekly: '这周记录"成功坐上马桶"的次数，目标 15 次，不看有没有尿',
      avoid: ['别在他尿裤子后表现出厌恶或惩罚', '别频繁追问"要不要尿"，问多了会变成对抗', '别在出门前强迫他必须尿完'],
      seek: ['五岁后仍完全无如厕意识', '憋尿超过 6 小时或反复尿路感染'],
      basis: '如厕训练的第一步是"愿意坐"，把目标和结果拆开，进度才不会被情绪卡住。' },
    { k: ['朋友', '社交', '玩', '同伴', '一起'], tag: 'social',
      today: '约一个性格温和的孩子来家里 30 分钟，各玩各的也行，只要在同一个房间',
      weekly: '这周安排 2 次"平行玩耍"，目标是他在场不逃避，而不是"交到朋友"',
      avoid: ['别硬推他"去和小朋友玩"，被拒绝的体验会让他更退', '别替他回答所有问题，留 3 秒给他自己', '别拿"你怎么不合群"评价他'],
      seek: ['完全不与任何成人有目光或回应', '在集体中出现持续被孤立、被排斥'],
      basis: '社交从"共享空间"开始，不要求互动，先降低在场成本。' }
  ];

  function pickPreset(text) {
    var t = String(text || ''), best = null, bestN = 0;
    for (var i = 0; i < PRESETS.length; i++) {
      var n = 0;
      for (var j = 0; j < PRESETS[i].k.length; j++) { if (t.indexOf(PRESETS[i].k[j]) >= 0) n++; }
      if (n > bestN) { bestN = n; best = PRESETS[i]; }
    }
    return best;
  }

  var GENERIC = {
    today: '挑一个每天都会发生的小场景（比如刷牙），把它拆成三个固定步骤，今天只做第一步',
    weekly: '这周只盯一件事，每天记录一次"做到了/没做到"，不评价好坏',
    avoid: ['别同时改三件事，一次只动一个变量', '别把"没做到"当成孩子不配合，先看任务是不是太大', '别省略自己的休息，家长垮了计划一定垮'],
    seek: ['出现自伤、伤人、走失等安全问题', '连续两周明显退步（已会的技能消失）'],
    basis: '行为改变的最小单位是"一个场景 + 一个动作"，范围越小越可能坚持。'
  };

  function fallbackQuestions() {
    return [
      { q: '孩子现在多大了？', type: 'single', options: ['2–3 岁', '4–5 岁', '6–8 岁', '9 岁以上'] },
      { q: '这件事多久发生一次？', type: 'single', options: ['每天好几次', '每天一次', '一周几次', '说不准'] },
      { q: '之前试过什么办法？', type: 'single', options: ['讲道理', '转移注意力', '强行制止', '还没试过'] }
    ];
  }

  function fallbackPlan(text) {
    var p = pickPreset(text) || GENERIC;
    return {
      today: p.today, weekly: p.weekly,
      avoid: p.avoid.slice(0, 3), seek: p.seek.slice(0, 2), basis: p.basis
    };
  }

  /* ---------- AI 两步调用 ---------- */
  function aiQuestions(cb) {
    if (!window.__aiJSON) { cb(null); return; }
    var msgs = [
      { role: 'system', content: '你在帮一位自闭症孩子的家长排"一周陪伴计划"，现在是第 2 步：判断还缺什么信息。\n只输出 JSON，不要任何解释文字，格式：\n{"questions":[{"q":"问题（22 字内，说人话）","type":"single","options":["选项1","选项2","选项3"]}]}\n规则：2 到 3 道题；家长原话里已经说了的不要再问；不要问诊断结论或病因；每道题尽量给 3–4 个选项，实在无法选项化才用 "type":"text"；问题要能直接影响"这周做什么"。' },
      { role: 'user', content: '家长原话：' + S.draft }
    ];
    window.__aiJSON(msgs, function (j) {
      var qs = j && j.questions;
      if (!qs || !qs.length) { cb(null); return; }
      var out = [];
      for (var i = 0; i < qs.length && out.length < 3; i++) {
        var q = qs[i] || {};
        var text = String(q.q || '').replace(/^\s+|\s+$/g, '');
        if (!text) continue;
        var opts = [];
        if (q.options && q.options.length) { for (var k = 0; k < q.options.length && opts.length < 4; k++) { opts.push(String(q.options[k])); } }
        out.push({ q: text, type: opts.length ? 'single' : 'text', options: opts });
      }
      cb(out.length ? out : null);
    });
  }

  function aiPlan(prev, cb) {
    if (!window.__aiJSON) { cb(null); return; }
    var info = S.answers.map(function (a) { return a.q + '：' + a.a; }).join('；');
    var sys = '你在帮一位自闭症孩子的家长排"一周陪伴计划"，现在是第 3 步：产出这一周的具体安排。\n只输出 JSON，不要任何解释文字，格式：\n{"today":"今天能做的一件具体小事（34 字内，动词开头）","weekly":"本周目标（22 字内，可观察、可验证）","avoid":["不要做的具体一条","第二条","第三条"],"seek":["需要就医或求助的情形","第二条"],"basis":"为什么这样排（46 字内）"}\n硬要求：具体到动作、次数、场景，禁止"多陪伴""多鼓励""要有耐心"这类空话；不承诺疗效、不替代诊断；语气像有经验的老家长，平实不煽情。';
    if (prev) {
      sys += '\n这是第二次调整：保留上一轮里家长真正做到的、有效的部分；对连续没做到的项目，必须降低难度（拆得更小或减少次数），不要重复原样再要求一遍。';
    }
    var user = '家长原话：' + S.draft + '\n补充信息：' + (info || '无');
    if (prev) {
      user += '\n上一轮计划：' + JSON.stringify(prev.plan) + '\n执行情况：7 天里打卡 ' + checksCount(prev) + ' 天，未完成 ' + (7 - checksCount(prev)) + ' 天。';
    }
    window.__aiJSON([
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ], function (j) {
      if (!j || !j.today || !j.weekly) { cb(null); return; }
      var avoid = [], seek = [];
      if (j.avoid && j.avoid.length) { for (var i = 0; i < j.avoid.length && avoid.length < 3; i++) avoid.push(String(j.avoid[i])); }
      if (j.seek && j.seek.length) { for (var k = 0; k < j.seek.length && seek.length < 2; k++) seek.push(String(j.seek[k])); }
      cb({
        today: String(j.today), weekly: String(j.weekly),
        avoid: avoid.length ? avoid : fallbackPlan(S.draft).avoid,
        seek: seek.length ? seek : fallbackPlan(S.draft).seek,
        basis: String(j.basis || '')
      });
    });
  }

  /* ---------- 渲染 ---------- */
  function render() {
    if (S.step === 'intro') return renderIntro();
    if (S.step === 'ask') return renderAsk();
    if (S.step === 'loading') return renderLoading();
    return renderPlan();
  }

  function renderIntro() {
    var chips = '';
    for (var i = 0; i < CHIPS.length; i++) {
      chips += '<button class="plan-chip" type="button" data-act="chip" data-v="' + esc(CHIPS[i]) + '">' + esc(CHIPS[i]) + '</button>';
    }
    elBody.innerHTML = [
      '<div class="plan-step"><i>第 1 步</i> 说说看</div>',
      '<h3 class="plan-h">现在最让你头疼的是哪件事？</h3>',
      '<p class="plan-p">不用组织语言，像跟朋友吐槽那样说一句就行。星语不会直接给你一段大道理——它会先判断还缺什么信息，问你 2–3 个问题，再排成这一周具体做什么。</p>',
      '<textarea class="plan-ta" id="planDraft" maxlength="300" placeholder="例：孩子 5 岁，最近一到超市就躺地上尖叫，我不知道该硬抱走还是等他哭完…">' + esc(S.draft) + '</textarea>',
      '<div class="plan-chips">' + chips + '</div>',
      '<div class="plan-actions"><button class="plan-btn" type="button" data-act="ask">下一步 · 让星语问我</button></div>',
      '<p class="plan-tip">计划只保存在你自己的浏览器里，不上传服务器；断网时会用本地保守模板兜底。</p>'
    ].join('');
    var ta = document.getElementById('planDraft');
    if (ta) { ta.addEventListener('input', function () { S.draft = ta.value; }); }
  }

  function renderAsk() {
    var html = ['<div class="plan-step"><i>第 2 步</i> 星语的追问</div>',
      '<h3 class="plan-h">动手排之前，星语还想确认 ' + S.questions.length + ' 件事</h3>',
      '<p class="plan-p">这几项直接决定计划能不能落地，所以先问清楚——信息不够时它不会硬编一个看起来漂亮的方案。</p>',
      '<div class="plan-qs">'];
    for (var i = 0; i < S.questions.length; i++) {
      var q = S.questions[i];
      html.push('<div class="plan-q" data-qi="' + i + '"><b>' + (i + 1) + '. ' + esc(q.q) + '</b>');
      if (q.type === 'text') {
        html.push('<input class="plan-inp" type="text" data-qi="' + i + '" maxlength="60" placeholder="简单写一句">');
      } else {
        html.push('<div class="plan-opts">');
        for (var j = 0; j < q.options.length; j++) {
          html.push('<button class="plan-opt" type="button" data-act="opt" data-qi="' + i + '" data-v="' + esc(q.options[j]) + '">' + esc(q.options[j]) + '</button>');
        }
        html.push('</div>');
      }
      html.push('</div>');
    }
    html.push('</div>');
    html.push('<div class="plan-actions"><button class="plan-btn ghost" type="button" data-act="back">‹ 改一下描述</button><button class="plan-btn" type="button" data-act="gen">生成这一周的计划</button></div>');
    html.push('<p class="plan-tip">' + (S.from === 'ai' ? '以上问题由模型根据你的描述生成。' : '当前未连上模型，用的是本地通用问法。') + '</p>');
    elBody.innerHTML = html.join('');
    // 回填已选答案
    for (var m = 0; m < S.answers.length; m++) {
      var a = S.answers[m];
      if (!a) continue;
      var opts = elBody.querySelectorAll('.plan-opt[data-qi="' + m + '"]');
      for (var n = 0; n < opts.length; n++) { if (opts[n].getAttribute('data-v') === a.a) opts[n].classList.add('on'); }
      var inp = elBody.querySelector('.plan-inp[data-qi="' + m + '"]');
      if (inp) inp.value = a.a;
    }
  }

  function renderLoading() {
    elBody.innerHTML = [
      '<div class="plan-step"><i>第 3 步</i> 正在排这一周</div>',
      '<div class="plan-loading">',
      '<div class="plan-dots"><i></i><i></i><i></i></div>',
      '<p>星语正在把「' + esc(S.draft).slice(0, 40) + '」拆成这一周能做的动作…</p>',
      '<p class="plan-load-sub">先定今天做的一件小事，再定一周目标，最后标出什么时候该找医生。</p>',
      '</div>'
    ].join('');
  }

  function renderPlan() {
    var p = S.plan;
    if (!p) { S.step = 'intro'; return renderIntro(); }
    var pl = p.plan;
    var done = checksCount(p);
    var avoid = '', seek = '';
    for (var i = 0; i < pl.avoid.length; i++) { avoid += '<li>' + esc(pl.avoid[i]) + '</li>'; }
    for (var j = 0; j < pl.seek.length; j++) { seek += '<li>' + esc(pl.seek[j]) + '</li>'; }
    var days = '';
    var todayIdx = dayIndex(now());
    for (var d = 0; d < 7; d++) {
      var on = p.checks && p.checks['d' + d] ? ' on' : '';
      var isToday = (d === todayIdx && !p.adjusted) ? ' today' : '';
      days += '<button class="plan-day' + on + isToday + '" type="button" data-act="check" data-d="' + d + '" aria-pressed="' + (on ? 'true' : 'false') + '" title="第 ' + (d + 1) + ' 天">' + (d + 1) + '</button>';
    }
    var adjustNote = S.note ? '<p class="plan-note">' + esc(S.note) + '</p>' : '';
    var canAdjust = done >= 2;
    elBody.innerHTML = [
      '<div class="plan-step"><i>第 3 步</i> 这一周的计划' + (p.version > 1 ? ' · 第 ' + p.version + ' 版' : '') + '</div>',
      adjustNote,
      '<div class="plan-card">',
      '  <div class="plan-today"><span class="pt-lab">今天只做这一件</span><p>' + esc(pl.today) + '</p></div>',
      '  <div class="plan-goal"><span class="pg-lab">本周目标</span><p>' + esc(pl.weekly) + '</p></div>',
      '  <div class="plan-grid">',
      '    <div class="plan-sec"><h4><span aria-hidden="true">⚠</span> 三个避坑</h4><ul>' + avoid + '</ul></div>',
      '    <div class="plan-sec seek"><h4><span aria-hidden="true">🏥</span> 这些情况别拖</h4><ul>' + seek + '</ul></div>',
      '  </div>',
      (pl.basis ? '<div class="plan-basis"><b>为什么这样排</b>' + esc(pl.basis) + '</div>' : ''),
      '</div>',
      '<div class="plan-check">',
      '  <div class="plan-check-head"><b>每天做到就打一个勾</b><span>已坚持 <i>' + done + '</i> / 7 天</span></div>',
      '  <div class="plan-days">' + days + '</div>',
      '  <div class="plan-bar"><i style="width:' + Math.round(done / 7 * 100) + '%"></i></div>',
      '</div>',
      '<div class="plan-actions">',
      '  <button class="plan-btn ghost" type="button" data-act="reset">换一件事重新说</button>',
      '  <button class="plan-btn" type="button" data-act="adjust"' + (canAdjust ? '' : ' disabled title="先打卡 2 天，星语才知道哪里需要降难度"') + '>按执行情况调整</button>',
      '</div>',
      '<p class="plan-tip">计划保存在本机浏览器（localStorage），不上传；打卡记录用于下一次调整。内容仅供家庭参考，不构成诊断或治疗建议。</p>'
    ].join('');
  }

  /* ---------- 流程 ---------- */
  function startAsk() {
    var t = String(S.draft || '').replace(/^\s+|\s+$/g, '');
    if (t.length < 4) { flash('再多说一句吧，比如孩子几岁、什么事最让你头疼。'); return; }
    S.draft = t;
    S.questions = []; S.answers = [];
    S.step = 'ask'; S.busy = true; S.from = 'ai';
    elBody.innerHTML = '<div class="plan-loading"><div class="plan-dots"><i></i><i></i><i></i></div><p>星语正在判断还缺哪些信息…</p></div>';
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return; settled = true; S.busy = false; S.from = 'local';
      S.questions = fallbackQuestions(); render();
    }, 20000);
    aiQuestions(function (qs) {
      if (settled) return; settled = true;
      clearTimeout(timer); S.busy = false;
      if (!qs) { S.from = 'local'; qs = fallbackQuestions(); }
      S.questions = qs;
      S.answers = new Array(qs.length);
      render();
    });
  }

  function startGenerate() {
    var missing = 0;
    for (var i = 0; i < S.questions.length; i++) { if (!S.answers[i] || !S.answers[i].a) missing++; }
    if (missing) { flash('还有 ' + missing + ' 个问题没选，选完星语才好排。'); return; }
    S.step = 'loading'; render();
    var prev = S.plan;
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return; settled = true;
      commitPlan(fallbackPlan(S.draft), prev, 'local');
    }, 25000);
    aiPlan(prev, function (pl) {
      if (settled) return; settled = true;
      clearTimeout(timer);
      commitPlan(pl || fallbackPlan(S.draft), prev, pl ? 'ai' : 'local');
    });
  }

  function commitPlan(pl, prev, src) {
    var version = prev ? (prev.version || 1) + 1 : 1;
    var plan = {
      v: 1, version: version, createdAt: now(), issue: S.draft,
      answers: S.answers.filter(function (a) { return a && a.a; }),
      plan: pl, checks: prev ? (prev.checks || {}) : {}, adjusted: !!prev
    };
    if (prev && version > 1) {
      var hist = readJSON(HIST) || [];
      hist.push({ version: prev.version || 1, plan: prev.plan, checks: prev.checks || {}, createdAt: prev.createdAt });
      while (hist.length > 5) hist.shift();
      writeJSON(HIST, hist);
    }
    writeJSON(KEY, plan);
    S.plan = plan;
    S.step = 'plan';
    S.note = prev ? '已按你打卡 ' + checksCount(prev) + ' 天的执行情况重排：做到的保留，做不到的降了难度。'
      : (src === 'local' ? '当前未连上模型，这张卡由本地知识库生成（保守版本）。' : '');
    render();
  }

  function toggleCheck(d) {
    var p = S.plan; if (!p) return;
    p.checks = p.checks || {};
    p.checks['d' + d] = !p.checks['d' + d];
    writeJSON(KEY, p);
    render();
  }

  function flash(msg) {
    var old = elBody.querySelector('.plan-flash');
    if (old) old.parentNode.removeChild(old);
    var d = document.createElement('p');
    d.className = 'plan-flash';
    d.setAttribute('role', 'status');
    d.textContent = msg;
    elBody.insertBefore(d, elBody.firstChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 3200);
  }

  /* ---------- 开关 ---------- */
  function open() {
    var saved = readJSON(KEY);
    if (saved && saved.plan) {
      S.plan = saved; S.draft = saved.issue || ''; S.step = 'plan'; S.note = '';
    } else {
      S.step = 'intro'; S.draft = ''; S.plan = null; S.note = '';
    }
    S.answers = S.plan && S.plan.answers ? S.plan.answers.slice() : [];
    elMask.classList.add('open');
    render();
  }
  function close() { elMask.classList.remove('open'); }

  /* ---------- 事件 ---------- */
  elOpen.addEventListener('click', function (e) { e.preventDefault(); open(); });
  if (elClose) elClose.addEventListener('click', close);

  elBody.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== elBody && !t.getAttribute) t = t.parentNode;
    if (!t || t === elBody) return;
    var act = t.getAttribute('data-act');
    if (!act) return;
    if (act === 'chip') {
      S.draft = t.getAttribute('data-v');
      var ta = document.getElementById('planDraft');
      if (ta) { ta.value = S.draft; ta.focus(); }
      return;
    }
    if (act === 'ask') { startAsk(); return; }
    if (act === 'back') { S.step = 'intro'; render(); return; }
    if (act === 'opt') {
      var qi = parseInt(t.getAttribute('data-qi'), 10);
      var v = t.getAttribute('data-v');
      S.answers[qi] = { q: S.questions[qi].q, a: v };
      var group = elBody.querySelectorAll('.plan-opt[data-qi="' + qi + '"]');
      for (var i = 0; i < group.length; i++) group[i].classList.remove('on');
      t.classList.add('on');
      return;
    }
    if (act === 'gen') { startGenerate(); return; }
    if (act === 'check') { toggleCheck(parseInt(t.getAttribute('data-d'), 10)); return; }
    if (act === 'reset') { S.step = 'intro'; S.draft = ''; S.plan = null; S.note = ''; render(); return; }
    if (act === 'adjust') {
      if (t.disabled) return;
      if (checksCount(S.plan) < 2) { flash('先打卡 2 天，星语才知道哪里需要降难度。'); return; }
      S.step = 'loading'; render();
      var settled = false;
      var prev = S.plan;
      var timer = setTimeout(function () { if (settled) return; settled = true; commitPlan(fallbackPlan(S.draft), prev, 'local'); }, 25000);
      aiPlan(prev, function (pl) {
        if (settled) return; settled = true;
        clearTimeout(timer);
        commitPlan(pl || fallbackPlan(S.draft), prev, pl ? 'ai' : 'local');
      });
      return;
    }
  });

  elBody.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('plan-inp')) return;
    var qi = parseInt(t.getAttribute('data-qi'), 10);
    S.answers[qi] = { q: S.questions[qi].q, a: t.value };
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!elMask.classList.contains('open')) return;
    close();
  });

  // 测试与外部调用入口
  window.__plan = {
    open: open, close: close,
    state: function () { return { step: S.step, draft: S.draft, questions: S.questions, answers: S.answers, plan: S.plan, note: S.note }; },
    reset: function () { try { localStorage.removeItem(KEY); localStorage.removeItem(HIST); } catch (e) {} S.step = 'intro'; S.plan = null; S.draft = ''; }
  };
})();
