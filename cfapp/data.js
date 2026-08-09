// Crazy Friday App · 社区数据层（所有页面共享，localStorage持久化）
const LS_KEY = 'cf_community_v1';

// 默认帖子数据
const SEED_POSTS = [
    {
        id: 'p1',
        author: '时铭',
        authorDesc: 'Crazy Friday · 疯狂星期五',
        avatar: '🦄',
        time: '2026-08-09 09:00',
        title: '疯狂星期五',
        tags: ['🤖 AI', '🏢 一人公司', '💰 变现'],
        content: '一个人+AI就是一家公司。在这个AI时代，个体能力被空前放大。我们提供：AI工作台、接单工坊、AI漫剧、商品市集——帮你把想法变成现金流。',
        like: 128,
        liked: false,
        fav: 56,
        faved: false,
        comment: 1,
        views: 2356
    },
    {
        id: 'p2',
        author: '时铭',
        authorDesc: 'Crazy Friday · 疯狂星期五',
        avatar: '🦄',
        time: '2026-08-08 20:30',
        title: '一人公司怎么落地？3个核心',
        tags: ['💡 思考', '🏢 一人公司'],
        content: '1️⃣ 选对战场：找AI能放大你优势的赛道\n2️⃣ 跑通闭环：先低价卖出去一个\n3️⃣ 建交付网络：自己+外包+AI，一个人就是团队\n\n执行力比想法重要100倍。',
        like: 89,
        liked: false,
        fav: 34,
        faved: false,
        comment: 5,
        views: 1890
    },
    {
        id: 'p3',
        author: '时铭',
        authorDesc: 'Crazy Friday · 疯狂星期五',
        avatar: '🦄',
        time: '2026-08-07 15:00',
        title: 'AI变现的4条路',
        tags: ['💰 变现', '🤖 AI'],
        content: '做内容：小红书/抖音引流\n做产品：AI工具/提示词包\n做服务：定制开发/咨询\n做中介：接单派单赚差价\n\n每条路都能月入过万，关键是选一条先跑通。',
        like: 210,
        liked: false,
        fav: 98,
        faved: false,
        comment: 12,
        views: 4520
    },
    {
        id: 'p4',
        author: '时铭',
        authorDesc: 'Crazy Friday · 疯狂星期五',
        avatar: '🦄',
        time: '2026-08-06 10:00',
        title: '接单工坊：怎么赚差价',
        tags: ['📋 接单', '💰 变现'],
        content: '你有客户，我有交付。\n接客户单 → 派给靠谱合作商 → 赚差价。\n关键：找到3-5个靠谱的交付伙伴，你专注获客和服务。',
        like: 76,
        liked: false,
        fav: 42,
        faved: false,
        comment: 3,
        views: 1230
    },
    {
        id: 'p5',
        author: '时铭',
        authorDesc: 'Crazy Friday · 疯狂星期五',
        avatar: '🦄',
        time: '2026-08-05 18:30',
        title: 'AI工作台：让生意数字化',
        tags: ['🛠️ 工具', '🏢 一人公司'],
        content: '每个生意都该有一个AI工作台：\n财务、客户、订单、内容、复盘——全部自动化。\n打开就知道今天该干什么，这就是数字化的意义。',
        like: 150,
        liked: false,
        fav: 60,
        faved: false,
        comment: 8,
        views: 3200
    }
];

const SEED_COMMENTS = {
    p1: [{ name: '灵光用户_8K2L', avatar: '🌟', text: '这个理念太戳我了！一个人+AI真的可以做成一家公司吗？想了解', time: '5分钟前', like: 3 }],
    p2: [{ name: '创业路上的阿明', avatar: '🚀', text: '跑通闭环太重要了，先卖出去再优化', time: '1小时前', like: 5 }],
    p3: [{ name: 'AI探索者', avatar: '💎', text: '服务这条线最稳，感谢分享', time: '2小时前', like: 2 }],
    p4: [{ name: '老王工作室', avatar: '🤝', text: '靠谱交付伙伴确实关键，欢迎合作', time: '3小时前', like: 4 }],
    p5: [{ name: '数字游民小C', avatar: '🌴', text: '正在用工作台管理我的小店，确实方便', time: '5小时前', like: 6 }]
};

