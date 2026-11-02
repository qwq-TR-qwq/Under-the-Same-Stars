#!/usr/bin/env node
/* 星夜入眠 · 数据同步脚本
 * 唯一数据源：others/data/stats.json（人工维护，带来源与口径）
 * 生成产物：others/js/data/stats.js（挂到 window.XYN_STATS，file:// 双击打开也能读到）
 *
 * 用法：
 *   node others/tools/sync-stats.js            # 校验 + 生成 stats.js
 *   node others/tools/sync-stats.js --check    # 只校验不写文件（产物与源不一致时退出码 1）
 *
 * 为什么不用 fetch 读 JSON：直接双击 index.html 是 file:// 协议，fetch 本地文件会被 CORS
 * 拦下；用 <script> 注入数据对象才能保证离线演示不崩。线上（http/https）页面会额外
 * fetch 一次 others/data/stats.json，这样只改 JSON 也能即时生效。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'others', 'data', 'stats.json');
const OUT = path.join(ROOT, 'others', 'js', 'data', 'stats.js');

const errors = [];
const warn = [];

function fail(msg) { errors.push(msg); }
function isNum(v) { return typeof v === 'number' && isFinite(v); }

let data;
try {
  data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
} catch (e) {
  console.error('✗ others/data/stats.json 无法解析：' + e.message);
  process.exit(1);
}

const srcIds = new Set();
if (!Array.isArray(data.sources)) fail('sources 必须是数组');
else {
  data.sources.forEach((s, i) => {
    if (!s.id) fail(`sources[${i}] 缺少 id`);
    if (srcIds.has(s.id)) fail(`sources[${i}] id 重复：${s.id}`);
    srcIds.add(s.id);
    if (!s.org) fail(`sources[${i}] 缺少 org`);
    if (!s.year) fail(`sources[${i}] 缺少 year`);
    if (!s.url) warn.push(`sources[${i}]（${s.org}）没有公开链接，页面上会标注为「无稳定链接」`);
  });
}
function checkSrc(id, where) {
  if (!id) return;
  if (!srcIds.has(id)) fail(`${where} 引用了不存在的来源 id：${id}`);
}

const meta = data.meta || {};
if (!meta.updated || !/^\d{4}-\d{2}(-\d{2})?$/.test(meta.updated)) fail('meta.updated 需为 YYYY-MM 或 YYYY-MM-DD');

const t = data.trend || {};
['years', 'count', 'rate'].forEach(k => { if (!Array.isArray(t[k])) fail(`trend.${k} 必须是数组`); });
if (Array.isArray(t.years) && Array.isArray(t.count) && t.years.length !== t.count.length) {
  fail(`trend.years(${t.years.length}) 与 trend.count(${t.count.length}) 长度不一致`);
}
let points = 0;
if (Array.isArray(t.count)) t.count.forEach((c, i) => {
  points++;
  if (!isNum(c.v)) fail(`trend.count[${i}].v 不是数字`);
  if (!['reported', 'estimate', 'derived'].includes(c.kind)) fail(`trend.count[${i}].kind 非法：${c.kind}`);
  if (c.kind === 'reported' && !c.src) fail(`trend.count[${i}] 为发布值却未给 src`);
  if (c.kind === 'estimate' && !c.basis) fail(`trend.count[${i}] 为估算却未写 basis（依据）`);
  checkSrc(c.src, `trend.count[${i}]`);
});
if (Array.isArray(t.rate)) t.rate.forEach((r, i) => {
  points++;
  if (!isNum(r.year) || !isNum(r.v)) fail(`trend.rate[${i}] 需要数字 year / v`);
  if (!r.caliber) fail(`trend.rate[${i}] 缺少 caliber（口径说明）`);
  checkSrc(r.src, `trend.rate[${i}]`);
});

['countries', 'ages'].forEach(key => {
  const g = data[key] || {};
  if (!Array.isArray(g.items)) { fail(`${key}.items 必须是数组`); return; }
  g.items.forEach((it, i) => {
    points++;
    if (!it.n) fail(`${key}.items[${i}] 缺少 n`);
    if (!isNum(it.v)) fail(`${key}.items[${i}].v 不是数字`);
    if (!['reported', 'estimate', 'derived'].includes(it.kind)) fail(`${key}.items[${i}].kind 非法：${it.kind}`);
    if (it.kind === 'reported' && !it.src) fail(`${key}.items[${i}] 为发布值却未给 src`);
    if (it.kind === 'estimate' && !it.basis) fail(`${key}.items[${i}] 为估算却未写 basis（依据）`);
    checkSrc(it.src, `${key}.items[${i}]`);
  });
});

if (data.countries && isNum(data.countries.worldTotal)) {
  const sum = (data.countries.items || []).filter(x => x.n !== '其他国家').reduce((a, b) => a + b.v, 0);
  const other = (data.countries.items || []).find(x => x.n === '其他国家');
  if (other && other.v !== data.countries.worldTotal - sum) {
    fail(`国家分项之和 ${sum} 万 + 其他 ${other.v} 万 ≠ 全球 ${data.countries.worldTotal} 万`);
  }
  if (sum > data.countries.worldTotal) fail('国家分项之和已超过全球总数');
}
if (data.ages && Array.isArray(data.ages.items)) {
  const sum = data.ages.items.reduce((a, b) => a + b.v, 0);
  const china = (data.countries && data.countries.items || []).find(x => x.n === '中国');
  if (china && Math.abs(sum - china.v) > 1) warn.push(`年龄构成合计 ${sum} 万，与中国总数 ${china.v} 万 略有差异（页面上会显示为估算拆分）`);
}

if (errors.length) {
  console.error('✗ 校验未通过：');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
warn.forEach(w => console.warn('! ' + w));

const header = '/* 自动生成，请勿直接编辑 —— 源文件：others/data/stats.json，生成命令：node others/tools/sync-stats.js */\n';
const body = 'window.XYN_STATS = ' + JSON.stringify(data, null, 2) + ';\n';
const out = header + body;

let changed = true;
try { changed = fs.readFileSync(OUT, 'utf8') !== out; } catch (e) { changed = true; }

if (process.argv.includes('--check')) {
  if (changed) { console.error('✗ others/js/data/stats.js 与 others/data/stats.json 不同步，请执行 node others/tools/sync-stats.js'); process.exit(1); }
  console.log('✓ 数据产物已同步（' + points + ' 个数据点，' + data.sources.length + ' 条来源）');
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
console.log((changed ? '✓ 已生成 ' : '= 无变化 ') + path.relative(ROOT, OUT));
console.log('  数据点 ' + points + ' 个 · 来源 ' + data.sources.length + ' 条 · 数据截至 ' + meta.updated);
