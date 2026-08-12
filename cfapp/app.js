// Crazy Friday App · 共享脚本（v3 流畅版）
const TABS = [
    { id:'home', icon:'🏠', label:'首页', url:'index.html' },
    { id:'discover', icon:'💎', label:'发现', url:'discover.html' },
    { id:'orders', icon:'📋', label:'接单', url:'orders.html' },
    { id:'messages', icon:'💬', label:'消息', url:'messages.html' },
    { id:'me', icon:'👤', label:'我的', url:'me.html' },
];

function getUnreadCount() {
    try {
        const d = JSON.parse(localStorage.getItem('cf_community_v1'));
        if (d && d.notifications) return d.notifications.filter(n => !n.read).length;
    } catch(e) {}
    return 0;
}

function renderTabbar(activeId) {
    const unread = activeId === 'messages' ? 0 : getUnreadCount();
    return `<div class="tabbar">${TABS.map(t => `
        <a class="tab ${activeId===t.id?'active':''}" href="${t.url}">
            <div class="tab-icon">${t.icon}${t.id==='messages'&&unread>0?`<span class="tab-dot">${unread}</span>`:''}</div>
            <div class="tab-label">${t.label}</div>
        </a>`).join('')}</div>`;
}

function toast(m) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = m;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

// 返回：有历史返回上一页，否则回首页
function goBack() {
    if (document.referrer && document.referrer.includes('shiming-ai.github.io')) {
        history.back();
    } else {
        location.href = 'index.html';
    }
}

// 跳转带轻过渡：防止闪白
function navTo(url) {
    document.body.style.opacity = '0.4';
    document.body.style.transition = 'opacity .18s ease';
    setTimeout(() => { location.href = url; }, 120);
}

// 页面加载：入场动画 + 底部tabbar
document.addEventListener('DOMContentLoaded', () => {
    // 入场动画（软滑入，避免生硬加载）
    const wrap = document.querySelector('.wrap');
    if (wrap) wrap.classList.add('page-enter');
    document.body.classList.add('app-loaded');
    // 渲染底部tabbar
    const activeId = document.body.dataset.tab || 'home';
    const tabbar = document.createElement('div');
    tabbar.innerHTML = renderTabbar(activeId);
    document.body.appendChild(tabbar.firstElementChild);
    // 成交滚动条（页面放 <div data-ticker></div> 即自动渲染）
    cfTicker();
    // 全局 AI 助手悬浮球
    cfAssistant();
});

