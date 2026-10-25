  // 心理测评模块（专业量表 + MBTI，支持历史记录）
  // ================================================================
  var testMask = document.getElementById('testMask');
  var testTitle = document.getElementById('testTitle');
  var testBody = document.getElementById('testBody');
  var testFoot = document.getElementById('testFoot');
  var testClose = document.getElementById('testClose');
  var testPrev = document.getElementById('testPrev');
  var testQuit = document.getElementById('testQuit');
  var testEntry = document.getElementById('testEntry');
  var testHistoryKey = 'star_test_history_v1';
  var testHistory = [];
  try {
    var _th = JSON.parse(localStorage.getItem(testHistoryKey) || '[]');
    if(_th instanceof Array) testHistory = _th;
  } catch(e){}
  function saveTestHistory(){ try{ localStorage.setItem(testHistoryKey, JSON.stringify(testHistory)); }catch(e){} }
  function starSvg(w){
    return '<svg style="width:' + w + 'px;height:' + w + 'px" viewBox="0 0 24 24"><path fill="#FFD964" stroke="#FFD964" stroke-width="5" stroke-linejoin="round" d="M12 1.8l2.5 6.4 6.9.9-5.2 4.6 1.5 6.8-5.7-3.6-5.7 3.6 1.5-6.8L2.6 9.1l6.9-.9z"/></svg>';
  }
  function fmtDate(d){
    function p(n){ return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function genId(){ return Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36); }

  // ---- 专业量表数据（题目源自公开专业心理量表） ----
  var TESTS = {
    phq9: {
      kind: 'scale', max: 36,
      name: '抑郁症状自评量表（PHQ-9）', tag: '抑郁 · 专业筛查量表',
      intro: '共 12 题 · 约 3 分钟。题目源自国际通用的 PHQ-9 患者健康问卷（Patient Health Questionnaire-9）及常用抑郁相关条目，请根据最近两周的情况作答。',
      options: [ {t:'完全没有', s:0}, {t:'有几天', s:1}, {t:'一半以上时间', s:2}, {t:'几乎每天', s:3} ],
      questions: [
        '做事时提不起劲或没有兴趣',
        '感到心情低落、沮丧或绝望',
        '入睡困难、睡不安稳或睡眠过多',
        '感觉疲倦或没有活力',
        '食欲不振或吃太多',
        '觉得自己很糟——或觉得自己很失败，或让自己或家人失望',
        '对事物专注有困难，例如阅读报纸或看电视时',
        '动作或说话速度缓慢到别人已经察觉；或正好相反——变得比平时更烦躁或坐立不安',
        '有不如死掉或用某种方式伤害自己的念头',
        '身体某些部位感到疼痛或不适（如头痛、背痛、胃部不舒服）',
        '感到烦躁、易怒，或一点小事就容易发脾气',
        '觉得自己很孤独，或和别人的距离越来越远'
      ],
      result: function(score){
        if(score <= 5) return { label:'无明显抑郁症状', bar: score / 36, note:'最近两周你的情绪状态整体平稳，请继续保持规律作息与适度运动。', advice:['继续保持规律的作息与睡眠，每天留一点时间做让自己放松的事','情绪偶尔低落时允许自己休息，不必事事苛求完美'] };
        if(score <= 12) return { label:'轻度抑郁症状', bar: score / 36, note:'存在一些轻度抑郁表现，多数人通过调整作息、运动与倾诉可以明显改善。', advice:['把任务拆小，先完成最小的那一步，完成一点就肯定自己一点','每天保持 20—30 分钟户外活动或运动，多晒晒太阳','和信任的人聊聊近况；若持续 2 周以上没有好转，可到正规医院心理科评估'] };
        if(score <= 19) return { label:'中度抑郁症状', bar: score / 36, note:'症状已达到中度水平，提示需要认真对待。你并不软弱，及时求助是勇敢的表现。', advice:['请优先前往正规医院心理科/精神科做专业评估，心理治疗与药物治疗均科学有效','维持基本作息，别让自己完全停下来；把状态告诉家人或好友，别独自硬扛','需要倾诉时可拨打全国心理援助热线 12356（24 小时）'] };
        if(score <= 25) return { label:'中重度抑郁症状', bar: score / 36, note:'症状已较为明显，建议尽快安排专业评估与支持，越早干预效果越好。', advice:['尽快预约正规医院心理科/精神科门诊，接受系统评估与治疗','请信任的亲友陪同就医，近期避免独处与重大决定','如出现伤害自己的念头，请立即拨打 120 或联系身边人；12356 热线 24 小时可拨打'] };
        return { label:'重度抑郁症状', bar: 1, note:'你的得分提示症状较重，请务必尽快寻求专业帮助，你值得被温柔对待。', advice:['请立即联系家人/朋友陪同，前往正规医院精神心理科就诊','如有自伤或轻生念头，请马上拨打 120 急救，或拨打心理援助热线 12356','暂时放下手头所有压力，把"照顾好自己"作为当下唯一重要的事'] };
      }
    },
    gad7: {
      kind: 'scale', max: 30,
      name: '焦虑症状自评量表（GAD-7）', tag: '焦虑 · 专业筛查量表',
      intro: '共 10 题 · 约 2 分钟。题目源自国际通用的 GAD-7 广泛性焦虑障碍量表（Generalized Anxiety Disorder-7）及常用焦虑相关条目，请根据最近两周的情况作答。',
      options: [ {t:'完全没有', s:0}, {t:'有几天', s:1}, {t:'一半以上时间', s:2}, {t:'几乎每天', s:3} ],
      questions: [
        '感觉紧张、焦虑或急切',
        '不能够停止或控制担忧',
        '对各种各样的事情担忧过多',
        '很难放松下来',
        '由于不安而无法静坐',
        '变得容易烦恼或易被激怒',
        '感到似乎将有可怕的事情发生而害怕',
        '因为担心而难以入睡或半夜醒来',
        '感到身体紧绷（如肩颈发紧、肌肉酸痛）',
        '遇到事情总忍不住往最坏的方向想'
      ],
      result: function(score){
        if(score <= 6) return { label:'无明显焦虑症状', bar: score / 30, note:'最近两周你的焦虑水平整体不高，状态良好。', advice:['保持规律作息，适量运动有助于维持稳定的情绪','如果遇到临时性紧张，试试 4-7-8 呼吸法：吸气 4 秒、屏住 7 秒、呼气 8 秒'] };
        if(score <= 13) return { label:'轻度焦虑症状', bar: score / 30, note:'存在轻度焦虑表现，通常可通过调整生活方式明显缓解。', advice:['每天留 10 分钟"担忧时间"：把担心的事写下来，其余时间提醒自己"到点再想"','减少咖啡因与熬夜，多做腹式呼吸放松训练','若持续影响学习生活，可到心理科咨询认知行为治疗'] };
        if(score <= 20) return { label:'中度焦虑症状', bar: score / 30, note:'焦虑已达到中度水平，需要重视并主动调整。', advice:['建议到正规医院心理科/精神科做专业评估','与信任的人说说自己的担忧，别把焦虑一个人扛着','坚持每天运动 30 分钟，规律运动对焦虑的改善已被大量研究证实'] };
        return { label:'重度焦虑症状', bar: 1, note:'焦虑水平较高，建议尽快寻求专业帮助。', advice:['尽快预约正规医院心理科/精神科门诊评估','急性心慌时可做慢速腹式呼吸（吸气 4 秒、呼气 6 秒），告诉自己"这会过去"','如心慌濒死感频繁发作，请遵医嘱处理，必要时拨打 12356 心理援助热线'] };
      }
    },
    mdq: {
      kind: 'yesno', max: 15,
      name: '双相障碍筛查问卷（MDQ）', tag: '躁郁 · 心境障碍筛查',
      intro: '共 15 题 · 约 3 分钟。题目源自国际通用的心境障碍问卷（Mood Disorder Questionnaire）及常用轻躁狂表现条目，请根据一生中出现过的情况作答。',
      options: [ {t:'是', s:1}, {t:'否', s:0} ],
      questions: [
        '你曾经感到非常高兴或情绪高涨，以至于别人认为你与平时不同，或者因为这种情绪高涨而给自己带来麻烦吗？',
        '你曾经因为非常生气而跟别人争吵、打架吗？',
        '你曾经比平时更加自信吗？',
        '你曾经比平时睡得少，而且也不觉得累吗？',
        '你曾经比平时更爱说话，或说话更快吗？',
        '你曾经觉得自己的想法在脑中飞快地闪过吗？',
        '你曾经很容易被周围的事物分散注意力，以至于难以集中精力做任何事吗？',
        '你曾经比平时更有精力吗？',
        '你曾经比平时更加活跃，或做了更多事情吗？',
        '你曾经在平时不会做的事情上（如购物、赌博、冒险行为）花了很多钱，以至于给自己或家庭带来麻烦吗？',
        '你曾经比平时更加关注性，或对性行为的兴趣增加吗？',
        '你曾经比平时做了更多的事情，或身体上更加坐立不安吗？',
        '你曾经觉得自己的想法跑得比平时快，或别人难以跟上你的思路吗？',
        '你曾经在一段时间里觉得自己比平时更有创造力，有很多新点子，甚至停不下来吗？',
        '你曾经因为精力旺盛而同时开始很多件事，最后大多没有完成吗？'
      ],
      result: function(score){
        if(score >= 8) return { label:'筛查提示阳性', bar: score / 15, note:'回答"是"的条目较多，提示存在双相障碍（躁郁）筛查阳性可能，建议尽快由精神科医生做进一步评估。', advice:['请到正规医院精神心理科做专业评估，双相障碍是可治疗的疾病','保持规律作息与充足睡眠；躁狂期避免做辞职、大额消费等重大决定','如正在服药，请遵医嘱，不要自行停药'] };
        if(score >= 4) return { label:'部分指标提示', bar: score / 15, note:'部分条目回答"是"，提示心境波动值得留意，建议观察并记录情绪变化。', advice:['用情绪日记记录每天的心境、睡眠与精力变化，持续 2—4 周','保持规律作息；如出现明显的低落与高涨交替，建议做专业评估','与家人或好友约定，让他们在你状态异常时温和地提醒你'] };
        return { label:'无明显提示', bar: score / 15, note:'回答"是"的条目较少，本次筛查未见明显的双相障碍提示。', advice:['继续保持规律作息与适度运动，维持情绪稳定','如果将来出现持续的情绪高低波动，可再次自评或咨询专业人士'] };
      }
    },
    pss10: {
      kind: 'scale', max: 48,
      name: '压力感知量表（PSS-10）', tag: '压力 · 主观感受评估',
      intro: '共 12 题 · 约 3 分钟。题目源自国际通用的压力感知量表（Perceived Stress Scale-10）及常用压力相关条目，请根据过去一个月的感受作答。',
      options: [ {t:'从不', s:0}, {t:'偶尔', s:1}, {t:'有时', s:2}, {t:'经常', s:3}, {t:'总是', s:4} ],
      questions: [
        { q:'因为发生意外的事情而感到心烦意乱', rev:false },
        { q:'感到无法控制生活中重要的事情', rev:false },
        { q:'感到紧张和压力', rev:false },
        { q:'能够成功地处理令人恼怒的生活麻烦', rev:true },
        { q:'觉得自己在处理重要的生活变化方面很有信心', rev:true },
        { q:'觉得自己无法处理所有自己必须做的事情', rev:false },
        { q:'能够控制生活中的烦恼', rev:true },
        { q:'觉得自己一切都顺顺利利', rev:true },
        { q:'对一些超出自己控制的事情感到生气', rev:false },
        { q:'觉得困难太多，无法克服', rev:false },
        { q:'感到自己的问题在不断累积，多到难以解决', rev:false },
        { q:'觉得身体或精神一直处于紧绷状态，很难真正放松', rev:false }
      ],
      result: function(score){
        if(score <= 16) return { label:'压力水平较低', bar: score / 48, note:'过去一个月你整体压力水平较低，状态从容。', advice:['继续保持规律的作息与运动，维持这份从容','留出固定的放松时间，享受当下的生活'] };
        if(score <= 31) return { label:'压力水平中等', bar: score / 48, note:'你正处于中等压力水平，这是多数人的常态，但值得主动调节。', advice:['每天安排 30 分钟减压时间：运动、散步、听音乐都可以','把压力源写下来，区分"能改变的"与"不能改变的"，只对前者采取行动','睡眠不足会放大压力，先保证 7 小时左右的睡眠'] };
        return { label:'压力水平较高', bar: 1, note:'过去一个月你的压力水平偏高，身体和情绪可能已发出超载信号，请优先照顾自己。', advice:['先做减法：暂时推掉不紧急的事，把睡眠和吃饭放在第一位','找信任的人倾诉，或拨打心理援助热线 12356','如果长期高压伴随失眠、情绪低落，建议到正规医院心理科评估'] };
      }
    },
    sas: {
      kind: 'scale', max: 100,
      name: '焦虑自评量表（SAS）', tag: '焦虑 · 经典自评量表',
      intro: '共 24 题 · 约 4 分钟。题目源自经典的 Zung 焦虑自评量表（Self-Rating Anxiety Scale）及常用焦虑躯体症状条目，请根据最近一周的情况作答。',
      options: [ {t:'没有或很少时间', s:0}, {t:'小部分时间', s:1}, {t:'相当多时间', s:2}, {t:'绝大部分或全部时间', s:3} ],
      transform: function(raw){ return Math.round(raw * 75 / 72 + 25); },
      questions: [
        '我觉得比平常容易紧张和着急',
        '我无缘无故地感到害怕',
        '我容易心里烦乱或觉得惊恐',
        '我觉得我可能将要发疯',
        { q:'我觉得一切都很好，也不会发生什么不幸', rev:true },
        '我手脚发抖打颤',
        '我因为头痛、颈痛和背痛而苦恼',
        '我感觉容易衰弱和疲乏',
        { q:'我觉得心平气和，并且容易安静坐着', rev:true },
        '我觉得心跳得很快',
        '我因为一阵阵头晕而苦恼',
        '我有晕倒发作，或觉得要晕倒似的',
        { q:'我吸气呼气都感到很容易', rev:true },
        '我手脚麻木和刺痛',
        '我因为胃痛和消化不良而苦恼',
        '我常常要小便',
        { q:'我的手常常是干燥温暖的', rev:true },
        '我脸红发热',
        { q:'我容易入睡并且一夜睡得很好', rev:true },
        '我做噩梦',
        '我夜里睡不安稳，容易惊醒',
        '我容易出汗，或感觉手心发凉',
        '我感到胃部不适或恶心想吐',
        '我觉得身体发紧、肌肉僵硬，难以放松'
      ],
      result: function(score){
        if(score < 50) return { label:'无明显焦虑', bar: score / 100, note:'标准分低于 50，说明最近一周你的焦虑水平处于正常范围。', advice:['保持规律作息与适度运动，维持稳定的情绪状态','压力大时多做腹式呼吸，及时放松'] };
        if(score < 60) return { label:'轻度焦虑', bar: score / 100, note:'标准分 50—59，提示存在轻度焦虑倾向，通过调整生活方式通常可以改善。', advice:['每天安排固定放松时间，减少咖啡因与熬夜','用"担忧时间"法把担心的事写下来，定时处理','若持续两周以上，建议到心理科做进一步评估'] };
        if(score < 70) return { label:'中度焦虑', bar: score / 100, note:'标准分 60—69，提示焦虑水平已较明显，建议认真对待并寻求专业支持。', advice:['建议到正规医院心理科/精神科做专业评估','坚持规律运动，规律运动对焦虑的改善已被研究证实','与信任的人倾诉，不要独自硬扛'] };
        return { label:'重度焦虑', bar: 1, note:'标准分 70 及以上，提示焦虑水平较高，请尽快寻求专业帮助。', advice:['尽快预约正规医院心理科/精神科门诊','急性心慌时做慢速腹式呼吸（吸气 4 秒、呼气 6 秒）','必要时拨打心理援助热线 12356'] };
      }
    },
    isi: {
      kind: 'scale', max: 36,
      name: '失眠严重程度指数（ISI）', tag: '睡眠 · 失眠评估量表',
      intro: '共 9 题 · 约 3 分钟。题目源自国际通用的失眠严重程度指数量表（Insomnia Severity Index）及常用失眠影响条目，请根据最近一个月的情况作答。',
      options: [ {t:'无', s:0}, {t:'轻度', s:1}, {t:'中度', s:2}, {t:'重度', s:3}, {t:'极重度', s:4} ],
      questions: [
        '入睡困难',
        '维持睡眠困难（夜间频繁醒来）',
        '太早醒来，无法再入睡',
        { q:'你对目前的睡眠模式有多满意？', opts:['非常满意','满意','一般','不满意','非常不满意'] },
        '你认为睡眠问题在多大程度上干扰了你的日常功能（白天精力、情绪、做事效率）？',
        '别人能在多大程度上注意到你的睡眠问题降低了你的生活质量？',
        '你对自己目前的睡眠问题有多担心、多苦恼？',
        '睡眠问题对你的情绪（如烦躁、低落、易怒）影响有多大？',
        '你白天因睡眠不足而感到困倦或注意力下降的程度？'
      ],
      result: function(score){
        if(score <= 9) return { label:'无明显失眠', bar: score / 36, note:'总分 0—9，说明最近一个月你的睡眠总体良好。', advice:['保持固定的起床与入睡时间，白天适度运动','睡前 1 小时放下手机，营造安静黑暗的睡眠环境'] };
        if(score <= 18) return { label:'亚临床失眠（轻度）', bar: score / 36, note:'总分 10—18，提示存在轻度失眠困扰，通过睡眠卫生调整通常可以改善。', advice:['固定作息时间，午睡不超过 30 分钟','白天多晒太阳、适量运动，晚上减少咖啡因','如果连续失眠超过两周，建议关注并寻求专业帮助'] };
        if(score <= 27) return { label:'中度临床失眠', bar: score / 36, note:'总分 19—27，提示失眠已达到临床水平，建议认真对待。', advice:['建议到正规医院睡眠专科或心理科就诊评估','睡前做放松训练（渐进式肌肉放松、正念呼吸）','避免长期自行服用安眠药'] };
        return { label:'重度临床失眠', bar: 1, note:'总分 28—36，提示严重的失眠困扰，请尽快寻求专业帮助。', advice:['尽快预约睡眠专科门诊，系统评估与治疗','失眠常与焦虑、抑郁相互加重，可一并评估','遵医嘱治疗，配合认知行为治疗（CBT-I）效果更佳'] };
      }
    },
    ses: {
      kind: 'scale', max: 48,
      name: '自尊量表（SES）', tag: '自尊 · 自我价值评估',
      intro: '共 12 题 · 约 3 分钟。题目源自经典的 Rosenberg 自尊量表（Self-Esteem Scale）及常用自我评价条目，请根据你的真实感受作答。',
      options: [ {t:'非常不同意', s:0}, {t:'不同意', s:1}, {t:'同意', s:2}, {t:'非常同意', s:3} ],
      transform: function(raw){ return raw + 12; },
      questions: [
        '我觉得自己是一个有价值的人，至少与别人不相上下',
        '我觉得自己有许多优点',
        { q:'总的来说，我倾向于认为自己是一个失败者', rev:true },
        '我做事可以和大多数人做得一样好',
        { q:'我觉得自己没有什么值得骄傲的地方', rev:true },
        '我对自己持肯定的态度',
        '总的来说，我对自己感到满意',
        { q:'我希望我能更多地尊重自己', rev:true },
        { q:'有时我的确感到自己很没用', rev:true },
        { q:'有时我觉得自己一无是处', rev:true },
        '我觉得自己在很多方面做得不错',
        { q:'我常常因为别人的评价而怀疑自己', rev:true }
      ],
      result: function(score){
        if(score <= 24) return { label:'自尊水平较低', bar: (score - 12) / 36, note:'总分 12—24，提示你目前对自己评价偏低，可能正经历自我怀疑的阶段。', advice:['试着记录每天做成的三件小事，重新看见自己的能力','减少与他人比较，多关注自己的进步','如果长期自我否定并伴随情绪低落，建议寻求心理咨询支持'] };
        if(score <= 36) return { label:'自尊水平中等', bar: (score - 12) / 36, note:'总分 25—36，你的自我价值感处于中等水平，整体健康但还有提升空间。', advice:['把注意力从"别人怎么看"转移到"我真正想要什么"','学会拒绝不合理的要求，守住边界会提升自我价值感','持续练习自我肯定，把优点写下来常翻看'] };
        return { label:'自尊水平较高', bar: 1, note:'总分 37—48，你对自己有较为稳定、积极的评价，这是心理健康的重要资源。', advice:['继续保持这份自我肯定，同时记得尊重他人的不同','在自信的同时保持谦逊与开放，成长永无止境'] };
      }
    }

  };

  // ---- MBTI 72 题（题目综合自各公开测试平台） ----
  // 顺序：0-17 EI，18-35 SN，36-53 TF，54-71 JP；快速版取每组前 6 题
  var MBTI_QUESTIONS = [
    { q:'参加聚会或集体活动后，你通常感觉', a:{t:'能量满满，还想继续', dim:'EI', side:0}, b:{t:'有些疲惫，想一个人安静待会儿', dim:'EI', side:1}, quick:true },
    { q:'在人群中，你更倾向于', a:{t:'主动搭话、参与讨论', dim:'EI', side:0}, b:{t:'先观察，遇到熟悉的话题才开口', dim:'EI', side:1}, quick:true },
    { q:'认识新朋友时，你更喜欢', a:{t:'广交朋友，认识得越多越好', dim:'EI', side:0}, b:{t:'深交少数几个知心朋友', dim:'EI', side:1}, quick:true },
    { q:'周末休息时，你更想', a:{t:'约朋友出去玩或参加活动', dim:'EI', side:0}, b:{t:'宅在家里，安静做自己的事', dim:'EI', side:1}, quick:true },
    { q:'与人联系时，你更习惯', a:{t:'随时打电话或语音沟通', dim:'EI', side:0}, b:{t:'尽量发消息，避免即时通话', dim:'EI', side:1}, quick:true },
    { q:'在课堂或会议上，你倾向于', a:{t:'积极发言、表达观点', dim:'EI', side:0}, b:{t:'认真倾听，想清楚后偶尔发言', dim:'EI', side:1} },
    { q:'长时间独处时，你更容易', a:{t:'感到无聊，想找人聊天', dim:'EI', side:0}, b:{t:'感到自在、充实', dim:'EI', side:1} },
    { q:'遇到问题需要讨论时，你更倾向', a:{t:'马上找人商量', dim:'EI', side:0}, b:{t:'自己先想明白再说', dim:'EI', side:1} },
    { q:'别人眼中的你更接近', a:{t:'外向开朗、自来熟', dim:'EI', side:0}, b:{t:'内敛沉稳、有些慢热', dim:'EI', side:1} },
    { q:'参加完一场社交活动，你通常', a:{t:'不需要恢复，甚至想继续', dim:'EI', side:0}, b:{t:'需要独处休息来充电', dim:'EI', side:1} },
    { q:'开口说话前，你通常', a:{t:'边说边想，想到什么说什么', dim:'EI', side:0}, b:{t:'先在脑中组织好再说', dim:'EI', side:1} },
    { q:'你更享受的氛围是', a:{t:'热闹、有人气的场合', dim:'EI', side:0}, b:{t:'安静、有自己空间的环境', dim:'EI', side:1} },
    { q:'当不认识的人主动和你搭话时，你通常', a:{t:'自然地聊起来，很快就熟络', dim:'EI', side:0}, b:{t:'有些拘谨，简单回应几句', dim:'EI', side:1} },
    { q:'你更愿意把情绪', a:{t:'说出来或表现出来', dim:'EI', side:0}, b:{t:'放在心里自己消化', dim:'EI', side:1} },
    { q:'一群人拍照时，你更喜欢站在', a:{t:'中间，和大家互动', dim:'EI', side:0}, b:{t:'旁边或后面，安静地笑', dim:'EI', side:1} },
    { q:'独自面对难题时，你更常', a:{t:'找人聊聊，说着说着就有了思路', dim:'EI', side:0}, b:{t:'自己安静地慢慢想', dim:'EI', side:1}, quick:true },
    { q:'参加完小组讨论后，你通常', a:{t:'意犹未尽，还想继续聊', dim:'EI', side:0}, b:{t:'松了口气，需要独处缓冲', dim:'EI', side:1} },
    { q:'你的朋友圈子更像是', a:{t:'一大群互相认识的人', dim:'EI', side:0}, b:{t:'几个各自独立的小圈子', dim:'EI', side:1} },

    { q:'看一部电影或小说时，你更关注', a:{t:'具体的情节、细节与事实', dim:'SN', side:0}, b:{t:'背后的寓意、主题与想象空间', dim:'SN', side:1}, quick:true },
    { q:'学习新事物时，你更喜欢', a:{t:'一步步按说明操作', dim:'SN', side:0}, b:{t:'先理解整体原理，再自由发挥', dim:'SN', side:1}, quick:true },
    { q:'你更相信', a:{t:'亲身经验与具体数据', dim:'SN', side:0}, b:{t:'直觉与灵感', dim:'SN', side:1}, quick:true },
    { q:'描述一件事时，你习惯', a:{t:'讲具体发生了什么', dim:'SN', side:0}, b:{t:'讲它说明了什么、意味着什么', dim:'SN', side:1}, quick:true },
    { q:'面对未来，你更常想', a:{t:'眼前的计划与安排', dim:'SN', side:0}, b:{t:'各种可能性与未来的想象', dim:'SN', side:1}, quick:true },
    { q:'你更喜欢的工作方式', a:{t:'明确、具体、可执行', dim:'SN', side:0}, b:{t:'有创意、有挑战、有变化', dim:'SN', side:1} },
    { q:'你更留意', a:{t:'眼前的细节与现实', dim:'SN', side:0}, b:{t:'事物背后的模式与联系', dim:'SN', side:1} },
    { q:'写文章或发消息时，你更在意', a:{t:'信息准确、条理清楚', dim:'SN', side:0}, b:{t:'表达生动、有感染力', dim:'SN', side:1} },
    { q:'你更容易记住', a:{t:'具体的事例与数据', dim:'SN', side:0}, b:{t:'整体的感觉与印象', dim:'SN', side:1} },
    { q:'面对一个新想法，你的第一反应是', a:{t:'它现不现实、能不能落地', dim:'SN', side:0}, b:{t:'它很有趣、可以怎么实现', dim:'SN', side:1} },
    { q:'做事时，你更喜欢', a:{t:'按既有的方法把事情做对', dim:'SN', side:0}, b:{t:'尝试新方法把事情做得更好', dim:'SN', side:1} },
    { q:'观察一个人时，你更注意', a:{t:'他说了什么、做了什么', dim:'SN', side:0}, b:{t:'他给我的感觉、背后的动机', dim:'SN', side:1} },
    { q:'讲解一个概念时，你更倾向于', a:{t:'举具体的例子来说明', dim:'SN', side:0}, b:{t:'先讲清原理和整体框架', dim:'SN', side:1} },
    { q:'你更常被哪种事物吸引', a:{t:'真实、有用、眼前的东西', dim:'SN', side:0}, b:{t:'新奇、抽象、有深意的东西', dim:'SN', side:1} },
    { q:'关于"灵感"，你认为它更多来自', a:{t:'长期积累的实践经验', dim:'SN', side:0}, b:{t:'突然的联想与顿悟', dim:'SN', side:1} },
    { q:'你更愿意读', a:{t:'纪实、科普等讲事实的内容', dim:'SN', side:0}, b:{t:'小说、散文等讲想象的内容', dim:'SN', side:1}, quick:true },
    { q:'规划旅行时，你更看重', a:{t:'路线、预算、天气等实际细节', dim:'SN', side:0}, b:{t:'那种未知和探索的新鲜感', dim:'SN', side:1} },
    { q:'解决问题时，你更依赖', a:{t:'以往的经验和已知方法', dim:'SN', side:0}, b:{t:'直觉和新的可能性', dim:'SN', side:1} },

    { q:'做决定时，你更看重', a:{t:'逻辑、标准与公平', dim:'TF', side:0}, b:{t:'感受、关系与人情', dim:'TF', side:1}, quick:true },
    { q:'朋友向你倾诉烦恼时，你更容易', a:{t:'帮ta分析原因、给出方案', dim:'TF', side:0}, b:{t:'先共情ta的情绪', dim:'TF', side:1}, quick:true },
    { q:'与人争论时，你更在意', a:{t:'谁对谁错、把道理讲清', dim:'TF', side:0}, b:{t:'气氛是否和谐、别伤感情', dim:'TF', side:1}, quick:true },
    { q:'你更希望别人评价你', a:{t:'理性、靠谱', dim:'TF', side:0}, b:{t:'温暖、善解人意', dim:'TF', side:1}, quick:true },
    { q:'面对批评，你更能接受', a:{t:'直截了当指出问题', dim:'TF', side:0}, b:{t:'委婉温和的表达', dim:'TF', side:1}, quick:true },
    { q:'挑选礼物时，你更考虑', a:{t:'实用与性价比', dim:'TF', side:0}, b:{t:'心意与对方会喜欢的程度', dim:'TF', side:1} },
    { q:'意见不合时，你更希望', a:{t:'摆事实、讲道理', dim:'TF', side:0}, b:{t:'先理解对方的立场和感受', dim:'TF', side:1} },
    { q:'你更认同', a:{t:'对事不对人', dim:'TF', side:0}, b:{t:'先有关系，再说事情', dim:'TF', side:1} },
    { q:'需要指出别人问题时，你', a:{t:'直接指出问题所在', dim:'TF', side:0}, b:{t:'先肯定，再委婉提建议', dim:'TF', side:1} },
    { q:'做事时，你更在乎', a:{t:'结果是否正确、是否高效', dim:'TF', side:0}, b:{t:'过程中大家的感受', dim:'TF', side:1} },
    { q:'在团队里，你更像', a:{t:'理性分析、提出方案的思考者', dim:'TF', side:0}, b:{t:'照顾氛围、调和关系的协调者', dim:'TF', side:1} },
    { q:'看到不公正的现象，你首先', a:{t:'分析原因、寻找对策', dim:'TF', side:0}, b:{t:'感到愤慨、想表达支持', dim:'TF', side:1} },
    { q:'朋友做错了事，你更可能', a:{t:'直接指出错在哪里', dim:'TF', side:0}, b:{t:'先安慰，再委婉提醒', dim:'TF', side:1} },
    { q:'你更欣赏的队友是', a:{t:'能力强、效率高的人', dim:'TF', side:0}, b:{t:'好相处、顾全大局的人', dim:'TF', side:1} },
    { q:'做选择时，你更担心', a:{t:'选择不够理性', dim:'TF', side:0}, b:{t:'选择伤害了别人的感受', dim:'TF', side:1} },
    { q:'评价一次合作是否成功，你更看重', a:{t:'目标是否达成、效率是否够高', dim:'TF', side:0}, b:{t:'过程是否愉快、大家是否同心', dim:'TF', side:1}, quick:true },
    { q:'帮助朋友时，你更常', a:{t:'帮ta理清思路、做计划', dim:'TF', side:0}, b:{t:'先让ta感觉被理解和陪伴', dim:'TF', side:1} },
    { q:'你更希望别人眼中的你是', a:{t:'公正、理性、可靠', dim:'TF', side:0}, b:{t:'温和、贴心、好相处', dim:'TF', side:1} },

    { q:'旅行或学习前，你更喜欢', a:{t:'做好详细计划并按计划进行', dim:'JP', side:0}, b:{t:'随心而动，走到哪算哪', dim:'JP', side:1}, quick:true },
    { q:'你的桌面或房间通常是', a:{t:'井井有条，东西各有其位', dim:'JP', side:0}, b:{t:'有点乱，但自己找得到', dim:'JP', side:1}, quick:true },
    { q:'面对截止日期，你习惯', a:{t:'提前完成，留足余量', dim:'JP', side:0}, b:{t:'临近截止才最有动力', dim:'JP', side:1}, quick:true },
    { q:'你更喜欢', a:{t:'把任务列成清单，一件件打勾', dim:'JP', side:0}, b:{t:'灵活机动，随时调整', dim:'JP', side:1}, quick:true },
    { q:'临时改变计划，你会', a:{t:'不太舒服，希望恢复原样', dim:'JP', side:0}, b:{t:'觉得挺新鲜，乐意尝试', dim:'JP', side:1}, quick:true },
    { q:'你更喜欢', a:{t:'一切尽在掌握的感觉', dim:'JP', side:0}, b:{t:'随机应变的感觉', dim:'JP', side:1} },
    { q:'你的待办事项', a:{t:'常在手边清单上，随时更新', dim:'JP', side:0}, b:{t:'只在心里，大概有个数', dim:'JP', side:1} },
    { q:'旅行中迷路了，你更倾向', a:{t:'查地图、规划路线', dim:'JP', side:0}, b:{t:'随便走走，说不定有惊喜', dim:'JP', side:1} },
    { q:'你更适应', a:{t:'规则明确的环境', dim:'JP', side:0}, b:{t:'自由宽松的环境', dim:'JP', side:1} },
    { q:'做决定前，你通常', a:{t:'尽快做出决定', dim:'JP', side:0}, b:{t:'多比较、多权衡，留有余地', dim:'JP', side:1} },
    { q:'你更喜欢', a:{t:'有始有终地完成一件事', dim:'JP', side:0}, b:{t:'同时开好几个头，看兴趣', dim:'JP', side:1} },
    { q:'收拾行李或整理收纳时，你', a:{t:'提前列好清单，准备充分', dim:'JP', side:0}, b:{t:'出发前随便塞几件', dim:'JP', side:1} },

    { q:'你更讨厌', a:{t:'计划被打乱的失控感', dim:'JP', side:0}, b:{t:'被各种约定束缚的感觉', dim:'JP', side:1} },
    { q:'假期里，你更喜欢', a:{t:'提前排好每天的行程', dim:'JP', side:0}, b:{t:'睡到自然醒，随性安排', dim:'JP', side:1} },
    { q:'面对留有选择的余地时，你通常', a:{t:'尽快敲定，不再纠结', dim:'JP', side:0}, b:{t:'保留选项，随时可改', dim:'JP', side:1} },
    { q:'开始一项任务前，你习惯', a:{t:'先规划好步骤再动手', dim:'JP', side:0}, b:{t:'边做边调整，按感觉来', dim:'JP', side:1}, quick:true },
    { q:'面对突然的通知或安排，你', a:{t:'希望尽快明确计划', dim:'JP', side:0}, b:{t:'能接受，随机应变就好', dim:'JP', side:1} },
    { q:'你更享受哪种状态', a:{t:'事情都在掌控之中', dim:'JP', side:0}, b:{t:'自由发挥、随遇而安', dim:'JP', side:1} }
  ];
  function mbtiQuickQs(){
    var arr = [];
    for(var i = 0; i < MBTI_QUESTIONS.length; i++){ if(MBTI_QUESTIONS[i].quick) arr.push(MBTI_QUESTIONS[i]); }
    return arr;
  }
  TESTS.mbti_quick = {
    kind: 'mbti',
    name: 'MBTI 性格测试 · 快速版', tag: '16 型人格 · 24 题',
    intro: '共 24 题 · 约 4 分钟。题目综合自各公开测试平台发布的 MBTI 风格自评题，用于自我探索，非官方 MBTI 测评。',
    questions: mbtiQuickQs()
  };
  TESTS.mbti_full = {
    kind: 'mbti',
    name: 'MBTI 性格测试 · 完整版', tag: '16 型人格 · 72 题',
    intro: '共 72 题 · 约 11 分钟。四个维度各 18 题，全方位测查，题目综合自各公开测试平台发布的 MBTI 风格自评题。',
    questions: MBTI_QUESTIONS
  };

  // ---- 16 型人格介绍 ----
  var MBTI_PROFILES = {
    ISTJ: { name:'物流师', tag:'严谨务实的守护者', desc:'稳重可靠、重视细节与秩序，天生值得信赖。他们习惯把生活安排得井井有条，承诺过的事一定会做到，是团队里让人安心的"压舱石"。', good:['极强的责任心与执行力','注重细节，做事有始有终','原则性强，值得托付'], grow:['偶尔允许计划被打破，接受"足够好"而不是"完美"','主动表达感受，别让责任压垮自己'], rela:['守时守信，给足确定性','不要随意打乱ta的安排'], career:['会计/审计','行政管理','数据分析','项目管理'] },
    ISFJ: { name:'守卫者', tag:'温暖可靠的照顾者', desc:'温柔体贴、默默奉献，非常重视传统与忠诚。他们总能敏锐察觉身边人的需要，用行动表达关心，是朋友和家人最温暖的依靠。', good:['细腻体贴，善解人意','服务意识强，乐于付出','记忆力好，关注细节'], grow:['学会说"不"，照顾别人之前先照顾好自己','多表达自己的真实需求'], rela:['真诚回应ta的关心','肯定ta的付出，别把照顾当理所当然'], career:['护理/医护','教师','社会工作','行政支持'] },
    INFJ: { name:'提倡者', tag:'安静坚定的理想主义者', desc:'理想主义、洞察人心，追求意义与深度的连接。他们安静却有力量，善于理解他人的复杂情感，并愿意为让世界更好而默默努力。', good:['深刻的洞察力与共情力','有理想、有原则，行动坚定','擅长深度交流与写作'], grow:['允许自己"不完美"，理想与现实需要折中','别把所有情绪都自己消化，找人分担'], rela:['认真倾听ta的价值观','避免敷衍与肤浅的寒暄'], career:['心理咨询','教育培训','写作/编辑','公益策划'] },
    INTJ: { name:'建筑师', tag:'深谋远虑的战略家', desc:'独立理性、远见卓识，喜欢用系统思维理解世界。他们习惯制定长期规划并专注执行，不轻易被外界干扰，是天生的战略思考者。', good:['战略思维与规划能力突出','独立思考，不随波逐流','目标感强，执行力高'], grow:['多一些耐心与包容，别人未必跟得上你的节奏','学会适当表达情感，别让人觉得难以接近'], rela:['尊重ta的独立空间','用事实与逻辑沟通，避免情绪化拉扯'], career:['战略分析','科学研究','软件架构','金融分析'] },
    ISTP: { name:'鉴赏家', tag:'冷静敏锐的实干家', desc:'冷静务实、动手能力强，喜欢探究事物运作的原理。他们灵活应变、随遇而安，遇到问题先动手解决，很少陷入内耗。', good:['动手能力与应变力强','冷静客观，临危不乱','喜欢钻研，学东西快'], grow:['对长期规划上点心，别只顾眼前','适当打开心扉，多分享自己的想法'], rela:['给ta自由与空间，不唠叨','有具体问题可以直接找ta帮忙'], career:['工程技术','外科/医疗技术','数据分析','应急抢险'] },
    ISFP: { name:'探险家', tag:'温和细腻的艺术家', desc:'温和敏感、审美出众，喜欢活在当下、忠于自己的感受。他们不喜约束，用自己的方式探索世界，常常在艺术与生活中发现美。', good:['审美与感知力出色','温和友善，不给人压力','忠于内心，真诚纯粹'], grow:['重要决定前多收集信息，别只凭感觉','敢于表达自己，你的想法值得被听见'], rela:['用温柔的方式靠近，别逼迫ta表态','尊重ta的节奏与个人空间'], career:['艺术设计','摄影','美食/烘焙','康复治疗'] },
    INFP: { name:'调停者', tag:'温柔浪漫的梦想家', desc:'理想主义、共情力强，忠于内心价值，渴望世界变得更美好。他们看似安静，内心却有丰富的情感与想象力，是温柔的理想主义者。', good:['共情力与想象力极强','价值观坚定，真诚善良','适合创作与深度思考'], grow:['把理想转化为小步行动，别停在空想','别过度内耗，允许现实不完美'], rela:['真诚而深入地交流','不要轻慢ta的信念与感受'], career:['写作/编辑','心理咨询','艺术创作','公益事业'] },
    INTP: { name:'逻辑学家', tag:'好奇善思的探索者', desc:'思维缜密、创意十足，痴迷于理解世界的规律。他们喜欢独立思考，对感兴趣的问题会钻研到底，常常提出令人惊喜的新视角。', good:['逻辑分析与创新思维强','知识面广，好奇心旺盛','独立思考，不盲从权威'], grow:['别让完美主义拖住行动','多与人分享想法，别只活在脑内世界'], rela:['讨论时给ta思考时间','用逻辑对话，别用情绪施压'], career:['科研开发','程序/算法工程师','系统架构','学术研究'] },
    ESTP: { name:'企业家', tag:'活力四射的行动派', desc:'精力充沛、反应敏捷，热爱冒险与即时体验。他们活在当下，行动力极强，擅长处理突发状况，是人群中最会"来事"的那一个。', good:['行动力与临场反应一流','乐观豁达，感染力强','善于把握机会'], grow:['做事多考虑长远后果','对感受保持敏感，别太直接伤人'], rela:['和ta一起行动，别只坐而论道','给ta试错的空间'], career:['销售','市场营销','创业','体育/户外教练'] },
    ESFP: { name:'表演者', tag:'阳光开朗的快乐源泉', desc:'热情开朗、热爱生活，善于带动气氛，享受与人互动。他们真诚大方，走到哪里都像自带阳光，是朋友眼中的开心果。', good:['热情外向，感染力强','善于与人建立连接','适应力强，乐观积极'], grow:['重要事情提前规划，别临时抱佛脚','学会独处，沉淀自己的想法'], rela:['陪ta玩、陪ta疯','给ta真诚的赞美与关注'], career:['演艺/主持','公关活动','幼儿教育','旅游服务'] },
    ENFP: { name:'竞选者', tag:'热情洋溢的灵感火花', desc:'充满热情与想象力，善于感染他人，追求可能性与自由。他们点子多、行动快，总能把身边的人带入新的兴奋点。', good:['创造力与热情出众','善于激励他人','思维活跃，点子多'], grow:['专注完成一件事，别总半途而废','面对琐碎事务多点耐心'], rela:['认真听ta的奇思妙想','别用条条框框束缚ta'], career:['创意策划','公关传播','教育培训','创业者'] },
    ENTP: { name:'辩论家', tag:'机敏灵活的头脑风暴者', desc:'机智敏捷、思维活跃，热爱挑战观念，享受头脑交锋。他们喜欢从不同角度拆解问题，总能带来让人眼前一亮的见解。', good:['思维敏捷，视角独特','善于提出新想法','不惧权威，敢于挑战'], grow:['尊重既定流程，别总想推翻','关注执行，别让想法停留在口头'], rela:['可以大胆和ta辩论','别觉得ta的抬杠是攻击'], career:['产品经理','创业','咨询顾问','律师/辩论'] },
    ESTJ: { name:'总经理', tag:'雷厉风行的管理者', desc:'果断高效、组织力强，重视规则与秩序，是天生的管理者。他们目标明确、说到做到，擅长把复杂的事情安排得井井有条。', good:['组织管理与执行力强','决策果断，有担当','责任感重，靠谱'], grow:['多听不同意见，别太强势','关注人情温度，别只看效率'], rela:['尊重ta的规则与安排','用结果说话，别含糊其辞'], career:['企业运营','行政管理','项目经理','公务员'] },
    ESFJ: { name:'执政官', tag:'热心周到的协调者', desc:'热心周到、责任感强，善于协调人际，乐于助人。他们非常重视身边的人，总能记得大家的喜好，把集体氛围照顾得妥妥帖帖。', good:['亲和力与协调能力出色','热心肠，乐于助人','责任感强，注重承诺'], grow:['别过度在意他人评价','照顾他人时也留一份心力给自己'], rela:['回应ta的关心与好意','在ta需要时给ta同样的支持'], career:['教师','医护','客户服务','人力资源管理'] },
    ENFJ: { name:'主人公', tag:'富有魅力的领航者', desc:'富有魅力、善于激励，关心他人成长，是天生的领导者。他们真诚地希望每个人都能变好，并愿意为此付出极大的热情与努力。', good:['感染力与领导力强','洞察人心，善于激励','利他且真诚'], grow:['别把所有人的责任都揽到自己身上','接受不是每个人都愿意被"带领"'], rela:['坦诚表达你的需求','珍惜ta的真诚，别辜负ta的信任'], career:['教育培训','组织发展','咨询顾问','人力资源'] },
    ENTJ: { name:'指挥官', tag:'自信果断的统帅', desc:'自信果断、目标明确，善于统筹全局，带领团队前进。他们拥有强大的意志力与战略眼光，是天生的组织者与开拓者。', good:['战略眼光与决断力强','统筹与领导能力出色','意志坚定，抗压性强'], grow:['多倾听、多共情，别只顾目标','允许他人用不同的方式做事'], rela:['直接高效地沟通','用实力赢得ta的尊重'], career:['企业高管','创业者','战略顾问','投资管理'] }
  };

  // ---- 测评引擎 ----
  var quizState = null;
  var TEST_ORDER = ['phq9', 'gad7', 'sas', 'mdq', 'pss10', 'isi', 'ses', 'mbti_quick', 'mbti_full'];
  var TEST_META = {
    phq9:      { meta:'12 题 · 约 3 分钟', desc:'国际通用的抑郁症状筛查量表，评估最近两周的情绪状态' },
    gad7:      { meta:'10 题 · 约 2 分钟', desc:'国际通用的焦虑症状筛查量表，评估过度担忧与紧张' },
    mdq:       { meta:'15 题 · 约 3 分钟', desc:'国际通用的心境障碍（躁郁）筛查问卷，识别情绪高低波动' },
    pss10:     { meta:'12 题 · 约 3 分钟', desc:'国际通用的压力感知量表，评估过去一个月的压力水平' },
    sas:       { meta:'24 题 · 约 4 分钟', desc:'经典 Zung 焦虑自评量表，全面评估最近一周的焦虑水平' },
    isi:       { meta:'9 题 · 约 3 分钟', desc:'国际通用的失眠严重程度指数，评估最近一个月的睡眠困扰' },
    ses:       { meta:'12 题 · 约 3 分钟', desc:'经典 Rosenberg 自尊量表，评估你对自己的总体评价' },
    mbti_quick:{ meta:'24 题 · 约 4 分钟', desc:'快速了解你的性格倾向，四维度全覆盖，结果一目了然' },
    mbti_full: { meta:'72 题 · 约 11 分钟', desc:'全方位测查 16 型人格，四维度各 18 题，结果更细致' }
  };
  function findTestKey(name){
    for(var k in TESTS){ if(TESTS[k].name === name) return k; }
    return null;
  }
  function openTestMask(){ testMask.classList.add('open'); showTestHome(); }
  function closeTestMask(){ testMask.classList.remove('open'); quizState = null; }
  testEntry.addEventListener('click', function(e){ e.stopPropagation(); openTestMask(); }, false);
  testClose.addEventListener('click', function(e){ e.stopPropagation(); closeTestMask(); }, false);
  testMask.addEventListener('click', function(e){ if(e.target === testMask) closeTestMask(); }, false);
  testQuit.addEventListener('click', function(e){ e.stopPropagation(); closeTestMask(); }, false);
  testPrev.addEventListener('click', function(e){ e.stopPropagation(); if(quizState && quizState.idx > 0){ quizState.idx--; renderQuiz(); } }, false);

  function showTestHome(){
    testTitle.textContent = '心理测评 · 认识自己';
    testFoot.style.display = 'none';
    var cards = '';
    for(var i = 0; i < TEST_ORDER.length; i++){
      var key = TEST_ORDER[i];
      var t = TESTS[key];
      cards += '<div class="t-card" data-key="' + key + '">' +
        '<div class="tc-top"><span class="tc-ic">' + starSvg(26) + '</span><div><h4>' + t.name + '</h4><div class="tc-meta">' + TEST_META[key].meta + '</div></div></div>' +
        '<p class="tc-desc">' + TEST_META[key].desc + '</p>' +
        '<span class="tc-go">开始测评 →</span></div>';
    }
    testBody.innerHTML =
      '<div class="t-grid">' + cards + '</div>' +
      '<p class="t-note">所有量表题目均源自公开的专业心理量表，或各公开测试平台发布的题目综合整理，用于自我了解与筛查参考。<br><b style="color:var(--star)">结果仅供参考，不具有医疗诊断意义。</b></p>' +
      '<div class="hist-bar"><button class="ui-close" id="histBtn" type="button">查看历史记录</button></div>';
    var cardsEl = testBody.querySelectorAll('.t-card');
    for(var c = 0; c < cardsEl.length; c++){
      (function(card){
        card.addEventListener('click', function(e){
          e.stopPropagation();
          openTest(card.getAttribute('data-key'));
        }, false);
      })(cardsEl[c]);
    }
    document.getElementById('histBtn').addEventListener('click', function(e){ e.stopPropagation(); showHistory(); }, false);
  }
  function openTest(key){
    var t = TESTS[key];
    if(!t) return;
    quizState = { test: t, answers: [], idx: 0 };
    testTitle.textContent = t.name;
    renderQuiz();
  }
  function renderQuiz(){
    var t = quizState.test;
    var idx = quizState.idx;
    var n = t.questions.length;
    testFoot.style.display = 'flex';
    testPrev.style.display = idx > 0 ? '' : 'none';
    var q = t.questions[idx];
    var qText = (typeof q === 'string') ? q : q.q;
    var opts = '';
    var keyOf = function(oi){
      if(t.kind === 'yesno') return oi === 0 ? '是' : '否';
      return String.fromCharCode(65 + oi);
    };
    if(t.kind === 'mbti'){
      opts = '<button class="quiz-opt" data-oi="0" type="button"><span class="qo-key">A</span><span>' + escHtml(q.a.t) + '</span></button>' +
             '<button class="quiz-opt" data-oi="1" type="button"><span class="qo-key">B</span><span>' + escHtml(q.b.t) + '</span></button>';
    } else {
      var optsArr = (typeof q === 'object' && q.opts) ? q.opts : t.options;
      for(var oi = 0; oi < optsArr.length; oi++){
        opts += '<button class="quiz-opt" data-oi="' + oi + '" type="button"><span class="qo-key">' + keyOf(oi) + '</span><span>' + optsArr[oi].t + '</span></button>';
      }
    }
    testBody.innerHTML =
      '<div class="quiz-top"><span class="quiz-flag">' + t.tag + '</span><span class="quiz-count">第 ' + (idx + 1) + ' / ' + n + ' 题</span></div>' +
      '<div class="quiz-progress"><i style="width:' + Math.round(idx / n * 100) + '%"></i></div>' +
      '<div class="quiz-q">' + escHtml(qText) + '</div>' +
      '<div class="quiz-opts">' + opts + '</div>' +
      '<p class="quiz-hint">' + starSvg(14) + ' <b>作答提示：</b>请根据你最近一段时间的真实表现进行选择</p>';
    testBody.scrollTop = 0;
    var btns = testBody.querySelectorAll('.quiz-opt');
    for(var b = 0; b < btns.length; b++){
      (function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          choose(parseInt(btn.getAttribute('data-oi'), 10));
        }, false);
      })(btns[b]);
    }
  }
  function choose(oi){
    quizState.answers[quizState.idx] = oi;
    var t = quizState.test;
    if(quizState.idx < t.questions.length - 1){
      quizState.idx++;
      renderQuiz();
    } else {
      finishQuiz();
    }
  }
  function finishQuiz(){
    var t = quizState.test;
    var record = (t.kind === 'mbti') ? mbtiRecord(t, quizState.answers) : scaleRecord(t, quizState.answers);
    testHistory.unshift(record);
    saveTestHistory();
    renderResult(record);
  }
  function scaleRecord(t, answers){
    var score = 0;
    for(var i = 0; i < answers.length; i++){
      var q = t.questions[i];
      var s = t.options[answers[i]].s;
      if(q && q.rev) s = (t.options.length - 1) - s;
      score += s;
    }
    if(t.transform) score = t.transform(score);
    var r = t.result(score);
    return { id: genId(), kind: 'scale', scale: t.name, tag: t.tag, date: fmtDate(new Date()),
             score: score, max: t.max, label: r.label, bar: r.bar, note: r.note, advice: r.advice };
  }
  function mbtiRecord(t, answers){
    var counts = { EI:[0,0], SN:[0,0], TF:[0,0], JP:[0,0] };
    for(var i = 0; i < answers.length; i++){
      var q = t.questions[i];
      var opt = answers[i] === 0 ? q.a : q.b;
      counts[opt.dim][opt.side]++;
    }
    var order = [ ['EI',['E','I']], ['SN',['S','N']], ['TF',['T','F']], ['JP',['J','P']] ];
    var code = '';
    var borderline = [];
    var dims = [];
    for(var d = 0; d < order.length; d++){
      var key = order[d][0];
      var letters = order[d][1];
      var c0 = counts[key][0], c1 = counts[key][1], total = c0 + c1;
      var p1 = total ? Math.round(c1 / total * 100) : 0;
      var letter = letters[0];
      if(c0 === c1){ borderline.push(key + ' 维度倾向不明显（50% / 50%）'); }
      else if(c1 > c0){ letter = letters[1]; }
      code += letter;
      dims.push({ key: key, l0: letters[0], l1: letters[1], p1: p1, tie: c0 === c1 });
    }
    var profile = MBTI_PROFILES[code];
    return { id: genId(), kind: 'mbti', scale: t.name, tag: t.tag, date: fmtDate(new Date()),
             type: code, typeName: profile ? profile.name : '', label: code + ' · ' + (profile ? profile.name : ''),
             dims: dims, borderline: borderline, profile: profile };
  }
  function renderResult(record){
    testTitle.textContent = '测评结果 · ' + record.scale;
    testFoot.style.display = 'none';
    var html = '';
    if(record.kind === 'mbti'){
      var p = record.profile || { name:'', tag:'', desc:'', good:[], grow:[], rela:[], career:[] };
      var dimsHtml = '<div class="mbti-dims">';
      for(var i = 0; i < record.dims.length; i++){
        var dm = record.dims[i];
        dimsHtml += '<div class="mbti-dim"><span class="dd-l">' + dm.l0 + '</span><div class="dd-track"><i style="width:' + dm.p1 + '%"></i></div><span class="dd-r">' + dm.l1 + '</span><em>' + (dm.tie ? '临界' : (dm.p1 >= 50 ? dm.p1 + '% 倾向 ' + dm.l1 : (100 - dm.p1) + '% 倾向 ' + dm.l0)) + '</em></div>';
      }
      dimsHtml += '</div>';
      var borderHtml = '';
      if(record.borderline.length){
        borderHtml = '<div class="res-sec"><h5>临界提示</h5><p class="res-txt">' + record.borderline.join('；') + '。你可能同时兼具两种特质，这很正常，也很有趣。</p></div>';
      }
      html = '<div class="res-wrap">' +
        '<span class="res-badge">' + starSvg(16) + ' ' + record.tag + '</span>' +
        '<div class="res-type">' + record.type + '</div>' +
        '<div class="res-label">' + p.name + ' · ' + p.tag + '</div>' +
        dimsHtml +
        '<div class="res-sec"><h5>核心特点</h5><p class="res-txt">' + p.desc + '</p></div>' +
        '<div class="res-sec"><h5>天然优势</h5><div class="res-list">' + p.good.map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
        '<div class="res-sec"><h5>成长建议</h5><div class="res-list">' + p.grow.map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
        '<div class="res-sec"><h5>适合的职业方向</h5><div class="res-list">' + (p.career && p.career.length ? p.career : ['结合兴趣与特长，探索适合自己的方向']).map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
        '<div class="res-sec"><h5>相处建议</h5><div class="res-list">' + p.rela.map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
        borderHtml +
        '<div class="res-quote">结果在不同时期下会有变化，不要让结果框住了你原本自由发展的性格。</div>' +
        '<div class="disclaimer">结果仅供参考，不具有医疗诊断意义。MBTI 是性格探索工具，不是医学评估。</div>' +
        '<div class="res-actions" id="resActions">' +
        '<button class="ui-close" data-act="m16" type="button">查看 16 种人格介绍</button>' +
        '<button class="ui-close" data-act="analyze" type="button">让星语分析这份结果</button>' +
        '<button class="ui-close" data-act="again" type="button">再测一次</button>' +
        '<button class="ui-close" data-act="home" type="button">返回测试选择</button>' +
        '<button class="ui-close" data-act="hist" type="button">查看历史记录</button>' +
        '</div></div>';
    } else {
      html = '<div class="res-wrap">' +
        '<span class="res-badge">' + starSvg(16) + ' ' + record.tag + '</span>' +
        '<div class="res-score"><span class="n">' + record.score + '</span><span class="u">/ ' + record.max + ' 分</span></div>' +
        '<div class="res-label">' + record.label + '</div>' +
        '<div class="res-bar"><i style="width:' + Math.max(6, Math.round(record.bar * 100)) + '%"></i></div>' +
        '<p class="res-scale">分值越低代表该项症状越轻微</p>' +
        '<div class="res-sec"><h5>结果解读</h5><p class="res-txt">' + record.note + '</p></div>' +
        '<div class="res-sec"><h5>给你的建议</h5><div class="res-list">' + record.advice.map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
        '<div class="disclaimer">结果仅供参考，不具有医疗诊断意义。本测评不能替代专业医生的面诊评估，如有困扰请前往正规医院心理科/精神科咨询。</div>' +
        '<div class="res-actions" id="resActions">' +
        '<button class="ui-close" data-act="analyze" type="button">让星语分析这份结果</button>' +
        '<button class="ui-close" data-act="again" type="button">再测一次</button>' +
        '<button class="ui-close" data-act="home" type="button">返回测试选择</button>' +
        '<button class="ui-close" data-act="hist" type="button">查看历史记录</button>' +
        '</div></div>';
    }
    testBody.innerHTML = html;
    testBody.scrollTop = 0;
    var acts = document.getElementById('resActions');
    if(acts){
      var btns = acts.querySelectorAll('button');
      for(var a = 0; a < btns.length; a++){
        (function(btn){
          btn.addEventListener('click', function(e){
            e.stopPropagation();
            var act = btn.getAttribute('data-act');
            var key = findTestKey(record.scale);
            if(act === 'again' && key){ openTest(key); }
            else if(act === 'home'){ showTestHome(); }
            else if(act === 'hist'){ showHistory(); }
            else if(act === 'm16'){ showMbtiList(); }
            else if(act === 'analyze'){ sendResultToChat(record); }
          }, false);
        })(btns[a]);
      }
    }
  }
  function sendResultToChat(record){
    var text;
    if(record.kind === 'mbti'){
      var pr = record.profile || {};
      text = '【我的 MBTI 测评结果】我测出的人格类型是 ' + (record.type || '') + '（' + (pr.name || '') + ' · ' + (pr.tag || '') + '）。可以帮我分析一下这个类型的特点和适合的发展方向吗？';
    } else {
      text = '【我的测评结果】我完成了「' + record.scale + '」，得分 ' + record.score + '/' + record.max + ' 分，结果为「' + record.label + '」。可以帮我详细分析一下这个结果吗？';
    }
    closeTestMask();
    chatInput.value = text;
    sendMsg();
  }
  function showHistory(){
    testTitle.textContent = '我的测评历史';
    testFoot.style.display = 'none';
    if(!testHistory.length){
      testBody.innerHTML = '<div class="hist-empty">还没有测评记录。<br>完成一次测评后，结果会自动保存在这里。</div>' +
        '<div class="hist-bar"><button class="ui-close" id="histBack" type="button">‹ 返回测试选择</button></div>';
      document.getElementById('histBack').addEventListener('click', function(e){ e.stopPropagation(); showTestHome(); }, false);
      return;
    }
    var html = '<div class="hist-list">';
    for(var i = 0; i < testHistory.length; i++){
      var r = testHistory[i];
      var resTxt = r.kind === 'mbti'
        ? '<b>' + r.type + '</b> · ' + r.typeName
        : '<b>' + r.score + '</b> 分 · ' + r.label;
      html += '<div class="hist-item" data-id="' + r.id + '">' +
        '<div class="hi-main"><div class="hi-name">' + r.scale + '</div><div class="hi-date">' + r.date + '</div><div class="hi-res">' + resTxt + '</div></div>' +
        '<button class="hist-del" data-id="' + r.id + '" type="button">删除</button></div>';
    }
    html += '</div><div class="hist-bar"><button class="ui-close" id="histBack" type="button">‹ 返回测试选择</button></div>';
    testBody.innerHTML = html;
    var mains = testBody.querySelectorAll('.hi-main');
    for(var m = 0; m < mains.length; m++){
      (function(main){
        main.addEventListener('click', function(e){
          e.stopPropagation();
          showHistoryDetail(main.getAttribute('data-id'));
        }, false);
      })(mains[m]);
    }
    var dels = testBody.querySelectorAll('.hist-del');
    for(var d = 0; d < dels.length; d++){
      (function(del){
        del.addEventListener('click', function(e){
          e.stopPropagation();
          var id = del.getAttribute('data-id');
          for(var j = 0; j < testHistory.length; j++){
            if(testHistory[j].id === id){ testHistory.splice(j, 1); break; }
          }
          saveTestHistory();
          showHistory();
        }, false);
      })(dels[d]);
    }
    document.getElementById('histBack').addEventListener('click', function(e){ e.stopPropagation(); showTestHome(); }, false);
  }
  function showHistoryDetail(id){
    var r = null;
    for(var i = 0; i < testHistory.length; i++){ if(testHistory[i].id === id){ r = testHistory[i]; break; } }
    if(!r) return;
    renderResult(r);
  }
  function showMbtiList(){
    testTitle.textContent = '16 型人格介绍';
    testFoot.style.display = 'none';
    var codes = ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'];
    var html = '<div class="m16-grid">';
    for(var i = 0; i < codes.length; i++){
      var p = MBTI_PROFILES[codes[i]];
      html += '<div class="m16-card" data-code="' + codes[i] + '"><div class="mc-code">' + codes[i] + '</div><div class="mc-name">' + p.name + '</div><div class="mc-tag">' + p.tag + '</div></div>';
    }
    html += '</div><div class="hist-bar"><button class="ui-close" id="m16Back" type="button">‹ 返回</button></div>';
    testBody.innerHTML = html;
    var cards = testBody.querySelectorAll('.m16-card');
    for(var c = 0; c < cards.length; c++){
      (function(card){
        card.addEventListener('click', function(e){
          e.stopPropagation();
          showMbtiDetail(card.getAttribute('data-code'));
        }, false);
      })(cards[c]);
    }
    document.getElementById('m16Back').addEventListener('click', function(e){ e.stopPropagation(); showTestHome(); }, false);
  }
  function showMbtiDetail(code){
    var p = MBTI_PROFILES[code];
    if(!p) return;
    testTitle.textContent = code + ' · ' + p.name;
    testFoot.style.display = 'none';
    testBody.innerHTML =
      '<div class="m16-detail"><div class="md-head"><div class="md-code">' + code + '</div><div class="md-name">' + p.name + '</div><div class="md-tag">' + p.tag + '</div></div>' +
      '<div class="res-sec"><h5>核心特点</h5><p class="res-txt">' + p.desc + '</p></div>' +
      '<div class="res-sec"><h5>天然优势</h5><div class="res-list">' + p.good.map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="res-sec"><h5>成长建议</h5><div class="res-list">' + p.grow.map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="res-sec"><h5>相处建议</h5><div class="res-list">' + p.rela.map(function(s){ return '<div class="res-item"><span class="st">' + starSvg(22) + '</span><span>' + s + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="res-quote">结果在不同时期下会有变化，不要让结果框住了你原本自由发展的性格。</div>' +
      '<div class="res-actions" id="resActions">' +
      '<button class="ui-close" data-act="m16" type="button">‹ 返回人格列表</button>' +
      '<button class="ui-close" data-act="home" type="button">返回测试选择</button>' +
      '</div></div>';
    var acts = document.getElementById('resActions');
    var btns = acts.querySelectorAll('button');
    for(var a = 0; a < btns.length; a++){
      (function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          var act = btn.getAttribute('data-act');
          if(act === 'm16'){ showMbtiList(); }
          else if(act === 'home'){ showTestHome(); }
        }, false);
      })(btns[a]);
    }
  }

  // ---- 星语 AI 初始化（恢复记忆 / 欢迎语 / 状态） ----
  function initAiChat(){ paintAiStatus(); restoreChat(); }

  // 星语 AI：恢复对话记忆 / 初始欢迎 / 状态
  initAiChat();

show(0);

