/* ================= Crazy Friday. 授权系统（云端双轨 V5.4） =================
 * 客户激活码机制：专属链接(uid) 隔离数据 + 激活码控制有效期
 * 双轨校验：
 *   本地：快速解码激活码（防"随手改日期"）
 *   云端：白名单登记校验（防破解，可远程吊销），配置 xhs_cloud_api 后生效
 *   降级：云端不可达时自动用本地校验，绝不误锁正常用户
 */
'use strict';
const LIC_SEED = 20260826; // 混淆种子（防轻易破解）

/* ---------- 获取当前客户 uid（优先 URL 参数，其次本地记忆） ---------- */
function getUid(){
  // V6.33 体验模式数据隔离：体验模式使用独立的 uid，
  // 数据 key / 授权 key 全部走独立命名空间，绝不碰真实客户数据
  if(window.__DEMO_MODE__) return '__DEMO__';
  const stored = (localStorage.getItem('xhs_uid')||'').trim();
  // V6.37 安全修复：URL 上的 ?uid= 参数不得覆盖本机已有身份。
  // 旧逻辑会无条件写入 localStorage —— 任何人打开带 uid 的分享/专属/测试链接，
  // 本机身份就被改写：授权键错位 → 被要求重新输激活码；
  // 数据键错位 → 可能读到/写到其他客户的数据（数据串！）。
  // 现在：本机已有身份 → 一律用本机身份；只有全新（无身份）时 URL uid 才作为初始身份。
  try{
    const q = new URLSearchParams(location.search).get('uid');
    if(q && q.match(/^[A-Za-z0-9_-]{4,24}$/)){
      if(!stored){ localStorage.setItem('xhs_uid', q); return q; }
      return stored;
    }
  }catch(e){}
  return stored;
}
/* V6.37 数据/授权隔离增强：扫描本机所有激活记录，返回第一个真实 uid。
 * 用于身份被 URL 污染 / 缓存被清后自动找回真实身份，避免输码与数据错位。 */
function findRealLicenseUid(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.indexOf('xhs_license_')===0 && k !== 'xhs_license___DEMO__'){
        try{
          const v = JSON.parse(localStorage.getItem(k)||'null');
          if(v && v.code && !v.revoked){ return k.slice('xhs_license_'.length); }
        }catch(e){}
      }
    }
  }catch(e){}
  return '';
}
function getStoreKey(uid, ws){
  // 数据 key = 版本 + 客户uid + 工作区（默认工作区保持老 key，兼容历史数据）
  const wsKey = ws && ws !== 'default' ? '__' + ws : '';
  return 'xhs_wb_data_v5' + (uid ? '__' + uid : '') + wsKey;
}

/* ---------- 激活码编解码 ----------
 * V2 紧凑格式：CF-XXXX-XXXX-XXXX (16 字符主体 + 3 短横 + 2 前缀 = 19 字符总)
 * 字符集：去易混 0/1/I/O/L 的 32 字符（A-Z + 2-7）
 * 16 字符 = 80 bit：
 *   - uid 7 字符 (35 bit)        → uid 完整字符
 *   - 到期 5 字符 (25 bit)        → yyyymmdd - 20250101 (0-99999 天 ≈ 274 年)
 *   - 套餐 1 字符 (5 bit)         → Y=尊享版, N=标准版
 *   - 校验 3 字符 (15 bit)        → SHA1 前 15 bit 防输错
 * 老格式（V1，~90 字符）通过长度检测自动兼容
 */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const B32_LEN = B32.length; // 32