/* ===== 全局 AI 助手（CF 智能助理 · 品牌级 WorkBuddy 精度） ===== */
const CF_LOGO_AVATAR = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="g" cx="50%" cy="40%"><stop offset="0%" stop-color="#1a1a1a"/><stop offset="100%" stop-color="#000"/></radialGradient></defs><circle cx="100" cy="100" r="100" fill="url(#g)"/><circle cx="155" cy="40" r="6" fill="#FF6B1A"/><text x="100" y="78" font-family="Georgia,serif" font-size="32" font-weight="900" text-anchor="middle" fill="#fff">Crazy</text><text x="100" y="112" font-family="Georgia,serif" font-size="32" font-weight="900" text-anchor="middle" fill="#fff">Friday</text><line x1="35" y1="130" x2="165" y2="130" stroke="#FF6B1A" stroke-width="1.5"/><text x="100" y="152" font-family="sans-serif" font-size="13" font-weight="700" text-anchor="middle" fill="#b8aed1" letter-spacing="6">疯狂星期五</text><text x="100" y="178" font-family="sans-serif" font-size="9" font-weight="800" text-anchor="middle" fill="#FFD700" letter-spacing="2">AI × CREATOR</text></svg>');
function cfAssistant(){
    if (document.getElementById('cfAssist')) return;
    const st = document.createElement('style'); st.textContent = `
#cfAssist{position:fixed;right:16px;bottom:88px;z-index:999;width:56px;height:56px;border-radius:50%;background:#0a0a0a;border:1.5px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 32px rgba(168,85,247,.45),inset 0 1px 0 rgba(255,255,255,.1);animation:cfAssistPulse 2.8s infinite;transition:transform .15s;overflow:hidden}
#cfAssist:active{transform:scale(.92)}
#cfAssist img{width:100%;height:100%;border-radius:50%;display:block}
#cfAssist::after{content:'';position:absolute;inset:0;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,.2) 0%,transparent 35%);pointer-events:none}
@keyframes cfAssistPulse{0%,100%{box-shadow:0 10px 32px rgba(168,85,247,.45),inset 0 1px 0 rgba(255,255,255,.1)}50%{box-shadow:0 12px 42px rgba(236,72,153,.6),inset 0 1px 0 rgba(255,255,255,.15);transform:scale(1.04)}}
#cfAssistPanel{position:fixed;right:12px;bottom:158px;z-index:999;width:min(340px,calc(100vw - 24px));background:linear-gradient(170deg,#140a26,#0d0420);border:1px solid rgba(168,85,247,.32);border-radius:22px;overflow:hidden;display:none;box-shadow:0 24px 70px rgba(0,0,0,.6)}
#cfAssistPanel.show{display:flex;flex-direction:column;animation:cfPanelIn .28s cubic-bezier(.22,.61,.36,1);max-height:min(520px,calc(100vh - 200px))}
@keyframes cfPanelIn{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.cfa-head{padding:14px 16px;background:linear-gradient(135deg,rgba(168,85,247,.18),rgba(236,72,153,.08));display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
.cfa-av{width:38px;height:38px;border-radius:50%;background:#0a0a0a;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;box-shadow:0 4px 14px rgba(168,85,247,.35)}
.cfa-av img{width:100%;height:100%;border-radius:50%}
.cfa-info{flex:1;min-width:0}
.cfa-name{font-size:13.5px;font-weight:900;display:flex;align-items:center;gap:6px}
.cfa-online{width:7px;height:7px;border-radius:50%;background:#34D399;box-shadow:0 0 6px rgba(52,211,153,.7);display:inline-block;animation:cfOnlinePulse 1.6s infinite}
@keyframes cfOnlinePulse{0%,100%{opacity:1}50%{opacity:.4}}
.cfa-sub{font-size:9.5px;color:#a89ec9;margin-top:1px}
.cfa-close{margin-left:auto;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#a89ec9;font-size:14px;flex-shrink:0}
.cfa-body{padding:14px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}
.cfa-msg{display:flex;gap:8px;align-items:flex-end;animation:cfMsgIn .25s ease}
@keyframes cfMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.cfa-msg.me{flex-direction:row-reverse}
.cfa-msg .av{width:26px;height:26px;border-radius:50%;background:#0a0a0a;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.08)}
.cfa-msg .av img{width:100%;height:100%}
.cfa-bubble{max-width:78%;font-size:11.5px;line-height:1.7;padding:9px 12px;border-radius:14px}
.cfa-msg.bot .cfa-bubble{background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(168,85,247,.06));border:1px solid rgba(168,85,247,.18);color:#e8e2f5;border-bottom-left-radius:5px}
.cfa-msg.me .cfa-bubble{background:linear-gradient(135deg,#A855F7,#EC4899);color:#fff;border-bottom-right-radius:5px;font-weight:600}
.cfa-bubble b{color:#C084FC}
.cfa-msg.me .cfa-bubble b{color:#fff;text-decoration:underline}
.cfa-bubble a{color:#C084FC;text-decoration:none;font-weight:700}
.cfa-bubble a:hover{text-decoration:underline}
.cfa-chips{padding:0 14px 8px;display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0}
.cfa-chip{font-size:10px;padding:6px 11px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#d8d0f0;cursor:pointer;transition:all .15s}
.cfa-chip:hover{background:rgba(168,85,247,.18);border-color:rgba(168,85,247,.4);color:#fff}
.cfa-input{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.2);flex-shrink:0}
.cfa-input input{flex:1;min-height:42px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;color:#fff;font-size:15px;padding:0 13px;outline:none;font-family:inherit}
.cfa-input input:focus{border-color:rgba(168,85,247,.6);background:rgba(168,85,247,.08)}
.cfa-input input::placeholder{color:#6d6489}
.cfa-send{min-width:54px;border:none;border-radius:14px;background:linear-gradient(135deg,#A855F7,#EC4899);color:#fff;font-weight:900;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center}
.cfa-send:active{transform:scale(.94)}`;
    document.head.appendChild(st);
    const fab = document.createElement('div');
    fab.id = 'cfAssist';
    fab.innerHTML = '<img src="'+CF_LOGO_AVATAR+'" alt="CF 助理">';
    const panel = document.createElement('div');
    panel.id = 'cfAssistPanel';
    panel.innerHTML = `
        <div class="cfa-head">
            <div class="cfa-av"><img src="`+CF_LOGO_AVATAR+`" alt=""></div>
            <div class="cfa-info">
                <div class="cfa-name">CF 智能助理 <span class="cfa-online" title="在线"></span></div>
                <div class="cfa-sub">帮你下单 · 报价 · 定制 · 找合作</div>
            </div>
            <div class="cfa-close" onclick="document.getElementById('cfAssistPanel').classList.remove('show')">×</div>
        </div>
        <div class="cfa-body" id="cfaBody">
            <div class="cfa-msg bot"><div class="av"><img src="`+CF_LOGO_AVATAR+`"></div><div class="cfa-bubble">你好，我是 <b>Crazy Friday 智能助理</b> 👋<br>需要什么？选下面的快捷问题，或直接打字给我。</div></div>
        </div>
        <div class="cfa-chips">
            <span class="cfa-chip" onclick="cfAskChip('你卖什么')">🛒 你卖什么</span>
            <span class="cfa-chip" onclick="cfAskChip('怎么下单')">💎 怎么下单</span>
            <span class="cfa-chip" onclick="cfAskChip('多少钱')">💰 多少钱</span>
            <span class="cfa-chip" onclick="cfAskChip('能定制吗')">🛠 能定制吗</span>
            <span class="cfa-chip" onclick="cfAskChip('看案例')">🎬 看案例</span>
            <span class="cfa-chip" onclick="cfAskChip('合作')">🤝 合作</span>
        </div>
        <div class="cfa-input"><input id="cfaInput" placeholder="输入你的问题..." enterkeyhint="send"><button class="cfa-send" onclick="cfAsk()">➤</button></div>`;
    document.body.appendChild(fab); document.body.appendChild(panel);
    fab.onclick = () => panel.classList.toggle('show');
    document.getElementById('cfaInput').addEventListener('keydown', e => { if (e.key === 'Enter') cfAsk(); });
    document.addEventListener('click', e => { const t = e.target.closest('[data-ask]'); if(t){ e.preventDefault(); panel.classList.add('show'); cfAskChip(t.dataset.ask); } });
}
window.cfAsk = function(){
    const q = (document.getElementById('cfaInput').value || '').trim();
    if (!q) return;
    addMsg('me', q);
    document.getElementById('cfaInput').value = '';
    setTimeout(()=>{ const a=cfAnswer(q); addMsg('bot', a.html); }, 350);
};
window.cfAskChip = function(q){ addMsg('me', q); setTimeout(()=>{ const a=cfAnswer(q); addMsg('bot', a.html); }, 350); };
function addMsg(who, text){
    const body = document.getElementById('cfaBody'); if (!body) return;
    const cls = who==='me' ? 'cfa-msg me' : 'cfa-msg bot';
    const av = who==='me' ? '<div class="av" style="background:linear-gradient(135deg,#A855F7,#EC4899);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900">我</div>' : '<div class="av"><img src="'+CF_LOGO_AVATAR+'"></div>';
    const div = document.createElement('div'); div.className = cls;
    div.innerHTML = av + '<div class="cfa-bubble">'+text+'</div>';
    body.appendChild(div); body.scrollTop = body.scrollHeight;
}
function cfAnswer(q){
    const s = q.toLowerCase();
    const rules = [
        { k:['卖','产品','有什么','做什么'], html:'我们在卖 <b>36 个行业成品 AI 工作台</b>（¥199-1999）+ AI 工具/模板/会员订阅，还提供<b>接单派单</b>和<b>定制服务</b>。<br>👉 <a href="store.html">去商店</a> · <a href="demo-case.html?id=fitness">看典型案例</a>' },
        { k:['买','下单','怎么买','购买','付款','怎么付'], html:'下单流程：<b>选商品 → 收款中心 → 扫码付款 → 填回执 → 订单自动入库</b>。<br>👉 <a href="../pay.html">去下单</a>' },
        { k:['价格','多少','钱','贵','便宜'], html:'· 入门工作台 <b>¥199 起</b>（健身/宠物/启蒙 ¥399 内）<br>· 标准版 <b>¥599-999</b><br>· 旗舰一人公司 <b>¥1999</b><br>· 专属定制 <b>¥999 起</b><br>👉 <a href="store.html">看价格</a>' },
        { k:['定制','专属','定制同款','做个','个人化'], html:'可以！把需求告诉我，<b>按你的行业/场景定制</b>，交付源码、改品牌即上线，¥999 起。<br>👉 <a href="../landing.html">去定制</a>' },
        { k:['接单','交付','干活','派单','入驻'], html:'有交付能力？登记进<b>交付网络</b>，有单派给你（AI开发/设计/文案/视频）。<br>👉 <a href="../partner-form.html">去登记</a>' },
        { k:['合作','投资','融资','招商','渠道'], html:'欢迎！我们正在找 <b>技术/渠道/内容/投资</b> 合作方，<b>20+ 伙伴</b>已共建生态。<br>👉 <a href="../invest.html">看招商</a> · <a href="partners.html">现有伙伴</a>' },
        { k:['案例','效果','成果','靠谱','真实'], html:'36 个行业案例，每个都有 <b>客户故事 + 成果图表 + 客户证言 + 价格方案</b>。<br>👉 <a href="../demo-gallery.html">看案例广场</a>' },
        { k:['会员','权益','pro','订阅'], html:'· Pro ¥99/月：全部工具/玩法/优先派单<br>· 企业 ¥999/月：团队账号+数据看板<br>👉 <a href="member.html">看会员</a>' },
        { k:['联系','微信','电话','找谁','商务'], html:'商务邮箱：<b>shim16506@gmail.com</b><br>👉 <a href="../invest.html">联系招商</a>' },
        { k:['模板','素材','提示词','sop','工具'], html:'市集有 <b>提示词包/SOP/模板/工具</b>，数字资源自动交付。<br>👉 <a href="mall.html">逛市集</a> · <a href="apps.html">应用市场</a>' },
        { k:['员工','ai 员工','agent','智能体','助手'], html:'超脑工坊有 <b>8 个 AI 员工</b>（策划/设计/文案/开发/客服/运营/数据/分析师），7×24 帮你干活。<br>👉 <a href="brain.html">查看 AI 员工</a>' },
        { k:['玩法','怎么赚','赚钱','变现'], html:'变现玩法库有 <b>9 条可执行 SOP</b>。<br>👉 <a href="playbook.html">看玩法</a>' },
        { k:['课程','学习','培训'], html:'AI 营有系统课程（入门→实战→变现），学完发证书。<br>👉 <a href="academy.html">进入 AI 营</a>' },
        { k:['你好','hi','hello','在吗','嗨'], html:'在的 👋 我是 <b>CF 智能助理</b>，可以问我 <b>卖什么 / 价格 / 怎么下单 / 定制 / 案例 / 合作 / 会员</b> 等。' },
        { k:['活动','日报','商机','每日'], html:'AI 变现日报每日更新 <b>商机/工具/玩法/案例</b>，可订阅推送。<br>👉 <a href="daily.html">看日报</a>' },
        { k:['数据','看板','经营'], html:'经营看板 10 秒刷新 <b>KPI/订单/线索/漏斗</b>。<br>👉 <a href="ops.html">看经营数据</a>' }
    ];
    for (const r of rules) { if (r.k.some(x => s.includes(x))) return r; }
    return { html:'这个问题我还得查一下～试试问我 <b>卖什么 / 价格 / 怎么下单 / 定制 / 案例</b>，或 <a href="store.html">直接逛商店</a> ✨' };
}
window.cfAsk = function(){
    const q = (document.getElementById('cfaInput').value || '').trim();
    if (!q) return;
    const body = document.getElementById('cfaBody');
    const askHtml = `<div class="cfa-q">你问：${q}</div>`;
    const answer = cfAnswer(q);
    body.innerHTML += askHtml + `<div class="cfa-a">${answer.html}</div>`;
    document.getElementById('cfaInput').value = '';
    body.scrollTop = body.scrollHeight;
};
function cfAnswer(q){
    const s = q.toLowerCase();
    const rules = [
        { k:['卖','产品','有什么','做什么'], html:'我们在卖 <b>36 个行业的成品 AI 工作台</b>（¥199-1999）+ AI 工具/模板/会员订阅，还提供接单派单和定制服务。👉 <a href="store.html" style="color:#C084FC">去商店看看</a>' },
        { k:['买','下单','怎么买','购买','付款'], html:'点商品 → 进 <b>收款中心</b> → 扫码付款 → 填回执，订单自动入库。👉 <a href="../pay.html" style="color:#C084FC">去下单</a>' },
        { k:['价格','多少','钱','贵'], html:'工作台 <b>¥199 起</b>（健身/宠物/启蒙 ¥399 内），旗舰一人公司 ¥1999，定制 ¥999 起。👉 <a href="store.html" style="color:#C084FC">看价格</a>' },
        { k:['定制','专属','定制同款'], html:'可以！把需求告诉我，<b>按你的行业/场景定制</b>，交付源码、改品牌即上线。👉 <a href="../landing.html" style="color:#C084FC">去定制</a>' },
        { k:['接单','交付','干活','派单'], html:'你有交付能力（AI开发/设计/文案/视频）？<b>登记进交付网络</b>，有单派给你。👉 <a href="../partner-form.html" style="color:#C084FC">去登记</a>' },
        { k:['合作','投资','融资','招商'], html:'我们在找 <b>技术/渠道/内容/投资</b> 合作方，欢迎聊。👉 <a href="../invest.html" style="color:#C084FC">看招商中心</a>' },
        { k:['案例','效果','成果','靠谱'], html:'36 个行业案例，每个都有<b>客户故事+成果数据+证言</b>。👉 <a href="../demo-gallery.html" style="color:#C084FC">看案例</a>' },
        { k:['会员','权益','pro'], html:'Pro ¥99/月、企业 ¥999/月，解锁全部工具/玩法/优先派单。👉 <a href="member.html" style="color:#C084FC">看会员</a>' },
        { k:['联系','微信','电话','找谁'], html:'商务联系：<b>shim16506@gmail.com</b>，或从招商中心直接对接。' },
        { k:['模板','素材','提示词'], html:'市集有提示词包/SOP/模板，数字资源<b>自动交付</b>。👉 <a href="mall.html" style="color:#C084FC">逛市集</a>' }
    ];
    for (const r of rules) { if (r.k.some(x => s.includes(x))) return r; }
    return { html:'这个我还得查一下～你可以试试问我 <b>卖什么 / 怎么下单 / 多少钱 / 能定制吗</b>，或者 <a href="store.html" style="color:#C084FC">直接逛商店</a>。' };
}

