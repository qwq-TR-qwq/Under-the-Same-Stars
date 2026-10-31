/* ===== 15-misslog.js：未命中问题日志（数据驱动迭代知识库） =====
 * 职责：
 *   1) 当本地知识库没接住用户的问题（02-chat 的 _replyUncovered）时记一条；
 *   2) 在 AI 设置面板显示数量、一键导出 CSV —— 用真实用户的提问反推该补哪类内容；
 *   3) 全部数据只存本机 localStorage，不上传。
 * 设计：同一问题 10 分钟内只记一次；上限 200 条，超出丢弃最旧的。
 */
(function () {
  'use strict';

  var KEY = 'xyn_miss_log_v1';
  var MAX = 200;
  var btn = document.getElementById('missExport');

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function esc(s) {
    return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  }

  function add(q) {
    var t = String(q || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    if (!t) return;
    var list = load();
    var now = Date.now();
    // 10 分钟内同问题不重复记录
    for (var i = 0; i < list.length; i++) {
      if (list[i].q === t && now - list[i].at < 600000) return;
    }
    list.push({ q: t.slice(0, 120), at: now });
    while (list.length > MAX) list.shift();
    save(list);
    paint();
  }

  function paint() {
    if (!btn) return;
    var n = load().length;
    btn.textContent = '未命中清单 (' + n + ')';
    btn.title = n
      ? '本次共有 ' + n + ' 个本地知识库没接住的问题，点击导出 CSV'
      : '暂时没有记录：本地知识库都接住了用户的问题';
  }

  function exportCSV() {
    var list = load();
    if (!list.length) {
      if (typeof window.siteToast === 'function') window.siteToast('暂无未命中记录，本地知识库都接住了 ✦');
      return;
    }
    var rows = ['时间,用户问题'];
    for (var i = 0; i < list.length; i++) {
      var d = new Date(list[i].at);
      var ts = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2)
        + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      rows.push(esc(ts) + ',' + esc(list[i].q));
    }
    // \uFEFF BOM：保证 Excel 打开不乱码
    var blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    var d2 = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = 'miss-log-' + d2.getFullYear() + ('0' + (d2.getMonth() + 1)).slice(-2) + ('0' + d2.getDate()).slice(-2) + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      try { URL.revokeObjectURL(a.href); } catch (e) {}
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 800);
    if (typeof window.siteToast === 'function') window.siteToast('已导出 ' + list.length + ' 条未命中问题，补充知识库就靠它了 ✦');
  }

  if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); exportCSV(); }, false);

  window.__missLog = {
    add: add,
    count: function () { return load().length; },
    clear: function () { save([]); paint(); }
  };

  paint();
})();
