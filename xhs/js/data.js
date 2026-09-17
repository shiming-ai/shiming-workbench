const _fmtDate=(d)=>{const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;};
/* ===== 小红书AI运营工作台 · 数据层 & AI生成引擎 ===== */
const Seed = { version: '2.0.0', savedAt: Date.now() };

/* ---------- 基础数据 ---------- */
Seed.categories = ['美妆','穿搭','数码','美食','母婴','旅行','健身','家居','职场','学习'];
Seed.topicPool = [
  {id:'t1', cat:'美妆', title:'新手必看的通勤妆 3 分钟搞定攻略', heat:98, search:125000, competition:42, rising:true},
  {id:'t2', cat:'穿搭', title:'小个子女生显高穿搭公式，照着穿不出错', heat:95, search:98000, competition:51, rising:true},
  {id:'t3', cat:'数码', title:'2026 年最值得入手的千元机横评', heat:92, search:88000, competition:38, rising:true},
  {id:'t4', cat:'美食', title:'打工人 10 分钟快手菜合集，好吃不胖', heat:90, search:76000, competition:45, rising:false},
  {id:'t5', cat:'母婴', title:'宝宝辅食避坑指南，儿科医生都点赞', heat:88, search:71000, competition:30, rising:true},
  {id:'t6', cat:'旅行', title:'一个人穷游 7 城，全程不到 3 千块', heat:86, search:65000, competition:36, rising:true},
  {id:'t7', cat:'健身', title:'瘦子增肌 90 天实录，效果差距惊人', heat:84, search:58000, competition:28, rising:false},
  {id:'t8', cat:'家居', title:'出租屋改造前后对比，成本只要 500', heat:83, search:54000, competition:33, rising:true},
  {id:'t9', cat:'职场', title:'上班摸鱼还能涨薪？我的时间管理法', heat:81, search:47000, competition:39, rising:true},
  {id:'t10', cat:'数码', title:'iPad 生产力配件清单，提升效率 3 倍', heat:79, search:45000, competition:25, rising:true},
  {id:'t11', cat:'学习', title:'下班后 2 小时自我提升，一年拉开差距', heat:78, search:43000, competition:34, rising:true},
  {id:'t12', cat:'美食', title:'空气炸锅 100 种用法，厨房小白进阶', heat:76, search:39000, competition:47, rising:false}
];

/* ---------- 爆款案例库 ---------- */
Seed.viralPool = [
  {id:'v1', title:'月薪 5k 上班族，一年攒下 2w 的极简省钱法', likes:'2.3w', collects:'1.8w', comments:'1200', cat:'生活',
   steps:[
     {name:'痛点引入', desc:'工资不高、存不下钱，直击打工人共鸣'},
     {name:'干货方案', desc:'3 个记账 + 消费分级的具体方法'},
     {name:'效果展示', desc:'晒一年存款实拍 + 每月开销对比表'},
     {name:'总结引导', desc:'互动提问"你一个月能存多少"，引导评论'}
   ], hook:'数字对比 + 身份标签制造代入感'},
  {id:'v2', title:'这 5 个厨房神器，让做饭效率翻倍（亲测）', likes:'1.9w', collects:'2.1w', comments:'860', cat:'家居',
   steps:[
     {name:'悬念标题', desc:'数字 + 关键词直接给足信息量'},
     {name:'逐件评测', desc:'每件神器附实拍 + 价格 + 使用场景'},
     {name:'真实对比', desc:'改造前 vs 改造后的厨房对比图'},
     {name:'清单总结', desc:'附全清单和购买建议，方便收藏'}
   ], hook:'"神器"类选题自带收藏动机'},
  {id:'v3', title:'裸辞 3 个月后，我的生活变成了这样…', likes:'3.1w', collects:'9800', comments:'2400', cat:'职场',
   steps:[
     {name:'情绪铺垫', desc:'从"要不要裸辞"的纠结说起'},
     {name:'真实记录', desc:'三个月每天的状态时间线'},
     {name:'反差呈现', desc:'裸辞前的焦虑 vs 现在的松弛感'},
     {name:'开放式结尾', desc:'评论区炸出大量共鸣故事'}
   ], hook:'强情绪话题 + 省略号留白'},
  {id:'v4', title:'新手化妆最容易犯的 7 个错误，你中了几个？', likes:'1.6w', collects:'1.4w', comments:'1500', cat:'美妆',
   steps:[
     {name:'提问开场', desc:'"你中了几个"直接引发自检'},
     {name:'逐个纠错', desc:'错误示范 vs 正确方法对比图'},
     {name:'干货收尾', desc:'总结口诀方便记忆收藏'},
     {name:'评论互动', desc:'号召晒出自己的踩坑经历'}
   ], hook:'纠错型内容互动率极高'},
  {id:'v5', title:'通勤 2 小时，我用碎片时间悄悄学完了 Python', likes:'2.8w', collects:'2.5w', comments:'900', cat:'学习',
   steps:[
     {name:'反差开场', desc:'"通勤 2 小时"刻画真实场景'},
     {name:'方法拆解', desc:'具体到每段路干什么的路线图'},
     {name:'成果展示', desc:'作品/证书实拍增加可信度'},
     {name:'资料分享', desc:'关注 + 收藏引导，沉淀粉丝'}
   ], hook:'场景化学习 + 成长型人设'}
];

