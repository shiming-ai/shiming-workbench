/* ===== Crazy Friday. 小红书AI运营工作台 · V5 ===== */
'use strict';

/* ================= Crazy Friday. 数据安全架构 V5 =================
 * 商业级数据原则：
 *  - 代码 / 数据 / 配置 / 版本 四者解耦
 *  - 任何升级不丢失用户数据（数据 key 按 uid 稳定隔离，schema 升级只补字段）
 *  - schema 升级走 migrateUserData()，失败自动回滚备份
 *  - 预留 userId / workspaceId，为未来云端数据库做准备
 */
const VERSION = { app:'6.54.0', schema:2, userData:1, channel:'stable', build:20260917 };

/* 版本更新历史（设置中心「关于产品」展示，像微信一样可回看每次更新内容） */
const CHANGELOG = [
  {v:'6.54.0', date:'2026-09-17', items:[
    '🔄 锦囊「换一条」：今日锦囊不感兴趣，点右上角换一条，12 条实战锦囊随时翻（标题/封面/互动/数据/变现/避坑）',
    '🔁 三件事「换一件」：今天这件不想做？点「换」立刻换一件替补，习惯不中断（每天依旧只 3 件）',
    '🛡️ 界面稳健加固：AI 文案只保留加粗标签，杜绝脏代码影响显示；未知页面不再白屏'
  ]},
  {v:'6.53.0', date:'2026-09-17', items:[
    '🌱 「活的工作台」引擎上线：首页每天都不一样，客户打开就有新鲜感',
    '📅 时间锚点：节气 / 大促倒计时 / 年度进度，每天自动换（内容提前 3-7 天准备）',
    '💡 每日锦囊：AI 按当天日期生成专属建议（无 Key 也有 60 条实用池轮换，60 天不重样）',
    '✅ 今日三件事：按你的真实数据动态生成（逾期/草稿/待录数据/带货），完成即打勾，隔天自动重置',
    '🎊 里程碑成就：连续运营 3/7/30 天、发布 10/50 篇、粉丝破千，首次达成弹庆祝卡片（只弹一次）',
    '🔢 首页数据数字滚动动效，界面不再是死板的静态数字'
  ]},
  {v:'6.52.0', date:'2026-09-09', items:[
    '⚡ 真自动更新修复：打开页面立即同步今日热点/日报/变现机会（原来要等 30 秒，第一眼看到的是旧数据）',
    '🔄 服务端定时刷新 6 小时→5 分钟，变现机会纳入定时任务（此前整夜不更新，出现「843 分钟前更新」）',
    '⏳ 诚实文案：数据同步中显示「正在同步…」，不再显示「每日 08:00 自动更新」空承诺与打脸的旧时间',
  ]},
  {v:'6.51.0', date:'2026-09-05', items:[
    '🎨 排期页去红：今日待发卡片去红渐变背景/边框/数字色（仅逾期用红）；步骤点从「红圈+发光」改为「品牌色小点」；推进按钮从「实心红」改为「线框」——只保留必要强调',
    '👤 「待定选题」状态降权：占位标题弱化显示（灰色+细字），新增「选题/写稿/待发/已发」阶段小标签',
  ]},
  {v:'6.50.0', date:'2026-09-05', items:[
    '🔧 紧急修复首页空白：升级脚本误伤首页渲染，老用户打开工作台不再白屏', 
    '🔥 修复「连续天数被重置为 1」：老用户的打卡连续天数不再每次打开被清零（历史数据自动保护）',
    '👤 老用户不再看到新手引导：已有真实内容/排期/复盘数据的账号，自动隐藏「新手 7 天」「3 步快速上手」，不再冒充新用户',
    '📱 左侧栏回归：移动端恢复汉堡按钮（侧栏抽屉 + 底部 Tab 双导航并存），桌面端不变',
    '🔄 防缓存混版：版本升级后自动静默刷新一次，杜绝新旧资源混用导致界面错乱'
  ]},
  {v:'6.49.0', date:'2026-09-04', items:[
    '🩹 修复赛道识别只认美妆/穿搭的劝退 bug：覆盖 22 个主流类目（新增健康/三农/摄影/教育/汽车/二次元/创业/AI 工具/个人 IP/通用），识别不到时回「通用」而非硬套穿搭',
    '🎯 博主分析新增「② 赛道选择」：客户能手动切换赛道，本地雷达按所选赛道实时重算（之前识别错就一路错下去）',
    '🔎 美食/美妆/数码关键词升级：美食新增「酱/调料/川菜/湘菜」、美妆新增「妆容/美人/颜值」、数码去掉通用词「测评」防误抢 AI 工具类',
    '🎁 体验版开放 AI 真实体验：每浏览器 5 次免费生成（演示横幅实时显示剩余次数），让客户第一次就能真玩「一键全流程 / 爆款拆解」',
    '🧩 引入 4 个 GitHub 开源组件（Apache/MIT 授权、自托管离线可用）：Fuse.js 模糊搜索 / html2canvas 数据战绩分享卡 / qrcodejs 扫码直达 / ECharts专业图表',
    '🔍 Fuse.js 模糊搜索：错字/漏字/部分匹配都能命中（无网/加载失败自动降级精确匹配）',
    '📤 html2canvas 数据战绩卡：复盘页一键生成竖版高清战绩图（粉丝/曝光/互动/收益/最佳内容），保存后发朋友圈晒成绩',
    '📲 qrcodejs 扫码直达：设置中心「分享工作台」生成二维码，手机扫码即打开',
    '📈 ECharts专业图表：数据趋势升级为可悬浮看值/可拖拽缩放的交互图表（长周期自动缩放），保留旧版兜底',
    '⚡ AI 流式输出：所有专业工具逐字可见，体感 30 秒 → 3 秒就有内容',
    '📱 移动端底部 Tab 栏：5 个原生 Tab + 居中红色 FAB，iPhone 安全区适配，桌面端自动隐藏',
    '🎨 主题色修复：所有按钮/卡片统一跟随主题变量；体验版默认「曜石黑」高级感，正式版默认品牌红，可现场切换',
    '⏱️ AI 思考计时 + 脉冲呼吸灯 + 触控跟手/键盘可达性精修'
  ]},
  {v:'6.46.0', date:'2026-09-03', items:[
    '🧬 爆款深度拆解专业版：6 维评分雷达（选题/标题/开头/结构/情绪/互动）+ 结构骨架 + 可复用公式卡 + 原创风险提示，一眼看懂爆款为什么爆',
    '📚 新增「爆款拆解库」：每篇拆解自动沉淀为可复用模板，随时回看 / 同题再拆 / 一键自动排期 / 差异化选题一键入库',
    '⚡ 本地快速拆解：没有 AI 也能跑——粘贴爆款正文，本地规则引擎 1 秒出 6 维评分与结构分析（断网可用）',
    '🔀 同题原创闭环：拆解 → 生成 3 个差异化角度入库选题池 → 450-600 字同题原创 → 发布包一键复制 / 存入草稿',
    '🛠️ 修复多处功能断链：博主风格选题「去用」现在能真正跳转一键全流程；剪贴板复制增加降级方案；变现方案生成器加固'
  ]},
  {v:'6.45.0', date:'2026-09-03', items:[
    '✂️ 创作中心大瘦身：场景从 10 个平铺改为 6 个核心 + 折叠 4 个（视频/直播/封面/情绪），底部 13 工具平铺彻底移除',
    '🧰 「写完顺手用」工具条：4 个高频工具（发布前检查 / 去AI味 / 关键词布局 / 博主风格）放生成按钮下方，简洁不啰嗦',
    '⚡ 滚动性能优化：页面 DOM 节点数减少 ~40%，长列表卡顿明显改善'
  ]},
  {v:'6.44.0', date:'2026-09-03', items:[
    '🛡️ 激活页正规化：正版授权徽章（云端校验 / 一码一机）+ 三项承诺（激活即解锁 / 数据归你 / 到期提醒），正规软件质感',
    '📲 「添加到主屏幕」升级：底部品牌引导卡（真 logo + 分步说明），关闭后 7 天再温和提醒，像 App 一样全屏使用'
  ]},
  {v:'6.43.0', date:'2026-09-03', items:[
    '🔕 更新提醒去重：同一天内多次发布新版本，只提醒一次（以当天最新版本为准），不再每次打开都弹「有更新」'
  ]},
  {v:'6.42.0', date:'2026-09-03', items:[
    '⚡ 数据复盘「今日速记」：每天 3 秒记录全账号今日曝光/涨粉/互动，7/30/90 天曲线与首页看板立即更新，不用再一篇篇录',
    '📊 复盘页入口重排：今日速记置顶为主按钮，单篇录入收为次入口',
    '⏳ 到期自动提醒：会员到期前 60 天起，打开工作台即见醒目横幅 + 一键联系续费（数据永久保留）'
  ]},
  {v:'6.41.0', date:'2026-09-03', items:[
    '🧰 工具箱场景化：不再 20 个入口平铺，按「选题策划 / 内容创作 / 发布质检 / 商业增长」四场景找工具',
    '🎯 AI 创作中心工具分组收敛：创作提效 / 发布质检 / 商业增长 三类，明确每步该用什么',
    '📈 对标账号「快照对比」：每周填一次对手数据，自动算真实增速（+粉丝 / +笔记 / 几天内），不再是一潭死水'
  ]},
  {v:'6.40.0', date:'2026-09-03', items:[
    '🔧 修复卖家后台「发了码看不到客户」：客户列表云端同步密钥传递不一致，现已两端对齐',
    '📋 卖家后台客户列表：换设备/换浏览器打开都能拉到全部客户，不再依赖本机缓存',
    '🗂️ 客户台账自动生成：每个激活码自动带专属链接 + 到期日，后台一目了然'
  ]},
  {v:'6.39.0', date:'2026-09-03', items:[
    '📋 内容生产流水线：每条排期 = 一条流水线任务（💡选题 → ✍️写稿 → 🚀待发 → ✅已发），今日待发卡显示步骤进度点',
    '▶ 一键推进：点「推进到下一步」自动改状态，并提示该步该做什么（写稿/做封面/复制发布包/录数据）',
    '🎯 发布完成自动进入复盘：标记已发后直接弹「录入数据」，曝光/互动曲线自动更新'
  ]},
  {v:'6.38.0', date:'2026-09-03', items:[
    '🎭 博主批量风格分析 + 融合改写：粘主页链接 → AI 拆 7 维风格（人设/语气/选题/结构/视觉/互动/节奏） → 滑块调比例 + 原创风险 → 一键生成同风格选题（自动入选题池）+ 融合改写草稿',
    '🛟 无 AI Key 也能用：行业启发式兜底，赛道常见选题/钩子/结构模板照样跑',
    '📚 已分析博主可复访：所有报告自动存到对标账号库，随时回看 / 复用 / 继续融合',
    '⚡ 三个入口：工具箱 / 命令面板 / 功能地图「博主风格研究」分组',
    '🎨 7 维风格雷达图：纯 SVG 绘制，一眼看出该博主强项与短板'
  ]},
  {v:'6.37.0', date:'2026-09-02', items:[
    '🔐 身份不再被链接改写：打开带 ?uid= 的分享/专属链接，你的本机身份和数据不会再被切换或串到别人 —— 之前这是「又要重新输激活码」和「数据像别人的」的根源',
    '🩹 身份自动自愈：即使本机身份已被旧版污染，打开工作台会自动校正回你自己的授权与数据，无需输码',
    '🚫 换链接不再掉线：老客户点任何链接（含体验链接）打开，都是回到自己的数据，不再要求重新输入激活码',
    '⚡ 实时更新修复：今日热门 / 变现日报 / 变现机会不再被离线缓存卡住，每次打开都拉到最新',
    '🔒 动态接口禁缓存：授权、热点、日报等接口全部实时走网络，杜绝「看着像旧的」'
  ]},
  {v:'6.36.0', date:'2026-08-30', items:[
    '🌙 落地页全面深色改版：与工作台内部视觉统一，暗底 + 品牌红 + 大圆角卡片，不再白底商务风',
    '🗺️ 能力地图重做：原来四列标签列表 → 四张「选题 / 创作 / 数据 / 变现」能力卡，每张列出具体能做什么',
    '📱 新增「手机就是 App」区块：手绘真机界面 + 添加到主屏幕、离线可用等说明',
    '✨ 视觉层次升级：卡片悬停辉光、顶部彩色高光条、噪点质感背景，暗色下更有层次',
    '🎯 转化路径收紧：导航 / Hero / 能力区 / 底部四个入口都能一键进体验版'
  ]},
  {v:'6.35.0', date:'2026-08-30', items:[
    '🔗 体验版专属链接：?demo=1 打开即进体验模式，不用先点按钮 —— 直接发给潜在客户，对方点开就能完整试用',
    '🎬 演示账号全面升级：12 条内容（含 1 篇 12.8w 阅读爆款）+ 8 条排期 + 6 个商品 12 笔订单 + 30 天增长曲线，打开就是「正在运营」的真实感',
    '🔺 数据曲线会增长：30/90 天复盘折线呈上升趋势，一眼看出这个号在涨',
    '🧪 体验模式开放全部工具界面与本地能力（发布前检查台、收益预估、关键词布局等都能真用）',
    '💰 AI 生成额度保护：体验账号不消耗卖家 AI 额度，点生成时明确提示激活后可无限使用',
    '📣 体验横幅转化升级：底部常驻提示 + 「激活我的」一键直达，看得见演示、留得住转化'
  ]},
  {v:'6.34.0', date:'2026-08-29', items:[
    '🩺 发布前检查台：标题 / 正文边写边打分，本地规则秒出（不耗 AI 额度、断网可用），逐项告诉你为什么扣分、怎么改',
    '📌 标题诊断 8 个维度：长度 / 数字锚点 / 情绪张力 / 人群指向 / 悬念钩子 / 关键词结构 / 表情符号 / 极限词风险',
    '📝 正文诊断 7 个维度：字数 / 分段 / 视觉节奏 / 话题标签 / 开头钩子 / 用词丰富度 / 互动引导',
    '✨ AI 一键优化到 85+：针对薄弱项定向改写，回填后立刻重新打分',
    '🔄 多入口直达：内容库详情、运营工具箱、首页命令面板、功能地图都可一键唤起检查台'
  ]},
  {v:'6.33.0', date:'2026-08-29', items:[
    '🔒 授权不再被误杀：服务端故障 / 网关抖动 / 网络波动时，已付费客户一律保持正常可用，绝不再被踢回激活门重新输码',
    '🛡️ 离线宽限 30 天：断网、服务端维护期间照常用，不再因一次校验失败就锁死',
    '🔄 设备静默找回：清缓存 / 换浏览器后自动恢复授权，老客户无需重新输入激活码',
    '🧪 体验模式数据彻底隔离：体验版使用独立数据空间，不再与真实数据共用一份存储（先体验后激活也不会带进演示数据）',
    '🚪 体验模式可随时退出：底部横幅常驻提示「这是演示数据」，一键退回自己的真实工作台',
    '💾 防丢数据：关页面 / 切后台自动强制落盘，不再因保存防抖丢掉刚写的内容'
  ]},
  {v:'6.32.0', date:'2026-08-29', items:[
    '🛒 全新板块：电商带货中心（选品 → 带货笔记 → 排期 → 记单算佣金，一条龙闭环）',
    '📦 商品库：候选/在售/下架状态管理，客单价与佣金率自动算出每单赚多少',
    '🤖 AI 选品建议：按你的赛道 + 粉丝量推荐 6 个品类，选中一键加进商品库',
    '✍️ 带货笔记生成：选商品 → AI 出标题/正文/标签/封面/合规提示，可一键「存库 + 排期发布」',
    '💰 佣金计算器 + GMV 看板：接单前先算值不值，出单后自动汇总 GMV/佣金/单品排行',
    '📅 大促日历：双11/618/开学季等 8 个节点倒计时 + 提前铺内容提醒 + 一键生成节点选题',
    '☑️ 内容库批量排期：勾选多篇内容，自动错开排进未来日期（每天最多 2 条）',
    '🏠 首页联动：有在售商品却 7 天没发带货笔记 → 自动进入今日重点提醒',
    '🔔 今日待发卡片：打开发布计划就能看到今天该发什么，逾期内容单独标红',
    '📅 排期可改期：提前/顺延 1 天、顺延 1 周、指定日期，不用删了重建',
    '📋 一键复制发布包：标题 + 正文 + 话题标签一次复制，直接粘到小红书发布器',
    '🔴 侧栏发布计划角标升级：有今日待发/逾期时变红呼吸提示'
  ]},
  {v:'6.31.0', date:'2026-08-28', items:['🔗 数据接入新方式：粘贴小红书链接/分享文案 → 自动识别账号（昵称/主页/粉丝公开数据一键保存到账号资料）','🧩 识别降级保护：小红书对自动抓取有限制时，自动保留账号身份 + 引导粘贴创作中心数据一键补齐粉丝阅读','📥 数据接入中心升级：链接识别 + 粘贴导入双通道，账号资料实质化','🔌 设置中心数据源升级：免费接入方案说明，预留企业 API 升级位']},
  {v:'6.23.0', date:'2026-08-27', items:['🎨 全站设计系统统一：卡片/按钮/输入/列表/侧栏/顶栏/tabbar 视觉一致','🏠 首页重排：深色 hero + 数据 4 宫格 + 快捷操作大图标，清爽主次分明','🔄 自动更新机制：检测到新版本顶部横幅提示，一键刷新即升级（数据不受影响）','🔴 主色降饱和：鲜红→酒红，视觉更克制高级','⏱ 页面切换进度条 + 淡入动画，60 秒自动刷新热点/日报']},
  {v:'6.12.0', date:'2026-08-26', items:['💰 平台不再展示价格：会员中心价格改为「价格面议」，预约按钮改为「联系卖家开通」（价格灵活调整，由你单独告知客户）','🎨 首页品牌渐变 hero：替代纯白 today-header，加入每日运营贴士玻璃质感块，整体不再单调','🔒 整体视觉升级：首页首屏小红书红品牌色 + 柔和阴影，卡片层次更分明，专业感提升']},
  {v:'6.11.1', date:'2026-08-26', items:['🤝 会员档位合并：标准版/尊享版统一为「年度会员」，全部功能对已激活客户开放（多账号矩阵/AI 三件套/变现商业/日报中心全部可用）','📦 会员中心单档展示：PRICING_TIERS 保留扩展结构，未来随时可恢复多档位','🎨 去 C 标识 + 红色 UI 克制化（Splash 对勾 logo / 深灰按钮 / 中性收益数字）']},
  {v:'6.11.0', date:'2026-08-26', items:['🚫 彻底移除所有 C 标识（Splash logo 改对勾、侧栏/抽屉头像改深灰方块+小品牌点）','🎨 关键红色 UI 收克制：顶栏「+新建」、工作区「+添加」、导出数据按钮改深灰；收益数字/收益目标%改中性','📦 会员中心改为可扩展结构 PRICING_TIERS：未来新增会员档位/调整价格/权益只需改一处对象；新增「权益与价格可能调整，以卖家最新通知为准」说明','💎 优化：运营目标条「展开→」红色改深灰、Splash 品牌点改深灰、首页收益数字中性化']},
  {v:'6.10.1', date:'2026-08-26', items:['🔧 修复严重数据丢失 bug：账号切换时防抖保存未落盘导致数据丢失（改用同步落盘）','🛡️ 变现方案入库二次风控复查（严重违规禁止入库，跳转改写）','🛠️ 账号健康度「一键优化」：按薄弱维度直达整改工具','⏰ 排期智能避坑：低流量时段弹窗警告','👑 激活页权益对比表：体验 vs 会员一目了然','📥 首页「同步真实数据」入口：粘贴导入自动校准预测','🐛 修复首页情报流同步后不刷新问题']},
  {v:'6.10.0', date:'2026-08-26', items:['📋 运营目标引导条支持收起（已了解 ✕ → 一行小条，可展开）','🤖 AI 助理新增 6 项高阶能力入口：真人语感润色/7天选题推演/复刻文风/矩阵差异化文案/商单报价分析/评论回复草稿','⚖️ AI 输出自动追加免责声明','✅ 上线前全量验收测试通过']},
  {v:'6.9.1', date:'2026-08-26', items:['🤖 AI 运营助理真 AI 升级：连接工作台实时数据深度回答 + 多轮记忆','🔥 首页今日 AI 情报流：热点+变现日报自动聚合，减少信息差']},
  {v:'6.9.0', date:'2026-08-26', items:['📱 新用户 4 页滑动开屏引导：跳过/下一步/开始体验/圆点指示器/触摸滑动','🦞 主屏图标重做：品牌红底 + 小龙虾彩蛋（iOS/Android 适配）']},
  {v:'6.8.0', date:'2026-08-26', items:['🎯 需求式新手定向引导：激活后先选运营目标（起号/变现/爆款/矩阵），专属路径直达 + 首页目标引导条','🛡️ P0 合规修复：变现文案生成后自动风控扫描（严重违规禁止入库）；日报/热门/变现中心免责声明强制落地','📌 体验模式标签移至顶栏弱化显示，不再悬浮遮挡','📈 收益预估参数自定义：涨粉/转化率/接单量/佣金浮动可调','📅 变现诊断→本周排期一键联动','🏷️ 商单模板合规边界标注（报备 vs 私下置换）','🎨 热度梯度配色 / 日报更新时间戳 / 尊享标签放大 / 侧边栏变现中枢分组']},
  {v:'6.7.0', date:'2026-08-26', items:['💼 变现商业运营中心：五大变现体系 AI 全覆盖（商单/带货/知识付费/私域合规/轻量）','🧭 变现路径诊断：AI 匹配最适合的变现优先级与从 0 到 1 路线图','⚠️ 变现风控检测：违规导流/硬广词自查 + 合规改写','📈 收益预估模型：月度收入潜力模拟','📰 变现日报中心：每日自动更新 6 大模块（新规/玩法/行情/案例/风险/行动）+ 30 天存档 + 赛道筛选','🧩 变现资产库：每账号独立商单报价/选品/话术配置','🎨 全新品牌图标（CF 渐变圆角）+ manifest 主题色对齐']},
  {v:'6.6.0', date:'2026-08-26', items:['🔍 发布前违禁词扫描：本地词库 + AI 深度复查（补齐竞品必备能力）','📊 账号健康度体检：综合分 + 5 维评分 + AI 解读','🎭 账号风格档案 onboarding：首次激活引导建立专属人设，AI 全链路套用','📲 PWA 全屏引导强化：首次进入顶部蓝色横幅，区分 iOS/Android 引导步骤','🔒 品牌锁死：会员中心 mh-name 固定显示 Crazy Friday.（用户自定义名仅显示在侧边栏/顶栏）']},
  {v:'6.5.0', date:'2026-08-26', items:['🧰 专业发布工具箱（创作中心 7 大 AI 工具）','🧬 爆款深度拆解：六维结构化拆解 + 同题全新原创','🛡️ 发布前查重降重：风险检测 + 安全改写 + 安全评分','🎨 封面标题组合：主副标题 + 钩子 + 四方向','#️⃣ 智能标签匹配：核心/垂直/长尾/低竞争 + 排序','💬 评论区运营：高意向识别 + 回复 + 私信承接','🤝 私域合规话术：低风险引导 + 避坑 + 赛道转化','🎭 账号人设风格锁定：AI 学习历史 → 一键全流程自动套用','🩺 数据复盘 AI 深度诊断：单篇/整体诊断 + 优化清单']},
  {v:'6.4.0', date:'2026-08-26', items:['🤖 每日热点自动推送：打开工作台自动更新今日热门，无需手动','📊 自动运营周报：每周一自动生成上周总结与建议','📅 发布到点自动提醒：今天有稿别忘发','💰 AI 报价生成器：粉丝数一键出完整商业报价单','🩺 变现体检：数据+AI 出评分与 30 天行动清单','📋 自动竞品简报：情报本一键汇总竞品动态']},
  {v:'6.3.0', date:'2026-08-26', items:['🚀 服务端 gzip 压缩：加载提速 70%（实测 913ms 打开）','⬇️ 内容库一键导出全部（Markdown 打包）','🎯 一键对标：粘贴博主链接自动识别 + AI 对标分析']},
  {v:'6.2.0', date:'2026-08-26', items:['🧭 矩阵管理：首页矩阵总览 + 顶栏一键切换账号','📤 内容一键转投：主号爆款复制到小号改标题直接发','多账号数据完全独立（尊享版）']},
  {v:'6.1.0', date:'2026-08-26', items:['⚫ 默认黑色主题（新增曜石黑，未设置过明暗偏好的用户默认深色）','🚀 AI 一键全流程：一个主题 → 标题×3+正文+标签+封面+发布时间','📅 AI 本周排期：结合热点日历生成 7 天选题，一键导入发布计划','🎯 AI 30 天成长计划：基于账号诊断生成四周路线图']},
  {v:'6.0.1', date:'2026-08-26', items:['✨ AI 创作中心 UI 降噪：去掉渐变 Hero 与彩色卡，回归白底克制风','📲 三处新增 PWA 加桌面引导（欢迎弹窗/登录门/交付话术）']},
  {v:'6.0.0', date:'2026-08-26', items:['🎨 主题色 6 套（红/橙/绿/蓝/紫/粉），一键切换工作台主色','🤖 AI Key 客户自填（成本归客户，卖家零负担）','✨ AI 创作中心全面美化：渐变 Hero + 10 种内容场景 + 创作贴士','10 大创作场景：爆款标题/种草/干货/情绪/测评/视频脚本/直播话术/封面/接广/简介']},
  {v:'5.9.0', date:'2026-08-26', items:['选题↔排期联动：一键加入发布计划，不再二次复制','内容导出：Markdown / 纯文本 / 精美卡片图','素材分类文件夹：图文 / 脚本 / 封面文案','小红书热点日历：节日大促提前踩点','多账号数据完全独立（尊享版）','AI 爆款复刻 / 变现方案 / 评论区助手（尊享版）','竞品情报本：链接监控 + 爆款预警 + 一键收藏']},
  {v:'5.8.0', date:'2026-08-26', items:['云端防护自动开通：激活码云端登记 + 停用即时生效','会员中心修复：到期信息与实际授权一致','新增帮助与常见问题板块','被停用客户收到明确提示','数据备份免责与安全提示强化']},
  {v:'5.7.1', date:'2026-08-26', items:['客户记录永久保留：退货也可留存备查','使用时长统计：已用天数 / 最近活跃一目了然','隐私与数据条款：数据仅存本机，卖家无法查看','更新提示：每次升级不丢失任何数据']},
  {v:'5.7.0', date:'2026-08-26', items:['会员中心全新改版：头像 / 进度 / 到期信息','7 天新手引导营：跟着任务 7 天上手','变现预测：本月收益提前预估','联系方式改为卖家后台可配置']},
  {v:'5.6.0', date:'2026-08-26', items:['品牌视觉统一：Crazy Friday · WORKBENCH','线性图标全面升级','⌘K 命令面板：28 个命令一键直达','社交分享卡片优化']},
  {v:'5.5.0', date:'2026-08-25', items:['云端防护：激活码防破解、可远程停用','卖家客户管理后台：专属链接 + 激活码','到期自动锁定，数据完整保留']},
  {v:'5.4.0', date:'2026-08-24', items:['V5 数据安全架构：数据 / 配置 / 版本解耦','旧数据自动迁移，升级绝不丢数据','自动备份 + 失败回滚']},
  {v:'5.3.0', date:'2026-08-23', items:['激活码授权系统：年度会员开通','数据按客户 uid 隔离']},
  {v:'5.0.0', date:'2026-08-20', items:['Today 运营驾驶舱','AI 创作流程升级','3 分钟初始化引导']}
];
/* ================= V6.11 会员档位（可扩展） =================
 * 新增档位只需往下 PRICING_TIERS 加一个 key：
 *  - id / label / price / priceNote / desc / rights[]
 * 权益与价格可能调整，以卖家最新通知为准
 */
const PRICING_TIERS = {
  // V6.12 平台不展示价格：价格由你单独告知客户，灵活调整
  // 未来分档时：在此追加 standard/premium 两个 key 即可
  annual: {
    label:'年度会员', price:'价格面议', priceNote:'联系卖家获取最新报价',
    desc:'全网最全的小红书 AI 运营工作台 · 全部功能开放',
    rights:[
      '选题雷达 · 爆款拆解 · 今日热门 · 热点日历',
      'AI 创作中心：10 种内容场景 + 9 大发布工具箱',
      'AI 三件套：爆款复刻 / 变现方案 / 评论区助手',
      '变现商业中心：商单 / 带货 / 知识付费 / 私域 / 轻量',
      '变现日报中心 · 决策中枢 · 资产库',
      '多账号矩阵：数据完全隔离 + 顶栏一键切换 + 内容转投',
      '账号健康度 · 竞品情报本 · AI 本周排期 · 30 天计划',
      '内容库三格式导出 · 素材分类 · 本地数据安全存储'
    ]
  }
};
const MEM_PRICE_DISCLAIMER = '当前为统一会员档位；权益与价格可能调整，以卖家最新通知为准';


const LS_KEY = 'xhs_wb_data_v5';
const LS_LEGACY_KEY = 'xhs_workbench_v1';
const LS_BACKUP_PREFIX = () => 'xhs_wb_bak_' + (getUid()?getUid()+'_':'');
const LS_WELCOME = 'xhs_welcome_v1';
const LS_ONBOARDED = 'xhs_onboarded_v1';

/* 大型功能 Feature Flag：出问题时独立关闭，不影响整体 */
const FEATURES = {
  aiSidekick: false,        // AI 副驾驶（本期暂不开放）
  weeklyReview: true,       // AI 周报
  quickCreate: true,        // 全局快捷创建
  commandPalette: true,     // ⌘K 命令面板
  newOnboarding: true,      // 3 分钟初始化引导
  autosave: true            // 自动保存
};

const Store = {
  data: null,
  meta: null,
  _saveTimer: null,

  /* ---------- 加载 ---------- */
  load(){
    this._key = getStoreKey(getUid(), (typeof getActiveWs==='function') ? getActiveWs() : 'default');
    // 1) 读取新版数据包（meta + data 分离）
    let pkg = this._readPackage(this._key);
    // 2) 兼容旧版本数据（v1~v6 的裸业务数据），自动迁移且不丢用户数据
    if(!pkg){
      const legacy = this._readRaw(LS_LEGACY_KEY);
      if(legacy){
        this._backup(legacy, 'legacy_v'+(legacy.version||1));
        // 迁移用户：已有真实内容资产的，不强制重新初始化
        const hasRealContent = legacy.contents && legacy.contents.some(c=>c.status==='published' || (c.views||0)>0);
        legacy.userProfile = legacy.userProfile || { accountType:'', goal:'', weeklyTarget:5, stage:'', onboarded:false };
        if(hasRealContent) legacy.userProfile.onboarded = true;
        pkg = { meta:this._newMeta(1), data:legacy };
        this._write(pkg);
        console.log('[Crazy Friday] 旧版本数据已自动迁移到 V5 架构');
      }
    }
    // 3) 全新用户：用 seed 初始化
    this._isNewUser = false;
    if(!pkg){
      // V6.35 体验模式：给潜在客户看的是一套「正在运营」的完整演示账号，不是空壳
      const seedData = (window.__DEMO_MODE__ && typeof this._demoSeed==='function') ? this._demoSeed() : this._seed();
      pkg = { meta:this._newMeta(VERSION.schema), data:seedData };
      this._write(pkg);
      this._isNewUser = true;
      localStorage.setItem('xhs_wb_seed_created','1');
    }
    // 4) 执行迁移（补字段 / 升级 schema），失败自动回滚
    const fromSchema = pkg.meta.schemaVersion||1;
    const migrated = this.migrateUserData(pkg.data, fromSchema);
    if(migrated === null){
      // 迁移失败：尝试从备份恢复
      const bk = this._restoreLatestBackup();
      if(bk){ pkg = { meta:this._newMeta(fromSchema), data:bk }; this._write(pkg); console.warn('[Crazy Friday] 迁移失败，已从备份恢复'); }
    } else {
      pkg.data = migrated;
    }
    // 5) schema 升级时：先快照备份，再更新版本号
    if(fromSchema < VERSION.schema){
      this._backup(pkg.data, 'pre_schema_v'+VERSION.schema);
    }
    pkg.meta.schemaVersion = VERSION.schema;
    pkg.meta.appVersion = VERSION.app;
    pkg.meta.updatedAt = new Date().toISOString();
    this.meta = pkg.meta;
    this.data = pkg.data;
    this._write(pkg);
    return this.data;
  },

  /* ---------- 迁移机制 ---------- */
  migrateUserData(d, fromSchema){
    try{
      const out = d || {};
      const def = this._seed();
      // 补全缺失的业务模块（只补缺失，绝不覆盖已有数据）
      ['topicPool','viralPool','favorites','assets','contents','schedule','history',
       'diagnosis','benchmarks','ideas','trending','toolbox','subscription','fans','analytics','goals','streak','money','sensitiveWords','weeklyReports','personas','vmoney','shop'].forEach(k=>{
        if(out[k]===undefined || out[k]===null){ out[k] = JSON.parse(JSON.stringify(def[k])); }
      });
      // 业务对象补 createdAt / updatedAt（为未来数据库与软删除做准备）
      ['contents','schedule','assets','ideas','benchmarks','history'].forEach(k=>{
        (out[k]||[]).forEach(item=>{
          if(!item.createdAt) item.createdAt = (item.date?item.date+'T00:00:00':new Date().toISOString());
          if(!item.updatedAt) item.updatedAt = item.createdAt;
        });
      });
      // V6.29 深层补全（老数据缺子字段会导致页面崩溃 → 用种子默认结构兜底）
      try{
        const sd = def;
        if(out.diagnosis && !Array.isArray(out.diagnosis.dims)) out.diagnosis.dims = (sd.diagnosis&&sd.diagnosis.dims)||[];
        if(out.diagnosis && !Array.isArray(out.diagnosis.advice)) out.diagnosis.advice = (sd.diagnosis&&sd.diagnosis.advice)||[];
        if(out.toolbox && !out.toolbox.tagLib) out.toolbox.tagLib = (sd.toolbox&&sd.toolbox.tagLib)||{};
        if(out.money && !Array.isArray(out.money.quote)) out.money.quote = (sd.money&&sd.money.quote)||[];
        if(out.money && !Array.isArray(out.money.tips)) out.money.tips = (sd.money&&sd.money.tips)||[];
        // V6.32 电商模块补全（老数据无 shop 字段会导致电商页崩溃）
        if(!out.shop || typeof out.shop!=='object') out.shop = JSON.parse(JSON.stringify(sd.shop||{products:[],orders:[],defaultRate:20}));
        if(!Array.isArray(out.shop.products)) out.shop.products = [];
        if(!Array.isArray(out.shop.orders)) out.shop.orders = [];
        if(out.shop.defaultRate===undefined) out.shop.defaultRate = 20;
      }catch(e){}
      // 补充运营用户档案（Onboarding 数据）
      if(!out.userProfile){
        out.userProfile = { accountType:'', goal:'', weeklyTarget:5, stage:'', onboarded:false };
      }
      return out;
    }catch(e){
      console.error('[Crazy Friday] 数据迁移失败', e);
      return null;
    }
  },

  /* ---------- 种子数据（全新用户） ---------- */
  _seed(){
    const seed = JSON.parse(JSON.stringify(Seed));
    const base = new Date(); base.setDate(base.getDate() - (base.getDay()+6)%7);
    const times = ['10:00','14:00','19:30','20:00','21:00'];
    for(let i=0;i<7;i++){ const d = new Date(base); d.setDate(base.getDate()+i); seed.schedule.push({id:'s'+i, date:fmtDate(d), title:'待定选题', status:'idea', time:times[i%5]}); }
    seed.schedule[2] = {id:'s2', date:fmtDate(base), title:'千元机横评｜2026 最值得买', status:'ready', time:'20:00', cat:'数码'};
    seed.schedule[4] = {id:'s4', date:fmtDate(new Date(base.getTime()+2*864e5)), title:'打工人 10 分钟快手菜', status:'ready', time:'21:00', cat:'美食'};
    seed.schedule[1] = {id:'s1', date:fmtDate(base), title:'通勤妆容3分钟攻略', status:'published', time:'19:30', cat:'美妆'};
    seed.schedule.push({id:'d1', date:fmtDate(addDays(2)), title:'AI 工具盘点 2026', status:'draft', time:'10:00', cat:'数码'});
    seed.schedule.push({id:'d2', date:fmtDate(addDays(4)), title:'小个子显高穿搭公式', status:'draft', time:'14:00', cat:'穿搭'});
    this._genDays(seed.analytics, 30, 7000);
    this._genDays(seed.analytics, 90, 7000);
    seed.subscription.remainDays = this._daysBetween(todayStr(), seed.subscription.expireAt);
    seed.userProfile = { accountType:'', goal:'', weeklyTarget:5, stage:'', onboarded:false };
    seed.weeklyReports = [];
    seed.personas = [];
    seed.remixLib = [];
    seed.vmoney = {assets:[]};
    return seed;
  },

  /* ---------- V6.35 体验版演示数据 ----------
   * 发给潜在客户的体验链接，打开必须立刻看到「一个正在真实运营的账号」：
   * 有内容、有数据、有排期、有收益 —— 空壳子等于劝退。
   * 全部按相对日期生成，任何时候打开都是「新鲜」的。
   * 只写在 __DEMO__ 命名空间，绝不触碰真实数据。 */
  _demoSeed(){
    const s = this._seed();
    const D = n => fmtDate(addDays(n));          // YYYY-MM-DD
    const M = n => fmtDate(addDays(n)).slice(5); // MM-DD
    const t = todayStr();

    s.userProfile = { accountType:'穿搭', goal:'涨粉+带货变现', weeklyTarget:5, stage:'成长期', onboarded:true };

    /* 已发布 7 条（含 1 条 12w+ 爆款）+ 待发布 2 + 草稿 2 + 选题 1 */
    s.contents = [
      {id:'dc1', title:'通勤穿搭｜5 件基础款搭出 30 套不重样', status:'published', date:M(-2),  cat:'穿搭', views:128600, likes:5230, collects:4180, comments:621,
       body:'打工人的早晨只有 10 分钟，但我靠这 5 件基础款，一个月没重样过。\n\n①白衬衫：选微宽松，扎一半塞一半最显瘦\n②直筒西裤：158 也能穿出 165 的比例\n③针织开衫：空调房救命，叠穿层次感\n④乐福鞋：通勤暴走不累脚\n⑤托特包：装得下 14 寸电脑\n\n搭配公式放在图 3，直接抄作业就行～', tags:['通勤穿搭','基础款','打工人穿搭']},
      {id:'dc2', title:'158 小个子显高公式，我总结了整整 3 年', status:'published', date:M(-5),  cat:'穿搭', views:42300, likes:1860, collects:2140, comments:288,
       body:'身高是硬伤，但比例是可以骗的。\n\n核心就一句：上短下长，腰线提到肚脐以上。\n\n短款外套 + 高腰裤 = 腿长立刻 +8cm\n同色系上下装 = 视觉不断层，显高又显瘦\n尖头鞋 > 圆头鞋，露脚背延长腿部线条', tags:['小个子穿搭','显高','穿搭公式']},
      {id:'dc3', title:'换季衣橱断舍离｜扔掉这 8 件立刻清爽', status:'published', date:M(-8),  cat:'穿搭', views:28700, likes:1240, collects:1530, comments:196,
       body:'每年换季都要纠结一次，这次我给自己定了死规矩：一年没穿过的，全部出掉。\n\n清完 8 类：起球毛衣、变形 T 恤、不合身牛仔裤、过季凉鞋、冲动买的亮色包…\n\n结果：衣橱少了 40%，每天选衣服反而快了。', tags:['断舍离','衣橱整理','极简']},
      {id:'dc4', title:'打工人早餐｜10 分钟 5 款不重样', status:'published', date:M(-11), cat:'美食', views:19400, likes:890, collects:1120, comments:143,
       body:'起不来床还想吃好的，真的是可以兼得的。\n\n①隔夜燕麦：睡前 3 分钟，早上直接吃\n②三明治：全麦+鸡蛋+生菜，5 分钟\n③豆浆+手抓饼：冷冻半成品救急\n④酸奶碗：水果+麦片，零厨艺\n⑤蒸红薯+水煮蛋：前一晚备好', tags:['快手早餐','打工人','减脂餐']},
      {id:'dc5', title:'我的化妆台｜200 块搞定全套通勤妆', status:'published', date:M(-14), cat:'美妆', views:15600, likes:720, collects:980, comments:118,
       body:'不是贵才好用，通勤妆你只需要 6 样东西。\n\n粉底液、眉笔、大地色眼影、腮红、睫毛膏、豆沙色口红。\n\n全套 200 出头，早上 8 分钟搞定，同事都问我是不是换了护肤品。', tags:['平价彩妆','通勤妆','新手化妆']},
      {id:'dc6', title:'职场新人第一套正装怎么买才不踩坑', status:'published', date:M(-18), cat:'穿搭', views:9800,  likes:430,  collects:560,  comments:87,
       body:'第一套正装千万别买太贵，因为你很快会知道自己真正需要什么。\n\n版型 > 品牌，肩线合不合适一眼就能看出来。\n黑色最安全，但深灰/藏青更不容易显老气。', tags:['职场穿搭','正装','面试穿搭']},
      {id:'dc7', title:'周末露营穿搭｜拍照好看还能真的干活', status:'published', date:M(-22), cat:'穿搭', views:7200,  likes:310,  collects:420,  comments:62,
       body:'露营穿搭最大的坑：好看但不抗造。\n\n冲锋衣选亮色，出片率高还耐脏；工装裤口袋多，杂物全塞进去；鞋子一定选防滑的。', tags:['露营穿搭','户外','周末去哪儿']},
      {id:'dc8',  title:'秋日通勤包｜装得下 14 寸电脑还好看',   status:'ready', date:M(1),  cat:'穿搭', views:0, likes:0, collects:0, comments:0, body:'', tags:[]},
      {id:'dc9',  title:'2026 秋冬流行色，这 3 个最好穿',        status:'ready', date:M(3),  cat:'穿搭', views:0, likes:0, collects:0, comments:0, body:'', tags:[]},
      {id:'dc10', title:'30 天穿搭挑战复盘｜我到底坚持下来了吗',  status:'draft', date:M(2),  cat:'穿搭', views:0, likes:0, collects:0, comments:0,
       body:'一个月，30 套 look，没有一天重样。\n\n中途有 4 天差点放弃，靠提前一周把搭配拍好撑过来了。\n\n最意外的收获：评论区开始有人问链接了。', tags:['穿搭挑战','复盘']},
      {id:'dc11', title:'冬天保暖又不臃肿的 3 个思路',           status:'draft', date:M(4),  cat:'穿搭', views:0, likes:0, collects:0, comments:0, body:'', tags:[]},
      {id:'dc12', title:'年终衣橱盘点｜今年买得最值的 5 件',     status:'idea',  date:M(6),  cat:'穿搭', views:0, likes:0, collects:0, comments:0, body:'', tags:[]}
    ];

    /* 排期：本周填满，含 1 条逾期（让「今天要处理」有东西可展示） */
    s.schedule = [
      {id:'ds1', date:D(-2), title:'秋日通勤包｜装得下 14 寸电脑', status:'ready',     time:'20:00', cat:'穿搭'},
      {id:'ds2', date:D(-1), title:'2026 秋冬流行色速递',          status:'published', time:'19:30', cat:'穿搭'},
      {id:'ds3', date:t,     title:'30 天穿搭挑战复盘',            status:'draft',     time:'20:00', cat:'穿搭'},
      {id:'ds4', date:D(1),  title:'打工人冬季通勤套装',           status:'ready',     time:'21:00', cat:'穿搭'},
      {id:'ds5', date:D(2),  title:'平价美妆合集｜学生党友好',     status:'idea',      time:'20:00', cat:'美妆'},
      {id:'ds6', date:D(3),  title:'年会穿搭｜不撞衫还出片',       status:'draft',     time:'19:00', cat:'穿搭'},
      {id:'ds7', date:D(4),  title:'年末送礼清单（100 元内）',     status:'idea',      time:'20:30', cat:'好物'},
      {id:'ds8', date:D(6),  title:'年终衣橱盘点',                 status:'idea',      time:'21:00', cat:'穿搭'}
    ];

    /* 带货：6 个商品（含候选/在售/下架全流程）+ 12 笔订单 */
    s.shop = {
      defaultRate: 20,
      products: [
        {id:'dp1', name:'轻薄通勤托特包',   cat:'穿搭', price:259,  commissionRate:20, source:'品牌寄样', sellPoints:'装得下 14 寸电脑，自重仅 480g', status:'selling',   createdAt:t},
        {id:'dp2', name:'高腰直筒西裤',     cat:'穿搭', price:189,  commissionRate:25, source:'自选',     sellPoints:'小个子显高，垂感好不起皱',     status:'selling',   createdAt:t},
        {id:'dp3', name:'大地色眼影盘',     cat:'美妆', price:99,   commissionRate:18, source:'品牌寄样', sellPoints:'新手友好，不飞粉',             status:'selling',   createdAt:t},
        {id:'dp4', name:'加绒保暖打底衫',   cat:'穿搭', price:129,  commissionRate:22, source:'自选',     sellPoints:'零下也能穿，贴身不臃肿',       status:'candidate', createdAt:t},
        {id:'dp5', name:'便携挂烫机',       cat:'家居', price:159,  commissionRate:15, source:'品牌合作', sellPoints:'30 秒出蒸汽，出差必备',        status:'candidate', createdAt:t},
        {id:'dp6', name:'夏季冰丝防晒衣',   cat:'穿搭', price:89,   commissionRate:20, source:'自选',     sellPoints:'UPF50+，去年爆款',             status:'archived',  createdAt:t}
      ],
      orders: [
        {id:'do1',  productId:'dp1', productName:'轻薄通勤托特包', date:D(-1),  orders:18, gmv:4662, commission:932,  note:'爆款笔记引流'},
        {id:'do2',  productId:'dp2', productName:'高腰直筒西裤',   date:D(-2),  orders:26, gmv:4914, commission:1229, note:'显高公式笔记挂车'},
        {id:'do3',  productId:'dp1', productName:'轻薄通勤托特包', date:D(-4),  orders:12, gmv:3108, commission:622,  note:''},
        {id:'do4',  productId:'dp3', productName:'大地色眼影盘',   date:D(-6),  orders:31, gmv:3069, commission:552,  note:'化妆台笔记'},
        {id:'do5',  productId:'dp2', productName:'高腰直筒西裤',   date:D(-9),  orders:19, gmv:3591, commission:898,  note:''},
        {id:'do6',  productId:'dp6', productName:'夏季冰丝防晒衣', date:D(-12), orders:8,  gmv:712,  commission:142,  note:'已下架'},
        {id:'do7',  productId:'dp1', productName:'轻薄通勤托特包', date:D(-15), orders:14, gmv:3626, commission:725,  note:''},
        {id:'do8',  productId:'dp3', productName:'大地色眼影盘',   date:D(-18), orders:22, gmv:2178, commission:392,  note:''},
        {id:'do9',  productId:'dp2', productName:'高腰直筒西裤',   date:D(-21), orders:16, gmv:3024, commission:756,  note:''},
        {id:'do10', productId:'dp4', productName:'加绒保暖打底衫', date:D(-24), orders:11, gmv:1419, commission:312,  note:'测款中'},
        {id:'do11', productId:'dp1', productName:'轻薄通勤托特包', date:D(-27), orders:9,  gmv:2331, commission:466,  note:''},
        {id:'do12', productId:'dp5', productName:'便携挂烫机',     date:D(-30), orders:6,  gmv:954,  commission:143,  note:'测款中'}
      ]
    };

    /* 变现记录：带货佣金 + 广告合作，与 store 订单口径一致 */
    s.money.records = [
      {id:'dm1', title:'通勤托特包 · 带货佣金', product:'电商带货', income:932,  date:M(-1)},
      {id:'dm2', title:'高腰西裤 · 带货佣金',   product:'电商带货', income:1229, date:M(-2)},
      {id:'dm3', title:'大地色眼影盘 · 带货',   product:'电商带货', income:552,  date:M(-6)},
      {id:'dm4', title:'某服饰品牌 · 单条广告', product:'广告合作', income:1800, date:M(-7)},
      {id:'dm5', title:'高腰西裤 · 带货佣金',   product:'电商带货', income:898,  date:M(-9)},
      {id:'dm6', title:'某护肤品牌 · 置换+稿费', product:'广告合作', income:600, date:M(-13)},
      {id:'dm7', title:'通勤托特包 · 带货佣金', product:'电商带货', income:725,  date:M(-15)},
      {id:'dm8', title:'高腰西裤 · 带货佣金',   product:'电商带货', income:756,  date:M(-21)}
    ];

    /* 话题池（穿搭美妆垂类） */
    s.topicPool = [
      {id:'dt1', cat:'穿搭', title:'小个子显高穿搭公式，照着穿不出错', heat:96, search:128000, competition:47, rising:true},
      {id:'dt2', cat:'穿搭', title:'通勤穿搭｜一周不重样的搭配公式',   heat:94, search:96000,  competition:52, rising:true},
      {id:'dt3', cat:'美妆', title:'200 块搞定全套通勤妆',             heat:91, search:82000,  competition:38, rising:true},
      {id:'dt4', cat:'穿搭', title:'秋冬流行色，这 3 个颜色最好穿',    heat:89, search:74000,  competition:41, rising:true},
      {id:'dt5', cat:'好物', title:'装得下电脑的通勤包推荐',           heat:86, search:61000,  competition:33, rising:true},
      {id:'dt6', cat:'穿搭', title:'年会穿搭不撞衫指南',               heat:84, search:58000,  competition:36, rising:false},
      {id:'dt7', cat:'穿搭', title:'冬天保暖又不臃肿的穿搭思路',       heat:82, search:53000,  competition:44, rising:true},
      {id:'dt8', cat:'好物', title:'100 元内的年末送礼清单',           heat:80, search:49000,  competition:29, rising:true},
      {id:'dt9', cat:'穿搭', title:'衣橱断舍离｜该扔的 8 类衣服',      heat:77, search:42000,  competition:31, rising:false},
      {id:'dt10',cat:'穿搭', title:'30 天穿搭挑战，真的有用吗',        heat:75, search:38000,  competition:26, rising:true}
    ];

    /* 素材库 */
    s.assets = [
      {id:'da1', type:'image', name:'通勤穿搭封面-成片',     size:'2.4MB', date:M(-2)},
      {id:'da2', type:'image', name:'显高公式对比图',         size:'1.8MB', date:M(-5)},
      {id:'da3', type:'text',  name:'秋冬流行色文案-v2',      size:'860字', date:M(-1)},
      {id:'da4', type:'image', name:'衣橱断舍离前后对比',     size:'3.1MB', date:M(-8)},
      {id:'da5', type:'video', name:'30 天穿搭挑战混剪',      size:'68MB',  date:M(-1)},
      {id:'da6', type:'text',  name:'带货话术-托特包',        size:'320字', date:M(-2)},
      {id:'da7', type:'image', name:'年会穿搭备选-4 套',      size:'4.2MB', date:M(-1)},
      {id:'da8', type:'text',  name:'评论区高赞回复模板',     size:'260字', date:M(-3)}
    ];

    /* 粉丝 + 数据复盘：做出「正在增长」的曲线 */
    s.fans = {
      total: 12860, new7d: 486, new30d: 2140, new90d: 6480,
      sources: [
        {name:'搜索', pct:41, count:5230},
        {name:'推荐', pct:34, count:4372},
        {name:'关注', pct:11, count:1415},
        {name:'个人主页', pct:9, count:1157},
        {name:'外部', pct:5, count:686}
      ]
    };
    s.analytics.days7  = this._genDemoDays(7,  5200,  9800);
    s.analytics.days30 = this._genDemoDays(30, 3200,  9800);
    s.analytics.days90 = this._genDemoDays(90, 900,   9800);
    s.analytics.notes  = s.contents.filter(c=>c.status==='published').map((c,i)=>({
      id:'dn'+(i+1), title:c.title, emoji:['👗','📏','🧺','🍳','💄','💼','🏕'][i]||'📌',
      views:c.views, likes:c.likes, collects:c.collects, comments:c.comments,
      score: Math.min(96, 52 + Math.round(c.collects/Math.max(1,c.views)*420)),
      cat:c.cat
    }));

    /* 连续打卡 23 天 —— 让首页「坚持」数据好看 */
    s.streak = { count: 23, lastDate: t, best: 31 };
    s.goals  = { monthlyFans: 3000, monthlyIncome: 8000, fansStart: 9800, incomeStart: 0 };

    /* 爆款拆解库：预置 2 条演示记录，让潜在客户一打开就看到「模板沉淀」的价值 */
    s.remixLib = [
      {id:'drx1', title:'通勤穿搭｜5 件基础款搭出 30 套不重样', date:M(-2), aiSource:'deepseek',
       overall:'反常识数字承诺 + 编号干货清单 + 「抄作业」低门槛收尾，是典型的高收藏结构',
       radar:{'选题角度':9,'标题钩子':8,'开头抓人':8,'内容结构':9,'情绪设计':7,'互动引导':8},
       formula:'痛点开篇(只有10分钟) → 反常识承诺(5件30套) → 编号干货清单 → 公式/资源沉淀 → 低门槛互动收尾',
       structureSteps:['痛点开篇：打工人早晨只有 10 分钟','反常识承诺：5 件基础款搭出 30 套','编号清单给干货：①白衬衫 ②直筒西裤 ③针织开衫 ④乐福鞋 ⑤托特包','搭配公式放图 3，把干货沉淀到图片','互动收尾：直接抄作业（降低行动门槛）'],
       hookAnalysis:'标题用「数字反差」：5 件 vs 30 套，制造超出预期的好奇，数字锚点让人想点开验证',
       angleIdeas:['5 件通勤基础款，我搭了一个月没重样（过程叙事版）','小个子通勤衣柜：只留 10 件，每天 3 分钟出门','冬天通勤怎么穿不臃肿？5 件单品公式直接抄'],
       interactionTips:['评论区引导晒作业：搭好了发图给你看','文末提问收集身高体型，为下一篇埋选题'],
       riskNotes:[],
       src:'通勤穿搭｜5 件基础款搭出 30 套不重样\n\n打工人的早晨只有 10 分钟，但我靠这 5 件基础款，一个月没重样过。\n\n①白衬衫：选微宽松，扎一半塞一半最显瘦\n②直筒西裤：158 也能穿出 165 的比例\n③针织开衫：空调房救命，叠穿层次感\n④乐福鞋：通勤暴走不累脚\n⑤托特包：装得下 14 寸电脑\n\n搭配公式放在图 3，直接抄作业就行～',
       createdAt:new Date(Date.now()-2*864e5).toISOString()},
      {id:'drx2', title:'158 小个子显高公式，我总结了整整 3 年', date:M(-5), aiSource:'deepseek',
       overall:'身份共鸣(158/小个子) + 时间背书(3年) + 单句核心公式，信任感与可记忆性双高',
       radar:{'选题角度':9,'标题钩子':9,'开头抓人':7,'内容结构':8,'情绪设计':6,'互动引导':7},
       formula:'人群共鸣(158小个子) → 时间背书(总结3年) → 单句核心结论 → 3 条法则展开 → 实用收尾',
       structureSteps:['人群共鸣：158 / 小个子 精确圈定受众','信任背书：总结了整整 3 年','一句话核心公式：上短下长，腰线提到肚脐以上','3 条法则展开（高腰裤/同色系/尖头鞋）','实用收尾：可复制可直接执行'],
       hookAnalysis:'「158」身份数字 + 「3 年」时间成本，双重锚点：让同身高的人觉得“这就是写给我看的”',
       angleIdeas:['162 的我也踩过这些显矮雷（反向避坑版）','微胖小个子怎么显高？3 个被低估的单品','把腰线提到肚脐以上之后，我拍照再也没 P 过腿'],
       interactionTips:['评论区征集身高+体重，做针对性选题','引导晒对比图，形成 UGC 素材'],
       riskNotes:[],
       src:'158 小个子显高公式，我总结了整整 3 年\n\n身高是硬伤，但比例是可以骗的。\n\n核心就一句：上短下长，腰线提到肚脐以上。\n\n短款外套 + 高腰裤 = 腿长立刻 +8cm\n同色系上下装 = 视觉不断层，显高又显瘦\n尖头鞋 > 圆头鞋，露脚背延长腿部线条',
       createdAt:new Date(Date.now()-5*864e5).toISOString()}
    ];
    return s;
  },
  /* 生成「带增长趋势」的每日数据，让复盘页折线图是上升的（说服力） */
  _genDemoDays(n, startV, endV){
    const days = [];
    for(let i=0;i<n;i++){
      const d = new Date(); d.setDate(d.getDate()-(n-1-i));
      const dow = (d.getDay()+6)%7;
      const p = n===1 ? 1 : i/(n-1);
      const base = startV + (endV-startV)*Math.pow(p, 1.7);      // 后期加速增长
      const v = Math.round(base * (0.84 + Math.sin(i/2.2)*0.10 + (dow>=4?0.13:0) + Math.random()*0.14));
      days.push({date:fmtDate(d), views:v, likes:Math.round(v*0.043), collects:Math.round(v*0.052), comments:Math.round(v*0.009), fans:Math.round(v*0.0041)});
    }
    return days;
  },

  /* ---------- 持久化（Autosave + 防抖 + 轻量状态） ---------- */
  save(showState){
    if(!FEATURES.autosave){ this._write({meta:this.meta,data:this.data}); return; }
    if(showState) this._setSaveState('正在保存…');
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(()=>{
      try{
        this.meta.updatedAt = new Date().toISOString();
        this._write({meta:this.meta, data:this.data});
        if(showState) this._setSaveState('已保存 ✓');
      }catch(e){
        Toast('保存失败：存储空间可能已满');
        if(showState) this._setSaveState('保存失败');
      }
    }, 260);
  },

  _write(pkg){
    try{ localStorage.setItem(this._key, JSON.stringify(pkg)); }
    catch(e){ Toast('存储空间已满，请导出备份后清理数据'); }
  },
  // 同步立即落盘（账号切换前必须调用，防止防抖保存未触发导致数据丢失）
  flush(){
    try{
      clearTimeout(this._saveTimer);
      this.meta.updatedAt = new Date().toISOString();
      this._write({meta:this.meta, data:this.data});
      // V6.28 数据云端备份：保存后自动同步到云端（1.5s 防抖），换设备/清缓存后自动恢复
      try{ if(typeof scheduleCloudBackup==='function') scheduleCloudBackup(this.data); }catch(e){}
    }catch(e){}
  },
  _readPackage(key){
    const raw = localStorage.getItem(key);
    if(!raw) return null;
    try{
      const pkg = JSON.parse(raw);
      if(pkg && pkg.meta && pkg.data) return pkg;
      // 裸数据（极端情况）也兼容
      return { meta:this._newMeta(1), data:pkg };
    }catch(e){ return null; }
  },
  _readRaw(key){
    const raw = localStorage.getItem(key);
    if(!raw) return null;
    try{ const d = JSON.parse(raw); return (d && d.meta && d.data)?d.data:d; }catch(e){ return null; }
  },
  _newMeta(schemaV){
    return {
      schemaVersion: schemaV,
      appVersion: VERSION.app,
      userDataVersion: VERSION.userData,
      channel: VERSION.channel,
      userId: 'local-user',
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  /* ---------- 自动备份（保留最近 6 份） ---------- */
  _backup(data, tag){
    try{
      const key = LS_BACKUP_PREFIX() + (tag||'auto') + '_' + Date.now();
      localStorage.setItem(key, JSON.stringify(data));
      const keys = Object.keys(localStorage).filter(k=>k.startsWith(LS_BACKUP_PREFIX())).sort();
      while(keys.length > 6){ localStorage.removeItem(keys.shift()); }
    }catch(e){}
  },
  _restoreLatestBackup(){
    try{
      const keys = Object.keys(localStorage).filter(k=>k.startsWith(LS_BACKUP_PREFIX())).sort();
      if(!keys.length) return null;
      const raw = localStorage.getItem(keys[keys.length-1]);
      const d = JSON.parse(raw);
      return (d && d.meta && d.data)?d.data:d;
    }catch(e){ return null; }
  },

  /* ---------- 轻量保存状态 ---------- */
  _setSaveState(text){
    const el = document.getElementById('saveState');
    if(el){
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(this._stateTimer);
      this._stateTimer = setTimeout(()=>el.classList.remove('show'), 1600);
    }
  },

  /* ---------- 辅助 ---------- */
  _genDays(an, n, baseV){
    const days = [];
    for(let i=0;i<n;i++){
      const d = new Date(); d.setDate(d.getDate()-(n-1-i));
      const dow = (d.getDay()+6)%7;
      const v = Math.round(baseV + Math.sin(i/3)*1800 + (dow>=4?1500:0) + (Math.random()-0.5)*1200);
      days.push({date:fmtDate(d), views:v, likes:Math.round(v*0.04), collects:Math.round(v*0.05), comments:Math.round(v*0.008), fans:Math.round(v*0.0028)});
    }
    an[n===30?'days30':'days90'] = days;
  },
  _daysBetween(a, b){
    return Math.max(0, Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00'))/864e5));
  },

  /* ---------- 导出 / 恢复（包含 meta，可跨设备迁移） ---------- */
  export(){
    return JSON.stringify({ meta:this.meta, data:this.data }, null, 2);
  },
  importJSON(text){
    try{
      const pkg = JSON.parse(text);
      if(!pkg.data || !pkg.data.topicPool) throw '格式不正确';
      this._backup(this.data, 'pre_import');
      this.data = this.migrateUserData(pkg.data, (pkg.meta&&pkg.meta.schemaVersion)||VERSION.schema);
      this.meta = pkg.meta || this._newMeta(VERSION.schema);
      this.meta.schemaVersion = VERSION.schema;
      this.meta.appVersion = VERSION.app;
      this.save();
      return true;
    }catch(e){ return false; }
  },

  /* ---------- 重置（危险操作，仅限开发/用户主动） ---------- */
  reset(){
    this._backup(this.data, 'manual_reset');
    localStorage.removeItem(this._key);
    this.load();
  }
};

/* V6.28 激活后自动恢复云端数据（换设备/清缓存后不再从零开始） */
let __restoreDone = false;
async function scheduleRestoreAfterActivate(){
  try{
    if(__restoreDone) return;
    const d = Store.data;
    if(!d) return;
    // 本机已有真实内容 → 不覆盖（防止误恢复覆盖新数据）
    const hasReal = (d.contents && d.contents.some(c=>c.status==='published' || (c.views||0)>0)) ||
                    (d.analytics && d.analytics.notes && d.analytics.notes.length) ||
                    (d.favorites && d.favorites.length) || (d.history && d.history.length) ||
                    (d.money && d.money.records && d.money.records.length);
    if(hasReal){ __restoreDone = true; return; }
    const r = await cloudRestore();
    if(r && r.ok && r.data){
      // 补全字段（用种子合并，保证结构完整）
      const seed = Store._seed ? JSON.parse(JSON.stringify(Store._seed())) : null;
      const merged = seed ? Object.assign({}, seed, r.data) : r.data;
      Store.data = merged;
      Store.flush();
      __restoreDone = true;
      Toast('☁️ 已自动恢复你的历史数据（'+fmtDate(new Date())+' 备份）');
      try{ render(); }catch(e){}
    } else {
      __restoreDone = true;
    }
  }catch(e){ __restoreDone = true; }
}

/* V6.28 手动备份/恢复 + 备份状态显示 */
async function manualCloudBackup(){
  const btn = event && event.target ? event.target : null;
  if(btn){ const old=btn.textContent; btn.textContent='备份中…'; setTimeout(()=>btn.textContent=old, 2500); }
  await cloudBackup(Store.data);
  Toast('☁️ 已备份到云端 ✅');
  refreshBackupStatus();
}
async function manualCloudRestore(){
  const st = getLicenseState();
  if(st.status !== 'activated'){ Toast('请先激活会员'); return; }
  if(!confirm('将从云端恢复你的历史数据并覆盖当前内容，确定继续吗？')) return;
  const r = await cloudRestore();
  if(r && r.ok && r.data){
    const seed = Store._seed ? JSON.parse(JSON.stringify(Store._seed())) : null;
    Store.data = seed ? Object.assign({}, seed, r.data) : r.data;
    Store.flush();
    Toast('☁️ 已从云端恢复 ✅');
    setTimeout(()=>{ try{ render(); }catch(e){} }, 200);
  } else if(r && r.ok && !r.data){
    Toast('云端暂无备份，可先「立即备份」');
  } else {
    Toast('恢复失败，请检查网络');
  }
  refreshBackupStatus();
}
function refreshBackupStatus(){
  const el = document.getElementById('backupStatus');
  if(!el) return;
  const last = localStorage.getItem('xhs_last_backup');
  const st = getLicenseState();
  if(st.status !== 'activated'){ el.innerHTML = '未激活会员，激活后自动开启云端备份。'; return; }
  el.innerHTML = last
    ? '✅ 云端备份已开启 · 上次自动备份：<b>'+new Date(last).toLocaleString('zh-CN',{hour12:false})+'</b>'
    : '🔄 云端备份已开启，正在等待首次自动备份…（数据有改动后自动同步）';
}

/* ================= Crazy Friday. 线性图标系统 ================= */
/* ================= V6.51 分类聚合：用户自定义 + 历史/内容库/赛道建议 ================= */
const CAT_DEFAULT = ['美妆','穿搭','数码','美食','母婴','旅行','健身','家居','职场','学习','情感','宠物','健康','摄影','AI工具','个人IP'];
function catOptions(){
  const set = new Set(CAT_DEFAULT);
  try{
    const d = (typeof Store!=='undefined' && Store.data) ? Store.data : null;
    if(d){
      if(d.userProfile && d.userProfile.accountType) set.add(d.userProfile.accountType);
      (d.schedule||[]).forEach(function(s){ if(s.cat) set.add(s.cat); });
      (d.contents||[]).forEach(function(c){ if(c.cat) set.add(c.cat); });
      (d.topicPool||[]).forEach(function(t){ if(t.cat) set.add(t.cat); });
      (d.personas||[]).forEach(function(p){ if(p.industry) set.add(p.industry); });
    }
  }catch(e){}
  return Array.from(set);
}


const ICONS = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  compass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 9 11l4 4 8-8"/><path d="M14 7h6v6"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3-3 5-3 8a3 3 0 0 0 6 0c0-1-.5-2-1-3 2 1 4 3 4 6a6 6 0 0 1-12 0c0-4 3-7 6-11z"/></svg>',
  pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  steth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v6a7 7 0 0 0 14 0V3"/><path d="M5 3H3.5M19 3h1.5M12 16v2a4 4 0 0 0 8 0v-1"/><circle cx="19" cy="10" r="2"/></svg>',
  crosshair:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2"/></svg>',
  wrench:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4L15 12l-3-3z"/></svg>',
  bulb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.4 1.5 2.1h4c0-.7.7-1.5 1.5-2.1A6 6 0 0 0 12 3z"/></svg>',
  archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.4l6.1-.9z"/></svg>',
  briefcase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 13H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  news:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5v14a2 2 0 0 0 2 2h13V5H6a2 2 0 0 0-2 2zM20 5H6"/></svg>',
  crown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  grid:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/></svg>',
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 12h11.2L21 7H6"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};
function applyIcons(){
  $$('.nav-ico[data-icon]').forEach(el=>{
    const svg = ICONS[el.dataset.icon];
    if(svg) el.innerHTML = svg;
  });
  $$('.nav-ico, .tab-ico, .md-ico').forEach(el=>{ el.style.display='flex'; el.style.alignItems='center'; });
}


/* ================= 全局搜索（真正可用） ================= */
function openGlobalSearch(){
  Modal.open('🔍 全局搜索', `
    <div class="form-group"><input id="gsearchInput" placeholder="搜索内容 / 选题 / 素材 / 灵感 / 排期 / 对标账号…" autocomplete="off"></div>
    <div id="gsearchResults"><div class="empty" style="padding:16px">输入关键词开始搜索</div></div>`);
  $('#gsearchInput').addEventListener('input', doGlobalSearch);
  setTimeout(()=>{ const el=$('#gsearchInput'); if(el) el.focus(); }, 60);
}
function doGlobalSearch(){
  const kw = $('#gsearchInput').value.trim().toLowerCase();
  const box = $('#gsearchResults');
  if(!kw){ box.innerHTML = '<div class="empty" style="padding:16px">输入关键词开始搜索</div>'; return; }
  const d = Store.data;
  // V6.48 GitHub 开源 Fuse.js：模糊搜索（错字/漏字/部分匹配都能命中），无库时降级精确匹配
  function fuzzyFind(list, keys){
    const arr = list || [];
    if(window.Fuse && kw.length >= 1){
      try{
        const fuse = new Fuse(arr, {keys: keys, threshold:0.45, ignoreLocation:true, minMatchCharLength:1});
        return fuse.search(kw).slice(0, 8).map(function(r){ return r.item; });
      }catch(e){ /* fallback */ }
    }
    const k = String(kw).toLowerCase();
    return arr.filter(function(x){ return keys.some(function(key){ return String(x[key]||'').toLowerCase().indexOf(k) >= 0; }); });
  }
  const groups = [];
  const contents = fuzzyFind(d.contents, ['title','cat','body']);
  if(contents.length) groups.push({title:'内容库', items:contents.map(x=>({t:x.title, sub:x.cat+' · '+x.date, act:"navigate('library')"}))});
  const topics = fuzzyFind(d.topicPool, ['title','cat']);
  if(topics.length) groups.push({title:'选题', items:topics.map(x=>({t:x.title, sub:x.cat+' · 热度 '+x.heat, act:"navigate('topics')"}))});
  const assets = fuzzyFind(d.assets, ['name','body','type']);
  if(assets.length) groups.push({title:'素材', items:assets.map(x=>({t:x.name, sub:x.type+' · '+x.date, act:"navigate('assets')"}))});
  const ideas = fuzzyFind(d.ideas, ['title','content','tag']);
  if(ideas.length) groups.push({title:'灵感', items:ideas.map(x=>({t:x.title, sub:x.tag||'', act:"navigate('ideas')"}))});
  const sched = fuzzyFind(d.schedule, ['title','cat']);
  if(sched.length) groups.push({title:'排期', items:sched.map(x=>({t:x.title, sub:x.date, act:"navigate('schedule')"}))});
  const bm = fuzzyFind(d.benchmarks, ['name','link','industry']);
  if(bm.length) groups.push({title:'对标账号', items:bm.map(x=>({t:x.name, sub:'粉丝 '+x.fans, act:"navigate('benchmark')"}))});
  if(!groups.length){
    box.innerHTML = '<div class="empty" style="padding:16px">没有找到与「'+esc(kw)+'」相关的内容</div>';
    return;
  }
  box.innerHTML = groups.map(g=>`
    <div style="font-size:12px;font-weight:700;color:var(--text3);margin:10px 0 6px">${g.title} · ${g.items.length}</div>
    ${g.items.slice(0,4).map(it=>`
    <div class="gs-item" onclick="Modal.close();${it.act}">
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.t)}</div><div style="font-size:11px;color:var(--text3)">${it.sub}</div></div>
      <span style="font-size:11px;color:var(--text3)">→</span>
    </div>`).join('')}
  `).join('');
}

/* ================= 移动端 Drawer（我的） ================= */
function openMobileDrawer(){
  $('#drawerMask').style.display = 'block';
  $('#mobileDrawer').classList.add('open');
  document.body.classList.add('no-scroll');
}
function closeMobileDrawer(){
  $('#drawerMask').style.display = 'none';
  $('#mobileDrawer').classList.remove('open');
  document.body.classList.remove('no-scroll');
}
function mdNav(page){
  closeMobileDrawer();
  navigate(page);
}

/* ================= V5.6 ⌘K 命令面板 ================= */
const COMMANDS = [
  {i:'🔍', n:'去选题雷达',         act:"navigate('topics')",        cat:'导航'},
  {i:'📈', n:'去今日热门',         act:"navigate('trending')",      cat:'导航'},
  {i:'🔥', n:'去爆款拆解',         act:"navigate('viral')",         cat:'导航'},
  {i:'✍️', n:'去AI创作中心',        act:"navigate('create')",        cat:'导航'},
  {i:'📅', n:'去发布计划',         act:"navigate('schedule')",      cat:'导航'},
  {i:'📊', n:'去数据复盘',         act:"navigate('analytics')",     cat:'导航'},
  {i:'🏥', n:'去账号诊断',         act:"navigate('diagnosis')",     cat:'导航'},
  {i:'🎯', n:'去对标账号',         act:"navigate('benchmark')",     cat:'导航'},
  {i:'💰', n:'去变现管理',         act:"navigate('money')",         cat:'导航'},
  {i:'🔧', n:'去运营工具箱',        act:"navigate('toolbox')",       cat:'导航'},
  {i:'🩺', n:'发布前检查台（标题/正文打分）', act:'openPreCheckStation()', cat:'操作'},
  {i:'🎭', n:'博主风格分析 + 融合改写（NEW）', act:'openBloggerStyle()',    cat:'操作'},
  {i:'💡', n:'去灵感笔记',         act:"navigate('ideas')",         cat:'导航'},
  {i:'🗂️', n:'去内容库',           act:"navigate('library')",       cat:'导航'},
  {i:'⭐', n:'去灵感收藏夹',        act:"navigate('favorites')",     cat:'导航'},
  {i:'🏠', n:'去工作台首页',        act:"navigate('dashboard')",     cat:'导航'},
  {i:'💬', n:'问 AI 运营助理',       act:'openSidekick()',             cat:'操作'},
  {i:'📝', n:'记录一条灵感',         act:'openIdeaAdd()',              cat:'操作'},
  {i:'📅', n:'新建一个发布计划',      act:'openPlanAdd()',              cat:'操作'},
  {i:'📊', n:'录入一篇笔记数据',     act:'openDataEntry()',            cat:'操作'},
  {i:'📥', n:'粘贴导入数据（批量）',   act:'openDataPaste()',            cat:'操作'},
  {i:'⚡', n:'一键生成 7 天内容计划',  act:'openWeekPlan()',             cat:'操作'},
  {i:'🧐', n:'AI 笔记评审',         act:'openNoteReview()',          cat:'操作'},
  {i:'📋', n:'生成运营周报',         act:'openWeeklyReport()',         cat:'操作'},
  {i:'💾', n:'导出我的所有数据',      act:'exportData()',               cat:'操作'},
  {i:'💰', n:'记录一笔收益',         act:'openIncomeAdd()',            cat:'操作'},
  {i:'⚙️', n:'打开设置中心',         act:"navigate('settings')",      cat:'系统'},
  {i:'👑', n:'打开会员中心',         act:"navigate('membership')",    cat:'系统'},
  {i:'❓', n:'打开帮助与常见问题',    act:"navigate('help')",          cat:'系统'},
  {i:'🛡️', n:'查看隐私与数据条款',   act:'openLegal()',                cat:'系统'},
  {i:'📋', n:'查看版本更新记录',     act:'openUpdateLog()',            cat:'系统'},
  {i:'📲', n:'扫码打开本工作台（分享用）', act:'openShareQr()',            cat:'系统'},
  {i:'🌙', n:'切换深色 / 浅色主题',   act:"document.body.classList.toggle('dark'); localStorage.setItem('xhs_theme', document.body.classList.contains('dark')?'dark':'light');", cat:'系统'},
  {i:'➕', n:'快速新建（写作/选题/爆款/灵感/发布/数据/素材/会员）', act:'openQuickCreate()', cat:'操作'}
];
let CMD_FILTER = '';
let CMD_SEL = 0;
function openCommandPalette(){
  Modal.open('⌘K 命令面板', `
    <div class="cmd-search-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:var(--text3)"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="cmdInput" placeholder="输入搜索或命令…（跳转/操作/内容）" autocomplete="off">
      <span class="cmd-hint">esc 关闭</span>
    </div>
    <div class="cmd-list" id="cmdList"></div>
    <div class="cmd-foot">↑↓ 选择 · Enter 执行 · ⌘K 再次打开</div>`);
  const inp = $('#cmdInput');
  setTimeout(()=>{ if(inp) inp.focus(); }, 50);
  inp && inp.addEventListener('input', e=>{ CMD_FILTER=e.target.value.toLowerCase().trim(); CMD_SEL=0; renderCmdList(); });
  inp && inp.addEventListener('keydown', e=>{
    const items = filteredCmds();
    if(e.key==='ArrowDown'){ e.preventDefault(); CMD_SEL=Math.min(CMD_SEL+1, items.length-1); renderCmdList(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); CMD_SEL=Math.max(CMD_SEL-1, 0); renderCmdList(); }
    else if(e.key==='Enter'){ e.preventDefault(); if(items[CMD_SEL]) runCmd(items[CMD_SEL]); }
    else if(e.key==='Escape'){ Modal.close(); }
  });
  renderCmdList();
}
function filteredCmds(){
  const d = Store.data;
  const items = [];
  COMMANDS.forEach(c => items.push({...c, kind:'cmd'}));
  if(!CMD_FILTER){
    // 显示分组（每个分类 4-5 个）
    return items;
  }
  const k = CMD_FILTER;
  const match = (s)=>String(s||'').toLowerCase().includes(k);
  // 匹配命令
  items.filter(c=>match(c.n)).forEach(c=>items.push(c));
  // 匹配内容/选题/灵感
  d.contents.slice(0,30).forEach(x=>{ if(match(x.title)||match(x.cat)) items.push({i:'📄', n:x.title, sub:x.cat+' · '+x.date, act:"navigate('library')", kind:'content'}); });
  d.topicPool.slice(0,30).forEach(x=>{ if(match(x.title)||match(x.cat)) items.push({i:'💡', n:x.title, sub:x.cat+' · 热度 '+x.heat, act:"openTopicDetail('"+x.id+"')", kind:'topic'}); });
  d.ideas.slice(0,30).forEach(x=>{ if(match(x.title)||match(x.content)) items.push({i:'💡', n:x.title, sub:'灵感 · '+(x.tag||''), act:"navigate('ideas')", kind:'idea'}); });
  d.assets.slice(0,30).forEach(x=>{ if(match(x.name)) items.push({i:'📁', n:x.name, sub:'素材 · '+x.type, act:"navigate('assets')", kind:'asset'}); });
  return items;
}
function renderCmdList(){
  const items = filteredCmds();
  const box = $('#cmdList'); if(!box) return;
  if(!items.length){
    box.innerHTML = '<div class="cmd-empty">没有匹配的命令或内容</div>';
    return;
  }
  // 分组渲染
  const groups = {};
  items.forEach(it=>{ (groups[it.kind]=groups[it.kind]||[]).push(it); });
  const kindLabel = {cmd:'操作', content:'内容', topic:'选题', idea:'灵感', asset:'素材'};
  let html = '';
  let idx = 0;
  Object.entries(groups).forEach(([k,arr])=>{
    html += '<div class="cmd-group-title">'+kindLabel[k]+'</div>';
    arr.forEach(c=>{
      html += '<div class="cmd-item '+(idx===CMD_SEL?'selected':'')+'" onclick="runCmdByIdx('+idx+')" onmouseenter="CMD_SEL='+idx+';document.querySelectorAll(\'.cmd-item\').forEach((e,i)=>e.classList.toggle(\'selected\', i==='+idx+'))"><span class="cmd-ico">'+c.i+'</span><div style="flex:1;min-width:0"><div class="cmd-n">'+esc(c.n)+'</div>'+(c.sub?'<div class="cmd-sub">'+esc(c.sub)+'</div>':'')+'</div><span class="cmd-cat">'+esc(c.cat||'')+'</span></div>';
      idx++;
    });
  });
  box.innerHTML = html;
  // 滚动到选中项
  const sel = box.querySelector('.cmd-item.selected');
  if(sel) sel.scrollIntoView({block:'nearest'});
}
function runCmd(c){
  Modal.close();
  setTimeout(()=>{ try{ eval(c.act); }catch(e){ console.error(e); } }, 80);
}
function runCmdByIdx(idx){
  const items = filteredCmds();
  if(items[idx]) runCmd(items[idx]);
}

/* ================= 全局 Quick Create ================= */
function openQuickCreate(){
  Modal.open('＋ 快速新建', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${[
        {i:'✍️', n:'写一篇笔记', act:"navigate('create')"},
        {i:'🔍', n:'找一个选题', act:"navigate('topics')"},
        {i:'🔥', n:'拆一个爆款', act:"navigate('viral')"},
        {i:'💡', n:'记录灵感', act:"openIdeaAdd()"},
        {i:'📅', n:'安排发布', act:"openPlanAdd()"},
        {i:'📊', n:'录入数据', act:"openDataEntry()"},
        {i:'📁', n:'添加素材', act:"openAssetAdd()"},
        {i:'👑', n:'查看会员', act:"navigate('membership')"}
      ].map(a=>`<div class="qc-item" onclick="Modal.close();${a.act}"><span class="qc-ico">${a.i}</span><span>${a.n}</span></div>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:12px;text-align:center">⌘K 也可以打开快捷命令</div>`);
}
/* ================= 工具函数 ================= */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmtDate(d){ const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function todayStr(){ return fmtDate(new Date()); }
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d; }
function fmtNum(n){ return n>=10000 ? (n/10000).toFixed(1)+'w' : n>=1000 ? (n/1000).toFixed(1)+'k' : String(n); }
function uid(){ return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function Toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2000); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function todayOfWeek(){ return (new Date().getDay()+6)%7; }
function weekdayOf(ds){ const d=new Date(ds+'T12:00:00'); return (d.getDay()+6)%7; }

/* ================= AI 生成引擎（规则+模板） ================= */
const AI = {
  genTitles(kw, cat){
    const W = T.titleWords; const out = [];
    for(let i=0;i<20;i++){
      const t = pick(T.titleTemplates);
      const title = t.tpl
        .replaceAll('{n}', pick(W.n)).replaceAll('{kw}', kw)
        .replaceAll('{benefit}', pick(W.benefit)).replaceAll('{verb}', pick(W.verb))
        .replaceAll('{do}', pick(W.do)).replaceAll('{reason}', pick(W.reason))
        .replaceAll('{verb_wrong}', pick(W.verb_wrong)).replaceAll('{mon}', pick(W.mon))
        .replaceAll('{time}', pick(W.time)).replaceAll('{place}', pick(W.place));
      out.push({title, tone:t.tone});
    }
    const seen=new Set(); const uniq=[];
    out.forEach(o=>{ if(!seen.has(o.title)){ seen.add(o.title); uniq.push(o);} });
    return uniq.slice(0,12);
  },
  genBody(scene, kw, cat, mood){
    const tb = T.bodyTemplates[scene];
    const W = T.titleWords;
    const f = s => s.replaceAll('{kw}', kw).replaceAll('{cat}', cat)
      .replaceAll('{time}', pick(W.time)).replaceAll('{n}', pick(W.n))
      .replaceAll('{user}', pick(T.users)).replaceAll('{core}', kw+'基本功');
    const em = () => pick(T.emojis);
    const hook = f(pick(tb.hooks));
    const mid = f(pick(tb.middles));
    const point1 = f(pick(tb.points)); const point2 = f(pick(tb.points));
    const end = f(pick(tb.endings));
    const moodLine = mood==='走心' ? '分享这些真实的感受，不求所有人都懂，只愿懂的人共鸣。'
      : mood==='专业' ? '以上内容基于长期实操和数据记录整理，请放心参考。'
      : mood==='种草' ? '好东西就要大声安利，跟着买不会错。'
      : mood==='活泼' ? '嘻嘻，看完记得收藏，下次直接抄作业～'
      : mood==='真诚' ? '真实分享，不带货不吹牛，纯个人体验，希望对你有用。'
      : '纯干货无废话，信息密度拉满，收藏慢慢看。';
    const paras = [
      `${hook}${em()}`,
      `${mid}`,
      `${em()} ${point1}`,
      `${em()} ${point2}`,
      `${moodLine}`,
      `${end}`,
      `#${kw} #${cat} #干货分享 #我的生活碎片`
    ];
    return paras.join('\n\n');
  },
  genHook(kw){ return pick(['你还在为'+kw+'发愁吗？','关于'+kw+'，90% 的人都想错了',''+kw+'这件事，越早知道越好','别再踩'+kw+'的坑了','分享一个'+kw+'的好办法']); },
  rewrite(text, style){
    const styles = {
      '简洁': [['个人认为','我觉得'],['真的非常','很'],['超级','很'],['完完全全','完全'],['首先','第一'],['总而言之','总之']],
      '口语化': [['首先','其实吧'],['其次','再说'],['我认为','我觉得'],['此外','另外'],['综上','反正'],['因此','所以说'],['非常重要','贼重要'],['非常','贼']],
      '正式': [['其实吧','首先'],['我觉得','笔者认为'],['贼','非常'],['很赞','值得肯定'],['真的','确实'],['反正','因此']]
    };
    let r = text; (styles[style]||styles['简洁']).forEach(([a,b])=>{ if(r.includes(a)) r = r.split(a).join(b); });
    return '【'+style+'版】\n'+r;
  }
};

/* ================= 弹窗 ================= */
const Modal = {
  open(title, html, wide){ $('#modalTitle').textContent=title; $('#modalBody').innerHTML=html; $('#modal').style.display='flex'; $('#modalMask').style.display='block'; if(wide){$('#modal').style.width='min(720px,calc(100vw - 32px))';} },
  close(){ $('#modal').style.display='none'; $('#modalMask').style.display='none'; }
};

/* ================= 导航 ================= */
const PageMeta = {
  dashboard:{t:'工作台首页'}, features:{t:'功能地图'}, publish:{t:'图文发布'}, topics:{t:'选题雷达'}, trending:{t:'今日热门'}, viral:{t:'爆款拆解'}, create:{t:'AI创作中心'},
  schedule:{t:'发布计划'}, analytics:{t:'数据复盘'}, assets:{t:'素材管理'},
  diagnosis:{t:'账号诊断'}, benchmark:{t:'对标账号'}, toolbox:{t:'运营工具箱'}, ideas:{t:'灵感笔记'}, money:{t:'变现管理'}, vmoney:{t:'变现商业'}, vreport:{t:'变现日报'},
  library:{t:'内容库'}, favorites:{t:'灵感收藏夹'}, membership:{t:'会员中心'}, settings:{t:'设置中心'}, help:{t:'帮助与常见问题'},
  shop:{t:'电商带货中心'}
};
let currentPage = 'dashboard';

function navigate(page){
  if($('#mobileDrawer') && $('#mobileDrawer').classList.contains('open')) closeMobileDrawer();
  currentPage = page;
  $('#topbarTitle').textContent = (PageMeta[page]||{t:'工作台'}).t;
  $$('.nav-item, .tab-item, .bt-item').forEach(function(el){el.classList.toggle('active', el.dataset.page===page);});
  $('#sidebar').classList.remove('open'); $('#mask').classList.remove('show');
  render();
  window.scrollTo({top:0});
  updateBadges();
  // V6.19 App 感：页面切换淡入（不闪烁）
  const content = document.getElementById('content');
  if(content){
    content.classList.remove('page-fade');
    void content.offsetWidth; // 重触发动画
    content.classList.add('page-fade');
  }
  // V6.22 顶部加载进度条（App 感）
  const lb = document.getElementById('pageLoadBar');
  if(lb){
    lb.classList.remove('show');
    void lb.offsetWidth;
    lb.classList.add('show');
    setTimeout(()=>{ lb.classList.remove('show'); }, 950);
  }
}
function updateBadges(){
  const fav = Store.data.favorites.length;
  $('#navBadgeTopics').textContent = fav; $('#navBadgeTopics').style.display = fav?'flex':'none';
  const pending = Store.data.schedule.filter(s=>s.status==='ready').length;
  // V6.32：今天该发的优先显示，逾期/今日待发用红色角标提醒
  const t = todayStr();
  const dueNow = Store.data.schedule.filter(s=>s.status!=='published' && s.date<=t).length;
  const bS = $('#navBadgeSchedule');
  bS.textContent = dueNow || pending;
  bS.style.display = (dueNow||pending)?'flex':'none';
  bS.classList.toggle('hot', dueNow>0);
  bS.title = dueNow ? ('今天有 '+dueNow+' 条待发/逾期内容') : (pending+' 条待发内容');
  const hist = Store.data.history.length;
  $('#tabBadgeCreate').textContent = Math.min(hist,9); $('#tabBadgeCreate').style.display = hist?'flex':'none';
  // V6.24 开箱即用：检查 AI 是否已就绪（卖家统一 Key 已配置 → 绿灯）
  if(!window.__aiReadyChecked){
    window.__aiReadyChecked = true;
    checkAiReady();
  }
}
async function checkAiReady(){
  try{
    if(LIC_STATE.status !== 'activated') return;
    const base = cfCloudBase(); if(!base) return;
    const j = await (await fetch(base + '/api/ai-ready', { cache:'no-store' })).json();
    const el = document.getElementById('aiReady');
    if(el){
      if(j && j.ok && j.ready){
        el.style.display = 'flex';
        el.title = 'AI 已就绪，开箱即用（每日免费额度 '+ (j.quota||30) +' 次）';
      } else {
        el.style.display = 'none';
      }
    }
  }catch(e){}
}
function updateSidebar(){
  const brand = localStorage.getItem('xhs_brand') || 'Crazy Friday.';
  const sub = Store.data.subscription || {};
  // 优先展示激活码授权的真实状态（避免「已激活却显示已到期」），无授权时用产品内订阅数据兜底
  const lic = (LIC_STATE && LIC_STATE.status==='activated') ? LIC_STATE : null;
  if($('#userName')) $('#userName').textContent = brand;
  // 侧栏/抽屉头像改为纯装饰：不再写入首字母（避免任何 C/F 字母标识）
  if($('#subPlanName')) $('#subPlanName').textContent = (lic && lic.plan) || sub.planName || '年度会员';
  if($('#subExpire')) $('#subExpire').textContent = (lic && lic.expireAt) || sub.expireAt || '--';
  if($('#subDays')) $('#subDays').textContent = (lic && lic.remain!==undefined) ? lic.remain : (sub.remainDays===undefined?'--':sub.remainDays);
}

/* ================= Today 运营驾驶舱（V5） ================= */
let todayFocus = JSON.parse(localStorage.getItem('xhs_today_focus')||'[false,false,false,false]');
function get7DayProgress(){
  return JSON.parse(localStorage.getItem('xhs_onboard7')||'[]');
}
function toggle7DayTask(idx){
  const arr = get7DayProgress();
  const today = new Date();
  const day = Math.min(Math.floor((Date.now() - (Store.data.activatedAt ? new Date(Store.data.activatedAt).getTime() : Date.now()))/864e5)+1, 7);
  if(!arr[day-1]) arr[day-1] = [];
  if(arr[day-1].includes(idx)) arr[day-1] = arr[day-1].filter(x=>x!==idx);
  else arr[day-1].push(idx);
  localStorage.setItem('xhs_onboard7', JSON.stringify(arr));
  renderDashboard();
}
function check7DayAutoComplete(){
  // 自动检测用户行为完成情况
  const d = Store.data;
  const today = new Date();
  const activated = Store.data.activatedAt || today.toISOString();
  const day = Math.min(Math.floor((today - new Date(activated))/864e5)+1, 7);
  if(day<1) return [];
  const tasks = [
    {n:'完成账号类型设置', check: ()=> !!(d.userProfile && d.userProfile.onboarded), i:'1f4dd'},
    {n:'收藏 3 个选题',      check: ()=> d.favorites.length >= 3,            i:'3a72b'},
    {n:'用 AI 创作 1 篇内容',  check: ()=> d.contents.length >= 1,            i:'19fa3'},
    {n:'加入发布计划',         check: ()=> d.schedule.length >= 1,            i:'3b2e1'},
    {n:'创建第 1 条素材',      check: ()=> d.assets.length >= 1,             i:'7e8c4'},
    {n:'发布第 1 篇笔记',      check: ()=> d.contents.some(c=>c.status==='published'), i:'9f1d6'},
    {n:'录入数据 + 复盘',      check: ()=> d.analytics.notes.length >= 1,   i:'5b9e2'}
  ];
  return tasks;
}
/* ================= V6.28 智能今日建议（活体助手：每天根据真实数据生成建议） ================= */
/* V6.28 新手引导条（激活后第一次进首页显示；点关闭永久不再打扰） */
function introGuideBar(){
  try{
    if(LIC_STATE.status !== 'activated') return '';
    if(localStorage.getItem('xhs_intro_v1') === '1') return '';
    // V6.50 老用户抑制：已有历史数据不再显示新手引导（不冒充新用户）
    const _d0 = Store.data;
    if(_d0.contents.length > 1 || _d0.schedule.length > 1 || (_d0.analytics.notes||[]).length > 1){
      localStorage.setItem('xhs_intro_v1','1'); return '';
    }
    return `<div class="intro-bar" id="introBar">
      <div class="ib-head">
        <span class="ib-title">👋 欢迎使用！3 步快速上手</span>
        <span class="ib-close" onclick="closeIntroBar()" title="不再显示">✕</span>
      </div>
      <div class="ib-steps">
        <div class="ib-step" onclick="openBrandEdit()"><span class="ib-n">1</span><span class="ib-t">改成你的名字</span><span class="ib-d">首页问候语显示你自己的品牌</span><span class="ib-go">去改 ›</span></div>
        <div class="ib-step" onclick="navigate('features')"><span class="ib-n">2</span><span class="ib-t">看看全部功能</span><span class="ib-d">20+ 模块一览，点哪儿去哪儿</span><span class="ib-go">去看 ›</span></div>
        <div class="ib-step" onclick="navigate('create')"><span class="ib-n">3</span><span class="ib-t">试一次 AI 创作</span><span class="ib-d">输入主题，一篇笔记 30 秒生成</span><span class="ib-go">去试 ›</span></div>
      </div>
    </div>`;
  }catch(e){ return ''; }
}
function closeIntroBar(){
  try{ localStorage.setItem('xhs_intro_v1', '1'); }catch(e){}
  const el = document.getElementById('introBar');
  if(el){ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>{ if(el) el.remove(); }, 300); }
}

function buildSmartTips(d){  try{
    const tips = [];
    const today = todayStr();
    // 规则 1：昨日发布过内容 → 提醒看数据（新内容刚发布）
    const yesterday = new Date(Date.now()-864e5);
    const yStr = yesterday.getFullYear()+'-'+String(yesterday.getMonth()+1).padStart(2,'0')+'-'+String(yesterday.getDate()).padStart(2,'0');
    const yPub = (d.contents||[]).filter(c=>c.status==='published' && c.date===yStr);
    if(yPub.length){
      const totalViews = yPub.reduce((a,b)=>a+(b.views||0),0);
      tips.push({ico:'si-green', icon:'📈', txt:`昨天发的 <b>${yPub.length}</b> 篇笔记已累计曝光 <b>${fmtNum(totalViews)}</b>，看看表现如何？`, act:"navigate('analytics')", go:'去复盘'});
    }
    // 规则 2：有排期待发布 → 今天要发
    const pendingReady = (d.schedule||[]).filter(s=>s.status==='ready' && s.date<=today).length;
    if(pendingReady>0){
      tips.push({ico:'si-orange', icon:'⏰', txt:`有 <b>${pendingReady}</b> 条排期内容<b>今天到期</b>，记得发布`, act:"navigate('schedule')", go:'去排期'});
    } else {
      const pendingAll = (d.schedule||[]).filter(s=>s.status==='ready').length;
      if(pendingAll>0) tips.push({ico:'si-blue', icon:'📅', txt:`排期里有 <b>${pendingAll}</b> 条待发布，建议今天安排 1 条`, act:"navigate('schedule')", go:'去排期'});
    }
    // 规则 3：今天还没创作 → 提醒创作（若今天日期没有已发布/草稿）
    const todayDrafts = (d.contents||[]).filter(c=>c.date===today && (c.status==='draft'||c.status==='ready'||c.status==='published'));
    if(!todayDrafts.length && !pendingReady){
      tips.push({ico:'si-red', icon:'✍️', txt:'今天还没有开始创作，写 1 篇，离目标更近一步', act:"navigate('create')", go:'去创作'});
    }
    // 规则 4：最佳笔记可做续集
    const best = (d.analytics&&d.analytics.notes||[]).slice().sort((a,b)=>(b.score||0)-(a.score||0))[0];
    if(best && (best.score||0)>=80){
      tips.push({ico:'si-purple', icon:'🚀', txt:`你的 <b>${esc(best.title)}</b> 爆款分 <b>${best.score}</b>，值得做续集或衍生内容`, act:"navigate('viral')", go:'去拆解'});
    }
    // 规则 5：本周进度提醒
    const done = (d.schedule||[]).filter(s=>s.status==='published').length;
    if(done>=3 && done<6){
      tips.push({ico:'si-blue', icon:'🎯', txt:`本周已发布 <b>${done}</b> 篇，离周目标还差 <b>${Math.max(0,7-done)}</b> 篇`, act:"navigate('schedule')", go:'看排期'});
    }
    // 规则 6：收藏夹有选题未用
    const favs = d.favorites||[];
    if(favs.length>=2){
      tips.push({ico:'si-orange', icon:'⭐', txt:`收藏夹里有 <b>${favs.length}</b> 个选题等待使用，挑一个开始吧`, act:"navigate('favorites')", go:'去选题'});
    }
    // 兜底：没数据时给引导
    if(!tips.length){
      tips.push({ico:'si-green', icon:'🌱', txt:'录入第一篇笔记数据，AI 就会开始为你生成专属建议', act:"navigate('analytics')", go:'去录入'});
    }
    return tips.slice(0, 3); // 最多 3 条，不打扰
  }catch(e){ return []; }
}
function smartTipCard(tips){
  // 每天只显示一次（当天关闭后不再打扰）
  const closeDate = localStorage.getItem('xhs_smart_tip_closed');
  if(closeDate === todayStr()) return '';
  const hour = new Date().getHours();
  const period = hour<6?'深夜':hour<12?'早上':hour<18?'下午':'晚上';
  const timeTxt = period + '好，这是为你生成的今日建议';
  return `<div class="smart-tip" id="smartTipCard">
    <span class="st-close" onclick="closeSmartTip()" title="今日不再提醒">✕</span>
    <div class="smart-tip-head">
      <div class="smart-tip-title"><span class="st-badge">AI 智能建议</span>${timeTxt}</div>
      <span class="smart-tip-time">${new Date().getHours()+':'+String(new Date().getMinutes()).padStart(2,'0')}</span>
    </div>
    <div class="smart-tip-list">
      ${tips.map(t=>`
      <div class="st-item" onclick="${t.act}">
        <span class="st-ico ${t.ico}">${t.icon}</span>
        <span class="st-text">${t.txt}</span>
        <span class="st-go">${t.go} →</span>
      </div>`).join('')}
    </div>
  </div>`;
}
function closeSmartTip(){
  localStorage.setItem('xhs_smart_tip_closed', todayStr());
  const el = document.getElementById('smartTipCard');
  if(el) el.style.display = 'none';
  Toast('已隐藏，明天再见 👋');
}
function render7DayCard(){
  if(LIC_STATE.status !== 'activated') return '';
  // V6.50 老用户抑制：已有真实运营数据（2 条以上内容/排期/复盘）不显示新手 7 天引导卡
  const _d = Store.data;
  if(_d.contents.length > 1 || _d.schedule.length > 1 || (_d.analytics.notes||[]).length > 1) return '';
  const tasks = check7DayAutoComplete();
  const today = new Date();
  const activated = Store.data.activatedAt || today.toISOString();
  const day = Math.min(Math.floor((today - new Date(activated))/864e5)+1, 7);
  const done = tasks.filter(t=>t.check()).length;
  const pct = Math.round(done / tasks.length * 100);
  if(done >= tasks.length) return ''; // 全部完成不显示
  return '<div class="card onb7-card">' +
    '<div class="onb7-head">' +
      '<div><div class="onb7-title">新手 7 天引导</div><div class="onb7-sub">Day '+day+' / 7 · 已完成 '+done+'/'+tasks.length+' · 获得持续运营能力</div></div>' +
      '<div class="onb7-pct">'+pct+'%</div>' +
    '</div>' +
    '<div class="onb7-bar"><i style="width:'+pct+'%"></i></div>' +
    '<div class="onb7-list">' +
      tasks.map((t,i)=>{
        const ck = t.check();
        return '<div class="onb7-task '+(ck?'done':'')+'" onclick="toggle7DayTask('+i+')">' +
          '<span class="onb7-cb">'+(ck?'✓':'')+'</span>' +
          '<span class="onb7-n">'+t.n+'</span>' +
          (ck?'<span class="onb7-tag">已完成</span>':'<span class="onb7-go">去完成 →</span>') +
        '</div>';
      }).join('') +
    '</div>' +
  '</div>';
}
function predictMonthlyIncome(){
  // 基于历史数据预测本月收益
  const d = Store.data;
  const inc = d.money.records.reduce((a,b)=>a+(+b.income||0),0);
  const records = d.money.records;
  if(records.length<1) return null;
  // 取最近 30 天的记录
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
  const recent = records.filter(r=>{
    // r.date 格式 MM-DD 或 YYYY-MM-DD
    if(r.date.length===5) return true; // 当年
    return new Date(r.date) >= cutoff;
  });
  if(recent.length<1) return null;
  const recentSum = recent.reduce((a,b)=>a+(+b.income||0),0);
  const days = recent[recent.length-1].date && recent[0].date ? Math.max(1, Math.ceil(recent.length/2)) : 7;
  const dailyAvg = recentSum / Math.max(1, recent.length) * 7; // 估算每周
  const monthPred = dailyAvg * 4.3; // 月
  return {month: Math.round(monthPred), recentCount: recent.length};
}
function renderDashboard(){
  const d = Store.data;
  const w = d.analytics.overview;
  const brand = localStorage.getItem('xhs_brand')||'Crazy Friday.';
  const hour = new Date().getHours();
  const greet = hour<6?'夜深了，还在努力':hour<12?'早上好':hour<18?'下午好':'晚上好';
  const dateStr = new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  // 本周计划进度
  const weekDays = 7;
  const done = d.schedule.filter(s=>s.status==='published').length;
  const weekProgress = Math.min(weekDays, Math.max(1, done));
  const pct = Math.round(weekProgress/weekDays*100);
  const pending = d.schedule.filter(s=>s.status==='ready').length;
  // 今日重点（V6.32：有商品时自动加入电商待办，带货不断档）
  const shopData = (Store.data.shop && Array.isArray(Store.data.shop.products)) ? Store.data.shop : {products:[],orders:[]};
  const shopSelling = shopData.products.filter(p=>p.status==='selling');
  const shopNoteRecent = (Store.data.contents||[]).some(c=>c.productId && c.date >= fmtDate(addDays(-7)));
  const focus = [
    {t:'完成 1 篇笔记创作', act:"navigate('create')", actTxt:'去创作'},
    {t: pending>0 ? `处理 ${pending} 条待发布内容` : '今日没有待发布内容', act:"navigate('schedule')", actTxt:'去排期'},
    {t:'录入 / 查看昨日数据', act:"navigate('analytics')", actTxt:'去复盘'},
    {t:'收藏 2 个潜力选题', act:"navigate('topics')", actTxt:'去发现'}
  ];
  if(shopSelling.length && !shopNoteRecent){
    focus.splice(1, 0, {t:`你有 ${shopSelling.length} 个在售商品，7 天没发带货笔记了`, act:"navigate('shop')", actTxt:'去写带货笔记'});
  }
  // V6.28 智能今日建议（基于真实数据生成，每天不同，像"活"的助手）
  const smartTips = buildSmartTips(d);
  // AI 今日简报（基于用户真实数据生成）
  const briefs = [];
  const hotTop = (typeof genTrending==='function'?genTrending():[])[0];
  if(hotTop) briefs.push({t:`<b>${esc(hotTop.title)}</b> 热度 ${hotTop.hot}，值得跟进`, act:"navigate(\'trending\')"});
  if(pending>0) briefs.push({t:`<b>${pending}</b> 条内容待发布，建议今天安排`, act:"navigate(\'schedule\')"});
  const bestNote = d.analytics.notes.slice().sort((a,b)=>b.score-a.score)[0];
  if(bestNote) briefs.push({t:`<b>${esc(bestNote.title)}</b> 表现最佳，可做续集`, act:"navigate(\'analytics\')"});
  if(d.favorites.length>=2) briefs.push({t:`收藏夹有 <b>${d.favorites.length}</b> 个选题等待使用`, act:"navigate(\'favorites\')"});
  if(briefs.length===0) briefs.push({t:'先收藏几个选题，AI 才能帮你发现机会', act:"navigate(\'topics\')"});
  // Quick Actions
  const qa = [
    {i:'🔍', n:'找选题', act:"navigate(\'topics\')"},
    {i:'✍️', n:'写笔记', act:"navigate(\'create\')"},
    {i:'🔥', n:'拆爆款', act:"navigate(\'viral\')"},
    {i:'💡', n:'加灵感', act:'openIdeaAdd()'},
    {i:'📅', n:'排发布', act:'openPlanAdd()'},
    {i:'📊', n:'录数据', act:'openDataEntry()'},
    {i:'🛒', n:'电商带货', act:"navigate(\'shop\')"},
    {i:'☑️', n:'批量排期', act:"navigate(\'library\');setTimeout(toggleLibSelect,300)"}
  ];
  // 最近内容
  const recent = d.contents.filter(c=>c.status==='published').slice(0,3);
  const aiTip = '你已经连续完成 <b>'+Math.min(3,Math.max(1,done))+'</b> 天内容计划，今天建议优先完成 <b>1 篇发布</b>。';
  const onb7 = render7DayCard();
  // V6.53「活的工作台」：时间锚点 + 每日锦囊 + 今日三件事
  const anchor = todayAnchor();
  const tipData = getDailyTip();
  const tipObj = (tipData && tipData.tip) ? tipData.tip : null;
  const tipSwap = (Store.data.tipSwap && Store.data.tipSwap.date === todayStr()) ? Store.data.tipSwap : null;
  const tipText = (tipSwap && tipSwap.t) ? tipSwap.t : (tipObj ? (tipObj.t || tipObj) : createTip(d));
  const tipCat = (tipSwap && tipSwap.c) ? tipSwap.c : (tipObj && tipObj.c ? tipObj.c : '锦囊');
  const taskSt = dailyTaskState();
  const tasks = pickDailyTasks(d);
  const taskDone = tasks.filter(t=>taskSt.done[t.id]).length;
  const taskPct = tasks.length ? Math.round(taskDone/tasks.length*100) : 0;
  const pred = predictMonthlyIncome();
  const predCard = '<div class="grid grid-2" style="margin-bottom:14px"><div class="metric-card"><div class="m-label">本月预测收益</div><div class="m-row"><span class="m-num" style="color:var(--text)">¥'+(pred?pred.month:0)+'</span><span class="m-trend">'+(pred?('基于近 '+pred.recentCount+' 笔记估算'):'录入数据后自动估算')+'</span></div><div style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="openDataPaste()">📥 同步真实数据</button></div></div><div class="metric-card"><div class="m-label">已记录收益</div><div class="m-row"><span class="m-num">¥'+d.money.records.reduce((a,b)=>a+(+b.income||0),0)+'</span><span class="m-trend">共 '+d.money.records.length+' 笔</span></div><div style="font-size:10px;color:var(--text3);margin-top:8px">小红书后台数据粘贴导入后，预测自动校准</div></div></div>';
  let renewBanner = '';
  try{
    const st = LIC_STATE || (typeof getLicenseState==='function' ? getLicenseState() : null);
    if(st && st.status==='activated' && st.remain!==undefined && st.remain>0 && st.remain<=60){
      renewBanner = '<div class="renew-banner"><div style="flex:1;min-width:0;line-height:1.6"><b>⏳ 会员将于 '+esc(st.expireAt||'')+' 到期（剩 <b style="color:var(--red)">'+st.remain+'</b> 天）</b><div style="font-size:11.5px;color:var(--text2)">到期前联系卖家续费，数据全部保留</div></div><button class="btn btn-red btn-sm" style="flex-shrink:0" onclick="openRenew()">📩 联系续费</button></div>';
    }
  }catch(e){}
  $('#content').innerHTML = `
  ${renewBanner}
  <div class="home-hero">
    <div class="hh-head">
      <span class="hh-ai"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8 15s1.5 2 4 2 4-2 4-2"/></svg>已接入 AI</span>
      <div class="hh-greet">${greet}，<b class="hh-name" onclick="openBrandEdit()" title="点击修改你的工作台名称">${esc(brand.replace(/[.。]$/,''))}<svg class="hh-edit" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></b></div>
    </div>
    <div class="hh-date"><span>${dateStr}</span><span class="streak-badge" title="连续运营">🔥 ${d.streak.count} 天</span></div>
    <div class="hh-anchor" title="${esc(anchor.sub)}"><b>${esc(anchor.tag)}</b><span>${esc(anchor.sub)}</span></div>
    <div class="hh-tip"><span class="tip-cat">${esc(tipCat)}</span><span class="tip-body">${tipText}</span><span class="tip-next" onclick="nextTip()" title="换一条锦囊">换一条 ↻</span></div>
    <div class="hh-progress">
      <span style="font-size:12px;color:rgba(255,255,255,.65);white-space:nowrap">本周计划</span>
      <div class="wp-bar"><i style="width:${pct}%"></i></div>
      <div class="wp-text"><b style="color:#fff">${weekProgress}/${weekDays}</b> 已发布</div>
    </div>
  </div>
  ${smartTips.length?smartTipCard(smartTips):''}
  ${introGuideBar()}
  <div class="kpi-grid">
    <div class="kpi-item"><div class="k-label">本周曝光</div><div class="k-num" data-num="${w.views7d||0}">${fmtNum(w.views7d)}</div><div class="k-sub">近 7 天</div></div>
    <div class="kpi-item"><div class="k-label">本周互动</div><div class="k-num" data-num="${(w.likes7d||0)+(w.collects7d||0)}">${fmtNum(w.likes7d+w.collects7d)}</div><div class="k-sub">点赞 + 收藏</div></div>
    <div class="kpi-item"><div class="k-label">本周涨粉</div><div class="k-num" data-num="${d.analytics.days7.reduce((a,b)=>a+(b.fans||0),0)}">+${d.analytics.days7.reduce((a,b)=>a+(b.fans||0),0)}</div><div class="k-sub">粉丝增长</div></div>
    <div class="kpi-item"><div class="k-label">本月收益</div><div class="k-num" data-num="${d.money.records.reduce((a,b)=>a+(+b.income||0),0)}">¥${d.money.records.reduce((a,b)=>a+(+b.income||0),0)}</div><div class="k-sub">已记录 ${d.money.records.length} 笔</div></div>
  </div>

  <div class="section-label">今日三件事 <span class="sl-more">${taskDone}/${tasks.length} 已完成${taskDone>=tasks.length&&tasks.length?' · 🎉 全部完成':''}</span></div>
  <div class="task-progress"><i style="width:${taskPct}%"></i></div>
  <div class="focus-list">
    ${tasks.map((f,i)=>`
    <div class="focus-item ${taskSt.done[f.id]?'done':''}" onclick="toggleDailyTask('${f.id}')">
      <div class="f-check">${taskSt.done[f.id]?'✓':''}</div>
      <div class="f-title"><span style="margin-right:4px">${f.ico||'✅'}</span>${i+1}. ${f.txt}</div>
      <span class="f-swap" onclick="event.stopPropagation();swapDailyTask('${f.id}')" title="换一件">换 ↻</span>
      <span class="f-act" onclick="event.stopPropagation();${f.act}">${f.go} →</span>
    </div>`).join('')}
  </div>

  <div class="section-label">AI 今日简报 <span class="sl-more">基于你的数据</span></div>
  <div class="card" style="padding:6px 14px">
    ${briefs.slice(0,4).map(b=>`
    <div class="brief-item" onclick="${b.act}">
      <span class="b-dot"></span>
      <span class="b-text">${b.t}</span>
      <span class="b-arrow">→</span>
    </div>`).join('')}
  </div>

  <div class="section-label">快速操作</div>
  <div class="qa-grid2">
    ${qa.map(q=>`<div class="qa2" onclick="Modal.close();${q.act}"><div class="q-ico">${q.i}</div><span>${q.n}</span></div>`).join('')}
  </div>

  <div class="section-label">最近内容 <span class="sl-more" onclick="navigate('library')">全部 →</span></div>
  ${recent.length?`<div class="tlist">
    <div class="tlist-head"><div>内容标题</div><div>状态</div><div class="col-time">发布时间</div><div>数据表现</div></div>
    ${recent.map(c=>`<div class="tlist-row" onclick="navigate('analytics')">
      <div class="t-title"><div class="t-thumb">${c.cat==='美妆'?'💄':c.cat==='穿搭'?'👗':c.cat==='数码'?'📱':c.cat==='美食'?'🍗':'📝'}</div><span>${esc(c.title)}</span></div>
      <div><span class="pill green">已发布</span></div>
      <div class="col-time">${c.date}</div>
      <div class="t-metrics"><span>👀 <b>${fmtNum(c.views)}</b></span><span>❤️ <b>${c.likes}</b></span><span>💬 <b>${c.comments}</b></span></div>
    </div>`).join('')}
  </div>`:'<div class="empty" style="padding:20px">还没有内容，点「写笔记」开始第一篇 ✨</div>'}
  `;
  // V6.53 数字滚动 + 里程碑彩蛋（里程碑只弹一次，不骚扰）
  try{ countUp('.k-num'); }catch(e){}
  try{ checkMilestone(); }catch(e){}
}
function toggleFocus(i){
  todayFocus[i] = !todayFocus[i];
  localStorage.setItem('xhs_today_focus', JSON.stringify(todayFocus));
  renderDashboard();
}
function resetTodayFocus(){
  todayFocus = [false,false,false,false];
  localStorage.setItem('xhs_today_focus', JSON.stringify(todayFocus));
  renderDashboard();
}

/* ================= 渲染：选题雷达 ================= */
let topicFilter = '全部';
let __renderTopicsT = null;
function debouncedRenderTopics(){
  if(__renderTopicsT) clearTimeout(__renderTopicsT);
  __renderTopicsT = setTimeout(renderTopics, 220);
}
function renderTopics(){
  const d = Store.data;
  // V6.27 bug 修复：搜索框移到独立容器 + 200ms 防抖（避免 oninput 即时重渲染销毁 input 元素导致焦点丢失）
  // 保留输入值：若 #searchInput 已存在就沿用其值，否则用 window.__lastTopicKw
  const existingKw = $('#searchInput') ? $('#searchInput').value : '';
  const kw = existingKw || (typeof window.__lastTopicKw !== 'undefined' ? window.__lastTopicKw : '');
  window.__lastTopicKw = kw;
  let list = [...d.topicPool];
  if(topicFilter!=='全部') list = list.filter(t=>t.cat===topicFilter);
  if(kw) list = list.filter(t=>t.title.includes(kw)||t.cat.includes(kw));
  list.sort((a,b)=>b.heat-a.heat);
  const favIds = new Set(d.favorites.map(f=>f.id));
  // 渲染独立搜索框（持久存在，不随下方列表重渲染而销毁）
  const bar = document.getElementById('topicSearchBar');
  if(bar){
    bar.style.display = 'block';
    bar.innerHTML = `
      <div style="position:sticky;top:0;z-index:50;background:var(--bg);padding:14px 0 10px;margin-bottom:6px;border-bottom:1px solid var(--line)">
        <div class="search-bar"><input id="searchInput" placeholder="搜索选题 / 分类，如：美妆、副业…" value="${esc(kw)}" oninput="window.__lastTopicKw=this.value;debouncedRenderTopics()" autocomplete="off" autocapitalize="off" spellcheck="false" style="font-size:14px"><button class="btn btn-red" onclick="renderTopics()">搜索</button></div>
        <div class="chip-row" id="catChips" style="margin-top:10px">
          ${['全部',...catOptions()].map(c=>`<span class="chip ${topicFilter===c?'active':''}" onclick="setTopicFilter('${c}')">${c}</span>`).join('')}
        </div>
      </div>`;
  }
  $('#content').innerHTML = `
  <div class="section-head"><h2>🔍 选题雷达</h2><button class="btn btn-red btn-sm" onclick="openAddTopic()">＋ 自定义选题</button></div>
  <div class="card" style="padding:10px">
    ${list.length?list.map(t=>`
    <div class="topic-item" onclick="openTopicDetail('${t.id}')">
      <div class="topic-rank r${t.heat>=90?1:t.heat>=80?2:3}">${list.indexOf(t)+1}</div>
      <div class="topic-main">
        <div class="topic-title">${esc(t.title)}</div>
        <div class="topic-meta"><span class="pill">${t.cat}</span><span>搜索 ${fmtNum(t.search)}</span><span>竞争度 ${t.competition}%</span>${t.rising?'<span class="pill red">↗ 飙升</span>':''}</div>
        <div class="heat-bar"><i style="width:${t.heat}%"></i></div>
      </div>
      <div class="topic-actions">
        <button class="icon-btn ${favIds.has(t.id)?'':'red'}" onclick="toggleFavorite('${t.id}',event)" title="${favIds.has(t.id)?'取消收藏':'收藏'}">${favIds.has(t.id)?'★':'☆'}</button>
        <button class="btn btn-ghost btn-sm" onclick="openSchedulePick('${esc(t.title)}','${t.cat}',event)" title="一键加入发布计划">📅 排期</button>
        <button class="btn btn-red btn-sm" onclick="goCreateWith('${esc(t.title)}','${t.cat}',event)">去创作</button>
      </div>
    </div>`).join(''):'<div class="empty"><span class="empty-ico">🔍</span>没有找到相关选题，试试换个关键词<br><button class="btn btn-red btn-sm" style="margin-top:10px" onclick="aiGenTopics()">🤖 AI 生成 10 个选题</button></div>'}
  </div>`;
}
function setTopicFilter(c){
  topicFilter = c;
  // 视觉反馈：更新所有同类 chip 的 active
  document.querySelectorAll('#topicsFilterPills .chip, [data-filter-row] .chip').forEach(function(x){
    x.classList.toggle('active', x.textContent === c);
  });
  renderTopics();
}
/* V6.30 AI 生成选题：真 AI 产出 10 个当季选题并入库（空态激活，不再空壳） */
async function aiGenTopics(){
  const btn = event && event.target;
  if(btn){ btn.textContent = 'AI 生成中…'; btn.disabled = true; }
  const kw = ($('#searchInput') && $('#searchInput').value.trim()) || '';
  const sys = '你是小红书选题策划专家，熟悉当下消费热点与内容趋势。输出 10 个选题，每个一行：标题｜分类｜热度值(60-99)。不要任何解释。分类只用：美妆、穿搭、美食、家居、母婴、旅行、健身、职场、数码、学习、情感。';
  const prompt = (kw ? '围绕「'+kw+'」' : '根据 2026 年当前季节与消费热点') + '生成 10 个适合小红书的内容选题，要具体、有画面感、有搜索流量。';
  const r = await aiAsk(prompt, sys, '', null);
  if(btn){ btn.textContent = '🤖 AI 生成 10 个选题'; btn.disabled = false; }
  if(!r.ok){ Toast(r.msg || '生成失败，请稍后重试'); return; }
  const lines = r.text.split('\n').map(l=>l.trim()).filter(l=>l && l.indexOf('｜')>=0).slice(0,10);
  if(!lines.length){ Toast('AI 返回格式异常，请重试'); return; }
  const cats = new Set(catOptions());
  const added = [];
  lines.forEach(l=>{
    const [title, cat, heatStr] = l.split('｜');
    const c = cats.has((cat||'').trim()) ? cat.trim() : '美妆';
    const heat = Math.min(99, Math.max(60, parseInt(heatStr)||80));
    added.push({id:uid(), title:title.trim(), cat:c, heat});
  });
  Store.data.topicPool = added.concat(Store.data.topicPool);
  Store.save();
  Toast('✅ 已生成 '+added.length+' 个选题');
  renderTopics();
}

/* ================= V5.9 选题 ↔ 排期联动（选题一键加入发布计划） ================= */
function openSchedulePick(title, cat, ev){
  if(ev) ev.stopPropagation();
  const d = Store.data;
  Modal.open('📅 加入发布计划', `
    <div style="font-size:12.5px;color:var(--text2);margin-bottom:12px;line-height:1.7">选题已就绪，选个日期直接排进发布计划，无需二次复制粘贴。</div>
    <div class="form-group"><label class="label">排期日期</label><input id="spDate" type="date" value="${todayStr()}"></div>
    <div class="form-group"><label class="label">发布时间</label><input id="spTime" type="time" value="19:00"></div>
    <div class="form-group"><label class="label">标题</label><input id="spTitle" value="${esc(title||'')}"></div>
    <div class="form-group"><label class="label">分类</label><select id="spCat">${catOptions().map(c=>`<option ${c===cat?'selected':''}>${c}</option>`).join('')}</select></div>
    <button class="btn btn-red btn-block" onclick="doSchedulePick()">✅ 加入发布计划</button>`);
}
function doSchedulePick(){
  const title = $('#spTitle').value.trim();
  if(!title){ Toast('请输入标题'); return; }
  Store.data.schedule.push({id:uid(), date:$('#spDate').value, time:$('#spTime').value, title, status:'ready', cat:$('#spCat').value});
  Store.save(); Modal.close(); updateBadges(); Toast('已加入发布计划 ✅');
}
function schedulePickFor(id){ // 从收藏夹/爆款拆解复用
  const t = Store.data.favorites.find(f=>f.id===id);
  const cat = t ? t.cat : '';
  const title = t ? t.title : '';
  openSchedulePick(title, cat);
}

/* ================= V5.9 小红书热点日历（节日 + 电商大促） ================= */
const HOT_CALENDAR = [
  {m:1, d:1, name:'元旦', tag:'节日'}, {m:1, d:20, name:'年货节', tag:'大促'},
  {m:2, d:14, name:'情人节', tag:'节日'}, {m:2, d:17, name:'春节', tag:'节日'},
  {m:3, d:3, name:'元宵节', tag:'节日'}, {m:3, d:8, name:'38 女神节', tag:'大促'},
  {m:4, d:5, name:'清明节', tag:'节日'}, {m:4, d:23, name:'世界读书日', tag:'内容'},
  {m:5, d:1, name:'五一劳动节', tag:'节日'}, {m:5, d:20, name:'520 表白日', tag:'大促'},
  {m:6, d:1, name:'儿童节', tag:'节日'}, {m:6, d:18, name:'618 年中大促', tag:'大促'}, {m:6, d:19, name:'端午节', tag:'节日'},
  {m:7, d:1, name:'暑期开始', tag:'内容'},
  {m:8, d:19, name:'七夕节', tag:'大促'},
  {m:9, d:10, name:'教师节', tag:'节日'}, {m:9, d:25, name:'中秋节', tag:'大促'},
  {m:10, d:1, name:'国庆节', tag:'大促'}, {m:10, d:31, name:'万圣节', tag:'内容'},
  {m:11, d:11, name:'双 11 大促', tag:'大促'},
  {m:12, d:12, name:'双 12 大促', tag:'大促'}, {m:12, d:21, name:'冬至', tag:'内容'}, {m:12, d:25, name:'圣诞节', tag:'大促'}
];
function hotCalendarCard(){
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth()+1, d = now.getDate();
  const t0 = new Date(y, now.getMonth(), d).getTime();
  const list = HOT_CALENDAR.filter(h=>h.m===m).map(h=>({...h, date:new Date(y, h.m-1, h.d)}));
  return `
  <div class="card" style="border-color:rgba(255,149,0,.3);margin-bottom:16px">
    <div class="card-title">📅 本月热点日历 <span style="font-size:11px;color:var(--text3);font-weight:400">${m} 月 · ${list.length} 个节点 · 选题踩点不错过</span>
      <span class="more" onclick="openHotCalendar()">全年日历 →</span>
    </div>
    ${list.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
      ${list.map(h=>{
        const pass = h.date.getTime() < t0;
        const isToday = h.date.getTime() === t0;
        return `<span class="hot-tag ${pass?'hc-pass':''}" style="${isToday?'border:1.5px solid var(--orange)':''}" onclick="openSchedulePick('${h.name} 热点选题','美妆',event)">${h.m}/${h.d} ${h.name} ${h.tag==='大促'?'💰':h.tag==='节日'?'🎉':'📌'}${isToday?' · 今天':''}</span>`;
      }).join('')}
    </div>` : '<div style="font-size:12.5px;color:var(--text3)">本月暂无大节点，去「全年日历」看看下个月要提前准备什么</div>'}
    <div style="font-size:10.5px;color:var(--text4);margin-top:8px">点击节点可一键把「该节点选题」加入发布计划 · 大促/节日内容提前 3-7 天发布效果最佳</div>
  </div>`;
}
function openHotCalendar(){
  const months = [];
  for(let mm=1; mm<=12; mm++) months.push(HOT_CALENDAR.filter(h=>h.m===mm));
  Modal.open('📅 小红书热点日历（全年）', `
    <div style="font-size:12px;color:var(--text2);margin-bottom:12px">节日节点 + 电商大促一览，提前排期踩热点。共 ${HOT_CALENDAR.length} 个节点。</div>
    ${months.map((list, i)=>`
      <div style="margin-bottom:10px">
        <div style="font-size:12.5px;font-weight:700;color:var(--red);margin-bottom:4px">${i+1} 月</div>
        ${list.length?`<div style="display:flex;flex-wrap:wrap;gap:6px">${list.map(h=>`<span class="hot-tag">${h.d}日 ${h.name} ${h.tag==='大促'?'💰':h.tag==='节日'?'🎉':'📌'}</span>`).join('')}</div>`:'<div style="font-size:11px;color:var(--text4)">—</div>'}
      </div>`).join('')}
    <div style="font-size:10.5px;color:var(--text4);margin-top:8px;text-align:center">建议：大促前 3-7 天发布种草/攻略，节点当天发布互动内容</div>`);
}

/* ================= V6.4 每日热点自动同步 =================
 * 工作台打开时自动从云端拉取当日热点（服务端 AI/模板懒生成），
 * 今日热门页优先展示云端数据 → 客户打开即"当天已更新"，无需手动操作。
 */
function getHotDaily(){
  try{
    const v = JSON.parse(localStorage.getItem('xhs_hotdaily')||'null');
    if(v && v.date === todayStr() && v.list && v.list.length) return v;
  }catch(e){}
  return null;
}
/* ================= V6.24 今日 AI 变现机会（新闻式 · 30 分钟一换） ================= */
function getOpportunity(){
  try{ return JSON.parse(localStorage.getItem('xhs_opportunity')||'null'); }catch(e){ return null; }
}
async function syncOpportunity(){
  try{
    const base = cfCloudBase(); if(!base) return;
    const r = await fetch(base + '/api/opportunity', { cache:'no-store' });
    const j = await r.json();
    if(j.ok && j.data && j.data.list && j.data.list.length){
      const prev = getOpportunity();
      const changed = !prev || prev.updatedAt !== j.data.updatedAt;
      localStorage.setItem('xhs_opportunity', JSON.stringify(j.data));
      if(changed && currentPage === 'trending') renderTrending();
    }
  }catch(e){}
}
function opportunityCard(opp, agoMin){
  const top3 = (opp.list||[]).slice(0,3);
  const more = Math.max(0, (opp.list||[]).length - 3);
  return `
    <div class="opp-card" onclick="showOpportunity()">
      <div class="opp-head">
        <div>
          <span class="opp-tag">🔥 实时</span>
          <span class="opp-title">今日 AI 变现机会</span>
        </div>
        <span class="opp-ago">${agoMin===null||agoMin>90 ? '⏳ 正在同步…' : (agoMin ? agoMin + ' 分钟前更新' : '刚刚')}</span>
      </div>
      <div class="opp-list">
        ${top3.map((o,i)=>`
          <div class="opp-item">
            <span class="opp-type opp-type-${i}">${o.type||'机会'}</span>
            <span class="opp-name">${esc(o.name)}</span>
            <span class="opp-hot">🔥${o.hot}</span>
          </div>
        `).join('')}
      </div>
      ${more>0?`<div class="opp-more">+ ${more} 条新机会，点击查看全部 →</div>`:'<div class="opp-more">点击查看全部详情 →</div>'}
    </div>`;
}
function showOpportunity(){
  const opp = getOpportunity();
  if(!opp || !opp.list || !opp.list.length){ Toast('变现机会数据准备中…'); return; }
  const ago = opp.updatedAt ? Math.max(1, Math.round((Date.now() - new Date(opp.updatedAt).getTime())/60000)) : null;
  const typeColor = { '新平台':'#c8304a','新玩法':'#ff9500','新政策':'#5856d6','热点变现':'#34c759','商业趋势':'#0a84ff' };
  Modal.open('🔥 今日 AI 变现机会', `
    <div style="font-size:11.5px;color:var(--text3);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
      <span>🧠 ${opp.source==='ai'?'AI 实时生成（每 30 分钟一换）':'模板轮换（建议升级开启 AI）'}</span>
      <span>${(ago===null||ago>90)?'同步中':(ago?ago+' 分钟前':'刚刚')}</span>
    </div>
    ${opp.list.map(o=>`
      <div class="opp-detail">
        <div class="opp-detail-head">
          <span class="opp-type-pill" style="background:${typeColor[o.type]||'#888'}">${o.type}</span>
          <span class="opp-detail-name">${esc(o.name)}</span>
          <span class="opp-hot">🔥 ${o.hot}</span>
        </div>
        <div class="opp-detail-action">💡 <b>现在可以这样做：</b>${esc(o.action||'')}</div>
      </div>
    `).join('')}
    <div style="font-size:10.5px;color:var(--text3);margin-top:14px;line-height:1.7;text-align:center;border-top:1px solid var(--line);padding-top:10px">
      情报每 30 分钟自动刷新（顶部进度条可见）· 点击机会名可一键加入创作计划
    </div>
  `);
}
async function syncHotDaily(){
  try{
    const base = cfCloudBase(); if(!base) return;
    const r = await fetch(base + '/api/hotdaily', { cache:'no-store' });
    const j = await r.json();
    if(j.ok && j.data && j.data.list && j.data.list.length){
      const prev = getHotDaily();
      const changed = !prev || prev.date !== j.data.date || JSON.stringify(prev.list) !== JSON.stringify(j.data.list);
      localStorage.setItem('xhs_hotdaily', JSON.stringify(j.data));
      // V6.19：今日热门页内容有变化就自动刷新（含同日 AI 更新）
      if(changed && currentPage === 'trending') renderTrending();
    }
  }catch(e){}
}
/* V6.24 真正"10-30分钟有变化"：客户端每 30s 拉一次，服务端按时间窗（热点15min/日报60min/机会30min）判断是否真生成 */
let __autoRefreshTimer = null;
function startAutoRefresh(){
  if(__autoRefreshTimer) return;
  __autoRefreshTimer = setInterval(()=>{
    try{ syncHotDaily(); }catch(e){}
    try{ if(typeof syncDailyReport==='function') syncDailyReport(); }catch(e){}
    try{ if(typeof syncOpportunity==='function') syncOpportunity(); }catch(e){}
  }, 30000);
  // V6.52 启动立即并行同步全部数据源（修复：原来只立即拉机会，热点/日报要等 30 秒，首屏永远是旧数据）
  try{ syncHotDaily(); }catch(e){}
  try{ if(typeof syncDailyReport==='function') syncDailyReport(); }catch(e){}
  try{ syncOpportunity(); }catch(e){}
  try{ if(typeof syncDailyTip==='function') syncDailyTip(); }catch(e){}
}

/* ================= 今日热门 ================= */
function renderTrending(){
  const cloud = getHotDaily(); // V6.4 云端 AI 每日自动热点（优先）
  const opp = getOpportunity(); // V6.24 今日 AI 变现机会（30 分钟一换，新闻式）
  const today = cloud ? cloud.list : genTrending();
  const sorted = [...today].sort((a,b)=>b.hot-a.hot);
  const top = sorted[0];
  const rising = sorted.filter(x=>x.rising).slice(0,6);
  const cats = ['美妆','穿搭','数码','美食','母婴','旅行','健身','家居','职场','学习','运营'];
  const catTop = {};
  cats.forEach(c=>{ catTop[c] = sorted.filter(p=>p.cat===c).slice(0,3); });
  // V6.24：实时更新的"已多少分钟前" 提示
  const oppAgo = opp && opp.updatedAt ? Math.max(1, Math.round((Date.now() - new Date(opp.updatedAt).getTime())/60000)) : null;
  $('#content').innerHTML = `
  <div class="section-head"><h2>🔥 今日热门</h2><span class="pill red">${cloud?('🤖 AI 每 15 分钟刷新 · '+(typeof reportUpdateTime==='function'?reportUpdateTime(cloud):todayStr())):'⏳ 正在同步今日热点…'}</span></div>
  ${opp ? opportunityCard(opp, oppAgo) : ''}
  ${typeof getDailyReport==='function' ? reportEntranceCard() : ''}
  ${hotCalendarCard()}
  <div class="hot-headline" onclick="goCreateWith('${esc(top.title)}','${top.cat}')">
    <div class="hh-rank">🥇 今日 TOP 1 · 热度 ${top.hot}</div>
    <div class="hh-title">${esc(top.title)}</div>
    <div class="hh-meta">
      <span class="pill">${top.cat}</span>
      ${top.rising?'<span class="pill red">↗ 飙升</span>':''}
      ${top.brand?'<span class="pill orange">💰 带货潜力</span>':''}
      <span style="margin-left:auto;color:var(--red);font-weight:600">→ 立即跟进创作</span>
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="card-title">📊 今日热度榜 TOP 10</div>
      ${sorted.map((t,i)=>`<div class="hot-row" onclick="goCreateWith('${esc(t.title)}','${t.cat}')">
        <span class="hot-rank r${i<3?(i+1):'n'}">${i+1}</span>
        <span class="hot-title">${esc(t.title)}</span>
        ${t.rising?'<span class="pill red">↗</span>':''}
        ${t.brand?'<span class="pill orange">💰</span>':''}
        <span class="hot-hot h${t.hot>=90?'hi':t.hot>=80?'mid':'lo'}">🔥${t.hot}</span>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">📈 本周飙升榜</div>
      ${rising.map((t,i)=>`<div class="hot-mini">
        <span class="hot-rank r${i<3?(i+1):'n'}">${i+1}</span>
        <div class="hot-info">
          <div class="hot-title" style="font-size:13px">${esc(t.title)}</div>
          <div class="hot-meta">${t.cat} · 热度 ${t.hot} · +${rnd(15,40)}%</div>
        </div>
        <button class="btn btn-red btn-sm" onclick="event.stopPropagation();goCreateWith('${esc(t.title)}','${t.cat}')">创作</button>
      </div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-title">📍 分类热搜 Top 3</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
      ${Object.entries(catTop).filter(([_,l])=>l.length).map(([cat, list])=>`
      <div class="hot-cat">
        <div class="hot-cat-name">${cat}</div>
        ${list.map((t,i)=>`<span class="hot-tag" onclick="goCreateWith('${esc(t.title)}','${cat}')">${i+1}. ${esc(t.title.length>16?t.title.slice(0,16)+'...':t.title)}</span>`).join('')}
      </div>`).join('')}
    </div>
  </div>
  <div class="card" style="border-color:rgba(194,59,82,.25)">
    <div class="card-title">💰 今日变现推荐 <span class="pill red">AI 建议 · 每日更新</span></div>
    <div id="moneyAdviceBox"></div>
  </div>
  <div class="card">
    <div class="card-title">💡 今日变现指南</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.9">
      <p>• 🚀 <b>抢占时机</b>：飙升话题发布黄金期是 <b>6 小时内</b>，今天跟进还能吃到红利</p>
      <p>• 💰 <b>带货选题</b>：标记"💰"的标题适合做合集测评或单品开箱，转化率高</p>
      <p>• 🎯 <b>同类竞速</b>：同选题下「你的标题是否比热门更具体」决定是否被推荐</p>
      <p>• 📊 <b>看数据行动</b>：飙升笔记点击去"爆款拆解"看结构，再 AI 创作跟进</p>
    </div>
  </div>
  <div style="font-size:10px;color:var(--text4);margin-top:14px;text-align:center;line-height:1.7">⚠️ 免责声明：本页面热度、报价、佣金比例为 AI 趋势测算参考，非小红书官方实时数据，不构成投资、运营建议，平台不对数据精准性做承诺。</div>`;
  setTimeout(()=>{ try{ renderMoneyAdvice(); }catch(e){} }, 0);
}
function renderMoneyAdvice(){
  const box = document.getElementById('moneyAdviceBox');
  if(!box) return;
  const adv = genMoneyAdvice();
  const d = Store.data;
  const income = d.money.records.reduce((a,b)=>a+(+b.income||0),0);
  box.innerHTML = `
    <div class="hot-headline" style="margin-bottom:10px;padding:14px">
      <div class="hh-rank">今日推荐 · ${adv.category}品类</div>
      <div class="hh-title" style="font-size:15px">${adv.hotTopic?esc(adv.hotTopic)+' → 结合 <b>'+adv.product+'</b> 做带货内容':'试试「清单+好物」型带货笔记'}（佣金参考 ${adv.commission}）</div>
      <div class="hh-meta"><span class="pill">${adv.note}</span><span class="pill green">佣金 ${adv.commission}</span></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text2)">
      <span>本月收益 <b>¥${income}</b> / 目标 ¥${d.goals.monthlyIncome}</span>
      <div class="wp-bar" style="flex:1;height:5px;background:var(--line2);border-radius:3px;overflow:hidden"><i style="display:block;height:100%;width:${adv.goalProgress}%;background:var(--red)"></i></div>
      <span>${adv.goalProgress}%</span>
    </div>
    <div style="font-size:10.5px;color:var(--text3);margin-top:8px">以上为 AI 趋势建议与参考数据，非平台实时数据；实际以小红书蒲公英/橱窗后台为准。</div>`;
}

/* ================= 渲染：爆款拆解 ================= */
function renderViral(){
  const d = Store.data;
  $('#content').innerHTML = `
  <div class="section-head"><h2>🔥 爆款拆解</h2><button class="btn btn-red btn-sm" onclick="openViralAdd()">＋ 添加拆解</button></div>
  <div class="card" style="border-color:rgba(191,90,242,.3);margin-bottom:14px">
    <div class="card-title">✨ AI 爆款复刻</div>
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">粘贴任意爆款笔记（链接或全文），AI 深度拆解<b>行文框架 / 开篇钩子 / 段落节奏 / 遣词风格</b>，再生成一篇同风格全新原创笔记，避免直接搬运的查重风险。</p>
    <textarea id="aiRemixInput" placeholder="粘贴爆款笔记链接或全文（或自己描述一篇爆款）…" style="min-height:90px"></textarea>
    <button class="btn btn-red btn-sm" style="margin-top:10px" onclick="aiRemix()">🔍 AI 拆解并复刻</button>
    <div id="aiRemixOut" style="margin-top:12px"></div>
  </div>
  <p style="color:var(--text2);margin-bottom:16px;font-size:13px">拆解优质笔记的内容结构，一键复制爆款思路，套用到你自己的选题上。</p>
  ${(d.viralPool||[]).map(v=>{
    // V6.27 兼容防御：老数据条目可能缺字段（steps/likes 等），给默认值防崩
    v = v||{};
    const steps = Array.isArray(v.steps) ? v.steps : [];
    const stHtml = steps.length ? steps.map((s,i)=>`<div class="step-tag"><span class="st-num">STEP ${i+1}</span><span class="st-name">${esc(s.name||'')}</span><span class="st-desc">${esc(s.desc||'')}</span></div>`).join('') : '<div class="empty" style="padding:8px">该拆解暂无详细步骤</div>';
    return `<div class="viral-card" onclick="openViralDetail('${v.id}')">
    <div class="viral-top"><span class="viral-title">📌 ${esc(v.title||'未命名拆解')}</span><span class="pill">${esc(v.cat||'未分类')}</span></div>
    <div class="viral-data"><span>❤️ <b>${v.likes||0}</b></span><span>⭐ <b>${v.collects||0}</b></span><span>💬 <b>${v.comments||0}</b></span>${v.hook?'<span class="pill purple">'+esc(v.hook)+'</span>':''}</div>
    <div class="steps">${stHtml}</div>
  </div>`;
  }).join('')}`;
}
let aiRemixResult = '';
async function aiRemix(){
  const src = $('#aiRemixInput').value.trim();
  if(!src){ Toast('请粘贴爆款链接或正文'); return; }
  if(!premiumGuard('AI 爆款复刻')) return;
  const out = $('#aiRemixOut');
  out.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2)"><span class="ai-loading">🤖</span> AI 正在拆解笔记逻辑并同风格创作…（约 15-30 秒）</div>';
  const prompt = '请深度拆解下面这篇小红书爆款笔记的底层逻辑，然后模仿其风格写一篇全新的原创笔记。\n\n输出格式（严格按此结构）：\n【1. 爆款拆解】\n- 行文框架：\n- 开篇情绪钩子：\n- 段落节奏：\n- 遣词风格：\n- 互动引导：\n【2. 同风格原创笔记】\n标题：\n正文：（400-600 字，含 emoji 和分段，与爆款同风格但内容全新）\n话题标签：#... #... #...\n\n爆款原文：\n' + src.slice(0, 4000);
  const r = await aiAsk(prompt, '你是资深小红书爆款笔记研究专家，擅长拆解爆款底层逻辑并进行风格复刻。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  aiRemixResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:380px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制全文</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveAiRemix()">📥 存入内容库</button>
    </div>`;
}
function saveAiRemix(){
  if(!aiRemixResult){ Toast('暂无内容'); return; }
  const m = aiRemixResult.match(/标题[：:]\s*([^\n]+)/);
  const title = m ? m[1].trim().slice(0, 40) : 'AI 复刻笔记 ' + todayStr();
  Store.data.contents.unshift({id:uid(), title, status:'draft', date:todayStr(), cat:(Store.data.userProfile||{}).accountType||'美妆', body:aiRemixResult, views:0, likes:0, collects:0, comments:0});
  Store.save(); Toast('已存入内容库 ✅'); setTimeout(()=>navigate('library'), 600);
}
function openViralDetail(id){
  const v = Store.data.viralPool.find(x=>x.id===id); if(!v) return;
  Modal.open('爆款拆解 · '+v.title, `
    <div class="viral-data"><span>❤️ <b>${v.likes}</b></span><span>⭐ <b>${v.collects}</b></span><span>💬 <b>${v.comments}</b></span></div>
    <div class="card" style="box-shadow:none;background:var(--bg)"><div style="font-size:13px;font-weight:600;margin-bottom:8px">💡 爆款逻辑</div><div style="font-size:13px;color:var(--text2)">${v.hook}</div></div>
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">📐 内容结构</div>
    ${v.steps.map((s,i)=>`<div class="card" style="box-shadow:none;background:var(--bg)"><div class="step-tag" style="background:var(--card)"><span class="st-num">STEP ${i+1}</span><span class="st-name">${s.name}</span><span class="st-desc">${s.desc}</span></div></div>`).join('')}
    <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">
      <button class="btn btn-ghost" style="flex:1" onclick="delViral('${v.id}')">🗑️ 删除</button>
      <button class="btn btn-ghost" style="flex:1" onclick="borrowViral('${v.id}')">📋 借鉴到选题库</button>
      <button class="btn btn-red" style="flex:1" onclick="openSchedulePick('${esc(v.title)}','${v.cat}')">📅 加入排期</button>
    </div>`);
}
function borrowViral(id){
  const v = Store.data.viralPool.find(x=>x.id===id); if(!v) return;
  Store.data.topicPool.unshift({id:uid(), cat:v.cat, title:v.title+'（借鉴）', heat:rnd(70,95), search:rnd(30000,90000), competition:rnd(20,50), rising:false});
  Store.save(); Modal.close(); Toast('已加入选题雷达 ✅'); setTimeout(()=>navigate('topics'),600);
}
function delViral(id){ Store.data.viralPool = Store.data.viralPool.filter(v=>v.id!==id); Store.save(); Modal.close(); renderViral(); Toast('已删除该拆解'); }
function openViralAdd(){
  Modal.open('＋ 添加爆款拆解', `
    <div class="form-group"><label class="label">爆款标题</label><input id="nvTitle" placeholder="如：这 3 个方法让我月入翻倍"></div>
    <div class="form-group"><label class="label">分类</label><select id="nvCat">${catOptions().map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="label">互动数据（如 2.3w / 8600）</label><div style="display:flex;gap:8px"><input id="nvLikes" placeholder="点赞"><input id="nvCollects" placeholder="收藏"><input id="nvComments" placeholder="评论"></div></div>
    <div class="form-group"><label class="label">爆款逻辑一句话</label><input id="nvHook" placeholder="如：身份标签 + 数字对比制造代入感"></div>
    <div class="form-group"><label class="label">4 步结构（用 | 分隔，描述可选）</label><input id="nvSteps" placeholder="痛点引入|干货方案|效果展示|总结引导"></div>
    <button class="btn btn-red btn-block" onclick="doViralAdd()">保存拆解</button>`);
}
function doViralAdd(){
  const title=$('#nvTitle').value.trim(); if(!title){Toast('请输入标题');return;}
  const names=$('#nvSteps').value.split('|').map(s=>s.trim()).filter(Boolean);
  const steps = names.length>=2 ? names.slice(0,4).map(n=>({name:n, desc:'自定义拆解'+(names.indexOf(n)+1)})) : [{name:'痛点引入',desc:''},{name:'干货方案',desc:''},{name:'效果展示',desc:''},{name:'总结引导',desc:''}];
  Store.data.viralPool.unshift({id:uid(), title, cat:$('#nvCat').value, likes:$('#nvLikes').value||'—', collects:$('#nvCollects').value||'—', comments:$('#nvComments').value||'—', steps, hook:$('#nvHook').value||'自定义拆解案例'});
  Store.save(); Modal.close(); renderViral(); Toast('已添加拆解案例 ✅');
}

/* ================= 渲染：AI创作中心（V6.0 全面美化 + 10 场景） ================= */
let createScene = 0;
const ICON_TITLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 8v8l8 6 8-6V8z"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 13H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5v14a2 2 0 0 0 2 2h13V5H6a2 2 0 0 0-2 2zM20 5H6"/></svg>';
const ICON_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 7.5a5 5 0 0 0-7.6-.6l-1.2 1.2-1.2-1.2a5 5 0 0 0-7.6 7l1.2 1.3 7.6 7.6 7.6-7.6 1.2-1.3a5 5 0 0 0 0-6.4z"/></svg>';
const ICON_FIRE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3-3 5-3 8a3 3 0 0 0 6 0c0-1-.5-2-1-3 2 1 4 3 4 6a6 6 0 0 1-12 0c0-4 3-7 6-11z"/></svg>';
const ICON_VIDEO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/></svg>';
const ICON_LIVE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0"/></svg>';
const ICON_COVER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 18h18M9 4v14M15 4v14"/><path d="M12 9l-1.5 1.5L12 12l1.5-1.5z"/></svg>';
const ICON_DEAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h18v12H3z"/><path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M9 13h6M9 17h4"/></svg>';
const ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
/* V6.30 场景专属生成引擎：每个场景独立的 AI prompt（小红书全链路提效核心） */
const SCENE_ENGINE = {
  '爆款标题': {sys:'你是小红书爆款标题操盘手，深谙点击率公式：数字+人群+痛点/反差/悬念。输出 8 个标题，每个一行编号，标题后空一格加 3-4 个话题标签（# 开头）。只输出标题行，不要其他文字。', user:'围绕「{kw}」（赛道 {cat}，语气 {mood}）生成 8 个能让人忍不住点进来的爆款标题。要求：3 个带数字、3 个带人群标签（如 油皮/学生党/通勤族）、2 个带反差或悬念。'},
  '种草文案': {sys:'你是小红书种草文案专家。输出一篇可直接发布的种草笔记：开头 2 句制造痛点或场景共鸣；中段产品卖点自然融入（不硬广），用 emoji 切段；结尾给使用场景+一句真诚推荐+引导收藏评论。字数 350-500 字，口语化。只输出正文。', user:'写一篇「{kw}」的种草文案（赛道 {cat}，语气 {mood}）。'},
  '干货笔记': {sys:'你是小红书干货笔记专家。输出一篇教程型笔记：开头点明能解决什么问题；正文分 3-5 个步骤/要点，每步小标题+简短说明，用 emoji 和序号；结尾总结+避坑提醒。字数 400-600 字。只输出正文。', user:'写一篇「{kw}」的干货教程（赛道 {cat}，语气 {mood}），步骤要具体可执行。'},
  '情绪共鸣': {sys:'你是小红书高共情文案作者。输出一篇走心笔记：用一个具体的小场景/细节切入，引出情绪；中间用金句撑住情绪；结尾温柔收束并引导评论共鸣。字数 300-450 字，忌说教。只输出正文。', user:'围绕「{kw}」写一篇让人共鸣的走心笔记（赛道 {cat}，语气 {mood}）。'},
  '测评避雷': {sys:'你是小红书测评专家，风格真实敢说。输出一篇测评笔记：开头给结论（值不值得买）；中段分点说优点/缺点/适合人群，有真实使用场景细节；结尾红黑榜总结+购买建议。字数 350-550 字。只输出正文。', user:'写一篇「{kw}」的真实测评（赛道 {cat}，语气 {mood}），优点缺点都要有。'},
  '视频脚本': {sys:'你是小红书短视频脚本导演。输出 30-60 秒口播脚本，严格格式：\n【前3秒钩子】一句抓住注意力\n【痛点引入】2-3 句\n【干货/主体】3-4 个要点，每点一句口语\n【结尾引导】关注/收藏/评论引导\n总字数 200-300 字。只输出脚本。', user:'为主题「{kw}」写一个 30-60 秒口播视频脚本（赛道 {cat}，语气 {mood}）。'},
  '直播话术': {sys:'你是小红书直播运营专家。输出直播口播话术：开场暖场 2 句 + 产品介绍 3 句 + 痛点共鸣 2 句 + 逼单话术 3 句（限时/赠品/稀缺）+ 回复常见问题 2 条。口语化，有节奏。只输出话术。', user:'为主题「{kw}」写直播话术（赛道 {cat}，语气 {mood}）。'},
  '封面标题': {sys:'你是小红书封面文案专家。输出 6 个封面标题（9-16 字，大字适合封面），每个配一句副标题建议。格式：编号+主标题｜副标题。只输出列表。', user:'为主题「{kw}」生成 6 个适合做封面的大字标题（赛道 {cat}，语气 {mood}）。'},
  '接广话术': {sys:'你是小红书商务沟通专家。输出与品牌方 PR 的沟通话术：开头报价/询价 2 种场景各 1 段，价格谈判 1 段，合作确认 1 段。语气专业不卑不亢，体现博主价值（粉丝/互动/内容质量）。只输出话术，每段标注场景。', user:'围绕「{kw}」（账号粉丝 {fans}）写接广沟通话术（赛道 {cat}）。'},
  '个人简介': {sys:'你是小红书账号定位专家。输出一份账号简介方案：定位一句话（人群+领域+价值）+ 简介文案 80 字内（可用 emoji 分段）+ 3 个置顶选题方向。只输出方案。', user:'为主题「{kw}」（赛道 {cat}）做账号简介方案，语气 {mood}。'}
};
const SceneMeta = [
  {name:'爆款标题', ico:ICON_TITLE, desc:'一次 12 个', rec:'从“热点/产品关键词”开始', color:'var(--red)', bg:'var(--redGrad)', ex:'数字+场景+卖点'},
  {name:'种草文案', ico:ICON_BAG, desc:'产品测评向', rec:'从“真实使用场景”开始', color:'#ff9500', bg:'linear-gradient(135deg,#ff9500,#ffca80)', ex:'粉底液测评'},
  {name:'干货笔记', ico:ICON_BOOK, desc:'教程步骤向', rec:'从“具体步骤或清单”开始', color:'#0a84ff', bg:'linear-gradient(135deg,#0a84ff,#7ad0ff)', ex:'Excel 教程'},
  {name:'情绪共鸣', ico:ICON_HEART, desc:'走心观点向', rec:'从“一个真实经历”开始', color:'#ff2d55', bg:'linear-gradient(135deg,#ff2d55,#ff7e98)', ex:'裸辞后的生活'},
  {name:'测评避雷', ico:ICON_FIRE, desc:'红黑榜测评', rec:'从“一句话结论”开始', color:'#bf5af2', bg:'linear-gradient(135deg,#bf5af2,#e0b3ff)', ex:'家电避雷'},
  {name:'视频脚本', ico:ICON_VIDEO, desc:'30s/60s 分镜', rec:'从“3秒钩子”开始', color:'#ff5e3a', bg:'linear-gradient(135deg,#ff5e3a,#ff9a80)', ex:'开箱视频'},
  {name:'直播话术', ico:ICON_LIVE, desc:'暖场/逼单', rec:'从“产品卖点”开始', color:'#ff3d7f', bg:'linear-gradient(135deg,#ff3d7f,#ff80ab)', ex:'美妆直播'},
  {name:'封面标题', ico:ICON_COVER, desc:'9 字高点击', rec:'从“核心卖点/数字”开始', color:'#8e44ad', bg:'linear-gradient(135deg,#8e44ad,#bb8fce)', ex:'封面点睛之笔'},
  {name:'接广话术', ico:ICON_DEAL, desc:'商务合作', rec:'从“粉丝数+报价”开始', color:'#34c759', bg:'linear-gradient(135deg,#34c759,#7be099)', ex:'PR 合作沟通'},
  {name:'个人简介', ico:ICON_USER, desc:'账号定位', rec:'从“一句话定位”开始', color:'#0a8f7c', bg:'linear-gradient(135deg,#0a8f7c,#3fbfa8)', ex:'账号名片'}
];
function renderCreate(){
  const d = Store.data;
  const hist = d.history.slice().reverse();
  const cur = SceneMeta[createScene];
  $('#content').innerHTML = `
  <div class="section-head section-head--create"><h2>✨ AI 创作中心</h2><div class="section-actions"><button class="btn btn-ghost btn-sm" onclick="openAiFullFlow()">🚀 一键全流程</button><button class="btn btn-ghost btn-sm" onclick="openCardMaker()">🖼️ 图文卡片</button><button class="btn btn-ghost btn-sm" onclick="openImageGen()">🎨 AI 生图</button><button class="btn btn-ghost btn-sm" onclick="openVisionGen()">🔍 图生文</button><button class="btn btn-ghost btn-sm" onclick="openTitleScorer()">📊 标题打分</button><span class="pill">6 大核心场景 · 创作前/写完各看一眼</span></div></div>
  <p style="color:var(--text2);font-size:13px;margin-bottom:16px;line-height:1.7">输入主题，选择场景，一键生成可直接发布的笔记内容。<b style="color:var(--text)">「🚀 一键全流程」</b>输入一个主题，标题、正文、标签、封面、发布时间全给你。</p>
  <div class="create-scenes">
    <!-- V6.45：只露出 6 个核心场景，剩余 4 个放进「更多」抽屉 -->
    ${SceneMeta.map(function(s,i){
      const HIDDEN = [3,5,6,7]; // 情绪共鸣/视频脚本/直播话术/封面标题 → 折叠
      if(HIDDEN.indexOf(i)>=0) return '';
      const on = createScene===i;
      return '<div class=\'scene-card '+(on?'active':'')+'\' onclick=\'setScene('+i+')\'>'+
        '<span class="sc-icon">' + s.ico + '</span>' +
        '<span class="sc-name">' + s.name + '</span>' +
        '<span class="sc-desc">' + s.desc + '</span>' +
        '<span class="sc-rec" title="推荐起点">💡 ' + s.rec + '</span>' +
      '</div>';
    }).join('')}
    <div class="scene-more" onclick="toggleSceneMore()" id="sceneMoreBtn"><span>👇 还有 4 个场景（视频/直播/封面/情绪）</span></div>
    <div id="sceneMoreBox" style="display:none;margin-top:14px">${SceneMeta.map(function(s,i){
      const HIDDEN = [3,5,6,7];
      if(HIDDEN.indexOf(i)<0) return '';
      const on = createScene===i;
      return '<div class=\'scene-card '+(on?'active':'')+'\' onclick=\'setScene('+i+')\'>'+
        '<span class="sc-icon">' + s.ico + '</span>' +
        '<span class="sc-name">' + s.name + '</span>' +
        '<span class="sc-desc">' + s.desc + '</span>' +
      '</div>';
    }).join('')}</div>
  </div>
  <div class="grid grid-2" style="margin-top:16px">
    <div class="create-panel">
      <div style="padding:16px">
        <div style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="color:var(--red)">${cur.ico}</span>${cur.name}生成器</div>
        ${typeof personaSelectHtmlForForm==='function' ? '<div class="form-group"><label class="label" style="display:flex;justify-content:space-between;align-items:center">🎭 账号人设<button class="btn btn-ghost" style="font-size:11px;padding:2px 8px" onclick="openPersonaManager()">管理</button></label><select id="aiPersona" onchange="setActivePersona(this.value)">'+personaSelectHtmlForForm()+'</select></div>' : ''}
        <div class="form-group"><label class="label" style="display:flex;align-items:center;justify-content:space-between">主题 / 关键词<button class="btn btn-ghost" style="font-size:11px;padding:3px 8px" onclick="fillTopicRandom()">🎲 随机灵感</button></label><input id="aiKw" placeholder="如：通勤妆容、副业搞钱、空气炸锅…"></div>
        <div style="margin:8px 0 14px"><div style="font-size:11.5px;color:var(--text3);margin-bottom:6px;letter-spacing:.3px">🔥 热门话题 · 点一下直接填入</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${Object.keys(TOPIC_BANK).map(function(cat){var first = TOPIC_BANK[cat][0]; return '<span class="topic-tag" data-cat="'+cat+'" onclick="fillTopic(\''+cat+'\',\''+first.replace(/'/g,"\\'")+'\')" title="'+esc(first)+'"><span class="tt-ico">'+({美妆:'💄',穿搭:'👗',美食:'🍗',旅行:'✈️',健身减肥:'💪',职场:'💼',情感:'💗',家居:'🏠',学习:'📚',宠物:'🐱'})[cat]+'</span><span class="tt-name">'+cat+'</span></span>';}).join('')}</div>
        </div>
        <div style="margin:4px 0 14px;padding:10px 12px;background:var(--bg);border-radius:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:12px;font-weight:700;color:var(--text2)">📚 我的灵感库 <span id="ideaBankCount" style="font-weight:400;color:var(--text3)">0 条</span></span>
            <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px" onclick="saveCurrentToBank()">＋ 收藏当前主题</button>
          </div>
          <div id="ideaBankBox" style="display:flex;flex-wrap:wrap;gap:6px"></div>
        </div>
        <div class="form-group"><label class="label">所属分类</label><div class="select-pills" id="aiCatP">${catOptions().map(function(c,i){return '<span class="chip '+(i===0?'active':'')+'" onclick="setAiCat(\''+c+'\',this)">'+c+'</span>';}).join('')}</div></div>
        <div class="form-group"><label class="label">语气风格 <button class="btn btn-ghost" style="font-size:11px;padding:2px 8px;margin-left:6px" onclick="openStyleGuide()">👀 每种长什么样？</button></label><div class="select-pills" id="aiMoodP">${STYLE_SAMPLES.map(function(s,i){return '<span class="chip '+(i===0?'active':'')+'" onclick="setAiMood(\''+s.name+'\',this)">'+s.name+'</span>';}).join('')}</div></div>
        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn btn-red" style="flex:1" onclick="runGenerate()">✨ 开始生成</button>
          <button class="btn btn-ghost" onclick="openBatchCreate()">⚡ 批量</button>
        </div>
        <div class="post-tool-row"><span class="post-tool-tip">📝 写完顺手用：</span><button class="post-tool-btn" onclick="openPreCheckStation()">🩺 发布前检查台</button><button class="post-tool-btn" onclick="openDeAIfy()">✍️ 去 AI 味</button><button class="post-tool-btn" onclick="openKeywordPlan()">🔍 关键词布局</button><button class="post-tool-btn" onclick="openBloggerStyle()">🎭 博主风格</button></div>
        <div class="ai-output" id="aiOutput">
          <div class="ai-empty">
            <div style="font-size:30px;margin-bottom:8px;opacity:.7">${cur.ico}</div>
            <div style="font-size:13.5px;font-weight:700;color:var(--text2);margin-bottom:4px">${cur.name} · 等待输入</div>
            <div style="font-size:12px;color:var(--text3);line-height:1.7">输入主题后点击「开始生成」，<br>例如：<b style="color:var(--text2)">${cur.ex}</b><br><span style="color:var(--green)">推荐起点：</span>${cur.rec}</div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="card" style="box-shadow:none">
        <div class="card-title">🕐 创作历史 <span style="font-size:12px;color:var(--text3);font-weight:400">${hist.length} 条</span></div>
        <div style="max-height:260px;overflow-y:auto">
          ${hist.length?hist.map(function(h){
            const typeCls = h.type==='标题'?'red':h.type==='正文'?'blue':'green';
            return '<div class="hist-item" style="cursor:pointer" onclick="viewHistory(\''+h.id+'\')"><span class="h-title">'+esc(h.title)+'</span><span class="pill '+typeCls+'" style="flex-shrink:0">'+h.type+'</span><span class="h-meta">'+h.time+'</span><button class="icon-btn" style="flex-shrink:0" onclick="event.stopPropagation();copyHistory(\''+h.id+'\')" title="复制">📋</button></div>';
          }).join(''):'<div class="empty" style="padding:18px 0"><span class="empty-ico">📝</span>还没有创作记录</div>'}
        </div>
      </div>
      <div class="card" style="box-shadow:none;margin-top:14px">
        <div class="card-title">💡 创作小贴士</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.9">${createTip(d)}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px">每天 1-2 条优质内容，胜过一周 10 条水文</div>
      </div>
    </div>
  </div>`;
  renderIdeaBank();
}
/* ================= V6.1.1 语气风格体系（可预览） ================= */
const STYLE_SAMPLES = [
  {name:'标准', desc:'日常聊天口吻，平实直接', sample:'早八通勤妆其实 10 分钟就够，重点是选对底妆和画眉，今天分享我的日常步骤。'},
  {name:'走心', desc:'深夜共情，金句收尾', sample:'以前我每天 6 点爬起来化妆，后来发现早八不值得牺牲睡眠。这个 10 分钟妆容，是我和自己和解的开始。'},
  {name:'专业', desc:'干货条理，数字说话', sample:'3 步完成早八通勤妆：①薄涂粉底液 ②夹翘睫毛 ③腮红提气色。全程 10 分钟，实测持妆 8 小时。'},
  {name:'种草', desc:'安利感强，激发购买欲', sample:'天呐姐妹们！这个早八通勤妆我真的会谢，10 分钟出门还被夸气色好，粉底液闭眼入！'},
  {name:'活泼', desc:'俏皮有趣，年轻人口吻', sample:'早八人速看！多睡 20 分钟的快乐我悟了哈哈哈，这个妆真的手残也能画 😆'},
  {name:'真诚', desc:'真实分享，信任感强', sample:'不吹不黑，这个方法我从手残党练到 10 分钟出门，踩过的坑都帮你避开了，放心抄。'}
];
function openStyleGuide(){
  Modal.open('🎨 语气风格预览', `
    <p style="font-size:12.5px;color:var(--text2);margin-bottom:12px">同一句内容，不同风格写出来是这样的（示例主题：早八通勤妆）：</p>
    ${STYLE_SAMPLES.map(function(s,i){
      return '<div style="margin-bottom:12px;padding:12px;background:var(--bg);border-radius:10px">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:4px"><b style="font-size:13px">'+s.name+'</b><span style="font-size:11px;color:var(--text3)">'+s.desc+'</span></div>'+
        '<div style="font-size:12.5px;color:var(--text2);line-height:1.8">“'+s.sample+'”</div>'+
        '<button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="copyText(this,\''+s.sample+')">📋 复制示例</button>'+
      '</div>';
    }).join('')}
    <div style="font-size:11px;color:var(--text3);text-align:center;line-height:1.7">在「AI 创作中心 / 一键全流程」里选好风格再生成，输出就是那个调性</div>`);
}

/* ================= V6.1.2 灵感快捷：随机灵感 + 热门话题分类（V5.9 借鉴） ================= */
const TOPIC_BANK = {
  '美妆': ['早八通勤妆 10 分钟教程', '黄黑皮显白口红合集', '油皮夏季不脱妆的粉底液', '学生党平价彩妆测评'],
  '穿搭': ['小个子梨形身材穿搭公式', '优衣库平价高级感搭配', '春季胶囊衣橱 5 件单品', '微胖女孩一周通勤穿搭'],
  '美食': ['打工人 10 分钟快手菜', '空气炸锅减脂餐', '便利店平价零食测评', '露营野餐便当'],
  '旅行': ['杭州 3 天 2 晚攻略', '大理环洱海自驾路线', '学生党穷游攻略', '小众拍照机位推荐'],
  '健身减肥': ['上班族 30 分钟居家燃脂', '戒糖 30 天变化', '懒人一周减脂餐', '跑步不伤膝盖姿势'],
  '职场': ['面试高频问题万能答法', '副业月入 5 万复盘', '简历优化 3 个细节', '向上管理沟通技巧'],
  '情感': ['分手后如何走出来', '异地恋维持技巧', '相亲高效脱单攻略', '高情商回话公式'],
  '家居': ['出租屋 500 元改造', '小户型收纳神器', '租房党搬家清单', '厨房小白必备好物'],
  '学习': ['期末一周逆袭计划', '英语口语速成法', 'PPT 模板高效套用', '雅思 7 分经验'],
  '宠物': ['新手养猫避坑指南', '狗狗定点上厕所训练', '猫砂盆除臭神器', '平价猫粮测评']
};
function fillTopicRandom(){
  const cats = Object.keys(TOPIC_BANK);
  const c = cats[Math.floor(Math.random()*cats.length)];
  const list = TOPIC_BANK[c];
  fillTopic(c, list[Math.floor(Math.random()*list.length)]);
}
function fillTopic(cat, kw){
  const elKw = $('#aiKw'); const elCat = $('#aiCat');
  if(elKw) elKw.value = kw;
  if(elCat){
    aiCat = cat;
    const pills = $$('#aiCatP .chip');
    pills.forEach(p=>p.classList.toggle('active', p.textContent === cat));
  }
  Toast('已填入「'+kw+'」· 分类「'+cat+'」');
}

/* ================= V6.1.4 我的灵感库（收藏主题复用） ================= */
function getIdeaBank(){
  Store.data.ideaBank = Store.data.ideaBank || [];
  return Store.data.ideaBank;
}
function saveToIdeaBank(kw, cat){
  if(!kw){ Toast('请先输入主题'); return false; }
  const bank = getIdeaBank();
  if(bank.some(x=>x.kw===kw && x.cat===cat)){ Toast('已在灵感库中'); return false; }
  bank.unshift({id:uid(), kw:String(kw).slice(0,30), cat:cat||'美妆', from:'手动收藏', date:fmtDate(new Date())});
  if(bank.length>40) bank.length = 40;
  Store.save(); renderIdeaBank(); Toast('已收藏到灵感库 ✨'); return true;
}
function saveCurrentToBank(){
  const kw = ($('#aiKw') && $('#aiKw').value || '').trim();
  if(!kw){ Toast('请先在主题输入框里写点什么'); return; }
  saveToIdeaBank(kw, aiCat || '美妆');
}
function fillFromBank(id){
  const item = getIdeaBank().find(x=>x.id===id);
  if(item){ fillTopic(item.cat, item.kw); }
}
function deleteIdeaBankItem(id, ev){
  if(ev) ev.stopPropagation();
  Store.data.ideaBank = getIdeaBank().filter(x=>x.id!==id);
  Store.save(); renderIdeaBank();
  Toast('已移除');
}
function renderIdeaBank(){
  const bank = getIdeaBank();  const countEl = $('#ideaBankCount');  if(countEl) countEl.textContent = bank.length + ' 条';
  const box = $('#ideaBankBox');
  if(!box) return;
  if(!bank.length){
    box.innerHTML = '<span style="color:var(--text3);font-size:11.5px">收藏主题后点这里直接填入，告别重复输入</span>';
    return;
  }
  box.innerHTML = bank.slice(0, 20).map(function(item){
    return '<span class="topic-tag" onclick="fillFromBank(\''+item.id+'\')" title="'+esc(item.from)+' · '+esc(item.date)+'"><span style="opacity:.55;margin-right:3px;font-size:11px">'+esc(item.cat)+'</span>'+esc(item.kw)+'<span onclick="deleteIdeaBankItem(\''+item.id+'\',event)" style="opacity:.4;margin-left:4px">×</span></span>';
  }).join('');
}

/* ================= V6.30 图文发布工作流（客户核心需求：发图片笔记） ================= */
let __pubImg = null; // 当前选中的图片 {dataURL, name}
function getPubQueue(){
  const ws = getActiveWs();
  try{ return JSON.parse(localStorage.getItem('xhs_pub_q_'+ws)||'[]'); }catch(e){ return []; }
}
function savePubQueue(q){ localStorage.setItem('xhs_pub_q_'+getActiveWs(), JSON.stringify(q)); }

function renderPublish(){
  if(!premiumGuard('图文发布')){ navigate('dashboard'); return; }
  const queue = getPubQueue();
  const ws = getWorkspaces().find(w=>w.id===getActiveWs());
  $('#content').innerHTML = `
  <div class="section-head"><h2>📷 图文发布工作台</h2><span class="pill red">发图片笔记专用</span></div>
  <div style="font-size:12px;color:var(--text2);margin-bottom:14px;line-height:1.8">发图文笔记就三步：<b>选图 → AI 配文 → 进待发清单</b>。图可以用相册图片 / AI 生图 / 图文卡片，文案 AI 一次给全（标题+正文+标签）。</div>
  <div class="pub-workspace" style="display:grid;grid-template-columns:1.1fr 1fr;gap:14px">
    <div>
      <div class="card" style="box-shadow:none">
        <div class="card-title">① 选图片</div>
        <div id="pubImgBox" style="min-height:220px;background:var(--bg);border:1.5px dashed var(--line);border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative">
          ${__pubImg ? '<img src="'+__pubImg.dataURL+'" style="width:100%;max-height:340px;object-fit:contain;border-radius:12px">' : '<div style="text-align:center;color:var(--text3);padding:30px 10px"><div style="font-size:34px;margin-bottom:8px">🖼️</div><div style="font-size:13px;font-weight:600">还没有选图</div><div style="font-size:11.5px;margin-top:4px">上传相册 / AI 生成 / 图文卡片，选一张</div></div>'}
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <label class="btn btn-red btn-sm" style="cursor:pointer">📁 上传图片<input type="file" accept="image/*" style="display:none" onchange="pubPickFile(this)"></label>
          <button class="btn btn-ghost btn-sm" onclick="pubGenImage()">🎨 AI 生一张</button>
          <button class="btn btn-ghost btn-sm" onclick="openCardMaker(true)">🖼️ 图文卡片</button>
          ${__pubImg ? '<button class="btn btn-ghost btn-sm" onclick="__pubImg=null;renderPublish()">✕ 移除</button>' : ''}
        </div>
      </div>
    </div>
    <div>
      <div class="card" style="box-shadow:none">
        <div class="card-title">② AI 配文 <span style="font-size:11px;color:var(--text3);font-weight:400">（标题+正文+标签一次给全）</span></div>
        <div class="form-group"><label class="label">主题（如：油皮粉底液测评）</label><input id="pubKw" placeholder="这张图想发什么？" value="${ws?esc(ws.name||''):''}"></div>
        <div class="form-group"><label class="label">语气</label>
          <div class="select-pills" id="pubMoodP">${STYLE_SAMPLES.slice(0,4).map(function(s,i){return '<span class="chip '+(i===0?'active':'')+'" onclick="setPubMood(\''+s.name+'\',this)">'+s.name+'</span>';}).join('')}</div>
        </div>
        <button class="btn btn-red btn-block" onclick="pubAiText()">🤖 生成标题+正文+标签</button>
        <div id="pubTextOut" style="margin-top:12px"></div>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:14px;box-shadow:none">
    <div class="card-title">③ 待发清单 <span style="font-size:12px;color:var(--text3);font-weight:400">${queue.length} 条</span></div>
    <div id="pubQueueBox">
      ${queue.length ? queue.map(function(p,i){
        return '<div style="display:flex;gap:10px;padding:10px;background:var(--bg);border-radius:10px;margin-bottom:8px;align-items:center;flex-wrap:wrap">' +
          '<img src="'+p.img+'" style="width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0">' +
          '<div style="flex:1;min-width:140px"><div style="font-weight:600;font-size:12.5px">'+esc(p.title||'未命名')+'</div>' +
          '<div style="font-size:11px;color:var(--text3);margin-top:2px">'+(p.cat||'')+' · '+(p.date||'')+(p.status==='done'?' · <b style="color:var(--green)">已发布</b>':'')+'</div></div>' +
          (p.status!=='done' ? '<button class="btn btn-red btn-sm" onclick="pubSchedule(\''+p.id+'\')">📅 排期</button><button class="btn btn-ghost btn-sm" onclick="pubMarkDone(\''+p.id+'\')">✓ 已发</button>' : '') +
          '<button class="icon-btn" onclick="pubDelete(\''+p.id+'\')" style="font-size:12px">🗑️</button>' +
        '</div>';
      }).join('') : '<div class="empty" style="padding:20px"><span class="empty-ico">📤</span>待发清单是空的<br><span style="font-size:11.5px;color:var(--text3)">选好图配好文，点「加入待发清单」</span></div>'}
    </div>
  </div>`;
  try{ renderIdeaBank(); }catch(e){}
}
let pubMood = '标准';
function setPubMood(m, el){
  pubMood = m;
  if(el){ $$('#pubMoodP .chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); }
}
/* 上传图片：压缩到 1080px 存内存，可预览 */
function pubPickFile(input){
  const f = input && input.files && input.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      try{
        const max = 1080;
        let w = img.width, h = img.height;
        if(w > max || h > max){ const r = Math.min(max/w, max/h); w = Math.round(w*r); h = Math.round(h*r); }
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        __pubImg = { dataURL: cv.toDataURL('image/jpeg', 0.82), name: f.name };
      }catch(e2){ __pubImg = { dataURL: e.target.result, name: f.name }; }
      renderPublish();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(f);
}
function pubGenImage(){
  Modal.close ? null : null;
  if(typeof openImageGen==='function'){ openImageGen(); }
  else Toast('请到 AI 创作中心使用 AI 生图');
}
/* AI 配文：标题+正文+标签 流式 */
async function pubAiText(){
  const kw = ($('#pubKw')&&$('#pubKw').value.trim());
  if(!kw){ Toast('请输入主题'); return; }
  const box = $('#pubTextOut');
  box.innerHTML = '<div class="loading">🤖 AI 正在配文…</div>';
  const sys = '你是小红书图文笔记文案专家。基于图片主题输出：\n【标题】3 个备选（数字/人群/反差混合，一行一个）\n【正文】300-450 字，口语化带 emoji，开头抓人\n【话题标签】6-8 个\n只输出这三段，不要其他内容。';
  const prompt = '图片笔记主题「'+kw+'」，语气 '+pubMood+'。';
  const streamEl = document.createElement('div');
  streamEl.style.cssText = 'background:var(--bg);border-radius:10px;padding:12px 14px;font-size:12.5px;line-height:1.8;white-space:pre-wrap;max-height:300px;overflow-y:auto';
  box.innerHTML = ''; box.appendChild(streamEl);
  let full = '';
  const r = await aiAsk(prompt, sys, '', t=>{ full = t; streamEl.textContent = t + '▌'; });
  if(!r.ok){ box.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+esc(r.msg||'生成失败')+'</div>'; return; }
  if(!full) full = r.text;
  streamEl.textContent = full;
  box.insertAdjacentHTML('beforeend',
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<button class="btn btn-red btn-sm" onclick="pubToQueue(\''+esc(kw).replace(/'/g,"\\'")+'\', '+JSON.stringify(full)+')">📤 加入待发清单</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="copyText(this, '+JSON.stringify(full)+')">📋 复制文案</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="pubAiText()">🔄 换一版</button>' +
    '</div>');
  window.__pubText = full;
}
/* 图文合并入待发清单 */
function pubToQueue(kw, text){
  if(!__pubImg){ Toast('请先选一张图片'); return; }
  const title = (text.match(/【标题】\s*([^\n]+)/) || [])[1] || kw || '图片笔记';
  const q = getPubQueue();
  q.unshift({ id: uid(), img: __pubImg.dataURL, title: title.trim().replace(/^[0-9]+[.、）)]\s*/,'').slice(0,30), kw: kw||'', text: text||'', cat: aiCat||'美妆', date: todayStr(), status: 'ready' });
  savePubQueue(q);
  Toast('已加入待发清单 ✅');
  __pubImg = null; window.__pubText = null;
  renderPublish();
}
function pubSchedule(id){
  const q = getPubQueue(); const p = q.find(x=>x.id===id); if(!p) return;
  // 先存素材库（图片），再打开排期
  if(p.img){ try{ Store.data.assets.unshift({id:uid(), type:'image', name:(p.title||'图片笔记')+'配图', dataURL:p.img, size:'', date:todayStr().slice(5)}); Store.save(); }catch(e){} }
  openPlanAdd();
  setTimeout(()=>{
    try{
      const inp = document.getElementById('planTitleNew');
      if(inp) inp.value = (p.title||'').slice(0,40);
    }catch(e){}
  }, 200);
}
function pubMarkDone(id){
  const q = getPubQueue(); const p = q.find(x=>x.id===id); if(!p) return;
  p.status = 'done'; savePubQueue(q); renderPublish(); Toast('已标记发布 ✅');
}
function pubDelete(id){
  const q = getPubQueue().filter(x=>x.id!==id); savePubQueue(q); renderPublish(); Toast('已移除');
}

function createTip(d){
  const tips = [
    '<b>数字是流量密码</b>：标题里加具体数字（3 个方法、5 步搞定）点击率比纯文字高 67%。',
    '<b>情绪价值 > 信息价值</b>：用户先刷的是情绪，理性排在后面。先击中情绪再讲干货。',
    '<b>前 3 秒定生死</b>：视频开头必须抛钩子（痛点/反差/悬念），否则直接划走。',
    '<b>长尾关键词</b>：用「下划线」「=」把核心词圈起来，平台能识别为可检索标签。',
    '<b>评论区是二次创作</b>：置顶一条能引发讨论的评论，引导用户互动 → 拉高权重。',
    '<b>封面统一风格</b>：3-4 套固定模板交替用，比每篇都重新设计更出品牌感。',
    '<b>发布时段</b>：7-9 点通勤、12-13 点午休、20-22 点睡前，是小红书三大流量高峰。',
    '<b>数据复盘三件套</b>：完读率 < 30% 改开头；点赞率 < 3% 改标题；涨粉率 < 0.5% 改互动设计。',
    '<b>不要纯堆关键词</b>：AI 写完用人话读一遍，去掉生硬的词组堆砌才像人写的。',
    '<b>做系列比单篇强</b>：把爆款做成「XX 系列 1/5/10」让用户主动追更，单篇撬动整账号权重。'
  ];
  return tips[new Date().getDate() % tips.length];
}

/* ================= V6.53「活的工作台」引擎 =================
 * 目标：客户每次打开都能感到"这产品是活的" —— 内容每天不同、界面有新鲜锚点、
 * 有每天可完成的小闭环（形成习惯）、偶尔有惊喜（里程碑庆祝）。
 * 四条腿：① 时间锚点 ② 每日锦囊（服务端每天不同）③ 今日三件事 ④ 里程碑彩蛋
 * ============================================================ */

/* ① 时间锚点：节气 / 大促倒计时 / 年度进度 —— 每天看都不一样 */
const SOLAR_TERMS = [['小寒',1,5],['大寒',1,20],['立春',2,4],['雨水',2,19],['惊蛰',3,5],['春分',3,20],['清明',4,5],['谷雨',4,20],['立夏',5,5],['小满',5,21],['芒种',6,5],['夏至',6,21],['小暑',7,7],['大暑',7,23],['立秋',8,7],['处暑',8,23],['白露',9,8],['秋分',9,23],['寒露',10,8],['霜降',10,23],['立冬',11,7],['小雪',11,22],['大雪',12,7],['冬至',12,21]];
const BIG_DAYS = [['年货节',1,17],['女神节',3,8],['五一',5,1],['618 年中大促',6,18],['开学季',9,1],['双 11',11,11],['双 12',12,12],['跨年',12,31]];
function todayAnchor(){
  const now = new Date();
  const md = (now.getMonth()+1) + '/' + now.getDate();
  // 节气：当天或 3 天内
  for(const [name,m,dd] of SOLAR_TERMS){
    const diff = Math.round((new Date(now.getFullYear(), m-1, dd) - new Date(now.getFullYear(), now.getMonth(), now.getDate()))/864e5);
    if(diff === 0) return { tag:'🍃 今日'+name, sub:'节气内容今天发，流量有加成' };
    if(diff > 0 && diff <= 3) return { tag:'🍃 '+diff+' 天后'+name, sub:'可以提前准备节气选题了' };
  }
  // 大促倒计时（30 天内才提醒，避免天天喊）
  let best = null;
  for(const [name,m,dd] of BIG_DAYS){
    let y = now.getFullYear();
    let diff = Math.round((new Date(y, m-1, dd) - new Date(y, now.getMonth(), now.getDate()))/864e5);
    if(diff < 0){ y += 1; diff = Math.round((new Date(y, m-1, dd) - new Date(y, now.getMonth(), now.getDate()))/864e5); }
    if(diff >= 1 && diff <= 30 && (!best || diff < best.diff)) best = { name, diff };
  }
  if(best) return { tag:'⏳ 距 '+best.name+' 还有 '+best.diff+' 天', sub: best.diff<=7 ? '现在是种草黄金期，赶紧发' : '提前 3-7 天发种草内容最佳' };
  // 日常：年度进度
  const start = new Date(now.getFullYear(),0,1);
  const dayOfYear = Math.round((now - start)/864e5) + 1;
  const pass = Math.round(dayOfYear/365*100);
  return { tag:'📅 今年第 '+dayOfYear+' 天', sub:'今年已过 '+pass+'%，别让账号也停下来' };
}
/* ② 每日锦囊（服务端每天不同；本地兜底） */
/* ===== 云端基址解析（V6.44 修复） =====
   旧代码取址函数在 GitHub Pages 上会兜底返回 location.origin（= shiming-ai.github.io），
   导致 /dailytip /hotdaily /opportunity 等请求打到静态站点变成 404/405。
   这里统一改为优先使用真正的后端地址；拿不到地址就静默跳过，不发无效请求。 */
function cfCloudBase(){
  try{
    var manual = localStorage.getItem('xhs_seller_cloud');
    if(manual){ var c=JSON.parse(manual); if(c && c.api && /^https?:\/\//i.test(c.api)) return c.api.replace(/\/$/,'').replace(/\/api$/,''); }
  }catch(e){}
  try{
    var own = JSON.parse(localStorage.getItem('xhs_cloud_api')||'null');
    if(own && own.api && /cf-cloud-sync|netlify/i.test(own.api)) return own.api.replace(/\/$/,'').replace(/\/api$/,'');
  }catch(e){}
  try{ var q=new URLSearchParams(location.search).get('cloud'); if(q && /^https?:\/\//i.test(q)) return q.replace(/\/$/,'').replace(/\/api$/,''); }catch(e){}
  try{ if(/cf-cloud-sync|netlify/i.test(location.origin)) return location.origin.replace(/\/$/,'').replace(/\/api$/,''); }catch(e){}
  return (typeof CF_CLOUD_API !== 'undefined' && CF_CLOUD_API) ? String(CF_CLOUD_API).replace(/\/$/,'').replace(/\/api$/,'') : '';
}
function getDailyTip(){
  try{ return JSON.parse(localStorage.getItem('xhs_dailytip')||'null'); }catch(e){ return null; }
}
async function syncDailyTip(){
  try{
    const base = cfCloudBase(); if(!base) return;
    const r = await fetch(base + '/api/dailytip', { cache:'no-store' });
    const j = await r.json();
    if(j.ok && j.data && j.data.tip){
      const prev = getDailyTip();
      localStorage.setItem('xhs_dailytip', JSON.stringify(j.data));
      if((!prev || prev.tip !== j.data.tip) && currentPage === 'dashboard') renderDashboard();
    }
  }catch(e){}
}
/* ③ 今日三件事：按真实数据动态生成，隔天自动重置，全部完成给正反馈 */
function dailyTaskState(){
  const today = todayStr();
  let st = Store.data.dailyTasks;
  if(!st || st.date !== today){
    st = { date: today, done: {} };
    Store.data.dailyTasks = st;
    Store.save();
  }
  return st;
}
function buildDailyTasks(d){
  const today = todayStr();
  const list = [];
  const due = (d.schedule||[]).filter(s=>s.status==='ready' && s.date<=today).length;
  const overdue = (d.schedule||[]).filter(s=>s.status==='ready' && s.date<today).length;
  const drafts = (d.contents||[]).filter(c=>c.status==='draft').length;
  const noData = (d.contents||[]).filter(c=>c.status==='published' && !(c.views>0)).length;
  // 电商优先：有在售商品且 7 天没发带货笔记
  const shopData = (d.shop && Array.isArray(d.shop.products)) ? d.shop : {products:[]};
  const selling = shopData.products.filter(p=>p.status==='selling');
  const shopRecent = (d.contents||[]).some(c=>c.productId && c.date >= fmtDate(addDays(-7)));
  if(selling.length && !shopRecent){
    list.push({ id:'shop', ico:'🛒', txt:`给 ${selling.length} 个在售商品写 1 篇带货笔记`, act:"navigate('shop')", go:'去带货' });
  }
  if(overdue>0) list.push({ id:'overdue', ico:'⚠️', txt:`补发 ${overdue} 条已逾期的内容`, act:"navigate('schedule')", go:'去处理' });
  else if(due>0) list.push({ id:'due', ico:'🚀', txt:`发布今天到期的 ${due} 条内容`, act:"navigate('schedule')", go:'去发布' });
  if(drafts>0) list.push({ id:'draft', ico:'✍️', txt:`把 ${drafts} 篇草稿写完`, act:"navigate('create')", go:'去写稿' });
  else list.push({ id:'create', ico:'✍️', txt:'写 1 篇新笔记（保持更新节奏）', act:"navigate('create')", go:'去创作' });
  if(noData>0) list.push({ id:'data', ico:'📊', txt:`给 ${noData} 篇已发内容补录数据`, act:'openDataEntry()', go:'去录入' });
  else list.push({ id:'topic', ico:'💡', txt:'收藏 2 个潜力选题备用', act:"navigate('topics')", go:'去发现' });
  // V6.54 替补池：换一件时从这几条里顶上（保证永远有事可做，不会换空）
  list.push({ id:'bench', ico:'🔍', txt:'研究 1 个对标账号今天发了什么', act:"navigate('benchmark')", go:'去看' });
  list.push({ id:'review', ico:'📈', txt:'复盘昨天数据，挑出最好的 1 篇', act:"navigate('analytics')", go:'去复盘' });
  list.push({ id:'title', ico:'🧰', txt:'用工具箱给明天备 3 个标题', act:"navigate('toolbox')", go:'去生成' });
  return list;
}
/* 从候选池挑出今天真正展示的 3 件（被"换掉"的不再出现） */
function pickDailyTasks(d){
  const st = Store.data.dailyTasks || {};
  const skip = st.skip || {};
  const all = buildDailyTasks(d);
  const out = all.filter(t=>!skip[t.id]).slice(0,3);
  return out.length ? out : all.slice(0,3);   // 换无可换时回退默认三件，绝不空
}
/* 换一件：当前这件不合手 → 换替补顶上（避免用户因"不想做"而放弃整个习惯） */
function swapDailyTask(id){
  const st = dailyTaskState();
  if(!st.skip) st.skip = {};
  st.skip[id] = 1;
  delete st.done[id];
  Store.save();
  const next = pickDailyTasks(Store.data);
  Toast('🔄 已换一件' + (next.length ? '：' + (next[next.length-1].txt||'') : ''));
  renderDashboard();
}
/* 锦囊换一条：今天这条不感兴趣 → 换一条本地实用锦囊（不消耗 AI，秒出） */
const TIP_LOCAL = [
  {c:'标题', t:'标题里放<b>具体数字</b>（3 个方法、5 步搞定），点击率比纯文字高一大截。'},
  {c:'封面', t:'封面留 <b>1/3 空白</b> 写字，字要大到手机缩略图也能看清。'},
  {c:'内容', t:'前 3 行决定完读率：先把<b>最有用的结论</b>说出来，再讲过程。'},
  {c:'互动', t:'结尾别问"你觉得呢"，改成<b>二选一</b>（A 还是 B？），评论量翻倍。'},
  {c:'标签', t:'标签 5-8 个就够：<b>2 个大词 + 3 个精准词 + 2 个长尾词</b>。'},
  {c:'发布', t:'发完别马上走，前 <b>30 分钟</b>留在站内回评论，能拉初始权重。'},
  {c:'数据', t:'点赞率低于 3% 改<b>标题</b>，完读率低于 30% 改<b>开头</b>，别乱改全文。'},
  {c:'选题', t:'把爆款做成<b>系列</b>（1/5/10），让用户主动追更，比单篇更省选题。'},
  {c:'避坑', t:'别在同一篇里塞 3 个主题，平台识别不出赛道，推荐会变窄。'},
  {c:'变现', t:'接广前先看<b>粉丝画像</b>匹配度，不匹配的单子掉粉比赚钱更亏。'},
  {c:'心态', t:'前 20 篇数据差是正常的，平台在识别你的赛道，坚持垂直就好。'},
  {c:'效率', t:'一次拍 3 条素材、一次写 3 篇稿，比每天现想<b>省一半时间</b>。'}
];
function nextTip(){
  const today = todayStr();
  if(!Store.data.tipSwap || Store.data.tipSwap.date !== today) Store.data.tipSwap = {date:today, n:0};
  const cur = Store.data.tipSwap.cur || '';
  let pool = TIP_LOCAL.filter(x => x.t !== cur);
  if(!pool.length) pool = TIP_LOCAL;
  const pick = pool[(Store.data.tipSwap.n + new Date().getMinutes()) % pool.length];
  Store.data.tipSwap.n += 1;
  Store.data.tipSwap.cur = pick.t;
  Store.data.tipSwap.c = pick.c;
  Store.data.tipSwap.t = pick.t;
  Store.save();
  renderDashboard();
}
function toggleDailyTask(id){
  const st = dailyTaskState();
  st.done[id] = !st.done[id];
  Store.save();
  const tasks = pickDailyTasks(Store.data);
  const doneN = tasks.filter(t=>st.done[t.id]).length;
  if(st.done[id]){
    if(doneN >= tasks.length){
      // 三件事全完成 → 连续天数 +1 并给正反馈（习惯闭环的"甜头"）
      try{ updateStreak(); }catch(e){}
      Store.data.dailyTasks.allDoneDate = todayStr();
      Store.save();
      celebrateTasks();
    } else {
      Toast('✅ 完成 '+doneN+'/'+tasks.length+'，还差 '+(tasks.length-doneN)+' 件');
    }
  }
  renderDashboard();
  checkMilestone();
}
function celebrateTasks(){
  const sk = Store.data.streak || {count:0};
  Toast('🎉 今日三件事全部完成！连续运营 '+sk.count+' 天');
  try{
    Modal.open('🎉 今天很棒', `
      <div style="text-align:center;padding:6px 0 2px">
        <div style="font-size:40px;line-height:1">🏆</div>
        <div style="font-size:16px;font-weight:800;margin:10px 0 6px">今日三件事，全部完成</div>
        <div style="font-size:12.5px;color:var(--text2);line-height:1.8">
          已连续运营 <b style="color:var(--red)">${sk.count}</b> 天<br>
          明天这个时候，再来 3 件小事就够了
        </div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn btn-ghost btn-sm" style="flex:1" onclick="Modal.close();openShareCard&&openShareCard()">📤 晒个战绩</button>
          <button class="btn btn-red btn-sm" style="flex:1" onclick="Modal.close()">继续加油</button>
        </div>
      </div>`);
  }catch(e){}
}
/* ④ 里程碑彩蛋：只在首次达成时出现一次，不做骚扰式弹窗 */
function checkMilestone(){
  try{
    // 已有弹窗时不抢（避免与「今日三件事」庆祝互相覆盖）；本轮不记录 seen，下次再弹
    const mEl = document.getElementById('modal');
    if(mEl && getComputedStyle(mEl).display !== 'none') return;
    const d = Store.data;
    const seen = JSON.parse(localStorage.getItem('xhs_milestones')||'{}');
    const sk = d.streak || {count:0};
    const pubN = (d.contents||[]).filter(c=>c.status==='published').length;
    const fans = (d.analytics&&d.analytics.overview&&d.analytics.overview.fans)||0;
    const hits = [];
    [3,7,14,30,60,100].forEach(n=>{ if(sk.count>=n) hits.push({k:'streak'+n, ico:'🔥', t:'连续运营 '+n+' 天', s:'稳定输出是最难也最值钱的能力'}); });
    [10,30,50,100,300].forEach(n=>{ if(pubN>=n) hits.push({k:'pub'+n, ico:'📚', t:'已发布 '+n+' 篇内容', s:'内容资产在积累，复利开始显现' }); });
    [1000,5000,10000,50000].forEach(n=>{ if(fans>=n) hits.push({k:'fans'+n, ico:'🎉', t:'粉丝突破 '+fmtNum(n), s:'这个节点值得记一下' }); });
    const fresh = hits.filter(h=>!seen[h.k]);
    if(!fresh.length) return;
    const m = fresh[fresh.length-1];
    fresh.forEach(h=>seen[h.k]=1);
    localStorage.setItem('xhs_milestones', JSON.stringify(seen));
    setTimeout(()=>{
      try{
        Modal.open('🎊 达成新成就', `
          <div style="text-align:center;padding:6px 0 2px">
            <div style="font-size:44px;line-height:1">${m.ico}</div>
            <div style="font-size:17px;font-weight:800;margin:10px 0 6px">${m.t}</div>
            <div style="font-size:12.5px;color:var(--text2);line-height:1.8">${m.s}</div>
            <div style="display:flex;gap:8px;margin-top:14px">
              <button class="btn btn-ghost btn-sm" style="flex:1" onclick="Modal.close();typeof openShareCard==='function'&&openShareCard()">📤 生成战绩卡</button>
              <button class="btn btn-red btn-sm" style="flex:1" onclick="Modal.close()">继续冲</button>
            </div>
          </div>`);
      }catch(e){}
    }, 900);
  }catch(e){}
}
/* ⑤ 数字滚动：让 KPI 数字"跳"起来（轻量，不影响低端机） */
function countUp(sel){
  try{
    document.querySelectorAll(sel).forEach(el=>{
      const raw = el.getAttribute('data-num');
      if(raw === null) return;
      const target = parseFloat(raw); if(isNaN(target)) return;
      const dur = 600, t0 = performance.now();
      const fmt = v => target >= 1000 ? fmtNum(Math.round(v)) : String(Math.round(v));
      function step(t){
        const p = Math.min(1, (t - t0)/dur);
        el.textContent = fmt(target * (1 - Math.pow(1-p, 3)));
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }catch(e){}
}

/* ================= V6.1 AI 一键全流程创作（尊享版） ================= */
let ffResult = '';
function openAiFullFlow(){
  if(!premiumGuard('AI 一键全流程')) return;
  Modal.open('🚀 AI 一键全流程创作', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">输入一个主题，AI 一次产出整套可发布方案：<b>3 个标题 → 正文 → 话题标签 → 封面建议 → 最佳发布时间</b>。真正"一句话出一篇可发笔记"。</p>
    <div class="form-group"><label class="label">主题</label><input id="ffKw" placeholder="如：早八通勤妆、空气炸锅减脂餐"></div>
    <div class="form-group"><label class="label">所属分类</label><select id="ffCat">${catOptions().map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="label">语气风格 <button class="btn btn-ghost" style="font-size:11px;padding:2px 8px;margin-left:6px" onclick="openStyleGuide()">👀 每种长什么样？</button></label><select id="ffStyle">${STYLE_SAMPLES.map(s=>`<option>${s.name}（${s.desc}）</option>`).join('')}</select></div>
    <button class="btn btn-red btn-block" onclick="runAiFullFlow()">🚀 一键生成</button>
    <div id="ffOut" style="margin-top:14px"></div>`);
}
async function runAiFullFlow(){
  const kw = $('#ffKw').value.trim(); if(!kw){ Toast('请输入主题'); return; }
  const cat = $('#ffCat').value;
  const styleVal = $('#ffStyle') ? $('#ffStyle').value : '';
  const styleName = styleVal.split('（')[0] || '标准';
  const styleDesc = styleVal.match(/（(.*?)）/)?.[1] || '日常聊天口吻';
  const out = $('#ffOut');
  out.innerHTML = '<div class="loading">🤖 AI 正在全流程创作…（标题→正文→标签→封面→时间，边生成边显示）</div>';
  const prompt = '我是小红书「'+cat+'」赛道的博主。请围绕主题「'+kw+'」为我生成一篇可直接发布的完整笔记方案。\n\n语气风格：'+styleName+'（'+styleDesc+'），全文必须保持这个调性。\n\n严格按此格式输出：\n【标题】3 个备选（数字+场景+卖点，一行一个）\n【正文】500-700 字，分 4-5 段，含适量 emoji，口语化，开头 2 句必须抓人\n【话题标签】5-8 个，第一个用「下划线」圈出主词\n【封面建议】一句话封面文案 + 构图建议\n【最佳发布时间】2 个时段及理由\n\n要求：内容原创、具体、不空泛，贴合 2026 年小红书环境。';
  const sys = '你是资深小红书爆款笔记操盘手，输出必须具体可执行。';
  const streamEl = document.createElement('div');
  streamEl.style.cssText = 'background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:360px;overflow-y:auto';
  out.innerHTML = '';
  out.appendChild(streamEl);
  let full = '';
  const r = await (typeof proAiAsk==='function'
    ? proAiAsk(prompt, sys)
    : aiAsk(prompt, sys, '', t=>{ full=t; streamEl.textContent = t+'▌'; }));
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px;line-height:1.8">⚠️ '+esc(r.msg||'生成失败')+'</div>'; return; }
  if(!full) full = r.text;
  ffResult = full;
  // 分段渲染：标题 / 正文 / 标签 / 封面 / 时间 各自可复制
  streamEl.textContent = full;
  const sections = splitFlowSections(full);
  const segHtml = sections.map(s=>{
    if(!s.content) return '';
    return '<div style="margin-top:10px;background:var(--bg);border-radius:10px;padding:12px 14px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:4px">' +
        '<b style="font-size:12.5px">'+esc(s.name)+'</b>' +
        '<button class="btn btn-ghost btn-sm" onclick="copyText(this, '+JSON.stringify(s.content)+')" style="padding:3px 10px;font-size:11px">📋 复制</button>' +
      '</div>' +
      '<div style="font-size:12.5px;color:var(--text2);line-height:1.8;white-space:pre-wrap">'+esc(s.content)+'</div>' +
    '</div>';
  }).join('');
  out.innerHTML = streamEl.outerHTML + segHtml +
    '<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">' +
      '<button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'+JSON.stringify(full)+')">📋 复制整篇</button>' +
      '<button class="btn btn-red btn-sm" style="flex:1" onclick="saveFullFlow()">📥 存入内容库</button>' +
      '<button class="btn btn-ghost btn-sm" style="flex:1" onclick="openPlanAddWith(\''+esc(kw)+'\', \''+esc(full).replace(/'/g,"\\'")+'\')">📅 排期发布</button>' +
    '</div>';
}
/* 把全流程结果按【标题】【正文】等分段解析 */
function splitFlowSections(text){
  const names = ['标题','正文','话题标签','封面建议','最佳发布时间'];
  const parts = [];
  const re = /【([^】]+)】/g;
  let lastIdx = 0, lastName = '';
  let m;
  const marks = [];
  while((m = re.exec(text))){ marks.push({name:m[1], idx:m.index}); }
  marks.forEach((mk, i)=>{
    const end = i < marks.length-1 ? marks[i+1].idx : text.length;
    parts.push({name: mk.name, content: text.slice(mk.idx + mk.name.length + 4, end).trim()});
  });
  // 标题前的引言忽略
  if(text.indexOf('【') > 0 && parts.length){ }
  return parts.length ? parts : [{name:'全文', content:text}];
}
function saveFullFlow(){
  if(!ffResult){ Toast('暂无内容'); return; }
  const m = ffResult.match(/【标题】([\s\S]*?)(?=\n【正文|【)/);
  let title = '';
  if(m){ title = m[1].split('\n').map(x=>x.replace(/^[0-9]+[.、）)]\s*/,'')).filter(Boolean)[0] || ''; }
  if(!title) title = 'AI 全流程笔记 ' + todayStr();
  title = title.slice(0, 30);
  Store.data.contents.unshift({id:uid(), title, status:'draft', date:todayStr(), cat:($('#ffCat')&&$('#ffCat').value)||'美妆', body:ffResult, views:0, likes:0, collects:0, comments:0});
  Store.save(); Modal.close(); Toast('已存入内容库 ✅'); setTimeout(()=>navigate('library'), 600);
}
let aiCat = '美妆', aiMood = '标准';
function setScene(i){ createScene=i; renderCreate(); }
function setAiCat(c,el){ aiCat=c; $$('#aiCatP .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); }
function setAiMood(m,el){ aiMood=m; $$('#aiMoodP .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); }

async function runGenerate(){
  if(!proGuard('AI 创作')) return;
  const kw = $('#aiKw').value.trim();
  if(!kw){ Toast('请先输入主题关键词'); return; }
  const out = $('#aiOutput');
  // V6.29 真实 AI（流式）：彻底替代本地模板拼凑，立即可见生成过程
  out.innerHTML = '<div class="loading"><span style="margin-right:8px">🤖</span>AI 正在创作中…（约 5-15 秒）</div>';
  const sceneName = SceneMeta[createScene].name;
  const persona = window.__activePersona || '';
  // V6.30 场景专属引擎：10 个场景各自的 AI prompt（全网最强创作中心的底层）
  const engine = SCENE_ENGINE[sceneName];
  let sys = engine ? engine.sys : '你是小红书爆款笔记操盘手，输出必须具体可执行。';
  let prompt = '';
  if(engine){
    prompt = engine.user.replace('{kw}', kw).replace('{cat}', aiCat).replace('{mood}', aiMood)
      .replace('{fans}', fmtNum((Store.data.analytics&&Store.data.analytics.overview&&Store.data.analytics.overview.fans)||0))
      + ' 账号人设：' + (persona||'通用') + '。';
    if(createScene===0) sys += ' 标题要 8 个。';
  } else {
    sys = '你是小红书爆款笔记操盘手，专做 30 天涨粉过万的内容。输出必须：1) 标题钩子有数字+人群+痛点/反差 2) 正文有信息密度、有口语节奏、emoji 自然。';
    prompt = '围绕主题「'+kw+'」（赛道：'+aiCat+'，语气：'+aiMood+'，账号人设：'+(persona||'通用')+'），写一篇小红书「'+sceneName+'」内容。开头 3 行必须勾住读者，正文用 emoji 切段，结尾留下钩子。只输出内容，不要开场白。';
  }
  let fullText = '';
  const streamEl = document.createElement('div');
  streamEl.style.cssText = 'font-size:13px;line-height:1.95;white-space:pre-wrap;color:var(--text);min-height:80px';
  out.innerHTML = '';
  out.appendChild(streamEl);
  const startedAt = Date.now();
  let firstChunkAt = 0;
  const onChunk = (t) => {
    if(!firstChunkAt) firstChunkAt = Date.now();
    fullText = t;
    streamEl.textContent = t + '▌';
  };
  const r = await aiAsk(prompt, sys, '', onChunk);
  if(!r.ok){
    out.innerHTML = '<div style="background:rgba(255,59,48,.08);border:1px solid rgba(255,59,48,.2);border-radius:10px;padding:14px;font-size:13px;color:#d63a3a;line-height:1.7">⚠️ AI 生成失败：<b>'+esc(r.msg||'未知错误')+'</b><br><span style="color:var(--text3);font-size:11.5px;display:block;margin-top:6px">· 检查网络 · <a href="javascript:runGenerate();" style="color:var(--red);text-decoration:underline">点此重试</a></span></div>';
    return;
  }
  streamEl.textContent = fullText;
  // 操作区
  const opts = document.createElement('div');
  opts.className = 'gen-options';
  opts.style.marginTop = '10px';
  opts.innerHTML = '<span class="pill red" style="margin-right:6px">'+sceneName+'</span>' +
    '<button class="btn btn-ghost btn-sm" onclick="runGenerate()">🔄 换一篇</button>' +
    '<button class="btn btn-red btn-sm" onclick="copyText(this, '+JSON.stringify(fullText)+')">📋 复制全部</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="saveToAssets(\''+esc(kw)+'\', \''+esc(fullText)+'\')">💾 存素材</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="saveToLibrary(\''+esc(kw)+'\', \''+esc(fullText)+'\')">📥 存内容库</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="openPlanAddWith(\''+esc(kw)+'\', \''+esc(fullText)+'\')">📅 排期发布</button>' +
    (createScene!==0 ? '<button class="btn btn-ghost btn-sm" onclick="openNoteReview(\''+esc(kw)+'\', \''+esc(fullText)+'\')">🧐 AI 评审</button>' : '');
  out.appendChild(opts);
  // 历史记录（存全文，可回看）
  Store.data.history.unshift({id:uid(), title:kw, type:sceneName, time:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}), preview: fullText.slice(0,30), body:fullText});
  Store.save(); updateBadges();
  // 性能统计
  const dur = firstChunkAt ? Math.round((firstChunkAt-startedAt)/1000*10)/10 : 0;
  console.log('[Crazy Friday AI] 首字延迟:', dur+'s,  总长:', fullText.length+' 字');
}
function openBatchCreate(){
  Modal.open('📦 批量生成 12 个标题', `
    <div class="form-group"><label class="label">主题</label><input id="batchKw" placeholder="输入主题关键词"></div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">AI 一次生成 <b>12 个爆款标题</b>（流式显示），适合快速筛选发布选题。</div>
    <button class="btn btn-red btn-block" onclick="doBatchCreate()">⚡ 开始批量生成</button>
    <div id="batchOut" style="margin-top:14px"></div>`);
}
async function doBatchCreate(){
  const kw = $('#batchKw').value.trim();
  if(!kw){ Toast('请输入主题'); return; }
  const box = $('#batchOut');
  box.innerHTML = '<div class="loading">AI 批量生成中…（12 个标题，约 10 秒）</div>';
  const streamEl = document.createElement('div');
  streamEl.style.cssText = 'font-size:13px;line-height:2;white-space:pre-wrap';
  box.innerHTML = ''; box.appendChild(streamEl);
  let full = '';
  const sys = '你是小红书爆款标题批量生产专家。一次性输出 12 个爆款标题，每个一行、编号 1-12，不要任何解释、不要标签、不要空行。要求多样化：数字型/人群型/痛点型/反差型/悬念型混合。';
  const prompt = '主题「'+kw+'」（赛道 '+aiCat+'，语气 '+aiMood+'）。';
  const r = await aiAsk(prompt, sys, '', t=>{ full = t; streamEl.textContent = t + '▌'; });
  if(!r.ok){ box.innerHTML = '<div style="color:var(--red);font-size:13px">'+esc(r.msg||'生成失败')+'</div>'; return; }
  streamEl.textContent = full;
  box.insertAdjacentHTML('beforeend', '<div style="margin-top:10px"><button class="btn btn-red btn-sm" onclick="copyText(this, '+JSON.stringify(full)+')">📋 复制全部 12 条</button></div>');
  Store.data.history.unshift({id:uid(), title:kw+'（批量×12）', type:'标题', time:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}), preview:full.slice(0,30), body:full});
  Store.save(); updateBadges();
}
function copyHistory(id){
  const h = Store.data.history.find(x=>x.id===id); if(!h) return;
  // V6.30：优先复制当时生成的真实内容（不再模板重新拼）
  if(h.body){ copyText(null, h.body); return; }
  const kw = h.title.replace('（批量×12）','').replace('（正文）','');
  const body = h.type==='标题' ? AI.genTitles(kw,aiCat).map(t=>t.title).join('\n') : AI.genBody(0,kw,aiCat,'标准');
  copyText(null, body);
}
/* V6.30 历史内容回看 */
function viewHistory(id){
  const h = Store.data.history.find(x=>x.id===id); if(!h) return;
  const body = h.body || h.preview || '该条历史未保存内容';
  Modal.open('📜 历史内容 · '+esc(h.title), `
    <div style="font-size:11.5px;color:var(--text3);margin-bottom:10px">${h.type} · ${h.time}</div>
    <div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.9;white-space:pre-wrap;max-height:340px;overflow-y:auto">${esc(body)}</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-red btn-sm" style="flex:1" onclick="copyText(this, ${JSON.stringify(body)})">📋 复制</button>
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="delHistory('${id}')">🗑️ 删除</button>
    </div>`);
}
function delHistory(id){
  Store.data.history = Store.data.history.filter(x=>x.id!==id);
  Store.save(); Modal.close(); Toast('已删除'); renderCreate();
}
function saveToAssets(kw, body){
  Store.data.assets.unshift({id:uid(), type:'text', name:kw+'文案-v'+rnd(2,9), size:body.length+'字', date:todayStr().slice(5)});
  Store.save(); Toast('已存入素材库 📁');
}
function saveToLibrary(kw, body){
  Store.data.contents.unshift({id:uid(), title:kw, status:'draft', date:todayStr(), cat:aiCat, views:0, likes:0, collects:0, comments:0, body});
  Store.save(); Toast('已存入内容库 🗂️'); setTimeout(()=>navigate('library'),600);
}

/* ================= 渲染：发布计划（v3 三视图） ================= */
let calOffset = 0, schedTab = 'calendar';
/* ---------- V6.32 今日待发：打开排期页就知道今天该发什么 ---------- */
function renderTodayDue(due, overdue){
  const all = [...overdue, ...due];
  if(!all.length){
    return `<div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px;font-size:13px">
        <span style="font-size:20px">✅</span>
        <span style="flex:1">今天没有待发内容${overdue.length?'':'，节奏很稳'}</span>
        <button class="btn btn-ghost btn-sm" onclick="openPlanAdd()">＋ 排一条</button>
      </div></div>`;
  }
  return `<div class="card" style="margin-bottom:14px;border-color:var(--line)">
      <div class="card-title">🔔 今日待发 <span class="pill" style="margin-left:4px;background:rgba(255,255,255,.1);color:var(--text)">${all.length}</span>
      ${overdue.length?`<span class="pill" style="margin-left:6px;background:rgba(255,45,85,.12);color:var(--brand)">${overdue.length} 条已逾期</span>`:''}</div>
    ${all.map(s=>{
      const isOver = s.date < todayStr();
      const lib = (Store.data.contents||[]).find(c=>c.title===s.title);
      const stage = (s.status==='published')?'已发':(s.status==='ready')?'待发':(s.status==='draft')?'写稿':'选题';
      const isPlaceholder = !s.title || s.title === '待定选题' || s.title === '待定';
      return `<div style="padding:10px 0;border-bottom:1px solid var(--line);">
        <div style="display:flex;align-items:center;gap:10px;font-size:13px;flex-wrap:wrap">
          <span style="font-weight:700;color:${isOver?'var(--brand)':(isPlaceholder?'var(--text3)':'var(--text)')};flex-shrink:0">${s.time||'--:--'}</span>
          <span style="flex:1;min-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:${isPlaceholder?400:700};color:${isPlaceholder?'var(--text3)':'var(--text)'}">${esc(s.title||'待定选题')}</span>
          <span class="pill" style="background:rgba(255,255,255,.06);color:var(--text2);font-size:10px;flex-shrink:0">${stage}</span>
          ${isOver?`<span style="font-size:11px;color:var(--brand);flex-shrink:0">原定 ${s.date}</span>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
          ${pipeDots(s)}
          <span style="flex:1"></span>
          <button class="btn btn-ghost btn-sm" style="flex-shrink:0" onclick="openPlanTask('${s.id}')">详情</button>
          ${lib?`<button class="btn btn-ghost btn-sm" style="flex-shrink:0" onclick="copyPlanPack('${s.id}')">📋 复制发布包</button>`:''}
          ${s.status!=='published'
            ? `<button class="btn btn-ghost btn-sm" style="flex-shrink:0" onclick="stageAdvance('${s.id}')">${s.status==='ready'?'✅ 标记发布':'▶ 推进下一步'}</button>`
            : `<button class="btn btn-ghost btn-sm" style="flex-shrink:0" onclick="openDataEntry('${esc(s.title)}')">📝 录数据复盘</button>`}
        </div>
      </div>`;
    }).join('')}
    <div style="font-size:11.5px;color:var(--text3);margin-top:8px">💡 每条排期是一条流水线：💡选题 → ✍️写稿 → 🚀待发 → ✅已发。点「▶ 推进」一步步走，系统会提示你每步该做什么。点「📋 复制发布包」直接粘到小红书发布器。</div>
  </div>`;
}
function renderSchedule(){
  const d = Store.data;
  const draftCount = d.schedule.filter(s=>s.status==='draft').length;
  const today = todayStr();
  const dueToday = d.schedule.filter(s=>s.date===today && s.status!=='published');
  const overdue = d.schedule.filter(s=>s.date<today && s.status!=='published');
  $('#content').innerHTML = `
  <div class="section-head"><h2>📅 发布计划</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" onclick="openAiWeekPlan()">🤖 AI 本周排期</button><button class="btn btn-ghost btn-sm" onclick="openWeekPlan()">⚡ 一键排一周</button><button class="btn btn-red btn-sm" onclick="openPlanAdd()">＋ 新建计划</button></div></div>
  ${renderTodayDue(dueToday, overdue)}
  <div id="aiWeekBox" style="display:none;margin-bottom:14px"></div>
  <div class="ana-tabs">
    <span class="ana-tab ${schedTab==='calendar'?'active':''}" data-tab="calendar">日历视图</span>
    <span class="ana-tab ${schedTab==='list'?'active':''}" data-tab="list">列表视图</span>
    <span class="ana-tab ${schedTab==='draft'?'active':''}" data-tab="draft">草稿箱 <span class="pill gray" style="margin-left:4px">${draftCount}</span></span>
  </div>
  <div id="schedBody"></div>`;
  $$('.ana-tab[data-tab]').forEach(t=>t.onclick=()=>{ schedTab=t.dataset.tab; renderSchedule(); });
  if(schedTab==='calendar') renderSchedCalendar();
  else if(schedTab==='list') renderSchedList();
  else renderSchedDraft();
}
/* ================= V6.1 AI 本周排期（尊享版） ================= */
let aiWeekResult = [];
async function openAiWeekPlan(){
  if(!premiumGuard('AI 本周排期')) return;
  const box = $('#aiWeekBox');
  box.style.display = 'block';
  box.innerHTML = '<div class="card"><div class="card-title">🤖 AI 本周排期</div><div class="loading">AI 正在结合热点日历 + 你的赛道规划未来 7 天…（约 20-40 秒）</div></div>';
  const d = Store.data;
  const myCat = (d.userProfile && d.userProfile.accountType) || '美妆';
  // 未来 7 天热点
  const now = new Date(); const y = now.getFullYear();
  const hot = [];
  for(let i=0;i<7;i++){ const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate()+i); HOT_CALENDAR.forEach(h=>{ if(h.m===dt.getMonth()+1 && h.d===dt.getDate()) hot.push((dt.getMonth()+1)+'月'+h.d+'日 '+h.name); }); }
  const hotStr = hot.length ? hot.join('、') : '近期暂无大节点';
  const prompt = '我是小红书「'+myCat+'」赛道博主。未来 7 天热点：'+hotStr+'。\n请为未来 7 天各规划 1 个发布选题（结合我的赛道 + 热点，没有热点就按我的赛道正常排），并给出最佳发布时段。\n\n严格按此格式输出（每天一行）：\n第1天：标题 | 时段 19:00\n第2天：标题 | 时段 12:30\n...\n第7天：标题 | 时段 20:30\n\n标题要具体、有吸引力，不要空泛。';
  const r = await aiAsk(prompt, '你是小红书内容策略规划师，输出必须具体。');
  if(!r.ok){ box.innerHTML = '<div class="card"><div class="card-title">🤖 AI 本周排期</div><div style="color:var(--red);font-size:12.5px">'+r.msg+'</div></div>'; return; }
  // 解析：第N天：标题 | 时段
  aiWeekResult = [];
  r.text.split('\n').forEach(line=>{
    const m = line.match(/第\s*([1-7])\s*天[：:]\s*(.+?)\s*[|｜]\s*时段?\s*([\d:]+)/);
    if(m) aiWeekResult.push({title:m[2].trim(), time:m[3].trim()});
  });
  if(!aiWeekResult.length){
    // 兜底：按行解析
    r.text.split('\n').forEach(line=>{
      const m = line.match(/第\s*([1-7])\s*天[：:]\s*(.+)/);
      if(m) aiWeekResult.push({title:m[2].replace(/\s*[|｜].*$/,'').trim(), time:'19:00'});
    });
  }
  const rows = aiWeekResult.map(function(x,i){
    return '<div class="hist-item"><span class="h-title">第'+(i+1)+'天 · '+esc(x.title)+'</span><span class="pill orange" style="flex-shrink:0">'+x.time+'</span></div>';
  }).join('');
  box.innerHTML = '<div class="card"><div class="card-title">🤖 AI 本周排期 <span style="font-size:11px;color:var(--text3);font-weight:400">规划了 '+aiWeekResult.length+' 天 · 可一键导入</span></div>'+
    (rows||'<div style="color:var(--text3);font-size:12.5px">AI 未解析出排期，请重试或手动新建</div>')+
    '<div style="margin-top:10px;display:flex;gap:10px"><button class="btn btn-ghost btn-sm" style="flex:1" onclick="closeAiWeek()">收起</button><button class="btn btn-red btn-sm" style="flex:1" onclick="importAiWeek()">📥 一键导入发布计划</button></div></div>';
}
function importAiWeek(){
  if(!aiWeekResult.length){ Toast('暂无排期可导入'); return; }
  const base = new Date();
  let added = 0;
  aiWeekResult.slice(0,7).forEach(function(x,i){
    const dt = new Date(base); dt.setDate(base.getDate()+i);
    Store.data.schedule.push({id:uid(), date:fmtDate(dt), time:x.time, title:x.title, status:'ready', cat:(Store.data.userProfile||{}).accountType||'美妆'});
    added++;
  });
  Store.save(); closeAiWeek(); updateBadges(); renderSchedule();
  Toast('已导入 '+added+' 天排期 ✅');
}
function closeAiWeek(){ const box=$('#aiWeekBox'); if(box) box.style.display='none'; }
function renderSchedCalendar(){
  const d = Store.data;
  const base = new Date(); base.setDate(base.getDate() - todayOfWeek() + calOffset*7);
  const days = [];
  for(let i=0;i<7;i++){ const dt = new Date(base); dt.setDate(base.getDate()+i); days.push(dt); }
  const title = `${base.getMonth()+1}月${base.getDate()}日 ～ ${days[6].getMonth()+1}月${days[6].getDate()}日`;
  $('#schedBody').innerHTML = `
  <div class="calendar">
    <div class="cal-head">
      <button class="icon-btn" onclick="calOffset--;renderSchedule()">‹</button>
      <span class="cal-title">${title} ${calOffset===0?'· 本周':''}</span>
      <button class="icon-btn" onclick="calOffset++;renderSchedule()">›</button>
    </div>
    <div class="cal-week">
      ${days.map(dt=>{ const ds=fmtDate(dt); const isToday=ds===todayStr(); const tasks=d.schedule.filter(s=>s.date===ds);
      return `<div class="cal-day ${isToday?'today':''}" ${calOffset===0?'onclick="openPlanAdd(\''+ds+'\')"':''}>
        <div class="d-date"><span class="d-num">${dt.getDate()}</span><span>${'日一二三四五六'[dt.getDay()]}</span></div>
        ${tasks.map(s=>`<div class="cal-task ${s.status}" onclick="event.stopPropagation();openPlanTask('${s.id}')">${esc(s.title)}<span class="t-time">${s.time||''}</span></div>`).join('')}
        ${tasks.length===0&&calOffset===0?'<div style="font-size:10px;color:var(--text3);margin-top:4px">＋ 添加</div>':''}
      </div>`;}).join('')}
    </div>
  </div>
  <div class="grid grid-3" style="margin-top:14px">
    <div class="metric-card"><div class="m-label">待发布</div><div class="m-row"><span class="m-num">${d.schedule.filter(s=>s.status==='ready').length}</span></div></div>
    <div class="metric-card"><div class="m-label">已发布</div><div class="m-row"><span class="m-num">${d.schedule.filter(s=>s.status==='published').length}</span></div></div>
    <div class="metric-card"><div class="m-label">草稿</div><div class="m-row"><span class="m-num">${d.schedule.filter(s=>s.status==='draft').length}</span></div></div>
  </div>`;
}
function renderSchedList(){
  const d = Store.data;
  const list = [...d.schedule].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.time||'').localeCompare(b.time||''));
  const groups = {};
  list.forEach(s=>{ (groups[s.date]=groups[s.date]||[]).push(s); });
  const wkName = ['一','二','三','四','五','六','日'];
  $('#schedBody').innerHTML = `<div class="timeline">${
    Object.entries(groups).map(([date,items])=>{
      const d2 = new Date(date+'T12:00:00');
      return `<div class="tl-day">
        <div class="tl-date"><div class="tl-num">${d2.getDate()}</div><div class="tl-mon">${d2.getMonth()+1}月</div><div class="tl-week">周${wkName[(d2.getDay()+6)%7]}</div></div>
        <div class="tl-tasks">${items.map(s=>`<div class="tl-item" onclick="openPlanTask('${s.id}')">
          <span class="tl-time">${s.time||'--:--'}</span>
          <span class="tl-title">${esc(s.title)}</span>
          <span class="pill ${s.status==='published'?'green':s.status==='ready'?'orange':'gray'}">${s.status==='published'?'已发':s.status==='ready'?'待发':'草稿'}</span>
          <span class="tl-cat">${s.cat||''}</span>
        </div>`).join('')}</div>
      </div>`;
    }).join('')
  }</div>`;
}
function renderSchedDraft(){
  const d = Store.data;
  const drafts = d.schedule.filter(s=>s.status==='draft');
  $('#schedBody').innerHTML = drafts.length ? drafts.map(s=>`
    <div class="draft-card" onclick="openPlanTask('${s.id}')">
      <div class="draft-thumb">${s.cat==='美妆'?'💄':s.cat==='穿搭'?'👗':s.cat==='数码'?'📱':s.cat==='美食'?'🍗':s.cat==='旅行'?'✈️':'📝'}</div>
      <div class="draft-info"><div class="draft-title">${esc(s.title)}</div><div class="draft-meta"><span>${s.cat||'未分类'}</span><span>${s.date}</span><span>${s.time||'未定时'}</span></div></div>
      <span class="pill gray">草稿</span>
    </div>
  `).join('') : '<div class="empty"><span class="empty-ico">📝</span>草稿箱是空的<br>所有未完成的内容都会暂存到这里</div>';
}
function openPlanTask(id){
  const s = Store.data.schedule.find(x=>x.id===id); if(!s) return;
  const lib = (Store.data.contents||[]).find(c=>c.title===s.title);
  const pIdx = pipeIdx(s);
  Modal.open('📅 '+s.title, `
    <div style="background:var(--line2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px">
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px;letter-spacing:.3px">内容生产流水线</div>
      ${pipeDots(s)}
      <div style="font-size:12px;color:var(--text2);margin-top:8px;line-height:1.7">
        ${s.status==='published'
          ? '<b>✅ 已发布</b>，进入复盘：点下方「📝 录入数据」，曝光/互动曲线会自动更新。'
          : PIPE_STAGES[pIdx].icon + ' 当前在 <b>「' + PIPE_STAGES[pIdx].label + '」</b>：' + PIPE_STAGES[pIdx].tip}
      </div>
      ${s.status!=='published'?`<button class="btn btn-red btn-sm" style="width:100%;margin-top:10px" onclick="stageAdvance('${s.id}')">▶ 推进到下一步</button>`:''}
    </div>
    <div class="card" style="box-shadow:none;border-color:var(--line2);background:var(--line2)">
      <div style="font-size:13px;margin-bottom:6px">📆 排期日期：<b>${s.date}</b>　⏰ ${s.time||'未定时'}</div>
      <div style="font-size:13px;margin-bottom:6px">🏷️ 分类：<b>${s.cat||'未分类'}</b></div>
      <div style="font-size:13px;margin-bottom:6px">📌 状态：<span class="pill ${s.status==='published'?'green':s.status==='ready'?'orange':'gray'}">${s.status==='published'?'已发布':s.status==='ready'?'待发布':'草稿'}</span></div>
      ${s.status==='published'?'<div style="font-size:13px;color:var(--text2);margin-top:6px">🎉 已发布，可点击下方录入数据。</div>':'<div style="font-size:13px;color:var(--text2);margin-top:6px">发布后回来录入数据，复盘图表会自动更新。</div>'}
    </div>
    ${s.status!=='published'?`<div class="card" style="box-shadow:none;border-color:var(--line2);margin-top:10px">
      <div style="font-size:12.5px;color:var(--text3);margin-bottom:8px">📅 快速改期（不用删了重建）</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="reschedulePlan('${s.id}',-1)">← 提前 1 天</button>
        <button class="btn btn-ghost btn-sm" onclick="reschedulePlan('${s.id}',1)">顺延 1 天 →</button>
        <button class="btn btn-ghost btn-sm" onclick="reschedulePlan('${s.id}',7)">顺延 1 周</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
        <input id="rsDate" type="date" value="${s.date}" style="flex:1">
        <button class="btn btn-black btn-sm" onclick="reschedulePlanTo('${s.id}')">改到这天</button>
      </div>
    </div>`:''}
    <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
      ${lib?`<button class="btn btn-ghost" style="flex:1;min-width:130px" onclick="copyPlanPack('${s.id}')">📋 复制发布包</button>`:''}
      <button class="btn btn-ghost" style="flex:1" onclick="delPlan('${s.id}')">🗑️ 删除</button>
      ${s.status!=='published'
        ? `<button class="btn btn-red" style="flex:1" onclick="markPublished('${s.id}')">✅ 标记已发布</button>`
        : `<button class="btn btn-black" style="flex:1" onclick="Modal.close();openDataEntry('${esc(s.title)}')">📝 录入数据</button>`}
    </div>`);
}
/* ============ V6.39 内容生产流水线（对标竞品任务进度） ============
 * 一条排期 = 一条流水线任务：选题 → 写稿 → 待发 → 已发 → 复盘。
 * 不改数据模型：直接映射现有 status，一键「推进」+ 每步该做什么的引导。
 */
const PIPE_STAGES = [
  {label:'选题', icon:'💡', tip:'选题待深化：打开 AI 创作中心把角度/标题定下来'},
  {label:'写稿', icon:'✍️', tip:'初稿已完成：去「内容库」补正文，或直接写进这篇'},
  {label:'待发', icon:'🚀', tip:'准备发布：📋 复制发布包 → 到小红书发布器粘贴'},
  {label:'已发', icon:'✅', tip:'发布完成：接下来录入数据，复盘图表自动更新'}
];
function pipeIdx(s){
  if(!s) return 0;
  if(s.status==='published') return 3;
  if(s.status==='ready') return 2;
  if(s.status==='draft') return 1;
  return 0;
}
function pipeDots(s){
  const cur = pipeIdx(s);
  let html = '';
  for(let i=0;i<4;i++){
    const reached = i<=cur;
    html += '<span style="display:inline-flex;align-items:center;gap:3px">' +
      '<span style="width:6px;height:6px;border-radius:50%;background:' + (reached ? 'var(--brand)' : 'rgba(255,255,255,.18)') + ';flex-shrink:0"></span>' +
      '<span style="font-size:9.5px;color:' + (reached?'var(--text2)':'var(--text3)') + ';font-weight:'+(i===cur?700:500)+';white-space:nowrap">' + PIPE_STAGES[i].label + '</span>' +
      '</span>' + (i<3 ? '<span style="width:8px;height:1px;background:rgba(255,255,255,.1);flex-shrink:0"></span>' : '');
  }
  return '<span style="display:inline-flex;align-items:center;gap:3px;flex-wrap:wrap">' + html + '</span>';
}
function stageAdvance(id){
  const s = Store.data.schedule.find(x=>x.id===id); if(!s) return;
  if(s.status==='published'){ Toast('已到最后一步：录入数据复盘 📊'); return; }
  const order = ['idea','draft','ready','published'];
  const i = order.indexOf(s.status);
  s.status = order[Math.min(i+1, 3)];
  Store.save(); renderSchedule(); updateBadges();
  const idx = pipeIdx(s);
  if(s.status==='published'){
    Toast('已标记发布 ✅ 接下来录入数据');
    setTimeout(()=>openDataEntry(s.title), 600);
  } else {
    Toast(PIPE_STAGES[idx].icon + ' 已推进到「' + PIPE_STAGES[idx].label + '」：' + PIPE_STAGES[idx].tip);
  }
}

/* ---- V6.32 排期改期：不用删了重建 ---- */
function reschedulePlan(id, days){
  const s = Store.data.schedule.find(x=>x.id===id); if(!s) return;
  const base = new Date((s.date||todayStr())+'T12:00:00');
  base.setDate(base.getDate()+days);
  s.date = fmtDate(base);
  Store.save(); Modal.close(); renderSchedule(); updateBadges();
  Toast('已改到 '+s.date+' 📅');
}
function reschedulePlanTo(id){
  const s = Store.data.schedule.find(x=>x.id===id); if(!s) return;
  const v = ($('#rsDate')||{}).value;
  if(!v){ Toast('请选择日期'); return; }
  s.date = v;
  Store.save(); Modal.close(); renderSchedule(); updateBadges();
  Toast('已改到 '+v+' 📅');
}
/* ---- V6.32 一键复制发布包：标题+正文+话题，直接粘到小红书 ---- */
function copyPlanPack(id){
  const s = Store.data.schedule.find(x=>x.id===id); if(!s) return;
  const lib = (Store.data.contents||[]).find(c=>c.title===s.title);
  let body = (lib && lib.body) || s.body || '';
  let tags = '';
  if(body){
    const m = body.match(/([\s\S]*?)((?:#[^\s#]+[\s]*)+)$/);
    if(m){ body = m[1].trim(); tags = m[2].trim(); }
  }
  const pack = [
    s.title||'',
    '',
    body,
    tags ? '\n'+tags : ''
  ].join('\n').trim();
  copyText(null, pack);
  Toast('发布包已复制，去小红书直接粘贴 ✅');
}
function markPublished(id){
  const s = Store.data.schedule.find(x=>x.id===id); if(!s) return;
  s.status='published';
  Store.save(); Modal.close(); renderSchedule(); updateBadges(); Toast('已标记发布 ✅');
  setTimeout(()=>openDataEntry(s.title), 500);
}
function delPlan(id){
  const s = Store.data.schedule.find(x=>x.id===id); if(!s) return;
  if(!confirm('删除计划「'+s.title+'」？此操作不可撤销。')) return;
  Store.data.schedule = Store.data.schedule.filter(x=>x.id!==id);
  Store.save(); Modal.close(); renderSchedule(); updateBadges(); Toast('已删除计划 🗑️');
}
function openPlanAdd(date){
  const d = Store.data;
  const libOpts = d.contents.filter(c=>c.status==='ready'||c.status==='draft');
  Modal.open('📅 添加发布计划', `
    <div class="form-group"><label class="label">日期</label><input id="planDate" type="date" value="${date||todayStr()}"></div>
    <div class="form-group"><label class="label">发布时间</label><input id="planTime" type="time" value="19:00" onchange="planTimeCheck(this.value)"></div>
    <div style="font-size:10.5px;color:var(--text3);line-height:1.7;margin:-4px 0 10px">💡 黄金时段：7-9点 / 12-13点 / 18-22点 · 低谷时段：23点后、工作日 10-11点 · 避开后曝光更高</div>
    <div id="planTimeWarn" style="display:none;background:var(--soft-orange);border:1px solid rgba(255,149,0,.35);border-radius:8px;padding:8px 10px;font-size:11.5px;color:var(--text2);margin-bottom:10px">⚠️ 该时段为平台<b>低流量/竞争期</b>，建议改为黄金时段（7-9/12-13/18-22点）。仍要保存可忽略此提示。</div>
    <div class="form-group"><label class="label">标题</label><input id="planTitleNew" placeholder="输入排期标题"></div>
    <div class="form-group"><label class="label">分类 <span style="font-size:10px;color:var(--text3);font-weight:500">（自由输入或从建议选）</span></label>
      <input id="planCat" list="catSuggestion" placeholder="如：美食/穿搭/数码，或任意品类" autocomplete="off" />
      <datalist id="catSuggestion">${catOptions().map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
    </div>
    <div class="form-group"><label class="label">从内容库选择（可选）</label><select id="planTitle"><option value="">— 自定义 —</option>${libOpts.map(c=>`<option value="${esc(c.title)}">${esc(c.title)}</option>`).join('')}</select></div>
    <button class="btn btn-ghost btn-block" onclick="doPlanAdd()" style="background:var(--brand);color:#fff;border:none;font-weight:800">保存排期</button>`);
}
/* V6.30 AI 创作结果 → 一键排期（自动带入标题与正文草稿） */
function openPlanAddWith(kw, body){
  const d = Store.data;
  // 先存入内容库（草稿），再打开排期选择
  if(body && typeof saveToLibrary==='function'){
    saveToLibrary(kw, body);
  }
  openPlanAdd();
  setTimeout(()=>{
    try{
      const inp = document.getElementById('planTitleNew');
      if(inp) inp.value = kw.slice(0, 40);
    }catch(e){}
  }, 200);
}
function planTimeCheck(t){
  const w = $('#planTimeWarn'); if(!w) return;
  if(!t) return;
  const h = +t.split(':')[0];
  const bad = (h>=23||h<6) || (h>=10&&h<=11);
  w.style.display = bad ? 'block' : 'none';
}
function doPlanAdd(){
  const date = $('#planDate').value, time = $('#planTime').value;
  const title = $('#planTitleNew').value.trim() || $('#planTitle').value;
  if(!title){ Toast('请输入标题'); return; }
  Store.data.schedule.push({id:uid(), date, time, title, status:'ready', cat:$('#planCat').value});
  Store.save(); Modal.close(); renderSchedule(); updateBadges(); Toast('已加入发布计划 ✅');
}

/* ================= 渲染：数据复盘（v3 全重做） ================= */
let anaTab = 'overview', anaDays = 7;
/* ================= V6.48 数据战绩卡（GitHub 开源 html2canvas） =================
 * 把复盘数据一键生成一张精美「战绩卡」高清图：晒数据、晒专业、帮转介绍。 */
function openShareCard(){
  if(typeof html2canvas === 'undefined'){ Toast('组件加载失败，请刷新重试'); return; }
  Modal.open('📤 数据战绩卡', `
    <div style="font-size:12.5px;color:var(--text2);line-height:1.8;margin-bottom:12px">
      把近期成绩生成一张 <b>竖版战绩卡</b>，可保存后发朋友圈 / 小红书 / 发给客户看 —— 你有多专业，一眼可见。
    </div>
    <div id="shareCardWrap" style="width:100%;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.35)"></div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="buildShareCard()">🎨 生成图片</button>
      <a id="shareCardDl" style="display:none;flex:1" download="我的数据战绩卡.png"><button class="btn btn-red btn-sm" style="width:100%">⬇️ 保存图片</button></a>
    </div>
    <div id="shareCardTip" style="font-size:11px;color:var(--text3);margin-top:10px;text-align:center"></div>`);
  buildShareCard();
}
function buildShareCard(){
  const wrap = $('#shareCardWrap');
  if(!wrap) return;
  const d = Store.data;
  const ov = d.analytics.overview || {};
  const brand = (localStorage.getItem('xhs_brand')||'Crazy Friday').replace(/[.。]$/,'');
  const account = (d.userProfile && d.userProfile.accountType) || '';
  const best = d.analytics.notes.slice().sort(function(a,b){ return (b.score||0)-(a.score||0); })[0];
  const fans = ov.fans || 0;
  const views = (ov.views7d||0), likes=(ov.likes7d||0), collects=(ov.collects7d||0), comments=(ov.comments7d||0);
  const income = d.money.records.reduce(function(a,b){ return a+(+b.income||0); },0);
  const W = 780, pad = 46;
  const card = document.createElement('div');
  card.style.cssText = 'width:'+W+'px;background:linear-gradient(160deg,#141419 0%,#1b1b23 60%,#201822 100%);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;padding:'+pad+'px 0;box-sizing:border-box;position:relative;overflow:hidden';
  card.innerHTML = `
    <div style="position:absolute;top:-120px;right:-120px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(255,36,66,.22),transparent 65%)"></div>
    <div style="padding:0 46px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:52px;height:52px;border-radius:15px;background:linear-gradient(135deg,#ff2442,#ff5778);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;box-shadow:0 8px 24px rgba(255,36,66,.4)">${esc(brand.slice(0,1))}</div>
        <div>
          <div style="font-size:22px;font-weight:900;letter-spacing:-.3px">${esc(brand)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:3px">${account?esc(account)+' 赛道 · ':''}小红书 AI 运营工作台</div>
        </div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:20px;letter-spacing:2px">近 7 天数据战绩 · 自动统计</div>
      <div style="display:flex;align-items:flex-end;gap:10px;margin-top:8px">
        <div style="font-size:52px;font-weight:900;line-height:1">${fmtNum(views)}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.6);padding-bottom:10px">总曝光</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px">
        ${[
          {k:'粉丝总数', v:fmtNum(fans)},
          {k:'获赞+收藏', v:fmtNum(likes+collects)},
          {k:'互动评论', v:fmtNum(comments)},
          {k:'累计收益', v:'¥'+fmtNum(income)}
        ].map(x=>`<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:16px"><div style="font-size:24px;font-weight:900">${x.v}</div><div style="font-size:11.5px;color:rgba(255,255,255,.5);margin-top:4px">${x.k}</div></div>`).join('')}
      </div>
      ${best?`<div style="margin-top:16px;background:rgba(255,36,66,.08);border:1px solid rgba(255,36,66,.22);border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:10px">
        <div style="font-size:18px">🏆</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:rgba(255,255,255,.5)">最佳内容 · 爆款分 ${best.score||0}</div>
          <div style="font-size:13.5px;font-weight:700;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(best.title)}</div>
        </div>
      </div>`:''}
      <div style="margin-top:26px;text-align:center;font-size:10.5px;color:rgba(255,255,255,.35);letter-spacing:1px">由 ${esc(brand)} AI 工作台自动生成 · 一个人 + AI = 一家公司</div>
    </div>`;
  wrap.innerHTML = '';
  wrap.appendChild(card);
  const tip = $('#shareCardTip'); if(tip) tip.textContent = '正在渲染…';
  html2canvas(card, {backgroundColor:'#141419', scale:2, useCORS:true}).then(function(canvas){
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.cssText = 'width:100%;display:block';
    wrap.innerHTML = '';
    wrap.appendChild(img);
    const dl = $('#shareCardDl');
    if(dl){ dl.href = img.src; dl.style.display = 'block'; }
    if(tip) tip.innerHTML = '✅ 生成完成，点「保存图片」存入相册 / 直接长按图片保存';
  }).catch(function(e){
    if(tip) tip.textContent = '渲染失败，请重试';
  });
}

function renderAnalytics(){
  const d = Store.data;
  $('#content').innerHTML = `
  <div class="section-head"><h2>📊 数据复盘</h2><div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="openDataPaste()">📥 粘贴导入</button><button class="btn btn-red btn-sm" onclick="quickDaily()">⚡ 今日速记</button><button class="btn btn-ghost btn-sm" onclick="openShareCard()">📤 生成战绩卡</button><button class="btn btn-ghost btn-sm" onclick="openWeeklyReport()">📊 周报</button>${typeof openAiDiagnose==='function'?'<button class="btn btn-ghost btn-sm" onclick="openAiDiagnose()">🩺 AI 深度诊断</button>':''}<button class="btn btn-ghost btn-sm" onclick="openDataEntry()">＋ 单篇录入</button></div></div>
  <div class="ana-tabs">
    <span class="ana-tab ${anaTab==='overview'?'active':''}" data-tab="overview">数据概览</span>
    <span class="ana-tab ${anaTab==='content'?'active':''}" data-tab="content">内容分析</span>
    <span class="ana-tab ${anaTab==='fans'?'active':''}" data-tab="fans">粉丝分析</span>
  </div>
  <div id="anaBody"></div>`;
  $$('.ana-tab[data-tab]').forEach(t=>t.onclick=()=>{ anaTab=t.dataset.tab; renderAnalytics(); });
  if(anaTab==='overview') renderAnaOverview();
  else if(anaTab==='content') renderAnaContent();
  else renderAnaFans();
}
/* V6.31.2 真实环比：把当前周期拆两半对比，避免固定假数字 */
function calcTrend(cur, list, key){
  if(!Array.isArray(list) || list.length < 4) return {text:'暂无对比', cls:'neutral'};
  const half = Math.floor(list.length/2);
  const prev = list.slice(0, half).reduce((a,b)=>a+(b[key]||0), 0);
  const now  = list.slice(half).reduce((a,b)=>a+(b[key]||0), 0);
  if(prev === 0 && now === 0) return {text:'暂无对比', cls:'neutral'};
  if(prev === 0) return {text:'新增启动', cls:'up'};
  const pct = ((now - prev) / prev * 100);
  return {text:(pct>=0?'较上期 +':'较上期 ')+pct.toFixed(1)+'%', cls:pct>=0?'up':'down'};
}
function renderAnaOverview(){
  const d = Store.data;
  const daysKey = anaDays===7?'days7':anaDays===30?'days30':'days90';
  const days = d.analytics[daysKey] || [];
  const sum = days.reduce((a,b)=>({views:a.views+(b.views||0),likes:a.likes+(b.likes||0),collects:a.collects+(b.collects||0),comments:a.comments+(b.comments||0),fans:a.fans+(b.fans||0)}), {views:0,likes:0,collects:0,comments:0,fans:0});
  const interaction = sum.views>0 ? +((sum.likes+sum.collects+sum.comments)/sum.views*100).toFixed(2) : 0;
  const tViews = calcTrend(sum.views, days, 'views');
  const tEng   = calcTrend(sum.likes+sum.collects+sum.comments, days, 'likes'); // 用 likes 近似互动趋势
  const tRate  = {text: interaction>=5 ? '高于均值' : '可优化', cls:'neutral'};
  $('#anaBody').innerHTML = `
  <div class="ana-time">
    <span class="${anaDays===7?'active':''}" onclick="anaDays=7;renderAnaOverview()">7 天</span>
    <span class="${anaDays===30?'active':''}" onclick="anaDays=30;renderAnaOverview()">30 天</span>
    <span class="${anaDays===90?'active':''}" onclick="anaDays=90;renderAnaOverview()">90 天</span>
  </div>
  <div class="grid grid-3" style="margin-bottom:14px">
    <div class="metric-card"><div class="m-label">总曝光</div><div class="m-row"><span class="m-num">${fmtNum(sum.views)}</span><span class="m-trend ${tViews.cls}">${tViews.text}</span></div></div>
    <div class="metric-card"><div class="m-label">总互动</div><div class="m-row"><span class="m-num">${fmtNum(sum.likes+sum.collects+sum.comments)}</span><span class="m-trend ${tEng.cls}">${tEng.text}</span></div></div>
    <div class="metric-card"><div class="m-label">平均互动率</div><div class="m-row"><span class="m-num">${interaction}%</span><span class="m-trend ${tRate.cls}">${tRate.text}</span></div></div>
  </div>
  <div class="card">
    <div class="card-title">📈 数据趋势 ${window.echarts?'<span style="float:right;font-size:10px;font-weight:600;color:var(--green);background:rgba(52,199,89,.12);padding:2px 8px;border-radius:99px">专业图表</span>':''}</div>
    ${ (window.echarts && days.length>=2) ? '<div id="anaEcChart" style="width:100%;height:260px"></div>' : lineChartSVG(days, ['views','likes','fans']) }
    ${ (window.echarts && days.length>=2) ? '' : '<div class="line-legend"><span class="lg"><i style="background:var(--text)"></i>曝光</span><span class="lg"><i style="background:var(--blue)"></i>互动</span><span class="lg"><i style="background:var(--green)"></i>涨粉</span></div>' }
  </div>`;
  // V6.48 GitHub 开源 ECharts：专业交互式图表（悬浮看值/缩放/平滑）
  if(window.echarts && $('#anaEcChart')){ initAnaEChart(days); }
}
function initAnaEChart(days){
  const el = $('#anaEcChart'); if(!el) return;
  const inst = window.__anaEc;
  if(inst){ inst.dispose(); window.__anaEc = null; }
  const chart = echarts.init(el, 'dark');
  window.__anaEc = chart;
  const dates = days.map(function(d){ return (d.date||'').slice(5); });
  function series(key, name, color, grad){
    return {
      name:name, type:'line', smooth:true, symbol:'none', data:days.map(function(d){ return d[key]||0; }),
      lineStyle:{width:2.5, color:color}, itemStyle:{color:color},
      areaStyle: grad ? {opacity:.18, color:color} : {opacity:0}
    };
  }
  const accent = getComputedStyle(document.body).getPropertyValue('--red').trim() || '#ff2442';
  const opts = {
    backgroundColor:'transparent',
    color:[accent, '#0a84ff', '#34c759'],
    tooltip:{trigger:'axis', backgroundColor:'rgba(20,20,25,.95)', borderColor:'rgba(255,255,255,.12)', textStyle:{color:'#fff', fontSize:12}, axisPointer:{type:'line', lineStyle:{color:'rgba(255,255,255,.2)'}}},
    legend:{data:['曝光','互动','涨粉'], textStyle:{color:'rgba(255,255,255,.6)', fontSize:11}, top:0, right:0},
    grid:{left:8, right:14, top:26, bottom:6, containLabel:true},
    xAxis:{type:'category', boundaryGap:false, data:dates, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}}, axisLabel:{color:'rgba(255,255,255,.5)', fontSize:10.5, interval: Math.max(0, Math.floor(dates.length/9))}},
    yAxis:{type:'value', splitLine:{lineStyle:{color:'rgba(255,255,255,.07)'}}, axisLabel:{color:'rgba(255,255,255,.5)', fontSize:10.5}},
    series:[
      series('views','曝光', accent, true),
      series('likes','互动', '#0a84ff', false),
      series('fans','涨粉', '#34c759', false)
    ],
    animationDuration:450
  };
  if(days.length > 15){
    opts.dataZoom = [{type:'inside', start: Math.max(0, 100 - Math.round(40*15/days.length)), end:100}];
  }
  chart.setOption(opts);
  // 页面切走再回来时自适应（简单防抖）
  if(!window.__anaEcResize){
    window.__anaEcResize = true;
    window.addEventListener('resize', function(){ try{ if(window.__anaEc) window.__anaEc.resize(); }catch(e){} });
  }
}
function lineChartSVG(days, keys){
  if(!days.length || !days[0] || !days[0].date) return '<div class="empty">暂无数据</div>';
  // V6.27 防御：确保每个数据点都至少有 date 字段（否则 .slice(5) 会崩）
  days = days.filter(d => d && d.date);
  const W = 600, H = 180, P = 28;
  const series = [
    {key:'views', color:'var(--text)'},
    {key:keys.includes('likes')?'likes':null, color:'var(--blue)'},
    {key:keys.includes('fans')?'fans':null, color:'var(--green)'}
  ].filter(s=>s.key && days[0][s.key]!==undefined);
  const maxV = Math.max(...days.flatMap(d=>series.map(s=>d[s.key]||0)), 1);
  const stepX = (W - P*2) / Math.max(1, days.length-1);
  const toY = v => H - P - (v/maxV) * (H - P*2);
  let svg = `<svg class="line-chart" viewBox="0 0 ${W} ${H+24}" preserveAspectRatio="none">`;
  for(let i=0;i<=4;i++){ const y = P + (H-P*2)*i/4; svg += `<line x1="${P}" y1="${y}" x2="${W-P}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`; }
  const xStep = Math.max(1, Math.floor(days.length/8));
  days.forEach((d,i)=>{ if(i%xStep===0||i===days.length-1){ const x=P+i*stepX; svg += `<text x="${x}" y="${H+14}" font-size="10" fill="var(--text3)" text-anchor="middle">${d.date.slice(5)}</text>`; } });
  for(let i=0;i<=4;i++){ const y = H-P - (H-P*2)*i/4; const v = Math.round(maxV*i/4); svg += `<text x="${P-4}" y="${y+3}" font-size="10" fill="var(--text3)" text-anchor="end">${fmtNum(v)}</text>`; }
  series.forEach(s=>{
    const pts = days.map((d,i)=>`${P+i*stepX},${toY(d[s.key]||0)}`).join(' ');
    svg += `<polyline points="${pts}" stroke="${s.color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    days.forEach((d,i)=>{ const x=P+i*stepX; const y=toY(d[s.key]||0); svg += `<circle cx="${x}" cy="${y}" r="2.5" fill="${s.color}"/>`; });
  });
  svg += `</svg>`;
  return svg;
}
function renderAnaContent(){
  const d = Store.data;
  const notes = d.analytics.notes;
  $('#anaBody').innerHTML = `
  <div class="ana-time">
    <span class="${anaDays===7?'active':''}" onclick="anaDays=7;renderAnaContent()">7 天</span>
    <span class="${anaDays===30?'active':''}" onclick="anaDays=30;renderAnaContent()">30 天</span>
    <span class="${anaDays===90?'active':''}" onclick="anaDays=90;renderAnaContent()">90 天</span>
  </div>
  <div class="grid grid-3" style="margin-bottom:14px">
    <div class="metric-card"><div class="m-label">发布数</div><div class="m-row"><span class="m-num">${notes.length}</span><span class="m-trend neutral">累计笔记</span></div></div>
    <div class="metric-card"><div class="m-label">爆款数</div><div class="m-row"><span class="m-num">${notes.filter(n=>n.score>=80).length}</span><span class="m-trend neutral">爆款率 ${notes.length?Math.round(notes.filter(n=>n.score>=80).length/notes.length*100):0}%</span></div></div>
    <div class="metric-card"><div class="m-label">平均爆款分</div><div class="m-row"><span class="m-num">${notes.length?Math.round(notes.reduce((a,b)=>a+b.score,0)/notes.length):0}</span><span class="m-trend neutral">内容质量均分</span></div></div>
  </div>
  <div class="card">
    <div class="card-title">🏆 表现最佳内容 TOP3</div>
    ${notes.length?notes.slice().sort((a,b)=>b.score-a.score).slice(0,3).map((n,i)=>`
    <div class="top3-card" onclick="openNoteDetail('${n.id}')">
      <div class="top3-thumb">${n.emoji}</div>
      <div class="top3-info">
        <div class="top3-title">${esc(n.title)}</div>
        <div class="top3-metrics">
          <span>曝光 <b>${fmtNum(n.views)}</b></span>
          <span>互动 <b>${fmtNum(n.likes+n.collects+n.comments)}</b></span>
          <span>互动率 <b>${((n.likes+n.collects+n.comments)/n.views*100).toFixed(1)}%</b></span>
        </div>
      </div>
      <div style="font-size:24px;font-weight:800;color:var(--red)">${n.score}</div>
    </div>`).join(''):'<div class="empty"><span class="empty-ico">📊</span>还没有笔记数据</div>'}
  </div>
  <div class="card">
    <div class="card-title">📋 全部笔记数据</div>
    ${notes.length?notes.map(n=>`
    <div class="lib-item" onclick="openNoteDetail('${n.id}')">
      <div class="draft-thumb">${n.emoji}</div>
      <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${esc(n.title)}</div><div style="font-size:11px;color:var(--text3)">${n.cat||'未分类'} · 曝光 ${fmtNum(n.views)} · 互动率 ${((n.likes+n.collects+n.comments)/n.views*100).toFixed(1)}%</div></div>
      <div style="font-size:13px;font-weight:700;color:var(--text)">${n.score}</div>
      <button class="icon-btn" onclick="event.stopPropagation();delNote('${n.id}')">🗑️</button>
    </div>`).join(''):'<div class="empty">暂无数据</div>'}
  </div>`;
}
function openNoteDetail(id){
  const n = Store.data.analytics.notes.find(x=>x.id===id); if(!n) return;
  const interaction = ((n.likes+n.collects+n.comments)/n.views*100).toFixed(1);
  Modal.open('📊 '+n.title, `
    <div class="grid grid-2" style="gap:10px">
      <div class="metric-card"><div class="m-label">总曝光</div><div class="m-row"><span class="m-num">${fmtNum(n.views)}</span></div></div>
      <div class="metric-card"><div class="m-label">互动率</div><div class="m-row"><span class="m-num">${interaction}%</span></div></div>
      <div class="metric-card"><div class="m-label">点赞</div><div class="m-row"><span class="m-num">${fmtNum(n.likes)}</span></div></div>
      <div class="metric-card"><div class="m-label">收藏</div><div class="m-row"><span class="m-num">${fmtNum(n.collects)}</span></div></div>
    </div>
    <div class="card" style="box-shadow:none;border-color:var(--line2);background:var(--line2);margin-top:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:6px">🎯 爆款分：<span style="color:var(--red);font-size:20px;font-weight:800">${n.score}</span></div>
      <div style="font-size:12px;color:var(--text2)">${n.score>=85?'表现优秀，建议做续集或衍生内容':n.score>=70?'表现良好，可分析标题/封面继续优化':'表现一般，建议调整发布时间或封面'}</div>
    </div>`);
}
function renderAnaFans(){
  const d = Store.data;
  // V6.27 bug 修复：fans 可能为空（老数据/新用户），防御默认值防崩
  const f = d.fans || {total:0, new7d:0, new30d:0, new90d:0};
  $('#anaBody').innerHTML = `
  <div class="ana-time">
    <span class="${anaDays===7?'active':''}" onclick="anaDays=7;renderAnaFans()">7 天</span>
    <span class="${anaDays===30?'active':''}" onclick="anaDays=30;renderAnaFans()">30 天</span>
    <span class="${anaDays===90?'active':''}" onclick="anaDays=90;renderAnaFans()">90 天</span>
  </div>
  <div class="fans-card">
    <div class="m-label">粉丝总数</div>
    <div class="fans-big"><span class="fb-num">${fmtNum(f.total||0)}</span><span class="fb-trend">↑ ${anaDays===7?(f.new7d||0):anaDays===30?(f.new30d||0):(f.new90d||0)} 较上期</span></div>
    ${lineChartSVG((d.analytics||{})[anaDays===7?'days7':anaDays===30?'days30':'days90'] || [], ['fans'])}
    <div class="line-legend"><span class="lg"><i style="background:var(--green)"></i>涨粉趋势</span></div>
  </div>
  <div class="card">
    <div class="card-title">📍 粉丝来源分析</div>
    ${f.sources.map(s=>`<div class="source-row">
      <span class="source-name">${s.name}</span>
      <div class="source-bar"><i style="width:${s.pct}%"></i></div>
      <span class="source-pct">${s.pct}%</span>
    </div>`).join('')}
  </div>`;
}
/* V6.42 今日速记：3 秒记录全账号今日数据，曲线/看板立刻更新（对标"随手记"体验） */
function quickDaily(){
  const t = todayStr();
  const today0 = (Store.data.analytics.days7||[]).find(x=>x.date===t) || {};
  const d = Store.data.analytics;
  Modal.open('⚡ 今日速记', `
    <div style="font-size:12px;color:var(--text2);margin-bottom:12px;line-height:1.7">不用一篇篇录。打开小红书创作者中心，把<b>今天的总曝光 / 涨粉 / 点赞收藏 / 评论</b>填进来（没有就填 0），3 秒完事，曲线立刻动。</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="form-group" style="margin:0"><label class="label">今日曝光</label><input id="qdViews" type="number" value="${today0.views||''}" placeholder="0"></div>
      <div class="form-group" style="margin:0"><label class="label">今日涨粉</label><input id="qdFans" type="number" value="${today0.fans||''}" placeholder="0"></div>
      <div class="form-group" style="margin:0"><label class="label">点赞</label><input id="qdLikes" type="number" value="${today0.likes||''}" placeholder="0"></div>
      <div class="form-group" style="margin:0"><label class="label">收藏</label><input id="qdCollects" type="number" value="${today0.collects||''}" placeholder="0"></div>
      <div class="form-group" style="margin:0"><label class="label">评论</label><input id="qdComments" type="number" value="${today0.comments||''}" placeholder="0"></div>
    </div>
    ${today0.views?'<div style="font-size:11px;color:var(--brand);margin-top:8px">今天已记录过，保存会覆盖今日数据</div>':''}
    <button class="btn btn-red btn-block" style="margin-top:14px" onclick="doQuickDaily()">💾 保存（更新今日曲线）</button>`);
}
function doQuickDaily(){
  const t = todayStr();
  const views=+($('#qdViews').value)||0, likes=+($('#qdLikes').value)||0,
        collects=+($('#qdCollects').value)||0, comments=+($('#qdComments').value)||0,
        fans=+($('#qdFans').value)||0;
  if(!views && !fans && !likes && !collects && !comments){ Toast('至少填一项'); return; }
  const an = Store.data.analytics;
  // 1) days7 / days30 / days90 今天条目（没有就补今天，覆盖策略）
  [['days7',7],['days30',30],['days90',90]].forEach(function(conf){
    const list = an[conf[0]] = an[conf[0]] || [];
    const i = list.findIndex(x=>x.date===t);
    const val = {date:t, views, likes, collects, comments, fans};
    if(i>=0) list[i] = val; else list.unshift(val);
  });
  // 2) overview 同步 = 用近 7 天求和（首页 KPI 口径一致）
  const d7 = an.days7.slice(0,7);
  const sum = d7.reduce((a,b)=>({views:a.views+(b.views||0),likes:a.likes+(b.likes||0),collects:a.collects+(b.collects||0),comments:a.comments+(b.comments||0),fans:a.fans+(b.fans||0)}), {views:0,likes:0,collects:0,comments:0,fans:0});
  const o = an.overview || (an.overview = {});
  o.views7d=sum.views; o.likes7d=sum.likes; o.collects7d=sum.collects; o.comments7d=sum.comments; o.fans7d=sum.fans;
  o.fans = (o.fans||0) + (fans||0);
  o.interaction = sum.views ? +(((sum.likes+sum.collects+sum.comments)/sum.views)*100).toFixed(1) : 0;
  Store.save(); Modal.close(); renderAnalytics();
  Toast('✅ 今日已记录，曲线已更新');
}
function openDataEntry(preTitle){
  Modal.open('📝 录入笔记数据', `
    <div style="font-size:12px;color:var(--text3);margin-bottom:8px">发布笔记后，把小红书后台的数据填进来，图表和排行会自动更新。</div>
    <div style="text-align:right;margin-bottom:8px"><button class="btn btn-ghost btn-sm" onclick="Modal.close();openDataPaste()">📥 用粘贴导入（更快）</button></div>
    <div class="form-group"><label class="label">笔记标题</label><input id="deTitle" value="${esc(preTitle||'')}" placeholder="笔记标题"></div>
    <div class="form-group"><label class="label">分类</label><select id="deCat">${catOptions().map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="label">数据</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <input id="deViews" type="number" placeholder="阅读量" min="0"><input id="deLikes" type="number" placeholder="点赞" min="0">
      <input id="deCollects" type="number" placeholder="收藏" min="0"><input id="deComments" type="number" placeholder="评论" min="0">
    </div></div>
    <button class="btn btn-red btn-block" onclick="doDataEntry()">保存并更新复盘</button>`);
}
function doDataEntry(){
  const title=$('#deTitle').value.trim(); if(!title){Toast('请输入笔记标题');return;}
  const views=+$('#deViews').value||0, likes=+$('#deLikes').value||0, collects=+$('#deCollects').value||0, comments=+$('#deComments').value||0;
  if(!views){Toast('请至少填写阅读量');return;}
  const score = Math.min(100, Math.round((likes+collects+comments)/views*600 + collects/views*400));
  Store.data.analytics.notes.unshift({id:uid(), title, emoji:'📌', views, likes, collects, comments, score, cat:$('#deCat').value});
  Store.data.contents.unshift({id:uid(), title, status:'published', date:todayStr(), cat:$('#deCat').value, views, likes, collects, comments});
  const o=Store.data.analytics.overview;
  o.views7d+=views; o.likes7d+=likes; o.collects7d+=collects; o.comments7d+=comments;
  o.interaction = +((o.likes7d+o.collects7d+o.comments7d)/o.views7d*100).toFixed(1);
  Store.save(); Modal.close(); renderAnalytics(); Toast('已录入，复盘已更新 📊');
}

let assetFolder = '全部';
/* ================= 渲染：素材管理（V5.9 分类文件夹） ================= */
const ASSET_FOLDERS = ['图文素材','短视频脚本','封面文案','其他'];
function folderOf(a){
  if(a.folder) return a.folder;
  return ({image:'图文素材', text:'封面文案', video:'短视频脚本', audio:'其他'})[a.type] || '其他';
}
function renderAssets(){
  const d = Store.data;
  const typeMeta = {image:['🖼️','图片'], text:['📝','文案'], video:['🎬','视频'], audio:['🎵','音频']};
  let list = d.assets;
  if(assetFolder!=='全部') list = list.filter(a=>folderOf(a)===assetFolder);
  const countOf = f => d.assets.filter(a=>folderOf(a)===f).length;
  $('#content').innerHTML = `
  <div class="section-head"><h2>📁 素材管理</h2><button class="btn btn-red btn-sm" onclick="openAssetAdd()">＋ 新增素材</button></div>
  <div class="asset-tabs">
    <span class="chip ${assetFolder==='全部'?'active':''}" onclick="assetFolder='全部';renderAssets()">全部 <b style="font-size:10px">${d.assets.length}</b></span>
    ${ASSET_FOLDERS.map(f=>`<span class="chip ${assetFolder===f?'active':''}" onclick="assetFolder='${f}';renderAssets()">${f} <b style="font-size:10px">${countOf(f)}</b></span>`).join('')}
  </div>
  <div class="asset-grid">
    ${list.length?list.map(a=>`
    <div class="asset-card" onclick="openAssetDetail('${a.id}')">
      <div class="asset-cover">${a.dataURL?`<img src="${a.dataURL}" alt="">`:(typeMeta[a.type]||['📎'])[0]}</div>
      <div class="asset-body"><div class="asset-name">${esc(a.name)}</div><div class="asset-meta"><span class="pill" style="font-size:9px">${folderOf(a)}</span><span>${a.size}</span><span>${a.date}</span></div></div>
    </div>`).join(''):'<div class="empty" style="grid-column:1/-1"><span class="empty-ico">📂</span>该分类下暂无素材，点击右上角新增</div>'}
  </div>`;
}
function openAssetAdd(){
  Modal.open('＋ 新增素材', `
    <div class="form-group"><label class="label">素材类型</label><div class="select-pills" id="assetTypePills">${['image','text','video','audio'].map((t,i)=>`<span class="chip ${i===0?'active':''}" onclick="setAssetType('${t}',this)">${({image:'🖼️ 图片',text:'📝 文案',video:'🎬 视频',audio:'🎵 音频'})[t]}</span>`).join('')}</div></div>
    <div class="form-group" id="assetUploadBox">
      <label class="label">选择图片上传（自动压缩，支持手机相册）</label>
      <label style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed var(--line);border-radius:12px;padding:22px;cursor:pointer;background:var(--bg)">
        <span style="font-size:30px">📤</span>
        <span style="font-size:13px;color:var(--text2);margin-top:6px">点击选择图片 / 拍照</span>
        <span style="font-size:11px;color:var(--text3);margin-top:2px">JPG / PNG，自动压缩后本地保存</span>
        <input type="file" accept="image/*" style="display:none" onchange="handleAssetFile(this)">
      </label>
      <div id="assetPreview" style="margin-top:10px"></div>
    </div>
    <div class="form-group" id="assetTextBox" style="display:none">
      <label class="label">文案内容</label><textarea id="assetText" placeholder="粘贴文案正文…"></textarea>
    </div>
    <div class="form-group"><label class="label">素材名称</label><input id="assetName" placeholder="如：封面图-通勤妆"></div>
    <div class="form-group"><label class="label">分类文件夹</label><select id="assetFolder">${ASSET_FOLDERS.map(f=>`<option>${f}</option>`).join('')}</select></div>
    <button class="btn btn-red btn-block" onclick="doAssetAdd()">保存素材</button>`);
  // 类型切换
  $('#assetTypePills').addEventListener('click', e=>{
    const chip = e.target.closest('.chip'); if(!chip) return;
    const t = chip.textContent.includes('图片')?'image':chip.textContent.includes('文案')?'text':chip.textContent.includes('视频')?'video':'audio';
    setAssetType(t, chip);
    $('#assetUploadBox').style.display = t==='image'?'':'none';
    $('#assetTextBox').style.display = t==='text'?'':'none';
  });
}
let newAssetType = 'image';
let pendingImage = null;
function setAssetType(t,el){ newAssetType=t; if(el)$$('#assetTypePills .chip').forEach(x=>x.classList.remove('active')); if(el)el.classList.add('active'); }
function handleAssetFile(input){
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = ()=>{
      const MAX = 900;
      let {width, height} = img;
      if(width > MAX){ height = Math.round(height*MAX/width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      pendingImage = canvas.toDataURL('image/jpeg', 0.75);
      $('#assetPreview').innerHTML = `<img src="${pendingImage}" style="width:100%;border-radius:10px;max-height:200px;object-fit:cover">`;
      const mb = (pendingImage.length*0.75/1024/1024).toFixed(1);
      $('#assetPreview').insertAdjacentHTML('beforeend', `<div style="font-size:11px;color:var(--text3);margin-top:4px">已压缩：${width}×${height} · 约 ${mb}MB</div>`);
      Toast('图片已就绪，填写名称后保存');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function doAssetAdd(){
  const folder = $('#assetFolder') ? $('#assetFolder').value : '其他';
  if(newAssetType==='image'){
    if(!pendingImage){ Toast('请先选择图片'); return; }
    const name = $('#assetName').value.trim()||('图片素材-'+new Date().toLocaleDateString());
    const item = {id:uid(), type:'image', name, size:Math.round(pendingImage.length*0.75/1024)+'KB', date:todayStr().slice(5), dataURL:pendingImage, folder};
    try{
      Store.data.assets.unshift(item); Store.save();
    }catch(e){ Toast('图片较大，存储失败'); return; }
    pendingImage=null;
  }else{
    const name = $('#assetName').value.trim()||'未命名素材';
    const text = $('#assetText').value.trim();
    Store.data.assets.unshift({id:uid(), type:newAssetType, name, size:newAssetType==='text'?(text.length||20)+'字':rnd(1,30)+'MB', date:todayStr().slice(5), body:text, folder});
    Store.save();
  }
  Modal.close(); renderAssets(); Toast('素材已保存 ✅');
}
function openAssetDetail(id){
  const a = Store.data.assets.find(x=>x.id===id); if(!a) return;
  const typeMeta = {image:['🖼️','图片'], text:['📝','文案'], video:['🎬','视频'], audio:['🎵','音频']};
  Modal.open('📦 '+a.name, `
    <div class="card" style="box-shadow:none;background:var(--bg)">
      ${a.dataURL?`<img src="${a.dataURL}" style="width:100%;border-radius:10px">`:`<div style="text-align:center;padding:24px;font-size:46px">${typeMeta[a.type][0]}</div>`}
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <span class="pill">${typeMeta[a.type][1]}</span><span class="pill">${a.size}</span><span class="pill">${a.date}</span>
      </div>
      ${a.body?`<div style="margin-top:12px;padding:12px;background:var(--card);border-radius:10px;font-size:13px;white-space:pre-wrap;max-height:220px;overflow-y:auto">${esc(a.body)}</div>`:''}
    </div>
    <div style="display:flex;gap:10px;margin-top:6px">
      ${a.body?`<button class="btn btn-ghost" style="flex:1" onclick="copyText(this,'${esc(a.body)}')">📋 复制文案</button>`:`<button class="btn btn-ghost" style="flex:1" onclick="copyText(this,'${esc(a.name)}')">📋 复制名称</button>`}
      <button class="btn btn-red" style="flex:1" onclick="delAsset('${a.id}')">🗑️ 删除</button>
    </div>`);
}
function delAsset(id){ Store.data.assets=Store.data.assets.filter(a=>a.id!==id); Store.save(); Modal.close(); renderAssets(); Toast('已删除素材'); }

/* ================= 渲染：内容库 & 收藏夹 ================= */
let libFilter = '全部';
/* V6.32 内容库批量排期：勾选多条 → 自动错开排进未来日期，省掉一篇篇点的重复劳动 */
let libSelectMode = false;
function toggleLibSelect(){
  libSelectMode = !libSelectMode;
  window.__libSel = [];
  renderLibrary();
}
function toggleLibSel(id){
  if(!window.__libSel) window.__libSel = [];
  const i = window.__libSel.indexOf(id);
  if(i>=0) window.__libSel.splice(i,1); else window.__libSel.push(id);
  const cnt = document.getElementById('libSelCount'); if(cnt) cnt.textContent = window.__libSel.length;
  renderLibrary();
}
function libBatchSchedule(){
  const ids = window.__libSel || [];
  if(!ids.length){ Toast('请先勾选要排期的内容'); return; }
  const d = Store.data;
  const times = ['10:00','12:30','19:30','20:00','21:00'];
  // 每天最多排 2 条，自动往后找空位
  let added = 0, day = 1;
  ids.forEach((id, idx)=>{
    const c = d.contents.find(x=>x.id===id); if(!c) return;
    let placed = false, guard = 0;
    while(!placed && guard++ < 60){
      const ds = fmtDate(addDays(day));
      const cnt = d.schedule.filter(s=>s.date===ds && s.status!=='idea').length;
      if(cnt < 2){
        d.schedule.push({ id:uid(), date:ds, title:c.title, status:'ready', time:times[cnt%times.length], cat:c.cat||'综合' });
        placed = true; added++;
        if(cnt >= 1) day++;
      } else { day++; }
    }
  });
  Store.save(); updateBadges();
  Toast('已排入 '+added+' 条内容 📅');
  toggleLibSelect();
  navigate('schedule');
}
function renderLibrary(){
  const d = Store.data;
  const statusMap = {draft:'草稿', ready:'待发布', published:'已发布'};
  let list = d.contents;
  if(libFilter!=='全部') list = list.filter(c=>c.status===libFilter);
  $('#content').innerHTML = `
  <div class="section-head"><h2>🗂️ 内容库</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" onclick="toggleLibSelect()">☑️ 批量排期</button><button class="btn btn-ghost btn-sm" onclick="exportAllContents()">⬇️ 全部导出</button><button class="btn btn-red btn-sm" onclick="openContentAdd()">＋ 新建内容</button></div></div>
  <div class="chip-row">${['全部','draft','ready','published'].map((s,i)=>`<span class="chip ${libFilter===s?'active':''}" onclick="libFilter='${s}';renderLibrary()">${i===0?'全部':statusMap[s]}</span>`).join('')}</div>
  ${libSelectMode?`<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--soft-red);border:1px solid rgba(194,59,82,.25);border-radius:10px;margin-bottom:10px;font-size:12.5px;flex-wrap:wrap">
    <span style="flex:1;min-width:140px">已选 <b id="libSelCount">${(window.__libSel||[]).length}</b> 篇 · 勾选后点「排入选定内容」一键排期</span>
    <button class="btn btn-red btn-sm" onclick="libBatchSchedule()">📅 排入选定内容</button>
    <button class="btn btn-ghost btn-sm" onclick="toggleLibSelect()">✕ 退出</button>
  </div>`:''}
  <div id="libList">${list.length?list.map(c=>`
    <div class="lib-item" style="cursor:pointer" onclick="${libSelectMode?`toggleLibSel('${c.id}')`:`openContentDetail('${c.id}')`}">
      ${libSelectMode?`<span class="lib-check ${(window.__libSel||[]).includes(c.id)?'on':''}">${(window.__libSel||[]).includes(c.id)?'✓':''}</span>`:''}
      <span class="lib-status st-${c.status}"></span>
      <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${esc(c.title)}${c.source?' <span class="pill purple" style="font-size:9px;padding:1px 5px;vertical-align:middle">↪ 转投</span>':''}</div><div style="font-size:11.5px;color:var(--text3)">${c.cat} · ${c.date}${c.status==='published'?` · 👀${fmtNum(c.views)} ❤️${c.likes} ⭐${c.collects}`:''}</div></div>
      <span class="pill ${c.status==='published'?'green':c.status==='ready'?'orange':'blue'}">${statusMap[c.status]}</span>
    </div>`).join(''):''
      + '<div class="empty" style="text-align:center;padding:48px 20px"><div style="font-size:56px;margin-bottom:14px">🗂️</div>'
      + '<div style="font-size:15px;font-weight:700;margin-bottom:8px">还没有内容？先写第一篇</div>'
      + '<div style="font-size:12.5px;color:var(--text3);max-width:280px;margin:0 auto 16px;line-height:1.7">内容库记录你写的每一篇笔记，方便复盘数据、复用标题、迁移账号</div>'
      + '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'
      + '<button class="btn btn-red btn-sm" onclick="navigate(\'create\')">✍️ 去 AI 创作</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="openContentAdd()">＋ 手动新建</button>'
      + '</div></div>'}</div>`;
}
function openContentDetail(id){
  const c = Store.data.contents.find(x=>x.id===id); if(!c) return;
  Modal.open('📄 '+c.title, `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span class="pill">${c.cat}</span><span class="pill ${c.status==='published'?'green':c.status==='ready'?'orange':'blue'}">${c.status==='published'?'已发布':c.status==='ready'?'待发布':'草稿'}</span><span class="pill">${c.date}</span></div>
    ${c.body?`<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;white-space:pre-wrap;max-height:260px;overflow-y:auto;line-height:1.8">${esc(c.body)}</div>`:'<div class="empty" style="padding:20px">这篇内容还没有正文，可前往 AI 创作中心生成</div>'}
    <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-red" style="flex:1;min-width:130px" onclick="openPreCheckStation({title:${JSON.stringify(c.title||'')},body:${JSON.stringify(c.body||'')}})">🩺 发布前检查台</button>
      <button class="btn btn-ghost" style="flex:1" onclick="openNoteReview('${esc(c.title)}','${esc(c.body||'')}')">🧐 评审</button>
      <button class="btn btn-ghost" style="flex:1" onclick="goCreateWith('${esc(c.title)}','${c.cat}')">✍️ 去创作</button>
      <button class="btn btn-ghost" style="flex:1" onclick="delContent('${c.id}')">🗑️ 删除</button>
    </div>
    <div style="font-size:11.5px;font-weight:700;color:var(--text3);margin:16px 0 8px">⬇️ 导出这篇内容</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="exportContent('${c.id}','md')">Markdown</button>
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="exportContent('${c.id}','txt')">纯文本</button>
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="exportContent('${c.id}','png')">🖼️ 卡片图</button>
    </div>
    <div style="margin-top:10px"><button class="btn btn-red btn-sm btn-block" style="width:100%" onclick="openTransferContent('${c.id}')">📤 转投到其他账号</button></div>`);
}
/* ================= V6.2 内容一键转投（矩阵多账号） ================= */
function openTransferContent(id){
  if(!premiumGuard('内容转投')) return;
  const ws = getWorkspaces();
  const other = ws.filter(w=>w.id!==getActiveWs());
  if(!other.length){ Toast('只有一个账号，先在「设置 → 工作区」添加其他账号'); return; }
  const c = Store.data.contents.find(x=>x.id===id); if(!c) return;
  Modal.open('📤 转投内容到其他账号', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">把「<b style="color:var(--text)">${esc(c.title)}</b>」复制到目标账号的内容库，<b>独立保存、互不影响</b>，改个标题就能直接发。</p>
    <div class="form-group"><label class="label">目标账号</label><select id="tfTarget">${other.map(w=>`<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label class="label">转投标题（可改）</label><input id="tfTitle" value="${esc(c.title)}"></div>
    <div class="form-group"><label class="label">转投后状态</label><select id="tfStatus"><option value="draft">草稿（推荐，确认后再发）</option><option value="ready">待发布</option></select></div>
    <button class="btn btn-red btn-block" onclick="doTransferContent('${c.id}')">📤 转投</button>`);
}
function doTransferContent(id){
  const targetWs = $('#tfTarget').value;
  const title = ($('#tfTitle') && $('#tfTitle').value.trim());
  if(!title){ Toast('请输入转投标题'); return; }
  const c = Store.data.contents.find(x=>x.id===id); if(!c) return;
  const key = getStoreKey(getUid(), targetWs);
  let pkg = null;
  try{ pkg = JSON.parse(localStorage.getItem(key)||'null'); }catch(e){}
  if(!pkg || !pkg.data){ Toast('目标账号数据未初始化，请先切换到该账号一次'); return; }
  const copy = {
    id: uid(),
    title: title.slice(0, 40),
    status: ($('#tfStatus') && $('#tfStatus').value) || 'draft',
    date: todayStr(),
    cat: c.cat,
    body: c.body || '',
    views: 0, likes: 0, collects: 0, comments: 0,
    source: '转投自「' + (localStorage.getItem('xhs_brand')||'本账号') + '」'
  };
  pkg.data.contents = pkg.data.contents || [];
  pkg.data.contents.unshift(copy);
  try{ localStorage.setItem(key, JSON.stringify(pkg)); }catch(e){ Toast('存储空间不足，转投失败'); return; }
  Modal.close(); Toast('已转投到目标账号 ✅');
}
/* ================= V5.9 内容导出（Markdown / 纯文本 / 卡片图） ================= */
function exportContent(id, fmt){
  const c = Store.data.contents.find(x=>x.id===id); if(!c) return;
  if(fmt==='md'){
    const md = '# '+c.title+'\n\n> 分类：'+c.cat+'　状态：'+(c.status==='published'?'已发布':c.status==='ready'?'待发布':'草稿')+'　日期：'+c.date+'\n\n'+(c.body||'（暂无正文）')+'\n\n---\n导出自 Crazy Friday. 小红书AI运营工作台';
    downloadFile(c.title+'.md', md, 'text/markdown;charset=utf-8');
    Toast('已导出 Markdown ✅');
  } else if(fmt==='txt'){
    downloadFile(c.title+'.txt', c.title+'\n'+c.date+' · '+c.cat+'\n\n'+(c.body||'（暂无正文）'), 'text/plain;charset=utf-8');
    Toast('已导出纯文本 ✅');
  } else if(fmt==='png'){
    exportContentCard(c);
    Toast('正在生成卡片图…');
  }
}
function downloadFile(name, text, type){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type}));
  a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
}
function wrapText(ctx, text, x, y, maxW, lh){
  let line = '';
  for(const ch of String(text)){
    const t = line + ch;
    if(ctx.measureText(t).width > maxW){ ctx.fillText(line, x, y); y += lh; line = ch; }
    else line = t;
  }
  if(line) ctx.fillText(line, x, y);
}
function exportContentCard(c){
  const W = 900, H = 1150, pad = 60;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'var(--red)'); grad.addColorStop(1, 'var(--red2)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, 240);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif';
  ctx.fillText('Crazy Friday.', pad, 100);
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '22px sans-serif';
  ctx.fillText('小红书AI运营工作台 · 内容卡片', pad, 150);
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '18px sans-serif';
  ctx.fillText(c.date + ' · ' + c.cat, pad, 195);
  // 正文
  ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 40px sans-serif';
  wrapText(ctx, c.title, pad, 340, W - pad*2, 56);
  ctx.fillStyle = '#6b6b70'; ctx.font = '24px sans-serif';
  wrapText(ctx, (c.body||'（暂无正文）').slice(0, 420), pad, 470, W - pad*2, 40);
  ctx.fillStyle = '#c8c8cd'; ctx.font = '16px sans-serif';
  ctx.fillText('导出自 Crazy Friday. · 一人 + AI = 一家公司', pad, H - 60);
  cv.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = c.title + '.png'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
    Toast('卡片图已导出 🖼️');
  }, 'image/png');
}
function openContentAdd(){
  Modal.open('＋ 新建内容', `
    <div class="form-group"><label class="label">标题</label><input id="cTitle" placeholder="内容标题"></div>
    <div class="form-group"><label class="label">分类</label><select id="cCat">${catOptions().map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="label">状态</label><select id="cStatus"><option value="draft">草稿</option><option value="ready">待发布</option><option value="published">已发布</option></select></div>
    <div class="form-group"><label class="label">正文（可选）</label><textarea id="cBody" placeholder="粘贴正文…"></textarea></div>
    <button class="btn btn-red btn-block" onclick="doContentAdd()">保存</button>`);
}
function doContentAdd(){
  const title=$('#cTitle').value.trim(); if(!title){Toast('请输入标题');return;}
  Store.data.contents.unshift({id:uid(), title, status:$('#cStatus').value, date:todayStr(), cat:$('#cCat').value, body:$('#cBody').value.trim(), views:0, likes:0, collects:0, comments:0});
  Store.save(); Modal.close(); renderLibrary(); Toast('已保存到内容库 ✅');
}
function delContent(id){ Store.data.contents=Store.data.contents.filter(c=>c.id!==id); Store.save(); Modal.close(); renderLibrary(); Toast('已删除内容'); }

/* ================= V6.3 内容库一键导出全部（Markdown 打包） ================= */
function exportAllContents(){
  const list = Store.data.contents;
  if(!list.length){ Toast('内容库还没有内容'); return; }
  const md = '# 我的内容库（Crazy Friday 导出 ' + todayStr() + ' · 共 ' + list.length + ' 篇）\n\n' +
    list.map(function(c){
      return '## ' + c.title + '\n\n> 分类：' + c.cat + '　状态：' + (c.status==='published'?'已发布':c.status==='ready'?'待发布':'草稿') + '　日期：' + c.date + '\n\n' + (c.body || '（暂无正文）') + '\n\n---\n';
    }).join('');
  downloadFile('我的内容库_' + todayStr() + '.md', md, 'text/markdown;charset=utf-8');
  Toast('已导出 ' + list.length + ' 篇 ✅');
}

function renderFavorites(){
  const d = Store.data;
  $('#content').innerHTML = `
  <div class="section-head"><h2>⭐ 灵感收藏夹</h2><span class="pill red">${d.favorites.length} 个灵感</span></div>
  ${d.favorites.length?d.favorites.map(f=>{
    const t = d.topicPool.find(x=>x.id===f.id) || {cat:f.cat, title:f.title, heat:f.heat, search:f.search};
    return `
    <div class="topic-item">
      <div class="topic-rank">${t.heat||'★'}</div>
      <div class="topic-main"><div class="topic-title">${esc(t.title)}</div><div class="topic-meta"><span class="pill">${t.cat}</span><span>热度 ${t.heat}</span><span>搜索 ${fmtNum(t.search||0)}</span></div></div>
      <div class="topic-actions">
        <button class="btn btn-ghost btn-sm" onclick="openSchedulePick('${esc(t.title)}','${t.cat}',event)">📅 排期</button>
        <button class="btn btn-red btn-sm" onclick="goCreateWith('${esc(t.title)}','${t.cat}')">去创作</button>
        <button class="icon-btn" onclick="toggleFavorite('${f.id}')">★</button>
      </div>
    </div>`;}).join(''):'<div class="empty"><span class="empty-ico">⭐</span>还没有收藏灵感<br>去「选题雷达」点击 ☆ 收藏</div>'}
  <div style="margin-top:16px"><button class="btn btn-ghost btn-block" onclick="goCreateWith('','美妆')">🎲 随机灵感一键创作</button></div>`;
}

/* ================= 账号诊断 ================= */
function renderDiagnosis(){
  const d = Store.data; 
  // V6.29 防御：老数据缺 dims/advice 会崩 → 给默认值
  const dx = Object.assign({level:'B', score:70, dims:[{name:'内容力',score:70},{name:'涨粉力',score:70},{name:'互动力',score:70},{name:'变现力',score:70},{name:'健康度',score:70}], advice:[{icon:'💡',text:'先完善账号数据，再生成更精准的诊断建议。'}]}, d.diagnosis||{});
  const levelColor = dx.level==='A'?'var(--green)':dx.level==='B'?'var(--orange)':'var(--red)';
  $('#content').innerHTML = `
  <div class="section-head"><h2>🏥 账号诊断</h2><button class="btn btn-red btn-sm" onclick="runDiagnosis()">🔄 重新检测</button></div>
  <div class="card" style="margin-bottom:14px">
    <div class="card-title">🚀 AI 30 天成长计划</div>
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">基于你的<b>诊断结果 + 真实数据</b>，AI 生成一份可执行的 30 天成长路线：每周重点、具体动作、30 天后的里程碑。</p>
    <button class="btn btn-red btn-sm" onclick="aiGrowthPlan()">🤖 生成我的 30 天计划</button>
    <div id="growthOut" style="margin-top:12px"></div>
  </div>
  <div class="grid grid-2">
    <div>
      <div class="card">
        <div class="card-title">综合健康度</div>
        <div class="radar-wrap">
          ${radarSVG(dx.dims)}
          <div class="radar-score">${dx.score}</div>
          <span class="radar-level" style="background:${levelColor}22;color:${levelColor}">${dx.level} 级账号</span>
          <div style="font-size:12px;color:var(--text3);margin-top:10px">超过同垂类 85% 的账号</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">五项能力拆解</div>
        ${dx.dims.map((m,i)=>`
        <div class="dim-row">
          <span class="dim-name">${m.name}</span>
          <div class="dim-bar"><i style="width:${m.score}%;background:${['linear-gradient(90deg,#ff3b30,#ff6b60)','linear-gradient(90deg,#ff9500,#ffb340)','linear-gradient(90deg,#0a84ff,#5ac8fa)','linear-gradient(90deg,#bf5af2,#d98aff)','linear-gradient(90deg,#34c759,#68e08b)'][i]}"></i></div>
          <span class="dim-val">${m.score}</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-title">📋 AI 诊断建议</div>
      ${dx.advice.map(a=>`<div style="display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)">
        <span style="font-size:20px">${a.icon}</span>
        <div style="font-size:13px;color:var(--text2);line-height:1.7">${a.text}</div>
      </div>`).join('')}
      <div class="divider"></div>
      <button class="btn btn-black btn-block" onclick="goCreateWith('','美妆')">✨ 按建议去创作 →</button>
    </div>
  </div>`;
}
/* ================= V6.1 AI 30 天成长计划（尊享版） ================= */
let growthResult = '';
async function aiGrowthPlan(){
  if(!premiumGuard('AI 30 天成长计划')) return;
  const d = Store.data, dx = d.diagnosis;
  const out = $('#growthOut');
  out.innerHTML = '<div class="loading">AI 正在结合你的数据生成 30 天计划…（约 20-40 秒）</div>';
  const weak = dx.dims.filter(x=>x.score<60).map(x=>x.name+'('+x.score+'分)').join('、') || '无明显弱项';
  const prompt = '我的小红书账号诊断结果：健康度 '+dx.score+' 分（'+dx.level+' 级），五项维度：'+dx.dims.map(x=>x.name+' '+x.score+'分').join('、')+'。弱项：'+weak+'。当前粉丝 '+d.analytics.overview.fans+'，近 30 天发布 '+d.schedule.filter(s=>s.status==='published').length+' 篇。\n\n请为我生成【30 天成长计划】，严格按此格式：\n【第 1 周】本周重点：\n· 动作 1：\n· 动作 2：\n· 动作 3：\n【第 2 周】本周重点：\n· 动作 1：\n· 动作 2：\n· 动作 3：\n【第 3 周】本周重点：\n· 动作 1：\n· 动作 2：\n· 动作 3：\n【第 4 周】本周重点：\n· 动作 1：\n· 动作 2：\n· 动作 3：\n【30 天后里程碑】粉丝/互动量化目标：\n\n要求：结合我的弱项给出针对性改进，每个动作具体可执行（不要"提升内容质量"这种空话）。';
  const r = await aiAsk(prompt, '你是小红书账号运营教练，输出必须具体、量化、可执行。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  growthResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.9;white-space:pre-wrap;max-height:380px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制计划</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveGrowthPlan()">📥 存入灵感笔记</button>
    </div>`;
}
function saveGrowthPlan(){
  if(!growthResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'AI 30 天成长计划 · '+todayStr(), content:growthResult, tag:'成长', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

function radarSVG(dims){
  const cx=110, cy=110, R=72, N=dims.length;  const pt = (i, r) => { const ang = -Math.PI/2 + i*2*Math.PI/N; return [cx + Math.cos(ang)*r, cy + Math.sin(ang)*r]; };
  let grid='', labels='', data='';
  for(let ring=1; ring<=4; ring++){
    const pts = dims.map((_,i)=>pt(i, R*ring/4).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
  }
  const dpts = dims.map((m,i)=>pt(i, R*m.score/100).join(',')).join(' ');
  data = `<polygon points="${dpts}" fill="rgba(194,59,82,.16)" stroke="var(--red)" stroke-width="2"/>`;
  dims.forEach((m,i)=>{ const [x,y]=pt(i, R+16); labels += `<text x="${x}" y="${y+4}" font-size="11" fill="var(--text2)" text-anchor="middle">${m.name}</text>`; });
  return `<svg viewBox="0 0 220 220" style="width:230px;height:230px">${grid}${data}${labels}</svg>`;
}
function runDiagnosis(){
  const dx = Store.data.diagnosis;
  dx.dims.forEach(m=>{ m.score = Math.min(99, Math.max(60, m.score + rnd(-4,5))); });
  dx.score = Math.round(dx.dims.reduce((a,b)=>a+b.score,0)/dx.dims.length);
  dx.level = dx.score>=85?'S':dx.score>=75?'A':dx.score>=65?'B':'C';
  Store.save(); renderDiagnosis(); Toast('诊断完成 ✅');
}

/* ================= 对标账号 ================= */
function renderBenchmark(){
  const d = Store.data;
  const list = d.benchmarks;
  const myFans = d.analytics.overview.fans;
  const avgFans = list.length ? Math.round(list.reduce((a,b)=>a+b.fans,0)/list.length) : 0;
  const avgInter = list.length ? (list.reduce((a,b)=>a+b.interaction,0)/list.length).toFixed(1) : 0;
  $('#content').innerHTML = `
  <div class="section-head"><h2>🎯 对标账号</h2><button class="btn btn-red btn-sm" onclick="openBenchmarkAdd()">＋ 添加对标</button></div>
  <div class="card" style="border-color:rgba(10,132,255,.25);margin-bottom:14px">
    <div class="card-title">🔭 竞品情报本</div>
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">粘贴博主主页链接即可添加监控；看到优质笔记一键收藏进素材库；对标账号疑似产出新爆款时标记「🛎️ 预警」，第一时间跟进选题，热点不隔夜。</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <input id="watchLink" placeholder="粘贴博主主页链接（xhslink.com/a/xxx 或全链接）" style="flex:1;min-width:200px">
      <button class="btn btn-red btn-sm" onclick="addWatch()">＋ 一键对标</button>
      <button class="btn btn-ghost btn-sm" onclick="aiBenchmarkAnalysis()">🤖 AI 对标分析</button>
      <button class="btn btn-ghost btn-sm" onclick="aiIntelBrief()">📋 自动竞品简报</button>
      <button class="btn btn-ghost btn-sm" onclick="openNoteLinkSave()">🔗 收藏笔记链接</button>
    </div>
  </div>
  <div class="bm-vs" style="margin-bottom:14px">
    <div class="stat-mini"><div class="sm-label">我的粉丝</div><div class="sm-row"><span class="sm-num" style="font-size:20px">${fmtNum(myFans)}</span></div></div>
    <div class="stat-mini"><div class="sm-label">对标平均粉丝</div><div class="sm-row"><span class="sm-num" style="font-size:20px">${fmtNum(avgFans)}</span></div></div>
    <div class="stat-mini"><div class="sm-label">对标平均互动率</div><div class="sm-row"><span class="sm-num" style="font-size:20px">${avgInter}%</span></div></div>
  </div>
  ${list.length?list.map(b=>{
    const snaps = b.snapshots || [];
    let delta = '';
    if(snaps.length){
      const last = snaps[snaps.length-1];
      const df = b.fans - (last.fans||0), dn = b.notes - (last.notes||0);
      const days = last.at ? Math.max(1, Math.round((Date.now()-new Date(last.at).getTime())/864e5)) : 1;
      if(df||dn) delta = `<div class="bm-delta">较上次快照 <b style="color:${df>=0?'var(--green)':'var(--red)'}">${df>=0?'+':''}${fmtNum(df)}</b> 粉丝 · <b>${dn>=0?'+':''}${dn}</b> 笔记（${days} 天内）</div>`;
    }
    return `
  <div class="bm-card" ${b.alert?'style="border-color:var(--red);background:var(--soft-red)"':''}>
    <div class="bm-avatar">${b.alert?'🔥':b.avatar}</div>
    <div class="bm-info">
      <div class="bm-name">${esc(b.name)}${b.watch?' <span style="font-size:10px;color:var(--blue)">· 监控中</span>':''}</div>
      <div class="bm-meta"><span>粉丝 ${fmtNum(b.fans)}</span><span>笔记 ${b.notes}</span><span>互动率 ${b.interaction}%</span>${b.alertDate?`<span class="pill red" style="font-size:9px">🔥 ${b.alertDate} 疑似爆款</span>`:''}</div>
      ${delta||''}
    </div>
    <span class="pill ${b.fans>myFans?'orange':'green'}">${b.fans>myFans?'领先':'超越'}</span>
    <button class="icon-btn" title="更新数据快照（对比增长）" onclick="bmSnapshot('${b.id}')">✏️</button>
    <button class="icon-btn" title="${b.alert?'取消预警':'标记爆款预警，一键跟进'}" onclick="toggleAlert('${b.id}')">${b.alert?'🔥':'🛎️'}</button>
    <button class="icon-btn" onclick="delBenchmark('${b.id}')">🗑️</button>
  </div>`;}).join(''):'<div class="empty"><span class="empty-ico">🎯</span>还没有对标账号，添加一个吧</div>'}
  <div class="card" style="margin-top:14px">
    <div class="card-title">💡 对标分析</div>
    <p style="font-size:13px;color:var(--text2);line-height:1.8">${myFans<avgFans?'你的粉丝量低于对标均值，但互动率方面仍有优势，建议重点拆解对标账号的爆款选题结构，加速涨粉。':'你的粉丝量已超过对标均值，继续保持内容节奏，冲刺下一个量级。'}${avgInter>0?`<br>对标账号平均互动率 <b>${avgInter}%</b>，${myFans>avgFans*1.5?'可考虑提高发布频率':'需重点关注内容质量提升互动'}。`:''}</p>
  </div>`;
}
/* ================= V5.9 竞品情报本（尊享版） ================= */
/* ================= V6.3 一键对标：链接自动识别 + AI 对标分析（尊享） ================= */
function parseXhsUrl(url){
  const u = String(url||'').trim();
  const idm = u.match(/user\/profile\/([a-zA-Z0-9]+)/) || u.match(/[?&]id=([a-zA-Z0-9]{6,})/);
  if(idm) return {id:idm[1], name:'博主 ' + idm[1].slice(0,6)};
  const host = u.replace(/^https?:\/\//,'').replace(/^www\./,'').split(/[/?#]/)[0];
  return {id:'', name:'博主 · ' + (host || '新对标')};
}
function addWatch(){
  const link = $('#watchLink').value.trim();
  if(!link){ Toast('请粘贴博主主页链接'); return; }
  if(!premiumGuard('竞品情报本')) return;
  const parsed = parseXhsUrl(link);
  const name = parsed.name.slice(0, 18);
  Store.data.benchmarks.push({id:uid(), name, avatar:'🔭', fans:0, notes:0, interaction:0, link, watch:true, parsedId:parsed.id||''});
  Store.save(); $('#watchLink').value=''; renderBenchmark(); Toast('已添加监控：'+name+' 🔭（点🛎️标记爆款跟进）');
}
async function aiBenchmarkAnalysis(){
  if(!premiumGuard('AI 对标分析')) return;
  Modal.open('🤖 AI 对标分析', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">粘贴对方的主页链接 / 简介 / 近期几条爆款笔记标题，AI 帮你拆解 <b>ta 的定位、爆款结构</b>，并给出 <b>你能直接照做的打法</b>。</p>
    <textarea id="bmAiInput" placeholder="粘贴对方主页链接、简介或几条爆款笔记标题…" style="min-height:90px"></textarea>
    <button class="btn btn-red btn-block" onclick="runAiBenchmark()">🔍 开始分析</button>
    <div id="bmAiOut" style="margin-top:12px"></div>`);
}
async function runAiBenchmark(){
  const src = $('#bmAiInput').value.trim();
  if(!src){ Toast('请粘贴链接或简介'); return; }
  const out = $('#bmAiOut');
  out.innerHTML = '<div class="loading">AI 正在拆解对标账号…（约 15-30 秒）</div>';
  const prompt = '这是我在小红书上关注的竞品/对标账号信息：\n' + src.slice(0, 2500) + '\n\n请帮我做对标分析，严格按此格式：\n【1. 账号定位】一句话总结 ta 的赛道/人设/内容标签\n【2. 爆款结构】ta 的爆款笔记通常长什么样（选题方向/标题套路/内容框架）\n【3. 可抄打法】给出 3 条我能直接照做的策略（结合普通个人号）\n【4. 差异化机会】ta 没做好、我可以补上的缺口\n\n要求具体、可执行、不空话。';
  const r = await aiAsk(prompt, '你是小红书竞品分析专家，输出必须具体可执行。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:340px;overflow-y:auto">${esc(r.text)}</div>
    <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%" onclick="copyText(this,'${esc(r.text)}')">📋 复制分析报告</button>`;
}
/* ================= V6.4 自动竞品简报（尊享） =================
 * 把监控账号 + 收藏链接 + 预警标记汇总，AI 一键产出竞品情报简报，
 * 客户无需逐条看，打开即可掌握竞品动态与可跟进选题。
 */
let intelResult = '';
async function aiIntelBrief(){
  if(!premiumGuard('自动竞品简报')) return;
  const d = Store.data;
  const bms = d.benchmarks || [];
  const assets = d.assets || [];
  const notes = d.favorites || [];
  if(!bms.length && !assets.length && !notes.length){
    Toast('先添加几个对标账号或收藏一些笔记链接，简报才有料 📋'); return;
  }
  Modal.open('📋 自动竞品简报', '<div id="intelOut" style="min-height:120px"><div class="loading">AI 正在汇总竞品情报…（约 15-30 秒）</div></div>');
  const bmList = bms.slice(0, 12).map(b=>b.name + (b.fans?(' 粉丝'+b.fans):'') + (b.alert?'【疑似爆款 🔥】':'')).join('；') || '暂无';
  const favList = (assets.filter(a=>a.type==='text'&&a.note) || []).concat(notes.map(n=>n.title||n.note||'')).filter(Boolean).slice(0, 15).join('；') || '暂无';
  const prompt = '以下是我在小红书情报本里监控的信息：\n【监控博主】'+bmList+'\n【收藏的笔记/素材】'+favList+'\n\n请生成一份「竞品情报简报」，严格按此结构：\n【1. 竞品动态一句话总览】\n【2. 竞品在打什么】总结 2-3 个他们近期集中发力的方向\n【3. 我可跟进选题】给出 3 个基于这些情报的可直接落地的选题（含标题方向）\n【4. 风险与机会】1 条警告 + 1 条机会\n\n要求：只基于我提供的信息推断，不要编造具体数据，具体可执行。';
  const r = await aiAsk(prompt, '你是小红书竞品情报分析师，简报要精炼、可执行，不编造数据。');
  const out = $('#intelOut');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  intelResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:360px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制简报</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveIntelBrief()">📥 存入灵感笔记</button>
    </div>`;
}
function saveIntelBrief(){
  if(!intelResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'竞品情报简报 · '+todayStr(), content:intelResult, tag:'情报', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* V6.41 对标快照：手动更新数据，自动算增速（真实计算，不伪造） */
function bmSnapshot(id){
  const b = Store.data.benchmarks.find(x=>x.id===id); if(!b) return;
  Modal.open('✏️ 更新快照 · '+esc(b.name), `
    <div style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">填当前看到的数据（每周看一眼填一次），系统自动对比上次快照算出<b>真实增速</b>。</div>
    <div class="form-group"><label class="label">当前粉丝数</label><input id="snFans" type="number" value="${b.fans||0}"></div>
    <div class="form-group"><label class="label">笔记数</label><input id="snNotes" type="number" value="${b.notes||0}"></div>
    <div class="form-group"><label class="label">互动率 %</label><input id="snInter" type="number" step="0.1" value="${b.interaction||0}"></div>
    <button class="btn btn-red btn-block" onclick="doBmSnapshot('${b.id}')">保存快照</button>`);
}
function doBmSnapshot(id){
  const b = Store.data.benchmarks.find(x=>x.id===id); if(!b) return;
  const fans = parseInt($('#snFans').value)||0, notes = parseInt($('#snNotes').value)||0, inter = parseFloat($('#snInter').value)||0;
  b.snapshots = b.snapshots || [];
  b.snapshots.push({at:new Date().toISOString(), fans:b.fans||0, notes:b.notes||0, interaction:b.interaction||0});
  b.fans = fans; b.notes = notes; b.interaction = inter;
  Store.save(); Modal.close(); renderBenchmark();
  const df = fans - (b.snapshots.length>1 ? b.snapshots[b.snapshots.length-2].fans : b.fans);
  Toast('快照已保存 ✅');
}
function toggleAlert(id){
  const b = Store.data.benchmarks.find(x=>x.id===id); if(!b) return;  if(b.alert){
    b.alert = false; delete b.alertDate;
    Store.save(); renderBenchmark(); Toast('已取消预警');
  } else {
    if(!premiumGuard('爆款预警')) return;
    b.alert = true; b.alertDate = todayStr();
    Store.save(); renderBenchmark();
    setTimeout(()=>openSchedulePick('跟进「'+b.name.replace(/^博主 · /,'')+'」新爆款选题','美妆'), 400);
  }
}
function openNoteLinkSave(){
  if(!premiumGuard('笔记链接收藏')) return;
  Modal.open('🔗 收藏笔记链接', `
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px">看到优质笔记，一键收进自己的素材库，方便后续参考复用。</div>
    <div class="form-group"><label class="label">笔记链接</label><input id="nlLink" placeholder="粘贴小红书笔记链接"></div>
    <div class="form-group"><label class="label">备注（可选）</label><input id="nlNote" placeholder="如：爆款穿搭合集 / 好物测评"></div>
    <button class="btn btn-red btn-block" onclick="saveNoteLink()">📥 存入素材库</button>`);
}
function saveNoteLink(){
  const link = $('#nlLink').value.trim(); if(!link){ Toast('请输入链接'); return; }
  const note = $('#nlNote').value.trim() || '收藏的笔记链接';
  Store.data.assets.unshift({id:uid(), type:'text', name:note, size:'链接', date:todayStr().slice(5), body:link, folder:'其他'});
  Store.save(); Modal.close(); Toast('已收藏到素材库 📁');
}
function openBenchmarkAdd(){
  Modal.open('＋ 添加对标账号', `
    <div class="form-group"><label class="label">账号名称</label><input id="bmName" placeholder="如：小A同学"></div>
    <div class="form-group"><label class="label">头像表情</label><input id="bmAvatar" placeholder="如：👩 或 🧑"></div>
    <div class="form-group"><label class="label">数据</label><div style="display:flex;gap:8px"><input id="bmFans" type="number" placeholder="粉丝数"><input id="bmNotes" type="number" placeholder="笔记数"><input id="bmInter" type="number" step="0.1" placeholder="互动率%"></div></div>
    <button class="btn btn-red btn-block" onclick="doBenchmarkAdd()">保存</button>`);
}
function doBenchmarkAdd(){
  const name=$('#bmName').value.trim(); if(!name){Toast('请输入名称');return;}
  Store.data.benchmarks.push({id:uid(), name, avatar:$('#bmAvatar').value.trim()||'🧑', fans:+$('#bmFans').value||0, notes:+$('#bmNotes').value||0, interaction:+$('#bmInter').value||0});
  Store.save(); Modal.close(); renderBenchmark(); Toast('已添加 ✅');
}
function delBenchmark(id){ Store.data.benchmarks=Store.data.benchmarks.filter(b=>b.id!==id); Store.save(); renderBenchmark(); Toast('已删除'); }

/* ================= 运营工具箱 ================= */
/* V6.41 场景化工具收敛：按「这一步想干什么」找工具，替代 20 个平铺入口 */
function sceneToolGroups(){
  return [
    {icon:'🎯', title:'选题策划', desc:'先想清楚发什么、给谁看', tools:[
      {n:'爆款深度拆解', act:'openDeepRemix()'}, {n:'爆款拆解库', act:'openRemixLib()'}, {n:'博主风格分析', act:'openBloggerStyle()'}, {n:'关键词布局', act:'openKeywordPlan()'}, {n:'记录灵感', act:'openIdeaAdd()'}
    ]},
    {icon:'✍️', title:'内容创作', desc:'把选题写成能发的稿子', tools:[
      {n:'AI 创作中心', act:"navigate('create')"}, {n:'去 AI 味改写', act:'openDeAIfy()'}, {n:'评论区助手', act:'openAiComment()'}, {n:'问 AI 助理', act:'openSidekick()'}
    ]},
    {icon:'🩺', title:'发布质检', desc:'发出去之前，把雷先排掉', tools:[
      {n:'发布前检查台', act:'openPreCheckStation()'}, {n:'笔记评审', act:'openNoteReview()'}, {n:'违禁词扫描', act:'openSensitiveCheck()'}, {n:'发布前查重', act:'openPrePublishCheck()'}
    ]},
    {icon:'📈', title:'商业增长', desc:'把流量变成收入', tools:[
      {n:'变现路径诊断', act:'openVpath()'}, {n:'收益预估', act:'openIncomeForecast()'}, {n:'变现风控', act:'openRiskCheck()'}, {n:'电商带货', act:"navigate('shop')"}
    ]}
  ];
}
function sceneToolGroupsHtml(){
  return '<div class="section-label">按场景找工具 <span class="sl-more" style="font-weight:400;cursor:default">想干什么 → 点什么</span></div>' +
    '<div class="st-grid">' + sceneToolGroups().map(g=>`
    <div class="st-card">
      <div class="st-head">${g.icon} ${g.title}<span class="st-desc">${g.desc}</span></div>
      <div class="st-tools">${g.tools.map(t=>`<span class="st-btn" onclick="Modal.close();${t.act}">${t.n}</span>`).join('')}</div>
    </div>`).join('') + '</div>';
}
function renderToolbox(){
  const d = Store.data; const tb = d.toolbox||{};
  const tags = Object.entries(tb.tagLib||{});
  $('#content').innerHTML = `
  <div class="section-head"><h2>🔧 运营工具箱</h2><span class="pill red">会员专属</span></div>
  ${sceneToolGroupsHtml()}
  <div class="section-label">高频快捷 <span class="sl-more" style="font-weight:400;cursor:default">常用动作一步到位</span></div>
  <div class="tool-quick">
    <div class="tool-quick-item" onclick="openNoteReview()"><span>🧐</span>笔记评审<small>打分+修改建议</small></div>
    <div class="tool-quick-item" onclick="openDataPaste()"><span>📥</span>数据导入<small>粘贴自动解析</small></div>
    <div class="tool-quick-item" onclick="openWeekPlan()"><span>⚡</span>一周计划<small>一键排 7 天</small></div>
    <div class="tool-quick-item" onclick="openSidekick()"><span>💬</span>问 AI 助理<small>基于你的数据</small></div>
    <div class="tool-quick-item" onclick="openAiComment()"><span>💬</span>AI 评论回复<small>一键生成话术 · 尊享</small></div>
    <div class="tool-quick-item" onclick="openDeAIfy()"><span>✍️</span>去 AI 味改写<small>真人语感 · 防限流</small></div>
    <div class="tool-quick-item" onclick="openKeywordPlan()"><span>🔍</span>关键词布局<small>搜索流量优化</small></div>
    <div class="tool-quick-item" onclick="openPreCheckStation()"><span>🩺</span>发布前检查台<small>边写边打分</small></div>
    <div class="tool-quick-item" onclick="openBloggerStyle()"><span>🎭</span>博主风格分析<small>7 维拆解 + 融合改写</small></div>
  </div>
  <div class="grid grid-2">
    <div>
      <div class="tool-card">
        <div class="card-title">⏰ 最佳发布时间</div>
        ${(tb.bestTimes||[]).map(t=>`<div class="time-slot" style="${t.hot?'border:1px solid rgba(52,199,89,.4)':''}"><span style="font-weight:700;font-size:13px">${t.time}</span><span style="font-size:12px;color:var(--text2)">${t.desc}</span>${t.hot?'<span class="pill green">推荐</span>':''}</div>`).join('')}
      </div>
      <div class="tool-card">
        <div class="card-title">🏷️ 话题标签库</div>
        ${tags.map(([k,v])=>`
        <div style="margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:4px">${k}</div>
          ${v[0].split(' ').filter(Boolean).map(t=>`<span class="tag-chip" onclick="copyText(this,'${t}')">${t}</span>`).join('')}
        </div>`).join('')}
        <div style="font-size:11px;color:var(--text3)">点击标签一键复制</div>
      </div>
    </div>
    <div>
      <div class="tool-card">
        <div class="card-title">💬 互动话术库</div>
        ${(tb.scripts||[]).map(s=>`
        <div class="script-card">
          <div style="font-size:12px;font-weight:600;color:var(--red);margin-bottom:4px">${s.name}</div>
          <div style="font-size:13px;color:var(--text2);line-height:1.7">${s.text}</div>
          <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="copyText(this,'${esc(s.text)}')">📋 复制话术</button>
        </div>`).join('')}
      </div>
      <div class="tool-card">
        <div class="card-title">✅ 每日运营清单 <span style="font-size:12px;color:var(--text3);font-weight:400">${(tb.checklist||[]).filter(c=>c.done).length}/${(tb.checklist||[]).length}</span></div>
        ${(tb.checklist||[]).map((c,i)=>`
        <div class="check-item ${c.done?'done':''}" onclick="toggleCheck(${i})">
          <div class="c-box">${c.done?'✓':''}</div>
          <span class="c-name" style="font-size:13px">${esc(c.name)}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}
function toggleCheck(i){
  Store.data.toolbox.checklist[i].done = !Store.data.toolbox.checklist[i].done;
  Store.save(); renderToolbox();
}

/* ================= AI 评论区助手（尊享版） ================= */
function openAiComment(){
  if(!premiumGuard('AI 评论区助手')) return;
  Modal.open('💬 AI 评论区助手', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">输入你的笔记主题或粉丝评论，AI 一键生成自然、高互动权的回复话术，帮你快速维护评论区。</p>
    <div class="form-group"><label class="label">笔记主题 / 内容</label><input id="aiCcTopic" placeholder="如：新手化妆教程 / 通勤穿搭分享"></div>
    <div class="form-group"><label class="label">粉丝评论（可多条，用 / 分隔）</label><textarea id="aiCcComments" placeholder="如：姐妹求链接！/ 博主用的什么粉底液？/ 太详细了收藏了"></textarea></div>
    <div class="form-group"><label class="label">语气风格</label><select id="aiCcStyle"><option value="亲切自然">亲切自然</option><option value="专业靠谱">专业靠谱</option><option value="活泼俏皮">活泼俏皮</option><option value="真诚走心">真诚走心</option></select></div>
    <button class="btn btn-red btn-block" onclick="aiComment()">✨ 生成回复话术</button>
    <div id="aiCcOut" style="margin-top:12px"></div>`);
}
async function aiComment(){
  const topic = $('#aiCcTopic').value.trim();
  const comments = $('#aiCcComments').value.trim();
  const style = $('#aiCcStyle').value;
  if(!topic && !comments){ Toast('请输入笔记主题或粉丝评论'); return; }
  const out = $('#aiCcOut');
  out.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2)"><span class="ai-loading">🤖</span> AI 正在生成回复话术…</div>';
  const prompt = '我是小红书博主，笔记主题是「'+(topic||'未填写')+'」。\n粉丝评论：\n' + (comments || '（未提供具体评论，请给出通用的互动引导话术）') + '\n\n请为每条评论生成 1-2 条「'+style+'」风格的回复话术，要求：\n1. 每条回复 10-30 字，口语化、不机械\n2. 能引导互动（追问、抛话题、引导关注/收藏）\n3. 适当用 emoji 但不滥用\n4. 涉及链接/微信号等引流时给出合规说法\n\n输出格式：\n评论：xxx\n回复：xxx';
  const r = await aiAsk(prompt, '你是小红书高赞评论区回复专家，深谙互动权重逻辑与平台合规边界。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:360px;overflow-y:auto">${esc(r.text)}</div>
    <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%" onclick="copyText(this,'${esc(r.text)}')">📋 复制全部话术</button>`;
}

/* ================= 灵感笔记 ================= */
function renderIdeas(){
  const d = Store.data;
  $('#content').innerHTML = `
  <div class="section-head"><h2>💡 灵感笔记</h2><button class="btn btn-red btn-sm" onclick="openIdeaAdd()">＋ 记一条灵感</button></div>
  ${d.ideas.length?d.ideas.map(i=>`
  <div class="idea-card" onclick="openIdeaDetail('${i.id}')">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div class="idea-title">${esc(i.title)}</div>
      <span class="pill">${i.tag||'未分类'}</span>
    </div>
    <div class="idea-content">${esc(i.content)}</div>
    <div class="idea-foot">
      <span style="font-size:11px;color:var(--text3)">${i.date||''}</span>
      <span class="more" onclick="event.stopPropagation();goCreateWith('${esc(i.title)}','${i.tag||'美妆'}')">✍️ 转创作 →</span>
    </div>
  </div>`).join(''):'<div class="empty"><span class="empty-ico">💡</span>灵光一现马上记下来<br>好记性不如烂笔头</div>'}`;
}
function openIdeaAdd(){
  Modal.open('💡 记录灵感', `
    <div class="form-group"><label class="label">标题</label><input id="ideaTitle" placeholder="灵感标题"></div>
    <div class="form-group"><label class="label">内容</label><textarea id="ideaContent" placeholder="记录下这个灵感…"></textarea></div>
    <div class="form-group"><label class="label">分类</label><select id="ideaTag">${catOptions().map(c=>`<option>${c}</option>`).join('')}</select></div>
    <button class="btn btn-red btn-block" onclick="doIdeaAdd()">保存灵感</button>`);
}
function doIdeaAdd(){
  const title=$('#ideaTitle').value.trim(); if(!title){Toast('请输入标题');return;}
  Store.data.ideas.unshift({id:uid(), title, content:$('#ideaContent').value.trim(), tag:$('#ideaTag').value, date:todayStr()});
  Store.save(); Modal.close(); renderIdeas(); Toast('已记录 💡');
}
function openIdeaDetail(id){
  const i = Store.data.ideas.find(x=>x.id===id); if(!i) return;
  Modal.open('💡 '+i.title, `
    <span class="pill">${i.tag||'未分类'}</span>
    <div style="background:var(--line2);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;color:var(--text2);margin-top:10px">${esc(i.content)}</div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-ghost" style="flex:1" onclick="delIdea('${i.id}')">🗑️ 删除</button>
      <button class="btn btn-red" style="flex:1" onclick="Modal.close();goCreateWith('${esc(i.title)}','${i.tag||'美妆'}')">✍️ 转创作</button>
    </div>`);
}
function delIdea(id){ Store.data.ideas=Store.data.ideas.filter(i=>i.id!==id); Store.save(); Modal.close(); renderIdeas(); Toast('已删除'); }

/* ================= 会员中心 ================= */
let memTier = ''; // 会员中心档位切换（standard/premium），默认跟随当前授权
function renderMembership(){
  const d = Store.data; const sub = d.subscription;
  // 以激活码授权的真实状态为准（避免「已激活却显示已到期」），无授权时用产品订阅数据兜底
  const lic = (LIC_STATE && LIC_STATE.status==='activated') ? LIC_STATE : null;
  const remain = lic ? (lic.remain!==undefined ? lic.remain : 0) : (sub.remainDays===undefined?0:sub.remainDays);
  const planName = lic ? (lic.plan||'年度会员') : (sub.planName||'年度会员');
  const expireAt = lic ? lic.expireAt : (sub.expireAt||'');
  const total = 365;
  const pct = Math.min(100, Math.round(remain/total*100));
  // V6.6 品牌锁死：会员中心固定显示 Crazy Friday. 品牌
  const brand = 'Crazy Friday.';
  const workspaceName = localStorage.getItem('xhs_brand')||'小红书AI工作台';
  const payUrl = localStorage.getItem('xhs_pay_url') || '';
  const contact = getContactInfo();
  if(!memTier || !PRICING_TIERS[memTier]) memTier = Object.keys(PRICING_TIERS)[0];
  // 使用时长
  let usageElapsed = 0, usageActive = 0;
  try{
    const u = getUsageState();
    if(u && u.firstSeen){ usageElapsed = getElapsedDays(u.firstSeen); usageActive = u.activeDays||0; }
    else{
      const lic2 = JSON.parse(localStorage.getItem(getLicenseStoreKey(getUid()))||'null');
      if(lic2 && lic2.activatedAt){ usageElapsed = getElapsedDays(lic2.activatedAt); }
    }
  }catch(e){}
  const hero = '<div class="member-hero">' +
    '<div class="mh-glow"></div>' +
    '<div class="mh-top">' +
      '<div class="mh-left">' +
        '<div class="mh-name">'+esc(brand)+'<span class="mh-dot">.</span></div>' +
        '<div class="mh-role">'+esc(workspaceName)+' · 运营官</div>' +
      '</div>' +
      '<div class="mh-toggle" id="mhToggle">' +
        Object.keys(PRICING_TIERS).map(function(id){
          return '<button class="mt-btn '+(memTier===id?'on':'')+'" onclick="setMemTier(\''+id+'\')">'+PRICING_TIERS[id].label+'</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="mh-exp'+(remain>0?'':' mh-exp-bad')+'">'+(remain>0 ? ('有效期至 <b>'+expireAt+'</b> · 剩余 <b>'+remain+'</b> 天') : '会员已到期，请及时续费')+'</div>' +
    '<div class="progress-bar"><i style="width:'+pct+'%"></i></div>' +
    '<div class="mh-usage">'+(usageElapsed?('已使用 <b>'+usageElapsed+'</b> 天 · 感谢你的持续支持'):'感谢使用 Crazy Friday.')+'</div>' +
  '</div>';
  // 两张深色权益卡（上下排列，✅ 勾选图标）
  // 两张深色权益卡（数据从 PRICING_TIERS 集中配置读取，未来可加新档位）
  const rightCard = function(tierId){
    const t = PRICING_TIERS[tierId]; if(!t) return '';
    const on = memTier===tierId;
    const priceTag = t.priceNote ? (t.priceNote+' '+t.price) : t.price;
    return '<div class="mh-card'+(on?' on':'')+'" id="mhCard'+tierId+'">' +
      '<div class="mh-card-head"><b>'+t.label+'</b><span class="mh-card-tag">'+priceTag+'</span></div>' +
      '<div class="mh-card-desc">'+t.desc+'</div>' +
      '<div class="mh-card-list">' + t.rights.map(function(x){return '<div class="mh-li"><span class="mh-check">✅</span><span>'+x+'</span></div>';}).join('') + '</div>' +
      '<button class="mh-book'+(on?' on':'')+'" onclick="bookTier(\''+tierId+'\')">联系卖家开通</button>' +
    '</div>';
  };
  const cards = Object.keys(PRICING_TIERS).map(rightCard).join('') + '<div class="mh-price-tip">'+MEM_PRICE_DISCLAIMER+'</div>';
  let contactCard = '';
  if(contact){
    let rows = '';
    if(contact.wechat) rows += '<div class="contact-row"><span class="contact-label">微信</span><span class="contact-val mono">'+esc(contact.wechat)+'</span><button class="mini-btn" data-copy="'+esc(contact.wechat)+'" onclick="copyText(this.dataset.copy)">复制</button></div>';
    if(contact.email)  rows += '<div class="contact-row"><span class="contact-label">邮箱</span><span class="contact-val mono">'+esc(contact.email)+'</span><button class="mini-btn" data-copy="'+esc(contact.email)+'"  onclick="copyText(this.dataset.copy)">复制</button></div>';
    if(rows) contactCard = '<div class="card contact-card"><div class="card-title">联系卖家</div><div class="cc-tip">续费或定制功能时通过以下方式联系：</div>'+rows+'</div>';
  }
  $('#content').innerHTML = hero + cards + contactCard;
}
function setMemTier(t){
  memTier = t;
  // 更新 toggle 状态与权益卡高亮
  try{
    const btns = document.querySelectorAll('#mhToggle .mt-btn');
    btns.forEach(function(b){ b.classList.toggle('on', b.textContent===(t==='standard'?'标准版':'尊享版')); });
    const c1 = document.getElementById('mhCardstandard');
    const c2 = document.getElementById('mhCardpremium');
    if(c1) c1.classList.toggle('on', t==='standard');
    if(c2) c2.classList.toggle('on', t==='premium');
  }catch(e){}
}
function bookTier(tier){
  Modal.open('📩 预约开通'+(tier==='standard'?'标准版':'尊享版'), `
    <div style="text-align:center;padding:6px 0 2px">
      <div style="font-size:42px;margin-bottom:8px">📩</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">联系卖家开通</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.8;margin-bottom:6px">平台暂不在线开通，请通过下方方式联系卖家获取最新报价与开通方式。<br>开通后激活码会发送给你，输入即可解锁。</p>
    </div>
    <div class="cc-tip" style="margin-bottom:12px">联系卖家获取开通方式：</div>
    <button class="btn btn-ghost btn-block" onclick="copySellerContact()">📋 复制卖家联系方式</button>`);
}
function copySellerContact(){
  const c = getContactInfo();
  if(!c){ Toast('暂未配置联系方式'); return; }
  const txt = [c.wechat&&('微信：'+c.wechat), c.email&&('邮箱：'+c.email)].filter(Boolean).join('\n');
  copyText(null, txt);
}
function openPayUrl(){
  Modal.open('👑 续费 / 升级', `
    <div style="font-size:13px;color:var(--text2);margin-bottom:14px">请在下方输入你的续费/购买链接，保存后按钮将直接跳转。也可以联系你的运营顾问获取专属优惠。</div>
    <div class="form-group"><label class="label">支付/购买链接</label><input id="payUrlInput" placeholder="https://..."></div>
    <button class="btn btn-red btn-block" onclick="savePayUrl()">保存链接</button>
    <div style="font-size:11px;color:var(--text3);margin-top:10px">未配置时，可联系管理员线下完成续费。</div>`);
}
function savePayUrl(){
  const v=$('#payUrlInput').value.trim();
  if(!v){Toast('请输入链接');return;}
  localStorage.setItem('xhs_pay_url', v);
  Modal.close(); renderMembership(); Toast('续费链接已配置 ✅');
}


/* ================= V5.1 目标与成长 ================= */
function updateStreak(){
  const sk = Store.data.streak || (Store.data.streak = {count:0, lastDate:'', best:0});
  const today = todayStr();
  if(sk.lastDate === today) return;
  // V6.50 修复：lastDate 为空但 count>0 表示这是历史连续天数（老用户数据），
  // 视为今天刚确认一次，不要粗暴清零
  if(!sk.lastDate && sk.count > 0){ sk.lastDate = today; Store.save(); return; }
  const y = new Date(); y.setDate(y.getDate()-1);
  if(sk.lastDate === fmtDate(y)) sk.count += 1;
  else if(sk.lastDate) sk.count = 1; // 真断了才重置
  sk.lastDate = today;
  if(sk.count > sk.best) sk.best = sk.count;
  Store.save();
}

/* ================= 变现管理（尊享版） ================= */
function renderMoney(){
  if(!proGuard('变现管理')){ navigate('dashboard'); return; }
  const d = Store.data; const m = d.money;
  const monthIncome = m.records.reduce((a,b)=>a+(+b.income||0),0);
  const myFans = d.analytics.overview.fans;
  const myQuote = (m.quote && m.quote.find(function(q){ var n = parseInt(String(q.fans||'0-0').split('-')[0].replace('k','000').replace('w','0000')); return myFans >= n; })) || (m.quote&&m.quote[0]) || {price:'面议', fans:'-', desc:''};
  var rows = m.records.map(function(r){ return '<div class="lib-item" style="cursor:default"><div class="draft-thumb" style="background:var(--soft-green)">¥</div><div style="flex:1"><div style="font-weight:600;font-size:13px">'+esc(r.title)+'</div><div style="font-size:11px;color:var(--text3)">'+esc(r.product)+' · '+r.date+'</div></div><div style="font-size:15px;font-weight:800;color:var(--red)">+¥'+(+r.income||0)+'</div><button class="icon-btn" onclick="delIncome(this.dataset.id)" data-id="'+r.id+'">🗑️</button></div>'; }).join('');
  var quotes = m.quote.map(function(q){ return '<div class="source-row"><span class="source-name">'+q.fans+' 粉</span><div class="source-bar" style="height:auto"><span style="font-size:11.5px;color:var(--text2)">'+q.note+'</span></div><span class="source-pct" style="width:auto;font-weight:700;color:'+(q===myQuote?'var(--red)':'var(--text)')+'">'+q.price+'</span></div>'; }).join('');
  $('#content').innerHTML =
  '<div class="section-head"><h2>💰 变现管理</h2><span class="pill" style="background:var(--soft-red);color:var(--red)">AI 智能</span></div>' +
  '<div class="card" style="border-color:rgba(191,90,242,.3);margin-bottom:14px">' +
    '<div class="card-title">🤖 AI 变现方案库 <span class="pill" style="font-size:9px;padding:1px 6px;vertical-align:middle;background:var(--soft-red);color:var(--red)">AI 智能</span></div>' +
    '<p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">输入你的账号赛道，AI 一键生成完整变现路径：<b>广告报价参考 / 带货选品方向 / 私域引流方案 / 成交转化话术</b>，副业博主不再为「怎么变现」发愁。</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="aiMoneyTrack" placeholder="如：美妆护肤 / 职场干货 / 母婴育儿…" style="flex:1;min-width:200px"><button class="btn btn-red btn-sm" onclick="aiMoneyPlan()">✨ 生成变现方案</button></div>' +
    '<div id="aiMoneyOut" style="margin-top:12px"></div>' +
  '</div>' +
  '<div class="grid grid-2" style="margin-bottom:14px">' +
    '<div class="card" style="border-color:rgba(191,90,242,.3)">' +
      '<div class="card-title">💰 AI 报价生成器 <span class="pill" style="font-size:9px;padding:1px 6px;vertical-align:middle;background:var(--soft-red);color:var(--red)">AI 智能</span></div>' +
      '<p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">输入你的粉丝数 / 互动率 / 赛道，AI 自动生成<b>完整商业报价单</b>（图文/视频/合集报价 + 怎么谈下第一个单）。</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="aiQuoteInput" placeholder="如：1.2w粉 / 互动率8% / 美妆赛道" style="flex:1;min-width:200px"><button class="btn btn-red btn-sm" onclick="aiQuoteGen()">💰 生成报价单</button></div>' +
      '<div id="aiQuoteOut" style="margin-top:12px"></div>' +
    '</div>' +
    '<div class="card" style="border-color:rgba(10,132,255,.3)">' +
      '<div class="card-title">🩺 变现体检 <span class="pill" style="font-size:9px;padding:1px 6px;vertical-align:middle;background:var(--soft-red);color:var(--red)">AI 智能</span></div>' +
      '<p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">基于你的真实数据一键体检：<b>变现潜力评分 + 三大增长杠杆 + 30 天行动清单</b>。</p>' +
      '<button class="btn btn-red btn-sm" onclick="aiMoneyCheck()">🩺 开始体检</button>' +
      '<div id="aiCheckOut" style="margin-top:12px"></div>' +
    '</div>' +
  '</div>' +
  '<div class="grid grid-3" style="margin-bottom:14px">' +
    '<div class="metric-card"><div class="m-label">累计收益</div><div class="m-row"><span class="m-num">¥'+monthIncome+'</span></div></div>' +
    '<div class="metric-card"><div class="m-label">带货/合作笔记</div><div class="m-row"><span class="m-num">'+m.records.length+'</span></div></div>' +
    '<div class="metric-card"><div class="m-label">单篇最高</div><div class="m-row"><span class="m-num">¥'+Math.max.apply(null,m.records.map(function(r){return (+r.income||0);}).concat([0]))+'</span></div></div>' +
  '</div>' +
  '<div class="grid grid-2">' +
    '<div class="card"><div class="card-title">🧾 收益记录 <span class="more" onclick="openIncomeAdd()">＋ 记录</span></div>' + (m.records.length?rows:'<div class="empty">记录第一笔收益，见证成长</div>') + '</div>' +
    '<div>' +
      '<div class="card"><div class="card-title">📊 品牌报价参考</div><div style="font-size:12px;color:var(--text2);margin-bottom:10px">你的粉丝 '+fmtNum(myFans)+'，参考报价：<b>'+myQuote.price+'</b></div>'+quotes+'</div>' +
      '<div class="card"><div class="card-title">💡 变现建议</div>'+m.tips.map(function(t){return '<div style="font-size:12.5px;color:var(--text2);padding:8px 0;border-bottom:1px solid var(--line);line-height:1.7">'+t+'</div>';}).join('')+'</div>' +
    '</div>' +
  '</div>';
}
function openIncomeAdd(){
  Modal.open('🧾 记录收益', '<div class="form-group"><label class="label">笔记标题</label><input id="incTitle"></div><div class="form-group"><label class="label">收益来源</label><input id="incProduct" placeholder="如：粉底液·橱窗 / 品牌合作"></div><div class="form-group"><label class="label">收益金额（¥）</label><input id="incIncome" type="number"></div><button class="btn btn-red btn-block" onclick="doIncomeAdd()">保存</button>');
}
function doIncomeAdd(){
  var title=$('#incTitle').value.trim(); if(!title){Toast('请输入标题');return;}
  Store.data.money.records.unshift({id:uid(), title:title, product:$('#incProduct').value.trim()||'其他', income:+$('#incIncome').value||0, date:todayStr().slice(5)});
  Store.save(); Modal.close(); renderMoney(); Toast('已记录 ✅');
}
function delIncome(id){ Store.data.money.records=Store.data.money.records.filter(function(r){return r.id!==id;}); Store.save(); renderMoney(); Toast('已删除'); }

/* ================= AI 变现方案库（尊享版） ================= */
let aiMoneyResult = '';
async function aiMoneyPlan(){
  const track = $('#aiMoneyTrack').value.trim();
  if(!track){ Toast('请输入你的账号赛道'); return; }
  if(!premiumGuard('AI 变现方案')) return;
  const out = $('#aiMoneyOut');
  out.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2)"><span class="ai-loading">🤖</span> AI 正在为你规划变现路径…（约 15-30 秒）</div>';
  const prompt = '我是小红书「'+track+'」赛道的博主，请为我生成一套完整的变现路径规划。\n\n输出格式（严格按此结构）：\n【1. 变现定位】一句话说明这个赛道最适合的变现组合。\n【2. 广告报价参考】按粉丝量分档给出报价区间（5000/1w/5w/10w 粉），并说明怎么拿到第一个商单。\n【3. 带货选品方向】给出 5 个与该赛道匹配的选品方向及理由。\n【4. 私域引流方案】给出 3 条可落地的引流话术/钩子（规避平台违规风险）。\n【5. 成交转化话术】给出 3 条私域成交话术模板。\n\n要求：具体、可执行、贴合 2026 年小红书环境。';
  const r = await aiAsk(prompt, '你是资深小红书商业变现顾问，服务过大量副业博主，输出务必具体可执行。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  aiMoneyResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制方案</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveAiMoney()">📥 存入灵感笔记</button>
    </div>`;
}
function saveAiMoney(){
  if(!aiMoneyResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'AI 变现方案 · '+( $('#aiMoneyTrack') ? $('#aiMoneyTrack').value.trim() : '')||'变现方案', content:aiMoneyResult, tag:'变现', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* ================= AI 报价生成器（尊享版） ================= */
let aiQuoteResult = '';
async function aiQuoteGen(){
  const input = $('#aiQuoteInput').value.trim();
  if(!input){ Toast('请填写粉丝数/互动率/赛道，如：1.2w粉 / 8% / 美妆'); return; }
  if(!premiumGuard('AI 报价生成器')) return;
  const out = $('#aiQuoteOut');
  out.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2)"><span class="ai-loading">🤖</span> AI 正在生成你的报价单…（约 15-30 秒）</div>';
  const prompt = '我是小红书博主，我的情况是：「'+input+'」。请为我生成一份完整、可直接发给品牌的商业报价单。\n\n输出格式（严格按此结构）：\n【1. 报价单】表格形式给出图文合作 / 视频合作 / 合集打包 三档报价（含具体金额区间），并说明档位包含的服务（如：改稿次数、传播承诺等）。\n【2. 报价依据】一句话说明这个报价怎么来的（参考粉丝量级与互动率）。\n【3. 谈判要点】3 条和品牌沟通时的加分话术/谈判技巧。\n【4. 第一个单怎么拿】给出 3 个主动找品牌合作的具体动作（如去哪接单、怎么自我介绍）。\n\n要求：金额合理、贴合 2026 年小红书行情、可直接使用。';
  const r = await aiAsk(prompt, '你是小红书商业报价顾问，非常清楚各粉丝量级的真实成交价，报价要合理且敢开口。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  aiQuoteResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:380px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制报价单</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveAiQuote()">📥 存入灵感笔记</button>
    </div>`;
}
function saveAiQuote(){
  if(!aiQuoteResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'AI 报价单 · '+(($('#aiQuoteInput')||{}).value||'').slice(0,12)||'报价单', content:aiQuoteResult, tag:'变现', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* ================= AI 变现体检（尊享版） ================= */
let aiCheckResult = '';
async function aiMoneyCheck(){
  if(!premiumGuard('AI 变现体检')) return;
  const d = Store.data;
  const ov = d.analytics.overview || {};
  const income = d.money.records.reduce((a,b)=>a+(+b.income||0),0);
  const contents = d.contents.length;
  const best = d.analytics.notes.slice().sort((a,b)=>b.score-a.score)[0];
  const ctx = '我的账号数据：粉丝 '+ov.fans+'，近7天阅读 '+ov.views7d+'、点赞 '+ov.likes7d+'、收藏 '+ov.collects7d+'、评论 '+ov.comments7d+'、互动率 '+ov.interaction+'%；内容库 '+contents+' 篇；累计变现 ¥'+income+(best?'；表现最好笔记「'+best.title+'」点赞 '+best.likes:'');
  const out = $('#aiCheckOut');
  out.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2)"><span class="ai-loading">🤖</span> AI 正在基于你的数据体检…（约 15-30 秒）</div>';
  const prompt = '你是一个小红书变现教练。以下是博主提供的数据：「'+ctx+'」\n\n请输出变现体检报告（严格按此结构）：\n【1. 变现潜力评分】满分 100 分，一句话点评。\n【2. 当前变现状态】分析现状（粉丝/互动/内容/收益是否匹配）。\n【3. 三大增长杠杆】按优先级给出 3 个最能提升变现的动作（具体、可执行）。\n【4. 未来 30 天行动清单】5 条带节奏的行动计划（第几天做什么）。\n\n要求：具体可执行、贴合小红书平台、不空泛。';
  const r = await aiAsk(prompt, '你是资深小红书变现教练，服务过大量中小博主，报告要犀利、直接、可执行。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:12.5px">'+r.msg+'</div>'; return; }
  aiCheckResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:380px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制报告</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveAiCheck()">📥 存入灵感笔记</button>
    </div>`;
}
function saveAiCheck(){
  if(!aiCheckResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'变现体检报告 · '+todayStr(), content:aiCheckResult, tag:'变现', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* ================= AI 运营助理（规则对话，基于用户数据） ================= */
function openSidekick(){
  // V6.30 Agent 化：欢迎语基于真实数据给出「今天 3 件事」+ 可执行按钮
  let welcome = '你好，我是你的 AI 运营助理 🤖<br>已连接你的<b>工作台实时数据</b>，不只是聊天——<b>我能直接帮你动手</b>：生成笔记、安排排期、分析数据。<br><br>';
  try{
    const d=Store.data;
    const pending=d.schedule.filter(s=>s.status==='ready').length;
    const published=d.contents.filter(c=>c.status==='published').length;
    const tips=[];
    if(published===0) tips.push('📝 今天还没发过笔记，我帮你生成 1 篇 →');
    if(pending>0) tips.push('📅 有 <b>'+pending+'</b> 条排期今天到期，我帮你安排 →');
    tips.push('🔍 想知道账号哪里可以提升？我帮你分析 →');
    welcome += '🔥 <b>今天建议先做：</b><br>' + tips.slice(0,3).map(function(t,i){return '<span style="display:block;margin:3px 0">'+(i+1)+'. '+t+'</span>';}).join('');
  }catch(e){ welcome += '可以问我：今天写什么 / 数据为什么下滑 / 怎么变现 / 安排下周计划。'; }
  Modal.open('Crazy Friday. AI 运营助理', '<div class="sk-chat" id="skChat"><div class="sk-msg sk-ai">'+welcome+'</div></div>' +
    '<div class="sk-actions" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' +
      '<button class="btn btn-red btn-sm" onclick="skAct(\'生成一篇笔记\')">📝 帮我写笔记</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="skAct(\'帮我排下周计划\')">📅 排期</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="skAct(\'分析我的数据\')">📊 分析数据</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="skAct(\'我今天发什么好\')">🎯 今天发什么</button>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:10px"><input id="skInput" placeholder="直接说需求，我来执行…" onkeydown="if(event.key===\'Enter\')skAsk(this.value)"><button class="btn btn-red" onclick="skAsk(document.getElementById(\'skInput\').value)">发送</button></div>' +
    '<div style="font-size:10px;color:var(--text3);margin-top:8px">✅ AI 已就绪 · 数据实时来自你的工作台 · 回答后可直接点按钮执行</div>');
  setTimeout(function(){ var el=$('#skInput'); if(el) el.focus(); }, 80);
}
function skAct(q){ skAsk(q); }
/* ================= V6.9 AI 运营助理（真 AI 优先 + 规则降级） ================= */
let skHistory = [];
function skAsk(q){
  q=(q||'').trim(); if(!q) return;
  var box=$('#skChat'); if(!box) return;
  box.insertAdjacentHTML('beforeend','<div class="sk-msg sk-me">'+esc(q)+'</div>');
  var inp=$('#skInput'); if(inp) inp.value='';
  doSkAskAI(q, box);
}
function buildSkContext(){
  try{
    const d=Store.data; const ov=d.analytics.overview||{};
    const best=(d.analytics.notes||[]).slice().sort(function(a,b){return b.score-a.score;})[0];
    const inc=d.money.records.reduce(function(a,b){return a+(+b.income||0);},0);
    const goal=localStorage.getItem('xhs_goal')||'';
    const hot=getDailyReport?getDailyReport():null;
    return '粉丝'+ov.fans+'，互动率'+ov.interaction+'%，近7天阅读'+(ov.views7d||0)+'，累计收益¥'+inc+'，内容'+d.contents.length+'篇'+(best?'，最佳笔记「'+best.title+'」':'')+(goal?'，运营目标：'+goal:'')+(hot?'，今日变现日报已有'+hot.body.rules.length+'条新规':'');
  }catch(e){ return ''; }
}
async function doSkAskAI(q, box){
  box.insertAdjacentHTML('beforeend','<div class="sk-msg sk-ai" id="skTyping"><span class="ai-loading">🤖</span> 思考中…</div>');
  box.scrollTop=box.scrollHeight;
  const typing=document.getElementById('skTyping');
  try{
    const ctx=buildSkContext();
    skHistory.push({role:'user',content:q});
    if(skHistory.length>8) skHistory=skHistory.slice(-8);
    const histTxt=skHistory.slice(0,-1).map(function(m){return (m.role==='user'?'用户说：':'我回答：')+m.content.slice(0,300);}).join('\n');
    const prompt='用户问：'+q+'\n我的工作台实时数据：'+ctx+(histTxt?'\n最近对话：'+histTxt:'');
    const r=await (typeof proAiAsk==='function'?proAiAsk(prompt,'你是「Crazy Friday. 小红书AI运营工作台」的资深运营助手。回答要：具体、可执行、口语化，主动引用用户工作台数据给出个性化建议；不要空话套话；若问题超出能力范围，给出最接近的替代建议。'):null);
    if(r && r.ok){
      if(typing) typing.outerHTML='<div class="sk-msg sk-ai">'+esc(r.text).replace(/\n/g,'<br>')+skActionButtons(q)+'<div style="font-size:10px;color:var(--text4);margin-top:8px;border-top:1px dashed var(--line);padding-top:6px">以上建议基于你的工作台数据由 AI 生成，仅供参考，请以平台官方规则为准</div></div>';
      skHistory.push({role:'assistant',content:r.text});
    } else {
      if(typing) typing.remove();
      // V6.24 不再用本地模板装懂——直连 DeepSeek 失败时诚实提示重试
      box.insertAdjacentHTML('beforeend','<div class="sk-msg sk-ai">😅 AI 服务暂时没接通，请稍等 3 秒再问一次（或点上方「刷新」重试）。<div style="font-size:10px;color:var(--text4);margin-top:6px">提示：网络波动或额度用完都会导致这个提示，一般重试一次即可恢复。</div></div>');
      box.scrollTop=box.scrollHeight;
    }
  }catch(e){ if(typing) typing.remove();
    box.insertAdjacentHTML('beforeend','<div class="sk-msg sk-ai">😅 AI 服务暂时没接通，请稍等 3 秒再问一次。<div style="font-size:10px;color:var(--text4);margin-top:6px">提示：网络波动或额度用完都会导致这个提示，一般重试一次即可恢复。</div></div>');
  }
  box.scrollTop=box.scrollHeight;
}
function fallbackSkAsk(q){
  // V6.24 已不再使用本地模板回复；AI 失败时诚实提示（避免死循环重试）
  var box=$('#skChat'); if(!box) return;
  box.insertAdjacentHTML('beforeend','<div class="sk-msg sk-ai">😅 AI 服务暂时没接通，请稍等几秒再问一次。<div style="font-size:10px;color:var(--text4);margin-top:6px">提示：网络波动或额度用完都会导致这个提示，一般重试一次即可恢复。</div></div>');
  box.scrollTop=box.scrollHeight;
}
/* V6.30 Agent 化：根据用户提问意图，在 AI 回答下追加「可执行动作」按钮 */
function skActionButtons(q){
  const btns = [];
  const k = q || '';
  const kw = k.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g,' ').trim();
  const escapeJs = s => String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');
  if(/写|生成|创作|标题|文案|笔记|发什么|选题|灵感/.test(k) && /篇|笔记|内容|选题|标题|文案|什么/.test(k)){
    btns.push(['📝 按建议生成一篇笔记', "skAsk('请帮我围绕『" + escapeJs(kw.slice(0,12)) + "』写一篇可以直接发的小红书笔记，含标题正文标签')"]);
  }
  if(/排期|发布|安排|计划|什么时候/.test(k)){
    btns.push(['📅 打开排期安排发布', "navigate('schedule')"]);
  }
  if(/数据|分析|复盘|下滑|涨粉|为什么/.test(k)){
    btns.push(['📊 去数据复盘页', "navigate('analytics')"]);
  }
  if(/诊断|健康|权重|限流|账号/.test(k)){
    btns.push(['🏥 去账号诊断', "navigate('diagnosis')"]);
  }
  if(/变现|赚钱|报价|商单|广告|收入/.test(k)){
    btns.push(['💰 去变现管理', "navigate('money')"]);
  }
  if(/改写|去AI|润色|口语/.test(k)){
    btns.push(['✍️ 打开去 AI 味改写', "openDeAIfy()"]);
  }
  if(!btns.length) btns.push(['🎯 生成 10 个选题给我', "skAsk('根据我的账号情况，给我 10 个适合我的选题方向')"]);
  return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)">' +
    btns.map(b=>'<button class="btn '+(b[0].indexOf('📝')===0?'btn-red':'btn-ghost')+' btn-sm" onclick="'+b[1]+'">'+b[0]+'</button>').join('') +
  '</div>';
}

/* ================= 一键周报 ================= */
function openWeeklyReport(){
  var d=Store.data, w=d.analytics.overview;
  var notes=d.analytics.notes;
  var sorted=notes.slice().sort(function(a,b){return b.score-a.score;});
  var best=sorted[0], worst=sorted[notes.length-1];
  var income=d.money.records.reduce(function(a,b){return a+(+b.income||0);},0);
  var published=d.contents.filter(function(c){return c.status==='published';}).length;
  var collectRate=w.views7d>0?Math.round(w.collects7d/w.views7d*100):0;
  // V6.4 自动周报历史（每周一自动生成并存档）
  var hist='';
  if(d.weeklyReports && d.weeklyReports.length){
    hist='<div style="font-size:12px;font-weight:700;color:var(--text3);margin:2px 0 8px;letter-spacing:.3px">📂 自动周报历史（每周一自动生成）</div>'+
      d.weeklyReports.slice(0,5).map(function(r){
        return '<div class="hist-item" style="cursor:pointer" onclick="viewWeeklyReport(\''+r.id+')"><span class="h-title">'+r.range+'</span><span class="pill red" style="flex-shrink:0">发布 '+r.stat.published+'</span><span class="pill green" style="flex-shrink:0">¥'+r.stat.income+'</span><span class="h-meta">'+r.date+'</span></div>';
      }).join('')+'<div style="border-top:1px solid var(--line);margin:10px 0 14px"></div>';
  }
  Modal.open('📊 运营周报', '<div style="font-size:12px;color:var(--text3);text-align:center;margin-bottom:4px">Crazy Friday. 运营周报</div>'+hist+'<div style="font-size:20px;font-weight:800;text-align:center;margin-bottom:14px">本周运营小结</div><div class="summary-grid" style="grid-template-columns:repeat(2,1fr)">'+[
    ['本周发布',published+' 篇'],['本周曝光',fmtNum(w.views7d)],['本周互动',fmtNum(w.likes7d+w.collects7d)],['本周收益','¥'+income]
  ].map(function(it){return '<div class="summary-item"><div class="si-label">'+it[0]+'</div><div class="si-row"><span class="si-num">'+it[1]+'</span></div></div>';}).join('')+'</div><div style="font-size:13px;font-weight:700;margin:14px 0 8px">📌 亮点</div><div style="font-size:12.5px;color:var(--text2);line-height:1.9">'+(best?'· <b>'+esc(best.title)+'</b> 表现最佳（爆款分 '+best.score+'）<br>':'· 还没有内容数据，先录入几篇<br>')+(worst?'· <b>'+esc(worst.title)+'</b> 需要优化，建议对照爆款拆解调整<br>':'')+'· 收藏率 '+collectRate+'%，'+(w.collects7d>w.likes7d?'内容实用性强，多出清单/教程型':'互动正常')+'</div><div style="font-size:13px;font-weight:700;margin:14px 0 8px">🚀 下周建议</div><div style="font-size:12.5px;color:var(--text2);line-height:2">① '+(best?'继续做「'+esc(best.title.slice(0,12))+'…」这类内容':'开始稳定发布，形成固定栏目')+'<br>② 固定周五晚 8 点发布核心内容<br>③ '+(income>0?'记录收益，向本月目标冲刺':'尝试 1 篇带货笔记，打开变现')+'</div><div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-ghost" style="flex:1" onclick="copyWeeklyReport()">📋 复制周报</button><button class="btn btn-red" style="flex:1" onclick="genReportImage()">🖼️ 生成分享图</button></div><canvas id="reportCanvas" style="display:none"></canvas>', true);
}
let weeklyReportTipsCache = '';
function viewWeeklyReport(id){
  var r=Store.data.weeklyReports.find(function(x){return x.id===id;}); if(!r) return;
  var s=r.stat;
  var cells=[['发布',s.published],['阅读',fmtNum(s.views)],['点赞',s.likes],['收藏',s.collects],['评论',s.comments],['收益','¥'+s.income]].map(function(x){
    return '<div style="background:var(--line2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:16px;font-weight:800;color:var(--red)">'+x[1]+'</div><div style="font-size:10px;color:var(--text3)">'+x[0]+'</div></div>';
  }).join('');
  weeklyReportTipsCache = r.tips.join('\n');
  Modal.open('📊 自动周报 · '+r.range, '<div style="font-size:12px;color:var(--text3);margin-bottom:10px">自动生成于 '+r.date+' · 每周一打开工作台自动产出</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">'+cells+'</div><div style="font-size:12.5px;font-weight:700;margin-bottom:6px">🤖 运营建议</div><div style="font-size:12.5px;color:var(--text2);line-height:1.8">'+r.tips.map(function(t){return '<div style="padding:6px 0;border-bottom:1px solid var(--line)">• '+t+'</div>';}).join('')+'</div><button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="copyWeeklyTips()">📋 复制建议</button>');
}
function copyWeeklyTips(){ if(weeklyReportTipsCache) copyText(null, weeklyReportTipsCache); }
function copyWeeklyReport(){
  var d=Store.data, w=d.analytics.overview;
  var best=d.analytics.notes.slice().sort(function(a,b){return b.score-a.score;})[0];
  var income=d.money.records.reduce(function(a,b){return a+(+b.income||0);},0);
  var txt='【Crazy Friday. 本周运营小结】\n本周发布 '+d.contents.filter(function(c){return c.status==='published';}).length+' 篇 · 曝光 '+fmtNum(w.views7d)+' · 互动 '+fmtNum(w.likes7d+w.collects7d)+' · 收益 ¥'+income+'\n'+(best?'最佳内容：'+best.title+'（爆款分 '+best.score+'）':'——')+'\n下周继续加油，一起成长 ✨';
  copyText(null, txt);
}
function genReportImage(){
  var cv=$('#reportCanvas'); if(!cv) return;
  var d=Store.data, w=d.analytics.overview;
  var best=d.analytics.notes.slice().sort(function(a,b){return b.score-a.score;})[0];
  var income=d.money.records.reduce(function(a,b){return a+(+b.income||0);},0);
  cv.width=720; cv.height=960;
  var ctx=cv.getContext('2d');
  var g=ctx.createLinearGradient(0,0,0,960); g.addColorStop(0,'#0e0e11'); g.addColorStop(1,'#2a1316');
  ctx.fillStyle=g; ctx.fillRect(0,0,720,960);
  ctx.fillStyle='rgba(194,59,82,.2)'; ctx.beginPath(); ctx.arc(620,120,180,0,7); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='700 22px sans-serif'; ctx.fillText('Crazy Friday.',48,80);
  ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='14px sans-serif'; ctx.fillText('本周运营小结',48,108);
  var items=[['本周发布',d.contents.filter(function(c){return c.status==='published';}).length+' 篇'],['本周曝光',fmtNum(w.views7d)],['本周互动',fmtNum(w.likes7d+w.collects7d)],['本周收益','¥'+income]];
  items.forEach(function(it,i){ var x=48+(i%2)*330, y=180+Math.floor(i/2)*150;
    ctx.fillStyle='rgba(255,255,255,.08)'; ctx.strokeStyle='rgba(255,255,255,.12)';
    ctx.beginPath(); ctx.roundRect(x,y,300,120,16); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='13px sans-serif'; ctx.fillText(it[0],x+22,y+38);
    ctx.fillStyle='#ff6b60'; ctx.font='800 34px sans-serif'; ctx.fillText(it[1],x+22,y+90);
  });
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='600 15px sans-serif'; ctx.fillText('最佳内容',48,510);
  ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='13px sans-serif'; ctx.fillText(best?best.title.slice(0,24)+'…':'——',48,540);
  ctx.fillStyle='#ff6b60'; ctx.font='800 20px sans-serif'; ctx.fillText(best?'爆款分 '+best.score:'',48,572);
  ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='12px sans-serif'; ctx.fillText('一个人 + AI，就是一家公司的开始',48,900);
  var url=cv.toDataURL('image/png');
  var a=document.createElement('a'); a.href=url; a.download='CrazyFriday_周报.png'; a.click();
  Toast('分享图已生成 ⬇️');
}

/* ================= 每日变现推荐 ================= */
function genMoneyAdvice(){
  var d=Store.data;
  var today=todayStr(); var seed=0;
  for(var i=0;i<today.length;i++) seed=(seed*31+today.charCodeAt(i))%1000000007;
  var brands=[
    {cat:'美妆',product:'口红/粉底',commission:'15-25%',note:'试用对比型内容转化高'},
    {cat:'穿搭',product:'基础款服饰',commission:'10-20%',note:'"一衣多穿"最带货'},
    {cat:'数码',product:'小家电/配件',commission:'5-15%',note:'横评型笔记收藏率高'},
    {cat:'美食',product:'厨房小工具',commission:'10-20%',note:'"快手菜+神器"组合推荐'},
    {cat:'家居',product:'收纳好物',commission:'15-25%',note:'前后对比图转化最强'},
    {cat:'母婴',product:'辅食工具',commission:'15-25%',note:'真实使用场景更可信'}
  ];
  var hot=(typeof genTrending==='function'?genTrending():[])[0];
  var pick=brands[seed%brands.length];
  var g=d.goals;
  var income=d.money.records.reduce(function(a,b){return a+(+b.income||0);},0);
  return {category:pick.cat, product:pick.product, commission:pick.commission, note:pick.note, hotTopic:hot?hot.title:'', goalProgress:g.monthlyIncome>0?Math.min(100,Math.round(income/g.monthlyIncome*100)):0};
}


/* ================= V5.2 AI 笔记评审 + 敏感词检查 ================= */
function scanSensitive(text){
  const words = Store.data.sensitiveWords || [];
  const hits = [];
  words.forEach(w=>{
    let idx = 0;
    while((idx = text.indexOf(w.w, idx)) !== -1){
      hits.push({w:w.w, tip:w.tip, level:w.level, pos:idx});
      idx += w.w.length;
    }
  });
  return hits;
}
function openNoteReview(title, body){
  Modal.open('🧐 AI 笔记评审', `
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">从标题吸引力、正文结构、敏感词三个维度打分，给出可执行修改建议。</div>
    <div class="form-group"><label class="label">标题</label><input id="rvTitle" value="${esc(title||'')}" placeholder="输入笔记标题"></div>
    <div class="form-group"><label class="label">正文</label><textarea id="rvBody" style="min-height:120px" placeholder="粘贴正文内容…">${esc(body||'')}</textarea></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="fillSampleReview()">填入示例</button>
      <button class="btn btn-red" style="flex:1" onclick="doNoteReview()">🔍 开始评审</button>
    </div>
    <div id="rvResult" style="margin-top:14px"></div>`);
}
function fillSampleReview(){
  const t = $('#rvTitle'); if(t) t.value='用了都说好的美白面膜真的有效吗';
  const b = $('#rvBody'); if(b) b.value='这款面膜是全网第一的美白神器，保证100%有效！用了一周感觉皮肤变白了。想了解更多加微信xxx私我。';
}
function doNoteReview(){
  const title = $('#rvTitle').value.trim();
  const body = $('#rvBody').value.trim();
  if(!title){ Toast('请输入标题'); return; }
  const box = $('#rvResult');
  box.innerHTML = '<div class="loading">AI 正在分析…</div>';
  setTimeout(()=>{
    const tLen = title.length;
    const text = title + '\n' + body;
    const hits = scanSensitive(text);
    let score = 0, issues = [];
    // 1. 标题（40）
    let ts = 0;
    if(tLen>=8 && tLen<=22){ ts+=15; } else { ts+= tLen>22?6:8; issues.push('标题长度 '+tLen+' 字'+(tLen>22?'，偏长建议≤22字':'，偏短建议≥8字')); }
    if(/\d/.test(title)){ ts+=10; } else { issues.push('标题缺少数字（如「3个/5步」），点击率会下降'); }
    if(/[？?!！]|避坑|实测|亲测|攻略|合集|公式|秘籍|真相|后悔/.test(title)){ ts+=10; } else { issues.push('标题缺少悬念/情绪钩子，可加问句或「避坑/实测」类词'); }
    if(title.length>=4){ ts+=5; }
    score += ts;
    // 2. 结构（30）
    let ss = 0;
    const hook = /(我|自己|亲测|真的|竟然|发现|被坑|后悔|朋友|同事|第一次|终于)/.test(body.slice(0,60));
    if(hook){ ss+=8; } else { issues.push('开头 60 字缺少个人视角/痛点钩子，建议第一句就讲自己的经历或问题'); }
    const hasBreak = /(\n|✅|✨|【|①|1\.|💡)/.test(body);
    if(hasBreak){ ss+=8; } else { issues.push('正文没有分段/小标题，建议用序号或 emoji 分割，提升可读性'); }
    if(/我|自己/.test(body)){ ss+=7; } else { issues.push('正文缺少真实体验感，加入个人使用感受更能打动人'); }
    if(/(关注|收藏|评论|留言|问我|点个赞)/.test(body)){ ss+=7; } else { issues.push('结尾缺少 CTA，建议加一句引导互动（收藏/评论/关注）'); }
    score += ss;
    // 3. 标签（10）
    const tags = (body.match(/#[^\s#]+/g)||[]);
    let tg = 0;
    if(tags.length>=2 && tags.length<=6){ tg = 10; }
    else if(tags.length>6){ tg = 5; issues.push('话题标签 '+tags.length+' 个偏多，建议 2-6 个'); }
    else { tg = 4; issues.push('话题标签 '+tags.length+' 个偏少，建议 3-5 个提升曝光'); }
    score += tg;
    // 4. 敏感词（20 起扣）
    let sw = 20;
    const bad = hits.filter(h=>h.level===2).length;
    const mild = hits.filter(h=>h.level===1).length;
    sw = Math.max(0, sw - bad*5 - mild*2);
    if(bad||mild) issues.push('检测到 '+(bad+mild)+' 个敏感词（严重 '+bad+' / 提醒 '+mild+'），详情见下方列表');
    score += sw;
    score = Math.max(5, Math.min(100, score));
    const level = score>=90?'🏆 优秀':score>=75?'👍 良好':score>=60?'⚠️ 及格':'❌ 建议修改';
    const lvColor = score>=90?'var(--green)':score>=75?'var(--blue)':score>=60?'var(--orange)':'var(--red)';
    let hitHtml = '';
    if(hits.length){
      hitHtml = `<div style="margin-top:12px;padding:10px 12px;background:var(--soft-red);border:1px solid rgba(194,59,82,.2);border-radius:10px">
        <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px">🚨 敏感词提醒（${hits.length} 处）</div>
        ${hits.map(h=>`<div style="font-size:12px;color:var(--text2);padding:3px 0;line-height:1.6"><span style="color:var(--red);font-weight:700">「${h.w}」</span> ${h.tip}${h.level===2?' <span class="pill red" style="font-size:9px;padding:1px 6px">高风险</span>':''}</div>`).join('')}
        <div style="font-size:11px;color:var(--text3);margin-top:6px">提示：含「加微信/二维码/淘宝搜」等词有封号风险，请立即删除。</div>
      </div>`;
    }
    box.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--line2);border-radius:12px">
        <div style="text-align:center">
          <div style="font-size:34px;font-weight:800;letter-spacing:-1px;color:${lvColor}">${score}</div>
          <div style="font-size:11px;color:var(--text3)">综合评分</div>
        </div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:800">${level}</div>
          <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
            <span class="pill ${ts>=30?'green':ts>=20?'orange':'red'}">标题 ${ts}/40</span>
            <span class="pill ${ss>=24?'green':ss>=16?'orange':'red'}">结构 ${ss}/30</span>
            <span class="pill ${tg>=8?'green':tg>=6?'orange':'red'}">标签 ${tg}/10</span>
            <span class="pill ${sw>=16?'green':sw>=10?'orange':'red'}">安全 ${sw}/20</span>
          </div>
        </div>
      </div>
      ${hits.length?hitHtml:''}
      ${issues.length?`<div style="margin-top:10px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">📋 优化建议</div>${issues.map(i=>`<div style="font-size:12.5px;color:var(--text2);padding:5px 0;line-height:1.7">· ${i}</div>`).join('')}</div>`:''}
      <button class="btn btn-red btn-block" style="margin-top:12px" onclick="copyReviewResult()">📋 复制评审结果</button>`;
    Store.data.history.unshift({id:uid(), title:'笔记评审：'+title.slice(0,12), type:'评审', time:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})});
    Store.save();
  }, 600);
}
function copyReviewResult(){
  const box = $('#rvResult');
  copyText(null, box.innerText);
}

/* ================= V5.2 数据粘贴快速导入 ================= */
/* ================= V6.31 小红书链接识别（免费数据接入） ================= */
function openDataPaste(){
  if(!proGuard('数据导入')) return;
  Modal.open('📥 数据接入中心', `
    <div style="font-size:12px;color:var(--text3);margin-bottom:8px;line-height:1.7"><b style="color:var(--red)">方式一：粘贴链接自动识别账号</b>（发一个链接，自动识别小红书账号）</div>
    <div style="display:flex;gap:8px;margin-bottom:6px">
      <input id="xhLinkInput" placeholder="粘贴小红书主页 / 笔记分享链接 / 分享文案，如 xhslink.com/xxx" style="flex:1;min-width:0">
      <button class="btn btn-red btn-sm" style="flex-shrink:0" onclick="doXhLinkDetect()">🔗 识别账号</button>
    </div>
    <div id="xhLinkResult" style="margin-bottom:14px"></div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:8px;line-height:1.7"><b style="color:var(--red)">方式二：复制创作中心数据粘贴导入</b>（自动解析入库，支持：账号概览 + 单篇笔记）<br><span style="color:var(--red2)">支持两种格式</span>：① 笔记标题 + 「阅读 12345 点赞 567…」② 4 个数字一行（阅读/赞/藏/评）。</div>
    <textarea id="pasteData" style="min-height:140px" placeholder="示例（可直接复制创作中心数据）：
粉丝 3280
近7天阅读 150000  近7天点赞 9000  近7天收藏 3500

通勤妆容3分钟攻略
阅读 12345  点赞 567  收藏 890  评论 123

平价穿搭合集
阅读 9800
点赞 412
收藏 655
评论 98"></textarea>
    <button class="btn btn-red btn-block" onclick="doPasteImport()">🚀 智能解析并导入</button>
    <div id="pasteResult" style="margin-top:12px"></div>
    <div id="importHistory" style="margin-top:6px"></div>
    <div style="font-size:10.5px;color:var(--text4);margin-top:10px;line-height:1.7">💡 数据只存在你本机 · 链接识别全自动 · 粘贴解析全自动 · 导入后自动更新复盘图表，可一键生成周报</div>`);
  // V6.31.1 优化：链接输入框自动 focus，用户打开即可直接粘贴链接
  setTimeout(()=>{ try{ const el = document.getElementById('xhLinkInput'); if(el) el.focus(); }catch(e){} }, 80);
  renderImportHistory();
}
/* V6.31 链接识别：调服务端 /xh-proxy 免费识别小红书账号 */
function doXhLinkDetect(){
  const input = $('#xhLinkInput'); if(!input) return;
  const link = input.value.trim();
  if(!link){ Toast('请先粘贴小红书链接或分享文案'); return; }
  const box = $('#xhLinkResult');
  if(!box) return;
  box.innerHTML = '<div class="loading">正在识别账号…（需要几秒，小红书偶尔会慢）</div>';
  const base = cfCloudBase(); if(!base){
    box.innerHTML = '<div style="padding:10px 12px;background:var(--soft-red);border:1px solid rgba(194,59,82,.25);border-radius:8px;font-size:12px;color:var(--red)">识别服务暂不可用，请稍后再试。</div>';
    return;
  }
  if(!base){ box.innerHTML = '<div style="padding:10px 12px;background:var(--soft-red);border:1px solid rgba(194,59,82,.25);border-radius:8px;font-size:12px;color:var(--red)">识别服务未配置云端，暂不可用。</div>'; return; }
      fetch(base + '/xh-proxy?url=' + encodeURIComponent(link), { cache:'no-store' })
    .then(r=>r.json())
    .then(j=>{
      if(!j.ok){ box.innerHTML = '<div style="padding:10px 12px;background:var(--soft-red);border:1px solid rgba(194,59,82,.25);border-radius:8px;font-size:12px;color:var(--red);line-height:1.7">⚠️ ' + esc(j.reason || '识别失败') + '</div>'; return; }
      window.__xhDetected = j;
      renderXhDetectResult(box, j);
    })
    .catch(()=>{ box.innerHTML = '<div style="padding:10px 12px;background:var(--soft-red);border:1px solid rgba(194,59,82,.25);border-radius:8px;font-size:12px;color:var(--red)">识别服务不可达，请检查网络后重试。</div>'; });
}
function renderXhDetectResult(box, j){
  const p = j.profile || {};
  const uid = j.uid || '';
  const shortId = uid ? uid.slice(0,10) : (j.noteId ? '笔记 '+j.noteId.slice(0,8) : '');
  const fansTxt = p.fansRaw ? fmtNum(p.fans) + ' 粉' : (p.fans ? fmtNum(p.fans)+' 粉' : '<span style="color:var(--text3)">粉丝数待补齐</span>');
  const html = `
    <div style="padding:12px 14px;background:${j.gotProfile?'var(--soft-green)':'var(--line2)'};border:1px solid ${j.gotProfile?'rgba(52,199,89,.3)':'var(--line)'};border-radius:10px;font-size:13px;line-height:1.8">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div style="width:34px;height:34px;border-radius:50%;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${esc((p.nickname||'?')[0].toUpperCase())}</div>
        <div style="min-width:0;flex:1">
          <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.nickname||'（未识别到昵称）')}</div>
          <div style="font-size:11px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${shortId ? 'ID ' + esc(shortId) : '已识别为小红书账号'} · ${fansTxt}</div>
        </div>
      </div>
      ${p.desc?'<div style="font-size:11.5px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">📝 '+esc(p.desc)+'</div>':''}
      ${p.location?'<div style="font-size:11.5px;color:var(--text3);margin-bottom:4px">📍 '+esc(p.location)+'</div>':''}
      <div style="font-size:11px;color:var(--text3);line-height:1.6;margin-bottom:8px">${esc(j.tip||'')}</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-red btn-sm" style="flex:1" onclick="saveXhDetected()">💾 保存到当前账号</button>
        ${j.homepage?'<a class="btn btn-ghost btn-sm" style="flex:1;text-decoration:none;display:inline-flex;align-items:center;justify-content:center" href="'+esc(j.homepage)+'" target="_blank">↗ 打开主页</a>':''}
      </div>
    </div>`;
  box.innerHTML = html;
}
/* 数据接入历史（链接识别 + 粘贴导入共用） */
function getImportHistory(){
  try{ return JSON.parse(localStorage.getItem('xhs_import_history')||'[]'); }catch(e){ return []; }
}
function addImportHistory(type, title, detail){
  const arr = getImportHistory();
  arr.unshift({t: Date.now(), type, title, detail});
  localStorage.setItem('xhs_import_history', JSON.stringify(arr.slice(0, 10)));
}
function renderImportHistory(){
  const box = $('#importHistory'); if(!box) return;
  const arr = getImportHistory().slice(0, 5);
  if(!arr.length){ box.innerHTML = ''; return; }
  const typeIco = x => x.type==='link' ? '🔗' : '📋';
  const fmt = t => {
    const d = new Date(t);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  box.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--text2);margin:14px 0 8px">🕘 最近接入记录</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${arr.map(x=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--text2)">
        <span>${typeIco(x)}</span>
        <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.title)}</span>
        <span style="color:var(--text3);font-size:11px;flex-shrink:0">${esc(x.detail)} · ${fmt(x.t)}</span>
      </div>`).join('')}
    </div>`;
}
/* 保存识别结果到当前工作区账号（账号管理实质化：昵称/粉丝/简介/主页链接自动入库） */
function saveXhDetected(){
  const det = window.__xhDetected; if(!det){ Toast('请先识别账号'); return; }
  const ws = getWorkspaces();
  const active = getActiveWs();
  const w = ws.find(x=>x.id===active) || ws[0];
  if(!w){ Toast('账号不存在'); return; }
  const p = det.profile || {};
  // V6.31.2 优化：只在没有自定义名称时覆盖，避免用户手动命名的矩阵账号被冲刷
  const isDefaultName = !w.name || w.name === 'Crazy Friday.' || w.name === 'Crazy Friday' || w.name === '默认账号';
  if(p.nickname && isDefaultName){ w.name = p.nickname; w.avatar = p.nickname[0].toUpperCase(); }
  if(p.fans || p.fansRaw) w.fans = p.fans || 0;
  if(p.desc) w.bio = p.desc;
  if(det.homepage) w.link = det.homepage;
  if(det.uid) w.uid = det.uid;
  localStorage.setItem('xhs_workspaces', JSON.stringify(ws));
  if(active==='default' && isDefaultName) localStorage.setItem('xhs_brand', w.name);
  const detail = (p.fans || p.fansRaw) ? fmtNum(p.fans||0)+' 粉' : (det.uid?'已识别 ID':'已保存');
  addImportHistory('link', p.nickname || w.name, detail);
  Modal.close(); Toast('已保存到「'+w.name+'」账号 ✅');
  try{ renderWsList(); if(typeof render==='function') render(); }catch(e){}
}
function doPasteImport(){
  const raw = $('#pasteData').value.trim();
  if(!raw){ Toast('请先粘贴数据'); return; }
  const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  // V6.30 先扫「账号概览」：粉丝/涨粉/近7天等（小红书创作者中心顶部概览）
  const overview = Store.data.analytics.overview || {};
  let ovImported = [];
  lines.forEach(l=>{
    let m;
    if((m = l.match(/粉丝\s*[:：]?\s*([\d,.万]+)/))){ overview.fans = parseCN(m[1]); ovImported.push('粉丝 '+m[1]); }
    if((m = l.match(/近?7天?阅读|近?7日?阅读|7天阅读|阅读.*7天/i)) ){ }
    if((m = l.match(/涨粉\s*[:：]?\s*([+\d,.万]+)/))){ ovImported.push('涨粉 '+m[1]); }
    if((m = l.match(/近7天(阅读|浏览|曝光)?量?\s*[:：]?\s*([\d,.万]+)/))){ overview.views7d = parseCN(m[2]); ovImported.push('近7天阅读 '+m[2]); }
    if((m = l.match(/近7天(点赞|喜欢)\s*[:：]?\s*([\d,.万]+)/))){ overview.likes7d = parseCN(m[2]); ovImported.push('近7天点赞 '+m[2]); }
    if((m = l.match(/近7天(收藏|存起)\s*[:：]?\s*([\d,.万]+)/))){ overview.collects7d = parseCN(m[2]); ovImported.push('近7天收藏 '+m[2]); }
    if((m = l.match(/近7天(评论|留言)\s*[:：]?\s*([\d,.万]+)/))){ overview.comments7d = parseCN(m[2]); ovImported.push('近7天评论 '+m[2]); }
  });
  const entries = []; let cur = null;
  const PICK = [
    [/阅读量?|浏览|曝光|播放/.source, 'views'],
    [/点赞|喜欢/.source, 'likes'],
    [/收藏|存起|保存/.source, 'collects'],
    [/评论|留言/.source, 'comments']
  ];
  lines.forEach(l=>{
    // 1) 裸数字行（4 个数字空格分隔）按 阅读/赞/藏/评 顺序
    const bare = l.match(/^([\d,.万]+)\s+([\d,.万]+)\s+([\d,.万]+)\s+([\d,.万]+)$/);
    if(bare){
      if(!cur){ cur = {title:'未命名笔记', views:0, likes:0, collects:0, comments:0, has:false}; }
      cur.views = parseCN(bare[1]); cur.likes = parseCN(bare[2]);
      cur.collects = parseCN(bare[3]); cur.comments = parseCN(bare[4]);
      cur.has = true;
      return;
    }
    // 2) 标签+数字（兼容"阅读量 9800"）
    let matched = false;
    const nums = {views:0, likes:0, collects:0, comments:0};
    ['views','likes','collects','comments'].forEach((key, idx)=>{
      const re = new RegExp('(阅读|浏览|曝光|播放|点赞|喜欢|收藏|存起|保存|评论|留言)量?\\s*[:：]?\\s*([\\d,.万]+)');
      const m = l.match(re);
      if(m && !nums[key]){ nums[key] = parseCN(m[2]); matched = true; }
    });
    if(matched){
      if(!cur){ cur = {title:'未命名笔记', views:0, likes:0, collects:0, comments:0, has:false}; }
      cur.views = nums.views||cur.views; cur.likes = nums.likes||cur.likes;
      cur.collects = nums.collects||cur.collects; cur.comments = nums.comments||cur.comments;
      cur.has = true;
      return;
    }
    // 3) 标题行
    if(cur && cur.has){ entries.push(cur); }
    cur = {title:l, views:0, likes:0, collects:0, comments:0, has:false};
  });
  if(cur && cur.has) entries.push(cur);
  const valid = entries.filter(n=>n.views>0 || n.likes>0 || n.collects>0);
  if(!valid.length){ Toast('未识别到数据，请检查格式'); return; }
  const box = $('#pasteResult');
  box.innerHTML = '<div class="loading">解析中…</div>';
  setTimeout(()=>{
    valid.forEach(n=>{
      const views = n.views||1;
      const score = Math.min(100, Math.round((n.likes+n.collects+n.comments)/views*600 + n.collects/views*400));
      Store.data.analytics.notes.unshift({id:uid(), title:n.title, emoji:'📌', views, likes:n.likes, collects:n.collects, comments:n.comments, score, cat:aiCat||'美妆'});
      Store.data.contents.unshift({id:uid(), title:n.title, status:'published', date:todayStr(), cat:aiCat||'美妆', views, likes:n.likes, collects:n.collects, comments:n.comments});
    });
    const o=Store.data.analytics.overview;
    valid.forEach(n=>{ o.views7d+=(n.views||1); o.likes7d+=n.likes; o.collects7d+=n.collects; o.comments7d+=n.comments; });
    o.interaction = +((o.likes7d+o.collects7d+o.comments7d)/o.views7d*100).toFixed(1);
    Store.save();
    // V6.31.2：写入导入历史
    const totalViews = valid.reduce((a,b)=>a+(b.views||1), 0);
    addImportHistory('paste', `导入 ${valid.length} 篇笔记`, `阅读 ${fmtNum(totalViews)}`);
    const ovHtml = ovImported.length
      ? '<div style="margin-bottom:8px;color:var(--text3)">📊 账号概览已同步：'+ovImported.map(esc).join(' · ')+'</div>'
      : '';
    box.innerHTML = `<div style="padding:14px;background:var(--soft-green);border:1px solid rgba(52,199,89,.3);border-radius:10px;font-size:13px;color:var(--text2);line-height:1.8">
      ${ovHtml}✅ 成功导入 <b>${valid.length}</b> 篇笔记：<br>${valid.map(n=>`· ${esc(n.title)}（阅读 ${fmtNum(n.views||1)}）`).join('<br>')}<br><br>图表与排行已自动更新。</div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-red btn-sm" style="flex:1" onclick="Modal.close();openWeeklyReport()">📊 一键生成复盘周报</button>
        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="Modal.close();navigate('analytics')">📈 去数据复盘</button>
      </div>`;
    Toast('已导入 '+valid.length+' 篇 ✅');
    renderImportHistory();
  }, 400);
}
function parseCN(s){
  s = String(s).replace(/,/g,'');
  if(s.indexOf('万')!==-1) return Math.round(parseFloat(s.replace('万',''))*10000);
  return parseInt(s)||0;
}

/* ================= V5.2 一键生成一周内容计划 ================= */
async function openWeekPlan(){
  if(!proGuard('一周计划')) return;
  const d = Store.data;
  const profile = d.userProfile || {};
  const cat = profile.accountType || '美妆';
  // 先收集用户真实偏好，让 AI 排期针对性强、不再像模板
  const ownTitles = (d.contents||[]).slice(0,8).map(function(c){return c.title;}).filter(Boolean);
  const hot = (typeof genTrending==='function'?genTrending():[]).slice(0,5).map(function(t){return t.title;});
  const usedCats = catOptions().slice(0,8);
  Modal.open('⚡ AI 一键排一周', `
    <div style="font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.8">基于你的账号类型「${cat}」、近期内容偏好、平台节奏，<b>AI 实时生成</b>未来 7 天的差异化选题（每条都不同主题，不撞稿）。</div>
    <div id="wpResult"><div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text2)"><span class="stream-pulse"></span><span>AI 正在思考未来 7 天的排期策略…</span></div></div>
    <button id="wpConfirmBtn" class="btn btn-ghost btn-block" style="display:none;margin-top:12px;background:var(--brand);color:#fff;border:none;font-weight:800" onclick="doWeekPlan(window.__wpLast||[])">✅ 确认加入排期</button>`);
  try{
    const sys = '你是小红书内容策略专家，专精个人 IP 排期规划。给出 JSON 数组，7 条记录，覆盖未来 7 天每天 1 条；每条必须有差异化选题角度，避开重复主题。';
    const prompt = '为账号类型「'+cat+'」做未来 7 天（从明天 '+fmtDate(new Date(Date.now()+864e5))+' 开始，每天 1 条）的内容排期。\\n' +
      '【用户近期内容标题】'+(ownTitles.join(' / ')||'暂无')+'\\n' +
      '【平台近 24h 热门参考】'+(hot.join(' / ')||'暂无')+'\\n' +
      '【建议品类】'+usedCats.join('、')+'\\n' +
      '输出 JSON 数组（每天 1 条，共 7 条）：\\n' +
      '[{"date":"YYYY-MM-DD","time":"HH:MM","title":"具体选题标题（10-20 字，有吸引力）","form":"教程型/清单型/测评型/种草型/避坑型/经验分享/观点型 之一","reason":"为什么选这个时间（10 字内）"}]\\n' +
      '要求：7 条选题不能同主题，至少覆盖 4 种不同 form；黄金时段 7-9/12-13/18-22 优先；日期按递增顺序。';
    const sb = aiStreamBox($('#wpResult'), '思考 7 天排期');
    const r = await proAiAsk(prompt, sys, sb.update);
    sb.done();
    if(!r.ok){ $('#wpResult').innerHTML = '<div style="color:var(--brand);font-size:13px">'+esc(r.msg||'AI 不可用')+'</div>'; return; }
    let arr = [];
    try{ const m = r.text.match(/\\[[\\s\\S]*\\]/); if(m) arr = JSON.parse(m[0]); else throw 0; }catch(e){ arr = wpFallbackPlan(cat); }
    // 已排期日期跳过
    const usedDates = {}; (d.schedule||[]).forEach(function(s){ if(s.date) usedDates[s.date] = true; });
    arr = arr.filter(function(p){ return !usedDates[p.date]; });
    window.__wpLast = arr;
    const html = '<div style="margin:6px 0 4px;font-size:12px;color:var(--text3)">'+arr.length+' 天差异化排期（已跳过 '+Object.keys(usedDates).length+' 天已有排期）：</div>' +
      arr.map(function(p,i){
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--line2);border-radius:8px;margin-bottom:5px;font-size:12.5px"><b style="flex-shrink:0">'+esc((p.date||'').slice(5))+'</b><span class="pill" style="font-size:10px;flex-shrink:0">'+esc(p.time||'19:00')+'</span><span style="flex:1;min-width:0"><div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(p.title||'待定选题')+'</div><div style="font-size:10.5px;color:var(--text3);margin-top:2px">'+esc(p.form||'种草型')+' · '+esc(p.reason||'')+'</div></span></div>';
      }).join('');
    $('#wpResult').innerHTML = html;
    if(arr.length){ $('#wpConfirmBtn').style.display = 'block'; }
  }catch(e){
    $('#wpResult').innerHTML = '<div style="color:var(--brand);font-size:13px">AI 调用失败：'+esc(e.message||e)+'</div>';
  }
}
function wpFallbackPlan(cat){
  const forms = ['教程型','清单型','测评型','种草型','避坑型','经验分享','观点型'];
  const titles = ['新手入门避坑指南','必备好物清单','真实测评：值得买 vs 别踩雷','一周实操分享','常见误区大盘点','入门到进阶全攻略','小众但好用的发现'];
  const times = ['10:00','12:30','19:30','20:00','21:00','19:00','20:00'];
  const arr = [];
  for(let i=1;i<=7;i++){
    const dt = new Date(); dt.setDate(dt.getDate()+i);
    arr.push({date:fmtDate(dt), time:times[i-1], title:(cat||'通用')+titles[i-1], form:forms[i-1], reason:'模板兜底'});
  }
  return arr;
}
function doWeekPlan(plan){
  if(!plan || !plan.length){ Toast('没有可生成的排期'); Modal.close(); return; }
  const cat = (Store.data.userProfile||{}).accountType || (Store.data.userProfile||{}).cat || '通用';
  plan.forEach(function(p){
    Store.data.schedule.push({id:uid(), date:p.date, time:p.time||'19:00', title:p.title, status:'idea', cat: cat});
  });
  Store.save(); Modal.close(); renderSchedule(); updateBadges();
  Toast('已生成 '+plan.length+' 条 AI 排期 ✅');
}

/* ================= 设置中心 ================= */
function renderSettings(){
  const d = Store.data;
  const count = {topics:d.topicPool.length, contents:d.contents.length, assets:d.assets.length, notes:d.analytics.notes.length, history:d.history.length};
  const brand = localStorage.getItem('xhs_brand')||'';
  $('#content').innerHTML = `
  <div class="section-head"><h2>⚙️ 设置中心</h2></div>
  <div class="grid grid-2">
    <div>
      <div class="card">
        <div class="card-title">🏷️ 品牌定制</div>
        <div class="form-group"><label class="label">工作台名称（显示在侧边栏）</label><input id="brandName" placeholder="小红书AI工作台" value="${esc(brand)}"></div>
        <button class="btn btn-red btn-sm" onclick="saveBrand()">保存品牌名</button>
      </div>
      <div class="card">
        <div class="card-title">🎨 主题色（品牌主色）</div>
        <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:8px">切换按钮、文字强调、会员中心等<b>品牌主色</b>。黑色 = 界面保持白底、元素用黑色，最有高级感；想整体黑底，点右上角 🌙 切深色模式。</p>
        ${themePickerHtml()}
      </div>
      <div class="card">
        <div class="card-title">🤖 AI 能力 <span class="pill green" style="font-size:9px;padding:1px 6px;vertical-align:middle">已内置</span></div>
        <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">AI 爆款复刻 / 变现方案 / 评论区助手 / 创作中心等所有真 AI 功能<b>开箱即用</b>，无需任何配置（每日有免费额度）。想要<b>无限使用 + 更低成本</b>，可自行接入 DeepSeek API Key：</p>
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px;line-height:1.7">
          ① 去 <a href="https://platform.deepseek.com" target="_blank" style="color:var(--red);text-decoration:underline">platform.deepseek.com</a> 注册 → ②「API Keys」创建 Key → ③ 充值几块钱（按量付费，一篇笔记约 1-3 厘钱）→ ④ 把 Key 填到下面。Key 仅保存在你本设备的浏览器中。
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="aiKeyInput" type="password" placeholder="sk-xxxxxxxxxxxxxxxx" style="flex:1;min-width:200px">
          <button class="btn btn-red btn-sm" onclick="saveLocalAiKey()">保存</button>
          <button class="btn btn-ghost btn-sm" onclick="clearLocalAiKey()">清除</button>
        </div>
        <div id="aiKeyStatus" style="font-size:12px;min-height:18px;margin-top:8px"></div>
        <div style="font-size:10.5px;color:var(--text4);margin-top:6px;line-height:1.7">🔒 不填也能用（走卖家统一 AI，每日免费额度）；填了自己的 Key 则不占额度、无限使用。Key 用 base64 存在本设备 localStorage，本后台、卖家、服务器均无法读取。</div>
      </div>
      <div class="card">
        <div class="card-title">👥 工作区 / 多账号 <span class="pill" style="font-size:9px;padding:1px 6px;vertical-align:middle;background:var(--soft-red);color:var(--red)">AI 智能</span></div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:10px">每个运营账号拥有<b>完全独立的数据</b>（选题/草稿/素材/数据复盘互不干扰），切换账号即切换整套数据，无需来回退出登录。</p>
        <div id="wsList" style="margin-bottom:10px"></div>
        <div style="display:flex;gap:8px">
          <input id="wsName" placeholder="新账号名称，如：美妆号 / 生活号" style="flex:1">
          <button class="btn btn-ghost btn-sm" onclick="createWorkspace()">＋ 添加</button>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px">多账号 = 年度会员权益（已合并标准版/尊享版，全部功能开放）。切换后各账号数据独立保存于本设备。</div>
      </div>
      <div class="card">
        <div class="card-title">💾 数据备份 <span class="pill green" style="font-size:9px;padding:1px 6px;vertical-align:middle">云端自动</span></div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px">你的数据<b style="color:var(--green)">自动备份到云端</b>（按你的账号隔离，仅本人可读写）。换设备 / 清缓存 / 重新激活后，打开工作台 <b>自动恢复历史数据</b>，不再从零开始。<b style="color:var(--green)">产品升级 / 更新绝不会丢失你的数据</b>。</p>
        <div id="backupStatus" style="font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.7">检测中…</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="manualCloudBackup()">☁️ 立即备份到云端</button>
          <button class="btn btn-ghost btn-sm" onclick="manualCloudRestore()">☁️ 从云端恢复</button>
          <button class="btn btn-ghost btn-sm" onclick="exportData()">⬇️ 导出数据（JSON）</button>
          <button class="btn btn-ghost btn-sm" onclick="importData()">⬆️ 导入数据</button>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:10px;line-height:1.8">备份内容：选题 / 内容 / 排期 / 数据 / 素材 / 收益等全部工作数据（不含 AI Key 等隐私配置）。云端备份仅用于你的设备恢复，卖家与其他客户均无法查看。</div>
      </div>
    </div>
    <div>
      <div class="card">
        <div class="card-title">📦 数据概览</div>
        <div class="grid grid-2">
          <div class="stat-card" style="box-shadow:none;background:var(--bg)"><div class="s-num">${count.topics}</div><div class="s-label">选题</div></div>
          <div class="stat-card" style="box-shadow:none;background:var(--bg)"><div class="s-num">${count.contents}</div><div class="s-label">内容</div></div>
          <div class="stat-card" style="box-shadow:none;background:var(--bg)"><div class="s-num">${count.assets}</div><div class="s-label">素材</div></div>
          <div class="stat-card" style="box-shadow:none;background:var(--bg)"><div class="s-num">${count.notes}</div><div class="s-label">数据记录</div></div>
        </div>
        <div class="divider"></div>
        <div style="font-size:12.5px;color:var(--text3)">最后保存：${new Date().toLocaleString('zh-CN')}</div>
      </div>
      <div class="card">
        <div class="card-title">🔌 数据源 <span class="pill red" style="font-size:9px;padding:1px 6px;vertical-align:middle">免费接入</span></div>
        <div style="font-size:12.5px;color:var(--text2);line-height:1.8;margin-bottom:8px">
          <b>① 链接识别账号（自动）</b>：粘贴小红书主页 / 笔记分享链接 / 分享文案，自动识别账号昵称、主页、粉丝等公开数据，一键保存到账号资料。<br>
          <b>② 创作中心数据粘贴导入</b>：复制 → 粘贴 → 自动解析入库（账号概览 + 单篇笔记数据）。<br>
          第三方数据平台（新红/千瓜等）为付费网页工具，<b>无开放 API</b>；小红书官方开放平台需企业资质——以上免费方案已覆盖个人博主核心数据需求。
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          <button class="btn btn-ghost btn-sm" onclick="openDataPaste()">📥 去接入数据（链接识别 / 粘贴导入）</button>
        </div>
        <div style="font-size:10.5px;color:var(--text4);margin-top:8px;line-height:1.7">💡 小红书对自动抓取有限制，部分账号粉丝数需粘贴创作中心数据补齐（一键完成）；若未来开通企业级数据 API，本工作台已预留升级位。</div>
      </div>
      <div class="card" style="border-color:rgba(194,59,82,.3)">
        <div class="card-title" style="color:var(--red)">⚠️ 危险操作</div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px">清空后所有选题、内容、素材、数据将重置为初始状态，且不可恢复。建议先导出备份。</p>
        <button class="btn btn-sm" style="background:rgba(194,59,82,.1);color:var(--red)" onclick="resetAll()">🗑️ 清空全部数据</button>
      </div>
      <div class="card">
        <div class="card-title">📱 添加到主屏幕</div>
        <p style="font-size:13px;color:var(--text2)">手机浏览器打开后，在菜单中选择「添加到主屏幕」，即可像 App 一样一键进入工作台。支持离线缓存。</p>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px">ℹ️ 关于产品 <button class="btn btn-ghost" style="font-size:11px;padding:2px 10px;margin-left:6px;float:right" onclick="openShareQr()">📲 分享工作台</button></div>
          <div style="font-size:12.5px;font-weight:600">Crazy Friday.</div>
          <div style="font-size:11px;color:var(--text3);margin:2px 0 10px">小红书AI运营工作台 · WORKBENCH<br>Version ${VERSION.app} · Schema v${VERSION.schema} · ${VERSION.channel}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <button class="btn btn-ghost btn-sm" onclick="checkAppUpdate(true)">🔍 检查更新</button>
            <button class="btn btn-ghost btn-sm" onclick="openLegal()">🛡️ 隐私与条款</button>
          </div>
          <div style="font-size:11.5px;font-weight:700;margin-bottom:4px">更新记录（升级不会丢失你的任何数据）</div>
          ${changelogHtml()}
          <div style="font-size:10.5px;color:var(--text4);margin-top:12px;text-align:center">Powered by Crazy Friday. · ${legalLink()}</div>
        </div>
      </div>
    </div>
  </div>`;
  setTimeout(()=>{ try{ renderWsList(); refreshAiKeyStatus(); refreshBackupStatus(); }catch(e){} }, 30);
}
/* 版本更新记录（精简展示：默认最新 2 条，可展开全部，避免占满屏幕） */
let changelogExpanded = false;
function changelogHtml(){
  const show = changelogExpanded ? CHANGELOG : CHANGELOG.slice(0, 2);
  const html = show.map(function(c, i){
    return '<div class="about-ver">' +
      '<span class="av-badge'+(i===0?' new':'')+'">V'+c.v+'</span>' +
      '<span class="av-text"><b>'+c.date+'</b> · ' + c.items.join(' · ') + '</span>' +
    '</div>';
  }).join('');
  const more = CHANGELOG.length > 2
    ? '<div style="text-align:center;margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="toggleChangelog()">' +
      (changelogExpanded ? '▲ 收起' : ('展开全部 '+CHANGELOG.length+' 条记录 ▼')) + '</button></div>'
    : '';
  return html + more;
}
function toggleChangelog(){
  changelogExpanded = !changelogExpanded;
  renderSettings();
  try{ setTimeout(()=>{ const el=document.querySelector('#content .card:last-child'); if(el) el.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 60); }catch(e){}
}

/* ================= 帮助与常见问题（V5.8） ================= */
const FAQ = [
  {q:'我的数据保存在哪里？会不会被别人看到？', a:'所有数据仅保存在当前设备浏览器中，不经过任何服务器，只有你自己能看到。卖家也无法查看你的内容数据，详见「隐私与数据条款」。'},
  {q:'升级 / 更新版本会不会丢失我的数据？', a:'绝对不会。系统采用数据安全架构：升级时自动备份、自动迁移，只补新字段、不删任何旧数据。每次打开设置中心都能看到「本次升级不影响你的任何数据」的承诺。'},
  {q:'如何备份数据？换设备怎么办？', a:'工作台已开启「云端自动备份」：你的数据会自动同步到云端（按你的账号隔离，仅本人可读写）。换新设备 / 清缓存 / 重新激活后，打开工作台会自动恢复历史数据，不用手动操作。也可以在「设置中心 → 数据备份」点「立即备份」或「从云端恢复」，或导出 JSON 手动保存一份。'},
  {q:'重新激活后数据会不会从零开始？', a:'不会。激活成功后工作台会自动检测云端备份并恢复你的全部历史数据（选题、内容、排期、数据、收益等）。只有本机已有新数据时才不会覆盖（防止误恢复）。'},
  {q:'激活码到期 / 失效了怎么办？', a:'联系你的卖家续费，获取新激活码后输入即可继续使用。到期期间你的数据完整保留（云端备份不删除），续费后打开即自动恢复。'},
  {q:'数据不小心丢了能找回吗？', a:'只要激活过会员并正常使用过，云端就有自动备份。清缓存 / 换设备后重新打开工作台会自动恢复。极端情况下可用「设置中心 → 从云端恢复」手动找回。养成每月看一眼「数据备份」状态即可高枕无忧。'},
  {q:'我的账号安全吗？别人能偷看我的数据吗？', a:'安全。数据只在本机浏览器，无需注册登录，不经过服务器。即使激活码泄露，也只能影响授权状态，无法读取你的内容数据。'},
  {q:'AI 创作功能怎么用？', a:'进入「AI创作中心」→ 选择赛道与风格 → 输入主题 → 点击生成。生成内容可一键存入内容库或加入发布计划。支持小红书文案、标题、脚本等模板。'},
  {q:'使用时长统计是怎么来的？', a:'系统会记录你首次使用、最近使用与累计活跃天数（仅这三个数字，不涉及内容），在会员中心与卖家侧可见，用于核对服务使用情况。'}
];
function renderHelp(){
  $('#content').innerHTML =
  '<div class="section-head"><h2>❓ 帮助与常见问题</h2></div>' +
  // V6.31.1 新增：链接识别账号使用指南
  '<div class="card" style="margin-bottom:12px;border-color:rgba(255,59,48,.25)">' +
    '<div class="card-title">🔗 链接识别账号（V6.31 新增）</div>' +
    '<div style="font-size:13px;color:var(--text2);line-height:1.9">' +
    '用<b>「发一个链接 → 自动识别小红书账号」</b>的方式代替手动输入资料。3 步搞定：<br>' +
    '① 在小红书 App 打开任意一篇笔记或博主主页 → 点击右上角「分享」→ 选择「复制链接」<br>' +
    '② 打开工作台 → 「设置中心」→ 「📥 去接入数据」<br>' +
    '③ 粘贴链接 → 点「🔗 识别账号」→ 自动识别昵称/主页/粉丝/简介 → 一键保存到当前账号<br>' +
    '<span style="color:var(--text3)">💡 粉丝数等数据若被小红书风控挡住，可用「方式二：粘贴创作中心数据」一键补齐。链接识别免费、无需任何 API Key。</span>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="margin-bottom:12px;border-color:rgba(191,90,242,.3)">' +
    '<div class="card-title">🔑 AI Key 开通教程（AI 生图 / 图生文）</div>' +
    '<div style="font-size:13px;color:var(--text2);line-height:1.9">AI 生图和图生文使用你自己的 SiliconFlow 硅基流动 API Key（费用从你的 Key 里扣，不经过卖家）。<b>2 分钟即可开通</b>，遇到问题可联系卖家。</div>' +
    '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-red btn-sm" onclick="openAiKeyGuide()">📖 查看图文教程</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="window.open(\'https://cloud.siliconflow.cn\',\'_blank\')">🌐 打开硅基流动官网</button>' +
    '</div>' +
  '</div>' +
  FAQ.map(function(f, i){
    return '<div class="card" style="margin-bottom:12px">' +
      '<div class="card-title">'+(i+1)+'. '+esc(f.q)+'</div>' +
      '<div style="font-size:13px;color:var(--text2);line-height:1.9;margin-top:6px">'+esc(f.a)+'</div>' +
    '</div>';
  }).join('') +
  '<div style="font-size:11px;color:var(--text3);text-align:center;margin-top:18px;line-height:1.9">没有找到答案？打开「会员中心」联系卖家即可。<br>'+legalLink()+'</div>';
}
function openAiKeyGuide(){
  Modal.open('🔑 AI Key 开通教程（2 分钟）', `
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">以下步骤手机/电脑均可操作，完成后回到工作台填入 Key 即可使用 AI 生图、图生文。</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="rpt-li" style="background:var(--line2);border-radius:10px;padding:12px 14px"><b>第 1 步：打开官网</b><br><span style="color:var(--text2);font-size:13px">手机/电脑浏览器打开 <b style="color:var(--red2)">cloud.siliconflow.cn</b>（硅基流动 SiliconFlow，国内平台）</span></div>
      <div class="rpt-li" style="background:var(--line2);border-radius:10px;padding:12px 14px"><b>第 2 步：注册登录</b><br><span style="color:var(--text2);font-size:13px">右上角「登录」→ 手机号验证码注册，或微信扫码登录（免费）</span></div>
      <div class="rpt-li" style="background:var(--line2);border-radius:10px;padding:12px 14px"><b>第 3 步：充值</b><br><span style="color:var(--text2);font-size:13px">左侧菜单「充值」→ 充 10 元（够生成 30-80 张图 / 多次图生文）</span></div>
      <div class="rpt-li" style="background:var(--line2);border-radius:10px;padding:12px 14px"><b>第 4 步：创建 API Key</b><br><span style="color:var(--text2);font-size:13px">左侧「API 密钥」→ 创建新密钥 → 复制那串 <b style="color:var(--red2)">sk-</b> 开头的字符（仅显示一次）</span></div>
      <div class="rpt-li" style="background:var(--line2);border-radius:10px;padding:12px 14px"><b>第 5 步：填回工作台</b><br><span style="color:var(--text2);font-size:13px">回到工作台「AI 创作中心 → 🎨 AI 生图（或 🔍 图生文）」→ 粘贴 Key → 点「开始生成」</span></div>
    </div>
    <div style="background:var(--soft-green);color:var(--green);font-size:12px;border-radius:10px;padding:10px 14px;margin-top:12px">✅ 之后 Key 会自动保存，无需重复填写。费用每次从你的余额里扣（约 0.1-0.4 元/张），余额不足时到官网充值即可。</div>
    <div style="background:var(--soft-red);color:var(--red);font-size:12px;border-radius:10px;padding:10px 14px;margin-top:8px">⚠️ Key 只保存在你本机浏览器，不会上传服务器，也不会被卖家看到。请勿把 Key 发给陌生人。</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-red" style="flex:1" onclick="window.open('https://cloud.siliconflow.cn','_blank')">🌐 立即去开通</button>
      <button class="btn btn-ghost" style="flex:1" onclick="Modal.close()">知道了</button>
    </div>`, true);
}
function renderWsList(){
  const box = $('#wsList'); if(!box) return;
  const ws = getWorkspaces();
  const active = getActiveWs();
  box.innerHTML = ws.map(w=>`
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:${w.id===active?'var(--soft-red)':'var(--line2)'};border-radius:8px;margin-bottom:5px;font-size:12.5px">
      <div style="width:26px;height:26px;border-radius:50%;background:${w.id===active?'var(--red)':'var(--text3)'};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">${w.avatar||'?'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(w.name)}${w.fans?' <span style="font-size:10.5px;color:var(--text3);font-weight:400">'+fmtNum(w.fans)+' 粉</span>':''}</div>
        ${w.bio?'<div style="font-size:10.5px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(w.bio)+'</div>':''}
      </div>
      ${w.id===active?'<span class="pill red" style="font-size:9px;padding:1px 6px">当前</span>':'<button class="btn btn-ghost btn-sm" onclick="switchWorkspace(\''+w.id+')">切换</button>'}
      <button class="icon-btn" style="font-size:12px" onclick="openWsEdit('${w.id}')" title="编辑资料">✏️</button>
      ${w.id!==active?`<button class="icon-btn" style="font-size:11px" onclick="delWorkspace('${w.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`:''}
    </div>`).join('');
}
/* V6.30 账号资料编辑（粉丝数/主页链接/定位——账号管理实质化） */
function openWsEdit(id){
  const ws = getWorkspaces();
  const w = ws.find(x=>x.id===id) || ws[0];
  if(!w) return;
  Modal.open('👤 编辑账号资料 · '+esc(w.name), `
    <div class="form-group"><label class="label">账号名称</label><input id="weName" value="${esc(w.name||'')}"></div>
    <div class="form-group"><label class="label">粉丝数（填数字，如 3280）</label><input id="weFans" type="number" value="${w.fans||''}" placeholder="0"></div>
    <div class="form-group"><label class="label">账号定位（一句话，如：美妆干货/职场穿搭）</label><input id="weBio" value="${esc(w.bio||'')}" placeholder="如：油皮护肤干货 · 学生党平价"></div>
    <div class="form-group"><label class="label">主页链接（可选）</label><input id="weLink" value="${esc(w.link||'')}" placeholder="https://www.xiaohongshu.com/user/profile/..."></div>
    <button class="btn btn-red btn-block" onclick="doWsEdit('${w.id}')">保存资料</button>
    <div style="font-size:11px;color:var(--text3);margin-top:10px;line-height:1.7">资料用于：AI 生成接广话术自动带粉丝数、变现报价参考、账号定位注入创作 prompt。</div>`);
}
function doWsEdit(id){
  const ws = getWorkspaces();
  const w = ws.find(x=>x.id===id); if(!w) return;
  const name = ($('#weName')&&$('#weName').value.trim());
  if(!name){ Toast('账号名称不能为空'); return; }
  w.name = name;
  w.avatar = name[0].toUpperCase();
  w.fans = Math.max(0, parseInt(($('#weFans')&&$('#weFans').value)||0)||0);
  w.bio = ($('#weBio')&&$('#weBio').value.trim()) || '';
  w.link = ($('#weLink')&&$('#weLink').value.trim()) || '';
  localStorage.setItem('xhs_workspaces', JSON.stringify(ws));
  Modal.close(); Toast('账号资料已保存 ✅');
  renderWsList();
  try{ if(typeof updateBrandUI==='function') updateBrandUI(); }catch(e){}
}
function getWorkspaces(){
  let ws = [];
  try{ ws = JSON.parse(localStorage.getItem('xhs_workspaces')||'[]'); }catch(e){}
  if(!ws.length) ws = [{id:'default', name:localStorage.getItem('xhs_brand')||'Crazy Friday.', avatar:(localStorage.getItem('xhs_brand')||'C')[0].toUpperCase()}];
  return ws;
}
function getActiveWs(){
  return localStorage.getItem('xhs_active_ws') || 'default';
}
function createWorkspace(){
  // 多账号 = 尊享版功能
  if(!premiumGuard('多账号管理')) return;
  const name = $('#wsName').value.trim();
  if(!name){ Toast('请输入账号名称'); return; }
  const ws = getWorkspaces();
  if(ws.some(w=>w.name===name)){ Toast('该名称已存在'); return; }
  ws.push({id:uid(), name, avatar:name[0].toUpperCase()});
  localStorage.setItem('xhs_workspaces', JSON.stringify(ws));
  $('#wsName').value = '';
  switchWorkspace(ws[ws.length-1].id);
}
function switchWorkspace(id){
  const ws = getWorkspaces();
  let w = ws.find(x=>x.id===id);
  // 防御：default 工作区缺失时自动补齐（真实流程不会发生，但保证切回主账号永远可用）
  if(!w && id==='default'){
    w = {id:'default', name:localStorage.getItem('xhs_brand')||'Crazy Friday.', avatar:(localStorage.getItem('xhs_brand')||'C')[0].toUpperCase()};
  }
  if(!w) return;
  // 非默认工作区 = 多账号能力，需尊享版
  if(id!=='default' && !isPremium()){ Toast('多账号为尊享版功能 👑'); return; }
  // 先保存当前账号数据，再加载目标账号数据（数据按账号完全隔离）
  // 注意：必须用 flush() 同步落盘——save() 是 260ms 防抖，切换瞬间可能未写入导致数据丢失
  try{ saveMatrixMeta(); Store.flush(); }catch(e){}
  localStorage.setItem('xhs_active_ws', id);
  localStorage.setItem('xhs_brand', w.name);
  try{ Store.load(); saveMatrixMeta(); }catch(e){ console.error(e); }
  $$('.brand-name').forEach(el=>el.textContent = w.name);
  // 头像改为纯装饰，不再写入首字母
  const nameEl = $('#userName'); if(nameEl) nameEl.textContent = w.name;
  const mdName = $('#mdUserName'); if(mdName) mdName.textContent = w.name;
  // mdAvatar 装饰块，不写字母
  renderWsList();
  renderWsSwitcher();
  Toast('已切换到「'+w.name+'」，数据已独立加载 ✅');
  render();
  updateBadges();
}
/* ================= V6.2 矩阵管理（尊享版） ================= */
function saveMatrixMeta(){
  try{
    const d = Store.data;
    const meta = JSON.parse(localStorage.getItem('xhs_matrix_meta')||'{}');
    meta[getActiveWs()] = {
      name: localStorage.getItem('xhs_brand')||'账号',
      fans: d.analytics.overview.fans,
      pending: d.schedule.filter(s=>s.status==='ready').length,
      published: d.schedule.filter(s=>s.status==='published').length,
      income: d.money.records.reduce(function(a,b){return a+(+b.income||0);},0)
    };
    localStorage.setItem('xhs_matrix_meta', JSON.stringify(meta));
  }catch(e){}
}
function renderMatrixCard(){
  if(!isPremium()) return '';
  const ws = getWorkspaces();
  if(ws.length < 2) return '';
  let meta = {};
  try{ meta = JSON.parse(localStorage.getItem('xhs_matrix_meta')||'{}'); }catch(e){}
  const active = getActiveWs();
  const rows = ws.map(function(w){
    const m = meta[w.id] || {name:w.name, fans:0, pending:0, income:0};
    const on = w.id===active;
    return '<div class="matrix-row" '+(on?'style="background:var(--redSoft);border-color:var(--red2)"':'')+'>'+
      '<div style="min-width:0"><div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(w.name)+'</div>'+
      '<div style="font-size:11px;color:var(--text3);margin-top:1px">'+fmtNum(m.fans)+' 粉 · 待发 '+m.pending+' · 收益 ¥'+m.income+'</div></div>'+
      (on ? '<span class="pill red" style="font-size:9px;margin-left:auto;flex-shrink:0">当前</span>'
           : '<button class="btn btn-ghost btn-sm" style="margin-left:auto;flex-shrink:0" onclick="switchWorkspace(\''+w.id+')">切换</button>')+
    '</div>';
  }).join('');
  return '<div class="card" style="margin-bottom:14px"><div class="card-title">🧭 我的矩阵 <span class="pill" style="font-size:9px;vertical-align:middle;background:var(--soft-red);color:var(--red)">AI 智能</span> <span style="font-size:11px;color:var(--text3);font-weight:400;margin-left:6px">'+ws.length+' 个账号 · 数据互相独立</span></div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px">'+rows+'</div>'+
    '<div style="font-size:10.5px;color:var(--text3);margin-top:10px">切换账号用顶栏账号选择器，或「设置 → 工作区/多账号」管理账号</div></div>';
}
function renderWsSwitcher(){
  const sel = $('#wsSwitcher'); if(!sel) return;
  if(!isPremium()){ sel.style.display='none'; return; }
  const ws = getWorkspaces();
  sel.style.display = ws.length>1 ? 'block' : 'none';
  sel.innerHTML = ws.map(function(w){ return '<option value="'+w.id+'" '+(w.id===getActiveWs()?'selected':'')+'>'+esc(w.name)+'</option>'; }).join('');
  sel.onchange = function(){ switchWorkspace(sel.value); };
}
function delWorkspace(id){
  const ws = getWorkspaces().filter(w=>w.id!==id);
  localStorage.setItem('xhs_workspaces', JSON.stringify(ws));
  renderWsList();
  Toast('已删除账号名片');
}
function openBrandEdit(){
  // V6.27 一键改名：从首页/侧栏点品牌名都能弹出
  const cur = localStorage.getItem('xhs_brand') || '';
  Modal.open('✏️ 修改工作台名称', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:14px">给你的工作台起个自己的名字。<br>会显示在<b>侧边栏</b>、<b>首页问候</b>、<b>添加主屏后的图标</b>上。</p>
    <div class="form-group"><label class="label">工作台名称</label>
      <input id="brandEditInput" placeholder="例如：阿美的小红书 / 猫叔工作室" value="${esc(cur)}" maxlength="20" style="font-size:15px;text-align:center;padding:14px">
    </div>
    <div style="font-size:11.5px;color:var(--text3);margin-bottom:12px;line-height:1.7">
      💡 建议 2-8 字（简短好记）；可以加 <code style="background:var(--line2);padding:1px 5px;border-radius:4px">.</code> 结尾（如「猫叔.」）
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost" style="flex:1" onclick="Modal.close()">取消</button>
      <button class="btn btn-red" style="flex:2" onclick="doSaveBrand()">💾 保存（立即生效）</button>
    </div>`);
  setTimeout(function(){ const el = document.getElementById('brandEditInput'); if(el){ el.focus(); el.select(); } }, 80);
}
function doSaveBrand(){
  const el = document.getElementById('brandEditInput');
  if(!el){ Modal.close(); return; }
  let v = el.value.trim();
  if(!v){ Toast('请输入名称'); el.focus(); return; }
  if(v.length > 20){ Toast('最长 20 字'); el.focus(); return; }
  localStorage.setItem('xhs_brand', v);
  // 同步刷新所有相关位置
  $$('.brand-name').forEach(b => b.textContent = v);
  $$('.hh-name').forEach(b => b.firstChild ? (b.firstChild.nodeValue = v) : null);
  // 首页需要重渲染以更新问候语里的名字
  if(typeof currentPage === 'undefined' || currentPage === 'dashboard'){
    renderDashboard();
  } else {
    navigate('dashboard');
  }
  Modal.close();
  Toast('已改名：' + v + ' ✅');
}
function saveBrand(){
  const v=$('#brandName').value.trim();
  localStorage.setItem('xhs_brand', v);
  $$('.brand-name').forEach(el=>el.textContent = v||'小红书AI工作台');
  // 同步当前工作区名片
  try{
    const ws = getWorkspaces();
    const active = getActiveWs();
    const cur = ws.find(w=>w.id===active);
    if(cur){ cur.name = v||'Crazy Friday.'; cur.avatar = (v||'C')[0].toUpperCase(); localStorage.setItem('xhs_workspaces', JSON.stringify(ws)); }
  }catch(e){}
  renderWsList();
  Toast('品牌名已保存 ✅');
}
function exportData(){
  const blob = new Blob([Store.export()], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '小红书工作台数据备份_'+todayStr()+'.json';
  a.click(); URL.revokeObjectURL(a.href);
  Toast('备份文件已导出 ⬇️');
}
function importData(){
  Modal.open('⬆️ 导入数据', `
    <p style="font-size:13px;color:var(--text2);margin-bottom:12px">选择之前导出的 JSON 备份文件，将覆盖当前全部数据。</p>
    <label style="display:flex;flex-direction:column;align-items:center;gap:8px;border:2px dashed var(--line);border-radius:12px;padding:26px;cursor:pointer">
      <span style="font-size:30px">📂</span><span style="font-size:13px">选择备份文件</span>
      <input type="file" accept=".json,application/json" style="display:none" onchange="doImport(this)">
    </label>`);
}
function doImport(input){
  const f=input.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload = e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.topicPool||!data.analytics) throw '格式不对';
      Store.data=data; Store.save(); Modal.close(); render(); updateBadges();
      Toast('数据导入成功 ✅');
    }catch(err){ Toast('文件格式不正确'); }
  };
  r.readAsText(f);
}
function resetAll(){
  Modal.open('确认清空？', `
    <p style="color:var(--red);font-size:14px;font-weight:600;margin-bottom:8px">⚠️ 此操作将删除全部数据</p>
    <p style="font-size:13px;color:var(--text2);margin-bottom:14px">所有选题、内容、素材、数据记录都会被重置为初始示例状态，且无法恢复。</p>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="Modal.close()">取消</button>
      <button class="btn btn-red" style="flex:1" onclick="doReset()">确认清空</button>
    </div>`);
}
function doReset(){ Modal.close(); Store.reset(); navigate('dashboard'); Toast('已清空并重置'); }

/* ================= 全局动作 ================= */
function toggleFavorite(id, ev){ if(ev) ev.stopPropagation();
  const idx = Store.data.favorites.findIndex(f=>f.id===id);
  if(idx>=0){ Store.data.favorites.splice(idx,1); Toast('已取消收藏'); }
  else{ const t = Store.data.topicPool.find(x=>x.id===id); if(t) Store.data.favorites.push(t); Toast('已收藏到灵感夹 ⭐'); }
  Store.save(); updateBadges(); if(currentPage==='topics') renderTopics(); else if(currentPage==='favorites') renderFavorites();
}
function goCreateWith(kw, cat, ev){ if(ev) ev.stopPropagation(); navigate('create'); setTimeout(()=>{ const el=$('#aiKw'); if(el) el.value=kw.replace('（借鉴）',''); aiCat=cat; const pills=$$('#aiCatP .chip'); pills.forEach(p=>p.classList.toggle('active',p.textContent===cat)); if(el.value) runGenerate(); },60); }
function openTopicDetail(id){
  const t = Store.data.topicPool.find(x=>x.id===id); if(!t) return;
  const fav = Store.data.favorites.some(f=>f.id===id);
  Modal.open('🔍 选题详情', `
    <div style="font-size:17px;font-weight:700;margin-bottom:8px">${esc(t.title)}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><span class="pill">${t.cat}</span><span class="pill red">热度 ${t.heat}</span><span class="pill orange">搜索 ${fmtNum(t.search)}</span><span class="pill blue">竞争度 ${t.competition}%</span>${t.rising?'<span class="pill purple">↗ 飙升中</span>':''}</div>
    <div class="card" style="box-shadow:none;background:var(--bg);font-size:13px;color:var(--text2);margin-bottom:14px">💡 <b>选题价值：</b>${t.heat>=90?'高热度，当前处于上升期，建议 48 小时内产出。':t.heat>=80?'热度稳定，竞争适中，适合作为常规内容排期。':'长尾选题，竞争小，适合建立垂直人设。'}${t.search>80000?'<br>📈 <b>流量红利：</b>搜索量可观，标题中直接带上关键词更易被搜到。':''}</div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="toggleFavorite('${t.id}');Modal.close()">${fav?'已收藏 ✓':'☆ 收藏灵感'}</button>
      <button class="btn btn-red" style="flex:1" onclick="Modal.close();goCreateWith('${esc(t.title)}','${t.cat}')">✍️ 直接创作</button>
    </div>`);
}
function openAddTopic(){
  Modal.open('＋ 自定义选题', `
    <div class="form-group"><label class="label">选题标题</label><input id="ntTitle" placeholder="如：周末露营装备清单"></div>
    <div class="form-group"><label class="label">分类</label><select id="ntCat">${catOptions().map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="label">预估搜索量（可选）</label><input id="ntSearch" type="number" placeholder="如 50000"></div>
    <button class="btn btn-red btn-block" onclick="doAddTopic()">加入选题池</button>`);
}
function doAddTopic(){
  const title=$('#ntTitle').value.trim(); if(!title){Toast('请输入选题标题');return;}
  Store.data.topicPool.unshift({id:uid(), cat:$('#ntCat').value, title, heat:rnd(60,75), search:+($('#ntSearch').value||rnd(10000,40000)), competition:rnd(20,50), rising:false});
  Store.save(); Modal.close(); renderTopics(); Toast('已加入选题雷达 ✅');
}
function copyText(el, text){
  const done = ()=>{ Toast('已复制到剪贴板 📋'); if(el&&el.classList) el.classList.add('done'); setTimeout(()=>el&&el.classList.remove('done'),1200); };
  if(navigator.clipboard&&window.isSecureContext){ navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text,done)); }
  else fallbackCopy(text,done);
}
function fallbackCopy(text, cb){
  const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); cb();}catch(e){Toast('复制失败，请手动复制');} document.body.removeChild(ta);
}

/* ================= 首次使用引导 ================= */
/* ================= 3 分钟初始化 Onboarding ================= */
let obStep = 0;
const OB_STEPS = [
  {title:'你的核心运营目标是什么？（决定你的专属引导路径）', key:'goal', options:['新手起号','变现增收','内容爆款','矩阵多账号'], cols:2, hint:'🌱 从零做账号 / 💰 接商单带货 / 🔥 拆解爆款提流量 / 🧭 多账号矩阵'},
  {title:'你运营什么类型的账号？', key:'accountType', options:['美妆','穿搭','数码','美食','母婴','旅行','职场','学习','家居','个人IP','其他'], cols:3},
  {title:'你的核心目标是什么？', key:'goal', options:['涨粉','获客','带货变现','打造个人IP','品牌运营','记录分享'], cols:3},
  {title:'你计划每周发布几篇？', key:'weeklyTarget', options:['3','5','7','更多'], cols:2},
  {title:'当前账号处于哪个阶段？', key:'stage', options:['刚开始','0-1000 粉','1000-1w 粉','1w+ 粉'], cols:2}
];
function showOnboarding(){
  if(Store.data.userProfile && Store.data.userProfile.onboarded) return;
  if(!Store._isNewUser) return;
  if(localStorage.getItem(LS_ONBOARDED)) return;
  obStep = 0;
  renderObStep();
}
function renderObStep(){
  const s = OB_STEPS[obStep];
  const cur = Store.data.userProfile || {};
  Modal.open('欢迎使用 Crazy Friday.', `
    <div style="text-align:center;margin-bottom:6px">
      <div style="font-size:11px;color:var(--text3);letter-spacing:1px">${obStep+1} / ${OB_STEPS.length}</div>
      <div style="width:100%;height:3px;background:var(--line2);border-radius:2px;margin:8px 0 18px;overflow:hidden"><div style="width:${(obStep+1)/OB_STEPS.length*100}%;height:100%;background:var(--red);border-radius:2px"></div></div>
      <div style="font-size:17px;font-weight:800;margin-bottom:16px">${s.title}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(${s.cols},1fr);gap:8px">
      ${s.options.map(o=>`<div class="ob-opt" onclick="obPick('${s.key}','${o}')">${o}</div>`).join('')}
    </div>
    ${s.hint?`<div style="font-size:11px;color:var(--text3);margin-top:12px;text-align:center">${s.hint}</div>`:''}
    <div style="font-size:11px;color:var(--text3);margin-top:16px;text-align:center">选择后自动进入下一步</div>`);
}
function obPick(key, val){
  const up = Store.data.userProfile || {accountType:'',goal:'',weeklyTarget:5,stage:'',onboarded:false};
  if(key==='weeklyTarget') up.weeklyTarget = val==='更多'?10:parseInt(val);
  else up[key] = val;
  if(key==='goal'){ try{ localStorage.setItem('xhs_goal', val); }catch(e){} }
  Store.data.userProfile = up;
  Store.save();
  obStep++;
  if(obStep >= OB_STEPS.length){
    up.onboarded = true;
    Store.data.userProfile = up;
    Store.save();
    localStorage.setItem(LS_ONBOARDED,'1');
    Modal.close();
    Toast('你的运营工作台已经准备好了 ✨');
    // 需求式引导：按目标直达核心页面
    const goal = localStorage.getItem('xhs_goal') || up.goal || '';
    const goalPage = {'新手起号':'diagnosis','变现增收':'vmoney','内容爆款':'viral','矩阵多账号':'settings'}[goal];
    setTimeout(function(){ if(goalPage){ navigate(goalPage); } }, 500);
    // V6.7：3 分钟初始化完成后，自然衔接「账号风格档案」（不弹窗打架）
    if(!localStorage.getItem('xhs_arch_onboarded')){ setTimeout(openArchOnboarding, 1200); }
  } else {
    renderObStep();
  }
}


/* ================= V6.9 新用户 4 页滑动开屏引导 ================= */
let introPage = 0;
function initIntro(){
  const el = document.getElementById('introOverlay');
  if(!el) return;
  try{ if(localStorage.getItem('xhs_intro_done')==='1') return; }catch(e){}
  // V6.31.1 修复：未激活用户优先解决登录，开屏引导会拦截登录门激活按钮导致永远点不到"激活"
  try{
    const st = (typeof getLicenseState==='function') ? getLicenseState() : null;
    if(!st || st.status !== 'activated'){
      try{ localStorage.setItem('xhs_intro_done','1'); }catch(e){}
      el.style.display = 'none';
      return;
    }
  }catch(e){}
  el.style.display = 'flex';
  introPage = 0;
  const track = document.getElementById('introTrack');
  if(track) track.style.transform = 'translateX(0)';
  renderIntroDots();
  const next = document.getElementById('introNext');
  if(next){ next.textContent = '下一步'; next.onclick = function(){ if(introPage >= 3){ finishIntro(); return; } introGo(1); }; }
  const skip = document.getElementById('introSkip');
  if(skip) skip.onclick = finishIntro;
  // 触摸滑动
  let startX = 0, startY = 0;
  el.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, {passive:true});
  el.addEventListener('touchend', function(e){
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) introGo(dx < 0 ? 1 : -1);
  }, {passive:true});
  // 桌面也支持点按进度（非必须，跳过/下一步按钮已够）
}
function introGo(dir){
  const track = document.getElementById('introTrack');
  if(!track) return;
  const pages = track.querySelectorAll('.intro-page').length;
  introPage = Math.min(pages-1, Math.max(0, introPage + dir));
  track.style.transform = 'translateX(-' + (introPage*100) + '%)';
  renderIntroDots();
  const next = document.getElementById('introNext');
  if(next) next.textContent = (introPage === pages-1) ? '开始体验' : '下一步';
}
function renderIntroDots(){
  const dots = document.getElementById('introDots');
  if(!dots) return;
  const pages = document.getElementById('introTrack').querySelectorAll('.intro-page').length;
  let html = '';
  for(let i=0;i<pages;i++) html += '<i class="'+(i===introPage?'on':'')+'"></i>';
  dots.innerHTML = html;
}
function finishIntro(){
  try{ localStorage.setItem('xhs_intro_done','1'); }catch(e){}
  const el = document.getElementById('introOverlay');
  if(el) el.style.display = 'none';
}

/* ================= V6.8 需求式运营目标引导 ================= */

function goalGuideBar(){
  const goal = localStorage.getItem('xhs_goal') || (Store.data.userProfile && Store.data.userProfile.goal) || '';
  const G = {
    '新手起号':   {ico:'🌱', path:'diagnosis', desc:'完成账号健康度诊断 → 生成基础养号方案 → 第一次违禁词检测'},
    '变现增收':   {ico:'💰', path:'vmoney',     desc:'看今日变现日报 → 变现路径诊断 → 生成第一条合规变现文案'},
    '内容爆款':   {ico:'🔥', path:'viral',      desc:'拆解 1 篇同赛道爆款 → 生成标题封面组合 → 智能排期发布'},
    '矩阵多账号': {ico:'🧭', path:'settings',   desc:'添加第 2 个账号 → 查看数据隔离说明 → 批量检测账号健康度'}
  };
  const g = G[goal];
  // V6.10 目标选择后可收起：收起为一行小条，点击重新展开
  const collapsed = localStorage.getItem('xhs_goal_collapsed')==='1' && g;
  if(collapsed){
    return '<div class="goal-bar goal-bar-mini" onclick="expandGoalBar()">' +
      '<span class="gb-ico">'+(g?g.ico:'🎯')+'</span>' +
      '<div class="gb-body"><div class="gb-t" style="font-size:12.5px">运营目标：'+goal+'</div></div>' +
      '<span style="color:var(--text3);font-size:13px;font-weight:700;flex-shrink:0">展开 ›</span>' +
    '</div>';
  }
  return '<div class="goal-bar">' +
    '<span class="gb-ico">'+(g?g.ico:'🎯')+'</span>' +
    '<div class="gb-body">' +
      '<div class="gb-t">'+(g?('运营目标：'+goal):'设置你的运营目标，获取专属引导路径')+'</div>' +
      (g?'<div class="gb-d">'+g.desc+'</div>':'<div class="gb-d">选完目标后，工作台会按你的需求给出专属任务与路径</div>') +
    '</div>' +
    (g
      ? '<button class="btn btn-red btn-sm" onclick="navigate(\''+g.path+'\')">立即开始</button>'
      : '<button class="btn btn-red btn-sm" onclick="openGoalSwitch()">选择目标</button>') +
    '<button class="btn btn-ghost btn-sm" onclick="openGoalSwitch()">切换</button>' +
    (g?'<button class="btn btn-ghost btn-sm" onclick="collapseGoalBar()" title="收起引导条">已了解 ✕</button>':'') +
  '</div>';
}
function collapseGoalBar(){
  try{ localStorage.setItem('xhs_goal_collapsed','1'); }catch(e){}
  renderDashboard();
}
function expandGoalBar(){
  try{ localStorage.removeItem('xhs_goal_collapsed'); }catch(e){}
  renderDashboard();
}
function openGoalSwitch(){
  const goals = [['新手起号','🌱 从零做账号，养号/权重/基础流量'],['变现增收','💰 已有账号，接商单/带货/置换'],['内容爆款','🔥 拆解爆款，优化标题封面提流量'],['矩阵多账号','🧭 同时管理多个账号']];
  Modal.open('🎯 切换运营目标', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">不同目标对应不同的专属引导路径与首页任务。随时可切换。</p>
    <div style="display:grid;gap:8px">
      ${goals.map(function(g){
        return '<div class="ob-opt" style="text-align:left" onclick="pickGoal(this, &quot;'+g[0]+'&quot;)"><b>'+g[1].split(' ')[0]+' '+g[0]+'</b><div style="font-size:11px;color:var(--text3);font-weight:400;margin-top:2px">'+g[1].slice(g[1].indexOf(' ')+1)+'</div></div>';
      }).join('')}
    </div>`);
}
function pickGoal(el, g){
  if(!g && el){
    // 兼容旧调用 pickGoal(this, 'name') 的反向参数调用
    g = el.getAttribute('data-goal') || el.textContent.trim().split(' ')[0];
  }
  try{ localStorage.setItem('xhs_goal', g); }catch(e){}
  if(Store.data.userProfile){ Store.data.userProfile.goal = g; Store.save(); }
  // 视觉反馈：同组选项 active 高亮
  if(el){
    try{
      const parent = el.parentNode;
      if(parent){
        parent.querySelectorAll('.ob-opt').forEach(function(x){ x.classList.toggle('active', x === el); });
      }
    }catch(e){}
  }
  Modal.close();
  Toast('已切换运营目标：'+g+' 🎯');
  setTimeout(function(){ navigate('dashboard'); }, 400);
}

function showWelcome(){
  if(localStorage.getItem(LS_WELCOME)) return;
  Modal.open('👋 欢迎使用 小红书AI运营工作台', `
    <div style="text-align:center;padding:6px 0 2px">
      <div style="font-size:52px;margin-bottom:10px">📕</div>
      <p style="font-size:13.5px;color:var(--text2);line-height:1.9;text-align:left">
        <b style="color:var(--text)">一站式完成</b>：选题 → 创作 → 发布 → 数据 → 复盘，全流程都在这里。<br><br>
        <b style="color:var(--text)">数据保存在本设备</b>：所有内容只存在你自己的浏览器里，无需注册登录。<br><br>
        <b style="color:var(--text)">换设备前先备份</b>：在「设置中心」导出数据，新设备导入即可。
      </p>
      <div style="background:var(--soft-blue);border:1px dashed var(--blue);border-radius:12px;padding:12px 14px;text-align:left;margin-top:14px">
        <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:4px">📲 像 App 一样使用（推荐）</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7">浏览器菜单点「<b>添加到主屏幕</b>」，以后点桌面图标直接全屏打开，<b>没有地址栏</b>，体验和原生 App 完全一样。</div>
      </div>
    </div>
    <button class="btn btn-red btn-block" style="margin-top:14px" onclick="closeWelcome()">开始使用 →</button>`);
}
function closeWelcome(){ Modal.close(); localStorage.setItem(LS_WELCOME,'1'); }
function checkExpire(){
  // 以激活码授权的真实剩余天数为准
  const lic = (LIC_STATE && LIC_STATE.status==='activated') ? LIC_STATE : null;
  const remain = lic ? (lic.remain!==undefined ? lic.remain : 0) : (Store.data.subscription.remainDays||0);
  // 仅剩 1-7 天时轻量提醒一次（不重复骚扰），已到期不再强制弹窗
  if(remain>0 && remain<=7){
    if(localStorage.getItem('xhs_expire_notify')) return;
    localStorage.setItem('xhs_expire_notify','1');
    Modal.open('⏰ 会员即将到期', `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:44px;margin-bottom:10px">⏰</div>
        <div style="font-size:16px;font-weight:700">会员还剩 ${remain} 天到期</div>
        <p style="font-size:13px;color:var(--text2);margin:10px 0 18px">建议提前续费，避免到期后功能受限。数据会为你完整保留。</p>
        <button class="btn btn-red btn-block" onclick="Modal.close();navigate('membership')">👑 立即续费</button>
      </div>`);
  }
}

/* ================= V5.7 版本更新提示（微信式：更新后说明 + 数据零影响承诺） =================
 * V6.43 提醒去重：同一天内即使发布多个版本，客户当天只被提醒一次，且永远以当天最新版为准。
 * 规则：看过当前版本 → 不提醒；今天已提醒过（更早版本）→ 不提醒（明天自动提醒到最新版）。 */
function __readSeenVer(key){
  try{
    const raw = localStorage.getItem(key) || '';
    if(!raw) return {v:'', date:''};
    try{ const o = JSON.parse(raw); return {v:o.v||'', date:o.date||''}; }catch(e){ return {v:raw, date:''}; }  // 兼容旧纯字符串
  }catch(e){ return {v:'', date:''}; }
}
function checkAppUpdate(manual){
  const latest = CHANGELOG[0] || {v:VERSION.app, items:[]};
  const today = todayStr();
  if(manual){
    const seen = __readSeenVer('xhs_seen_ver');
    if(seen.v === VERSION.app){ Toast('已是最新版本 V'+VERSION.app+' ✅'); return; }
    showUpdateModal(latest);   // 手动查看不写 seen，不干扰自动节奏
    return;
  }
  const seen = __readSeenVer('xhs_seen_ver');
  if(seen.v === VERSION.app) return;   // 看过当前版本
  if(seen.date === today) return;      // 今天已提醒过 → 明天再提醒（届时版本若更新，看到的即最新说明）
  localStorage.setItem('xhs_seen_ver', JSON.stringify({v:VERSION.app, date:today}));
  // 已有其他弹窗（欢迎/到期提醒）在展示时，跳过本次，避免互相覆盖
  if(document.getElementById('modal') && document.getElementById('modal').style.display === 'flex') return;
  showUpdateModal(latest);
}
function showUpdateModal(latest){
  Modal.open('🎉 新版本 V'+latest.v+' 已上线', `
    <div style="text-align:center;padding:4px 0 2px">
      <div style="font-size:42px;margin-bottom:8px">📕</div>
      <div style="font-size:11px;color:var(--text3);letter-spacing:1px">${latest.date} 发布</div>
      <div style="font-size:16px;font-weight:800;margin:6px 0 12px">本次更新亮点</div>
    </div>
    <div style="background:var(--line2);border-radius:12px;padding:14px 16px;margin-bottom:14px">
      ${latest.items.map(x=>`<div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.7;padding:3px 0"><span style="color:var(--red);font-weight:700;flex-shrink:0">·</span><span>${x}</span></div>`).join('')}
    </div>
    <div style="font-size:12px;color:var(--green);background:var(--soft-green);border-radius:9px;padding:9px 12px;text-align:center;margin-bottom:14px">🔒 本次升级不影响你的任何数据</div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="Modal.close();openUpdateLog()">查看全部记录</button>
      <button class="btn btn-red" style="flex:1" onclick="Modal.close()">知道了</button>
    </div>`);
}
function openUpdateLog(){

  Modal.open('📋 更新记录', `
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px;line-height:1.7">每次升级都会自动保留你的全部数据，可放心使用。</div>
    ${CHANGELOG.map(c=>`
      <div class="about-ver">
        <span class="av-badge ${c.v===CHANGELOG[0].v?'new':''}">V${c.v}</span>
        <span class="av-text"><b>${c.date}</b><br>${c.items.join('<br>· ')}</span>
      </div>`).join('')}`);
}

/* ================= V6.23 自动更新提示（不依赖客户端缓存，服务端版本为准） =================
 * 原理：每次打开 + 每 10 分钟拉 /api/version，与本地记录对比。
 * 有新版 → 顶部深色横幅「新版本已就绪 · 立即刷新」，点击 reload（数据存 localStorage，刷新不影响）。
 * 客户无需重新添加主屏幕——URL/manifest 不变，PWA 自动加载新版。 */
let __verBannerShown = false;
async function checkRemoteVersion(){
  try{
    const base = cfCloudBase(); if(!base) return;
    const r = await fetch(base + '/api/version', { cache:'no-store' });
    const j = await r.json();
    if(!j.ok || !j.version) return;
    // V6.43 去重：该版本看过 / 今天已提示过 → 不再提示（同一天多次发版客户也只看到一次横幅）
    const seen = __readSeenVer('xhs_ver_seen_remote');
    if(seen.v === j.version) return;
    if(seen.date === todayStr()) return;
    localStorage.setItem('xhs_ver_seen_remote', JSON.stringify({v:j.version, date:todayStr()}));
    if(__verBannerShown) return;
    showVerBanner(j.version);
  }catch(e){}
}
function showVerBanner(ver){
  try{
    __verBannerShown = true;
    const old = document.getElementById('verBanner');
    if(old) old.remove();
    const div = document.createElement('div');
    div.id = 'verBanner';
    div.className = 'ver-banner';
    div.innerHTML = '<span style="font-size:15px">✨</span> 新版本 V' + ver + ' 已就绪 <button onclick="reloadForUpdate()">立即刷新</button><span class="vb-tip">数据不受影响</span>';
    div.onclick = reloadForUpdate;
    document.body.appendChild(div);
    // 10 秒后自动消失（不打扰；用户下次打开仍会触发）
    setTimeout(()=>{ const b=document.getElementById('verBanner'); if(b) b.classList.add('hide'); }, 12000);
  }catch(e){}
}
function reloadForUpdate(){ location.reload(); }

/* ================= 主渲染（含 Error Boundary） ================= */
function render(){
  // V6.27 隐藏选题雷达独立搜索框（切到其他页面时收起）
  try{ const bar = document.getElementById('topicSearchBar'); if(bar){ bar.style.display = 'none'; bar.innerHTML = ''; } }catch(e){}
  // V6.23 App 感：每次 render 触发 page-fade 动画（不与 navigate 重复）
  try{
    const c = document.getElementById('content');
    if(c){
      c.classList.remove('page-fade');
      void c.offsetWidth; // 重触发动画
      c.classList.add('page-fade');
    }
  }catch(e){}
  try{
    switch(currentPage){
      case 'dashboard': renderDashboard(); break;
      case 'features': renderFeatures(); break;
      case 'topics': renderTopics(); break;
      case 'trending': renderTrending(); break;
      case 'viral': renderViral(); break;
      case 'create': renderCreate(); break;
      case 'publish': renderPublish(); break;
      case 'schedule': renderSchedule(); break;
      case 'analytics': renderAnalytics(); break;
      case 'assets': renderAssets(); break;
      case 'diagnosis': renderDiagnosis(); break;
      case 'benchmark': renderBenchmark(); break;
      case 'toolbox': renderToolbox(); break;
      case 'ideas': renderIdeas(); break;
      case 'money': renderMoney(); break;
      case 'library': renderLibrary(); break;
      case 'favorites': renderFavorites(); break;
      case 'membership': renderMembership(); break;
      case 'settings': renderSettings(); break;
      case 'help': renderHelp(); break;
      case 'vmoney': renderVmoney(); break;
      case 'vreport': renderVreport(); break;
      case 'shop': renderShop(); break;
    }
  }catch(e){
    console.error('[Crazy Friday] 页面渲染失败:', e);
    $('#content').innerHTML = `
      <div class="error-boundary">
        <div class="eb-ico">!</div>
        <div class="eb-title">「${PageMeta[currentPage].t}」暂时无法加载</div>
        <div class="eb-desc">你的数据已自动保护，其他功能不受影响。</div>
        <button class="btn btn-black" onclick="render()">重新加载</button>
      </div>`;
  }
}

/* ================= V6.28 功能地图（让客户一眼看清全部功能，不再问"有没有XX"） ================= */
function renderFeatures(){
  const g = (name, icon, desc, act, badge) =>
    `<div class="fm-item" onclick="${act}">
      <div class="fm-ico fm-${icon}">${ICONS[icon] || ''}</div>
      <div class="fm-main">
        <div class="fm-name">${name}${badge ? '<span class="fm-badge">'+badge+'</span>' : ''}</div>
        <div class="fm-desc">${desc}</div>
      </div>
      <span class="fm-go">›</span>
    </div>`;
  $('#content').innerHTML = `
  <div class="section-head"><h2>🧭 功能地图</h2><span class="pill red">全功能一览</span></div>
  <div class="fm-intro">
    <div style="font-weight:800;font-size:15px">这个工作台能做什么？看这一页就够了。</div>
    <div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.7">共 ${20} 个功能模块 · ${5} 大类 · AI 全部开箱即用。点任意卡片直达对应功能。</div>
  </div>

  <div class="fm-group"><div class="fm-group-title">🤖 AI 智能能力 <span class="fm-gtag">开箱即用 · 无需配置</span></div>
    <div class="fm-grid">
      ${g('AI 文案创作','pen','输入主题，一键生成标题+正文+标签+封面，可直接发布','navigate(\'create\')','常用')}
      ${g('一键全流程','flame','一个主题 → 标题/正文/标签/封面/发布时间全套生成','openAiFullFlow()')}
      ${g('AI 运营助理','bulb','随时问问题：数据下滑分析 / 选题建议 / 变现方案','openSidekick()')}
      ${g('标题打分器','chart','给你的标题打分 0-100，给 5 个优化方向','openTitleScorer()')}
      ${g('图文卡片生成器','grid','文案一键排版成小红书竖版配图，9 套模板','openCardMaker()')}
      ${g('AI 生图','crown','文字描述生成插画/实景/3D 配图（自填 Key）','openImageGen()')}
      ${g('AI 图生文','compass','上传图片 → AI 看懂 → 生成小红书文案','openVisionGen()')}
      ${g('变现日报','news','每日新规/玩法/行情/风险，覆盖 14 个行业','navigate(\'vreport\')')}
    </div>
  </div>

  <div class="fm-group"><div class="fm-group-title">🎭 博主风格研究 <span style="font-size:10px;color:var(--red);font-weight:700;margin-left:6px">NEW</span></div>
    <div class="fm-grid">
      ${g('博主风格分析 + 融合改写','mask','粘主页链接 AI 拆 7 维风格，滑块调比例融合改写你的草稿','openBloggerStyle()','推荐')}
      ${g('同风格原创选题 ×5','bulb','基于分析报告一键生成 5 条可落地选题，自动入选题池','openBloggerStyle()')}
      ${g('风格融合改写草稿','pen','把任意草稿按指定比例融合博主风格重写，标原创风险','openBloggerStyle()')}
      ${g('已分析博主复访','archive','所有分析过的博主都在这，可随时回看 / 复用','openBsHistory()')}
    </div>
  </div>

  <div class="fm-group"><div class="fm-group-title">🩺 发布前质检 <span style="font-size:10px;color:var(--red);font-weight:700;margin-left:6px">NEW</span></div>
    <div class="fm-grid">
      ${g('发布前检查台','steth','标题/正文边写边打分，逐项告诉你为什么扣分、怎么改','openPreCheckStation()','推荐')}
      ${g('标题诊断','pen','长度 / 数字锚点 / 情绪张力 / 人群指向 / 悬念钩子 / 极限词','openPreCheckStation()')}
      ${g('正文诊断','chart','字数 / 分段 / 表情节奏 / 话题标签 / 开头钩子 / 互动引导','openPreCheckStation()')}
      ${g('违规风险扫描','crosshair','本地词库命中即标红，给合规替代说法','openSensitiveCheck()')}
      ${g('AI 一键优化到 85+','bulb','针对薄弱项定向改写，回填后立刻重新打分','openPreCheckStation()')}
    </div>
  </div>

  <div class="fm-group"><div class="fm-group-title">🛒 电商带货 <span style="font-size:10px;color:var(--red);font-weight:700;margin-left:6px">NEW</span></div>
    <div class="fm-grid">
      ${g('电商带货中心','cart','选品 → 写带货笔记 → 排期 → 记单算佣金，一条龙闭环',"navigate('shop')",'推荐')}
      ${g('商品库','archive','管理候选/在售/下架商品，客单价与佣金率一目了然',"navigate('shop')")}
      ${g('AI 选品建议','bulb','按你的赛道和粉丝量，推荐 6 个适合带的品类','shopTabFromFeatures()')}
      ${g('带货笔记生成','pen','选商品 → AI 出标题+正文+标签+封面+合规提示',"navigate('shop')")}
      ${g('佣金计算器','chart','客单价×佣金率×订单数，反推需要多少曝光',"shopTabFromFeatures('data')")}
      ${g('大促日历','calendar','双11/618/开学季等节点倒计时 + 提前铺内容提醒',"shopTabFromFeatures('calendar')")}
    </div>
  </div>

  <div class="fm-group"><div class="fm-group-title">📈 数据与诊断</div>
    <div class="fm-grid">
      ${g('数据复盘','chart','7/30/90 天数据趋势：曝光、互动、涨粉、收益','navigate(\'analytics\')')}
      ${g('账号诊断','steth','综合评分 + 5 维雷达图 + 优化建议','navigate(\'diagnosis\')')}
      ${g('对标账号','crosshair','跟同行对标，发现差距与可抄作业','navigate(\'benchmark\')')}
      ${g('变现管理','briefcase','收益记录 + 报价参考 + 变现进度','navigate(\'money\')')}
    </div>
  </div>

  <div class="fm-group"><div class="fm-group-title">🎯 内容与运营</div>
    <div class="fm-grid">
      ${g('选题雷达','compass','按赛道找选题，热度排序，一键收藏','navigate(\'topics\')')}
      ${g('今日热门','trend','AI 每 15 分钟刷新平台热点，跟踪飙升话题','navigate(\'trending\')')}
      ${g('爆款拆解','flame','拆解爆款标题/结构/钩子，复刻思路','navigate(\'viral\')')}
      ${g('发布计划','calendar','内容排期 + 到期提醒 + 一键标记发布','navigate(\'schedule\')')}
      ${g('素材管理','folder','图片/文案/链接素材统一管理','navigate(\'assets\')')}
      ${g('灵感笔记','bulb','随时记录灵感，防止选题枯竭','navigate(\'ideas\')')}
      ${g('运营工具箱','wrench','实用小工具集合，运营提效','navigate(\'toolbox\')')}
      ${g('内容库','archive','所有内容沉淀：草稿/已发布/数据表现','navigate(\'library\')')}
      ${g('灵感收藏夹','star','收藏的选题集中管理','navigate(\'favorites\')')}
    </div>
  </div>

  <div class="fm-group"><div class="fm-group-title">💎 我的</div>
    <div class="fm-grid">
      ${g('今日智能建议','bulb','AI 根据你的数据，每天推荐 3 件今天该做的事','navigate(\'dashboard\')','每日更新')}
      ${g('今日 AI 机会流','news','每 30 分钟更新的变现机会：新平台/新玩法/新政策','navigate(\'trending\')')}
      ${g('会员中心','crown','查看权益 / 到期时间 / 联系卖家','navigate(\'membership\')')}
      ${g('设置中心','gear','改名 / 主题 / AI 接入 / 数据导出备份','navigate(\'settings\')')}
      ${g('帮助中心','steth','常见问题 + AI Key 教程','navigate(\'help\')')}
    </div>
  </div>

  <div style="font-size:11px;color:var(--text3);text-align:center;margin:18px 0 8px;line-height:1.8">找不到你要的功能？点右下角「AI 运营助理」直接问，或联系卖家。<br>数据仅保存在你的设备 · 随时导出备份</div>`;
}
/* ================= 初始化 ================= */

/* ================= V5.3 授权系统（激活码） ================= */
let LIC_STATE = {status:'pending', mode:'new'};
let isDemo = false;

function initLicense(){
  LIC_STATE = getLicenseState();
  // 演示模式标记（本会话临时体验）
  if(sessionStorage.getItem('xhs_demo')==='1'){ isDemo = true; }
  // 已激活/老客户：正常
  if(LIC_STATE.status==='activated') return true;
  return false;
}
/* V6.33 授权自愈：本地激活记录丢了（清缓存/换浏览器/iOS 自动清理）先静默找回，
   找不回来才弹激活门 —— 已付费客户不再被要求重复输码。 */
let __recoverTried = false;
async function recoverLicenseSilently(){
  if(__recoverTried) return false;
  __recoverTried = true;
  if(isDemo) return false;
  // V6.37 身份自愈：本机存在真实激活记录但当前 uid 被 URL 参数污染/错位时，
  // 先切回真实身份再判断 —— 解决「明明激活过却又要输码」「数据串到别人」。
  try{
    if(typeof findRealLicenseUid === 'function'){
      const real = findRealLicenseUid();
      const cur = getUid();
      if(real && real !== cur && !window.__DEMO_MODE__){
        localStorage.setItem('xhs_uid', real);
        LIC_STATE = getLicenseState();
        if(LIC_STATE.status === 'activated'){
          try{ Toast('已自动恢复你的工作台 ✅'); }catch(e){}
          setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 700);
          return true;
        }
      }
    }
  }catch(e){}
  if(typeof tryRecoverFromDevice !== 'function') return false;
  if(getLicenseState().status === 'activated') return false;
  const r = await tryRecoverFromDevice();
  if(r && r.ok){
    LIC_STATE = getLicenseState();
    try{ Toast('已自动恢复你的授权 ✅'); }catch(e){}
    setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 700);
    return true;
  }
  return false;
}
/* V6.37 身份校正：必须在 Store.load() 之前执行 —— 否则数据 key 会用错 uid 读写。
   有真实激活记录 → 确保 xhs_uid 与之一致；被污染的 uid 一律修正。 */
function healUidIdentity(){
  try{
    if(window.__DEMO_MODE__) return;
    const stored = (localStorage.getItem('xhs_uid')||'').trim();
    if(typeof findRealLicenseUid !== 'function') return;
    const real = findRealLicenseUid();
    if(real && real !== stored){ localStorage.setItem('xhs_uid', real); }
  }catch(e){}
}
function showLicenseGate(){
  // V6.33：先尝试静默找回，失败才显示激活门
  recoverLicenseSilently().then(ok=>{
    if(ok) return;
    $('#licenseGate').style.display = 'flex';
    const rec = $('#licRecoverTip');
    if(rec) rec.style.display = localStorage.getItem('xhs_revoked')==='1' ? 'none' : 'flex';
  });
  $('#licenseExpired').style.display = 'none';
  // 被卖家停用/云端吊销时，显示明确提示（区别于普通未激活）
  const revoked = localStorage.getItem('xhs_revoked')==='1';
  const revTip = $('#revokedTip');
  if(revTip) revTip.style.display = revoked ? 'flex' : 'none';
  const input = $('#licInput');
  if(input) input.placeholder = revoked ? '输入卖家提供的新激活码' : '输入激活码（如 CF-XXXX）';
  setTimeout(()=>{ const el=$('#licInput'); if(el) el.focus(); }, 100);
}
function showLicenseExpired(){
  $('#licenseExpired').style.display = 'flex';
  $('#licenseGate').style.display = 'none';
  const info = $('#expiredInfo');
  if(info) info.textContent = '有效期至 ' + (LIC_STATE.expireAt||'--') + ' 已结束，你的所有数据已完整保留，续费后即可继续使用。';
  // 渲染联系方式
  const box = $('#expContactBox'); if(!box) return;
  const ct = getContactInfo();
  let html = '';
  if(ct && (ct.wechat || ct.email)){
    let rows = '';
    if(ct.wechat) rows += '<div class="contact-row" style="background:rgba(255,255,255,.06);border-radius:9px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:10px"><span class="contact-label" style="color:rgba(255,255,255,.6);font-size:11.5px;min-width:36px">微信</span><span class="contact-val mono" style="color:#fff;flex:1;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(ct.wechat)+'</span><button class="mini-btn" data-copy="'+esc(ct.wechat)+'" onclick="copyText(this.dataset.copy)" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff;font-size:10px;padding:3px 8px">复制</button></div>';
    if(ct.email)  rows += '<div class="contact-row" style="background:rgba(255,255,255,.06);border-radius:9px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:10px"><span class="contact-label" style="color:rgba(255,255,255,.6);font-size:11.5px;min-width:36px">邮箱</span><span class="contact-val mono" style="color:#fff;flex:1;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(ct.email)+'</span><button class="mini-btn" data-copy="'+esc(ct.email)+'" onclick="copyText(this.dataset.copy)" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff;font-size:10px;padding:3px 8px">复制</button></div>';
    html = '<div style="font-size:11.5px;color:rgba(255,255,255,.6);margin-bottom:6px;letter-spacing:.5px">联系卖家</div>' + rows;
  }
  box.innerHTML = html;
}
async function doActivate(){
  const code = $('#licInput').value.trim();
  const msg = $('#licMsg');
  if(!code){ if(msg) msg.textContent='请输入激活码'; return; }
  // V6.33：体验模式下激活 → 必须先退回到真实空间，
  // 否则授权会写进 __DEMO__ 命名空间，退出体验后仍是未激活状态
  if(isDemo){
    try{ sessionStorage.removeItem('xhs_demo'); }catch(e){}
    window.__DEMO_MODE__ = false; isDemo = false;
    try{ const bn=document.getElementById('demoBanner'); if(bn) bn.style.display='none'; }catch(e){}
  }
  if(msg){ msg.style.color='var(--text3)'; msg.textContent='正在校验激活码…'; }
  const btn = $('#licBtn'); if(btn){ btn.disabled=true; btn.textContent='校验中…'; }
  const r = await tryActivate(code);
  if(msg){
    if(r.ok){ msg.style.color='var(--green)'; msg.textContent='✓ 激活成功！正在进入工作台…'; }
    else { msg.style.color='var(--red)'; msg.textContent=r.msg; }
  }
  if(btn){ btn.disabled=false; btn.textContent='激活'; }
  if(r.ok){
    LIC_STATE = getLicenseState();
    setTimeout(()=>{
      $('#licenseGate').style.display='none';
      // 数据 key 可能随 uid 变化，重新加载
      location.reload();
    }, 900);
  }
}
/* ================= V6.33 体验模式：独立数据空间，绝不碰真实数据 =================
 * 旧逻辑：体验模式只是把 sessionStorage 打个标记，Store 仍读写真实数据 key，
 * 导致「先体验 → 后激活」会把体验时产生的假数据带进真实工作台，
 * 反之老客户点一下体验就会在自己真实数据上操作 —— 数据串了。
 * 新逻辑：体验模式用独立 uid __DEMO__，数据/授权/工作区全部独立命名空间。
 */
/* V6.35 体验版专属链接：?demo=1 打开即进体验模式，无需先点按钮。
   用于发给潜在客户 —— 对方点开就是一套完整的演示账号，且绝不碰你的真实数据。 */
function isDemoUrl(){
  try{
    const v = new URLSearchParams(location.search).get('demo');
    return v === '1' || v === 'true' || v === 'demo';
  }catch(e){ return false; }
}
function enterDemoMode(){
  try{ sessionStorage.setItem('xhs_demo','1'); }catch(e){}
  window.__DEMO_MODE__ = true;
  try{ location.reload(); }catch(e){}
}
function exitDemoMode(){
  try{ sessionStorage.removeItem('xhs_demo'); }catch(e){}
  window.__DEMO_MODE__ = false;
  try{
    // 必须把 URL 上的 ?demo=1 摘掉，否则刷新又会回到体验模式
    const u = new URL(location.href);
    u.searchParams.delete('demo');
    u.searchParams.delete('from');   // 来源标记一并清掉，URL 保持干净
    location.replace(u.toString());
  }catch(e){ try{ location.reload(); }catch(e2){} }
}
/* 兜底：老 Service Worker 缓存的 index.html 里可能还残留这个按钮名，
   没有对应函数会在点击时报错 —— 这里统一兜住。 */
function openDemoExitMenu(){ exitDemoMode(); }
/* 判断本机是否有「真实」激活记录（体验模式下 uid 是 __DEMO__，读不到真实授权，
   只能扫一遍 localStorage）—— 用来决定横幅按钮文案。 */
function hasRealLicense(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.indexOf('xhs_license_')===0 && k!=='xhs_license___DEMO__'){
        const v = JSON.parse(localStorage.getItem(k)||'null');
        if(v && v.code) return true;
      }
    }
  }catch(e){}
  return false;
}
function buildDemoBanner(){
  const el = document.getElementById('demoBanner');
  if(!el) return;
  if(!isDemo){ el.style.display='none'; return; }
  el.style.display = 'flex';
  const btn = document.getElementById('demoBannerBtn');
  if(btn){
    if(hasRealLicense()){
      btn.textContent = '回到我的工作台';
      btn.onclick = exitDemoMode;
    }else{
      btn.textContent = '立即开通';
      btn.onclick = openDemoUpgrade;
    }
  }
  // V6.48 显示剩余 AI 体验次数（转化钩子：用完即激活）
  const badge = document.getElementById('demoAiBadge');
  if(badge && typeof demoAiLeft === 'function'){
    const left = demoAiLeft();
    badge.textContent = '🔥 AI 体验剩 ' + left + ' 次';
    badge.style.display = (left <= 0) ? 'none' : 'inline-flex';
  }
  // 从落地页来的：文案换成转化口径（他知道自己在免费体验，不用再强调"演示"）
  const tip = document.getElementById('demoBannerTip');
  if(tip && window.__DEMO_FROM__ === 'lp'){
    tip.innerHTML = '<b>免费体验版</b> · 随便点随便改，都是演示数据 · 觉得好用点右边开通，就是你自己全新的工作台';
  }
  // 横幅是 fixed 的，给页面底部留位，否则会挡住最后一块内容
  try{ document.body.style.paddingBottom = '58px'; }catch(e){}
}

/* V6.35 体验版 → 转化闭环：
   潜在客户体验完想买时，必须在这里就能拿到联系方式 / 去输入激活码，
   否则他只能关掉页面 —— 漏斗就断了。 */
function getSellerContact(){
  let wechat = 'R26184352Y', email = 'shim16506@gmail.com';
  try{
    const c = JSON.parse(localStorage.getItem('xhs_seller_contact')||'null');
    if(c){ if(c.wechat) wechat = c.wechat; if(c.email) email = c.email; }
  }catch(e){}
  return {wechat, email};
}
function openDemoUpgrade(){
  const c = getSellerContact();
  Modal.open('👑 开通你的专属工作台', `
    <div style="text-align:center;padding:4px 0 14px">
      <div style="font-size:38px;margin-bottom:8px">🚀</div>
      <div style="font-size:15px;font-weight:800;margin-bottom:6px">你现在玩的是演示账号</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.8">
        开通后你会得到一个<b>全新的、完全属于你自己的工作台</b>：<br>
        20+ 功能模块、AI 创作、电商带货、数据复盘全部开放，<br>手机上「添加到主屏幕」就是 App。
      </p>
    </div>
    <div style="background:var(--bg);border-radius:12px;padding:4px 14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)">
        <span style="font-size:13px;color:var(--text2)">微信</span><b style="font-size:14.5px">${esc(c.wechat)}</b>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0">
        <span style="font-size:13px;color:var(--text2)">邮箱</span><b style="font-size:14.5px">${esc(c.email)}</b>
      </div>
    </div>
    <button class="btn btn-red" style="width:100%;margin-bottom:8px" onclick="copyDemoContact()">📋 一键复制联系方式</button>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="openBuyPage()">看完整介绍</button>
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="demoGotoActivate()">我有激活码</button>
    </div>
    <p style="font-size:11.5px;color:var(--text3);text-align:center;margin-top:12px;line-height:1.7">
      体验数据是完全独立的，开通后不会带进你的工作台
    </p>`);
}
function copyDemoContact(){
  const c = getSellerContact();
  const text = '微信：' + c.wechat + '\n邮箱：' + c.email;
  function done(){ Toast('已复制，去微信粘贴即可 📋'); }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>{ legacyCopy(text); done(); });
  }else{ legacyCopy(text); done(); }
  function legacyCopy(v){
    const ta = document.createElement('textarea');
    ta.value = v; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }
}
function openBuyPage(){
  try{ window.open('buy.html', '_blank'); }catch(e){ location.href = 'buy.html'; }
}
function demoGotoActivate(){
  Modal.close();
  exitDemoMode();   // 退出后自动弹激活门，输入激活码即开通
}
function openRenew(){
  Modal.open('👑 联系卖家续费', `
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:40px;margin-bottom:10px">📩</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:8px">续费你的年度会员</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.8;margin-bottom:6px">请通过购买时的渠道联系卖家，<br>获取新的激活码。</p>
      <p style="font-size:12px;color:var(--text3)">续费后输入新激活码，你的全部数据会自动恢复。</p>
    </div>`);
}
function isPro(){
  return LIC_STATE.status==='activated';
}
function isPremium(){
  // V6.11.1 档位合并：尊享/标准统一为「年度会员」，所有功能对已激活会员开放
  // 未来恢复分档时：改为 isPro() && (LIC_STATE.plan==='尊享版' || ...)
  return isPro();
}
function proGuard(name){
  if(isPro()) return true;
  // V6.35 体验模式：开放工具界面与本地能力，让潜在客户真的能试出效果。
  // 真正烧额度的 AI 生成为 aiAsk 单独拦截（见 license.js），这里不重复拦。
  if(isDemo) return true;
  Toast('「'+name+'」为会员功能，激活后解锁 👑');
  return false;
}
function premiumGuard(name){
  if(isPremium()) return true;
  // V6.35 体验模式同理：界面与本地能力全开，AI 生成由 aiAsk 单独拦截
  if(isDemo) return true;
  Toast('「'+name+'」为尊享版功能 👑');
  return false;
}

/* ================= V6.0 主题色切换 ================= */
const THEMES = [
  {id:'black',  name:'曜石黑',  grad:'linear-gradient(135deg,#2c2c31,#4a4a52)'},
  {id:'red',    name:'品牌红',  grad:'linear-gradient(135deg,#ff3b30,#ff6b60)'},
  {id:'orange', name:'活力橙',  grad:'linear-gradient(135deg,#ff9500,#ffb340)'},
  {id:'green',  name:'湖水绿',  grad:'linear-gradient(135deg,#34c759,#5cd97a)'},
  {id:'blue',   name:'宝石蓝',  grad:'linear-gradient(135deg,#0a84ff,#5ac8fa)'},
  {id:'purple', name:'紫罗兰',  grad:'linear-gradient(135deg,#bf5af2,#d98aff)'},
  {id:'pink',   name:'糖果粉',  grad:'linear-gradient(135deg,#ff2d55,#ff5e7e)'}
];
function _themeColorKey(){ return window.__DEMO_MODE__ ? 'xhs_demo_theme_color' : 'xhs_theme_color'; }
function _themeColorDefault(){ return window.__DEMO_MODE__ ? 'black' : 'red'; }
/* ================= V6.48 扫码直达（GitHub 开源 qrcodejs） ================= */
function openShareQr(){
  const base = location.origin + location.pathname;
  Modal.open('📲 扫码打开工作台', `
    <div style="text-align:center;padding:6px 0 4px">
      <div id="qrBox" style="display:inline-block;background:#fff;padding:14px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.3)"></div>
      <div style="margin-top:14px;font-size:13px;font-weight:800">手机扫码，立即打开</div>
      <div style="font-size:11.5px;color:var(--text3);margin-top:6px;line-height:1.8">客户 / 朋友用手机扫一下，就能直接访问工作台。<br>发给客户前可先切到体验版再分享</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="buildQr('${base.replace(/'/g,"\'")}')">🔄 重新生成</button>
        <button class="btn btn-red btn-sm" style="flex:1" onclick="copyText(this,'${base.replace(/'/g,"\'")}')">📋 复制链接</button>
      </div>
    </div>`);
  buildQr(base);
}
function buildQr(url){
  const box = $('#qrBox'); if(!box) return;
  box.innerHTML = '';
  if(typeof QRCode === 'undefined'){ box.innerHTML = '<span style="color:var(--red);font-size:12px">组件未加载</span>'; return; }
  try{
    new QRCode(box, {text: url, width:210, height:210, colorDark:'#111', colorLight:'#ffffff', correctLevel: QRCode.CorrectLevel.M});
  }catch(e){ box.innerHTML = '<span style="color:var(--red);font-size:12px">生成失败</span>'; }
}

function applyThemeColor(){
  // V6.47：体验版默认「曜石黑」高级感（可用主题色板切换，偏好独立不影响正式版）；正式版跟随用户选择
  let t;
  try{ t = localStorage.getItem(_themeColorKey()) || _themeColorDefault(); }catch(e){ t = _themeColorDefault(); }
  document.body.setAttribute('data-theme', t);
}
function setThemeColor(t, el){
  try{ localStorage.setItem(_themeColorKey(), t); }catch(e){}
  applyThemeColor();
  // 视觉反馈：同组 swatch 选中态
  try{
    if(el && el.parentNode){
      el.parentNode.querySelectorAll('.theme-swatch').forEach(function(s){ s.classList.toggle('active', s===el); });
    }
  }catch(e){}
  Toast('主题色已切换 ✅');
  renderSettings();
}
function themePickerHtml(){
  const cur = (function(){ try{ return localStorage.getItem(_themeColorKey()) || _themeColorDefault(); }catch(e){ return _themeColorDefault(); } })();
  return '<div class="theme-picker">'+THEMES.map(function(x){
    // 使用 HTML 实体 &quot; 安全地在 onclick 内嵌单引号字符串
    return '<div class="theme-swatch '+(x.id===cur?'active':'')+'" data-t="'+x.id+'" title="'+x.name+'" onclick="setThemeColor(this, &quot;'+x.id+'&quot;)"></div>';
  }).join('')+'</div><div style="font-size:11px;color:var(--text3);margin-top:8px">黑色是默认主题（高级感）；其他彩色适合活泼人设。深色/浅色界面用右上角 🌙 切换</div>';
}

/* ================= V6.0 AI Key 客户自填（设置中心） ================= */
function saveLocalAiKey(){
  const v = ($('#aiKeyInput') && $('#aiKeyInput').value || '').trim();
  const msg = $('#aiKeyStatus');
  if(!v){ msg.innerHTML = '<span style="color:var(--red)">请先粘贴 Key</span>'; return; }
  if(!v.startsWith('sk-')){ msg.innerHTML = '<span style="color:var(--orange)">⚠️ Key 格式不像 DeepSeek 的（通常以 sk- 开头）</span>'; }
  setLocalAiKey(v);
  $('#aiKeyInput').value = '';
  if(msg.innerHTML.indexOf('color:var(--red)')>=0){ /* skip */ } else { msg.innerHTML = ''; }
  refreshAiKeyStatus();
  Toast('已保存 AI Key ✅');
}
function clearLocalAiKey(){
  setLocalAiKey('');
  if($('#aiKeyInput')) $('#aiKeyInput').value = '';
  refreshAiKeyStatus();
  Toast('已清除 AI Key');
}
function refreshAiKeyStatus(){
  const el = $('#aiKeyStatus'); if(!el) return;
  if(hasLocalAiKey()){
    const k = getLocalAiKey();
    const masked = k.length>8 ? k.slice(0,4) + '****' + k.slice(-4) : '****';
    el.innerHTML = '<span style="color:var(--green)">✓ 已配置</span> <span style="color:var(--text3);font-family:ui-monospace,Menlo,monospace">'+masked+'</span>';
  } else {
    el.innerHTML = '<span style="color:var(--text3)">⚠️ 暂未配置（AI 真生成功能将无法使用）</span>';
  }
}


function init(){
  // V6.33 体验模式隔离：必须在 Store.load() 之前确定，否则会读到真实数据
  // V6.35 支持 ?demo=1 链接直达（发给潜在客户的体验链接）
  if(sessionStorage.getItem('xhs_demo')==='1' || isDemoUrl()){
    window.__DEMO_MODE__ = true; isDemo = true;
    // V6.35 记录来源（落地页来的 → 文案换成转化口径）
    try{
      const f = new URLSearchParams(location.search).get('from');
      if(f) window.__DEMO_FROM__ = f;
    }catch(e){}
    try{ sessionStorage.setItem('xhs_demo','1'); }catch(e){}
  }
  // V6.33 防丢数据：保存是 260ms 防抖的，用户一保存就关标签页/切后台会丢。
  // 这里在页面隐藏/卸载时强制落盘（iOS Safari 只可靠触发 pagehide/visibilitychange）
  const __flushNow = ()=>{ try{ Store.flush(); }catch(e){} };
  window.addEventListener('beforeunload', __flushNow);
  window.addEventListener('pagehide', __flushNow);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') __flushNow(); });
  // V6.37 身份校正：必须在 Store.load() 之前，防止被污染/错位的 uid 读到错误数据
  healUidIdentity();
  Store.load();
  updateStreak();
  applyIcons();
  applyThemeColor();
  // 授权检查提前（侧边栏/会员中心需要真实的激活码到期信息）
  initLicense();
  updateSidebar();
  renderWsSwitcher();
  buildDemoBanner();
  // 明暗模式：默认浅色（白色界面 + 黑色品牌主色）；仅显式设置深色的用户保持深色
  const svgMoon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z"/></svg>';
  const svgSun  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  if(window.__DEMO_MODE__ || localStorage.getItem('xhs_theme')==='dark'){ document.body.classList.add('dark'); $('#themeBtn').innerHTML=svgSun; }
  $$('.nav-item, .tab-item').forEach(el=>{ if(el.id==='tabMeBtn') return; el.addEventListener('click', ()=>navigate(el.dataset.page)); });
  $('#menuBtn').addEventListener('click', ()=>{ $('#sidebar').classList.add('open'); $('#mask').classList.add('show'); });
  $('#mask').addEventListener('click', ()=>{ $('#sidebar').classList.remove('open'); $('#mask').classList.remove('show'); });
  $('#themeBtn').addEventListener('click', ()=>{ document.body.classList.toggle('dark'); const dark=document.body.classList.contains('dark'); $('#themeBtn').innerHTML=dark?svgSun:svgMoon; localStorage.setItem('xhs_theme', dark?'dark':'light'); });

  // V6.50 防缓存混版：版本升级后，SW 一接管新资源就静默刷新一次，
  // 避免「新版页面 + 旧版脚本」混着用导致图标丢失/样式错乱/功能异常
  try{
    if('serviceWorker' in navigator){
      let swRefreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        if(swRefreshed) return; swRefreshed = true;
        try{ location.reload(); }catch(e){}
      });
      // 首次打开检测到版本号变化（上次≠本次）也静默刷新一次，确保整包一致
      const prevVer = localStorage.getItem('xhs_ver_app');
      if(prevVer && prevVer !== VERSION.app){
        localStorage.setItem('xhs_ver_app', VERSION.app);
        setTimeout(function(){ try{ location.reload(); }catch(e){} }, 350);
      }else{
        localStorage.setItem('xhs_ver_app', VERSION.app);
      }
    }
  }catch(e){}
  $('#modalMask').addEventListener('click', ()=>Modal.close());
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ Modal.close(); return; }
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCommandPalette(); }
  });
  $('#searchBtn').addEventListener('click', openGlobalSearch);
  // 品牌启动页
  // Splash 品牌名固定 Crazy Friday.（用户工作台名只显示在侧边栏/顶栏）
  // V6.27 支持 ?page=xxx 直达指定页面（营销落地 / 分享直达 / 测试走查）
  try{
    const deepPage = new URLSearchParams(location.search).get('page');
    if(deepPage && PageMeta[deepPage]){ navigate(deepPage); }
    else navigate('dashboard');
  }catch(e){ navigate('dashboard'); }
  // V6.29 启动提速：splash 从 2.35s 砍到 0.9s（老用户 0.6s），打开即用
  const splashMs = (localStorage.getItem('xhs_sw_ver') || localStorage.getItem('xhs_last_visit')) ? 600 : 900;
  try{ localStorage.setItem('xhs_last_visit', String(Date.now())); }catch(e){}
  setTimeout(()=>{ const sp=$('#splash'); if(sp){ sp.classList.add('hide'); setTimeout(()=>{ if(sp) sp.style.display='none'; }, 320); } }, splashMs);
  // V6.9 新用户 4 页开屏引导（splash 结束后；已看过/老用户自动跳过）
  setTimeout(initIntro, splashMs + 150);
  if(LIC_STATE.status==='expired'){
    setTimeout(showLicenseExpired, 900);
  } else if(LIC_STATE.status==='pending' && !isDemo){
    setTimeout(showLicenseGate, 900);
  } else {
    if(Store._isNewUser && FEATURES.newOnboarding && !isDemo){
      setTimeout(showOnboarding, 1000);
    } else {
      setTimeout(showWelcome, 900);
      setTimeout(checkExpire, 1400);
      setTimeout(checkAppUpdate, 1600);
    }
  }
  // 使用统计（本地记录 + 云端心跳，只记时长不涉及内容）
  if(LIC_STATE.status==='activated'){
    try{
      const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(getUid()))||'null');
      touchUsage(lic);
      setTimeout(cloudHeartbeat, 3000);
    }catch(e){}
  }
  // 云端复查（吊销即时生效，不阻塞打开）
  if(LIC_STATE.status==='activated'){ setTimeout(()=>{ cloudRevalidate(); }, 1000); }
  // V6.6 PWA 全屏引导强化（检测 standalone / dismissed 后决定是否显示）
  if(LIC_STATE.status==='activated'){ setTimeout(showPwaInstallBanner, 1800); }
  // V6.7 每日变现日报自动拉取 + 存档 30 天
  if(LIC_STATE.status==='activated'){ setTimeout(()=>{ syncDailyReport().then(function(){ const d=getDailyReport(); if(d&&typeof saveReportToHistory==='function') saveReportToHistory(d); }); }, 2000); }
  // V6.6 账号风格档案 onboarding：新用户由 3 分钟初始化完成后衔接触发；老用户（非新）未建档则补一次
  if(LIC_STATE.status==='activated' && !Store._isNewUser && !localStorage.getItem('xhs_arch_onboarded')){
    setTimeout(openArchOnboarding, 3500);
  }
  // V6.4 自动运营周报（周一） + 发布到点提醒（延迟到其它弹窗之后）
  if(LIC_STATE.status==='activated'){
    setTimeout(()=>{ autoWeeklyReport(); }, 3800);
    setTimeout(()=>{ checkPublishRemind(); }, 4600);
  }
  // 体验模式标记
  if(isDemo || LIC_STATE.status==='pending'){
    const badge = document.createElement('div');
    badge.className = 'demo-badge';
    badge.textContent = '体验模式';
    badge.onclick = ()=>showLicenseGate();
    // P0 修复：不再 fixed 悬浮遮挡核心按钮，改插顶栏操作区弱化显示
    const topActions = document.querySelector('.topbar-actions');
    if(topActions) topActions.insertBefore(badge, topActions.firstChild);
    else document.body.appendChild(badge);
  }
  // V6.19 App 感：启动全局自动刷新（热点/日报每 60 秒），让数据"自己会动"
  // V6.52 修复：不再要求已激活——体验版/未激活用户同样看到实时更新的热点/机会（这是转化钩子，
  // 此前体验版发现页永远是死数据，还标着「自动更新」，被客户抓包「843 分钟前更新」）
  startAutoRefresh();
  // V6.23 自动更新检测（打开 + 每 10 分钟）
  if(LIC_STATE.status==='activated'){
    setTimeout(checkRemoteVersion, 3500);
    setInterval(checkRemoteVersion, 10*60*1000);
  }
}
/* ================= V6.4 自动运营周报（每周一打开自动生成） ================= */
function weekMondayKey(d){
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay()+6)%7)); // 回到本周一
  return fmtDate(x);
}
function buildWeeklyReport(){
  const d = Store.data;
  const now = new Date();
  const mon = weekMondayKey(now);
  const m = new Date(mon + 'T00:00:00');
  const s = fmtDate(new Date(m.getTime()-7*864e5));   // 上周一
  const e = fmtDate(new Date(m.getTime()-864e5));     // 上周日
  const inRange = x => x.date && x.date >= s && x.date <= e;
  const published = d.schedule.filter(x=>x.status==='published' && inRange(x)).length;
  const contents = d.contents.filter(inRange).length;
  const income = d.money.records.filter(inRange).reduce((a,b)=>a+(+b.income||0),0);
  const ov = d.analytics.overview || {};
  const likes = ov.likes7d||0, collects = ov.collects7d||0, comments = ov.comments7d||0, views = ov.views7d||0;
  const fans = ov.fans||0;
  // 规则化运营建议（AI 可选增强，此处先本地规则，稳定不依赖 Key）
  const tips = [];
  if(published===0) tips.push('上周没有已发布记录——本周至少排 3 篇，保持账号活跃是算法推荐的基础。');
  else if(likes>0 && collects>likes*2) tips.push('收藏明显高于点赞，内容「干货属性」强，建议把高收藏笔记做成系列持续输出。');
  else if(likes>0 && likes>collects*3) tips.push('点赞多但收藏少，内容偏「共鸣」但不够「实用」，正文加步骤/清单能提升收藏率。');
  if(income===0) tips.push('上周暂无收益记录。按你当前粉丝，参考报价约 '+((d.money.quote||[]).find(q=>parseInt((q.fans||'1k').split('-')[0].replace('k','000').replace('w','0000'))<=fans)||{price:'¥100-500'}).price+'，可主动私信 5 个同赛道品牌谈合作。');
  else tips.push('上周收益 ¥'+income+'，变现路径已验证——继续复制这个打法，尝试提价或接第二个品类。');
  tips.push('本周选题优先跟着「今日热门」AI 自动热点走，先做你数据最好的品类，稳定产出比数量更重要。');
  return {
    id: uid(), week: mon, range: s+' ~ '+e, date: todayStr(),
    stat: { published, contents, views, likes, collects, comments, fans, income },
    tips
  };
}
function autoWeeklyReport(){
  try{
    const d = Store.data;
    const cur = weekMondayKey(new Date());
    if(!d.weeklyReports) d.weeklyReports = [];
    if(d.weeklyReports.some(r=>r.week===cur)) return; // 本周已生成过
    const rep = buildWeeklyReport();
    d.weeklyReports.unshift(rep);
    if(d.weeklyReports.length>8) d.weeklyReports.pop();
    Store.save();
    const s = rep.stat;
    const cells = [['发布',s.published],['阅读',fmtNum(s.views)],['点赞',s.likes],['收藏',s.collects],['评论',s.comments],['收益','¥'+s.income]].map(function(x){
      return '<div style="background:var(--line2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:16px;font-weight:800;color:var(--red)">'+x[1]+'</div><div style="font-size:10px;color:var(--text3)">'+x[0]+'</div></div>';
    }).join('');
    // 若已有其它弹窗打开，不打扰用户：报告已存档，改 Toast 提示
    const modalBusy = (function(){ try{ const m=document.getElementById('modal'); return m && m.style.display==='flex'; }catch(e){ return false; } })();
    if(modalBusy){ Toast('📊 上周运营周报已生成，可去「数据复盘」查看'); return; }
    Modal.open('📊 上周运营周报 · 自动生成', `
      <div style="font-size:12px;color:var(--text3);margin-bottom:10px">统计周期：${rep.range} · 无需手动操作，每周一自动产出</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">${cells}</div>
      <div style="font-size:12.5px;font-weight:700;margin-bottom:6px">🤖 运营建议</div>
      <div style="font-size:12.5px;color:var(--text2);line-height:1.8">${rep.tips.map(t=>'<div style="padding:6px 0;border-bottom:1px solid var(--line)">• '+t+'</div>').join('')}</div>
      <button class="btn btn-red btn-block" style="margin-top:14px" onclick="Modal.close();navigate('analytics')">查看数据复盘 →</button>`);
  }catch(e){ console.error(e); }
}

/* ================= V6.6 账号风格档案 onboarding =================
 * 新激活用户首次进入工作台时引导建立专属人设档案，AI 全链路自动套用。
 * 用户可随时在「创作中心→账号人设」修改/添加/删除。
 */
function openArchOnboarding(){
  // V6.31 加固：已有其它弹窗（数据接入中心/周报/助理等）在展示时，不抢焦点 —— 等它关掉后再延迟弹出
  try{
    const m = document.getElementById('modal');
    if(m && m.style.display === 'flex'){
      setTimeout(function(){
        try{ const m2 = document.getElementById('modal'); if(m2 && m2.style.display !== 'flex') openArchOnboarding(); }catch(e){}
      }, 8000);
      return;
    }
  }catch(e){}
  Modal.open('📋 建立你的账号风格档案', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">这是新功能——告诉 AI 你的<b>账号定位 / 语气 / 内容风格</b>，以后所有 AI 生成的内容都会贴合你。<span style="color:var(--text3)">(3 分钟搞定，以后随时改)</span></p>
    <div class="form-group"><label class="label">你的账号赛道</label>
      <div class="select-pills">${['美妆','穿搭','美食','旅行','职场','情感','家居','学习','宠物','数码','健身','母婴'].map(function(c){return '<span class="chip" onclick="archSelCat(this,\''+c+')">'+c+'</span>';}).join('')}</div>
      <input id="archCat" placeholder="或自定义输入赛道" style="margin-top:8px">
    </div>
    <div class="form-group"><label class="label">语气风格</label>
      <div class="select-pills">${['温柔亲切','活泼俏皮','专业干练','真诚走心','犀利直接','自然日常'].map(function(t){return '<span class="chip" onclick="archSelTone(this,&quot;'+t+'&quot;)">'+t+'</span>';}).join('')}</div>
    </div>
    <div class="form-group"><label class="label">emoji 使用习惯</label>
      <div class="select-pills">${['适量使用','基本不用','多用活泼','少用克制'].map(function(e){return '<span class="chip" onclick="archSelEmoji(this,\''+e+'\')">'+e+'</span>';}).join('')}</div>
    </div>
    <div class="form-group"><label class="label">段落节奏</label>
      <div class="select-pills">${['短段落口语化','中等条理清晰','长段落深度内容','清单式干货直给'].map(function(r){return '<span class="chip" onclick="archSelRhythm(this,\''+r+'\')">'+r+'</span>';}).join('')}</div>
    </div>
    <div class="form-group"><label class="label">补充描述（可选 · 口头禅/表达习惯）</label>
      <input id="archDesc" placeholder="如：自称本宫、爱用「家人们」、经常放前后对比图">
    </div>
    <div style="font-size:10.5px;color:var(--text3);margin:6px 0 12px">✅ 保存后 AI 所有输出（含一键全流程/8 大工具）都会自动套用这套风格</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="skipArchOnboarding()">稍后再说</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveArchOnboarding()">📋 建立档案</button>
    </div>`);
  // 初始化选中态
  window.__arch = { cat:'', tone:'自然日常', emoji:'适量使用', rhythm:'短段落口语化' };
  archSelTone(null, '自然日常'); archSelEmoji(null, '适量使用'); archSelRhythm(null, '短段落口语化');
}
function archSelCat(el, v){
  window.__arch.cat = v;
  if(el){
    $$(el.parentNode.children).forEach(function(x){ x.classList.remove('active'); });
    el.classList.add('active');
    const inp = $('#archCat'); if(inp) inp.value = '';
  }
}
function archSelTone(el, v){ window.__arch.tone=v; if(el){ $$(el.parentNode.children).forEach(function(x){x.classList.remove('active');});el.classList.add('active');} }
function archSelEmoji(el, v){ window.__arch.emoji=v; if(el){ $$(el.parentNode.children).forEach(function(x){x.classList.remove('active');});el.classList.add('active');} }
function archSelRhythm(el, v){ window.__arch.rhythm=v; if(el){ $$(el.parentNode.children).forEach(function(x){x.classList.remove('active');});el.classList.add('active');} }
function saveArchOnboarding(){
  const arch = window.__arch || {};
  const cat = ($('#archCat')&&$('#archCat').value.trim()) || arch.cat || '综合';
  const desc = ($('#archDesc')&&$('#archDesc').value.trim()) || '';
  const p = {
    id: uid(),
    name: cat + '·' + arch.tone,
    tone: arch.tone,
    emoji: arch.emoji,
    rhythm: arch.rhythm,
    desc: desc,
    date: todayStr()
  };
  const ps = getPersonas();
  ps.unshift(p);
  Store.save();
  localStorage.setItem('xhs_persona_id', p.id);
  localStorage.setItem('xhs_arch_onboarded', '1');
  // 写入 userProfile.onboarded（兼容旧字段）
  if(Store.data && Store.data.userProfile) Store.data.userProfile.onboarded = true;
  Store.save();
  Modal.close();
  Toast('✅ 账号人设已建立：'+p.name+' · 所有 AI 输出已自动套用');
}
function skipArchOnboarding(){
  localStorage.setItem('xhs_arch_onboarded', '1');
  Modal.close();
}

/* ================= V6.6 PWA 全屏引导强化 =================
 * 首次进入工作台（非 standalone / 未永久关闭）→ 顶部蓝色横幅，
 * 区分 iOS Safari / Android Chrome 引导步骤，可关闭（永久）。
 */
function showPwaInstallBanner(){
  try{
    // V6.44：关闭后 7 天再温和提醒（避免一次错过永不再提示），上限 3 次
    const dismissedAt = localStorage.getItem('xhs_pwa_dismissed') || '';
    if(dismissedAt && (Date.now() - new Date(dismissedAt).getTime()) < 7*864e5) return;
    const shown = parseInt(localStorage.getItem('xhs_pwa_shown_count')||'0',10);
    if(shown >= 3) return; // 最多展示 3 次
    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if(isStandalone) return;
    localStorage.setItem('xhs_pwa_shown_count', String(shown+1));
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/Android/.test(ua);
    const isAndroid = /Android/.test(ua);
    const tip = isIOS ? 'Safari 点「分享」⬆️ → 添加到主屏幕'
                    : isAndroid ? 'Chrome 菜单 ⋮ → 添加到主屏幕'
                    : '浏览器菜单 → 添加到主屏幕';
    const html = '<div class="pwa-banner" id="pwaBanner">' +
      '<span class="pwa-ico"><img src="icon-192.png" alt="Crazy Friday"></span>' +
      '<div class="pwa-body"><div class="pwa-title">添加到主屏幕 · 像 App 一样使用</div>' +
      '<div class="pwa-tip">无地址栏 · 全屏体验 · 图标直达 · 离线可用<br>' + tip + '</div></div>' +
      '<button class="pwa-close" onclick="dismissPwaBanner()" aria-label="暂不">✕</button>' +
    '</div>';
    const old = $('#pwaBanner'); if(old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    // 12 秒后自动关闭，避免长期占用屏幕
    setTimeout(dismissPwaBanner, 12000);
  }catch(e){}
}
function dismissPwaBanner(){
  try{ localStorage.setItem('xhs_pwa_dismissed', new Date().toISOString()); }catch(e){}
  const el = $('#pwaBanner'); if(el) el.classList.add('fade');
  setTimeout(function(){ if(el) el.remove(); }, 280);
}

/* ================= V6.4 发布到点自动提醒 ================= */
function checkPublishRemind(){
  try{
    const today = todayStr();
    const due = Store.data.schedule.filter(x=>x.date===today && (x.status==='draft'||x.status==='ready'));
    if(!due.length) return;
    setTimeout(()=>{ Toast('📅 今天有 '+due.length+' 篇计划待发布，别忘啦'); }, 500);
  }catch(e){}
}

/* ================= 品牌启动页 ================= */

/* ================= V6.16 AI 生图（SiliconFlow 代理，客户自填 Key） ================= */
function openImageGen(){
  if(!premiumGuard('AI 生图')) return;
  const hasKey = getLocalImgKey() ? '<span style="color:var(--green)">已保存 ✓</span>' : '<span style="color:var(--orange)">未设置</span>';
  Modal.open('🎨 AI 生图', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">输入画面描述，AI 生成小红书配图（插画 / 实景 / 3D / 国风）。按张计费约 0.1-0.5 元，由你的 Key 支付（<b>可选</b>）：填一次 SiliconFlow Key 即可使用。<a href="https://cloud.siliconflow.cn" target="_blank" rel="noopener" style="color:var(--red2)">注册拿 Key →</a>（不想填 Key？用「🖼️ 图文卡片」零成本排版配图）</p>
    <div class="form-group"><label class="label">画面描述</label><textarea id="igKw" rows="3" placeholder="如：清晨窗边的咖啡杯，日式极简风，柔和光线，俯拍"></textarea></div>
    <div class="form-group"><label class="label">风格提示</label>
      <div class="select-pills" id="igStyleP">${['插画风','写实摄影','3D 渲染','国风水墨','扁平插画','奶油甜系'].map((s,i)=>`<span class="chip ${i===0?'active':''}" onclick="setIgStyle('${s}',this)">${s}</span>`).join('')}</div>
    </div>
    <div class="form-group"><label class="label">画幅</label>
      <div class="select-pills" id="igSizeP">
        <span class="chip active" onclick="setIgSize('1:1',this)">1:1 方图</span>
        <span class="chip" onclick="setIgSize('3:4',this)">3:4 竖版</span>
        <span class="chip" onclick="setIgSize('4:3',this)">4:3 横版</span>
      </div>
    </div>
    <div class="form-group"><label class="label">模型 <span style="font-size:11px;color:var(--text3)">（FLUX 免费但部分账户禁用，可换）</span></label>
      <select id="igModel" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);font-size:13px">
        <option value="black-forest-labs/FLUX.1-schnell">FLUX.1-schnell（免费·速度快）</option>
        <option value="Qwen/Qwen-Image">Qwen-Image（阿里·质量高）</option>
        <option value="stabilityai/stable-diffusion-2-1">Stable Diffusion 2.1（稳定）</option>
        <option value="">自定义（下方填）</option>
      </select>
    </div>
    <div class="form-group"><label class="label">SiliconFlow API Key <span id="igKeyStatus" style="font-size:11px;color:var(--text3)">${hasKey}</span></label><input id="igKey" type="password" placeholder="sk-..." value="" oninput="onIgKeyInput()"></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="runIgTest()">🔌 一键测试 Key（自动选可用模型）</button>
      <button class="btn btn-red" style="flex:1.4" onclick="runImageGen()">🎨 开始生图</button>
    </div>
    <div id="igTestOut" style="margin-top:8px"></div>
    <div id="igOut" style="margin-top:4px"></div>`, true);
}
function onIgKeyInput(){
  const v = ($('#igKey')&&$('#igKey').value||'').trim();
  const s = document.getElementById('igKeyStatus');
  if(!s) return;
  if(v.length>10){ s.textContent='输入中…保存后即生效'; s.style.color='var(--text2)'; }
  else { s.textContent = getLocalImgKey() ? '已保存 ✓' : '未设置'; s.style.color=getLocalImgKey()?'var(--green)':'var(--orange)'; }
}
/* 一键测试 Key：查询账户可用模型 → 自动更新下拉 + 选中第一个可用 */
async function runIgTest(){
  const key = ($('#igKey')&&$('#igKey').value||'').trim();
  if(key) setLocalImgKey(key);
  const out = document.getElementById('igTestOut');
  if(!out) return;
  if(!getLocalImgKey()){ out.innerHTML='<div style="color:var(--orange);font-size:12px">请先在上方填入 SiliconFlow API Key</div>'; return; }
  out.innerHTML='<div class="loading" style="padding:8px 0">正在测试 Key 并查询可用模型…</div>';
  const r = await aiImageTest();
  if(!r.ok){
    out.innerHTML='<div style="background:var(--soft-red);border:1px solid rgba(194,59,82,.2);border-radius:10px;padding:10px 12px;color:var(--red);font-size:12.5px;line-height:1.7">⚠️ 测试失败：'+esc(r.msg||'未知错误')+'</div>';
    return;
  }
  const models = r.models || [];
  if(!models.length){
    out.innerHTML='<div style="background:var(--soft-orange);border-radius:10px;padding:10px 12px;color:var(--orange);font-size:12.5px;line-height:1.7">✓ Key 有效，但账户暂无可用生图模型。<br>请到 SiliconFlow「模型广场」搜索 FLUX 或 Qwen-Image 并点击「立即使用」（0 元开通）。</div>';
    return;
  }
  // 更新模型下拉为账户可用模型
  const sel = document.getElementById('igModel');
  const map = { 'black-forest-labs/FLUX.1-schnell':'FLUX.1-schnell（免费·快）','Qwen/Qwen-Image':'Qwen-Image（阿里·质量高）','stabilityai/stable-diffusion-xl-base-1.0':'SDXL 1.0','stabilityai/stable-diffusion-2-1':'SD 2.1','Kwai-Kolors/Kolors':'Kolors（快手·写实）','ByteDance/SDXL-Lightning':'SDXL-Lightning（字节·极速）' };
  const opts = models.map(m=>'<option value="'+m+'">'+(map[m]||m.split('/').pop())+'</option>').join('');
  if(sel) sel.innerHTML = opts;
  // 默认选第一个，生图直接用
  out.innerHTML='<div style="background:var(--soft-green);border:1px solid rgba(52,199,89,.25);border-radius:10px;padding:10px 12px;color:var(--green);font-size:12.5px;line-height:1.8">✅ Key 有效！检测到 <b>'+models.length+'</b> 个可用模型，已自动选择第一个：<b>'+models[0]+'</b><br>直接点「🎨 开始生图」即可（失败会自动切换下一个模型）</div>';
}
let igSize = '1:1', igStyle = '插画风';
function setIgSize(s,el){ igSize=s; $$('#igSizeP .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); }
function setIgStyle(s,el){ igStyle=s; $$('#igStyleP .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); }
async function runImageGen(){
  const kw = $('#igKw').value.trim(); if(!kw){ Toast('请输入画面描述'); return; }
  const key = $('#igKey').value.trim(); if(key) setLocalImgKey(key);
  const out = $('#igOut');
  out.innerHTML = '<div class="loading">AI 正在生成图片…（约 10-30 秒，请耐心等待）</div>';
  const prompt = (igStyle && igStyle!=='插画风' ? igStyle + '风格。' : '') + kw + '。小红书笔记配图，构图完整，主体突出，无文字无水印。';
  const model = ($('#igModel')&&$('#igModel').value) || '';
  const r = await aiImageAsk(prompt, igSize, model);
  if(!r.ok){
    const help = (r.msg||'').indexOf('Model')>=0 || (r.msg||'').indexOf('disabled')>=0
      ? '<div style="margin-top:8px;font-size:12px;color:var(--text2);line-height:1.7">💡 <b>当前模型在你账户被禁用</b>，请：<br>① 去 <a href="https://cloud.siliconflow.cn/account" target="_blank" style="color:var(--red2)">SiliconFlow 账户后台</a> 确认余额/实名状态<br>② 或在本弹窗「模型」下拉切换为 <b>Qwen-Image / SD 2.1</b></div>'
      : '';
    out.innerHTML = '<div style="background:var(--soft-red);border:1px solid rgba(194,59,82,.2);border-radius:10px;padding:12px 14px;color:var(--red);font-size:13px;line-height:1.7">⚠️ 生图失败：'+esc(r.msg||'未知错误')+help+'</div>';
    return;
  }
  const src = r.b64 ? ('data:image/' + (r.format||'png') + ';base64,' + r.b64) : r.url;
  out.innerHTML = `<div style="text-align:center">
    <img src="${src}" style="max-width:100%;max-height:520px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.14)" />
    <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-red btn-sm" onclick="downloadImg('${src}','ai_${Date.now()}')">⬇️ 下载图片</button>
      <button class="btn btn-ghost btn-sm" onclick="runImageGen()">🔄 再生成一张</button>
    </div>
  </div>`;
}
function downloadImg(src, name){
  const a = document.createElement('a');
  a.href = src; a.download = (name||'image') + '.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

/* ================= V6.18 图生文（上传图片 → AI 视觉 → 小红书文案） ================= */
function compressImageFile(file, maxW, cb){
  const reader = new FileReader();
  reader.onload = e=>{
    const img = new Image();
    img.onload = ()=>{
      try{
        const scale = Math.min(1, (maxW||1080)/Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width*scale));
        c.height = Math.max(1, Math.round(img.height*scale));
        const ctx = c.getContext('2d');
        ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.85));
      }catch(err){ cb(''); }
    };
    img.onerror = ()=>{ cb(''); };
    img.src = e.target.result;
  };
  reader.onerror = ()=>{ cb(''); };
  reader.readAsDataURL(file);
}
let visionMode = 'auto';
function openVisionGen(){
  if(!premiumGuard('图生文')) return;
  const hasKey = getLocalImgKey() ? '<span style="color:var(--green)">已保存 ✓</span>' : '<span style="color:var(--orange)">未设置</span>';
  Modal.open('🔍 图生文', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">上传一张图片，AI 看懂图片内容并生成<b>小红书可直接发布的文案</b>。适合：产品图→种草笔记、截图→干货笔记、海报→推荐文案。<b>成本归自己</b>（与 AI 生图共用 SiliconFlow Key，一次约 0.1-0.3 元）。</p>
    <div class="form-group"><label class="label">上传图片（自动压缩，最大 1080px）</label>
      <input type="file" accept="image/*" id="vgFile" style="border:1px dashed var(--line);padding:14px;border-radius:10px;background:var(--line2);cursor:pointer" onchange="previewVisionImage(this)">
      <img id="vgPrev" style="display:none;max-width:100%;max-height:240px;border-radius:10px;margin-top:8px;box-shadow:var(--shadow-md)">
    </div>
    <div class="form-group"><label class="label">生成模式</label>
      <div class="select-pills" id="vgModeP">
        <span class="chip active" onclick="setVisionMode('auto',this)">🧠 智能识别</span>
        <span class="chip" onclick="setVisionMode('goods',this)">📦 产品种草</span>
        <span class="chip" onclick="setVisionMode('screenshot',this)">📷 截图干货</span>
        <span class="chip" onclick="setVisionMode('custom',this)">✍️ 自定义要求</span>
      </div>
    </div>
    <div class="form-group" id="vgCustomWrap" style="display:none"><label class="label">你的要求</label><textarea id="vgCustom" rows="2" placeholder="如：用轻松口语写 3 个标题 + 400 字正文 + 5 个标签"></textarea></div>
    <div class="form-group"><label class="label">SiliconFlow API Key <span style="font-size:11px;color:var(--text3)">${hasKey}（只存本机，生图/图生文共用）</span></label><input id="vgKey" type="password" placeholder="sk-..." value=""></div>
    <button class="btn btn-red btn-block" onclick="runVisionGen()">🔍 开始图生文</button>
    <div id="vgOut" style="margin-top:14px"></div>`, true);
}
function setVisionMode(m,el){ visionMode=m; $$('#vgModeP .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); document.getElementById('vgCustomWrap').style.display = m==='custom' ? '' : 'none'; }
function previewVisionImage(input){
  const f = input.files && input.files[0];
  const prev = document.getElementById('vgPrev');
  if(!f || !prev) return;
  compressImageFile(f, 1080, dataURL=>{
    if(!dataURL){ Toast('图片读取失败'); return; }
    prev.src = dataURL; prev.style.display = 'block';
  });
}
async function runVisionGen(){
  const fileEl = document.getElementById('vgFile');
  const f = fileEl && fileEl.files && fileEl.files[0];
  if(!f){ Toast('请先选择一张图片'); return; }
  const key = document.getElementById('vgKey').value.trim();
  if(key) setLocalImgKey(key);
  const out = document.getElementById('vgOut');
  out.innerHTML = '<div class="loading">AI 正在看图并创作…（约 10-25 秒，请耐心等待）</div>';
  compressImageFile(f, 1080, async dataURL=>{
    if(!dataURL){ out.innerHTML = '<div style="color:var(--red);font-size:13px">图片读取失败，请换一张</div>'; return; }
    const custom = document.getElementById('vgCustom').value.trim();
    const prompt = visionMode==='auto'
      ? '请仔细观察这张图片，基于图片真实内容生成一条可直接发布的小红书笔记文案。要求：【标题】3 个备选（数字+场景+卖点，一行一个）【正文】400-600 字，口语化、含适量 emoji、分 3-4 段【话题标签】5-8 个。内容必须贴合图片里的实际信息，不要编造图片里不存在的东西。'
      : visionMode==='goods'
        ? '这是一张产品图。请基于图片中产品的真实外观、颜色、场景，生成一条「产品种草笔记」：标题 3 个（突出卖点）+ 正文 400-600 字（真实体验口吻 + 使用场景 + 卖点拆解）+ 话题标签 5-8 个。只描述图片里看得到的内容。'
        : visionMode==='screenshot'
          ? '这是一张截图。请识别图中内容，生成一条「干货整理笔记」：把图片信息提炼成要点，输出标题 3 个 + 正文 400-600 字（结构化要点）+ 话题标签 5-8 个。'
          : (custom || '请基于这张图片生成一条小红书笔记文案：标题 3 个 + 正文 400-600 字 + 话题标签 5-8 个。');
    const r = await aiVisionAsk(dataURL, prompt);
    if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:13px;line-height:1.8">'+esc(r.msg||'图生文失败')+'</div>'; return; }
    out.innerHTML = '<div style="font-size:11.5px;color:var(--text3);margin-bottom:8px">📝 图生文结果（点击任意处复制）</div>' +
      '<div class="out-item" onclick="copyText(this,\'' + esc(r.text.replace(/'/g,"\\'")) + '\')" style="white-space:pre-wrap;font-size:13px;line-height:1.9;cursor:pointer"><span class="out-copy">复制</span>' + esc(r.text) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-ghost btn-sm" style="flex:1" onclick="runVisionGen()">🔄 换一篇</button>' +
      '<button class="btn btn-red btn-sm" style="flex:1" onclick="openCardMakerFromVision()">🖼️ 直接做图文卡片</button></div>';
    // 记忆最近结果供卡片生成器使用
    try{ localStorage.setItem('xhs_vision_last', JSON.stringify({title:'AI 图生文笔记', body:r.text, ts:Date.now()})); }catch(e){}
  });
}
function openCardMakerFromVision(){
  Modal.close();
  setTimeout(()=>{ openCardMaker(true); }, 120);
}

/* ================= V6.20 标题打分器（AI 评估 + 优化） ================= */
function openTitleScorer(){
  if(!premiumGuard('标题打分')) return;
  // 预填最近生成的内容
  const d = Store.data;
  const last = (d.history && d.history.length) ? d.history[d.history.length-1] : null;
  Modal.open('📊 标题打分器', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">输入或粘贴你的标题，AI 给出 <b>0-100 分</b>与<b>5 个优化方向</b>。开箱即用，无需配置。</p>
    <div class="form-group"><label class="label">你的标题（粘贴现有，或临时打分）</label><input id="tsInput" placeholder="如：油皮亲妈粉底液实测，带妆 12 小时不脱妆" value="${esc(last&&last.title?last.title:'')}" style="font-size:14px"></div>
    <div class="form-group"><label class="label">所属赛道（帮助 AI 更精准评分）</label>
      <div class="select-pills" id="tsCatP">${['美妆','穿搭','美食','旅行','职场','情感','家居','学习','宠物','数码','健身','母婴','其他'].map((c,i)=>`<span class="chip ${i===0?'active':''}" onclick="setTsCat(this)">${c}</span>`).join('')}</div>
    </div>
    <button class="btn btn-red btn-block" onclick="runTitleScorer()">📊 开始打分</button>
    <div id="tsOut" style="margin-top:14px"></div>`, true);
}
let __tsCat = '美妆';
function setTsCat(el){
  __tsCat = el.textContent;
  $$('#tsCatP .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active');
}
async function runTitleScorer(){
  const title = $('#tsInput').value.trim();
  if(!title){ Toast('请输入标题'); return; }
  const out = $('#tsOut');
  out.innerHTML = '<div class="loading">AI 正在评估标题（深度分析中，约 10-20 秒）…</div>';
  const prompt = `你是一名资深小红书运营专家，专长标题优化。请对以下标题打分（0-100）并给出具体优化方向。

标题：「${title}」
赛道：${__tsCat}

请严格按以下结构输出（不要任何其他废话）：
【总分】XX/100
【诊断】用 2-3 句话说明这个标题在「数字/场景/卖点/情绪/长度/钩子」6 个维度上的表现
【5 个优化方向】每条 1 句话，可直接落地改进
【3 个改写示范】基于以上优化方向，给出 3 个具体的改写版本（保留核心信息，但更有吸引力）

要求：评分严格、诊断具体、改写可发布。`;
  const r = await aiAsk(prompt, '你是小红书标题专家，只输出 JSON 之外的人话，按要求结构输出。');
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:13px">'+esc(r.msg||'打分失败')+'</div>'; return; }
  // 解析输出
  const text = r.text;
  const scoreMatch = text.match(/【总分】\s*(\d{1,3})/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
  const scoreColor = score==null ? 'var(--text2)' : score>=80 ? 'var(--green)' : score>=60 ? 'var(--orange)' : 'var(--red)';
  // 把【...】结构转 HTML
  const html = text
    .replace(/【总分】\s*(\d{1,3})[^\n]*/g, (m,n)=>`<div style="display:flex;align-items:center;gap:14px;background:var(--line2);border-radius:14px;padding:16px 18px;margin-bottom:12px">
      <div style="font-size:36px;font-weight:900;color:${scoreColor};line-height:1">${n}</div>
      <div style="font-size:11px;color:var(--text3);line-height:1.4">/ 100<br>综合评分</div>
    </div>`)
    .replace(/【诊断】([\s\S]*?)(?=【|$)/g, '<div class="card" style="background:var(--line2);border-color:transparent;padding:12px 14px;margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:4px">📋 诊断</div><div style="font-size:13px;line-height:1.7">$1</div></div>')
    .replace(/【5 个优化方向】([\s\S]*?)(?=【|$)/g, '<div class="card" style="background:var(--soft-red);border-color:transparent;padding:12px 14px;margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:4px">🎯 5 个优化方向</div><div style="font-size:13px;line-height:1.9;white-space:pre-wrap">$1</div></div>')
    .replace(/【3 个改写示范】([\s\S]*?)(?=【|$)/g, '<div class="card" style="background:var(--soft-green);border-color:transparent;padding:12px 14px"><div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:4px">✨ 3 个改写示范（点击复制）</div><div style="font-size:13px;line-height:1.9;white-space:pre-wrap">$1</div></div>')
    .replace(/\n/g, '<br>');
  out.innerHTML = '<div style="font-size:11.5px;color:var(--text3);margin-bottom:8px">📊 标题评分结果</div>' + html +
    '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-ghost btn-sm" style="flex:1" onclick="runTitleScorer()">🔄 重新打分</button>' +
    '<button class="btn btn-red btn-sm" style="flex:1" onclick="openCardMaker(false)">🖼️ 用高分改写做卡片</button></div>';
}

/* ================= V6.16 图文卡片生成器（Canvas 排版，零成本） ================= */
const CARD_TPL = [
  { name:'杂志大字报', bg:['var(--red)','var(--red2)'], ink:'#ffffff', sub:'#ffd0d8', body:'#17171c', bodyBg:'#ffffff', accent:'var(--red)' },
  { name:'渐变极简',   bg:['#ff6b8b','#ffa8bd'], ink:'#ffffff', sub:'rgba(255,255,255,.82)', body:'#17171c', bodyBg:'#ffffff', accent:'var(--red)' },
  { name:'深色质感',   bg:['#1b1b21','#2a2a33'], ink:'#ffffff', sub:'#ff8aa6', body:'#e8e8ee', bodyBg:'#ffffff', accent:'var(--red)' },
  { name:'奶油简约',   bg:['#fff4ea','#ffe8d6'], ink:'#3a2417', sub:'#a06a44', body:'#17171c', bodyBg:'#ffffff', accent:'#e8602f' },
  // V6.19 新增模板（更精美 + 适合多场景）
  { name:'电商白底',   bg:['#ffffff','#fafafa'], ink:'#17171c', sub:'#8a8a92', body:'#3a3a42', bodyBg:'#ffffff', accent:'#17171c' },
  { name:'手账风',     bg:['#fef7e6','#fde4c0'], ink:'#5a3a1a', sub:'#a06a3a', body:'#3a2410', bodyBg:'#fffdf5', accent:'#d96a3a' },
  { name:'莫兰迪',     bg:['#a8c0b6','#d9e4dd'], ink:'#2c3e33', sub:'#5c6f63', body:'#2c3e33', bodyBg:'#f7faf8', accent:'#5c8a76' },
  { name:'赛博',       bg:['#1a1a2e','#16213e'], ink:'#ffffff', sub:'#00d4ff', body:'#e8e8ee', bodyBg:'#0f0f1a', accent:'#00d4ff' },
  // V6.20 新增：插画/ins 风
  { name:'插画风',     bg:['#fef0e4','#fbd5b5'], ink:'#5a3a1a', sub:'#b06a3a', body:'#3a2410', bodyBg:'#fffaf2', accent:'#d97744' }
];
let cardTpl = 0;
function openCardMaker(useVision){
  if(!premiumGuard('图文卡片')) return;
  const d = Store.data;
  let preTitle = '', preBody = '';
  if(useVision){
    try{ const v = JSON.parse(localStorage.getItem('xhs_vision_last')||'null'); if(v){ preTitle = v.title||''; preBody = v.body||''; } }catch(e){}
  } else {
    const last = (d.history && d.history.length) ? d.history[d.history.length-1] : null;
    preTitle = last&&last.title?last.title:'';
    preBody = last&&last.body?last.body:'';
  }
  Modal.open('🖼️ 图文卡片生成器', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">把文案一键排版成小红书 <b>3:4 竖版配图</b>（封面 + 正文分页），下载后直接发。零成本，无需任何 Key。<span style="color:var(--green)">9 套模板 · 支持封面图混排 · 纯净无水印</span>。</p>
    <div class="form-group"><label class="label">标题（封面大字）</label><input id="cmTitle" placeholder="如：早八 5 分钟伪素颜公式" value="${esc(preTitle)}"></div>
    <div class="form-group"><label class="label">副标题（封面小字，可选）</label><input id="cmSub" placeholder="如：通勤懒人友好 · 5 步搞定" value=""></div>
    <div class="form-group"><label class="label">封面图（可选，自动适配 3:4）</label>
      <input type="file" accept="image/*" id="cmImgFile" style="border:1px dashed var(--line);padding:10px;border-radius:10px;background:var(--line2);cursor:pointer" onchange="previewCmImage(this)">
      <img id="cmImgPrev" style="display:none;max-width:100%;max-height:160px;border-radius:8px;margin-top:8px">
      <div id="cmImgHint" style="display:none;font-size:11px;color:var(--green);margin-top:4px">✓ 已选封面图，将作为背景叠加文字</div>
    </div>
    <div class="form-group"><label class="label">正文（自动分页，最多 3 页）</label><textarea id="cmBody" rows="5" placeholder="把生成好的文案粘贴进来">${esc(preBody)}</textarea></div>
    <div class="form-group"><label class="label">模板 <span style="font-size:11px;color:var(--text3)">（选一个生成，或一键全出对比）</span></label>
      <div class="select-pills" id="cmTplP">${CARD_TPL.map((t,i)=>`<span class="chip ${i===0?'active':''}" onclick="setCardTpl(${i},this)">${t.name}</span>`).join('')}</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-red" style="flex:1" onclick="genCards(false)">🖼️ 生成当前模板</button>
      <button class="btn btn-black" style="flex:1" onclick="genCards(true)">🎲 9 套全出（对比）</button>
    </div>
    <div id="cmOut" style="margin-top:14px"></div>`, true);
}
let __cmCoverImg = null;
function previewCmImage(input){
  const f = input.files && input.files[0];
  if(!f){ __cmCoverImg = null; return; }
  compressImageFile(f, 1080, dataURL=>{
    if(!dataURL){ Toast('图片读取失败'); return; }
    __cmCoverImg = dataURL;
    const prev = document.getElementById('cmImgPrev'); if(prev){ prev.src = dataURL; prev.style.display = 'block'; }
    const hint = document.getElementById('cmImgHint'); if(hint) hint.style.display = 'block';
  });
}
function setCardTpl(i,el){ cardTpl=i; $$('#cmTplP .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); }
function wrapLines(ctx, text, maxW){
  const paras = String(text||'').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
  const lines = [];
  paras.forEach(p=>{
    let cur = '';
    for(const ch of p){
      const test = cur + ch;
      if(ctx.measureText(test).width > maxW && cur){ lines.push(cur); cur = ch; }
      else cur = test;
    }
    if(cur) lines.push(cur);
    lines.push(''); // 段间空行
  });
  return lines.filter((l,i)=>!(l==='' && lines[i-1]===''));
}
function drawCardPage(canvas, o){
  const W=1080, H=1440;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const t=CARD_TPL[o.tpl];
  if(o.page===0){
    // 封面页：V6.20 支持图片背景混排（o.coverImg 为 HTMLImageElement）
    if(o.coverImg){
      const ratio = Math.max(W/o.coverImg.width, H/o.coverImg.height);
      const iw = o.coverImg.width*ratio, ih = o.coverImg.height*ratio;
      const ix = (W-iw)/2, iy = (H-ih)/2;
      ctx.drawImage(o.coverImg, ix, iy, iw, ih);
      ctx.fillStyle = 'rgba(0,0,0,'+(o.maskAlpha||0.45)+')';
      ctx.fillRect(0,0,W,H);
    } else {
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,t.bg[0]); g.addColorStop(1,t.bg[1]);
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='rgba(255,255,255,.08)';
      ctx.beginPath(); ctx.arc(W*0.9, H*0.06, 200, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.06)';
      ctx.beginPath(); ctx.arc(W*0.08, H*0.9, 150, 0, Math.PI*2); ctx.fill();
    }
    // 文字色：有图时用白字，没图用模板色
    const useWhite = !!o.coverImg;
    ctx.textAlign='left';
    ctx.fillStyle = useWhite ? '#ffffff' : t.ink;
    ctx.font='900 72px -apple-system,"PingFang SC",sans-serif';
    const titleLines=[]; let cur='';
    for(const ch of String(o.title||'') ){
      if(ctx.measureText(cur+ch).width>W-160){ titleLines.push(cur); cur=ch; } else cur+=ch;
    }
    if(cur) titleLines.push(cur);
    const tl=titleLines.slice(0,4);
    let y=H*0.34;
    tl.forEach(l=>{ ctx.fillText(l, 80, y); y+=96; });
    if(o.subtitle){
      ctx.font='600 34px -apple-system,"PingFang SC",sans-serif';
      ctx.fillStyle = useWhite ? 'rgba(255,255,255,.88)' : t.sub;
      ctx.fillText(String(o.subtitle).slice(0,24), 82, y+14);
    }
    // 装饰条
    ctx.fillStyle = useWhite ? 'rgba(255,255,255,.4)' : ((t.bg && t.bg[0] === '#ffffff') ? 'rgba(23,23,28,.12)' : 'rgba(255,255,255,.28)');
    ctx.fillRect(80, H-130, W-160, 2);
  } else {
    // ===== 正文页 =====
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle=t.accent;
    ctx.fillRect(0,0,W,10);
    ctx.textAlign='left';
    ctx.fillStyle=t.ink;
    ctx.font='800 52px -apple-system,"PingFang SC",sans-serif';
    ctx.fillText('第 '+o.page+' 页', 80, 120);
    ctx.font='600 38px -apple-system,"PingFang SC",sans-serif';
    ctx.fillStyle=t.accent;
    ctx.fillText(String(o.title||'').slice(0,20), 80, 196);
    ctx.fillStyle='rgba(23,23,28,.14)';
    ctx.fillRect(80, 230, W-160, 3);
    // 正文分页行
    ctx.font='34px -apple-system,"PingFang SC",sans-serif';
    ctx.fillStyle=t.body;
    let y=330;
    o.lines.forEach(l=>{
      ctx.fillText(l==='' ? ' ' : l, 80, y);
      y+=72;
    });
    // 页码
    ctx.font='500 28px -apple-system,sans-serif';
    ctx.fillStyle='rgba(23,23,28,.3)';
    ctx.textAlign='right';
    ctx.fillText(o.page+' / '+o.pageCount, W-80, H-70);
    ctx.textAlign='left';
  }
}
function genCards(allTpls){
  const title=$('#cmTitle').value.trim();
  const subtitle=($('#cmSub')&&$('#cmSub').value.trim()) || '小红书图文 · 点击收藏 ⭐';
  const body=$('#cmBody').value.trim();
  if(!title){ Toast('请输入标题'); return; }
  if(!body){ Toast('请输入正文'); return; }
  const out=$('#cmOut');
  out.innerHTML='<div class="loading">正在排版生成…</div>';
  (async()=>{
    try{
      // 分页：正文行 → 每页 12 行
      const probe=document.createElement('canvas'); probe.width=1080; probe.height=1440;
      const ctx=probe.getContext('2d');
      ctx.font='34px -apple-system,"PingFang SC",sans-serif';
      const lines=wrapLines(ctx, body, 920);
      const per=12;
      const pages=[];
      for(let i=0;i<lines.length && pages.length<3;i+=per){
        pages.push(lines.slice(i,i+per));
      }
      // V6.20：加载封面图（异步）
      let coverImg = null;
      if(__cmCoverImg){
        coverImg = await new Promise(res=>{
          const img = new Image();
          img.onload = ()=>res(img);
          img.onerror = ()=>res(null);
          img.src = __cmCoverImg;
        });
      }
      const tplList = allTpls ? CARD_TPL.map((_,i)=>i) : [cardTpl];
      const groups = tplList.map(tplIdx=>{
        const tpl = CARD_TPL[tplIdx];
        const cover=document.createElement('canvas'); cover.width=1080; cover.height=1440;
        drawCardPage(cover, {tpl:tplIdx, title, subtitle, lines:[], page:0, pageCount:pages.length+1, coverImg});
        const bodyCanvases = pages.map((pg,i)=>{
          const c=document.createElement('canvas'); c.width=1080; c.height=1440;
          drawCardPage(c, {tpl:tplIdx, title, subtitle, lines:pg, page:i+1, pageCount:pages.length+1});
          return c;
        });
        return { tpl, tplIdx, cover, bodyCanvases };
      });
      // 渲染输出
      const renderCard = (c, tplName, idx) => {
        const url = c.toDataURL('image/png');
        return `<div style="flex:0 0 auto;width:200px;text-align:center">
          <img src="${url}" style="width:100%;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.14)" />
          <div style="font-size:10px;color:var(--text3);margin-top:5px">${tplName} · ${idx}</div>
          <button class="btn btn-red btn-sm" style="margin-top:6px;width:100%" onclick="downloadImg('${url}','card_${Date.now()}_${tplName}')">⬇️ 下载</button>
        </div>`;
      };
      const totalCards = groups.reduce((s,g)=>s+1+g.bodyCanvases.length, 0);
      if(allTpls && groups.length>1){
        out.innerHTML = groups.map((g,gi)=>{
          const allCs = [g.cover].concat(g.bodyCanvases);
          return `<div style="margin-bottom:14px">
            <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;padding-left:2px">${g.tpl.name}</div>
            <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px">${allCs.map((c,idx)=>renderCard(c, g.tpl.name, idx===0?'封面':'正文'+idx)).join('')}</div>
          </div>`;
        }).join('') + `<p style="font-size:11.5px;color:var(--text3);margin-top:10px;text-align:center">共 ${groups.length} 个模板 · ${totalCards} 张 · 1080×1440 · 纯净无水印${coverImg?' · 封面图混排':''}</p>`;
      } else {
        const g = groups[0];
        const allCs = [g.cover].concat(g.bodyCanvases);
        out.innerHTML='<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px">' +
          allCs.map((c,idx)=>renderCard(c, g.tpl.name, idx===0?'封面':'正文'+idx)).join('') + '</div>' +
          `<p style="font-size:11.5px;color:var(--text3);margin-top:10px;text-align:center">共 ${allCs.length} 张 · 1080×1440 · 纯净无水印${coverImg?' · 封面图混排':''}</p>` +
          `<div style="text-align:center;margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="genCards(true)">🎲 试试 9 套模板对比</button></div>`;
      }
    }catch(e){ out.innerHTML='<div style="color:var(--red);font-size:13px">生成失败：'+esc(e.message||e)+'</div>'; }
  })();
}

/* ================= V6.32 电商带货中心 =================
   客户真实痛点：选品靠感觉、带货笔记写不出、赚了多少算不清、大促总是临时抱佛脚
   本模块把「选品 → 写带货笔记 → 排期发布 → 记单算佣金 → 踩大促节点」做成一条闭环
======================================================== */
let shopTab = 'products';
let shopFilter = 'all';
let shopCalc = { price: 99, rate: 20, orders: 30 };

function getShop(){
  if(!Store.data.shop || typeof Store.data.shop !== 'object'){
    Store.data.shop = { products: [], orders: [], defaultRate: 20 };
  }
  const s = Store.data.shop;
  if(!Array.isArray(s.products)) s.products = [];
  if(!Array.isArray(s.orders)) s.orders = [];
  if(s.defaultRate === undefined) s.defaultRate = 20;
  return s;
}
function shopUnitFee(p){ return Math.round((+p.price||0) * ((+p.commissionRate||0)/100) * 100) / 100; }
function shopMyCat(){ return (Store.data.userProfile && Store.data.userProfile.accountType) || aiCat || '美妆'; }
function shopStatusMeta(st){
  return { candidate:{t:'待评估', c:'var(--text3)', bg:'var(--line2)'},
           selling:{t:'在售', c:'#1d7a3a', bg:'rgba(52,199,89,.14)'},
           archived:{t:'已下架', c:'var(--text3)', bg:'var(--line2)'} }[st] || {t:st||'待评估', c:'var(--text3)', bg:'var(--line2)'};
}
/* 下一个大促节点（已过的按明年算） */
function nextShopNode(){
  const nodes = (typeof Seed!=='undefined' && Seed.shopNodes) ? Seed.shopNodes : [];
  if(!nodes.length) return null;
  const today = new Date(todayStr()+'T00:00:00').getTime();
  let best = null;
  nodes.forEach(n=>{
    let t = new Date(n.date+'T00:00:00').getTime();
    if(t - today < 0) t += 365*864e5;
    const days = Math.round((t - today)/864e5);
    if(!best || days < best.days) best = { ...n, days };
  });
  return best;
}

function renderShop(){
  const shop = getShop();
  const prods = shop.products;
  const orders = shop.orders;
  const totalGmv  = orders.reduce((a,b)=>a+(+b.gmv||0), 0);
  const totalComm = orders.reduce((a,b)=>a+(+b.commission||0), 0);
  const totalOrd  = orders.reduce((a,b)=>a+(+b.orders||0), 0);
  const selling   = prods.filter(p=>p.status==='selling');
  const node      = nextShopNode();

  $('#content').innerHTML = `
  <div class="section-head"><h2>🛒 电商带货中心</h2><div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn btn-red btn-sm" onclick="openShopProduct()">＋ 新增商品</button>
    <button class="btn btn-ghost btn-sm" onclick="shopTab='pick';renderShop()">🤖 AI 帮我选品</button>
    <button class="btn btn-ghost btn-sm" onclick="openShopOrder()">💰 记一笔带货</button>
  </div></div>
  <p style="color:var(--text2);font-size:13px;margin-bottom:14px;line-height:1.7">
    从选品到出单一条龙：<b style="color:var(--text)">建商品 → AI 写带货笔记 → 一键排期发布 → 记录订单自动算佣金</b>。
    ${node?`<span style="color:var(--red)">距「${esc(node.name)}」还有 ${node.days} 天，建议提前 ${node.lead} 天铺内容。</span>`:''}
  </p>

  <div class="kpi-grid">
    <div class="kpi-item"><div class="k-label">在售商品</div><div class="k-num">${selling.length}</div><div class="k-sub">共 ${prods.length} 个</div></div>
    <div class="kpi-item"><div class="k-label">累计 GMV</div><div class="k-num">¥${fmtNum(Math.round(totalGmv))}</div><div class="k-sub">${totalOrd} 单</div></div>
    <div class="kpi-item"><div class="k-label">累计佣金</div><div class="k-num">¥${fmtNum(Math.round(totalComm))}</div><div class="k-sub">已记录 ${orders.length} 笔</div></div>
    <div class="kpi-item"><div class="k-label">客单佣金</div><div class="k-num">¥${totalOrd? (totalComm/totalOrd).toFixed(1) : 0}</div><div class="k-sub">平均每单</div></div>
  </div>

  <div class="ana-tabs" style="margin:16px 0 12px">
    <span class="ana-tab ${shopTab==='products'?'active':''}" onclick="shopTab='products';renderShop()">📦 商品库</span>
    <span class="ana-tab ${shopTab==='pick'?'active':''}" onclick="shopTab='pick';renderShop()">🤖 AI 选品</span>
    <span class="ana-tab ${shopTab==='data'?'active':''}" onclick="shopTab='data';renderShop()">💰 数据与佣金</span>
    <span class="ana-tab ${shopTab==='calendar'?'active':''}" onclick="shopTab='calendar';renderShop()">📅 大促日历</span>
  </div>
  <div id="shopBody">${renderShopTab()}</div>`;
}
/* 功能地图跳转用：直接定位到电商页指定 Tab */
function shopTabFromFeatures(tab){
  shopTab = tab || 'pick';
  navigate('shop');
}
function renderShopTab(){
  if(shopTab==='pick') return renderShopPick();
  if(shopTab==='data') return renderShopData();
  if(shopTab==='calendar') return renderShopCalendar();
  return renderShopProducts();
}

/* ---------- Tab1 商品库 ---------- */
function renderShopProducts(){
  const shop = getShop();
  let list = shop.products;
  if(shopFilter!=='all') list = list.filter(p=>(p.status||'candidate')===shopFilter);
  if(!shop.products.length){
    return `<div class="card" style="text-align:center;padding:44px 20px">
      <div style="font-size:40px;margin-bottom:10px">📦</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">还没有商品</div>
      <div style="font-size:12.5px;color:var(--text3);line-height:1.7;margin-bottom:14px">先把你想带的品建进来（客单价 + 佣金率），<br>后面写笔记、算佣金、排期全部自动串起来</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-red btn-sm" onclick="openShopProduct()">＋ 手动新增</button>
        <button class="btn btn-ghost btn-sm" onclick="shopTab='pick';renderShop()">🤖 AI 帮我选品</button>
      </div>
    </div>`;
  }
  const filterHtml = ['all','candidate','selling','archived'].map(k=>
    `<span class="chip ${shopFilter===k?'active':''}" onclick="shopFilter='${k}';renderShop()">${k==='all'?'全部':shopStatusMeta(k).t}</span>`
  ).join('');
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${filterHtml}</div>
  ${list.length?list.map(p=>{
    const st = shopStatusMeta(p.status);
    return `<div class="card" style="margin-bottom:10px;padding:14px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:44px;border-radius:12px;background:var(--line2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${p.cat==='美妆'?'💄':p.cat==='穿搭'?'👗':p.cat==='数码'?'📱':p.cat==='美食'?'🍗':p.cat==='家居'?'🏠':p.cat==='母婴'?'🍼':'🛍️'}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <b style="font-size:14px">${esc(p.name)}</b>
            <span class="pill" style="font-size:9px;padding:1px 7px;background:${st.bg};color:${st.c}">${st.t}</span>
            <span class="pill" style="font-size:9px;padding:1px 7px">${esc(p.cat||'未分类')}</span>
          </div>
          <div style="font-size:12px;color:var(--text3);margin-top:5px;line-height:1.6">
            客单价 <b style="color:var(--text2)">¥${+p.price||0}</b> · 佣金率 <b style="color:var(--text2)">${+p.commissionRate||0}%</b> · 每单赚 <b style="color:var(--red)">¥${shopUnitFee(p)}</b>
            ${p.source?`<br>货源：${esc(p.source)}`:''}
            ${p.sellPoints?`<br>卖点：${esc(p.sellPoints)}`:''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn-red btn-sm" onclick="openShopNoteGen('${p.id}')">✍️ 写带货笔记</button>
        <button class="btn btn-ghost btn-sm" onclick="openShopOrder('${p.id}')">💰 记一单</button>
        ${p.status!=='selling'?`<button class="btn btn-ghost btn-sm" onclick="setShopStatus('${p.id}','selling')">✅ 标为在售</button>`:`<button class="btn btn-ghost btn-sm" onclick="setShopStatus('${p.id}','archived')">📥 下架</button>`}
        <button class="btn btn-ghost btn-sm" onclick="openShopProduct('${p.id}')">✏️ 编辑</button>
        <button class="btn btn-ghost btn-sm" onclick="delShopProduct('${p.id}')">🗑️</button>
      </div>
    </div>`;
  }).join(''):'<div class="empty" style="padding:26px">该状态下暂无商品</div>'}`;
}
function openShopProduct(id){
  const shop = getShop();
  const p = id ? shop.products.find(x=>x.id===id) : null;
  const cats = (typeof catOptions==='function') ? catOptions() : ['美妆','穿搭','数码','美食','母婴','家居','其他'];
  Modal.open(p?'✏️ 编辑商品':'＋ 新增商品', `
    <div class="form-group"><label class="label">商品名称</label><input id="spName" value="${p?esc(p.name):''}" placeholder="如：XX 持妆粉底液"></div>
    <div class="form-group"><label class="label">类目</label><div class="select-pills" id="spCat">${cats.map(c=>`<span class="chip ${(p?p.cat:cats[0])===c?'active':''}" onclick="pickOne(this,'spCat')">${c}</span>`).join('')}</div></div>
    <div class="grid grid-2">
      <div class="form-group"><label class="label">客单价（元）</label><input id="spPrice" type="number" value="${p?(+p.price||''):''}" placeholder="99"></div>
      <div class="form-group"><label class="label">佣金率（%）</label><input id="spRate" type="number" value="${p?(+p.commissionRate||''):(shop.defaultRate||20)}" placeholder="20"></div>
    </div>
    <div class="form-group"><label class="label">货源 / 链接（选填）</label><input id="spSource" value="${p?esc(p.source||''):''}" placeholder="如：XX 平台选品库 / 橱窗链接"></div>
    <div class="form-group"><label class="label">核心卖点（选填，写了 AI 生成的笔记更准）</label><textarea id="spPoints" style="min-height:70px" placeholder="如：持妆 8 小时、油皮亲妈、学生党价位">${p?esc(p.sellPoints||''):''}</textarea></div>
    <div class="form-group"><label class="label">状态</label><div class="select-pills" id="spStatus">
      <span class="chip ${(p?p.status:'candidate')==='candidate'?'active':''}" onclick="pickOne(this,'spStatus')">待评估</span>
      <span class="chip ${(p&&p.status==='selling')?'active':''}" onclick="pickOne(this,'spStatus')">在售</span>
      <span class="chip ${(p&&p.status==='archived')?'active':''}" onclick="pickOne(this,'spStatus')">已下架</span>
    </div></div>
    <button class="btn btn-red btn-block" onclick="saveShopProduct('${id||''}')">💾 保存</button>`);
}
function pickOne(el, wrapId){
  const wrap = document.getElementById(wrapId); if(!wrap) return;
  Array.from(wrap.children).forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
}
function pickVal(wrapId){ const w=document.getElementById(wrapId); const a=w&&w.querySelector('.chip.active'); return a?a.textContent.trim():''; }
function saveShopProduct(id){
  const shop = getShop();
  const name = ($('#spName').value||'').trim();
  if(!name){ Toast('请填写商品名称'); return; }
  const statusMap = {'待评估':'candidate','在售':'selling','已下架':'archived'};
  const data = {
    name,
    cat: pickVal('spCat') || '其他',
    price: parseFloat($('#spPrice').value)||0,
    commissionRate: parseFloat($('#spRate').value)||0,
    source: ($('#spSource').value||'').trim(),
    sellPoints: ($('#spPoints').value||'').trim(),
    status: statusMap[pickVal('spStatus')] || 'candidate'
  };
  if(id){
    const p = shop.products.find(x=>x.id===id);
    if(p) Object.assign(p, data);
  } else {
    shop.products.unshift({ id: uid(), createdAt: new Date().toISOString(), ...data });
  }
  Store.save(); Modal.close(); Toast(id?'已更新 ✅':'商品已添加 ✅'); renderShop();
}
function setShopStatus(id, st){
  const shop = getShop(); const p = shop.products.find(x=>x.id===id);
  if(p){ p.status = st; Store.save(); Toast('已标记为「'+shopStatusMeta(st).t+'」'); renderShop(); }
}
function delShopProduct(id){
  const shop = getShop();
  const p = shop.products.find(x=>x.id===id);
  if(!confirm('确定删除商品「'+(p?p.name:'')+'」？删除后不可恢复。')) return;
  shop.products = shop.products.filter(x=>x.id!==id);
  Store.save(); Toast('已删除'); renderShop();
}

/* ---------- Tab2 AI 选品 ---------- */
function renderShopPick(){
  const cat = shopMyCat();
  const fans = (Store.data.analytics&&Store.data.analytics.overview&&Store.data.analytics.overview.fans)||0;
  return `<div class="card">
    <div class="card-title">🤖 AI 选品建议 <span style="font-size:11px;color:var(--text3);font-weight:400">基于你的赛道与粉丝量</span></div>
    <div style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">
      当前赛道：<b>${esc(cat)}</b> · 粉丝 <b>${fmtNum(fans)}</b>。AI 会给出适合你带的品类方向，含客单价区间、佣金率参考、以及为什么适合你。
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button class="btn btn-red btn-sm" onclick="runShopPick()">✨ 生成选品建议</button>
      <button class="btn btn-ghost btn-sm" onclick="shopTab='products';renderShop()">📦 去商品库</button>
    </div>
    <div id="shopPickOut" style="font-size:13px;line-height:1.9;white-space:pre-wrap">${getShop().products.length?'':'<span style="color:var(--text3)">还没有商品，点上面按钮让 AI 帮你挑 5-8 个方向，选中的可一键加进商品库。</span>'}</div>
  </div>`;
}
async function runShopPick(){
  if(!proGuard('AI 选品')) return;
  const cat = shopMyCat();
  const fans = (Store.data.analytics&&Store.data.analytics.overview&&Store.data.analytics.overview.fans)||0;
  const out = $('#shopPickOut'); if(!out) return;
  out.innerHTML = '<div class="loading">🤖 AI 正在分析赛道选品…（约 10-20 秒）</div>';
  const sys = '你是小红书带货选品专家。只输出选品建议，不要开场白和总结。严格按格式，每个品类一段。';
  const prompt = `我是小红书「${cat}」赛道博主，粉丝 ${fans}。请给我 6 个最适合我带的品类/商品方向。

严格按此格式输出，每个品类之间用 --- 分隔：
品类名｜客单价区间｜佣金率参考｜推荐理由（1句，说明为什么适合我的赛道和粉丝量）
---
品类名｜客单价区间｜佣金率参考｜推荐理由

要求：客单价要贴合我当前的粉丝量（粉丝少不要推高客单），佣金率给行业真实区间，理由要具体不要空泛。`;
  let full = '';
  const r = await aiAsk(prompt, sys, '', t=>{ full = t; out.textContent = t + '▌'; });
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:13px">⚠️ AI 生成失败：'+esc(r.msg||'未知错误')+'</div>'; return; }
  out.textContent = full;
  // 解析成可一键入库的按钮
  const blocks = full.split(/\n?-{3,}\n?/).map(s=>s.trim()).filter(Boolean);
  const parsed = blocks.map(b=>{
    const parts = b.split('｜').map(x=>x.trim());
    return { name: parts[0]||'', price: (parts[1]||'').match(/[\d.]+/)?.[0]||0, rate: (parts[2]||'').match(/[\d.]+/)?.[0]||20, why: parts[3]||'' };
  }).filter(x=>x.name && x.name.length<40);
  if(parsed.length){
    const box = document.createElement('div');
    box.style.cssText = 'margin-top:14px;border-top:1px solid var(--line);padding-top:12px';
    box.innerHTML = '<div style="font-size:12px;font-weight:700;margin-bottom:8px">✅ 一键加进商品库（客单价/佣金率已自动填好）</div>' +
      parsed.map((p,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:9px 10px;background:var(--bg);border-radius:9px;margin-bottom:6px;font-size:12.5px">
        <span style="flex:1;min-width:0"><b>${esc(p.name)}</b> <span style="color:var(--text3)">¥${p.price} · ${p.rate}%</span><br><span style="color:var(--text3);font-size:11.5px">${esc(p.why)}</span></span>
        <button class="btn btn-red btn-sm" style="flex-shrink:0" onclick='addPickedProduct(${JSON.stringify(JSON.stringify(p))})'>＋ 加入</button>
      </div>`).join('');
    out.appendChild(box);
  }
}
function addPickedProduct(jsonStr){
  const p = JSON.parse(jsonStr);
  const shop = getShop();
  shop.products.unshift({ id:uid(), name:p.name, cat:shopMyCat(), price:parseFloat(p.price)||0,
    commissionRate: parseFloat(p.rate)||20, source:'', sellPoints:p.why||'', status:'candidate', createdAt:new Date().toISOString() });
  Store.save(); Toast('已加入商品库 📦'); shopTab='products'; renderShop();
}

/* ---------- Tab3 数据与佣金 ---------- */
function renderShopData(){
  const shop = getShop();
  const orders = shop.orders.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const c = shopCalc;
  const income = Math.round((+c.price||0) * ((+c.rate||0)/100) * (+c.orders||0));
  // 单品排行
  const rank = {};
  shop.orders.forEach(o=>{
    const p = shop.products.find(x=>x.id===o.productId);
    const k = p ? p.name : (o.productName||'未知商品');
    rank[k] = rank[k] || { name:k, orders:0, gmv:0, comm:0 };
    rank[k].orders += (+o.orders||0); rank[k].gmv += (+o.gmv||0); rank[k].comm += (+o.commission||0);
  });
  const rankList = Object.values(rank).sort((a,b)=>b.comm-a.comm).slice(0,5);
  return `
  <div class="card" style="margin-bottom:14px">
    <div class="card-title">🧮 佣金计算器 <span style="font-size:11px;color:var(--text3);font-weight:400">接单前先算清楚值不值</span></div>
    <div class="grid grid-3" style="margin-bottom:10px">
      <div class="form-group"><label class="label">客单价（元）</label><input id="calcPrice" type="number" value="${c.price}" oninput="shopCalc.price=this.value;updateShopCalc()"></div>
      <div class="form-group"><label class="label">佣金率（%）</label><input id="calcRate" type="number" value="${c.rate}" oninput="shopCalc.rate=this.value;updateShopCalc()"></div>
      <div class="form-group"><label class="label">预估订单数</label><input id="calcOrders" type="number" value="${c.orders}" oninput="shopCalc.orders=this.value;updateShopCalc()"></div>
    </div>
    <div id="calcOut" style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8">
      ${calcOutHtml(income)}
    </div>
  </div>

  <div class="card">
    <div class="card-title">💰 带货记录 <span style="font-size:12px;color:var(--text3);font-weight:400">${orders.length} 笔</span>
      <button class="btn btn-red btn-sm" style="float:right" onclick="openShopOrder()">＋ 记一笔</button></div>
    ${orders.length?orders.map(o=>{
      const p = shop.products.find(x=>x.id===o.productId);
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px">
        <span style="flex:1;min-width:0">
          <b>${esc(p?p.name:(o.productName||'手动记录'))}</b>
          <span style="color:var(--text3);font-size:11.5px"> · ${esc(o.date||'')}${o.note?' · '+esc(o.note):''}</span>
        </span>
        <span style="color:var(--text3);font-size:12px;flex-shrink:0">${+o.orders||0} 单</span>
        <span style="color:var(--text2);font-size:12px;flex-shrink:0">GMV ¥${fmtNum(Math.round(+o.gmv||0))}</span>
        <b style="color:var(--red);flex-shrink:0">¥${fmtNum(Math.round(+o.commission||0))}</b>
        <button class="icon-btn" style="flex-shrink:0" onclick="delShopOrder('${o.id}')" title="删除">🗑️</button>
      </div>`;
    }).join(''):'<div class="empty" style="padding:22px"><span class="empty-ico">💰</span>还没有带货记录，出一单就记一笔，佣金自动算</div>'}
  </div>

  ${rankList.length?`<div class="card" style="margin-top:14px">
    <div class="card-title">🏆 单品佣金排行</div>
    ${rankList.map((r,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:${i===rankList.length-1?'none':'1px solid var(--line)'};font-size:13px">
      <span style="width:20px;color:var(--text3);font-weight:700;flex-shrink:0">${i+1}</span>
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}</span>
      <span style="color:var(--text3);font-size:12px;flex-shrink:0">${r.orders} 单</span>
      <b style="color:var(--red);flex-shrink:0">¥${fmtNum(Math.round(r.comm))}</b>
    </div>`).join('')}
  </div>`:''}`;
}
function calcOutHtml(income){
  const c = shopCalc;
  const price = +c.price||0, rate = +c.rate||0, ord = +c.orders||0;
  const unit = Math.round(price*rate/100*100)/100;
  // 参考：小红书带货笔记曝光→下单转化率约 0.3%-1%，取 0.5% 保守
  const needViews = Math.ceil(ord / 0.005);
  return `每单佣金 <b style="color:var(--red)">¥${unit}</b> ·
    ${ord} 单预计收入 <b style="color:var(--red);font-size:16px">¥${fmtNum(income)}</b>
    <div style="font-size:11.5px;color:var(--text3);margin-top:8px;line-height:1.7">
      💡 按行业保守转化（曝光→下单约 0.5%）估算，出 ${ord} 单大约需要 <b>${fmtNum(needViews)}</b> 次曝光；
      按你的近 7 天场均曝光，约等于 <b>${Math.ceil(needViews / Math.max(1, Math.round((Store.data.analytics?.overview?.views7d||49200)/7)))}</b> 篇笔记。
    </div>`;
}
function updateShopCalc(){
  const box = $('#calcOut'); if(!box) return;
  const c = shopCalc;
  box.innerHTML = calcOutHtml(Math.round((+c.price||0)*((+c.rate||0)/100)*(+c.orders||0)));
}
function openShopOrder(productId){
  const shop = getShop();
  if(!shop.products.length){
    Modal.open('💰 记一笔带货', `<div class="empty" style="padding:18px"><span class="empty-ico">📦</span>还没有商品，请先到商品库新增商品</div>
      <button class="btn btn-red btn-block" style="margin-top:12px" onclick="Modal.close();shopTab='products';renderShop();openShopProduct()">＋ 去新增商品</button>`);
    return;
  }
  Modal.open('💰 记一笔带货', `
    <div class="form-group"><label class="label">商品</label><select id="soProduct">${shop.products.map(p=>`<option value="${p.id}" ${p.id===productId?'selected':''}>${esc(p.name)}（¥${+p.price||0} · ${+p.commissionRate||0}%）</option>`).join('')}</select></div>
    <div class="grid grid-2">
      <div class="form-group"><label class="label">订单数</label><input id="soOrders" type="number" placeholder="如 12"></div>
      <div class="form-group"><label class="label">日期</label><input id="soDate" type="date" value="${todayStr()}"></div>
    </div>
    <div class="form-group"><label class="label">GMV（元）<span style="color:var(--text3);font-weight:400"> · 留空按 订单数×客单价 自动算</span></label><input id="soGmv" type="number" placeholder="自动计算"></div>
    <div class="form-group"><label class="label">佣金（元）<span style="color:var(--text3);font-weight:400"> · 留空按 GMV×佣金率 自动算</span></label><input id="soComm" type="number" placeholder="自动计算"></div>
    <div class="form-group"><label class="label">备注（选填）</label><input id="soNote" placeholder="如：双 11 预热笔记带货"></div>
    <button class="btn btn-red btn-block" onclick="saveShopOrder()">💾 保存</button>`);
}
function saveShopOrder(){
  const shop = getShop();
  const pid = $('#soProduct').value;
  const p = shop.products.find(x=>x.id===pid);
  const orders = parseInt($('#soOrders').value)||0;
  if(orders<=0){ Toast('请填写订单数'); return; }
  const price = p ? (+p.price||0) : 0;
  const rate = p ? (+p.commissionRate||0) : 0;
  const gmv = parseFloat($('#soGmv').value) || Math.round(orders*price);
  const comm = parseFloat($('#soComm').value) || Math.round(gmv*rate/100);
  shop.orders.unshift({ id:uid(), productId:pid, productName:p?p.name:'', date:$('#soDate').value||todayStr(),
    orders, gmv, commission:comm, note:($('#soNote').value||'').trim() });
  // 同步到变现管理收益记录，让「累计收益」口径统一
  try{
    Store.data.money.records.unshift({ id:uid(), title:(p?p.name:'带货')+' · 带货佣金', product:'电商带货', income:Math.round(comm), date:($('#soDate').value||todayStr()).slice(5) });
  }catch(e){}
  Store.save(); Modal.close(); Toast('已记录，佣金 ¥'+Math.round(comm)+' ✅'); shopTab='data'; renderShop();
}
function delShopOrder(id){
  const shop = getShop();
  if(!confirm('删除这条带货记录？')) return;
  shop.orders = shop.orders.filter(x=>x.id!==id);
  Store.save(); Toast('已删除'); renderShop();
}

/* ---------- Tab4 大促日历 ---------- */
function renderShopCalendar(){
  const nodes = (typeof Seed!=='undefined'&&Seed.shopNodes) ? Seed.shopNodes : [];
  const today = new Date(todayStr()+'T00:00:00').getTime();
  const list = nodes.map(n=>{
    let t = new Date(n.date+'T00:00:00').getTime();
    let yearAdd = 0;
    if(t - today < 0){ t += 365*864e5; yearAdd = 1; }
    return { ...n, days: Math.round((t-today)/864e5), realDate: n.date.slice(5)+(yearAdd?'（明年）':'') };
  }).sort((a,b)=>a.days-b.days);
  return `<div class="card">
    <div class="card-title">📅 电商大促节点 <span style="font-size:11px;color:var(--text3);font-weight:400">提前铺内容，节点才有流量</span></div>
    <div style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">
      大促流量是"提前抢"的：笔记需要时间被推荐，所以要在节点前 <b>提前量</b> 天就开始铺种草内容。
    </div>
    ${list.map(n=>{
      const urgent = n.days <= n.lead;
      const started = n.days <= n.lead;
      return `<div style="padding:12px 14px;border-radius:11px;margin-bottom:8px;border:1px solid ${urgent?'rgba(194,59,82,.3)':'var(--line)'};background:${urgent?'var(--soft-red)':'var(--bg)'}" >
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <b style="font-size:14px">${esc(n.name)}</b>
          <span class="pill" style="font-size:10px">${esc(n.realDate)}</span>
          <span style="font-size:12px;color:${urgent?'var(--red)':'var(--text3)'};font-weight:600">${n.days} 天后</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text3)">建议提前 ${n.lead} 天</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:6px;line-height:1.6">${esc(n.tip)}</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          ${started?`<span style="font-size:11.5px;color:var(--red);align-self:center">⏰ 已进入备战后，现在发内容正好</span>`:`<span style="font-size:11.5px;color:var(--text3);align-self:center">还有 ${n.days - n.lead} 天进入备战期</span>`}
          <button class="btn btn-red btn-sm" style="margin-left:auto" onclick="genShopNodeTopics('${esc(n.name)}')">✨ 生成该节点选题</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
async function genShopNodeTopics(nodeName){
  if(!proGuard('AI 选题')) return;
  const cat = shopMyCat();
  Modal.open('✨ '+nodeName+' · 带货选题', '<div id="nodeOut"><div class="loading">🤖 AI 正在生成节点选题…</div></div>');
  const sys = '你是小红书电商内容操盘手。输出选题清单，不要开场白。';
  const prompt = `我是小红书「${cat}」赛道的带货博主。「${nodeName}」大促快到了，请给我 6 个适合提前铺的带货选题。

严格按格式，一行一个：
选题标题｜内容形式（测评/清单/教程/避雷/对比/开箱）｜主推商品品类｜为什么这个节点好卖（1句）

要求：标题要有点击欲（数字+人群+场景），贴合「${nodeName}」的消费心理，不要空泛。`;
  let full='';
  const r = await aiAsk(prompt, sys, '', t=>{ full=t; const o=$('#nodeOut'); if(o) o.textContent = t + '▌'; });
  const box = $('#nodeOut'); if(!box) return;
  if(!r.ok){ box.innerHTML = '<div style="color:var(--red);font-size:13px">⚠️ AI 生成失败：'+esc(r.msg||'未知错误')+'</div>'; return; }
  box.innerHTML = '<div style="font-size:13px;line-height:1.95;white-space:pre-wrap">'+esc(full)+'</div>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="copyText(this, document.querySelector(\'#nodeOut div\').innerText)">📋 复制全部</button>' +
    '<button class="btn btn-red btn-sm" onclick="Modal.close();navigate(\'create\')">✍️ 去 AI 创作中心写</button></div>';
}

/* ---------- 带货笔记一键生成（商品 → 笔记 → 排期，完整闭环） ---------- */
async function openShopNoteGen(productId){
  const shop = getShop();
  const p = shop.products.find(x=>x.id===productId);
  if(!p){ Toast('商品不存在'); return; }
  Modal.open('✍️ 为「'+esc(p.name)+'」写带货笔记', `
    <div style="font-size:12px;color:var(--text3);line-height:1.7;margin-bottom:10px">
      商品：${esc(p.name)} · 客单价 ¥${+p.price||0} · 佣金 ${+p.commissionRate||0}%（每单赚 ¥${shopUnitFee(p)}）${p.sellPoints?'<br>已填卖点：'+esc(p.sellPoints):''}
    </div>
    <div class="form-group"><label class="label">补充卖点 / 使用感受（选填，越具体笔记越真）</label><textarea id="snExtra" style="min-height:64px" placeholder="如：我用了两周，油皮夏天不脱妆，性价比高">${esc(p.sellPoints||'')}</textarea></div>
    <div class="grid grid-2">
      <div class="form-group"><label class="label">语气风格</label><select id="snMood"><option>真诚</option><option>种草</option><option>专业</option><option>走心</option><option>活泼</option></select></div>
      <div class="form-group"><label class="label">笔记角度</label><select id="snAngle"><option>真实测评</option><option>好物清单</option><option>避雷对比</option><option>使用教程</option><option>场景种草</option></select></div>
    </div>
    <button class="btn btn-red btn-block" onclick="runShopNoteGen('${p.id}')">✨ 生成带货笔记</button>
    <div id="snOut" style="margin-top:12px"></div>`);
}
async function runShopNoteGen(productId){
  if(!proGuard('AI 带货笔记')) return;
  const shop = getShop();
  const p = shop.products.find(x=>x.id===productId);
  const out = $('#snOut'); if(!p || !out) return;
  const extra = ($('#snExtra')&&$('#snExtra').value||'').trim();
  const mood = ($('#snMood')&&$('#snMood').value)||'真诚';
  const angle = ($('#snAngle')&&$('#snAngle').value)||'真实测评';
  const fans = (Store.data.analytics&&Store.data.analytics.overview&&Store.data.analytics.overview.fans)||0;
  out.innerHTML = '<div class="loading">🤖 AI 正在写带货笔记…（约 10-20 秒）</div>';
  const sys = '你是小红书带货笔记专家。内容必须像真人真实分享，不能像硬广。只输出内容，严格按格式。';
  const prompt = `为商品「${p.name}」写一篇小红书带货笔记。
商品信息：类目 ${p.cat||'综合'}，客单价 ${p.price||0} 元，佣金率 ${p.commissionRate||0}%，核心卖点：${extra||p.sellPoints||'（未填写，请你根据品类合理推断）'}
博主信息：赛道 ${shopMyCat()}，粉丝 ${fans}，语气 ${mood}，笔记角度 ${angle}

严格按此格式输出：
【标题】3 个备选（要带数字/人群/场景，一行一个）
【正文】400-600 字，开头 2 句抓人，中段讲真实使用感受 + 具体细节，自然带出卖点，用 emoji 切段，结尾引导互动
【话题标签】6-8 个
【封面文案】一句话，10 字以内
【合规提示】2-3 条（小红书带货需标注"广告/合作"等注意事项，以及不要用的极限词）

要求：不要编造无法验证的夸张数据，不要使用"最""第一""国家级"等极限词。`;
  let full = '';
  const r = await aiAsk(prompt, sys, '', t=>{ full = t; out.textContent = t + '▌'; });
  if(!r.ok){ out.innerHTML = '<div style="color:var(--red);font-size:13px">⚠️ AI 生成失败：'+esc(r.msg||'未知错误')+'</div>'; return; }
  out.textContent = full;
  window.__shopNote = { productId:p.id, title:p.name, body:full };
  const opts = document.createElement('div');
  opts.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';
  opts.innerHTML =
    '<button class="btn btn-ghost btn-sm" onclick="runShopNoteGen(\''+p.id+'\')">🔄 换一篇</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="copyText(this, '+JSON.stringify(full)+')">📋 复制</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="shopNoteToLibrary()">📥 存内容库</button>' +
    '<button class="btn btn-red btn-sm" onclick="shopNoteToOneGo()">🚀 存库 + 排期发布</button>';
  out.appendChild(opts);
}
function shopNoteToLibrary(){
  const n = window.__shopNote; if(!n){ Toast('请先生成笔记'); return; }
  Store.data.contents.unshift({ id:uid(), title:n.title+'（带货）', status:'draft', date:todayStr(), cat:shopMyCat(), views:0, likes:0, collects:0, comments:0, body:n.body, productId:n.productId });
  Store.save(); Toast('已存入内容库 🗂️');
}
/* 一条龙：存内容库 + 加入最近可发排期 + 提示（真·一键闭环） */
function shopNoteToOneGo(){
  const n = window.__shopNote; if(!n){ Toast('请先生成笔记'); return; }
  const d = Store.data;
  // 找最近一个没有排期的日期（从明天开始）
  let date = null;
  for(let i=1;i<=14;i++){
    const ds = fmtDate(addDays(i));
    const cnt = d.schedule.filter(s=>s.date===ds && s.status!=='idea').length;
    if(cnt===0){ date = ds; break; }
  }
  date = date || fmtDate(addDays(1));
  const times = ['12:30','19:30','20:00','21:00'];
  d.contents.unshift({ id:uid(), title:n.title+'（带货）', status:'draft', date:todayStr(), cat:shopMyCat(), views:0, likes:0, collects:0, comments:0, body:n.body, productId:n.productId });
  d.schedule.push({ id:uid(), date, title:n.title+'（带货）', status:'ready', time:times[Math.floor(Math.random()*times.length)], cat:shopMyCat() });
  Store.save(); Modal.close(); updateBadges();
  Toast('已存内容库 + 排期到 '+date.slice(5)+' ✅');
  navigate('schedule');
}

document.addEventListener('DOMContentLoaded', init);

function toggleSceneMore(){var b=document.getElementById("sceneMoreBox");var bt=document.getElementById("sceneMoreBtn");if(b&&bt){var open=b.style.display!=="none";b.style.display=open?"none":"grid";bt.style.opacity=open?"1":"0.55";bt.querySelector("span").textContent=open?"👇 还有 4 个场景（视频/直播/封面/情绪）":"👆 收起";}}
