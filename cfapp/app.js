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
});