/* ---------- AI 创作模板库 ---------- */
const T = {
  /* ===== 标题模板（小红书风格增强） ===== */
  titleTemplates: [
    {tpl:'{n}个{kw}，{benefit}', tone:'数字干货'},
    {tpl:'别{verb}了！{kw}这样{do}才对', tone:'踩坑反转'},
    {tpl:'{kw}避坑指南｜{n}年经验都在这了', tone:'经验沉淀'},
    {tpl:'为什么{kw}？{reason}', tone:'悬念提问'},
    {tpl:'{kw}天花板！{benefit}', tone:'惊叹种草'},
    {tpl:'月薪{mon}也能 get 的{kw}，真的爱了', tone:'人群共鸣'},
    {tpl:'{kw}从入门到放弃？看完这篇直接开窍', tone:'反差打脸'},
    {tpl:'求求了，别再{verb_wrong}了，试试这样{do}', tone:'劝告纠错'},
    {tpl:'{kw}对比实测｜{n}款热门一次性讲清', tone:'横向测评'},
    {tpl:'藏在{place}里的{kw}，{n}件套全攻略', tone:'场景攻略'},
    {tpl:'我劝你{kw}别跟风，先看完这篇', tone:'逆向思考'},
    {tpl:'{time}掌握{kw}，我是怎么做到的', tone:'时间背书'},
    {tpl:'{kw}真的没用？{n}个月真实体验来说话', tone:'真实体验'},
    {tpl:'姐妹们！{kw}被我挖到了，{benefit}', tone:'姐妹安利'},
    {tpl:'{kw}｜小白到大神的进阶路线图', tone:'成长路线'},
    {tpl:'一个人做{kw}，{n}个不起眼的小习惯', tone:'细节拆解'},
    {tpl:'被问爆的{kw}，今天一次说清楚', tone:'热点回应'},
    {tpl:'{kw}别再花冤枉钱了，这{n}个方法省到哭', tone:'省钱攻略'},
    {tpl:'下班后偷偷做{kw}，同事都以为我开挂了', tone:'反差人设'},
    {tpl:'收藏就是赚到！{kw}全攻略合集', tone:'收藏驱动'}
  ],
  titleWords: {
    benefit:['太香了','亲测有效','直接封神','入股不亏','相见恨晚','好用哭','闭眼入','性价比拉满','直接抄作业'],
    verb:['乱买','跟风','硬撑','焦虑','拖延','盲目刷','瞎折腾'],
    do:['选','做','上手','安排','规划','搞定','执行'],
    reason:['90% 的人第一步就错了','看完你就明白了','这个坑我替你踩了','真相和你想的不一样'],
    verb_wrong:['乱涂','瞎买','硬凹','囤货','熬','瞎跟风'],
    mon:['3k','5k','8k','2k'],
    n:[3,5,7,10,15,20],
    time:['7 天','30 天','90 天','半年','1 年'],
    place:['宿舍','出租屋','办公室','超市','衣柜','拼多多']
  },

  /* ===== 正文结构模板（增强：更多变体 + 分段） ===== */
  bodyTemplates: [
    {
      name:'种草测评型', structure:['开场钩子','真实使用场景','核心卖点','价格/性价比','总结推荐'],
      hooks:['姐妹们，这个我真的忍不住要分享！','先说结论：这个东西我回购第 {n} 次了。','不是我夸张，用之前真没想到差距这么大。','终于被我挖到了，必须安利给所有人！','如果你最近正好在挑{kw}，这篇一定要看完。'],
      middles:['用了{time}才敢来反馈，{kw}是真的有惊喜。','平时我买东西都挺挑的，但这个确实能打。','对比了同类型好几款，最后留下来的是它。','{kw}对我这种{user}来说，简直是为我量身定做的。','第一次用的时候就被细节打动了，好感直接拉满。'],
      points:['颜值在线：放在那里看着就舒服，拍照也出片。','实用性拉满：每天用，完全没有吃灰的迹象。','细节用心：连包装这种小地方都很讲究。','性价比高：这个价位能买到这个品质，真的良心。'],
      endings:['总之，{kw}属于闭眼入不亏的那种，需要的姐妹可以冲！','理性种草，按需入手。觉得有用记得点个赞收藏～','如果你也在纠结{kw}，希望这篇能帮你少走弯路。','有问题评论区问我，看到都会回！','先写这么多，等我用满一个月再来更新使用报告。']
    },
    {
      name:'干货教程型', structure:['痛点开场','步骤拆解','常见误区','成果展示','收藏引导'],
      hooks:['很多人问{kw}怎么开始，今天一次性讲清楚。','做{kw} {n} 年，最想告诉你这几点。','这一篇帮你省下 3 个月的摸索时间。','{kw}真的没那么难，关键在这 3 步。','答应我，看完这篇再去试{kw}，能少走一半弯路。'],
      middles:['第一步：先搞清楚{kw}的核心是什么，方向对了努力才有意义。','第二步：别贪多，每天只做一件小事，坚持才有复利。','第三步：定期复盘，把做的过程记录下来。','很多人卡在第 {n} 步，其实换个思路就通了。','记住一个原则：先完成，再完美。'],
      points:['常见误区 1：一上来就追求完美，结果迟迟不开始。','常见误区 2：收藏一堆资料，却从没打开看过。','常见误区 3：只看不做，实操才是唯一的捷径。','常见误区 4：三天打鱼两天晒网，坚持比天赋重要。'],
      endings:['把这 {n} 步收藏起来，下次直接照着做。','如果你有更好的方法，欢迎评论区补充！','关注我，后续会继续更新{kw}进阶内容。','觉得有用就点个赞，让更多人看到～','行动起来，一个月后你会感谢现在的自己。']
    },
    {
      name:'情绪共鸣型', structure:['场景代入','情绪铺陈','转折思考','观点输出','互动提问'],
      hooks:['说实话，{kw}这件事我想了很久才决定说。','那天晚上，我突然想通了{kw}。','如果你也在为{kw}焦虑，请把这篇看完。','{n} 岁之后才明白的道理，希望你能早点懂。','这段话写给每一个正在为{kw}纠结的人。'],
      middles:['以前我也总在意外界的眼光，后来发现{kw}才是最重要的。','不是所有的努力都有结果，但不努力一定没有。','{kw}这件事没有标准答案，适合自己就是最好的。','把时间花在{kw}上，远比内耗有意义。','其实很多时候，困住我们的不是事情本身，而是想象。'],
      points:['想通之后，我突然轻松了很多。','回头看看，那些曾经觉得过不去的坎，都成了故事。','现在每天醒来，都有一种笃定感。','你担心的那些事，大概率不会发生。'],
      endings:['现在的我，终于和{kw}和解了。','你呢？你也有过类似的时刻吗？评论区聊聊。','点个赞，愿我们都能活成自己想要的样子。','把这句话送给你：{kw}，从来都不晚。','谢谢你看到这里，抱抱每一个认真生活的你。']
    },
    {
      name:'测评避雷型', structure:['悬念引入','红榜推荐','黑榜避雷','总结建议','评论区互动'],
      hooks:['{kw}风这么大，到底哪些值得买？我替你们踩完了。','{n}款{kw}实测，最后只留下了这 2 个。','全网都在推的{kw}，我来说点大实话。','买前必看！{kw}的坑我全部踩过了。','钱包保卫战！{kw}红黑榜走心测评。'],
      middles:['红榜第 1 名：闭眼入的类型，用了就回不去。','黑榜第 1 名：风很大但实际很一般，别浪费钱。','价格从低到高我都试过，性价比之王是它。','它的优点很明显，但缺点也要说清楚。','评分和我的真实感受，可能和网上说的不太一样。'],
      points:['红榜：品质稳定，售后靠谱，回购 n 次。','黑榜：营销做得好，但实物落差太大。','中规中矩款：能用，但没到非买不可的程度。','特别提醒：别冲动下单，先看看评论区真实反馈。'],
      endings:['以上仅代表个人使用感受，供大家参考。','有用就收藏，买之前翻出来看看。','你们踩过哪些坑？评论区互相避雷！','理性消费，把钱花在刀刃上。','希望这篇能帮你省下冤枉钱。']
    }
  ],
  users:['上班族','学生党','新手','宝妈','租房党','打工人','干皮星人','熬夜党','敏感肌','重度手机党'],
  emojis:['✨','🔥','💡','👍','📌','💯','⭐','🍀','🎯','👏']
};

