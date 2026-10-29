/* 星夜入眠 · 政策与救助：地区选择 + 官方入口联动
 * 所有链接均指向官方门户（省级残联域名已逐项核验）。
 * 说明：政策标准以户籍所在地为准，本模块只做导航，不缓存、不代理任何政务数据。
 */
(function () {
  var STORE_KEY = 'xingya_policy_region';

  var GROUPS = [
    { label: '全国', items: [
      { key: '全国', cdpfName: '中国残疾人联合会', cdpf: 'https://www.cdpf.org.cn/',
        govName: '中国政府网 · 政策文件库', gov: 'https://www.gov.cn/zhengce/',
        extra: { t: '国家政务服务平台', u: 'https://gjzwfw.www.gov.cn/',
                 desc: '跨省通办与残疾人服务专区，可在线查询办证、补贴等事项', tag: '国家级' } }
    ]},
    { label: '华北', items: [
      { key: '北京', cdpfName: '北京市残疾人联合会', cdpf: 'https://www.bdpf.org.cn/', govName: '北京市人民政府', gov: 'https://www.beijing.gov.cn/' },
      { key: '天津', cdpfName: '天津市残疾人联合会', cdpf: 'http://www.tjdpf.org.cn/', govName: '天津市人民政府', gov: 'https://www.tj.gov.cn/' },
      { key: '河北', cdpfName: '河北省残疾人联合会', cdpf: 'https://www.hebcl.org.cn/', govName: '河北省人民政府', gov: 'https://www.hebei.gov.cn/' },
      { key: '山西', cdpfName: '山西省残疾人联合会', cdpf: 'https://www.sxdpf.org.cn/', govName: '山西省人民政府', gov: 'https://www.shanxi.gov.cn/' },
      { key: '内蒙古', cdpfName: '内蒙古自治区残疾人联合会', cdpf: 'https://www.nmgcl.org.cn/', govName: '内蒙古自治区人民政府', gov: 'https://www.nmg.gov.cn/' }
    ]},
    { label: '东北', items: [
      { key: '辽宁', cdpfName: '辽宁省残疾人联合会', cdpf: 'https://www.lncl.org.cn/', govName: '辽宁省人民政府', gov: 'https://www.ln.gov.cn/' },
      { key: '吉林', cdpfName: '吉林省残疾人联合会', cdpf: 'http://www.jldpf.org.cn/', govName: '吉林省人民政府', gov: 'https://www.jl.gov.cn/' },
      { key: '黑龙江', cdpfName: '黑龙江省残疾人联合会', cdpf: 'https://www.hljcl.org.cn/', govName: '黑龙江省人民政府', gov: 'https://www.hlj.gov.cn/' }
    ]},
    { label: '华东', items: [
      { key: '上海', cdpfName: '上海市残疾人联合会', cdpf: 'https://shdpf.org.cn/', govName: '上海市人民政府', gov: 'https://www.shanghai.gov.cn/' },
      { key: '江苏', cdpfName: '江苏省残疾人联合会', cdpf: 'https://www.jscl.gov.cn/', govName: '江苏省人民政府', gov: 'https://www.jiangsu.gov.cn/' },
      { key: '浙江', cdpfName: '浙江省残疾人联合会', cdpf: 'https://www.zjdpf.org.cn/', govName: '浙江省人民政府', gov: 'https://www.zj.gov.cn/' },
      { key: '安徽', cdpfName: '安徽省残疾人联合会', cdpf: 'https://www.ahdpf.org.cn/', govName: '安徽省人民政府', gov: 'https://www.ah.gov.cn/' },
      { key: '福建', cdpfName: '福建省残疾人联合会', cdpf: 'https://www.1203.org/', govName: '福建省人民政府', gov: 'https://www.fujian.gov.cn/' },
      { key: '江西', cdpfName: '江西省残疾人联合会', cdpf: 'https://www.jxdpf.gov.cn/', govName: '江西省人民政府', gov: 'https://www.jiangxi.gov.cn/' },
      { key: '山东', cdpfName: '山东省残疾人联合会', cdpf: 'http://www.sddpf.org.cn/', govName: '山东省人民政府', gov: 'https://www.shandong.gov.cn/' }
    ]},
    { label: '华中', items: [
      { key: '河南', cdpfName: '河南省残疾人联合会', cdpf: 'http://henancjr.org.cn/', govName: '河南省人民政府', gov: 'https://www.henan.gov.cn/' },
      { key: '湖北', cdpfName: '湖北省残疾人联合会', cdpf: 'http://www.hbdpf.org.cn/', govName: '湖北省人民政府', gov: 'https://www.hubei.gov.cn/' },
      { key: '湖南', cdpfName: '湖南省残疾人联合会', cdpf: 'https://www.hndpf.org/', govName: '湖南省人民政府', gov: 'https://www.hunan.gov.cn/' }
    ]},
    { label: '华南', items: [
      { key: '广东', cdpfName: '广东省残疾人联合会', cdpf: 'https://www.gddpf.org.cn/', govName: '广东省人民政府', gov: 'https://www.gd.gov.cn/' },
      { key: '广西', cdpfName: '广西壮族自治区残疾人联合会', cdpf: 'http://www.gxdpf.org.cn/', govName: '广西壮族自治区人民政府', gov: 'https://www.gxzf.gov.cn/' },
      { key: '海南', cdpfName: '海南省残疾人联合会', cdpf: 'https://www.hidpf.org.cn/', govName: '海南省人民政府', gov: 'https://www.hainan.gov.cn/' }
    ]},
    { label: '西南', items: [
      { key: '重庆', cdpfName: '重庆市残疾人联合会', cdpf: 'https://www.cqdpf.org.cn/', govName: '重庆市人民政府', gov: 'https://www.cq.gov.cn/' },
      { key: '四川', cdpfName: '四川省残疾人联合会', cdpf: 'http://www.scdpf.org.cn/', govName: '四川省人民政府', gov: 'https://www.sc.gov.cn/' },
      { key: '贵州', cdpfName: '贵州省残疾人联合会', cdpf: 'http://www.gzsdpf.org.cn/', govName: '贵州省人民政府', gov: 'https://www.guizhou.gov.cn/' },
      { key: '云南', cdpfName: '云南省残疾人联合会', cdpf: 'https://www.yncl.org.cn/', govName: '云南省人民政府', gov: 'https://www.yn.gov.cn/' },
      { key: '西藏', cdpfName: '西藏自治区残疾人联合会', cdpf: 'https://dpf.xzdw.gov.cn/', govName: '西藏自治区人民政府', gov: 'https://www.xizang.gov.cn/' }
    ]},
    { label: '西北', items: [
      { key: '陕西', cdpfName: '陕西省残疾人联合会', cdpf: 'http://www.sndpf.cn/', govName: '陕西省人民政府', gov: 'https://www.shaanxi.gov.cn/' },
      { key: '甘肃', cdpfName: '甘肃省残疾人联合会', cdpf: 'https://www.gsdpf.org.cn/', govName: '甘肃省人民政府', gov: 'https://www.gansu.gov.cn/' },
      { key: '青海', cdpfName: '青海省残疾人联合会', cdpf: 'https://www.qhcl.org.cn/', govName: '青海省人民政府', gov: 'https://www.qinghai.gov.cn/' },
      { key: '宁夏', cdpfName: '宁夏回族自治区残疾人联合会', cdpf: 'https://www.ndpf.org.cn/', govName: '宁夏回族自治区人民政府', gov: 'https://www.nx.gov.cn/' },
      { key: '新疆', cdpfName: '新疆维吾尔自治区残疾人联合会', cdpf: 'https://www.xjdpf.org.cn/', govName: '新疆维吾尔自治区人民政府', gov: 'https://www.xinjiang.gov.cn/' }
    ]}
  ];

  var HOT = ['北京', '上海', '广东', '江苏', '浙江', '四川'];

  function find(key) {
    for (var i = 0; i < GROUPS.length; i++) {
      var items = GROUPS[i].items;
      for (var j = 0; j < items.length; j++) {
        if (items[j].key === key) return items[j];
      }
    }
    return GROUPS[0].items[0];
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function buildSelect() {
    var sel = document.getElementById('policyRegion');
    if (!sel) return;
    GROUPS.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g.label;
      g.items.forEach(function (item) {
        var o = document.createElement('option');
        o.value = item.key;
        o.textContent = item.key;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
  }

  function buildChips() {
    var box = document.getElementById('policyChips');
    if (!box) return;
    box.innerHTML = '';
    HOT.forEach(function (k) {
      var b = el('button', 'pp-chip', k);
      b.type = 'button';
      b.setAttribute('data-region', k);
      b.addEventListener('click', function () { apply(k); });
      box.appendChild(b);
    });
  }

  function linkCard(title, url, desc, tag) {
    var a = el('a', 'pl-card');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = '<span class="pl-tag">' + tag + '</span>' +
      '<b>' + title + '<i class="pl-arrow" aria-hidden="true">↗</i></b>' +
      '<p>' + desc + '</p>';
    return a;
  }

  function render(key) {
    var d = find(key);
    var box = document.getElementById('policyLinks');
    var title = document.getElementById('policyRegionTitle');
    var now = document.getElementById('policyRegionNow');
    var note = document.getElementById('policyLinksNote');
    if (!box) return;
    if (title) title.textContent = d.key;
    if (now) now.textContent = d.key;
    box.innerHTML = '';

    var isNational = d.key === '全国';
    box.appendChild(linkCard(
      d.cdpfName, d.cdpf,
      isNational ? '全国残疾人事业主管机构：政策法规、残疾儿童康复救助制度原文与数据发布'
                 : '康复救助项目、定点康复机构名单、办证与办事指南、通知公告',
      isNational ? '国家级' : '省级 · 残联'
    ));
    box.appendChild(linkCard(
      d.govName, d.gov,
      isNational ? '国务院政策文件库：可按"残疾儿童康复救助"等关键词检索全国性文件'
                 : '本地政策文件、补贴标准与实施细则，可在站内检索"残疾儿童康复救助"',
      isNational ? '国家级' : '省级 · 政府门户'
    ));
    if (d.extra) {
      box.appendChild(linkCard(d.extra.t, d.extra.u, d.extra.desc, d.extra.tag));
    }

    // 12345 热线卡（非链接，避免误导为在线办理）
    var hot = el('div', 'pl-card pl-hot');
    hot.innerHTML = '<span class="pl-tag">电话咨询</span>' +
      '<b>12345 政务服务便民热线</b>' +
      '<p>拨打 <strong>12345</strong>，说明"咨询残疾儿童康复救助"，可转到' +
      (isNational ? '本地' : d.key + '本地') +
      '经办窗口，问清年龄上限、材料清单与办理地点。</p>';
    box.appendChild(hot);

    if (note) {
      note.innerHTML = '提示：' + (isNational
        ? '选择具体省份后，这里会切换为该省的残联与政府门户入口。'
        : d.key + '的救助标准、年龄上限以户籍所在地县（区）残联最新公布为准，建议先电话核实再去窗口。') +
        '以上均为官方门户链接，本页仅作导航，不构成政策依据。';
    }
  }

  function apply(key) {
    render(key);
    var sel = document.getElementById('policyRegion');
    if (sel && sel.value !== key) sel.value = key;
    var chips = document.querySelectorAll('.pp-chip');
    for (var i = 0; i < chips.length; i++) {
      var on = chips[i].getAttribute('data-region') === key;
      chips[i].classList.toggle('on', on);
      chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    try { localStorage.setItem(STORE_KEY, key); } catch (e) {}
  }

  function init() {
    buildSelect();
    buildChips();
    var sel = document.getElementById('policyRegion');
    var saved = '全国';
    try { saved = localStorage.getItem(STORE_KEY) || '全国'; } catch (e) {}
    if (!find(saved)) saved = '全国';
    if (sel) {
      sel.value = saved;
      sel.addEventListener('change', function () { apply(sel.value); });
    }
    render(saved);
    var chips = document.querySelectorAll('.pp-chip');
    for (var i = 0; i < chips.length; i++) {
      var on = chips[i].getAttribute('data-region') === saved;
      chips[i].classList.toggle('on', on);
      chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
