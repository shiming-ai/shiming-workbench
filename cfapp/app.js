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
});

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
