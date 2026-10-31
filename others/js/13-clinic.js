/* ===== 13-clinic.js：就医准备清单生成器 =====
 * 家长的真实痛点：带孩子看儿保/发育行为科时说不清"孩子平时什么样"。
 * 本工具把家庭观察整理成结构化的一页 A4：
 *   基本信息 → 最担心的事 → 勾选观察项（含频率）→ 时间线 → 已尝试方法 → 就诊提示
 * 勾选内容保存在本机（localStorage），可以反复补充；生成后走系统打印（可另存 PDF）。
 * 本单仅供就诊沟通参考，不构成任何诊断。
 */
(function () {
  'use strict';

  var KEY = 'xyn_clinic_v1';
  var mask = document.getElementById('clinicMask');
  if (!mask) return;

  // —— 观察清单（依据公开科普资料整理，供家庭记录，非诊断量表）——
  var GROUPS = [
    { name: '社交与沟通', items: [
      '很少与人对视，或对视时间很短',
      '叫名字常常没反应，但听力检查正常',
      '不会用手指指物来表达需求或分享',
      '很少主动展示、分享喜欢的东西',
      '难以理解玩笑、比喻或别人的表情',
      '更喜欢自己玩，很少主动找同伴'
    ]},
    { name: '语言与交流', items: [
      '说话明显晚于同龄孩子，或至今不开口',
      '曾经会说的话又慢慢不说了（语言倒退）',
      '常常重复别人说的话或电视里的台词（仿说）',
      '"你""我"等代词经常用反',
      '说话语调平平，或音量节奏明显特别'
    ]},
    { name: '行为与兴趣', items: [
      '有重复动作：拍手、转圈、踮脚、排列玩具等',
      '坚持固定路线、固定顺序，被打断会非常难受',
      '对变化极度抗拒，如换餐具、换路线就崩溃',
      '兴趣非常狭窄而强烈（如只玩车轮、只谈恐龙）',
      '玩玩具更多是敲、扔、转，而非功能性地玩'
    ]},
    { name: '感官反应', items: [
      '听到吹风机、吸尘器等声音会捂耳、惊慌',
      '对强光回避或特别追光看',
      '抗拒洗头、剪指甲、某些衣料，或完全相反地寻求触碰',
      '挑食严重，只吃固定的几种食物',
      '对疼痛、温度似乎不敏感'
    ]},
    { name: '情绪与安全', items: [
      '情绪崩溃频繁且难安抚，持续较久',
      '有撞头、咬手等自伤行为',
      '曾在公共场所走失或毫无目标地跑开',
      '入睡困难、夜醒频繁或睡眠时间明显异常'
    ]}
  ];

  var FREQ = ['偶尔（每月几次内）', '经常（每周都有）', '频繁（几乎每天）'];

  var checksBox = document.getElementById('clChecks');
  var printLayer = document.getElementById('clinicPrint');

  // —— 状态读写（本机持久化：家长可以分几天慢慢补记录）——
  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // —— 渲染清单 ——
  function render() {
    if (!checksBox) return;
    var st = loadState();
    var html = '';
    for (var g = 0; g < GROUPS.length; g++) {
      var grp = GROUPS[g];
      html += '<div class="cl-group"><b>' + esc(grp.name) + '</b><div class="cl-items">';
      for (var i = 0; i < grp.items.length; i++) {
        var key = g + '-' + i;
        var on = !!(st[key] && st[key].on);
        var freq = st[key] ? (st[key].freq || 0) : 0;
        html += '<label class="cl-item' + (on ? ' sel' : '') + '">'
          + '<input type="checkbox" data-key="' + key + '"' + (on ? ' checked' : '') + '>'
          + '<span>' + esc(grp.items[i]) + '</span>'
          + '<select data-key="' + key + '" aria-label="出现频率">';
        for (var f = 0; f < FREQ.length; f++) {
          html += '<option value="' + f + '"' + (freq === f ? ' selected' : '') + '>' + FREQ[f] + '</option>';
        }
        html += '</select></label>';
      }
      html += '</div></div>';
    }
    checksBox.innerHTML = html;
  }

  function bindChecks() {
    if (!checksBox) return;
    checksBox.addEventListener('change', function (e) {
      var t = e.target;
      var key = t.getAttribute('data-key');
      if (!key) return;
      var st = loadState();
      if (!st[key]) st[key] = { on: false, freq: 0 };
      if (t.type === 'checkbox') {
        st[key].on = t.checked;
        var wrap = t.closest('.cl-item');
        if (wrap) wrap.classList.toggle('sel', t.checked);
      } else {
        st[key].freq = parseInt(t.value, 10) || 0;
      }
      saveState(st);
    }, false);
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.replace(/^\s+|\s+$/g, '') : '';
  }

  // —— 生成打印单 ——
  function buildSheet() {
    var st = loadState();
    var today = new Date();
    var dateStr = today.getFullYear() + ' 年 ' + (today.getMonth() + 1) + ' 月 ' + today.getDate() + ' 日';

    var meta = [];
    var name = val('clName'), age = val('clAge'), span = val('clSpan');
    meta.push('<span><b>孩子：</b>' + (name ? esc(name) : '（未填）') + '</span>');
    meta.push('<span><b>月龄/年龄：</b>' + (age ? esc(age) : '（未填）') + '</span>');
    meta.push('<span><b>观察时段：</b>' + (span ? esc(span) : '（未填）') + '</span>');
    meta.push('<span><b>整理日期：</b>' + dateStr + '</span>');

    var worry = val('clWorry');
    var tried = val('clTried');

    var secHtml = '';
    var total = 0;
    for (var g = 0; g < GROUPS.length; g++) {
      var lines = '';
      for (var i = 0; i < GROUPS[g].items.length; i++) {
        var key = g + '-' + i;
        if (st[key] && st[key].on) {
          total++;
          lines += '<div class="cp-line"><i>☑</i><span>' + esc(GROUPS[g].items[i])
            + '</span><i style="margin-left:auto">出现频率：' + FREQ[st[key].freq || 0] + '</i></div>';
        }
      }
      if (lines) {
        secHtml += '<div class="cp-sec"><h2>' + esc(GROUPS[g].name) + '</h2>' + lines + '</div>';
      }
    }
    if (!total) secHtml = '<div class="cp-sec"><p style="font-size:14px;color:#555">（尚未勾选观察项）</p></div>';

    var tlRows = '';
    for (var t = 0; t < 4; t++) {
      var tv = val('clTl' + t);
      tlRows += '<tr><th>事件 ' + (t + 1) + '</th><td>' + (tv ? esc(tv) : '&nbsp;') + '</td></tr>';
    }

    return '<div class="cp-ops">'
      + '<button type="button" id="cpClose">‹ 返回修改</button>'
      + '<button type="button" id="cpGo" class="primary">打印 / 保存 PDF</button>'
      + '</div>'
      + '<div class="cp-sheet">'
      + '<h1>儿童发育行为 · 就诊准备单</h1>'
      + '<div class="cp-sub">由《星夜入眠》家长专区生成 · 供就诊沟通参考，不构成医学诊断</div>'
      + '<div class="cp-meta">' + meta.join('') + '</div>'
      + (worry ? '<div class="cp-worry"><b>家长最担心的事（请医生优先关注）：</b>' + esc(worry) + '</div>' : '')
      + secHtml
      + '<div class="cp-sec"><h2>重要事件时间线</h2><table class="cp-tl">' + tlRows + '</table></div>'
      + (tried ? '<div class="cp-sec"><h2>已经尝试过的方法</h2><div style="font-size:13.5px;line-height:1.9">' + esc(tried) + '</div></div>' : '')
      + '<div class="cp-note-box"><b>给家长的就诊提示：</b>'
      + '① 建议携带：既往体检与听力筛查结果、孩子日常短视频（家中与户外各一段）、幼儿园或老师的反馈；'
      + '② 医生问诊时直接出示本单，可节省描述时间；'
      + '③ 若医生建议评估，可询问评估项目名称与等候周期，并回填到时间线；'
      + '④ 带一件孩子最喜欢的小物，等候时帮助安抚。</div>'
      + '<div class="cp-foot">本单由《星夜入眠》公益科普网站生成，内容依据公开科普资料整理，仅作家庭观察记录与就诊沟通辅助，不构成诊断或治疗建议。如孩子出现自伤、持续情绪崩溃或安全风险，请立即就医或拨打 12356 心理援助热线。</div>'
      + '</div>';
  }

  function showPrint() {
    if (!printLayer) return;
    printLayer.innerHTML = buildSheet();
    printLayer.classList.add('show');
    printLayer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('print-clinic');
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    var go = document.getElementById('cpGo');
    var close = document.getElementById('cpClose');
    if (go) go.addEventListener('click', function () { window.print(); }, false);
    if (close) close.addEventListener('click', hidePrint, false);
  }
  function hidePrint() {
    if (!printLayer) return;
    printLayer.classList.remove('show');
    printLayer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('print-clinic');
    try { document.body.style.overflow = ''; } catch (e) {}
  }

  // —— 打开 / 关闭清单浮层 ——
  var openBtn = document.getElementById('clinicOpen');
  var closeBtn = document.getElementById('clinicClose');
  if (openBtn) {
    openBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      render();
      mask.classList.add('open');
    }, false);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); mask.classList.remove('open'); }, false);
  }
  mask.addEventListener('click', function (e) { if (e.target === mask) mask.classList.remove('open'); }, false);

  var makeBtn = document.getElementById('clMake');
  if (makeBtn) makeBtn.addEventListener('click', function (e) { e.stopPropagation(); showPrint(); }, false);
  var resetBtn = document.getElementById('clReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      saveState({});
      render();
      if (typeof siteToast === 'function') siteToast('已清空勾选，可以重新记录 ✦');
    }, false);
  }

  render();
  bindChecks();
})();