function b32Enc(n, len){
  let s = '';
  for(let i=0;i<len;i++){ s = B32[n % B32_LEN] + s; n = Math.floor(n / B32_LEN); }
  return s;
}
function b32Dec(s){
  let n = 0;
  for(let i=0;i<s.length;i++){
    const c = B32.indexOf(s[i]);
    if(c < 0) return -1;
    n = n * B32_LEN + c;
  }
  return n;
}
function uidToNum(uid){
  // uid 7 字符 base32 → 数字
  if(!uid) return -1;
  return b32Dec(uid.toUpperCase());
}
function numToUid(n){
  return b32Enc(n, 7);
}
function dateToDays(yyyymmdd){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(yyyymmdd)) return -1;
  const y = +yyyymmdd.slice(0,4), m = +yyyymmdd.slice(5,7)-1, d = +yyyymmdd.slice(8,10);
  const base = new Date(2025, 0, 1).getTime();
  const t = new Date(y, m, d).getTime();
  return Math.round((t - base) / 864e5);
}
function daysToDate(days){
  if(days<0) return null;
  const t = new Date(2025, 0, 1).getTime() + days*864e5;
  const d = new Date(t);
  const p=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
async function sha15(s){
  // 取 SHA1 前 15 bit 作为校验
  if(typeof crypto !== 'undefined' && crypto.subtle){
    const enc = new TextEncoder().encode(s);
    const buf = await crypto.subtle.digest('SHA-1', enc);
    const arr = new Uint8Array(buf);
    return ((arr[0] << 7) | (arr[1] >> 1)) & 0x7FFF; // 15 bit
  }
  // 降级简单 hash
  let h = 0;
  for(let i=0;i<s.length;i++){ h = (h*131 + s.charCodeAt(i)) & 0x7FFFFFFF; }
  return h & 0x7FFF;
}
function licEncodeShort(uid, expireAt, plan){
  if(uid.length !== 7) return null;
  const uNum = uidToNum(uid); if(uNum<0) return null;
  const days = dateToDays(expireAt); if(days<0 || days>99999) return null;
  const pBit = plan==='尊享版' ? 1 : 0;
  const uPart = b32Enc(uNum, 7);
  const dPart = b32Enc(days, 5);
  const pPart = B32[pBit];
  const data = uPart + dPart + pPart;
  // 同步 hash
  let h = 0;
  for(let i=0;i<data.length;i++){ h = (h*131 + data.charCodeAt(i)) & 0x7FFFFFFF; }
  const cPart = b32Enc(h & 0x7FFF, 3);
  const body = data + cPart; // 16 base32 字符
  return 'CF-' + body.slice(0,4) + '-' + body.slice(4,8) + '-' + body.slice(8,12) + '-' + body.slice(12,16);
}
async function licDecodeShort(code){
  // 去掉短横
  const raw = String(code||'').replace(/[-\s]/g,'').toUpperCase();
  if(!raw.startsWith('CF')) return null;
  const body = raw.slice(2);
  if(body.length !== 16) return null;
  const uPart = body.slice(0,7), dPart = body.slice(7,12), pPart = body[12], cPart = body.slice(13,16);
  const uNum = b32Dec(uPart); if(uNum<0) return null;
  const days = b32Dec(dPart); if(days<0) return null;
  const date = daysToDate(days); if(!date) return null;
  const uid = numToUid(uNum);
  const plan = pPart === B32[1] ? '尊享版' : '标准版';
  // 校验
  const data = uPart + dPart + pPart;
  let h = 0;
  for(let i=0;i<data.length;i++){ h = (h*131 + data.charCodeAt(i)) & 0x7FFFFFFF; }
  const expected = b32Enc(h & 0x7FFF, 3);
  if(cPart !== expected) return null;
  return {uid, expireAt:date, plan};
}

/* 统一解码：自动识别 V1（老长码）和 V2（紧凑码） */
async function licDecodeAny(code){
  const raw = String(code||'').trim().replace(/^CF-/i,'').replace(/[-\s]/g,'');
  if(raw.length === 16) return await licDecodeShort(code); // V2 紧凑码（V2 不分大小写）
  // V1 老码：base64 区分大小写，原样解析
  try{
    let b64 = raw;
    while(b64.length % 4) b64 += '=';
    const decoded = atob(b64);
    let s = '';
    for(let i=0;i<decoded.length;i++){ s += String.fromCharCode(decoded.charCodeAt(i) ^ ((LIC_SEED >> (i%6)) & 0x3f)); }
    const obj = JSON.parse(decodeURIComponent(s));
    if(!obj.uid || !obj.expireAt) return null;
    return obj;
  }catch(e){ return null; }
}

/* ---------- 卖家工具：生成客户 ---------- */
/* 默认后端 API（工作台前端可部署在任何静态托管，如 GitHub Pages；
 * API 始终指向这个后端，客户在地址栏看不到它，只看到品牌域名） */
const DEFAULT_API = 'https://cf-cloud-sync.netlify.app/api';
function genCustomerUid(seq){
  // V2 紧凑 uid：7 字符 base32（去 C 前缀）
  return b32Enc(Date.now() % (32**7) + seq, 7);
}
function buildLicense(uid, expireAt, plan){
  // 优先紧凑格式，失败则降级 V1（兜底）
  if(uid.length === 7 && /^[A-Z2-7]{7}$/i.test(uid)){
    const short = licEncodeShort(uid.toUpperCase(), expireAt, plan);
    if(short) return short;
  }
  return licEncode({uid, expireAt, plan});
}
function buildCustomerLink(uid){
  const base = location.origin + location.pathname.replace(/[^/]*$/,'');
  let link = base + 'index.html?uid=' + uid;
  // 云端 API 地址带进专属链接（新链接客户自动走云端校验）：
  // 优先卖家后台配置的 API，否则使用默认后端（前端托管与后端解耦）
  let api = DEFAULT_API || '';
  try{
    const cfg = (typeof getCloudCfg==='function') ? getCloudCfg() : null;
    if(cfg && cfg.api) api = cfg.api;
  }catch(e){}
  // V6.12.3 缩短链接：一体托管时客户端会自动回退同源云端地址，无需 &cloud= 参数
  // 仅当 API 与当前 origin 不同（如外部 Worker / GitHub Pages 前置）才携带 cloud
  if(api && /^https?:\/\//i.test(api) && api.replace(/\/$/,'') !== location.origin.replace(/\/$/,'')){
    link += '&cloud=' + encodeURIComponent(api.replace(/\/$/,''));
  }
  return link;
}

/* 旧 licEncode/licDecode 保留兼容（V1 老码） */
function licEncode(obj){
  const s = encodeURIComponent(JSON.stringify(obj));
  let x = '';
  for(let i=0;i<s.length;i++){ x += String.fromCharCode(s.charCodeAt(i) ^ ((LIC_SEED >> (i%6)) & 0x3f)); }
  return 'CF-' + btoa(x).replace(/=+$/g,'');
}
function licDecode(code){
  try{
    let b64 = String(code||'').trim().replace(/^CF-/i,'');
    while(b64.length % 4) b64 += '=';
    const raw = atob(b64);
    let s = '';
    for(let i=0;i<raw.length;i++){ s += String.fromCharCode(raw.charCodeAt(i) ^ ((LIC_SEED >> (i%6)) & 0x3f)); }
    const obj = JSON.parse(decodeURIComponent(s));
    if(!obj.uid || !obj.expireAt) return null;
    return obj;
  }catch(e){ return null; }
}

/* ================= 云端校验（V5.4 + 一体托管 V5.8） ================= */
function getCloudConfig(){
  // 1) 专属链接携带的云端地址（新链接最可靠，无需任何配置）
  try{
    const q = new URLSearchParams(location.search).get('cloud');
    if(q && /^https?:\/\//i.test(q)) return {api: q.replace(/\/$/,'')};
  }catch(e){}
  // 2) 本地记忆（激活过带 cloud 的链接后自动保存，老链接打开也生效）
  try{
    const c = JSON.parse(localStorage.getItem('xhs_cloud_api')||'null');
    if(c && c.api) return c;
  }catch(e){}
  // 3) 一体托管回退：当前 origin 即云端 API（工作台与后端同源，无需任何配置）
  //    V6.12.3：这让专属链接可以省略 &cloud= 参数，链接大幅缩短
  //    V6.44 修复：必须排除纯静态托管域名。GitHub Pages 上 location.origin 是
  //    shiming-ai.github.io，静态站没有后端，兜底返回它会让 /recover /status 等请求
  //    全部打到静态站变成 404/405（实测 /recover 405）。此时应返回 null，让上层
  //    走「未配置云端」分支，而不是发出注定失败的请求。
  try{
    const o = location.origin || '';
    if(/^https?:\/\//i.test(o) && !/^https?:\/\/[^/]*github\.io$/i.test(o)
       && !/\/shiming-workbench/i.test(o)) return {api: o.replace(/\/$/,'')};
  }catch(e){}
  return null;
}
function setCloudConfig(cfg){
  if(cfg && cfg.api) localStorage.setItem('xhs_cloud_api', JSON.stringify(cfg));
  else localStorage.removeItem('xhs_cloud_api');
}
async function cloudCall(path, payload, withSecret){
  const cfg = getCloudConfig();
  if(!cfg || !cfg.api) return {ok:false, reason:'未配置云端', noCloud:true};
  const body = {...(payload||{})};
  if(withSecret && cfg.secret) body.secret = cfg.secret;
  let url = cfg.api.replace(/\/$/,'') + path;
  // V6.14 多产品：专属链接带 ?p=<产品ID> 时，云端请求透传该产品，数据按产品物理隔离
  // （小红书无 p 参数，行为与之前完全一致）
  try{
    const p = new URLSearchParams(location.search).get('p');
    if(p && p !== 'xhs') url += (path.indexOf('?') >= 0 ? '&' : '?') + 'p=' + encodeURIComponent(p);
  }catch(e){}
  try{
    const res = await fetch(url, {
      method: path==='/status' ? 'GET' : 'POST',
      headers: {'Content-Type':'application/json'},
      body: path==='/status' ? undefined : JSON.stringify(body)
    });
    // V6.33：HTTP 5xx / 网关错误页 → 明确标记 server_error，客户端据此绝不停用客户授权
    if(!res.ok){
      return {ok:false, reason:'授权服务暂时不可用（HTTP '+res.status+'）', code:'server_error'};
    }
    let j;
    try{ j = await res.json(); }
    catch(e){ return {ok:false, reason:'云端返回异常', code:'server_error'}; }
    if(j && !j.ok && !j.code) j.code = 'server_error';   // 旧版无 code 的失败，按服务端错误处理（不停用）
    return j;
  }catch(e){
    return {ok:false, reason:'云端不可达', offline:true};
  }
}
async function cloudVerify(code, uid){
  return cloudCall('/verify', {code, uid, fp: getDeviceFingerprint()}, false);
}
/* V6.28 客户数据云端备份/恢复：客户工作数据自动同步到云端（按客户隔离），
   重新激活/换设备/清缓存后自动恢复，数据永不丢。备份仅本人激活码可读写，卖家与其他人无法查看。 */
let __backupTimer = null;
function scheduleCloudBackup(data){
  try{
    if(!data) return;
    clearTimeout(__backupTimer);
    __backupTimer = setTimeout(()=>{ cloudBackup(data); }, 1500);
  }catch(e){}
}
async function cloudBackup(data){
  try{
    const st = getLicenseState();
    if(st.status !== 'activated') return;
    const uid = st.uid;
    if(!uid) return;
    let code = '';
    try{ const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(uid))||'null'); code = lic && lic.code ? lic.code : ''; }catch(e){}
    if(!code) return;
    const r = await cloudCall('/data-backup', {code, uid, data}, false);
    if(r && r.ok) localStorage.setItem('xhs_last_backup', r.savedAt || new Date().toISOString());
  }catch(e){}
}
async function cloudRestore(){
  try{
    const st = getLicenseState();
    if(st.status !== 'activated') return {ok:false, data:null};
    const uid = st.uid;
    if(!uid) return {ok:false, data:null};
    let code = '';
    try{ const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(uid))||'null'); code = lic && lic.code ? lic.code : ''; }catch(e){}
    if(!code) return {ok:false, data:null};
    const cfg = getCloudConfig();
    if(!cfg || !cfg.api) return {ok:false, data:null};
    let url = cfg.api.replace(/\/$/,'') + '/data-backup?code=' + encodeURIComponent(code) + '&uid=' + encodeURIComponent(uid);
    try{
      const p = new URLSearchParams(location.search).get('p');
      if(p && p !== 'xhs') url += '&p=' + encodeURIComponent(p);
    }catch(e){}
    const res = await fetch(url, { cache:'no-store' });
    const r = await res.json();
    if(r && r.ok && r.data) return {ok:true, data:r.data, savedAt:r.savedAt};
    return {ok:true, data:null};
  }catch(e){ return {ok:false, data:null}; }
}
async function cloudIssue(code, uid, expireAt, plan){
  return cloudCall('/issue', {code, uid, expireAt, plan}, true);
}
async function cloudRevoke(code){
  return cloudCall('/revoke', {code}, true);
}
async function cloudUnrevoke(code){
  return cloudCall('/unrevoke', {code}, true);
}
async function cloudPing(){
  const cfg = getCloudConfig();
  if(!cfg || !cfg.api) return {ok:false, reason:'未配置'};
  try{
    const res = await fetch(cfg.api.replace(/\/$/,'') + '/ping');
    return await res.json();
  }catch(e){ return {ok:false, reason:'无法连接', offline:true}; }
}

