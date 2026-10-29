/* 星夜入眠 · 政策与救助：省市二级联动 + 地区搜索 + 最近 5 条记录
 * 数据：31 个省级行政区（直辖市单独成组，其余按拼音首字母 A–Z 排序）+ 333 个地级行政区
 * 链接：省级残联 / 政府门户逐项核验；市级政府门户只收录经标题校验确认的域名，
 *       未收录的城市不展示猜测链接，改为提示通过省残联或 12345 咨询。
 */
(function () {
  var SK = 'xingya_policy_region';    // 上次选择
  var HK = 'xingya_policy_history';   // 最近搜索（最多 5 条）
  var MAX_HIS = 5;

  var PROV = [
    {k:'北京',l:'B',m:0,cn:'北京市残疾人联合会',cu:'https://www.bdpf.org.cn/',gn:'北京市人民政府',gu:'https://www.beijing.gov.cn/'},
    {k:'重庆',l:'C',m:0,cn:'重庆市残疾人联合会',cu:'https://www.cqdpf.org.cn/',gn:'重庆市人民政府',gu:'https://www.cq.gov.cn/'},
    {k:'上海',l:'S',m:0,cn:'上海市残疾人联合会',cu:'https://shdpf.org.cn/',gn:'上海市人民政府',gu:'https://www.shanghai.gov.cn/'},
    {k:'天津',l:'T',m:0,cn:'天津市残疾人联合会',cu:'http://www.tjdpf.org.cn/',gn:'天津市人民政府',gu:'https://www.tj.gov.cn/'},
    {k:'安徽',l:'A',m:1,cn:'安徽省残疾人联合会',cu:'https://www.ahdpf.org.cn/',gn:'安徽省人民政府',gu:'https://www.ah.gov.cn/'},
    {k:'福建',l:'F',m:1,cn:'福建省残疾人联合会',cu:'https://www.1203.org/',gn:'福建省人民政府',gu:'https://www.fujian.gov.cn/'},
    {k:'甘肃',l:'G',m:1,cn:'甘肃省残疾人联合会',cu:'https://www.gsdpf.org.cn/',gn:'甘肃省人民政府',gu:'https://www.gansu.gov.cn/'},
    {k:'广东',l:'G',m:1,cn:'广东省残疾人联合会',cu:'https://www.gddpf.org.cn/',gn:'广东省人民政府',gu:'https://www.gd.gov.cn/'},
    {k:'广西',l:'G',m:1,cn:'广西壮族自治区残疾人联合会',cu:'http://www.gxdpf.org.cn/',gn:'广西壮族自治区人民政府',gu:'https://www.gxzf.gov.cn/'},
    {k:'贵州',l:'G',m:1,cn:'贵州省残疾人联合会',cu:'http://www.gzsdpf.org.cn/',gn:'贵州省人民政府',gu:'https://www.guizhou.gov.cn/'},
    {k:'海南',l:'H',m:1,cn:'海南省残疾人联合会',cu:'https://www.hidpf.org.cn/',gn:'海南省人民政府',gu:'https://www.hainan.gov.cn/'},
    {k:'河北',l:'H',m:1,cn:'河北省残疾人联合会',cu:'https://www.hebcl.org.cn/',gn:'河北省人民政府',gu:'https://www.hebei.gov.cn/'},
    {k:'黑龙江',l:'H',m:1,cn:'黑龙江省残疾人联合会',cu:'https://www.hljcl.org.cn/',gn:'黑龙江省人民政府',gu:'https://www.hlj.gov.cn/'},
    {k:'河南',l:'H',m:1,cn:'河南省残疾人联合会',cu:'http://henancjr.org.cn/',gn:'河南省人民政府',gu:'https://www.henan.gov.cn/'},
    {k:'湖北',l:'H',m:1,cn:'湖北省残疾人联合会',cu:'http://www.hbdpf.org.cn/',gn:'湖北省人民政府',gu:'https://www.hubei.gov.cn/'},
    {k:'湖南',l:'H',m:1,cn:'湖南省残疾人联合会',cu:'https://www.hndpf.org/',gn:'湖南省人民政府',gu:'https://www.hunan.gov.cn/'},
    {k:'江苏',l:'J',m:1,cn:'江苏省残疾人联合会',cu:'https://www.jscl.gov.cn/',gn:'江苏省人民政府',gu:'https://www.jiangsu.gov.cn/'},
    {k:'江西',l:'J',m:1,cn:'江西省残疾人联合会',cu:'https://www.jxdpf.gov.cn/',gn:'江西省人民政府',gu:'https://www.jiangxi.gov.cn/'},
    {k:'吉林',l:'J',m:1,cn:'吉林省残疾人联合会',cu:'http://www.jldpf.org.cn/',gn:'吉林省人民政府',gu:'https://www.jl.gov.cn/'},
    {k:'辽宁',l:'L',m:1,cn:'辽宁省残疾人联合会',cu:'https://www.lncl.org.cn/',gn:'辽宁省人民政府',gu:'https://www.ln.gov.cn/'},
    {k:'内蒙古',l:'N',m:1,cn:'内蒙古自治区残疾人联合会',cu:'https://www.nmgcl.org.cn/',gn:'内蒙古自治区人民政府',gu:'https://www.nmg.gov.cn/'},
    {k:'宁夏',l:'N',m:1,cn:'宁夏回族自治区残疾人联合会',cu:'https://www.ndpf.org.cn/',gn:'宁夏回族自治区人民政府',gu:'https://www.nx.gov.cn/'},
    {k:'青海',l:'Q',m:1,cn:'青海省残疾人联合会',cu:'https://www.qhcl.org.cn/',gn:'青海省人民政府',gu:'https://www.qinghai.gov.cn/'},
    {k:'山东',l:'S',m:1,cn:'山东省残疾人联合会',cu:'http://www.sddpf.org.cn/',gn:'山东省人民政府',gu:'https://www.shandong.gov.cn/'},
    {k:'山西',l:'S',m:1,cn:'山西省残疾人联合会',cu:'https://www.sxdpf.org.cn/',gn:'山西省人民政府',gu:'https://www.shanxi.gov.cn/'},
    {k:'陕西',l:'S',m:1,cn:'陕西省残疾人联合会',cu:'http://www.sndpf.cn/',gn:'陕西省人民政府',gu:'https://www.shaanxi.gov.cn/'},
    {k:'四川',l:'S',m:1,cn:'四川省残疾人联合会',cu:'http://www.scdpf.org.cn/',gn:'四川省人民政府',gu:'https://www.sc.gov.cn/'},
    {k:'新疆',l:'X',m:1,cn:'新疆维吾尔自治区残疾人联合会',cu:'https://www.xjdpf.org.cn/',gn:'新疆维吾尔自治区人民政府',gu:'https://www.xinjiang.gov.cn/'},
    {k:'西藏',l:'X',m:1,cn:'西藏自治区残疾人联合会',cu:'https://dpf.xzdw.gov.cn/',gn:'西藏自治区人民政府',gu:'https://www.xizang.gov.cn/'},
    {k:'云南',l:'Y',m:1,cn:'云南省残疾人联合会',cu:'https://www.yncl.org.cn/',gn:'云南省人民政府',gu:'https://www.yn.gov.cn/'},
    {k:'浙江',l:'Z',m:1,cn:'浙江省残疾人联合会',cu:'https://www.zjdpf.org.cn/',gn:'浙江省人民政府',gu:'https://www.zj.gov.cn/'},
  ];

  var CITY = {
    '安徽':['合肥市|https://www.hefei.gov.cn/','芜湖市|https://www.wuhu.gov.cn/','蚌埠市|https://www.bengbu.gov.cn/','淮南市|https://www.huainan.gov.cn/','马鞍山市|https://www.mas.gov.cn/','淮北市|https://www.huaibei.gov.cn/','铜陵市|https://www.tl.gov.cn/','安庆市|https://www.anqing.gov.cn/','黄山市|','滁州市|https://www.chuzhou.gov.cn/','阜阳市|','宿州市|','六安市|https://www.luan.gov.cn/','亳州市|https://www.bozhou.gov.cn/','池州市|https://www.chizhou.gov.cn/','宣城市|https://www.xuancheng.gov.cn/'],
    '福建':['福州市|https://www.fuzhou.gov.cn/','厦门市|https://www.xm.gov.cn/','莆田市|https://www.putian.gov.cn/','三明市|http://www.sanming.gov.cn/','泉州市|https://www.quanzhou.gov.cn/','漳州市|https://www.zhangzhou.gov.cn/','南平市|https://www.np.gov.cn/','龙岩市|https://www.longyan.gov.cn/','宁德市|https://www.ningde.gov.cn/'],
    '甘肃':['兰州市|https://www.lanzhou.gov.cn/','嘉峪关市|https://www.jyg.gov.cn/','金昌市|','白银市|https://www.baiyin.gov.cn/','天水市|https://www.tianshui.gov.cn/','武威市|','张掖市|https://www.zhangye.gov.cn/','平凉市|https://www.pingliang.gov.cn/','酒泉市|https://www.jiuquan.gov.cn/','庆阳市|','定西市|https://www.dingxi.gov.cn/','陇南市|https://www.longnan.gov.cn/','临夏回族自治州|','甘南藏族自治州|'],
    '广东':['广州市|https://www.gz.gov.cn/','韶关市|https://www.sg.gov.cn/','深圳市|http://www.shenzhen.gov.cn/','珠海市|https://www.zhuhai.gov.cn/','汕头市|https://www.shantou.gov.cn/','佛山市|https://www.foshan.gov.cn/','江门市|https://www.jiangmen.gov.cn/','湛江市|https://www.zhanjiang.gov.cn/','茂名市|http://www.maoming.gov.cn/','肇庆市|https://www.zhaoqing.gov.cn/','惠州市|https://www.huizhou.gov.cn/','梅州市|','汕尾市|https://www.shanwei.gov.cn/','河源市|https://www.heyuan.gov.cn/','阳江市|https://www.yangjiang.gov.cn/','清远市|','东莞市|https://www.dongguan.gov.cn/','中山市|https://www.zs.gov.cn/','潮州市|https://www.chaozhou.gov.cn/','揭阳市|http://www.jieyang.gov.cn/','云浮市|https://www.yunfu.gov.cn/'],
    '广西':['南宁市|https://www.nanning.gov.cn/','柳州市|http://www.liuzhou.gov.cn/','桂林市|https://www.guilin.gov.cn/','梧州市|http://www.wuzhou.gov.cn/','北海市|http://www.beihai.gov.cn/','防城港市|','钦州市|http://www.qinzhou.gov.cn/','贵港市|','玉林市|http://www.yulin.gov.cn/','百色市|http://www.baise.gov.cn/','贺州市|','河池市|http://www.hechi.gov.cn/','来宾市|http://www.laibin.gov.cn/','崇左市|http://www.chongzuo.gov.cn/'],
    '贵州':['贵阳市|https://www.guiyang.gov.cn/','六盘水市|','遵义市|https://www.zunyi.gov.cn/','安顺市|https://www.anshun.gov.cn/','毕节市|https://www.bijie.gov.cn/','铜仁市|https://www.tongren.gov.cn/','黔西南布依族苗族自治州|','黔东南苗族侗族自治州|','黔南布依族苗族自治州|'],
    '海南':['海口市|https://www.haikou.gov.cn/','三亚市|https://www.sanya.gov.cn/','三沙市|https://www.sansha.gov.cn/','儋州市|https://www.danzhou.gov.cn/'],
    '河北':['石家庄市|https://www.sjz.gov.cn/','唐山市|','秦皇岛市|https://www.qinhuangdao.gov.cn/','邯郸市|https://www.hd.gov.cn/','邢台市|http://www.xingtai.gov.cn/','保定市|https://www.baoding.gov.cn/','张家口市|https://www.zjk.gov.cn/','承德市|https://www.chengde.gov.cn/','沧州市|https://www.cangzhou.gov.cn/','廊坊市|https://www.lf.gov.cn/','衡水市|https://www.hengshui.gov.cn/'],
    '黑龙江':['哈尔滨市|https://www.harbin.gov.cn/','齐齐哈尔市|','鸡西市|https://www.jixi.gov.cn/','鹤岗市|https://www.hegang.gov.cn/','双鸭山市|','大庆市|https://www.daqing.gov.cn/','伊春市|','佳木斯市|https://www.jms.gov.cn/','七台河市|https://www.qth.gov.cn/','牡丹江市|https://www.mdj.gov.cn/','黑河市|https://www.heihe.gov.cn/','绥化市|https://www.suihua.gov.cn/','大兴安岭地区|'],
    '河南':['郑州市|https://www.zhengzhou.gov.cn/','开封市|https://www.kaifeng.gov.cn/','洛阳市|https://www.ly.gov.cn/','平顶山市|https://www.pds.gov.cn/','安阳市|https://www.anyang.gov.cn/','鹤壁市|https://www.hebi.gov.cn/','新乡市|https://www.xinxiang.gov.cn/','焦作市|https://www.jiaozuo.gov.cn/','濮阳市|https://www.puyang.gov.cn/','许昌市|https://www.xuchang.gov.cn/','漯河市|','三门峡市|https://www.smx.gov.cn/','南阳市|https://www.nanyang.gov.cn/','商丘市|https://www.shangqiu.gov.cn/','信阳市|https://www.xinyang.gov.cn/','周口市|https://www.zhoukou.gov.cn/','驻马店市|https://www.zhumadian.gov.cn/'],
    '湖北':['武汉市|https://www.wuhan.gov.cn/','黄石市|https://www.huangshi.gov.cn/','十堰市|https://www.shiyan.gov.cn/','宜昌市|https://www.yichang.gov.cn/','襄阳市|','鄂州市|','荆门市|https://www.jingmen.gov.cn/','孝感市|https://www.xiaogan.gov.cn/','荆州市|https://www.jingzhou.gov.cn/','黄冈市|https://www.hg.gov.cn/','咸宁市|http://www.xianning.gov.cn/','随州市|http://www.suizhou.gov.cn/','恩施土家族苗族自治州|'],
    '湖南':['长沙市|https://www.changsha.gov.cn/','株洲市|https://www.zhuzhou.gov.cn/','湘潭市|https://www.xiangtan.gov.cn/','衡阳市|https://www.hengyang.gov.cn/','邵阳市|https://www.shaoyang.gov.cn/','岳阳市|https://www.yueyang.gov.cn/','常德市|https://www.changde.gov.cn/','张家界市|https://www.zjj.gov.cn/','益阳市|https://www.yiyang.gov.cn/','郴州市|','永州市|','怀化市|https://www.huaihua.gov.cn/','娄底市|','湘西土家族苗族自治州|'],
    '江苏':['南京市|https://www.nanjing.gov.cn/','无锡市|https://www.wuxi.gov.cn/','徐州市|https://www.xz.gov.cn/','常州市|https://www.changzhou.gov.cn/','苏州市|https://www.suzhou.gov.cn/','南通市|https://www.nantong.gov.cn/','连云港市|https://www.lyg.gov.cn/','淮安市|https://www.huaian.gov.cn/','盐城市|https://www.yancheng.gov.cn/','扬州市|https://www.yangzhou.gov.cn/','镇江市|https://www.zhenjiang.gov.cn/','泰州市|https://www.taizhou.gov.cn/','宿迁市|https://www.suqian.gov.cn/'],
    '江西':['南昌市|https://www.nc.gov.cn/','景德镇市|https://www.jdz.gov.cn/','萍乡市|','九江市|https://www.jiujiang.gov.cn/','新余市|https://www.xinyu.gov.cn/','鹰潭市|http://www.yingtan.gov.cn/','赣州市|https://www.ganzhou.gov.cn/','吉安市|https://www.jian.gov.cn/','宜春市|https://www.yichun.gov.cn/','抚州市|','上饶市|'],
    '吉林':['长春市|http://www.changchun.gov.cn/','吉林市|https://www.jl.gov.cn/','四平市|http://www.siping.gov.cn/','辽源市|https://www.liaoyuan.gov.cn/','通化市|https://www.tonghua.gov.cn/','白山市|','松原市|','白城市|','延边朝鲜族自治州|'],
    '辽宁':['沈阳市|https://www.shenyang.gov.cn/','大连市|https://www.dl.gov.cn/','鞍山市|http://www.anshan.gov.cn/','抚顺市|https://www.fushun.gov.cn/','本溪市|https://www.benxi.gov.cn/','丹东市|https://www.dandong.gov.cn/','锦州市|https://www.jz.gov.cn/','营口市|https://www.yingkou.gov.cn/','阜新市|https://www.fuxin.gov.cn/','辽阳市|http://www.liaoyang.gov.cn/','盘锦市|https://www.panjin.gov.cn/','铁岭市|https://www.tieling.gov.cn/','朝阳市|','葫芦岛市|https://www.hld.gov.cn/'],
    '内蒙古':['呼和浩特市|','包头市|https://www.baotou.gov.cn/','乌海市|http://www.wuhai.gov.cn/','赤峰市|https://www.chifeng.gov.cn/','通辽市|https://www.tongliao.gov.cn/','鄂尔多斯市|','呼伦贝尔市|https://www.hlbe.gov.cn/','巴彦淖尔市|','乌兰察布市|https://www.wulanchabu.gov.cn/','兴安盟|','锡林郭勒盟|','阿拉善盟|'],
    '宁夏':['银川市|https://www.yinchuan.gov.cn/','石嘴山市|https://www.shizuishan.gov.cn/','吴忠市|https://www.wuzhong.gov.cn/','固原市|','中卫市|'],
    '青海':['西宁市|https://www.xining.gov.cn/','海东市|https://www.haidong.gov.cn/','海北藏族自治州|','黄南藏族自治州|','海南藏族自治州|','果洛藏族自治州|','玉树藏族自治州|','海西蒙古族藏族自治州|'],
    '山东':['济南市|https://www.jinan.gov.cn/','青岛市|http://www.qingdao.gov.cn/','淄博市|https://www.zibo.gov.cn/','枣庄市|http://www.zaozhuang.gov.cn/','东营市|','烟台市|https://www.yantai.gov.cn/','潍坊市|https://www.weifang.gov.cn/','济宁市|https://www.jining.gov.cn/','泰安市|https://www.taian.gov.cn/','威海市|https://www.weihai.gov.cn/','日照市|','临沂市|https://www.linyi.gov.cn/','德州市|https://www.dezhou.gov.cn/','聊城市|','滨州市|http://www.binzhou.gov.cn/','菏泽市|http://www.heze.gov.cn/'],
    '山西':['太原市|https://www.taiyuan.gov.cn/','大同市|','阳泉市|','长治市|','晋城市|','朔州市|http://www.shuozhou.gov.cn/','晋中市|','运城市|https://www.yuncheng.gov.cn/','忻州市|','临汾市|http://www.linfen.gov.cn/','吕梁市|https://www.lvliang.gov.cn/'],
    '陕西':['西安市|https://www.xa.gov.cn/','铜川市|https://www.tongchuan.gov.cn/','宝鸡市|https://www.baoji.gov.cn/','咸阳市|https://www.xianyang.gov.cn/','渭南市|https://www.weinan.gov.cn/','延安市|https://www.yanan.gov.cn/','汉中市|https://www.hanzhong.gov.cn/','榆林市|','安康市|https://www.ankang.gov.cn/','商洛市|https://www.shangluo.gov.cn/'],
    '四川':['成都市|https://www.chengdu.gov.cn/','自贡市|https://www.zg.gov.cn/','攀枝花市|http://www.panzhihua.gov.cn/','泸州市|https://www.luzhou.gov.cn/','德阳市|https://www.deyang.gov.cn/','绵阳市|https://www.my.gov.cn/','广元市|','遂宁市|https://www.suining.gov.cn/','内江市|https://www.neijiang.gov.cn/','乐山市|https://www.leshan.gov.cn/','南充市|https://www.nanchong.gov.cn/','眉山市|https://www.ms.gov.cn/','宜宾市|https://www.yibin.gov.cn/','广安市|','达州市|https://www.dazhou.gov.cn/','雅安市|https://www.yaan.gov.cn/','巴中市|','资阳市|https://www.ziyang.gov.cn/','阿坝藏族羌族自治州|','甘孜藏族自治州|','凉山彝族自治州|'],
    '新疆':['乌鲁木齐市|https://www.wlmq.gov.cn/','克拉玛依市|https://www.klmy.gov.cn/','吐鲁番市|https://www.tlf.gov.cn/','哈密市|https://www.hami.gov.cn/','昌吉回族自治州|','博尔塔拉蒙古自治州|','巴音郭楞蒙古自治州|','阿克苏地区|','克孜勒苏柯尔克孜自治州|','喀什地区|https://www.kashi.gov.cn/','和田地区|','伊犁哈萨克自治州|','塔城地区|','阿勒泰地区|https://www.alt.gov.cn/'],
    '西藏':['拉萨市|https://www.lasa.gov.cn/','日喀则市|http://www.rikaze.gov.cn/','昌都市|','林芝市|https://www.linzhi.gov.cn/','山南市|https://www.shannan.gov.cn/','那曲市|','阿里地区|'],
    '云南':['昆明市|https://www.km.gov.cn/','曲靖市|https://www.qj.gov.cn/','玉溪市|https://www.yuxi.gov.cn/','保山市|https://www.baoshan.gov.cn/','昭通市|https://www.zt.gov.cn/','丽江市|https://www.lijiang.gov.cn/','普洱市|','临沧市|http://lincang.gov.cn/','楚雄彝族自治州|','红河哈尼族彝族自治州|','文山壮族苗族自治州|','西双版纳傣族自治州|','大理白族自治州|','德宏傣族景颇族自治州|','怒江傈僳族自治州|','迪庆藏族自治州|'],
    '浙江':['杭州市|https://www.hangzhou.gov.cn/','宁波市|https://www.ningbo.gov.cn/','温州市|https://www.wenzhou.gov.cn/','嘉兴市|https://www.jiaxing.gov.cn/','湖州市|https://www.huzhou.gov.cn/','绍兴市|https://www.sx.gov.cn/','金华市|https://www.jinhua.gov.cn/','衢州市|https://www.qz.gov.cn/','舟山市|https://www.zhoushan.gov.cn/','台州市|','丽水市|https://www.lishui.gov.cn/'],
  };

  var NATIONAL = { k: '全国', cn: '中国残疾人联合会', cu: 'https://www.cdpf.org.cn/',
                   gn: '中国政府网 · 政策文件库', gu: 'https://www.gov.cn/zhengce/' };
  var HOT = ['广东', '江苏', '浙江', '山东', '河南', '四川'];

  var state = { p: '全国', c: '' };
  var history = [];

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function provOf(k) {
    if (k === '全国') return NATIONAL;
    for (var i = 0; i < PROV.length; i++) { if (PROV[i].k === k) return PROV[i]; }
    return NATIONAL;
  }

  function citiesOf(k) { return CITY[k] || []; }

  function cityUrl(k, name) {
    var arr = citiesOf(k);
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i], cut = s.indexOf('|');
      if (s.slice(0, cut) === name) return s.slice(cut + 1);
    }
    return '';
  }

  /* ---------------- 下拉：省份（直辖市第一组，其余按首字母） ---------------- */
  function buildProvSelect() {
    var sel = $('policyRegion');
    if (!sel) return;
    sel.innerHTML = '';

    var og0 = document.createElement('optgroup');
    og0.label = '全国';
    og0.appendChild(new Option('全国（国家层面）', '全国'));
    sel.appendChild(og0);

    var ogM = document.createElement('optgroup');
    ogM.label = '直辖市';
    PROV.forEach(function (p) {
      if (p.m === 0) ogM.appendChild(new Option(p.gn.replace('人民政府', ''), p.k));
    });
    sel.appendChild(ogM);

    var letters = [];
    PROV.forEach(function (p) {
      if (p.m !== 0 && letters.indexOf(p.l) < 0) letters.push(p.l);
    });
    letters.sort();
    letters.forEach(function (L) {
      var og = document.createElement('optgroup');
      og.label = L;
      PROV.forEach(function (p) {
        if (p.m !== 0 && p.l === L) og.appendChild(new Option(p.gn.replace('人民政府', ''), p.k));
      });
      sel.appendChild(og);
    });
  }

  function buildCitySelect(k) {
    var sel = $('policyCity');
    if (!sel) return;
    sel.innerHTML = '';
    var p = provOf(k);
    if (p.k === '全国') {
      sel.appendChild(new Option('先选省份', ''));
      sel.disabled = true;
      return;
    }
    if (p.m === 0) {
      sel.appendChild(new Option('全市（直辖市）', ''));
      sel.disabled = true;
      return;
    }
    sel.disabled = false;
    sel.appendChild(new Option('全省 · 不限城市', ''));
    citiesOf(k).forEach(function (s) {
      var name = s.slice(0, s.indexOf('|'));
      sel.appendChild(new Option(name, name));
    });
  }

  /* ---------------- 快捷芯片 ---------------- */
  function buildChips() {
    var muni = $('policyChips');
    if (muni) {
      muni.innerHTML = '';
      PROV.forEach(function (p) {
        if (p.m !== 0) return;
        var b = el('button', 'pp-chip', p.k);
        b.type = 'button';
        b.setAttribute('data-prov', p.k);
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { apply(p.k, '', true); });
        muni.appendChild(b);
      });
    }
    var hot = $('policyHotChips');
    if (hot) {
      hot.innerHTML = '';
      HOT.forEach(function (k) {
        var b = el('button', 'pp-chip', k);
        b.type = 'button';
        b.setAttribute('data-prov', k);
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { apply(k, '', true); });
        hot.appendChild(b);
      });
    }
  }

  function syncChips() {
    var all = document.querySelectorAll('.pp-chip');
    for (var i = 0; i < all.length; i++) {
      var on = all[i].getAttribute('data-prov') === state.p;
      all[i].classList.toggle('on', on);
      all[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  /* ---------------- 卡片 ---------------- */
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

  function noteCard(title, desc, tag) {
    var d = el('div', 'pl-card pl-miss');
    d.innerHTML = '<span class="pl-tag">' + tag + '</span>' +
      '<b>' + title + '</b><p>' + desc + '</p>';
    return d;
  }

  function render() {
    var box = $('policyLinks');
    if (!box) return;
    var p = provOf(state.p);
    var c = state.c;
    var label = p.k === '全国' ? '全国' : (c ? p.k + ' · ' + c : p.k);
    if ($('policyRegionTitle')) $('policyRegionTitle').textContent = label;
    if ($('policyRegionNow')) $('policyRegionNow').textContent = label;
    box.innerHTML = '';

    if (p.k === '全国') {
      box.appendChild(linkCard(NATIONAL.cn, NATIONAL.cu,
        '全国残疾人事业主管机构：政策法规、残疾儿童康复救助制度原文与数据发布', '国家级'));
      box.appendChild(linkCard('中国政府网 · 政策文件库', NATIONAL.gu,
        '国务院政策文件库：可按"残疾儿童康复救助"等关键词检索全国性文件', '国家级'));
      box.appendChild(linkCard('国家政务服务平台', 'https://gjzwfw.www.gov.cn/',
        '跨省通办与残疾人服务专区，可在线查询办证、补贴等事项', '国家级'));
    } else {
      if (c) {
        var u = cityUrl(p.k, c);
        if (u) {
          box.appendChild(linkCard(c + '人民政府', u,
            '本市政策文件、政务公开与办事指南，可站内检索"残疾儿童康复救助"；市级细则以本市残联发布为准',
            '市级 · 政府门户'));
        } else {
          box.appendChild(noteCard(c + ' · 市级门户未收录',
            '暂未核验到' + c + '政府门户的稳定域名，为避免给错链接这里不展示猜测地址。请通过下方省残联官网或 12345 获取本市定点康复机构与救助窗口。',
            '市级 · 请走官方渠道'));
        }
      }
      box.appendChild(linkCard(p.cn, p.cu,
        c ? '省级残联官网：可在站内查找' + c + '的定点康复机构、救助项目与办事指南'
          : '康复救助项目、定点康复机构名单、办证与办事指南、通知公告',
        '省级 · 残联'));
      box.appendChild(linkCard(p.gn, p.gu,
        c ? p.k + '人民政府门户：检索省级政策文件，市级实施细则通常转载于此'
          : '本地政策文件、补贴标准与实施细则，可在站内检索"残疾儿童康复救助"',
        '省级 · 政府门户'));
    }

    // 12345 热线卡（非链接，避免误导为在线办理）
    var hot = el('div', 'pl-card pl-hot');
    hot.innerHTML = '<span class="pl-tag">电话咨询</span>' +
      '<b>12345 政务服务便民热线</b>' +
      '<p>拨打 <strong>12345</strong>，说明"咨询残疾儿童康复救助"，可转到' +
      (p.k === '全国' ? '本地' : (c || p.k) + '') +
      '经办窗口，问清年龄上限、材料清单与办理地点。</p>';
    box.appendChild(hot);

    var note = $('policyLinksNote');
    if (note) {
      note.innerHTML = '提示：' + (p.k === '全国'
        ? '选择具体省市后，这里会切换为对应的残联、政府门户与热线入口。'
        : (c ? c : p.k) + '的救助标准、年龄上限以户籍所在地县（区）残联最新公布为准，建议先电话核实再去窗口。') +
        '以上均为官方门户链接，本页仅作导航，不构成政策依据。';
    }
  }

  /* ---------------- 最近搜索记录 ---------------- */
  function loadHistory() {
    try {
      var raw = JSON.parse(localStorage.getItem(HK) || '[]');
      history = Array.isArray(raw) ? raw.filter(function (x) { return x && x.p; }).slice(0, MAX_HIS) : [];
    } catch (e) { history = []; }
  }

  function pushHistory(p, c) {
    if (!p || p === '全国') return;
    var key = p + '|' + (c || '');
    history = history.filter(function (x) { return (x.p + '|' + (x.c || '')) !== key; });
    history.unshift({ p: p, c: c || '' });
    if (history.length > MAX_HIS) history = history.slice(0, MAX_HIS);
    try { localStorage.setItem(HK, JSON.stringify(history)); } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    var wrap = $('policyHistory');
    var list = $('policyHistoryList');
    if (!wrap || !list) return;
    list.innerHTML = '';
    if (!history.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    history.forEach(function (x) {
      var b = el('button', 'pp-his', (x.c || x.p) + '<i aria-hidden="true">↺</i>');
      b.type = 'button';
      b.title = '回到 ' + (x.c ? x.p + ' · ' + x.c : x.p);
      b.addEventListener('click', function () { apply(x.p, x.c || '', true); });
      list.appendChild(b);
    });
  }

  function clearHistory() {
    history = [];
    try { localStorage.removeItem(HK); } catch (e) {}
    renderHistory();
  }

  /* ---------------- 搜索 ---------------- */
  function suggest(q) {
    q = (q || '').trim();
    if (!q) return [];
    var out = [], seen = {};
    PROV.forEach(function (p) {
      if (p.k.indexOf(q) >= 0 || p.gn.indexOf(q) >= 0) {
        out.push({ p: p.k, c: '', label: p.gn.replace('人民政府', ''), t: '省级 · 全省', rank: 0 });
        seen[p.k + '|'] = 1;
      }
    });
    Object.keys(CITY).forEach(function (k) {
      citiesOf(k).forEach(function (s) {
        var n = s.slice(0, s.indexOf('|'));
        if (n.indexOf(q) >= 0 && !seen[k + '|' + n]) {
          out.push({ p: k, c: n, label: n, t: k, rank: 1 });
          seen[k + '|' + n] = 1;
        }
      });
    });
    out.sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      var ap = a.label.indexOf(q) === 0 ? 0 : 1;
      var bp = b.label.indexOf(q) === 0 ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.label.length - b.label.length;
    });
    return out.slice(0, 8);
  }

  var sugItems = [];
  var sugIdx = -1;

  function renderSuggest(items, q) {
    var box = $('policySuggest');
    if (!box) return;
    sugItems = items;
    sugIdx = -1;
    box.innerHTML = '';
    if (!q) { box.hidden = true; return; }
    if (!items.length) {
      box.hidden = false;
      box.innerHTML = '<div class="pp-sug-empty">没有匹配的地区，试试"杭州""成都""新疆"</div>';
      return;
    }
    items.forEach(function (it, i) {
      var b = el('button', 'pp-sug');
      b.type = 'button';
      b.setAttribute('role', 'option');
      b.setAttribute('data-idx', i);
      b.innerHTML = '<b>' + (it.label || it.c || it.p) + '</b><span>' + it.t + '</span>';
      b.addEventListener('click', function () { pick(it); });
      box.appendChild(b);
    });
    box.hidden = false;
  }

  function markSuggest() {
    var box = $('policySuggest');
    if (!box) return;
    var all = box.querySelectorAll('.pp-sug');
    for (var i = 0; i < all.length; i++) {
      all[i].classList.toggle('on', i === sugIdx);
    }
  }

  function pick(it) {
    var inp = $('policySearch');
    if (inp) { inp.value = ''; inp.blur(); }
    renderSuggest([], '');
    apply(it.p, it.c, true);
  }

  /* ---------------- 应用状态 ---------------- */
  function apply(p, c, record) {
    state.p = p || '全国';
    state.c = c || '';
    var sel = $('policyRegion');
    if (sel && sel.value !== state.p) sel.value = state.p;
    buildCitySelect(state.p);
    var cs = $('policyCity');
    if (cs && !cs.disabled) cs.value = state.c;
    render();
    syncChips();
    try { localStorage.setItem(SK, JSON.stringify(state)); } catch (e) {}
    if (record) pushHistory(state.p, state.c);
  }

  function loadState() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) {}
    if (typeof s === 'string') s = { p: s, c: '' };   // 兼容旧版字符串存储
    if (!s || !s.p) return { p: '全国', c: '' };
    var pv = provOf(s.p);
    if (pv.k !== '全国' && pv.k !== s.p) return { p: '全国', c: '' };
    var c = s.c || '';
    if (c && !cityUrl(pv.k, c) && citiesOf(pv.k).indexOf(c + '|') < 0) {
      var ok = false;
      citiesOf(pv.k).forEach(function (x) { if (x.slice(0, x.indexOf('|')) === c) ok = true; });
      if (!ok) c = '';
    }
    return { p: pv.k, c: c };
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    buildProvSelect();
    buildChips();
    loadHistory();
    renderHistory();

    var saved = loadState();
    state = saved;
    buildCitySelect(state.p);
    var cs = $('policyCity');
    if (cs && !cs.disabled) cs.value = state.c;
    var sel = $('policyRegion');
    if (sel) {
      sel.value = state.p;
      sel.addEventListener('change', function () { apply(sel.value, '', true); });
    }
    if (cs) {
      cs.addEventListener('change', function () { apply(state.p, cs.value, true); });
    }
    render();
    syncChips();

    var inp = $('policySearch');
    if (inp) {
      inp.addEventListener('input', function () {
        renderSuggest(suggest(inp.value), inp.value.trim());
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' && sugItems.length) {
          e.preventDefault();
          sugIdx = (sugIdx + 1) % sugItems.length;
          markSuggest();
        } else if (e.key === 'ArrowUp' && sugItems.length) {
          e.preventDefault();
          sugIdx = sugIdx <= 0 ? sugItems.length - 1 : sugIdx - 1;
          markSuggest();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (sugItems.length) pick(sugItems[sugIdx >= 0 ? sugIdx : 0]);
        } else if (e.key === 'Escape') {
          renderSuggest([], '');
        }
      });
      inp.addEventListener('focus', function () {
        if (inp.value.trim()) renderSuggest(suggest(inp.value), inp.value.trim());
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('.pp-search')) renderSuggest([], '');
      });
    }
    var clr = $('policySearchClear');
    if (clr) {
      clr.addEventListener('click', function () {
        if (inp) { inp.value = ''; inp.focus(); }
        renderSuggest([], '');
      });
    }
    var hclr = $('policyHistoryClear');
    if (hclr) hclr.addEventListener('click', clearHistory);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