/* ---------- 种子业务数据 ---------- */
Seed.favorites = [];
Seed.assets = [
  {id:'a1', type:'image', name:'通勤妆封面-草稿', size:'2.4MB', date:'08-20'},
  {id:'a2', type:'image', name:'空炸美食实拍-01', size:'3.1MB', date:'08-21'},
  {id:'a3', type:'text', name:'数码横评文案-v1', size:'680字', date:'08-22'},
  {id:'a4', type:'text', name:'辅食避坑笔记标题集', size:'240字', date:'08-23'},
  {id:'a5', type:'image', name:'显高穿搭公式图', size:'1.8MB', date:'08-24'},
  {id:'a6', type:'video', name:'快手菜过程记录', size:'45MB', date:'08-24'}
];
Seed.contents = [
  {id:'c1', title:'通勤妆 3 分钟搞定攻略', status:'published', date:'08-23', cat:'美妆', views:12800, likes:420, collects:315, comments:86},
  {id:'c2', title:'千元机横评｜2026 年最值得买', status:'ready', date:'08-25', cat:'数码', views:0, likes:0, collects:0, comments:0},
  {id:'c3', title:'打工人 10 分钟快手菜', status:'draft', date:'08-24', cat:'美食', views:0, likes:0, collects:0, comments:0},
  {id:'c4', title:'显高穿搭公式分享', status:'published', date:'08-21', cat:'穿搭', views:8600, likes:290, collects:410, comments:52}
];
Seed.schedule = [];
Seed.history = [];