/* ---------- 授权状态 ---------- */
/* ---------- V6.33 授权防误杀：宽限 + 分级停用 ----------
 * 事故背景：只要云端返回任何 ok:false（含服务端 500 / 重启中 / 网关抖动），
 * 旧逻辑就立刻删除本地激活记录并 reload，把已付费客户踢回激活门要求重新输码。
 * 新策略（宁可放过、不可错杀）：
 *   1) 服务端返回结构化 code，客户端按严重程度分级处理
 *   2) 只有 revoked（卖家主动停用）会真的停用，且需连续 2 次确认，防网络抖动
 *   3) server_error / 未知错误 → 一律不停用，进入离线宽限
 *   4) 离线宽限 30 天：最后一次云端校验成功后 30 天内，完全不锁定
 */
const LIC_GRACE_MS = 30 * 24 * 3600 * 1000;   // 离线宽限 30 天
const LIC_REVOKE_CONFIRM = 2;                  // 停用需连续确认次数

function licFailKey(uid){ return 'xhs_licfail_' + (uid || 'default'); }
function getLicFail(uid){
  try{ return JSON.parse(localStorage.getItem(licFailKey(uid))||'null') || {revoked:0, other:0, last:''}; }
  catch(e){ return {revoked:0, other:0, last:''}; }
}
function setLicFail(uid, obj){
  try{ localStorage.setItem(licFailKey(uid), JSON.stringify(obj)); }catch(e){}
}
function clearLicFail(uid){
  try{ localStorage.removeItem(licFailKey(uid)); }catch(e){}
}
/* 把服务端 reason（可能是旧版中文自由文本）映射成结构化 code */
/* ---------- V6.33 设备指纹 + 静默找回 ---------- */
function getDeviceFingerprint(){
  try{
    const cached = localStorage.getItem('xhs_fp');
    if(cached && cached.length >= 12) return cached;
    const raw = [
      navigator.userAgent||'',
      navigator.language||'',
      String((new Date()).getTimezoneOffset()),
      String(screen.width||0)+'x'+String(screen.height||0),
      String(screen.colorDepth||0),
      String(navigator.hardwareConcurrency||0),
      String(navigator.platform||'')
    ].join('|');
    // FNV-1a 32bit ×2 拼成 64bit 十六进制，够稳且不可逆推原始信息
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for(let i=0;i<raw.length;i++){
      h1 ^= raw.charCodeAt(i); h1 = (h1 * 0x01000193) >>> 0;
      h2 = (h2 + raw.charCodeAt(i) * (i+7)) >>> 0;
    }
    const fp = h1.toString(16).padStart(8,'0') + h2.toString(16).padStart(8,'0');
    try{ localStorage.setItem('xhs_fp', fp); }catch(e){}
    return fp;
  }catch(e){ return ''; }
}
/* 本地没有激活记录时，向云端询问「这台设备之前激活过吗」，有则静默写回，用户无感 */
async function tryRecoverFromDevice(){
  try{
    if(window.__DEMO_MODE__) return {ok:false};   // 体验模式不参与找回，避免串到真实授权
    const cfg = getCloudConfig();
    if(!cfg || !cfg.api) return {ok:false};
    const fp = getDeviceFingerprint();
    if(!fp) return {ok:false};
    const st = getLicenseState();
    if(st.status === 'activated') return {ok:false};    // 已激活无需找回
    const r = await cloudCall('/recover', {fp, uid: getUid()}, false);
    if(!r || !r.ok || !r.data || !r.data.code) return {ok:false, reason:(r&&r.reason)||''};
    const d = r.data;
    const uid = d.uid || getUid();
    localStorage.setItem(getLicenseStoreKey(uid), JSON.stringify({
      code: d.code, uid: uid, expireAt: d.expireAt, plan: d.plan || '年度会员',
      cloud: true, activatedAt: new Date().toISOString().slice(0,10),
      lastVerifiedAt: new Date().toISOString(), recovered: true
    }));
    if(uid) localStorage.setItem('xhs_uid', uid);
    try{ localStorage.removeItem('xhs_revoked'); }catch(e){}
    return {ok:true, uid};
  }catch(e){ return {ok:false}; }
}