// 读取数据
function loadCommunity() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(LS_KEY)); } catch(e) {}
    if (!d) {
        d = {
            posts: SEED_POSTS,
            comments: JSON.parse(JSON.stringify(SEED_COMMENTS)),
            following: false,
            myPosts: [],
            myFavs: [],
            notifications: [
                { icon: '👍', text: '有人点赞了你的帖子', time: '10分钟前', read: false },
                { icon: '💬', text: '老王工作室评论了你的帖子', time: '1小时前', read: false },
                { icon: '👥', text: '3位新用户关注了你', time: '昨天', read: true }
            ]
        };
        saveCommunity(d);
    }
    return d;
}
function saveCommunity(d) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ===== 帖子操作 =====
function getPosts() { return loadCommunity().posts; }
function getPost(id) { return loadCommunity().posts.find(p => p.id === id); }
function getComments(postId) { return loadCommunity().comments[postId] || []; }

function toggleLikePost(id) {
    const d = loadCommunity();
    const p = d.posts.find(x => x.id === id);
    if (!p) return;
    p.liked = !p.liked;
    p.like += p.liked ? 1 : -1;
    saveCommunity(d);
    return p;
}
function toggleFavPost(id) {
    const d = loadCommunity();
    const p = d.posts.find(x => x.id === id);
    if (!p) return;
    p.faved = !p.faved;
    p.fav += p.faved ? 1 : -1;
    if (p.faved) {
        if (!d.myFavs.includes(id)) d.myFavs.push(id);
    } else {
        d.myFavs = d.myFavs.filter(x => x !== id);
    }
    saveCommunity(d);
    return p;
}

// ===== 发布帖子 =====
function publishPost(title, content, tags) {
    const d = loadCommunity();
    const now = new Date();
    const t = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    const post = {
        id: 'p_' + Date.now(),
        author: '时铭',
        authorDesc: 'Crazy Friday · 疯狂星期五',
        avatar: '🦄',
        time: t,
        title: title || '无标题',
        tags: tags && tags.length ? tags : ['💡 思考'],
        content: content || '',
        like: 0, liked: false, fav: 0, faved: false, comment: 0, views: 0
    };
    d.posts.unshift(post);
    d.myPosts.unshift(post.id);
    saveCommunity(d);
    return post;
}

// ===== 评论 =====
function addComment(postId, text) {
    const d = loadCommunity();
    if (!d.comments[postId]) d.comments[postId] = [];
    d.comments[postId].push({
        name: '我', avatar: '🦄', text, time: '刚刚', like: 0
    });
    const p = d.posts.find(x => x.id === postId);
    if (p) p.comment++;
    saveCommunity(d);
}

// ===== 关注 =====
function toggleFollow() {
    const d = loadCommunity();
    d.following = !d.following;
    saveCommunity(d);
    return d.following;
}

// ===== 通知已读 =====
function markAllRead() {
    const d = loadCommunity();
    d.notifications.forEach(n => n.read = true);
    saveCommunity(d);
}

// ===== 我的帖子 =====
function getMyPosts() {
    const d = loadCommunity();
    return d.posts.filter(p => d.myPosts.includes(p.id));
}
function getMyFavPosts() {
    const d = loadCommunity();
    return d.posts.filter(p => d.myFavs.includes(p.id));
}

// 工具函数
function fmtCount(n) {
    if (n >= 10000) return (n/10000).toFixed(1) + 'w';
    if (n >= 1000) return (n/1000).toFixed(1) + 'k';
    return n;
}
function timeAgo(t) {
    return t;
}
function toast(m) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = m;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
}