/* ---------- 账号诊断 ---------- */
Seed.diagnosis = {
  score: 82, level: 'A',
  dims: [
    {name:'内容力', score:88},
    {name:'涨粉力', score:76},
    {name:'互动力', score:84},
    {name:'垂直度', score:79},
    {name:'活跃度', score:85}
  ],
  advice: [
    {icon:'📈', text:'涨粉力偏低（76）：近 7 天仅 4 篇达到平均互动，建议每周发布 5 篇以上'},
    {icon:'🎯', text:'垂直度有提升空间（79）：「美妆」占 62%，建议统一到 80% 以上'},
    {icon:'💬', text:'评论回复率 61%：粉丝 2 小时内评论的笔记，回复后二次互动提升 45%'},
    {icon:'⏰', text:'周五晚 8 点数据最佳：本周可固定该时段发布核心内容'}
  ]
};

/* ---------- 对标账号 ---------- */
Seed.benchmarks = [
  {id:'b1', name:'美妆小M', avatar:'👩', fans: 8200, notes: 210, interaction: 8.2},
  {id:'b2', name:'阿一美妆', avatar:'🧑', fans: 5600, notes: 95, interaction: 11.5},
  {id:'b3', name:'lulu爱分享', avatar:'👧', fans: 12800, notes: 320, interaction: 7.1}
];