function classifyLicFail(r){
  if(!r) return 'unknown';
  if(r.code) return String(r.code);
  const s = String(r.reason||'');
  if(s.indexOf('停用')>=0 || s.indexOf('吊销')>=0 || s.indexOf('revok')>=0) return 'revoked';
  if(s.indexOf('过期')>=0 || s.indexOf('expire')>=0) return 'expired';
  if(s.indexOf('不存在')>=0 || s.indexOf('未登记')>=0 || s.indexOf('notfound')>=0) return 'notfound';
  if(s.indexOf('不匹配')>=0 || s.indexOf('mismatch')>=0) return 'mismatch';
  if(s.indexOf('不可用')>=0 || s.indexOf('错误')>=0 || s.indexOf('error')>=0) return 'server_error';
  return 'unknown';
}
/* 本地授权是否在离线宽限期内（没网也能正常用） */
function inLicenseGrace(lic){
  try{
    if(!lic) return false;
    if(!lic.lastVerifiedAt) return true;           // 从未校验过 → 不因网络问题锁定
    const last = new Date(lic.lastVerifiedAt).getTime();
    if(!last || isNaN(last)) return true;
    return (Date.now() - last) < LIC_GRACE_MS;
  }catch(e){ return true; }
}

function getLicenseStoreKey(uid){
  return 'xhs_license_' + (uid || 'default');
}
function getLicenseState(){
  const uid = getUid();
  const key = getLicenseStoreKey(uid);
  let lic = null;
  try{ lic = JSON.parse(localStorage.getItem(key)||'null'); }catch(e){}
  // 无激活记录
  if(!lic){
    // 老客户兼容：已有历史数据（无 uid 默认库）视为已授权
    if(!uid){
      const raw = localStorage.getItem('xhs_wb_data_v5');
      const isSeed = localStorage.getItem('xhs_wb_seed_created')==='1';
      if(raw && !isSeed){
        try{
          const pkg = JSON.parse(raw);
          const hasReal = pkg && pkg.data && (pkg.data.contents.length>0 || pkg.data.analytics.notes.length>0 || pkg.data.favorites.length>0);
          if(hasReal) return {status:'activated', uid:uid||'', mode:'legacy', expireAt:null, plan:''};
        }catch(e){}
      }
    }
    return {status:'pending', uid, mode:'new'};
  }
  // 已激活：检查到期
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(lic.expireAt+'T00:00:00');
  if(exp < today){
    return {status:'expired', uid, mode:'activated', expireAt:lic.expireAt, plan:lic.plan};
  }
  return {status:'activated', uid, mode:'activated', expireAt:lic.expireAt, plan:lic.plan, remain: Math.max(0, Math.round((exp-today)/864e5))};
}