/* ===== PWA 化：可安装到手机桌面（像真 APP） ===== */
function cfPWA(){
    // manifest（内联，免外部文件）
    if (!document.querySelector('link[rel="manifest"]')) {
        const manifest = {
            name: 'Crazy Friday · 一人公司生态',
            short_name: 'Crazy Friday',
            description: 'AI 一人公司创业生态：工具/接单/变现/案例',
            start_url: 'index.html',
            display: 'standalone',
            background_color: '#0d0420',
            theme_color: '#0d0420',
            icons: [{ src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#7C3AED"/><text x="50" y="62" font-size="42" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">CF</text></svg>'), sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
        };
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(manifest));
        document.head.appendChild(link);
    }
    // iOS 全屏 meta
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const m = document.createElement('meta'); m.name = 'apple-mobile-web-app-capable'; m.content = 'yes';
        const s = document.createElement('meta'); s.name = 'apple-mobile-web-app-status-bar-style'; s.content = 'black-translucent';
        document.head.appendChild(m); document.head.appendChild(s);
    }
    // 首次访问：引导添加到主屏幕（一次性）
    try {
        if (!localStorage.getItem('cf_pwa_tip')) {
            localStorage.setItem('cf_pwa_tip', '1');
            setTimeout(() => {
                const tip = document.createElement('div');
                tip.style.cssText = 'position:fixed;left:12px;right:12px;bottom:90px;z-index:998;background:linear-gradient(160deg,#1a0d2e,#140a26);border:1px solid rgba(168,85,247,.4);border-radius:16px;padding:13px 15px;font-size:11px;line-height:1.7;box-shadow:0 12px 40px rgba(0,0,0,.5);color:#d8d0f0';
                tip.innerHTML = '📱 <b>想当 APP 用？</b><br>浏览器菜单 → <b>添加到主屏幕</b>，就能像 APP 一样打开。';
                const btn = document.createElement('span');
                btn.style.cssText = 'display:inline-block;margin-top:8px;padding:7px 16px;border-radius:14px;background:linear-gradient(135deg,#A855F7,#EC4899);color:#fff;font-weight:900;font-size:11px';
                btn.textContent = '知道了';
                btn.onclick = () => tip.remove();
                tip.appendChild(document.createElement('br'));
                tip.appendChild(btn);
                document.body.appendChild(tip);
                setTimeout(() => { try { tip.remove(); } catch(e){} }, 8000);
            }, 2500);
        }
    } catch(e) {}
}
document.addEventListener('DOMContentLoaded', cfPWA);