/* ---------- 灵感笔记 ---------- */
Seed.ideas = [
  {id:'i1', title:'周末 City Walk 记录', content:'周末去老街区逛了一圈，发现 3 个超适合拍照的角落，出片率极高，可以出一篇「小众拍照机位」笔记', tag:'旅行'},
  {id:'i2', title:'化妆刷清洁大法', content:'化妆刷清洗太麻烦了，试了用卸妆水 + 硅胶垫 3 分钟搞定，可以分享清洁前后对比', tag:'美妆'},
  {id:'i3', title:'出租屋 500 元改造', content:'用 500 元预算把出租屋改造了一遍，买了地毯、挂画、暖光灯，朋友来都以为我换了房子', tag:'家居'}
];

/* ---------- 运营工具箱 ---------- */



/* ---------- 敏感词 / 限流词库（V5.2） ---------- */
Seed.sensitiveWords = [
  // 绝对化用语（限流高风险）
  {w:'最', tip:'"最"是绝对化词，建议去掉或改"超/很/极"', level:2},
  {w:'第一', tip:'"第一"属绝对化用语，建议改为"我的私藏/测评里靠前"', level:2},
  {w:'全网', tip:'"全网"夸大宣传，建议去掉', level:2},
  {w:'国家级', tip:'国家级属违规宣传词', level:2},
  {w:'100%', tip:'百分百承诺易触发审核，建议改为"实测/亲测"', level:2},
  {w:'绝对', tip:'绝对化用语，建议替换', level:2},
  {w:'唯一', tip:'绝对化用语，建议替换', level:1},
  {w:'首选', tip:'绝对化用语，建议替换', level:1},
  {w:'顶级', tip:'夸大宣传，建议替换', level:1},
  {w:'之王', tip:'"xx之王"夸大宣传', level:2},
  // 医疗功效类（限流高风险）
  {w:'治疗', tip:'医疗功效词，普通商品不可宣传', level:2},
  {w:'治愈', tip:'医疗功效词', level:2},
  {w:'消炎', tip:'医疗功效词，改为"舒缓"', level:2},
  {w:'杀菌', tip:'医疗功效词，改为"清洁"', level:2},
  {w:'祛痘', tip:'医疗功效词，建议改为"修护/改善"', level:1},
  {w:'美白', tip:'功效词需谨慎，建议改为"提亮/透亮"', level:1},
  {w:'瘦脸', tip:'夸张功效词', level:1},
  {w:'增高', tip:'夸张功效词', level:2},
  {w:'丰胸', tip:'违规功效词', level:2},
  {w:'抗敏', tip:'医疗功效词', level:2},
  // 引流/外链类（封号风险最高）
  {w:'加微信', tip:'引流外链词，有封号风险', level:2},
  {w:'vx', tip:'变体引流词', level:2},
  {w:'威信', tip:'变体引流词', level:2},
  {w:'淘宝搜', tip:'外链引流，建议去掉店铺信息', level:2},
  {w:'拼多多', tip:'外链引流词', level:2},
  {w:'二维码', tip:'外链引导，有违规风险', level:1},
  {w:'私我', tip:'引导私信交易，慎用', level:1},
  // 承诺/诱导类
  {w:'保证', tip:'承诺词，建议改为"体验/感受"', level:2},
  {w:'稳赚', tip:'收益承诺，违规', level:2},
  {w:'躺赚', tip:'收益承诺，违规', level:2},
  {w:'暴富', tip:'收益承诺，违规', level:2},
  {w:'日入过千', tip:'收益承诺，违规', level:2},
  {w:'免费领取', tip:'诱导互动，慎用', level:1},
  {w:'转发抽奖', tip:'平台规则外抽奖，慎用', level:1},
  {w:'点击领奖', tip:'诱导点击', level:2}
];