/* ---------- 激活（本地 + 云端权威校验） ---------- */
async function tryActivate(code){
  const info = await licDecodeAny(code);
  if(!info) return {ok:false, msg:'激活码无效，请检查后重新输入'};
  const uid = getUid();
  if(uid && info.uid !== uid){
    return {ok:false, msg:'激活码与当前链接不匹配，请使用卖家提供的专属链接'};
  }
  const cfg = getCloudConfig();
  let cloudData = null;
  if(cfg && cfg.api){
    const r = await cloudVerify(code, uid || info.uid);
    const kind = r && r.ok ? 'ok' : classifyLicFail(r);
    // V6.33：服务端故障/网络不通 → 降级本地激活，绝不让已付费客户卡在激活门
    if(!r.ok && kind !== 'server_error' && kind !== 'unknown' && !r.offline && !r.noCloud){
      // 云端明确拒绝（不存在/吊销/过期/不匹配）
      return {ok:false, msg: r.reason || '激活码校验失败'};
    }
    if(r.ok && r.data){ cloudData = r.data; }
  }
  const expireAt = (cloudData && cloudData.expireAt) ? cloudData.expireAt : info.expireAt;
  const plan = (cloudData && cloudData.plan) ? cloudData.plan : (info.plan||'年度会员');
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(expireAt+'T00:00:00');
  if(exp < today) return {ok:false, msg:'该激活码已过期，请联系卖家续费'};
  localStorage.setItem(getLicenseStoreKey(uid||info.uid), JSON.stringify({
    code, uid:info.uid, expireAt, plan,
    cloud: !!(cfg && cfg.api && cloudData),
    activatedAt: new Date().toISOString().slice(0,10),
    lastVerifiedAt: cloudData ? new Date().toISOString() : ''   // V6.33 宽限期起点
  }));
  localStorage.removeItem('xhs_revoked'); // 激活成功清除「被停用」标记
  // 若激活码带 uid 但链接无 uid，记忆该 uid（数据归位）
  if(!uid && info.uid){ localStorage.setItem('xhs_uid', info.uid); }
  // 记忆云端地址：激活成功后，后续用任意链接打开都走云端复查（吊销/延期即时同步）
  const cloudCfg = getCloudConfig();
  if(cloudCfg && cloudCfg.api) localStorage.setItem('xhs_cloud_api', JSON.stringify({api: cloudCfg.api}));
  // V6.28 激活后自动从云端恢复历史数据（换设备/清缓存后不再从零开始）
  try{ if(typeof scheduleRestoreAfterActivate==='function') setTimeout(scheduleRestoreAfterActivate, 500); }catch(e){}
  return {ok:true, info:{...info, expireAt, plan}};
}

/* ---------- 云端复查（打开时异步校验：吊销即时生效） ---------- */
async function cloudRevalidate(){
  const st = getLicenseState();
  if(st.status !== 'activated') return;
  const cfg = getCloudConfig();
  if(!cfg || !cfg.api) return;
  const uid = getUid();
  const licKey = getLicenseStoreKey(uid);
  const lic = JSON.parse(localStorage.getItem(licKey)||'null');
  if(!lic || !lic.code) return;

  const r = await cloudVerify(lic.code, uid);

  // 1) 云端有效：刷新到期日 + 记录最后成功校验时间 + 清空失败计数
  if(r && r.ok && r.data){
    if(r.data.expireAt !== lic.expireAt){ lic.expireAt = r.data.expireAt; }
    if(r.data.plan) lic.plan = r.data.plan;
    lic.lastVerifiedAt = new Date().toISOString();
    try{ localStorage.setItem(licKey, JSON.stringify(lic)); }catch(e){}
    clearLicFail(uid);
    try{ localStorage.removeItem('xhs_revoked'); }catch(e){}
    return;
  }

  // 2) 网络不通 / 未配置云端 → 完全不处理，客户继续用（宽限期保护）
  if(r && (r.offline || r.noCloud)) return;

  // 3) 服务端错误 / 未知原因 → 绝不停用，仅累计计数后静默返回
  const kind = classifyLicFail(r);
  const f = getLicFail(uid);
  if(kind === 'server_error' || kind === 'unknown' || kind === 'bad_param'){
    f.other = (f.other||0) + 1; f.last = kind;
    setLicFail(uid, f);
    return;
  }

  // 4) notfound / mismatch / expired：可能是发布瞬间授权库短暂为空，绝不立即停用
  //    只要本地还没到期且在宽限期内 → 保持可用，仅提示一次
  if(kind === 'notfound' || kind === 'mismatch' || kind === 'expired'){
    f.other = (f.other||0) + 1; f.last = kind;
    setLicFail(uid, f);
    if(inLicenseGrace(lic)) return;                       // 宽限期内：静默放行
    if((f.other||0) < LIC_REVOKE_CONFIRM) return;         // 需要连续多次确认
  }

  // 5) revoked（卖家主动停用）：需连续 LIC_REVOKE_CONFIRM 次确认，且不在宽限期内才停
  if(kind === 'revoked'){
    f.revoked = (f.revoked||0) + 1; f.last = kind;
    setLicFail(uid, f);
    if((f.revoked||0) < LIC_REVOKE_CONFIRM && inLicenseGrace(lic)) return;
  }

  // 走到这里才真的停用（极少数：卖家明确停用且已多次确认，或宽限期已过且长期校验失败）
  localStorage.setItem('xhs_revoked','1');
  localStorage.setItem('xhs_revoked_reason', (r && r.reason) || '授权状态已变化');
  localStorage.removeItem(licKey);
  Toast((r && r.reason) || '授权状态已变化，请联系卖家');
  setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 2200);
}

