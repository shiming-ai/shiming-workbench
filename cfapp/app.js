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
const CF_LOGO_AVATAR = "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Cdefs%3E%0A%20%20%20%20%3CradialGradient%20id%3D%22bg%22%20cx%3D%2250%25%22%20cy%3D%2248%25%22%20r%3D%2262%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23f0fdfa%22%2F%3E%3Cstop%20offset%3D%2260%25%22%20stop-color%3D%22%23e0f2fe%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23cffafe%22%20stop-opacity%3D%22.3%22%2F%3E%3C%2FradialGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22bodyG%22%20x1%3D%2250%25%22%20y1%3D%220%25%22%20x2%3D%2250%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ffffff%22%2F%3E%3Cstop%20offset%3D%2260%25%22%20stop-color%3D%22%23f1f5f9%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23cbd5e1%22%2F%3E%3C%2FlinearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22headG%22%20x1%3D%2250%25%22%20y1%3D%220%25%22%20x2%3D%2250%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ffffff%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23e2e8f0%22%2F%3E%3C%2FlinearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22screenG%22%20x1%3D%2250%25%22%20y1%3D%220%25%22%20x2%3D%2250%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ecfeff%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23a7f3d0%22%2F%3E%3C%2FlinearGradient%3E%0A%20%20%20%20%3CradialGradient%20id%3D%22eyeG%22%20cx%3D%2250%25%22%20cy%3D%2240%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%235eead4%22%2F%3E%3Cstop%20offset%3D%2260%25%22%20stop-color%3D%22%232dd4bf%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230f766e%22%2F%3E%3C%2FradialGradient%3E%0A%20%20%20%20%3CradialGradient%20id%3D%22cheek%22%20cx%3D%2250%25%22%20cy%3D%2250%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%235eead4%22%20stop-opacity%3D%22.45%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%235eead4%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22tabletG%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ccfbf1%22%20stop-opacity%3D%22.92%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2367e8f9%22%20stop-opacity%3D%22.85%22%2F%3E%3C%2FlinearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22chipG%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%220%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%232dd4bf%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230d9488%22%2F%3E%3C%2FlinearGradient%3E%0A%20%20%20%20%3CradialGradient%20id%3D%22bodyShadow%22%20cx%3D%2250%25%22%20cy%3D%2250%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230f172a%22%20stop-opacity%3D%22.25%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230f172a%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%0A%20%20%3C%2Fdefs%3E%0A%0A%20%20%3C%21--%20%E8%83%8C%E6%99%AF%E5%9C%86%20--%3E%0A%20%20%3Ccircle%20cx%3D%22100%22%20cy%3D%22100%22%20r%3D%2298%22%20fill%3D%22url%28%23bg%29%22%2F%3E%0A%0A%20%20%3C%21--%20%E5%9C%B0%E9%9D%A2%E9%98%B4%E5%BD%B1%20--%3E%0A%20%20%3Cellipse%20cx%3D%22100%22%20cy%3D%22184%22%20rx%3D%2258%22%20ry%3D%226%22%20fill%3D%22url%28%23bodyShadow%29%22%2F%3E%0A%0A%20%20%3C%21--%20%E8%BA%AB%E4%BD%93%EF%BC%88%E5%9C%86%E6%B6%A6%E6%A4%AD%E5%9C%86%20%2B%20%E9%98%B4%E5%BD%B1%EF%BC%89%20--%3E%0A%20%20%3Cellipse%20cx%3D%22100%22%20cy%3D%22138%22%20rx%3D%2246%22%20ry%3D%2242%22%20fill%3D%22url%28%23bodyShadow%29%22%20opacity%3D%22.4%22%2F%3E%0A%20%20%3Cellipse%20cx%3D%22100%22%20cy%3D%22136%22%20rx%3D%2244%22%20ry%3D%2240%22%20fill%3D%22url%28%23bodyG%29%22%2F%3E%0A%20%20%3C%21--%20%E8%BA%AB%E4%BD%93%E9%AB%98%E5%85%89%20--%3E%0A%20%20%3Cellipse%20cx%3D%2282%22%20cy%3D%22114%22%20rx%3D%2220%22%20ry%3D%2212%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.7%22%2F%3E%0A%20%20%3Cellipse%20cx%3D%2276%22%20cy%3D%22108%22%20rx%3D%228%22%20ry%3D%225%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.9%22%2F%3E%0A%20%20%3C%21--%20%E8%BA%AB%E4%BD%93%E5%BA%95%E9%83%A8%E9%98%B4%E5%BD%B1%20--%3E%0A%20%20%3Cellipse%20cx%3D%22100%22%20cy%3D%22168%22%20rx%3D%2234%22%20ry%3D%225%22%20fill%3D%22%2394a3b8%22%20opacity%3D%22.25%22%2F%3E%0A%0A%20%20%3C%21--%20%E8%83%B8%E5%89%8D%E8%8A%AF%E7%89%87%20--%3E%0A%20%20%3Crect%20x%3D%2286%22%20y%3D%22124%22%20width%3D%2228%22%20height%3D%2226%22%20rx%3D%227%22%20fill%3D%22url%28%23chipG%29%22%2F%3E%0A%20%20%3Crect%20x%3D%2288%22%20y%3D%22126%22%20width%3D%2224%22%20height%3D%2222%22%20rx%3D%225%22%20fill%3D%22%230d9488%22%2F%3E%0A%20%20%3C%21--%20%E8%8A%AF%E7%89%87%E9%97%AA%E7%94%B5%E7%AC%A6%E5%8F%B7%EF%BC%88%E7%99%BD%E8%89%B2%EF%BC%89%20--%3E%0A%20%20%3Cpath%20d%3D%22M%20102%20130%20L%2095%20140%20L%20100%20140%20L%2096%20148%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%222.4%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%20%20%3C%21--%20%E8%8A%AF%E7%89%87%E5%91%A8%E8%BE%B9%E5%8F%91%E5%85%89%E5%9C%88%20--%3E%0A%20%20%3Ccircle%20cx%3D%22100%22%20cy%3D%22137%22%20r%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%235eead4%22%20stroke-width%3D%22.5%22%20opacity%3D%22.4%22%2F%3E%0A%0A%20%20%3C%21--%20%E5%A4%B4%E9%83%A8%E9%98%B4%E5%BD%B1%E6%8A%95%E5%B0%84%20--%3E%0A%20%20%3Cellipse%20cx%3D%22100%22%20cy%3D%22106%22%20rx%3D%2242%22%20ry%3D%225%22%20fill%3D%22%230f172a%22%20opacity%3D%22.12%22%2F%3E%0A%0A%20%20%3C%21--%20%E5%A4%B4%E9%83%A8%E5%A4%96%E6%A1%86%EF%BC%88%E5%9C%86%E8%A7%92%E6%96%B9%E5%BD%A2%EF%BC%89%20--%3E%0A%20%20%3Crect%20x%3D%2244%22%20y%3D%2246%22%20width%3D%22112%22%20height%3D%2272%22%20rx%3D%2228%22%20fill%3D%22url%28%23headG%29%22%2F%3E%0A%20%20%3C%21--%20%E5%A4%B4%E9%83%A8%E9%A1%B6%E9%83%A8%E9%AB%98%E5%85%89%20--%3E%0A%20%20%3Crect%20x%3D%2248%22%20y%3D%2250%22%20width%3D%22104%22%20height%3D%2224%22%20rx%3D%2218%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.55%22%2F%3E%0A%20%20%3Cellipse%20cx%3D%22100%22%20cy%3D%2252%22%20rx%3D%2238%22%20ry%3D%228%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.8%22%2F%3E%0A%20%20%3C%21--%20%E5%A4%B4%E9%83%A8%E8%BE%B9%E7%BC%98%E9%87%91%E5%B1%9E%E7%BA%BF%20--%3E%0A%20%20%3Crect%20x%3D%2244%22%20y%3D%2246%22%20width%3D%22112%22%20height%3D%2272%22%20rx%3D%2228%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%2F%3E%0A%20%20%3Crect%20x%3D%2246%22%20y%3D%2248%22%20width%3D%22108%22%20height%3D%2268%22%20rx%3D%2226%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%22.8%22%20opacity%3D%22.6%22%2F%3E%0A%0A%20%20%3C%21--%20%E5%B1%8F%E5%B9%95%E5%86%85%E5%8C%BA%E5%9F%9F%EF%BC%88%E6%B5%85%E8%93%9D%E7%BB%BF%E6%B8%90%E5%8F%98%EF%BC%89%20--%3E%0A%20%20%3Crect%20x%3D%2254%22%20y%3D%2256%22%20width%3D%2292%22%20height%3D%2254%22%20rx%3D%2218%22%20fill%3D%22url%28%23screenG%29%22%2F%3E%0A%20%20%3Crect%20x%3D%2254%22%20y%3D%2256%22%20width%3D%2292%22%20height%3D%2220%22%20rx%3D%2214%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.4%22%2F%3E%0A%0A%20%20%3C%21--%20%E5%BC%A7%E5%BD%A2%E7%9C%89%E6%AF%9B%EF%BC%88%E5%8F%8B%E5%A5%BD%E5%BE%AE%E7%AC%91%E4%B8%8A%E6%89%AC%EF%BC%89%20--%3E%0A%20%20%3Cpath%20d%3D%22M%2066%2068%20Q%2076%2060%2086%2067%22%20stroke%3D%22%23475569%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%20114%2067%20Q%20124%2060%20134%2068%22%20stroke%3D%22%23475569%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%0A%0A%20%20%3C%21--%20%E7%9C%BC%E7%9D%9B%EF%BC%88%E5%9C%86%E8%A7%92%E7%9F%A9%E5%BD%A2%20%2B%20%E8%93%9D%E7%BB%BF%E5%8F%91%E5%85%89%E6%B8%90%E5%8F%98%EF%BC%89%20--%3E%0A%20%20%3Crect%20x%3D%2268%22%20y%3D%2274%22%20width%3D%2215%22%20height%3D%2222%22%20rx%3D%227.5%22%20fill%3D%22url%28%23eyeG%29%22%2F%3E%0A%20%20%3Crect%20x%3D%22117%22%20y%3D%2274%22%20width%3D%2215%22%20height%3D%2222%22%20rx%3D%227.5%22%20fill%3D%22url%28%23eyeG%29%22%2F%3E%0A%20%20%3C%21--%20%E7%9C%BC%E7%9D%9B%E9%AB%98%E5%85%89%20--%3E%0A%20%20%3Cellipse%20cx%3D%2272%22%20cy%3D%2279%22%20rx%3D%223.5%22%20ry%3D%222.8%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.95%22%2F%3E%0A%20%20%3Cellipse%20cx%3D%22121%22%20cy%3D%2279%22%20rx%3D%223.5%22%20ry%3D%222.8%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.95%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%2276%22%20cy%3D%2286%22%20r%3D%221.2%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.7%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%22125%22%20cy%3D%2286%22%20r%3D%221.2%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.7%22%2F%3E%0A%0A%20%20%3C%21--%20%E5%98%B4%E5%B7%B4%EF%BC%88%E5%8F%8B%E5%A5%BD%E5%BE%AE%E7%AC%91%E5%B0%8F%E5%BC%A7%EF%BC%89%20--%3E%0A%20%20%3Cpath%20d%3D%22M%2090%20100%20Q%20100%20108%20110%20100%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.2%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%0A%0A%20%20%3C%21--%20%E8%85%AE%E7%BA%A2%EF%BC%88%E6%B7%A1%E8%93%9D%E7%BB%BF%E5%85%89%E6%99%95%EF%BC%89%20--%3E%0A%20%20%3Ccircle%20cx%3D%2262%22%20cy%3D%2292%22%20r%3D%226%22%20fill%3D%22url%28%23cheek%29%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%22138%22%20cy%3D%2292%22%20r%3D%226%22%20fill%3D%22url%28%23cheek%29%22%2F%3E%0A%0A%20%20%3C%21--%20%E5%A4%B4%E9%A1%B6%E5%A4%A9%E7%BA%BF%EF%BC%88%E4%B8%A4%E6%A0%B9%20%2B%20%E8%93%9D%E7%BB%BF%E5%B0%8F%E7%90%83%EF%BC%89%20--%3E%0A%20%20%3Cline%20x1%3D%2282%22%20y1%3D%2248%22%20x2%3D%2280%22%20y2%3D%2234%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.2%22%20stroke-linecap%3D%22round%22%2F%3E%0A%20%20%3Cline%20x1%3D%22118%22%20y1%3D%2248%22%20x2%3D%22120%22%20y2%3D%2234%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.2%22%20stroke-linecap%3D%22round%22%2F%3E%0A%20%20%3C%21--%20%E5%B7%A6%E5%A4%A9%E7%BA%BF%E5%B0%8F%E7%90%83%20--%3E%0A%20%20%3Ccircle%20cx%3D%2280%22%20cy%3D%2232%22%20r%3D%225%22%20fill%3D%22%2314b8a6%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%2280%22%20cy%3D%2232%22%20r%3D%223%22%20fill%3D%22%235eead4%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%2279%22%20cy%3D%2230%22%20r%3D%221.5%22%20fill%3D%22%23ffffff%22%2F%3E%0A%20%20%3C%21--%20%E5%8F%B3%E5%A4%A9%E7%BA%BF%E5%B0%8F%E7%90%83%20--%3E%0A%20%20%3Ccircle%20cx%3D%22120%22%20cy%3D%2232%22%20r%3D%225%22%20fill%3D%22%2314b8a6%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%22120%22%20cy%3D%2232%22%20r%3D%223%22%20fill%3D%22%235eead4%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%22119%22%20cy%3D%2230%22%20r%3D%221.5%22%20fill%3D%22%23ffffff%22%2F%3E%0A%20%20%3C%21--%20%E5%A4%A9%E7%BA%BF%E5%B0%8F%E7%90%83%E5%BA%95%E9%83%A8%E8%BF%9E%E6%8E%A5%E7%8E%AF%20--%3E%0A%20%20%3Ccircle%20cx%3D%2280%22%20cy%3D%2232%22%20r%3D%226.5%22%20fill%3D%22none%22%20stroke%3D%22%235eead4%22%20stroke-width%3D%22.8%22%20opacity%3D%22.35%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%22120%22%20cy%3D%2232%22%20r%3D%226.5%22%20fill%3D%22none%22%20stroke%3D%22%235eead4%22%20stroke-width%3D%22.8%22%20opacity%3D%22.35%22%2F%3E%0A%0A%20%20%3C%21--%20%E6%89%8B%E8%87%82%EF%BC%88%E6%8A%B1%E5%B9%B3%E6%9D%BF%EF%BC%89%20--%3E%0A%20%20%3C%21--%20%E5%B7%A6%E8%87%82%20--%3E%0A%20%20%3Cellipse%20cx%3D%2264%22%20cy%3D%22142%22%20rx%3D%229%22%20ry%3D%2211%22%20fill%3D%22url%28%23bodyG%29%22%20transform%3D%22rotate%28-18%2064%20142%29%22%2F%3E%0A%20%20%3Cellipse%20cx%3D%2262%22%20cy%3D%22138%22%20rx%3D%224%22%20ry%3D%225%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.5%22%20transform%3D%22rotate%28-18%2062%20138%29%22%2F%3E%0A%20%20%3C%21--%20%E5%8F%B3%E8%87%82%20--%3E%0A%20%20%3Cellipse%20cx%3D%22136%22%20cy%3D%22142%22%20rx%3D%229%22%20ry%3D%2211%22%20fill%3D%22url%28%23bodyG%29%22%20transform%3D%22rotate%2818%20136%20142%29%22%2F%3E%0A%20%20%3Cellipse%20cx%3D%22138%22%20cy%3D%22138%22%20rx%3D%224%22%20ry%3D%225%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.5%22%20transform%3D%22rotate%2818%20138%20138%29%22%2F%3E%0A%0A%20%20%3C%21--%20%E9%80%8F%E6%98%8E%E5%B9%B3%E6%9D%BF%EF%BC%88%E8%AE%A2%E5%8D%95%2F%E5%B7%A5%E5%85%B7%E9%9D%A2%E6%9D%BF%EF%BC%89%20--%3E%0A%20%20%3Cg%3E%0A%20%20%20%20%3Crect%20x%3D%2258%22%20y%3D%22122%22%20width%3D%2284%22%20height%3D%2252%22%20rx%3D%227%22%20fill%3D%22url%28%23tabletG%29%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2258%22%20y%3D%22122%22%20width%3D%2284%22%20height%3D%2252%22%20rx%3D%227%22%20fill%3D%22none%22%20stroke%3D%22%235eead4%22%20stroke-width%3D%221.6%22%20opacity%3D%22.85%22%2F%3E%0A%20%20%20%20%3C%21--%20%E5%B9%B3%E6%9D%BF%E9%A1%B6%E9%83%A8%E5%8F%8D%E5%85%89%20--%3E%0A%20%20%20%20%3Crect%20x%3D%2258%22%20y%3D%22122%22%20width%3D%2284%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.4%22%2F%3E%0A%20%20%20%20%3C%21--%20%E5%B9%B3%E6%9D%BF%E5%86%85%E5%AE%B9%EF%BC%9A%E8%AE%A2%E5%8D%95%E5%8D%A1%E7%89%87%20--%3E%0A%20%20%20%20%3Crect%20x%3D%2264%22%20y%3D%22130%22%20width%3D%2256%22%20height%3D%225%22%20rx%3D%222%22%20fill%3D%22%230d9488%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2264%22%20y%3D%22140%22%20width%3D%2242%22%20height%3D%223%22%20rx%3D%221.5%22%20fill%3D%22%235eead4%22%20opacity%3D%22.85%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2264%22%20y%3D%22146%22%20width%3D%2250%22%20height%3D%223%22%20rx%3D%221.5%22%20fill%3D%22%235eead4%22%20opacity%3D%22.85%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2264%22%20y%3D%22152%22%20width%3D%2236%22%20height%3D%223%22%20rx%3D%221.5%22%20fill%3D%22%235eead4%22%20opacity%3D%22.85%22%2F%3E%0A%20%20%20%20%3C%21--%20%E5%B9%B3%E6%9D%BF%E5%8F%B3%E4%B8%8B%EF%BC%9A%E7%BB%BF%E8%89%B2%20%E2%9C%93%20%E5%9C%88%20--%3E%0A%20%20%20%20%3Ccircle%20cx%3D%22128%22%20cy%3D%22163%22%20r%3D%227%22%20fill%3D%22%2314b8a6%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%20124%20163%20L%20127%20166%20L%20132%20160%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%221.8%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A";
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