/* ---------- 目标与成长（V5.1） ---------- */
Seed.goals = { monthlyFans: 300, monthlyIncome: 1000, fansStart: 0, incomeStart: 0 };
Seed.streak = { count: 0, lastDate: '', best: 0 };

/* ---------- 变现管理（尊享版） ---------- */
Seed.money = {
  records: [
    {id:'m1', title:'通勤妆 3 分钟攻略', product:'粉底液 · 橱窗', income: 386, date:'08-22'},
    {id:'m2', title:'平价穿搭合集', product:'连衣裙 · 橱窗', income: 268, date:'08-20'},
    {id:'m3', title:'空炸快手菜', product:'空气炸锅 · 带货', income: 152, date:'08-19'},
    {id:'m4', title:'显高穿搭公式', product:'店铺合作 · 广告', income: 400, date:'08-15'}
  ],
  quote: [
    {fans:'1k - 5k', price:'¥100 - 300', note:'起步期，接小品牌置换+带货'},
    {fans:'5k - 1w', price:'¥300 - 800', note:'稳定期，可接报价单+带货佣金'},
    {fans:'1w - 5w', price:'¥800 - 2000', note:'成长期，品牌合作增多'},
    {fans:'5w - 10w', price:'¥2000 - 5000', note:'腰部，可谈月度合作'},
    {fans:'10w+', price:'¥5000+', note:'头部，品牌主动找上门'}
  ],
  tips: [
    '橱窗带货佣金率普遍 10%-30%，美妆服饰类更高',
    '垂直账号报价 = 通用账号的 1.5-2 倍',
    '收藏率高 = 带货意愿强，建议发"清单+好物"型笔记',
    '粉丝 5k 以上即可开通蒲公英平台接单'
  ]
};