/* V2 紧凑工具已在上方定义（兼容老 uid 仍可生成 V1 码） */

/* ================= V5.9 AI 大模型代理调用（尊享版） =================
 * 客户端只提交 激活码 + 提示词，服务端鉴权后调 DeepSeek，API Key 永不落地客户端。
 */
const DEMO_AI_LIMIT = 5; // 体验版每浏览器免费 AI 次数：够客户「哇」，又烧不穿卖家额度
function demoAiLeft(){
  try{ return Math.max(0, DEMO_AI_LIMIT - (parseInt(localStorage.getItem('xhs_demo_ai_used')||'0',10)||0)); }catch(e){ return DEMO_AI_LIMIT; }
}
function demoAiUse(){
  try{ localStorage.setItem('xhs_demo_ai_used', String((parseInt(localStorage.getItem('xhs_demo_ai_used')||'0',10)||0)+1)); }catch(e){}
}
async function aiAsk(prompt, system, model, onChunk){
  try{
    const isDemo = !!window.__DEMO_MODE__;
    if(isDemo){
      // V6.48 体验版开放 AI（配额制）：第一次就让客户真正「玩到」AI 能力，而非空提示
      if(demoAiLeft() <= 0){
        return {ok:false, msg:'🎉 你已用完体验版的 '+DEMO_AI_LIMIT+' 次 AI 生成额度。激活会员后即可无限使用，刚才生成的演示内容都会保留 👑'};
      }
    }else{
      const st = getLicenseState();
      if(st.status !== 'activated') return {ok:false, msg:'请先激活会员 👑'};
      const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(getUid()))||'null');
      if(!lic || !lic.code) return {ok:false, msg:'未找到授权信息，请重新激活'};
      var licCode = lic.code;
    }
    const cfg = getCloudConfig();
    // demo 未激活时可能没有云端配置：回退到当前服务源（同源部署必可达）
    /* V6.44 修复：原先缺配置时回退 location.origin，在 GitHub Pages 上会打到静态站
       （静态站没有后端，实测 AI 请求失败）。改为回退内置后端 DEFAULT_API。 */
    const apiBase = (cfg && cfg.api) ? cfg.api.replace(/\/$/,'')
                    : String(DEFAULT_API || '').replace(/\/api$/, '').replace(/\/$/, '');
    if(!apiBase) return {ok:false, msg:'AI 服务未就绪，请联系卖家开启'};
    const userKey = isDemo ? '' : getLocalAiKey();
    // 客户端超时 35s，防止服务端 hang 死导致"AI 创作中..."卡死
    const ctrl = new AbortController();
    const tid = setTimeout(()=>ctrl.abort(), 35000);
    let r;
    try{
      r = await fetch(apiBase + '/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({code: isDemo ? 'DEMO' : (typeof licCode!=='undefined'?licCode:''), uid:getUid(), prompt:String(prompt||''), system:system||'', model:model||'', key:userKey, stream:!!onChunk}),
        signal: ctrl.signal
      });
    }catch(e){
      clearTimeout(tid);
      const msg = e && e.name==='AbortError' ? 'AI 生成超时（>35s），请稍后再试' : 'AI 服务不可达，请检查网络后重试';
      return {ok:false, msg};
    }
    clearTimeout(tid);
    // 流式（SSE）
    if(onChunk && r.body && r.headers.get('content-type')&&r.headers.get('content-type').indexOf('event-stream')>=0){
      const reader = r.body.getReader(); const dec = new TextDecoder();
      let full = ''; let buf = '';
      while(true){
        const {value, done} = await reader.read(); if(done) break;
        buf += dec.decode(value, {stream:true});
        let i; while((i=buf.indexOf('\n\n')) >= 0){
          const ev = buf.slice(0, i); buf = buf.slice(i+2);
          const line = ev.split('\n').find(l=>l.startsWith('data:'));
          if(line && line.length > 5){
            const payload = line.slice(5).trim();
            if(payload === '[DONE]'){ if(isDemo){ demoAiUse(); } return {ok:true, text:full}; }
            try{
              const o = JSON.parse(payload);
              if(o.text){ full += o.text; try{ onChunk(full); }catch(e){} }
            }catch(e){}
          }
        }
      }
      return {ok:true, text:full};
    }
    const j = await r.json();
    if(!j.ok && j.reason && j.reason.indexOf('额度') >= 0) return {ok:false, msg:j.reason, needKey:true};
    if(j && j.ok && isDemo){ demoAiUse(); }
    return j.ok ? {ok:true, text:j.text} : {ok:false, msg:(j&&j.reason)||'AI 服务异常'};
  }catch(e){ return {ok:false, msg:'AI 服务异常，请稍后重试'}; }
}

