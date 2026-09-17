/* Service Worker - 离线缓存支持 V6.53.0 */
const CACHE = 'xhs-wb-v58';
const FILES = ['./','./index.html','./css/styles.css','./js/data.js','./js/license.js','./js/app.js','./js/pro-tools.js','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./seller.html','./buy.html','./p-home.html','./products.html'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return;
  // HTML 页面：network-first + 1.5s 超时回退缓存（V6.29：慢网秒开，不再等网络超时）
  const isHtml = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');
  if(isHtml){
    e.respondWith(
      new Promise(resolve=>{
        let done = false;
        const timer = setTimeout(()=>{
          if(done) return;
          done = true;
          caches.match(e.request).then(res=>resolve(res || caches.match('./index.html')));
        }, 1500);
        fetch(e.request).then(r=>{
          if(done) return;
          done = true;
          clearTimeout(timer);
          const copy = r.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy));
          resolve(r);
        }).catch(()=>{
          if(done) return;
          done = true;
          clearTimeout(timer);
          caches.match(e.request).then(res=>resolve(res || caches.match('./index.html')));
        });
      })
    );
    return;
  }
  // JS/CSS：stale-while-revalidate（先给缓存保持速度，后台拉新版，下次打开即最新）
  if(/\.(js|css)$/.test(url.pathname)){
    e.respondWith(
      caches.match(e.request).then(cached=>{
        const fetchP = fetch(e.request).then(r=>{
          const copy = r.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy));
          return r;
        }).catch(()=>cached);
        return cached || fetchP;
      })
    );
    return;
  }
  // V6.37 动态接口：绝不缓存（授权 / 热点 / 日报 / 机会 / AI 等必须实时走网络）。
  // 旧逻辑把它们当静态资源 cache-first 缓存 → 热点/日报永远不更新。
  if(/^\/(ping|verify|recover|issue|revoke|unrevoke|del-license|ai\b|ai-config|ai-ready|hotdaily|dailyreport|opportunity|dailytip|status|heartbeat|data-backup|backup-export|daily-snapshot|api\/|products|safety|today-due)/.test(url.pathname)){
    e.respondWith(fetch(e.request));
    return;
  }
  // 其他静态资源 cache-first 保证性能
  e.respondWith(
    caches.match(e.request).then(res=>res || fetch(e.request).then(r=>{
      const copy = r.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy));
      return r;
    }).catch(()=>caches.match('./index.html')))
  );
});
