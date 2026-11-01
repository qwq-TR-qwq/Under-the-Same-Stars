/* 自动生成，请勿直接编辑 —— 源文件：data/stats.json，生成命令：node tools/sync-stats.js */
window.XYN_STATS = {
  "meta": {
    "updated": "2026-04-03",
    "reviewCycle": "每季度复核",
    "nextReview": "2026-07",
    "caliber": "科普示意 · 非医疗统计口径",
    "rule": "各来源调查年份、样本与口径不同，数值并列呈现，不做合并推算；kind=estimate 的值按公开增速或比例推算，图表中带 * 标注"
  },
  "sources": [
    {
      "id": "who2025",
      "org": "世界卫生组织（WHO）",
      "title": "Autism fact sheet（全球约 1/127 人口在自闭症谱系）",
      "year": "2025",
      "type": "国际机构",
      "url": "https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders"
    },
    {
      "id": "cdc2023",
      "org": "美国疾控中心（CDC）ADDM 网络",
      "title": "8 岁儿童患病率 1/36（2020 监测年）",
      "year": "2023",
      "type": "国际机构",
      "url": "https://www.cdc.gov/autism/data-research/index.html"
    },
    {
      "id": "cdpf2024",
      "org": "中国残疾人联合会",
      "title": "我国自闭症谱系障碍人群超 1000 万（2024 年发布，光明网 2026-04-02 报道）",
      "year": "2024",
      "type": "官方发布",
      "url": "https://www.cdpf.org.cn/"
    },
    {
      "id": "xinhua2026",
      "org": "新华社 / 中国新闻网",
      "title": "2026 世界自闭症关注日报道：我国自闭症谱系障碍人群超 1300 万",
      "year": "2026",
      "type": "媒体报道",
      "url": "http://www.news.cn/"
    },
    {
      "id": "industry2013",
      "org": "《中国自闭症教育康复行业发展状况报告》",
      "title": "我国自闭症患者超 1000 万（行业报告口径）",
      "year": "2013",
      "type": "行业报告",
      "url": ""
    },
    {
      "id": "meta2015",
      "org": "中国儿童孤独症患病率 Meta 分析（2011—2015）",
      "title": "中国儿童自闭症患病率约 3.5‰",
      "year": "2015",
      "type": "期刊文献",
      "url": ""
    },
    {
      "id": "nhc2022",
      "org": "国家卫生健康委",
      "title": "《0—6 岁儿童孤独症筛查干预服务规范（试行）》引用患病率约 7‰",
      "year": "2022",
      "type": "政策文件",
      "url": "http://www.nhc.gov.cn/"
    },
    {
      "id": "cjrh2025",
      "org": "《中国生育健康杂志》",
      "title": "2020—2021 年 0—6 岁儿童自闭症患病率 1.8%",
      "year": "2025",
      "type": "期刊文献",
      "url": ""
    },
    {
      "id": "rmrb2025",
      "org": "人民日报 · 民生周刊",
      "title": "14 岁以下自闭症儿童约 500 万",
      "year": "2025",
      "type": "媒体报道",
      "url": "http://paper.people.com.cn/"
    },
    {
      "id": "ibge2022",
      "org": "巴西地理与统计研究所（IBGE）",
      "title": "2022 年人口普查自闭症相关数据（约 240 万）",
      "year": "2022",
      "type": "普查数据",
      "url": "https://www.ibge.gov.br/"
    }
  ],
  "trend": {
    "title": "中国自闭症患者人数与儿童患病率变化",
    "unit": "万人",
    "rateUnit": "‰",
    "years": [
      2013,
      2015,
      2016,
      2020,
      2022,
      2025
    ],
    "count": [
      {
        "v": 1000,
        "kind": "reported",
        "src": "industry2013"
      },
      {
        "v": 1050,
        "kind": "estimate",
        "basis": "按公开年增速线性插值"
      },
      {
        "v": 1075,
        "kind": "estimate",
        "basis": "按公开年增速线性插值"
      },
      {
        "v": 1175,
        "kind": "estimate",
        "basis": "按公开年增速线性插值"
      },
      {
        "v": 1225,
        "kind": "estimate",
        "basis": "按公开年增速线性插值"
      },
      {
        "v": 1300,
        "kind": "reported",
        "src": "xinhua2026"
      }
    ],
    "countNote": "* 中间年份为按公开增速估算，首末两点为公开发布值",
    "rate": [
      {
        "year": 2015,
        "v": 3.5,
        "src": "meta2015",
        "caliber": "儿童总体 · Meta 分析（2011—2015）"
      },
      {
        "year": 2020,
        "v": 18,
        "src": "cjrh2025",
        "caliber": "0—6 岁 · 1.8%（2020—2021）"
      },
      {
        "year": 2022,
        "v": 7,
        "src": "nhc2022",
        "caliber": "0—6 岁 · 规范引用值"
      }
    ],
    "rateNote": "患病率各点调查年份与口径不同，未连线、不可直接比较"
  },
  "countries": {
    "title": "各国自闭症患者数量比较（约，万人）",
    "unit": "万",
    "worldTotal": 6700,
    "worldSrc": "who2025",
    "items": [
      {
        "n": "中国",
        "v": 1300,
        "kind": "reported",
        "src": "xinhua2026"
      },
      {
        "n": "印度",
        "v": 1000,
        "kind": "estimate",
        "basis": "按人口与全球患病率推算"
      },
      {
        "n": "美国",
        "v": 550,
        "kind": "estimate",
        "basis": "按 1/36 患病率与人口推算",
        "src": "cdc2023"
      },
      {
        "n": "巴西",
        "v": 240,
        "kind": "reported",
        "src": "ibge2022"
      },
      {
        "n": "日本",
        "v": 230,
        "kind": "estimate",
        "basis": "媒体报道估算"
      },
      {
        "n": "英国",
        "v": 70,
        "kind": "estimate",
        "basis": "媒体报道估算"
      },
      {
        "n": "其他国家",
        "v": 3310,
        "kind": "derived",
        "basis": "全球 6700 万减去以上各国"
      }
    ]
  },
  "ages": {
    "title": "中国自闭症患者年龄构成（估算）",
    "unit": "万",
    "items": [
      {
        "n": "0-6 岁",
        "v": 150,
        "kind": "estimate",
        "basis": "按 14 岁以下约 500 万拆分示意",
        "src": "rmrb2025"
      },
      {
        "n": "7-12 岁",
        "v": 200,
        "kind": "estimate",
        "basis": "按 14 岁以下约 500 万拆分示意",
        "src": "rmrb2025"
      },
      {
        "n": "13-18 岁",
        "v": 150,
        "kind": "estimate",
        "basis": "按 14 岁以下约 500 万拆分示意",
        "src": "rmrb2025"
      },
      {
        "n": "18 岁以上",
        "v": 800,
        "kind": "estimate",
        "basis": "总数 1300 万减去未成年人部分"
      }
    ]
  }
};