/* ---------- V6.16 AI 生图代理调用（SiliconFlow，客户自填 Key，服务端转发） ---------- */
async function aiImageAsk(prompt, size, model){
  try{
    const st = getLicenseState();
    if(st.status !== 'activated') return {ok:false, msg:'请先激活会员 👑'};
    const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(getUid()))||'null');
    if(!lic || !lic.code) return {ok:false, msg:'未找到授权信息，请重新激活'};
    const cfg = getCloudConfig();
    if(!cfg || !cfg.api) return {ok:false, msg:'AI 服务未就绪，请联系卖家开启'};
    const userKey = getLocalImgKey();
    if(!userKey) return {ok:false, msg:'请先在「AI 生图」填入你的生图 API Key（SiliconFlow）'};
    const r = await fetch(cfg.api.replace(/\/$/,'') + '/ai-image', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({code:lic.code, uid:getUid(), prompt:String(prompt||''), size:size||'1:1', model:model||'', key:userKey})
    });
    const j = await r.json();
    if(!j.ok) return {ok:false, msg:j.reason||'生图服务异常'};
    return {ok:true, b64:j.b64, url:j.url, format:j.format||'png'};
  }catch(e){ return {ok:false, msg:'生图服务不可达，请稍后再试'}; }
}
/* 生图 Key 本地存取（base64 混淆，与 DeepSeek Key 分开存储） */
function getLocalImgKey(){
  try{ const v = localStorage.getItem('xhs_img_key'); if(!v) return ''; return decodeURIComponent(escape(atob(v))); }catch(e){ return ''; }
}
function setLocalImgKey(k){ if(!k){ localStorage.removeItem('xhs_img_key'); return; } localStorage.setItem('xhs_img_key', btoa(unescape(encodeURIComponent(String(k).trim())))); }

/* ---------- V6.21 一键测试生图 Key（服务端查询账户可用模型） ---------- */
async function aiImageTest(){
  try{
    const st = getLicenseState();
    if(st.status !== 'activated') return {ok:false, msg:'请先激活会员 👑'};
    const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(getUid()))||'null');
    if(!lic || !lic.code) return {ok:false, msg:'未找到授权信息，请重新激活'};
    const cfg = getCloudConfig();
    if(!cfg || !cfg.api) return {ok:false, msg:'AI 服务未就绪，请联系卖家开启'};
    const userKey = getLocalImgKey();
    if(!userKey) return {ok:false, msg:'请先填入你的 SiliconFlow API Key'};
    const r = await fetch(cfg.api.replace(/\/$/,'') + '/ai-image-test', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({code:lic.code, uid:getUid(), key:userKey})
    });
    const j = await r.json();
    if(!j.ok) return {ok:false, msg:j.reason||'测试失败'};
    return {ok:true, models:j.models||[]};
  }catch(e){ return {ok:false, msg:'服务不可达，请稍后再试'}; }
}

/* ---------- V6.18 图生文（上传图片 → 视觉模型 → 小红书文案，SiliconFlow Qwen2.5-VL） ---------- */
async function aiVisionAsk(imageDataURL, prompt, model){
  try{
    const st = getLicenseState();
    if(st.status !== 'activated') return {ok:false, msg:'请先激活会员 👑'};
    const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(getUid()))||'null');
    if(!lic || !lic.code) return {ok:false, msg:'未找到授权信息，请重新激活'};
    const cfg = getCloudConfig();
    if(!cfg || !cfg.api) return {ok:false, msg:'AI 服务未就绪，请联系卖家开启'};
    const userKey = getLocalImgKey();
    if(!userKey) return {ok:false, msg:'请先填入你的 SiliconFlow API Key（生图/图生文共用）'};
    const r = await fetch(cfg.api.replace(/\/$/,'') + '/ai-vision', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({code:lic.code, uid:getUid(), image:String(imageDataURL||''), prompt:String(prompt||''), model:model||'', key:userKey})
    });
    const j = await r.json();
    if(!j.ok) return {ok:false, msg:j.reason||'图生文服务异常'};
    return {ok:true, text:j.text};
  }catch(e){ return {ok:false, msg:'图生文服务不可达，请稍后再试'}; }
}

/* ---------- V6.0 AI Key 本地存取（客户自填） ---------- */
function getLocalAiKey(){
  try{ const v = localStorage.getItem('xhs_ai_key'); if(!v) return ''; return decodeURIComponent(escape(atob(v))); }catch(e){ return ''; }
}
function setLocalAiKey(k){ if(!k){ localStorage.removeItem('xhs_ai_key'); return; } localStorage.setItem('xhs_ai_key', btoa(unescape(encodeURIComponent(String(k).trim())))); }
function hasLocalAiKey(){ return !!getLocalAiKey(); }

/* ---------- 联系方式（卖家后台配置，全局共享） ---------- */
function getContactInfo(){
  try{ const c = JSON.parse(localStorage.getItem('xhs_seller_contact')||'null'); if(c) return c; }catch(e){}
  const wx = localStorage.getItem('xhs_contact_wx');
  const em = localStorage.getItem('xhs_contact_em');
  if(wx||em) return {wechat:wx||'', email:em||''};
  return null;
}
function setContactInfo(cfg){ localStorage.setItem('xhs_seller_contact', JSON.stringify({wechat:cfg.wechat||'', email:cfg.email||''})); }

/* ================= V5.7 使用统计（本地 + 云端心跳） =================
 * 目的：让卖家后台能如实掌握每位客户「使用了多久」，同时保护客户隐私——
 * 只记录「首次使用 / 最近使用 / 活跃天数」三个数字，不涉及任何内容数据。
 */