/* ---------- 今日热门（每日自动更新） ---------- */
Seed.trending = {
  pool: [
    {title:'冷白皮逆袭指南：这 3 步让你白 2 个色号', cat:'美妆', hot:98, rising:true, brand:true},
    {title:'油皮亲妈粉底液实测，带妆 12 小时不脱妆', cat:'美妆', hot:95, rising:true, brand:true},
    {title:'新手必看 5 个化妆误区，90% 的人都中招', cat:'美妆', hot:92, rising:false, brand:false},
    {title:'小个子 158cm 显高 10cm 穿搭公式', cat:'穿搭', hot:97, rising:true, brand:false},
    {title:'通勤穿搭 5 套不出错', cat:'穿搭', hot:91, rising:false, brand:true},
    {title:'梨形身材穿搭避雷指南', cat:'穿搭', hot:88, rising:true, brand:false},
    {title:'2026 千元机横评：哪款最值得入手', cat:'数码', hot:96, rising:true, brand:true},
    {title:'iPad 配件清单：提升效率 3 倍', cat:'数码', hot:87, rising:false, brand:false},
    {title:'AirPods 平替 TOP 5', cat:'数码', hot:85, rising:true, brand:true},
    {title:'打工人 10 分钟快手菜合集', cat:'美食', hot:94, rising:true, brand:true},
    {title:'空气炸锅 100 种神仙吃法', cat:'美食', hot:91, rising:true, brand:true},
    {title:'减脂期外卖怎么点不踩雷', cat:'美食', hot:86, rising:false, brand:false},
    {title:'宝宝辅食避坑指南', cat:'母婴', hot:90, rising:true, brand:false},
    {title:'新生儿必入好物清单', cat:'母婴', hot:84, rising:false, brand:true},
    {title:'小众旅行地：人均 1.5k 玩 5 天', cat:'旅行', hot:93, rising:true, brand:true},
    {title:'一个人旅行攻略：安全又好玩', cat:'旅行', hot:87, rising:false, brand:false},
    {title:'瘦子增肌 90 天实录', cat:'健身', hot:88, rising:true, brand:false},
    {title:'办公室拉伸：5 分钟缓解腰痛', cat:'健身', hot:82, rising:false, brand:false},
    {title:'出租屋 500 元改造前后对比', cat:'家居', hot:89, rising:true, brand:true},
    {title:'厨房收纳神器推荐', cat:'家居', hot:85, rising:false, brand:false},
    {title:'毕业 3 年升主管：我做对了什么', cat:'职场', hot:86, rising:true, brand:false},
    {title:'通勤 2 小时碎片学习法', cat:'学习', hot:91, rising:true, brand:false},
    {title:'新人博主必看：3 个月涨粉 1 万实操', cat:'运营', hot:96, rising:true, brand:true},
    {title:'小红书爆款标题公式 5 条', cat:'运营', hot:89, rising:true, brand:false}
  ]
};

