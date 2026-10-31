/* ===== 14-safety.js：情绪安全阀（危机信息前置卡片） =====
 * 当对话中出现安全风险信号（自伤 / 走失 / 极端情绪）时，
 * 先弹出固定的求助渠道卡片（120 / 12356 / 110），再由对话给出具体建议。
 * 设计原则：
 *   1) 卡片静态无动画（兼容低刺激模式），字号大、按钮可点击（tel: 直接拨号）；
 *   2) 60 秒节流，同一次浏览不反复打扰；
 *   3) 不做诊断、不说教，只给"现在能做什么"。
 */
(function () {
  'use strict';

  var lastShow = 0;
  var el = null;

  var CONTENT = {
    crisis: {
      flag: '现在很重要',
      title: '请先照顾好自己',
      desc: '你现在的感受值得被认真对待。不要一个人扛——下面任何一个号码都有人随时接听。',
      items: [
        { num: '120', name: '急救', desc: '有紧急身体危险时' },
        { num: '12356', name: '全国心理援助热线', desc: '24 小时免费倾听' },
        { num: '110', name: '报警', desc: '需要紧急帮助时' }
      ],
      extra: '也可以联系身边任何一个人：家人、朋友、老师。说出来，就是自救的第一步。'
    },
    child: {
      flag: '安全第一',
      title: '孩子有安全风险时，先做这三件事',
      desc: '先确保孩子身边环境安全（移开尖锐、坚硬物品，有人在旁看护），再联系专业帮助。',
      items: [
        { num: '120', name: '急救', desc: '孩子正在受伤或有身体危险' },
        { num: '110', name: '报警', desc: '孩子走失或处于走失风险' },
        { num: '12356', name: '全国心理援助热线', desc: '家长自己也需要支持时' }
      ],
      extra: '如果孩子刚走失：立刻联系场所工作人员广播寻人、调取出口监控，同时报警，不要独自远距离寻找。'
    }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function build(kind) {
    var c = CONTENT[kind] || CONTENT.crisis;
    var btns = '';
    for (var i = 0; i < c.items.length; i++) {
      var it = c.items[i];
      btns += '<a class="sf-call" href="tel:' + it.num + '"><b>' + it.num + '</b><span>' + esc(it.name) + '</span><i>' + esc(it.desc) + '</i></a>';
    }
    return '<div class="sf-card" role="alertdialog" aria-modal="false" aria-label="安全提示">'
      + '<span class="sf-flag">' + esc(c.flag) + '</span>'
      + '<button type="button" class="sf-close" aria-label="关闭安全提示">×</button>'
      + '<h3>' + esc(c.title) + '</h3>'
      + '<p class="sf-desc">' + esc(c.desc) + '</p>'
      + '<div class="sf-calls">' + btns + '</div>'
      + '<p class="sf-extra">' + esc(c.extra) + '</p>'
      + '</div>';
  }

  function show(kind) {
    var now = Date.now();
    if (now - lastShow < 60000) return;   // 60 秒内不重复打扰
    lastShow = now;
    if (!el) {
      el = document.createElement('div');
      el.id = 'safetyCard';
      document.body.appendChild(el);
      el.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('.sf-close')) { el.classList.remove('show'); }
      }, false);
    }
    el.innerHTML = build(kind);
    el.classList.add('show');
    var closeBtn = el.querySelector('.sf-close');
    if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (e) {} }
    if (typeof window.siteToast === 'function') window.siteToast('已为你置顶安全提示，需要时随时可以联系');
  }

  window.__safety = {
    show: show,
    // 统一入口：判断文本是否含安全风险信号，命中则弹出对应卡片。
    // 返回 'self'（用户本人危机，调用方应直接给热线话术）/ 'family'（家长语境，继续走专项应答）/ ''（无风险）
    check: function (raw) {
      var t = String(raw == null ? '' : raw).replace(/[，。！？、,.!?~～…\s]/g, '').toLowerCase();
      if (!t) return '';
      var fam = /孩子|儿子|女儿|宝宝|娃|星宝|谱系|自闭|孤独症|asd/.test(t);
      var hurt = /撞头|咬手|打自己|抓自己|掐自己|磕自己|自伤|走失|走丢|跑丢|找不到孩子|失踪/.test(t);
      var suicide = /自杀|想死|不想活|轻生|活不下去|结束生命|伤害自己|自残|了断/.test(t);
      if (fam && (hurt || suicide)) { show('child'); return 'family'; }
      if (suicide) { show('crisis'); return 'self'; }
      return '';
    }
  };
})();