function getUsageStoreKey(uid){
  return 'xhs_usage_' + (uid || 'default');
}
function todayStrShort(){
  const d = new Date();
  const p = n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
function touchUsage(lic){
  try{
    const key = getUsageStoreKey(getUid());
    let u = null;
    try{ u = JSON.parse(localStorage.getItem(key)||'null'); }catch(e){}
    if(!u) u = {firstSeen:'', lastSeen:'', activeDays:0};
    const today = todayStrShort();
    if(!u.firstSeen) u.firstSeen = (lic && lic.activatedAt) || today;
    if(u.lastSeen !== today) u.activeDays = (u.activeDays||0) + 1;
    u.lastSeen = today;
    if(lic && lic.activatedAt) u.activatedAt = lic.activatedAt;
    localStorage.setItem(key, JSON.stringify(u));
    return u;
  }catch(e){ return null; }
}
function getUsageState(){
  try{ return JSON.parse(localStorage.getItem(getUsageStoreKey(getUid()))||'null'); }catch(e){ return null; }
}
function getElapsedDays(firstSeen){
  if(!firstSeen) return 0;
  const t = new Date(firstSeen+'T00:00:00'); if(isNaN(t)) return 0;
  return Math.max(1, Math.round((new Date() - t)/864e5) + 1);
}
/* 云端心跳：每日首次打开上报一次（fire-and-forget，失败静默） */
async function cloudHeartbeat(){
  try{
    const cfg = getCloudConfig();
    const st = getLicenseState();
    if(!cfg || !cfg.api || st.status!=='activated') return;
    const lic = JSON.parse(localStorage.getItem(getLicenseStoreKey(getUid()))||'null');
    if(!lic || !lic.code) return;
    await cloudCall('/heartbeat', {code:lic.code, uid:getUid()}, false);
  }catch(e){}
}

/* ================= V5.7 隐私与数据条款（极小字入口，保护双方） =================
 * 位置：登录页 / 设置中心 / 移动端抽屉 / 卖家后台 底部的小字链接
 * 目的：① 明确告知客户数据只在本机、卖家无法偷看；
 *       ② 免责声明保护卖家，避免客户无理追责。
 */
const LEGAL_TEXT = [
  ['一、数据归属与隐私（请放心）', [
    '1. 你的所有工作数据（选题、内容、素材、数据记录等）仅保存在当前设备浏览器的本地存储中，不经过任何服务器，我们无法查看、读取或收集你的任何内容。',
    '2. 工作台不会上传、分享或出售你的任何个人数据；无需注册账号，也无需提供手机号等个人信息。',
    '3. 若卖家启用了「云端防护」，云端仅记录激活码有效性（是否有效、是否停用）与使用统计（首次使用、最近使用、活跃天数），不涉及你的任何内容数据。'
  ]],
  ['二、使用须知', [
    '1. 建议定期在「设置中心 → 数据备份」导出数据。产品升级、更新绝不会影响你的任何数据；但自行清理浏览器数据、卸载应用、换设备未备份等导致的丢失，我们无法代为恢复，亦与产品本身无关。',
    '2. 请勿公开分享你的专属链接，以免他人读取或覆盖同设备数据。'
  ]],
  ['三、免责声明', [
    '1. 本产品按"现状"提供服务，我们会持续优化，但不承诺服务永不出错、永不中断。',
    '2. 小红书等第三方平台规则可能随时调整，由此导致的账号限制、内容影响等，本产品不承担相关责任。',
    '3. 本产品为运营效率工具，不构成任何运营效果或变现收益的承诺，请结合自身情况理性使用。',
    '4. 使用本产品即视为你已阅读并同意以上条款；如有异议请停止使用并联系卖家处理。'
  ]]
];
function openLegal(){
  const old = document.getElementById('legalMask');
  if(old) old.remove();
  const rows = LEGAL_TEXT.map(function(s){
    return '<div style="margin-bottom:14px"><div style="font-size:12.5px;font-weight:700;margin-bottom:6px;color:var(--text)">'+s[0]+'</div>'+
      s[1].map(function(t){ return '<div style="font-size:11.5px;color:var(--text2);line-height:1.8;margin-bottom:4px">· '+t+'</div>'; }).join('')+
      '</div>';
  }).join('');
  const mask = document.createElement('div');
  mask.id = 'legalMask';
  mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;animation:legalIn .2s';
  mask.innerHTML =
    '<div style="background:var(--card);color:var(--text);border-radius:16px;width:min(560px,94vw);max-height:82vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--line)"><div style="font-size:15px;font-weight:700">隐私与数据条款</div><button onclick="document.getElementById(\'legalMask\').remove()" style="border:none;background:none;font-size:18px;color:var(--text3);cursor:pointer;line-height:1">✕</button></div>'+
      '<div style="padding:18px;overflow-y:auto">'+rows+
        '<div style="font-size:10px;color:var(--text4);text-align:center;padding-top:8px;border-top:1px solid var(--line)">Crazy Friday. · 小红书AI运营工作台 · 条款最后更新 2026-08-26</div>'+
      '</div>'+
    '</div>';
  mask.addEventListener('click', function(e){ if(e.target===mask) mask.remove(); });
  document.body.appendChild(mask);
  const style = document.createElement('style');
  style.textContent = '@keyframes legalIn{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(style);
}
/* 极简小字入口（统一 10.5px、弱化色，放在最底部不显眼位置） */
function legalLink(){
  return '<a href="javascript:void(0)" onclick="openLegal()" style="color:var(--text4);font-size:10.5px;text-decoration:underline;text-underline-offset:2px;opacity:.75">隐私与数据条款</a>';
}