function genTrending(){
  const today = todayStr();
  let seed = 0;
  for(let i=0;i<today.length;i++) seed = (seed*31 + today.charCodeAt(i)) % 1000000007;
  const arr = [...Seed.trending.pool];
  for(let i=arr.length-1; i>0; i--){
    seed = (seed*1103515245 + 12345) % 2147483648;
    const j = seed % (i+1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 10);
}
Seed.toolbox = {
  bestTimes: [
    {time:'08:00 - 09:00', desc:'通勤黄金时段，适合发干货类', hot:true},
    {time:'12:00 - 13:00', desc:'午休刷手机高峰，适合发测评', hot:true},
    {time:'19:00 - 21:00', desc:'下班放松时段，适合发种草', hot:true},
    {time:'21:00 - 23:00', desc:'睡前深度浏览，适合发情感/干货', hot:false}
  ],
  tagLib: {
    '美妆': ['#美妆 #妆容分享 #护肤 #口红试色 #眼妆教程'],
    '穿搭': ['#穿搭 #OOTD #小个子穿搭 #平价穿搭 #通勤穿搭'],
    '数码': ['#数码 #好物推荐 #开箱 #智能设备 #手机测评'],
    '美食': ['#美食 #家常菜 #探店 #一人食 #美食教程'],
    '运营': ['#小红书运营 #自媒体 #涨粉技巧 #内容创作 #新人博主']
  },
  scripts: [
    {name:'感谢评论', text:'谢谢支持！有任何问题随时问我，看到都会回～'},
    {name:'引导关注', text:'喜欢这类内容的话点个关注，每周持续更新更多干货～'},
    {name:'评论区答疑', text:'好问题！我整理一下专门出一篇详细笔记，先收藏这篇～'},
    {name:'私信咨询', text:'您好呀～关于您问的这个问题，可以看看我主页置顶笔记，里面有详细解答哦'}
  ],
  checklist: [
    {name:'确定今日选题（选题雷达）', done:true},
    {name:'创作 / 优化今日内容（AI 创作）', done:true},
    {name:'检查封面图和标题吸引力', done:false},
    {name:'按最佳时间发布（19:00-21:00）', done:false},
    {name:'发布后 1 小时回复评论', done:false},
    {name:'记录今日数据（数据复盘）', done:false}
  ]
};

Seed.subscription = {
  planName: '年度会员',
  startAt: '2025-08-20',
  expireAt: '2026-08-20',
  remainDays: 365
};

/* ---------- V6.32 电商带货中心 ---------- */
Seed.shop = {
  // 商品库：候选 → 在售 → 下架，全流程管理
  products: [],
  // 带货记录（订单/佣金/GMV）
  orders: [],
  // 默认佣金率（新建商品预填）
  defaultRate: 20
};
/* 电商大促节点（内置，用于内容提前量提醒） */
Seed.shopNodes = [
  {name:'年货节', date:'2026-01-20', lead:14, tip:'囤货型内容，礼盒/年礼/送礼场景'},
  {name:'38 女王节', date:'2026-03-08', lead:12, tip:'悦己消费，美妆个护爆发期'},
  {name:'五一出游季', date:'2026-05-01', lead:10, tip:'旅行装备/防晒/便携好物'},
  {name:'618 年中大促', date:'2026-06-18', lead:21, tip:'全品类最大节点，提前铺测评+清单'},
  {name:'开学季', date:'2026-09-01', lead:14, tip:'学生党/宿舍/文具数码'},
  {name:'双 11', date:'2026-11-11', lead:30, tip:'全年最高峰，10 月中就要开始种草'},
  {name:'双 12', date:'2026-12-12', lead:14, tip:'清仓+年末囤货，承接双 11 尾流'},
  {name:'年末送礼季', date:'2026-12-25', lead:12, tip:'礼盒/情侣/家庭场景'}
];
Seed.fans = {
  total: 1860,
  new7d: 142,
  new30d: 638,
  new90d: 1856,
  sources: [
    {name:'搜索', pct:38, count:712},
    {name:'推荐', pct:32, count:598},
    {name:'关注', pct:14, count:262},
    {name:'个人主页', pct:10, count:188},
    {name:'外部', pct:6, count:100}
  ]
};
Seed.analytics = {
  days7: [ {d:'周一',date:_fmtDate(new Date(Date.now()-864e5*6)),views:5200,likes:180,collects:220,comments:36,fans:18},
           {d:'周二',date:_fmtDate(new Date(Date.now()-864e5*5)),views:6800,likes:240,collects:310,comments:48,fans:22},
           {d:'周三',date:_fmtDate(new Date(Date.now()-864e5*4)),views:4300,likes:150,collects:190,comments:28,fans:14},
           {d:'周四',date:_fmtDate(new Date(Date.now()-864e5*3)),views:7900,likes:310,collects:380,comments:55,fans:28},
           {d:'周五',date:_fmtDate(new Date(Date.now()-864e5*2)),views:10200,likes:420,collects:510,comments:72,fans:35},
           {d:'周六',date:_fmtDate(new Date(Date.now()-864e5*1)),views:8600,likes:350,collects:430,comments:64,fans:25},
           {d:'周日',date:_fmtDate(new Date()),views:6200,likes:260,collects:300,comments:41,fans:20} ],
  days30: null, days90: null,
  notes: [
    {id:'n1', title:'9 个小众但超实用的 AI 工具', emoji:'🤖', views:28600, likes:1236, collects:987, comments:156, score:88, cat:'数码'},
    {id:'n2', title:'如何快速找到小红书爆款选题？', emoji:'🔍', views:6800, likes:326, collects:289, comments:68, score:79, cat:'运营'},
    {id:'n3', title:'5 个提升账号权重的小技巧', emoji:'📈', views:5400, likes:215, collects:198, comments:42, score:73, cat:'运营'}
  ],
  overview:{ fans:1860, views7d:49200, likes7d:1910, collects7d:2340, comments7d:344, interaction:9.3 }
};