/* ===== 全局数据层 & 权限体系（自动化盈利系统 v1） ===== */
const CF_CLOUD = 'https://jsonblob.com/api/jsonBlob/019ff242-81a8-7e0f-b2cf-3a5e938a6a6c';
const CF_ME_KEY = 'cf_member_level';

/* 会员级别：free / pro / biz */
function cfMemberLevel(){ try{ return localStorage.getItem(CF_ME_KEY)||'free' }catch(e){ return 'free' } }
function setMemberLevel(lv){ try{ localStorage.setItem(CF_ME_KEY, lv||'free') }catch(e){} }

/* 权限门禁：need = pro | biz；未达标弹升级提示 */
window.__guard = function(need){
    const rank = {free:0, pro:1, biz:2};
    const lv = cfMemberLevel();
    if ((rank[lv]||0) >= (rank[need]||1)) return true;
    if (confirm('🔒 这是会员专属功能\n\n升级解锁：Pro ¥99/月 或 企业 ¥999/月\n\n现在去开通？')) {
        location.href = 'member.html';
    }
    return false;
};

/* 成交滚动条：实时成交记录 → 信任感可视化 */
function cfTicker(){
    const hosts = document.querySelectorAll('[data-ticker]');
    if (!hosts.length) return;
    if (!document.getElementById('cf-ticker-style')) {
        const st = document.createElement('style'); st.id = 'cf-ticker-style';
        st.textContent = `
.cf-ticker-wrap { overflow:hidden; border-radius:14px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.09); margin:0 0 14px; position:relative; z-index:2; }
.cf-ticker { display:flex; white-space:nowrap; padding:11px 0; animation:cf-scroll 28s linear infinite; }
.cf-ticker:hover { animation-play-state:paused; }
@keyframes cf-scroll { 0%{ transform:translateX(0); } 100%{ transform:translateX(-50%); } }
.cf-tk { display:inline-flex; align-items:center; gap:7px; font-size:11.5px; color:#d8d0f0; padding:0 18px; }
.cf-tk .chk { color:#34D399; font-weight:900; }
.cf-tk b { color:#FFD700; }
.cf-tk .tm { color:#6d6489; font-size:10px; }
.cf-tk-sep { width:1px; height:12px; background:rgba(255,255,255,.12); margin:0 6px; }
`;
        document.head.appendChild(st);
    }
    const seed = [
        {sku_name:'AI工作台定制', price:299, time:'今天 09:42'},
        {sku_name:'小红书提示词包', price:29, time:'今天 09:15'},
        {sku_name:'变现玩法 SOP 合集', price:69, time:'昨天 21:03'},
        {sku_name:'AI 漫剧代工', price:999, time:'昨天 16:20'},
        {sku_name:'Pro 会员开通', price:99, time:'昨天 11:47'},
        {sku_name:'定制 AI 应用', price:499, time:'前天 14:05'}
    ];
    function render(list){
        if (!list || !list.length) list = seed.map(s => ({...s, demo:true}));
        const inner = list.map(o => `
            <span class="cf-tk"><span class="chk">✓</span>刚刚成交 <b>¥${o.price}</b> · ${o.sku_name}<span class="tm">${o.time||''}</span></span><span class="cf-tk-sep"></span>`).join('');
        const half = `<div class="cf-ticker">${inner}${inner}</div>`;
        hosts.forEach(h => { h.innerHTML = `<div class="cf-ticker-wrap">${half}</div>`; });
    }
    fetch(CF_CLOUD).then(r=>r.json()).then(c=>{
        const orders = (c.orders||[]).filter(o => o.pay_status === 'paid').slice(0, 12);
        render(orders.length ? orders.map(o=>({sku_name:o.sku_name, price:o.price, time:(o.time||'').slice(5,16)})) : null);
    }).catch(()=>render(null));
}
