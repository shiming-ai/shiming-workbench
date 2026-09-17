/* ============================================================
 * Crazy Friday. 专业工具箱（V6.5+ · 全链路增强）
 * ------------------------------------------------------------
 * 独立模块设计：所有功能挂在全局函数，可单独删减、独立迭代。
 * 依赖：Store / aiAsk / Modal / Toast / esc / copyText / uid /
 *       todayStr / fmtNum / premiumGuard（app.js + license.js 提供）
 * 统一走客户自填 DeepSeek Key（proAiAsk 自动套用账号人设）。
 * ============================================================ */
var scLocalText = '', scAiText = '', ahAiText = '';

/* ================= 人设感知 AI 调用 ================= */
function getPersonas(){
  const d = Store && Store.data;
  if(!d) return [];
  if(!d.personas) d.personas = [];
  return d.personas;
}
function getActivePersona(){
  try{
    const id = localStorage.getItem('xhs_persona_id') || '';
    if(!id) return null;
    return getPersonas().find(p=>p.id===id) || null;
  }catch(e){ return null; }
}
function personaName(){
  const p = getActivePersona();
  return p ? p.name : '';
}
function proAiAsk(prompt, system, onChunk){
  // 在系统提示词里注入账号人设，让 AI 输出贴合账号语气
  const p = getActivePersona();
  let sys = system || '你是专业的小红书运营专家，输出简洁、专业、可直接使用的中文内容。';
  if(p){
    sys += '\n\n【本账号固定人设（必须严格遵守）】\n人设名称：' + p.name +
      '\n语气风格：' + (p.tone || '日常自然') +
      '\nemoji 使用习惯：' + (p.emoji || '适量使用') +
      '\n段落节奏：' + (p.rhythm || '短段落，口语化') +
      '\n人设补充：' + (p.desc || '无') +
      '\n要求：输出的每一句都保持这个人设的口吻，避免 AI 感过重（禁止「总之/综上所述/希望这些建议对你有帮助」等书面套话）。';
  }
  return aiAsk(prompt, sys, '', onChunk);
}

/* ================= V6.47 AI 流式输出助手 =================
 * 把"等 AI"变成"看 AI 打字"，体感速度从 30 秒 → 3 秒就有内容。
 * 用法：
 *   const sb = aiStreamBox(outEl, '拆解爆款');
 *   const r = await proAiAsk(prompt, sys, sb.update, sb.update, sb.update, sb.update, sb.update, sb.update, sb.update, sb.update, sb.update, sb.update, sb.update);
 *   sb.done();
 *   if(!r.ok){ sb.fail(r.msg); return; }
 */
function aiStreamBox(outEl, label){
  if(!outEl) return { update:function(){}, done:function(){}, fail:function(){} };
  outEl.innerHTML =
    '<div class="stream-box">' +
      '<div class="stream-head"><span class="stream-pulse"></span><b>AI ' + esc(label||'正在生成') + '</b><span class="stream-timer">0.0s</span><span class="stream-quote">打字中…</span></div>' +
      '<div class="stream-text"></div>' +
    '</div>';
  const txt = outEl.querySelector('.stream-text');
  const timer = outEl.querySelector('.stream-timer');
  const quote = outEl.querySelector('.stream-quote');
  const t0 = Date.now();
  const iv = setInterval(function(){
    if(timer) timer.textContent = ((Date.now()-t0)/1000).toFixed(1)+'s';
    if(quote){
      const tips = ['正在组织结构…','正在写第一条…','正在补全细节…','正在润色语气…','马上就好…'];
      quote.textContent = tips[Math.floor((Date.now()-t0)/1200) % tips.length];
    }
  }, 120);
  function cleanup(){ clearInterval(iv); }
  return {
    update: function(full){ try{ if(txt) txt.textContent = full; }catch(e){} },
    done: function(){ cleanup(); if(quote) quote.textContent = '已完成'; },
    fail: function(msg){ cleanup(); outEl.innerHTML = '<div class="stream-fail">⚠️ ' + esc(msg||'生成失败') + '</div>'; }
  };
}
function personaSelectHtml(name, includeDefault){
  const cur = name || localStorage.getItem('xhs_persona_id') || '';
  const ps = getPersonas();
  let html = '';
  if(includeDefault !== false) html += '<option value="">标准（无固定人设）</option>';
  ps.forEach(p=>{ html += '<option value="'+p.id+'"'+(p.id===cur?' selected':'')+'>'+esc(p.name)+'</option>'; });
  return html;
}

/* ================= 1. 爆款深度拆解（v2 专业版：6维评分雷达 + 结构化拆解 + 拆解库闭环） ================= */
var DR_RADAR = ['选题角度','标题钩子','开头抓人','内容结构','情绪设计','互动引导'];
var deepRemixResult = null;

function drLib(){ if(!Store.data.remixLib) Store.data.remixLib = []; return Store.data.remixLib; }
function drLast(){ return window.__drLast || null; }

/* ---------- 入口 ---------- */
function openDeepRemix(){
  if(!premiumGuard('爆款深度拆解')) return;
  const n = drLib().length;
  Modal.open('🧬 爆款深度拆解', `
    <div style="font-size:12.5px;color:var(--text2);line-height:1.8;margin-bottom:12px">
      把一篇爆款拆成 <b>6 维评分 + 结构骨架 + 可复用公式</b>，再一键 <b>同题原创 / 差异化选题</b>。
      <span style="display:inline-flex;align-items:center;gap:4px;margin-left:6px;color:var(--brand);font-weight:700;cursor:pointer" onclick="openRemixLib()">📚 拆解库（${n}）</span>
    </div>
    <textarea id="drInput" placeholder="粘贴爆款全文（标题+正文），或直接描述你看到的爆款…" style="min-height:96px"></textarea>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn btn-red btn-sm" style="flex:1;min-width:150px" onclick="runDeepRemix('remix')">🧬 AI 深度拆解 + 同题原创</button>
      <button class="btn btn-ghost btn-sm" onclick="runDeepRemix('decompose')">🔍 只看拆解</button>
      <button class="btn btn-ghost btn-sm" onclick="drRunLocal()">⚡ 本地快速拆解</button>
    </div>
    <div id="drOut" style="margin-top:12px"></div>`);
}

/* ---------- AI 拆解（单次结构化调用，mode: remix / decompose） ---------- */
async function runDeepRemix(mode){
  const el = $('#drInput');
  if(!el) return;
  const src = el.value.trim();
  if(!src){ Toast('请粘贴爆款内容'); return; }
  const out = $('#drOut');
  if(!out) return;
  const decompose = mode==='decompose';
  const sys = '你是小红书爆款内容研究专家，擅长拆解底层逻辑并做高原创度改写。只输出严格的 JSON，不输出任何解释文字。';
  const prompt = '请对下面这篇小红书爆款笔记做深度拆解' + (decompose ? '' : '，并生成同选题原创版') + '。\n\n' +
    '输出 JSON，schema 严格如下（radar 的 6 个字段名必须一字不差）：\n' +
    '{\n' +
    '  "title": "原文标题（若未提供则从内容推断一个）",\n' +
    '  "overall": "一句话爆款成因判断（15-30 字）",\n' +
    '  "radar": {"选题角度":0-10,"标题钩子":0-10,"开头抓人":0-10,"内容结构":0-10,"情绪设计":0-10,"互动引导":0-10},\n' +
    '  "structureSteps": ["内容结构骨架，按顺序列 4-6 步，每步 6-15 字"],\n' +
    '  "hookAnalysis": "标题钩子分析：用了什么钩子、为什么抓人（30-60 字）",\n' +
    '  "openingText": "开头前 3 秒怎么抓人（20-40 字）",\n' +
    '  "emotionCurve": "情绪节奏：哪里制造渴望/共鸣/行动冲动（30-60 字）",\n' +
    '  "interactionTips": ["评论区高互动设计 1", "2", "3"],\n' +
    '  "personaVoice": "账号人设与语气特征（20-40 字）",\n' +
    '  "formula": "一条可直接套用的公式，形如：痛点开场→干货清单→避坑提醒→互动收尾",\n' +
    '  "angleIdeas": ["3 条同选题差异化角度，每条自带一句话标题（可直接发）"],\n' +
    '  "riskNotes": ["原创风险/违规风险提示，没有就给空数组"],\n' +
    '  "remix": ' + (decompose ? 'null' : '{\n' +
    '    "titles": ["2 个与原标题完全不同表达的同题标题"],\n' +
    '    "body": "450-600 字同选题原创正文：换角度/换案例/换结构，口语自然，含适量 emoji，禁止书面套话",\n' +
    '    "tags": ["5-8 个话题标签，第一个用下划线圈主词"]\n' +
    '  }') + '\n' +
    '}\n\n注意：radar 分值要有区分度，不要全打 7-8；structureSteps/angleIdeas 必须具体可执行。\n\n爆款原文：\n' + src.slice(0, 4000);
  const sb = aiStreamBox(out, decompose ? '十维拆解' : '拆解并同题原创');
  const ai = await proAiAsk(prompt, sys, sb.update);
  sb.done();
  if(!ai.ok || !ai.text){
    // AI 不可用 → 自动降级到本地引擎（拆解仍可用；原创需要 AI）
    const rec = drLocalAnalyze(src);
    rec.mode = mode;
    rec.aiSource = 'local_fallback';
    if(mode === 'remix') rec.remix = null;
    drRender(rec);
    if(out && ai && ai.msg){ try{ out.insertAdjacentHTML('afterbegin', '<div style="color:var(--brand);font-size:11.5px;margin-bottom:8px">AI 暂不可用，已用本地引擎拆解：' + esc(ai.msg) + '</div>'); }catch(e){} }
    return;
  }
  let rec = null;
  try{
    let txt = ai.text;
    const m = txt.match(/\{[\s\S]*\}/);
    if(m) txt = m[0];
    rec = JSON.parse(txt);
    rec.remix = rec.remix || null;
  }catch(e){
    rec = null;
  }
  if(!rec || !rec.radar){
    // JSON 解析失败 → 本地兜底
    rec = drLocalAnalyze(src);
    rec.mode = mode;
    rec.aiSource = 'local_fallback';
    if(mode === 'remix') rec.remix = null;
  }else{
    rec.aiSource = 'deepseek';
    rec.mode = mode;
    rec.createdAt = new Date().toISOString();
  }
  drRender(rec);
}

/* ---------- 本地快速拆解（无需 AI，纯规则引擎） ---------- */
function drRunLocal(){
  const el = $('#drInput');
  if(!el) return;
  const src = el.value.trim();
  if(!src){ Toast('请粘贴爆款内容'); return; }
  const rec = drLocalAnalyze(src);
  rec.mode = 'decompose';
  rec.aiSource = 'local';
  drRender(rec);
}

function drLocalAnalyze(src){
  const s = String(src||'').replace(/\r/g,'').trim();
  const lines = s.split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
  let title = '';
  for(let i=0;i<lines.length;i++){
    const l = lines[i];
    if(l.length > 5 && l.length <= 48 && l.indexOf('#') !== 0){ title = l; break; }
  }
  if(!title) title = (lines[0]||src).slice(0, 30);
  // 去掉标题行后的正文
  let body = s;
  if(title){ const ti = body.indexOf(title); if(ti >= 0){ body = body.slice(ti + title.length); } }
  const paras = body.split(/\n\s*\n/).map(function(x){ return x.trim(); }).filter(function(x){ return x.length > 0; });
  if(paras.length <= 1) paras.length = 0;
  const text = body;
  const hasHash = /#[\u4e00-\u9fa5a-zA-Z0-9_]+/.test(text);
  const tagMatches = text.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g) || [];
  const tags = tagMatches.slice(0, 10).map(function(t){ return t.replace('#',''); });
  const qCount = (text.match(/[？?]/g) || []).length;
  const emojiCount = (text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu) || []).length;
  const numCount = (text.match(/\d+/g) || []).length;
  // 钩子类型检测
  const hooks = [];
  if(/[0-9０-９]|[一二三四五六七八九十百]/.test(title)) hooks.push('数字锚点');
  if(/[？?]/.test(title) || /吗|呢|怎么|如何|为什么|值得/.test(title)) hooks.push('悬念提问');
  if(/亲测|实测|用了|坚持|总结了|整理了|测评/.test(title)) hooks.push('个人实证');
  if(/避雷|踩坑|千万别|不要|误区|陷阱|雷点/.test(title)) hooks.push('避坑警示');
  if(/平价|省钱|低成本|学生党|打工人|新手|小白|入门/.test(title)) hooks.push('人群共鸣');
  if(/公式|清单|教程|攻略|指南|合集|万能|模板/.test(title)) hooks.push('干货清单');
  if(/涨粉|变现|爆|热门|流量|爆款/.test(title)) hooks.push('利益承诺');
  if(hooks.length === 0) hooks.push('平铺直叙（建议加强钩子）');
  // 结构检测
  const structSigns = [];
  if(/^\s*[①②③④⑤⑥⑦⑧]|^\s*[0-9０-９]{1,2}[.、．）)]/m.test(text)) structSigns.push('编号清单');
  if((text.match(/^\s*[-·•◦▪]/m) || []).length > 1) structSigns.push('要点列表');
  if(/步骤|Step|第[一二三四五六]步/.test(text)) structSigns.push('分步流程');
  if(/场景|痛点|问题/.test(text)) structSigns.push('痛点开篇');
  if(/亲测|我自己|我总结|坚持了|避雷/.test(text)) structSigns.push('个人经验');
  if(/评论区|告诉我|留言|扣1|投票/.test(text)) structSigns.push('互动收尾');
  const structureSteps = structSigns.length ? structSigns : ['平铺叙事（建议改成分段+小标题）'];
  // 互动设计
  const ctaWords = [];
  ['收藏','点赞','关注','评论区','留言','分享','保存','整理','码住','一键三连'].forEach(function(w){
    if(text.indexOf(w) >= 0) ctaWords.push(w);
  });
  const interactionTips = [];
  if(qCount > 0) interactionTips.push('文中出现 ' + qCount + ' 个提问式互动');
  if(ctaWords.length > 0) interactionTips.push('含「' + ctaWords.slice(0,4).join('/') + '」等引导动作');
  else interactionTips.push('缺少明确互动引导，建议结尾给一个轻提问');
  // 情绪设计
  const emotionCurve = emojiCount > 6 ? '全文 emoji 密度高（' + emojiCount + ' 个），情绪外放、有画面感' : (emojiCount > 2 ? '适度使用 emoji（' + emojiCount + ' 个），节奏轻快' : '几乎无 emoji，偏干货理性风（可适量加情绪词提升共鸣）');
  // 人设声音
  const personaVoice = /我|本人|自用|亲测/.test(text) ? '强个人叙事（第一人称贯穿），真实感驱动信任' : '偏客观陈述，缺少个人视角（可加入「我/自用/亲测」增强信任）';
  // 风险
  const riskNotes = [];
  ['最','第一','百分百','100%','国家级','绝对','根治','立刻见效','全网'].forEach(function(w){
    if(new RegExp(w).test(text)) riskNotes.push('含极限词「' + w + '」，有被限流/判广告风险');
  });
  if(/微信|加我|私我|扣1|公众号/.test(text)) riskNotes.push('含导流痕迹，注意合规');
  // 评分（0-10）
  function clamp(v){ return Math.max(0, Math.min(10, Math.round(v))); }
  const hookScore = clamp(4 + (numCount>0?1.5:0) + (/[？?]/.test(title)?1:0) + (hooks.length>1?1.5:0) - (hooks[0]==='平铺直叙（建议加强钩子）'?3:0));
  const topicScore = clamp(5 + (tags.length>=3?2:0) + (title.length>=12&&title.length<=30?1:0));
  const openScore = clamp(5 + (/[？?]|真的|竟然|亲测|踩坑|误区/.test((paras[0]||text).slice(0,60))?2:0) - (text.length<40?3:0));
  const structScore = clamp(4 + structSigns.length*1.2);
  const emotionScore = clamp(4 + (emojiCount>2?1.5:0) + (/([！!]{1,})/.test(text)?1:0));
  const interScore = clamp(3 + (qCount>0?1.5:0) + ctaWords.length*1);
  const radar = {
    '选题角度': topicScore, '标题钩子': hookScore, '开头抓人': openScore,
    '内容结构': structScore, '情绪设计': emotionScore, '互动引导': interScore
  };
  const formula = structureSteps.join(' → ');
  const overall = '爆款力 ' + Math.round((topicScore+hookScore+openScore+structScore+emotionScore+interScore)/6*10) + ' /100 · ' + (hooks[0] === '平铺直叙（建议加强钩子）' ? '选题有潜力但标题/结构需强化' : '结构清晰，标题与互动设计到位');
  const hookAnalysis = '标题主用「' + hooks.slice(0,3).join('」+「') + '」' + (numCount>0 ? '，数字提供确定性' : '') + (qCount>0 ? '，提问制造好奇' : '');
  const openingText = (paras[0] || text).slice(0, 40) + (text.length > 40 ? '…' : '');
  return {
    title: title, overall: overall,
    radar: radar, structureSteps: structureSteps,
    hookAnalysis: hookAnalysis, openingText: '开头直接进入主题（前 60 字是否抓人需结合数据验证）：' + openingText,
    emotionCurve: emotionCurve,
    interactionTips: interactionTips.slice(0,3),
    personaVoice: personaVoice,
    formula: formula,
    angleIdeas: ['同选题换一个更具体的细分人群切入（如场景/预算/身型）', '把「清单式」改成「过程式叙事」（记录真实经历+转折）', '从评论区高频问题反推一个新角度'],
    riskNotes: riskNotes.slice(0,3),
    remix: null, mode: 'decompose', aiSource: 'local',
    src: src.slice(0, 3000), createdAt: new Date().toISOString()
  };
}

/* ---------- 渲染拆解报告 ---------- */
function drRender(rec){
  const out = $('#drOut');
  if(!out) return;
  window.__drLast = rec;
  deepRemixResult = rec;
  const r = rec.radar || {};
  const dimVals = DR_RADAR.map(function(d){ return {d:d, v: Math.max(0, Math.min(10, Number(r[d])||0))}; });
  const avg = dimVals.reduce(function(a,x){ return a + x.v; }, 0) / dimVals.length;
  const score = Math.round(avg * 10);
  const sourceTag = rec.aiSource === 'deepseek' ? '<span style="font-size:10px;font-weight:700;color:var(--brand);background:rgba(var(--redRGB),.12);padding:2px 7px;border-radius:99px">🤖 AI 深度拆解</span>'
    : (rec.aiSource === 'local' ? '<span style="font-size:10px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.12);padding:2px 7px;border-radius:99px">⚡ 本地规则引擎</span>'
    : '<span style="font-size:10px;font-weight:700;color:#fbbf24;background:rgba(251,191,36,.14);padding:2px 7px;border-radius:99px">🛟 本地降级</span>');
  const bars = dimVals.map(function(x){
    const color = x.v >= 7 ? '#4ade80' : (x.v >= 4.5 ? '#fbbf24' : '#ff6b6b');
    return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px"><span style="color:var(--text2)">' + x.d + '</span><b style="color:' + color + '">' + x.v + '</b></div>' +
      '<div style="height:6px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden"><div style="width:' + (x.v*10) + '%;height:100%;background:' + color + ';border-radius:99px;transition:width .5s"></div></div></div>';
  }).join('');
  const chips = function(list){ return (list||[]).map(function(x){ return '<span style="display:inline-block;font-size:11.5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);padding:4px 10px;border-radius:99px;margin:3px;color:var(--text2)">' + esc(x) + '</span>'; }).join('') || '<span style="font-size:12px;color:var(--text3)">—</span>'; };
  const stepsHtml = (rec.structureSteps||[]).map(function(x,i){
    return '<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:7px"><span style="flex-shrink:0;width:20px;height:20px;border-radius:7px;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center">' + (i+1) + '</span><span style="font-size:12.5px;color:var(--text2);line-height:1.7">' + esc(x) + '</span></div>';
  }).join('');
  const angles = (rec.angleIdeas||[]).map(function(a,i){
    return '<div style="background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:8px 10px;margin-bottom:5px;display:flex;align-items:flex-start;gap:8px"><span style="flex-shrink:0;font-size:12px">🎯</span><span style="font-size:12.5px;color:var(--text2);line-height:1.65;flex:1">' + esc(a) + '</span></div>';
  }).join('');
  const riskHtml = (rec.riskNotes||[]).length ? rec.riskNotes.map(function(x){ return '<div style="font-size:12px;color:#ffb4ae;margin-bottom:4px">⚠️ ' + esc(x) + '</div>'; }).join('') : '';
  const libCount = drLib().length;

  let html = '';
  html += '<div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:12px">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:15.5px;font-weight:900;letter-spacing:-.2px;line-height:1.5">' + esc(rec.title||'未命名爆款') + '</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">' + sourceTag +
          '<span style="font-size:11px;color:var(--text3)">爆款指数 <b style="font-size:14px;color:' + (score>=80?'#4ade80':(score>=60?'#fbbf24':'#ff6b6b')) + '">' + score + '</b></span>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm" onclick="openRemixLib()">📚 拆解库（' + libCount + '）</button>' +
    '</div>' +
    '<div style="font-size:12.5px;color:var(--text3);background:var(--bg);border-radius:9px;padding:8px 10px;margin-bottom:12px;line-height:1.7">💡 ' + esc(rec.overall||'') + '</div>' +
    '<div style="display:grid;grid-template-columns:180px 1fr;gap:16px;align-items:start">' +
      '<div>' + drRadarSVG(rec.radar||{}, 180) + '</div>' +
      '<div>' + bars + '</div>' +
    '</div>' +
  '</div>';

  html += '<div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:10px">' +
    '<div style="font-size:13.5px;font-weight:800;margin-bottom:10px">🧱 结构骨架（可直接套用）</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:10px">可复用公式：<b style="color:var(--brand)">' + esc(rec.formula||'-') + '</b></div>' + stepsHtml +
  '</div>';

  html += '<div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:10px">' +
    '<div style="font-size:13.5px;font-weight:800;margin-bottom:8px">🪝 标题钩子</div>' +
    '<div style="font-size:12.5px;color:var(--text2);line-height:1.8">' + esc(rec.hookAnalysis||'-') + '</div>' +
    '<div style="font-size:13.5px;font-weight:800;margin:14px 0 8px">🎬 开头抓人</div>' +
    '<div style="font-size:12.5px;color:var(--text2);line-height:1.8">' + esc(rec.openingText||'-') + '</div>' +
    '<div style="font-size:13.5px;font-weight:800;margin:14px 0 8px">📈 情绪节奏</div>' +
    '<div style="font-size:12.5px;color:var(--text2);line-height:1.8">' + esc(rec.emotionCurve||'-') + '</div>' +
    '<div style="font-size:13.5px;font-weight:800;margin:14px 0 8px">🗣️ 互动引导</div>' + chips(rec.interactionTips) +
    '<div style="font-size:13.5px;font-weight:800;margin:14px 0 8px">🎭 人设声音</div>' +
    '<div style="font-size:12.5px;color:var(--text2);line-height:1.8">' + esc(rec.personaVoice||'-') + '</div>' +
    (riskHtml ? '<div style="margin-top:12px;background:rgba(255,59,48,.08);border:1px solid rgba(255,59,48,.2);border-radius:9px;padding:9px 11px">' + riskHtml + '</div>' : '') +
  '</div>';

  html += '<div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:10px">' +
    '<div style="font-size:13.5px;font-weight:800;margin-bottom:10px">🔀 同选题差异化角度</div>' + angles +
    '<button class="btn btn-red btn-sm" style="margin-top:10px" onclick="drSaveAngles()">✨ 把差异化角度存入选题池</button>' +
  '</div>';

  if(rec.remix && rec.remix.body){
    const tls = (rec.remix.titles||[]);
    html += '<div style="background:var(--card);border:1px solid rgba(var(--redRGB),.3);border-radius:14px;padding:16px;margin-top:10px;position:relative;overflow:hidden">' +
      '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--brand),var(--brand2))"></div>' +
      '<div style="font-size:13.5px;font-weight:800;margin-bottom:8px">✍️ 同题原创版（可直接发布）</div>' +
      (tls.length ? '<div style="font-size:12.5px;color:var(--brand);font-weight:700;margin-bottom:6px">标题备选：' + tls.map(function(t){ return esc(t); }).join('　｜　') + '</div>' : '') +
      '<div style="font-size:12.5px;color:var(--text2);line-height:1.85;white-space:pre-wrap;max-height:260px;overflow-y:auto;background:var(--bg);border-radius:9px;padding:10px 12px">' + esc(rec.remix.body) + '</div>' +
      '<div style="margin-top:8px;font-size:11.5px;color:var(--text3)">' + chips(rec.remix.tags||[]) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
        '<button class="btn btn-red btn-sm" style="flex:1;min-width:140px" onclick="saveDeepRemix()">📥 存入内容库（草稿）</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="drCopyRemix(this)">📋 复制发布包</button>' +
      '</div>' +
    '</div>';
  }

  html += '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
    '<button class="btn btn-ghost btn-sm" onclick="drSaveToLib()">📚 存入拆解库</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="drReuse()">🧬 用这套公式再拆一篇</button>' +
  '</div>';
  out.innerHTML = html;
}

function drRadarSVG(radar, size){
  const W = size || 200, cx = W/2, cy = W/2, R = (W/2) - 30;
  const dims = DR_RADAR;
  const n = dims.length;
  const max = 10;
  let grid = '';
  for(let i=1;i<=4;i++){
    const r = R * i/4;
    const pts = [];
    for(let j=0;j<n;j++){
      const a = -Math.PI/2 + 2*Math.PI*j/n;
      pts.push((cx + r*Math.cos(a)).toFixed(1) + ',' + (cy + r*Math.sin(a)).toFixed(1));
    }
    grid += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1"/>';
  }
  let axis = '';
  for(let j=0;j<n;j++){
    const a = -Math.PI/2 + 2*Math.PI*j/n;
    axis += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + R*Math.cos(a)).toFixed(1) + '" y2="' + (cy + R*Math.sin(a)).toFixed(1) + '" stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
  }
  const dataPts = [];
  const labels = [];
  for(let j=0;j<n;j++){
    const v = Math.max(0, Math.min(max, (radar && radar[dims[j]] != null) ? Number(radar[dims[j]]) : 5));
    const r = R * v / max;
    const a = -Math.PI/2 + 2*Math.PI*j/n;
    dataPts.push((cx + r*Math.cos(a)).toFixed(1) + ',' + (cy + r*Math.sin(a)).toFixed(1));
    const la = R + 14;
    const lx = cx + la*Math.cos(a), ly = cy + la*Math.sin(a);
    labels.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" fill="rgba(255,255,255,.55)" font-size="9" text-anchor="middle" dominant-baseline="middle">' + dims[j] + '</text>');
  }
  const poly = '<polygon points="' + dataPts.join(' ') + '" fill="rgba(var(--redRGB),.3)" stroke="var(--red)" stroke-width="2"/>';
  return '<svg viewBox="0 0 ' + W + ' ' + W + '" width="' + W + '" height="' + W + '" style="display:block;margin:0 auto">' + grid + axis + poly + labels.join('') + '</svg>';
}

/* ---------- 落地动作 ---------- */
function drSaveToLib(){
  const rec = window.__drLast;
  if(!rec){ Toast('请先拆解'); return; }
  const lib = drLib();
  const exist = lib.find(function(x){ return x.src && rec.src && x.src === rec.src; });
  const entry = {
    id: uid(),
    title: rec.title || '未命名拆解',
    overall: rec.overall || '',
    radar: rec.radar || {},
    formula: rec.formula || '',
    structureSteps: rec.structureSteps || [],
    hookAnalysis: rec.hookAnalysis || '',
    angleIdeas: rec.angleIdeas || [],
    interactionTips: rec.interactionTips || [],
    riskNotes: rec.riskNotes || [],
    aiSource: rec.aiSource || 'local',
    src: rec.src || '',
    createdAt: rec.createdAt || new Date().toISOString(),
    date: todayStr()
  };
  if(exist){ Object.assign(exist, entry); }
  else{ lib.unshift(entry); if(lib.length > 60) lib.length = 60; }
  Store.save();
  Toast('已存入拆解库 ✅（共 ' + lib.length + ' 条）');
}
function drSaveAngles(){
  const rec = window.__drLast;
  if(!rec){ Toast('请先拆解'); return; }
  const arr = (rec.angleIdeas||[]).filter(Boolean);
  if(!arr.length){ Toast('暂无可入库的角度'); return; }
  if(!Store.data.topicPool) Store.data.topicPool = [];
  let added = 0;
  arr.forEach(function(a){
    const t = String(a).replace(/^【[^】]*】/,'').replace(/^标题[：:]/,'').trim().slice(0, 40);
    if(!t) return;
    const dup = Store.data.topicPool.some(function(x){ return x.title === t; });
    if(dup) return;
    Store.data.topicPool.unshift({id: uid(), title: t, cat: (Store.data.userProfile && Store.data.userProfile.accountType) || '', note: '爆款拆解入库', heat: 88, date: todayStr(), from:'remix'});
    added++;
  });
  if(added){ Store.save(); Toast('已存入 ' + added + ' 条到选题池 ✅'); }
  else{ Toast('角度已都在选题池里了'); }
}
function saveDeepRemix(){
  const rec = window.__drLast;
  if(!rec || !rec.remix){ Toast('没有可保存的原创内容'); return; }
  const rm = rec.remix;
  const title = (rm.titles && rm.titles[0]) ? rm.titles[0].trim().slice(0, 30) : ((rec.title||'').slice(0,20) + '（同题原创）');
  Store.data.contents = Store.data.contents || [];
  Store.data.contents.unshift({id: uid(), title: title, status:'draft', date: todayStr(), cat: (Store.data.userProfile && Store.data.userProfile.accountType) || '通用', body: (rm.body||'') + '\n\n' + ((rm.tags||[]).map(function(t){ return '#' + t; }).join(' ')), views:0, likes:0, collects:0, comments:0, tags: rm.tags || [], from:'remix'});
  Store.save();
  Toast('已存入内容库（草稿）✅');
}
function drCopyRemix(btn){
  const rec = window.__drLast;
  if(!rec || !rec.remix) return;
  const rm = rec.remix;
  const pack = (rm.titles ? rm.titles[0] + '\n\n' : '') + (rm.body||'') + '\n\n' + (rm.tags||[]).map(function(t){ return '#' + t; }).join(' ');
  // 复用全局 copyText（自带 execCommand 降级），发布包 = 标题+正文+话题标签
  if(typeof copyText === 'function') copyText(btn, pack);
  else{ try{ navigator.clipboard.writeText(pack); }catch(e){} Toast('发布包已复制'); }
}
function drReuse(){
  const rec = window.__drLast;
  if(!rec) return;
  Modal.close();
  setTimeout(function(){ openDeepRemix(); setTimeout(function(){ const el = $('#drInput'); if(el && rec.src) el.value = rec.src; }, 120); }, 120);
}

/* ---------- 拆解库 ---------- */
function openRemixLib(){
  const lib = drLib();
  if(!lib.length){ Modal.open('📚 爆款拆解库', '<div style="text-align:center;padding:30px 10px"><div style="font-size:30px;margin-bottom:10px">🗂️</div><div style="font-size:13px;color:var(--text3);line-height:1.8">还没有拆解记录。<br>先去「🧬 爆款深度拆解」拆一篇，好模板会自动存到这里。</div><button class="btn btn-red" style="margin-top:16px" onclick="Modal.close();openDeepRemix()">去拆第一篇</button></div>'); return; }
  Modal.open('📚 爆款拆解库（' + lib.length + '）', `
    <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:12px">所有拆解都沉淀在这里：点开看公式，或一键「同题再拆」。库里模板越多，你的选题越不愁。</div>
    <div style="max-height:60vh;overflow-y:auto" id="rmxLibList">
      ${lib.map(function(x){
        const src = x.radar || {};
        const avg = DR_RADAR.reduce(function(a,d){ return a + (Number(src[d])||0); },0) / DR_RADAR.length;
        const score = Math.round(avg*10);
        return '<div style="background:var(--bg);border:1px solid var(--line);border-radius:11px;padding:11px 12px;margin-bottom:8px">' +
          '<div style="display:flex;gap:8px;align-items:flex-start">' +
            '<span style="flex-shrink:0;font-size:12px;font-weight:800;color:' + (score>=80?'#4ade80':(score>=60?'#fbbf24':'#ff6b6b')) + '">' + score + '</span>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:13px;font-weight:800;line-height:1.5">' + esc(x.title) + '</div>' +
              '<div style="font-size:11px;color:var(--text3);margin-top:3px">公式：' + esc(x.formula||'-') + '</div>' +
              '<div style="font-size:10.5px;color:var(--text3);margin-top:4px">' + (x.aiSource==='deepseek'?'🤖 AI 拆解':'⚡ 本地') + ' · ' + esc(x.date||'') + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end">' +
              '<button class="btn btn-red btn-sm" onclick="drLibPlan(\'' + x.id + '\')">📅 自动排期</button>' +
              '<button class="btn btn-ghost btn-sm" onclick="drLibRemix(\'' + x.id + '\')">🧬 同题再拆</button>' +
              '<button class="btn btn-ghost btn-sm" onclick="drLibDel(\'' + x.id + '\')">🗑️</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('')}
    </div>`);
}
function drLibRemix(id){
  const rec = drLib().find(function(x){ return x.id === id; });
  if(!rec){ Toast('记录不存在'); return; }
  if(!rec.src){ Toast('该条未保存原文，无法再拆'); return; }
  Modal.close();
  setTimeout(function(){
    openDeepRemix();
    setTimeout(function(){
      const el = $('#drInput');
      if(el) el.value = rec.src;
      if(typeof runDeepRemix === 'function') runDeepRemix('remix');
    }, 180);
  }, 150);
}
function drLibDel(id){
  const lib = drLib();
  const i = lib.findIndex(function(x){ return x.id === id; });
  if(i >= 0){ lib.splice(i, 1); Store.save(); }
  openRemixLib();
}

/* V6.46 自动化：拆解模板 → 自动排期（一条公式直接变成下周发布计划） */
function drLibPlan(id){
  const rec = drLib().find(function(x){ return x.id === id; });
  if(!rec){ Toast('记录不存在'); return; }
  // 选题标题优先用第一条差异化角度，其次原文标题
  const raw = (rec.angleIdeas && rec.angleIdeas[0]) || rec.title || '爆款同题新内容';
  const title = String(raw).replace(/^【[^】]*】/,'').replace(/^标题[：:]/,'').trim().slice(0, 30) || (rec.title||'').slice(0,30);
  const sched = Store.data.schedule;
  const used = {};
  sched.forEach(function(s){ if(s.date) used[s.date] = true; });
  let date = todayStr(), guard = 0;
  while(used[date] && guard < 21){ date = fmtDate(addDays(++guard)); }
  const p = Store.data.userProfile || {};
  sched.push({id: uid(), date: date, time: '20:00', title: title, status:'ready', cat: p.accountType || '通用', from:'remix-auto', formula: rec.formula || ''});
  Store.save();
  Modal.close();
  navigate('schedule');
  setTimeout(function(){ Toast('✅ 已按模板自动排入 ' + date.slice(5) + ' 20:00（选题来自拆解库）'); }, 600);
}

/* ================= 2. 发布前检查（查重降重） ================= */
function openPrePublishCheck(){
  Modal.open('🛡️ 发布前检查 · 查重降重', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">发布前的<b>安全体检</b>：检测重复/搬运风险 → 标记高相似语句 → 降重改写建议 → 保留原意但降低判定风险 → 输出发布前安全评分。</p>
    <textarea id="ppInput" placeholder="粘贴你要发布的文案/标题…" style="min-height:100px"></textarea>
    <button class="btn btn-red btn-block" style="margin-top:10px" onclick="runPrePublishCheck()">🛡️ 开始体检</button>
    <div id="ppOut" style="margin-top:12px"></div>`);
}
let ppResult = '';
async function runPrePublishCheck(){
  const src = $('#ppInput').value.trim();
  if(!src){ Toast('请粘贴要检查的文案'); return; }
  if(!premiumGuard('发布前检查')) return;
  const out = $('#ppOut');
  const sb = aiStreamBox(out, '检查重复风险');
  const prompt = '请对下面这篇小红书笔记文案做「发布前安全体检」（查重降重）。\n\n输出格式（严格按此结构）：\n【1. 发布前安全评分】X/100 分 + 等级（安全/低风险/中风险/高风险），一句话说明主要风险点\n【2. 高相似语句标记】逐条列出疑似与常见爆款撞车的句子（引用原文），并说明为什么像（通用句式/常见套路/疑似搬运）\n【3. 降重改写建议】针对每条高相似语句给出改写方案（换角度/换案例/换结构/加入个人真实细节）\n【4. 改写后示例】给出整篇降重改写后的版本（保留原意、原创度提升、口语自然、避免 AI 感）\n\n文案原文：\n' + src.slice(0, 4000);
  const r = await proAiAsk(prompt, '你是小红书内容风控与原创检测专家，熟悉平台查重与搬运判定逻辑，改写要保留原意且自然。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  ppResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:420px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制报告</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="savePpResult()">📥 存入灵感笔记</button>
    </div>`;
}
function savePpResult(){
  if(!ppResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'发布前检查 · '+todayStr(), content:ppResult, tag:'风控', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* ================= 3. 封面标题组合优化 ================= */
function openCoverCombo(){
  Modal.open('🎨 封面标题组合优化', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">一个主题，AI 一次给出<b>封面主标题 / 封面副标题 / 正文标题 / 标题钩子建议</b>，并覆盖<b>数字型、疑问型、利益型、情绪型</b>四种标题方向，封面点击率直接拉满。</p>
    <div class="form-group"><label class="label">笔记主题 / 卖点</label><input id="ccInput" placeholder="如：早八通勤妆教程 / 空气炸锅减脂餐"></div>
    <div class="form-group"><label class="label">所属分类</label><select id="ccCat">${Seed.categories.map(c=>'<option>'+c+'</option>').join('')}</select></div>
    <button class="btn btn-red btn-block" onclick="runCoverCombo()">🎨 生成标题组合</button>
    <div id="ccOut" style="margin-top:12px"></div>`);
}
let ccResult = '';
async function runCoverCombo(){
  const kw = $('#ccInput').value.trim();
  if(!kw){ Toast('请输入主题'); return; }
  if(!premiumGuard('封面标题组合')) return;
  const cat = $('#ccCat').value;
  const out = $('#ccOut');
  const sb = aiStreamBox(out, '生成标题组合');
  const prompt = '我是小红书「'+cat+'」赛道博主。请围绕主题「'+kw+'」输出一套完整的封面标题组合方案。\n\n输出格式（严格按此结构）：\n【1. 封面主标题】3 个备选（大字，8-12 字内，一眼抓人，适合封面大字排版）\n【2. 封面副标题】3 个备选（小字补充，给利益点或信任状，如「亲测 30 天」「含清单」）\n【3. 正文标题】3 个备选（完整标题，可带 emoji，适合小红书标题区）\n【4. 标题钩子建议】2 条本主题最有效的钩子方向（如数字反差/悬念/身份共鸣），说明为什么\n【5. 四种标题方向】\n- 数字型：…\n- 疑问型：…\n- 利益型：…\n- 情绪型：…\n\n要求：贴合 2026 年小红书爆款标题规律，具体、有画面感。';
  const r = await proAiAsk(prompt, '你是小红书封面标题专家，深谙点击率心理学与爆款标题公式。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  ccResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveCcResult()">📥 存入灵感笔记</button>
    </div>`;
}
function saveCcResult(){
  if(!ccResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'封面标题组合 · '+($('#ccInput')?$('#ccInput').value.slice(0,12):''), content:ccResult, tag:'创作', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* ================= 4. 标签智能匹配 ================= */
function openTagMatch(){
  Modal.open('#️⃣ 智能标签匹配', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">笔记写完后一键配标签：<b>核心流量标签 / 赛道垂直标签 / 长尾搜索标签 / 高互动低竞争标签</b> + 排序建议，让平台准确分发。</p>
    <div class="form-group"><label class="label">笔记标题</label><input id="tmTitle" placeholder="粘贴或输入笔记标题"></div>
    <div class="form-group"><label class="label">正文摘要（可选，越长越准）</label><textarea id="tmBody" placeholder="粘贴正文关键段落…" style="min-height:70px"></textarea></div>
    <button class="btn btn-red btn-block" onclick="runTagMatch()">#️⃣ 生成标签组合</button>
    <div id="tmOut" style="margin-top:12px"></div>`);
}
let tmResult = '';
async function runTagMatch(){
  const title = $('#tmTitle').value.trim();
  if(!title){ Toast('请填写标题'); return; }
  if(!premiumGuard('智能标签')) return;
  const body = $('#tmBody').value.trim().slice(0, 1200);
  const out = $('#tmOut');
  const sb = aiStreamBox(out, '分析标签组合');
  const prompt = '请为下面这篇小红书笔记推荐最佳标签组合（选题：「'+title+'」'+(body?'，正文摘要：'+body:'')+'）。\n\n输出格式（严格按此结构）：\n【1. 核心流量标签】3 个（大流量词，蹭热度用，第一个用「下划线」圈住主词）\n【2. 赛道垂直标签】3 个（精确描述赛道，帮助精准分发）\n【3. 长尾搜索标签】3 个（搜索型词，如「xx怎么选」「xx避坑」，吃搜索流量）\n【4. 高互动低竞争标签】2 个（竞争小但互动好的潜力词）\n【5. 最终推荐组合】按「核心→垂直→长尾→潜力」顺序排好的 8-10 个完整标签清单（含 # 号），并给 1 句发布建议（标签数量/顺序/与标题呼应）。';
  const r = await proAiAsk(prompt, '你是小红书标签与搜索流量优化专家，熟悉平台标签分发逻辑。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  tmResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:380px;overflow-y:auto">${esc(r.text)}</div>
    <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%" onclick="copyText(this,'${esc(r.text)}')">📋 复制标签组合</button>`;
}

/* ================= 5. 评论区运营（高意向识别） ================= */
function openCommentIntel(){
  if(!premiumGuard('评论区运营')) return;
  Modal.open('💬 评论区运营助手', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">不只是回评论——先<b>识别高意向评论</b>（询价/求链接/求攻略），再给<b>回复话术 + 私信承接话术</b>，把评论区变成转化入口。</p>
    <div class="form-group"><label class="label">笔记主题</label><input id="ciTopic" placeholder="如：百元内通勤穿搭合集"></div>
    <div class="form-group"><label class="label">评论区内容（粘贴粉丝评论，一行一条）</label><textarea id="ciComments" placeholder="例：\n这个链接可以发我吗\n求链接！好想要\n能不能出一期清单\n已关注，蹲后续" style="min-height:100px"></textarea></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-red btn-sm" style="flex:1" onclick="runCommentIntel()">💬 识别 + 生成话术</button>
      <button class="btn btn-ghost btn-sm" onclick="runCommentIntel('reply')">只生成回复</button>
    </div>
    <div id="ciOut" style="margin-top:12px"></div>`);
}
let ciResult = '';
async function runCommentIntel(mode){
  const topic = $('#ciTopic').value.trim();
  if(!topic){ Toast('请填写笔记主题'); return; }
  const comments = $('#ciComments').value.trim();
  if(!comments){ Toast('请粘贴评论区内容'); return; }
  const out = $('#ciOut');
  const sb = aiStreamBox(out, '识别高意向评论');
  const prompt = '我的小红书笔记主题：「'+topic+'」。以下是真实粉丝评论：\n' + comments.slice(0, 2500) + '\n\n' + (mode==='reply'
    ? '请为每条评论生成 1 条自然、高互动权的回复话术（口语化、不机械、能引发二次互动），按「原评论 → 回复」格式输出。'
    : '请输出「评论区运营方案」，严格按此结构：\n【1. 高意向评论识别】逐条标记评论类型：🔴询价 / 🔵求链接 / 🟢求攻略 / ⚪闲聊，并说明该评论的转化价值\n【2. 优先回复顺序】按转化价值排序，给出今天必须回的 3 条及理由\n【3. 回复话术】给高意向评论各配 1 条自然回复（引导进私信但不违规）\n【4. 私信承接话术】2 条进私信后的开场承接话术（礼貌、给价值、铺垫转化）\n【5. 互动权重优化】2 条拉高这条笔记互动权重的动作建议（置顶/引导收藏/回复节奏）');
  const r = await proAiAsk(prompt, '你是小红书评论区运营专家，深谙互动权重逻辑与平台合规边界，话术要自然不机械。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  ciResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto">${esc(r.text)}</div>
    <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%" onclick="copyText(this,'${esc(r.text)}')">📋 复制话术</button>`;
}

/* ================= 6. 私域转化合规话术 ================= */
function openConversionScript(){
  Modal.open('🤝 私域转化合规话术', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">把粉丝安全地转化成私域客户，同时<b>不踩平台导流红线</b>：低风险引导 / 评论区软引导 / 私信承接 / 违规表达避坑。</p>
    <div class="form-group"><label class="label">你的赛道</label><input id="csTrack" placeholder="如：美妆护肤 / 母婴 / 职场干货 / 本地探店…"></div>
    <div class="form-group"><label class="label">转化目标（可选）</label><input id="csGoal" placeholder="如：微信咨询 / 社群 / 带货橱窗 / 课程报名…"></div>
    <button class="btn btn-red btn-block" onclick="runConversionScript()">🤝 生成合规话术</button>
    <div id="csOut" style="margin-top:12px"></div>`);
}
let csResult = '';
async function runConversionScript(){
  const track = $('#csTrack').value.trim();
  if(!track){ Toast('请填写赛道'); return; }
  if(!premiumGuard('私域合规话术')) return;
  const goal = $('#csGoal').value.trim() || '微信私域咨询';
  const out = $('#csOut');
  const sb = aiStreamBox(out, '生成合规话术');
  const prompt = '我是小红书「'+track+'」赛道博主，转化目标是「'+goal+'」。请为我生成一套「低风险私域转化话术」。\n\n输出格式（严格按此结构）：\n【1. 低风险引导话术】3 条（评论区/简介/私信自动回复里最安全的引导说法，平台友好）\n【2. 评论区软引导】3 条（把「求链接/求攻略」的评论自然引导到私信，不出现违禁词）\n【3. 私信承接话术】3 条（粉丝私信后的开场承接，给价值→建立信任→铺垫转化）\n【4. 避免违规的表达建议】列出该赛道常见的 5 个违规触发词/表达（如：加微信/转账/线下交易等变体），并给合规替代说法\n【5. 赛道专属转化模板】一条完整可复制的转化路径话术（从评论互动到私信到成交的全过程样例）\n\n要求：贴合 2026 年小红书导流规则，话术自然、不像模板。';
  const r = await proAiAsk(prompt, '你是小红书私域转化与平台合规双料专家，熟悉各赛道导流红线，话术要自然有效且安全。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  csResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:420px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制话术</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveCsResult()">📥 存入灵感笔记</button>
    </div>`;
}
function saveCsResult(){
  if(!csResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'私域转化话术 · '+(($('#csTrack')||{}).value||'') || '转化话术', content:csResult, tag:'变现', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* ================= 7. 账号人设风格锁定 ================= */
function openPersonaManager(){
  const ps = getPersonas();
  const list = ps.length ? ps.map(p=>
    '<div class="lib-item" style="cursor:default">' +
      '<div style="flex:1">' +
        '<div style="font-weight:600;font-size:13px">🎭 '+esc(p.name)+'</div>' +
        '<div style="font-size:11px;color:var(--text3)">'+esc(p.tone||'')+' · '+esc(p.emoji||'')+' · '+esc(p.rhythm||'')+'</div>' +
        (p.desc?'<div style="font-size:11px;color:var(--text2);margin-top:2px">'+esc(p.desc.slice(0,40))+'</div>':'') +
      '</div>' +
      '<button class="btn btn-ghost btn-sm" onclick="setActivePersona(\''+p.id+'\')">'+(p.id===(localStorage.getItem('xhs_persona_id')||'')?'✓ 使用中':'使用')+'</button>' +
      '<button class="icon-btn" onclick="delPersona(\''+p.id+'\')">🗑️</button>' +
    '</div>').join('')
    : '<div class="empty" style="padding:14px">还没有人设，先创建一个，或让 AI 从你的历史笔记学习</div>';
  Modal.open('🎭 账号人设 · 风格锁定', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">把 AI 生成的内容<b>锁定成你的账号风格</b>：固定语气、emoji 习惯、段落节奏，避免 AI 感。选中的「人设」会自动套用到 <b>🚀 一键全流程</b> 和 <b>全部专业工具</b> 的 AI 输出上。</p>
    <div id="psList" style="margin-bottom:10px">${list}</div>
    <div class="form-group"><label class="label">人设名称</label><input id="psName" placeholder="如：温柔种草姐姐 / 干货直给学姐"></div>
    <div class="form-group"><label class="label">语气风格</label><select id="psTone"><option>日常自然</option><option>温柔亲切</option><option>专业干练</option><option>活泼俏皮</option><option>真诚走心</option><option>犀利直接</option></select></div>
    <div class="form-group"><label class="label">emoji 使用习惯</label><select id="psEmoji"><option>适量使用</option><option>少用，克制</option><option>多用，活泼</option><option>基本不用</option></select></div>
    <div class="form-group"><label class="label">段落节奏</label><select id="psRhythm"><option>短段落，口语化</option><option>中等段落，条理清晰</option><option>长段落，深度内容</option><option>清单式，干货直给</option></select></div>
    <div class="form-group"><label class="label">补充描述（可选）</label><input id="psDesc" placeholder="如：自称本宫，爱用「姐妹们」，经常放前后对比图"></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-red btn-sm" style="flex:1" onclick="savePersona()">＋ 保存人设</button>
      <button class="btn btn-ghost btn-sm" onclick="learnPersonaFromNotes()">🤖 AI 学习我的笔记</button>
    </div>
    <div id="psMsg" style="font-size:12px;min-height:20px;margin-top:10px"></div>`);
}
function savePersona(){
  const name = $('#psName').value.trim();
  if(!name){ $('#psMsg').innerHTML='<span style="color:var(--red)">请填写人设名称</span>'; return; }
  const ps = getPersonas();
  ps.push({id:uid(), name, tone:$('#psTone').value, emoji:$('#psEmoji').value, rhythm:$('#psRhythm').value, desc:$('#psDesc').value.trim(), date:todayStr()});
  Store.save();
  localStorage.setItem('xhs_persona_id', ps[ps.length-1].id);
  $('#psMsg').innerHTML='<span style="color:var(--green)">✓ 已保存并设为使用中</span>';
  setTimeout(()=>openPersonaManager(), 600);
}
function delPersona(id){
  const ps = getPersonas();
  Store.data.personas = ps.filter(p=>p.id!==id);
  if(localStorage.getItem('xhs_persona_id')===id) localStorage.removeItem('xhs_persona_id');
  Store.save();
  Toast('已删除人设');
  setTimeout(()=>openPersonaManager(), 400);
}
function setActivePersona(id){
  localStorage.setItem('xhs_persona_id', id);
  Toast('已切换人设 ✅');
  setTimeout(()=>openPersonaManager(), 400);
}
async function learnPersonaFromNotes(){
  const d = Store.data;
  const notes = (d.analytics.notes||[]).slice(0, 5).map(n=>n.title+(n.emoji?' '+n.emoji:'')).join('；');
  const contents = (d.contents||[]).slice(0, 3).map(c=>c.title).join('；');
  const src = (notes||contents);
  if(!src){ $('#psMsg').innerHTML='<span style="color:var(--red)">还没有历史笔记可供学习，先写几篇吧</span>'; return; }
  if(!premiumGuard('AI 学习人设')) return;
  $('#psMsg').innerHTML='<span class="ai-loading">🤖</span> <span style="color:var(--text2)">AI 正在学习你的笔记风格…（约 15-30 秒）</span>';
  const prompt = '以下是我发布过的小红书笔记标题：\n' + src.slice(0, 1500) + '\n\n请分析我的账号风格，输出严格按此结构：\n【语气风格】2 个候选（如：温柔亲切 / 干货直给）\n【emoji 使用】1 个结论（适量/少用/多用/基本不用）\n【段落节奏】1 个结论（短段落口语化/中等条理/长段落深度/清单式）\n【人设名称】1 个（3-6 字，概括我的人设，如「干货直给学姐」）\n【补充描述】50 字内，提炼我的固定口头禅/表达习惯/内容特点';
  const r = await proAiAsk(prompt, '你是账号风格分析师，输出简洁、可直接用于人设配置。', sb.update);
  const msg = $('#psMsg');
  if(!r.ok){ msg.innerHTML='<span style="color:var(--red)">'+r.msg+'</span>'; return; }
  const t = r.text;
  const g = (k)=>{ const m = t.match(new RegExp('【'+k+'】\\s*([^【\\n]+)')); return m ? m[1].trim() : ''; };
  const name = g('人设名称') || '我的账号风格';
  $('#psName').value = name;
  const tone = g('语气风格'); if(tone && tone.includes('温柔')) $('#psTone').value='温柔亲切'; else if(tone&&tone.includes('活泼')) $('#psTone').value='活泼俏皮'; else if(tone&&tone.includes('专业')) $('#psTone').value='专业干练'; else if(tone&&tone.includes('犀利')) $('#psTone').value='犀利直接'; else if(tone&&tone.includes('走心')) $('#psTone').value='真诚走心';
  const emo = g('emoji 使用'); if(emo.includes('基本')) $('#psEmoji').value='基本不用'; else if(emo.includes('多')) $('#psEmoji').value='多用，活泼'; else if(emo.includes('少')) $('#psEmoji').value='少用，克制'; else $('#psEmoji').value='适量使用';
  const rhy = g('段落节奏'); if(rhy.includes('清单')||rhy.includes('干货')) $('#psRhythm').value='清单式，干货直给'; else if(rhy.includes('短')) $('#psRhythm').value='短段落，口语化'; else if(rhy.includes('长')||rhy.includes('深度')) $('#psRhythm').value='长段落，深度内容'; else $('#psRhythm').value='中等段落，条理清晰';
  $('#psDesc').value = g('补充描述');
  msg.innerHTML='<span style="color:var(--green)">✓ 已识别你的风格，检查无误后点「保存人设」</span>';
}

/* ================= 8. 数据复盘 AI 深度诊断 ================= */
function openAiDiagnose(noteId){
  if(!premiumGuard('AI 深度诊断')) return;
  const d = Store.data;
  const notes = d.analytics.notes || [];
  const note = noteId ? notes.find(n=>n.id===noteId) : null;
  const opts = notes.length ? notes.map(n=>'<option value="'+n.id+'"'+(note&&n.id===note.id?' selected':'')+'>'+esc(n.title.slice(0,20))+'（赞'+n.likes+'）</option>').join('') : '';
  Modal.open('🩺 AI 深度诊断', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">不止看数据——AI 诊断<b>标题点击率 / 内容停留 / 互动转化</b>，给出<b>发布时间建议</b>与<b>后续优化方向</b>。</p>
    <div class="form-group"><label class="label">诊断对象</label><select id="dgTarget"><option value="all">📊 账号整体诊断</option>${opts}</select></div>
    <button class="btn btn-red btn-block" onclick="runAiDiagnose()">🩺 开始诊断</button>
    <div id="dgOut" style="margin-top:12px"></div>`);
}
let dgResult = '';
async function runAiDiagnose(){
  const target = $('#dgTarget').value;
  if(!premiumGuard('AI 深度诊断')) return;
  const d = Store.data;
  const ov = d.analytics.overview || {};
  let ctx;
  if(target === 'all'){
    const sorted = (d.analytics.notes||[]).slice().sort((a,b)=>b.score-a.score);
    ctx = '账号整体：粉丝 '+ov.fans+'，近7天阅读 '+ov.views7d+' / 点赞 '+ov.likes7d+' / 收藏 '+ov.collects7d+' / 评论 '+ov.comments7d+' / 互动率 '+ov.interaction+'%。\n各篇笔记：' + sorted.slice(0,6).map(n=>n.title+'（赞'+n.likes+' 藏'+n.collects+' 评'+n.comments+' 爆款分'+n.score+'）').join('；');
  } else {
    const n = (d.analytics.notes||[]).find(x=>x.id===target);
    if(!n){ Toast('未找到该笔记'); return; }
    ctx = '单篇笔记「'+n.title+'」：阅读 '+n.views+' / 点赞 '+n.likes+' / 收藏 '+n.collects+' / 评论 '+n.comments+' / 爆款分 '+n.score+'，分类：'+n.cat;
  }
  const out = $('#dgOut');
  const sb = aiStreamBox(out, '检测变现风险');
  const prompt = '以下是我的小红书数据：\n' + ctx + '\n\n请输出「AI 深度诊断报告」，严格按此结构：\n【1. 表现一句话总结】\n【2. 标题点击率问题】分析标题是否够抓人，给出 2 个改进方向\n【3. 内容停留问题】分析内容留存问题（开头/结构/长度），给出 2 个改进点\n【4. 互动转化问题】分析点赞/收藏/评论的转化短板，给出 2 个动作\n【5. 发布时间建议】结合内容类型给 2 个最优发布时间段及理由\n【6. 后续优化方向】3 条下周可执行的优化清单\n\n要求：基于数据说话、具体可执行、不空泛。';
  const r = await proAiAsk(prompt, '你是小红书数据诊断教练，善于从数据反推内容问题，报告要犀利具体。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  dgResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:420px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制诊断</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="saveDgResult()">📥 存入灵感笔记</button>
    </div>`;
}
function saveDgResult(){
  if(!dgResult){ Toast('暂无内容'); return; }
  Store.data.ideas.unshift({id:uid(), title:'AI 深度诊断 · '+todayStr(), content:dgResult, tag:'复盘', date:todayStr()});
  Store.save(); Toast('已存入灵感笔记 ✅');
}

/* ================= 9. 违禁词扫描（敏感词检测） =================
 * 本地引擎：直接扫描本地词库（绝对化/医疗/引流/承诺 4 大类）；可叠加 AI 深度复查。
 */
function openSensitiveCheck(){
  Modal.open('🔍 发布前违禁词扫描', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">发布前最后一道关卡：<b>本地词库</b>扫描 + 可选 <b>AI 深度复查</b>，标红每个高风险词 + 给合规替代说法，避免笔记被判限流。</p>
    <textarea id="scInput" placeholder="粘贴标题 + 正文…" style="min-height:100px"></textarea>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-red btn-sm" style="flex:1" onclick="runSensitiveCheck(true)">🔍 扫描 + AI 深度复查</button>
      <button class="btn btn-ghost btn-sm" onclick="runSensitiveCheck(false)">仅本地扫描</button>
    </div>
    <div id="scOut" style="margin-top:12px"></div>`);
}
function sensitiveScanText(text){
  const words = (Store.data && Store.data.sensitiveWords) || [];
  const hits = [];
  words.forEach(function(w){
    if(String(text).includes(w.w)) hits.push({w:w.w, tip:w.tip, level:w.level});
  });
  return { total: hits.length, hits: hits };
}
function localSensitiveScan(){
  return sensitiveScanText($('#scInput').value);
}
async function runSensitiveCheck(withAi){
  const src = $('#scInput').value.trim();
  if(!src){ Toast('请粘贴内容'); return; }
  const out = $('#scOut');
  // 先本地扫描
  const local = localSensitiveScan();
  const localHtml = '<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:12.5px;line-height:1.8;margin-bottom:10px">' +
    '<div style="font-weight:700;margin-bottom:6px">📋 本地词库扫描结果</div>' +
    '<div style="color:var(--text2);margin-bottom:8px">共 <b style="color:var(--red)">'+local.total+'</b> 个风险词' +
    (local.total?'（严重 '+local.hits.filter(h=>h.level===2).length+' · 提醒 '+local.hits.filter(h=>h.level===1).length+'）':'')+'</div>' +
    (local.hits.length?local.hits.map(function(h){return '<div style="padding:6px 0;border-bottom:1px solid var(--line)"><span style="color:'+(h.level===2?'var(--red)':'var(--orange)')+';font-weight:700">['+(h.level===2?'严重':'提醒')+'] "'+esc(h.w)+'"</span> — '+esc(h.tip)+'</div>';}).join(''):'<div style="color:var(--green)">✓ 未命中本地词库高风险词</div>') +
  '</div>';
  out.innerHTML = localHtml + '<div class="loading">'+(withAi?'AI 正在深度复查…（约 15-25 秒）':'')+'</div>';
  if(!withAi){
    out.querySelector('.loading')?.remove();
    scLocalText = local.hits.length ? local.hits.map(function(h){return h.w+': '+h.tip;}).join('\n') : '未命中本地词库风险词';
    out.innerHTML = localHtml + '<button class="btn btn-ghost btn-sm" style="margin-top:8px;width:100%" onclick="copyText(null, scLocalText)">📋 复制本地结果</button>';
    return;
  }
  const prompt = '请对下面这篇小红书笔记做【平台合规复查】（除已知敏感词外，找违规风险：包括但不限于：诱导互动、引流外链、虚假承诺、功效夸大、政治/宗教、绝对化用语、违规广告法词等）。\n\n输出格式（严格按此结构）：\n【1. 整体合规评分】100 分制 + 等级（安全/低风险/中风险/高风险），一句话总结\n【2. 额外发现的违规点】逐条列出（除本地词库外的更隐蔽问题），给原文引用 + 平台规则解释\n【3. 替换建议】给每条违规表达 1-2 个合规替代说法\n【4. 改写后版本】给出一篇整篇合规化处理后的版本（保留原意与风格）\n\n笔记原文：\n' + src.slice(0, 4000);
  const r = await proAiAsk(prompt, '你是小红书内容合规审核专家，熟知平台社区规则与广告法。', sb.update);
  if(!r.ok){ out.querySelector('.loading').remove(); out.innerHTML = localHtml + '<div style="color:var(--red);margin-top:8px">'+r.msg+'</div>'; return; }
  scAiText = r.text;
  out.innerHTML = localHtml + '<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:12.5px;line-height:1.8;white-space:pre-wrap;max-height:380px;overflow-y:auto">'+esc(scAiText)+'</div><button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%" onclick="copyText(null, scAiText)">📋 复制 AI 报告</button>';
}

/* ================= 10. 账号健康度体检 =================
 * 基于客户本地数据 + 平台规则常识，评估账号权重/限流风险/合规状态，给可执行建议。
 */
function openAccountHealth(){
  Modal.open('📊 账号健康度体检', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">给你的账号做一次<b>健康大体检</b>：算法权重 / 限流风险 / 内容合规 / 变现潜力 / 增长趋势，输出总分 + 5 维评分 + 可执行建议。</p>
    <div style="display:flex;gap:8px">
      <button class="btn btn-red btn-sm" style="flex:1" onclick="runAccountHealth(true)">📊 完整体检（+ AI 解读）</button>
      <button class="btn btn-ghost btn-sm" onclick="runAccountHealth(false)">仅本地指标</button>
    </div>
    <div id="ahOut" style="margin-top:12px"></div>`);
}
async function runAccountHealth(withAi){
  const out = $('#ahOut');
  const d = Store.data;
  const ov = d.analytics.overview || {};
  const local = {
    fans: ov.fans||0,
    inter: ov.interaction||0,
    views7d: ov.views7d||0,
    likes7d: ov.likes7d||0,
    collects7d: ov.collects7d||0,
    contents: d.contents.length,
    published: d.contents.filter(c=>c.status==='published').length,
    income: d.money.records.reduce((a,b)=>a+b.income,0),
    sensCount: (d.sensitiveWords||[]).length
  };
  // 本地规则 5 维评分（满分 100）
  const scores = {
    activity: Math.min(100, Math.round(local.published/10*100 + local.contents*3)),
    interactive: Math.min(100, Math.round(local.inter*8)),
    growth: Math.min(100, Math.round((ov.fansNew7d||0)/Math.max(1,local.fans)*1000)),
    content: Math.min(100, Math.round(local.published*5 + local.contents*2)),
    risk: Math.max(0, 100 - (local.published<3?15:0))
  };
  const total = Math.round((scores.activity+scores.interactive+scores.growth+scores.content+scores.risk)/5);
  const renderCell = (k,v) => '<div style="background:var(--bg);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:'+(v>=70?'var(--green)':v>=40?'var(--orange)':'var(--red)')+'">'+v+'</div><div style="font-size:11px;color:var(--text3);margin-top:2px">'+k+'</div></div>';
  const localHtml = '<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:10px">' +
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px"><div style="font-size:42px;font-weight:800;color:'+(total>=70?'var(--green)':total>=40?'var(--orange)':'var(--red)')+'">'+total+'</div><div><div style="font-size:14px;font-weight:700">综合健康分</div><div style="font-size:11.5px;color:var(--text3)">'+(total>=70?'状态良好，继续保持':total>=40?'中等状态，有提升空间':'需注意，建议参考下方建议')+'</div></div></div>' +
    '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">' +
      renderCell('活跃度', scores.activity) + renderCell('互动度', scores.interactive) + renderCell('增长性', scores.growth) + renderCell('内容库', scores.content) + renderCell('风险', scores.risk) +
    '</div>' +
    '<div style="font-size:11.5px;color:var(--text3);margin-top:10px">基于本地数据估算：粉丝 '+local.fans+' · 互动率 '+local.inter+'% · 发布 '+local.published+' 篇 · 累计 ¥'+local.income+'</div>' +
  '</div>';
  out.innerHTML = localHtml + '<div class="loading">'+(withAi?'AI 正在生成深度解读…（约 20-40 秒）':'')+'</div>';
  if(!withAi){
    out.querySelector('.loading')?.remove();
    out.innerHTML = localHtml + '<button class="btn btn-red btn-sm" style="margin-top:10px;width:100%" onclick="ahFixNow()">🛠️ 一键优化</button>';
    return;
  }
  const prompt = '我是小红书博主，请基于以下账号数据做深度健康体检（5 维 + 总体 + 可执行建议）：\n' +
    JSON.stringify(local) + '\n' +
    '账号 7 天数据：阅读 '+local.views7d+' / 点赞 '+local.likes7d+' / 收藏 '+local.collects7d+'\n\n输出格式（严格按此结构）：\n【1. 总体评分】一句话 + 一句话核心结论\n【2. 5 维分析】每维（活跃/互动/增长/内容/风险）一句话说明现状 + 主要短板\n【3. 限流风险排查】基于数据推断是否可能被限流（如更新频率、互动下滑、内容质量）\n【5. 本周可执行清单】5 条本周立即可做的提升动作（具体、可执行）\n\n要求：犀利具体、不空话、贴合 2026 年小红书环境。';
  const r = await proAiAsk(prompt, '你是小红书账号健康诊断教练，熟悉算法权重与限流机制。', sb.update);
  if(!r.ok){ out.querySelector('.loading').remove(); out.innerHTML = localHtml + '<div style="color:var(--red);margin-top:8px">'+r.msg+'</div>'; return; }
  ahAiText = r.text;
  out.innerHTML = localHtml + '<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto">'+esc(ahAiText)+'</div><div style="display:flex;gap:10px;margin-top:10px"><button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(null, ahAiText)">📋 复制报告</button><button class="btn btn-red btn-sm" style="flex:1" onclick="ahFixNow()">🛠️ 一键优化</button></div>';
}
/* 健康度「一键优化」：按薄弱维度跳转到对应整改工具 */
function ahFixNow(){
  Modal.close();
  const d = Store.data; const ov = d.analytics.overview||{};
  const local = {
    inter: ov.interaction||0,
    published: d.contents.filter(c=>c.status==='published').length,
    sensCount: (d.sensitiveWords||[]).length
  };
  if(local.published < 3){ Toast('内容量不足：去「AI 创作中心」生成 3 篇再回来复检 🚀'); setTimeout(()=>navigate('create'), 500); }
  else if(local.inter < 3){ Toast('互动偏低：去「爆款拆解」研究互动钩子，或让 AI 助理给方案 💬'); setTimeout(()=>navigate('viral'), 500); }
  else { Toast('数据维度良好：继续用「变现路径诊断」规划下一步 🧭'); setTimeout(()=>navigate('vmoney'), 500); }
}


/* ================= V6.9 首页「今日 AI 情报流」 =================
 * 像新闻一样把今日热点 + 变现日报聚合展示，打开首页即有"活"的信息感。
 */
function renderInfoFeed(){
  const rpt = getDailyReport ? getDailyReport() : null;
  const hot = getHotDaily ? getHotDaily() : null;
  const items = [];
  if(rpt && rpt.body){
    if(rpt.body.rules && rpt.body.rules[0]) items.push({i:'📰', t:'变现新规', c:rpt.body.rules[0], to:'vreport'});
    if(rpt.body.market && rpt.body.market[0]) items.push({i:'💰', t:'赛道行情', c:rpt.body.market[0].cat+' · 商单 '+rpt.body.market[0].ad+' · 佣金 '+rpt.body.market[0].comm, to:'vreport'});
    if(rpt.body.actions && rpt.body.actions[0]) items.push({i:'✅', t:rpt.body.actions[0].tier, c:rpt.body.actions[0].act, to:'vreport'});
  }
  if(hot && hot.list && hot.list[0]) items.push({i:'🔥', t:'今日热点', c:hot.list[0].title+'（热度 '+hot.list[0].hot+'）', to:'trending'});
  if(!items.length) return '';
  const time = rpt ? (typeof reportUpdateTime==='function' ? reportUpdateTime(rpt) : '') : '';
  return '<div class="info-feed">' +
    '<div class="if-head"><span class="if-title">🔥 今日 AI 情报流</span><span class="if-time">'+(time?('今日 '+time+' 更新'):'每日自动更新')+' · 每 30 分钟刷新 · 减少信息差</span></div>' +
    '<div class="if-list">' + items.slice(0,4).map(function(x, i){
      return '<div class="if-item" onclick="navigate(\''+x.to+'\')"><span class="if-ico">'+x.i+'</span><div class="if-body"><span class="if-tag">'+x.t+'</span><span class="if-c">'+x.c.slice(0,46)+'</span></div></div>';
    }).join('') + '</div>' +
    '<div class="if-more" onclick="navigate(\'vreport\')">📰 查看今日完整变现日报 →</div>' +
  '</div>';
}

/* ================= 发布工具箱入口（渲染到创作中心） ================= */
function proToolsBar(){
  const tools = [
    {i:'🧬', n:'爆款深度拆解', d:'6 维评分雷达 · 公式卡 · 同题原创', act:'openDeepRemix()', g:'创作'},
    {i:'📚', n:'爆款拆解库', d:'模板沉淀 · 随时回看复用', act:'openRemixLib()', g:'创作'},
    {i:'🎨', n:'封面标题组合', d:'主副标题 + 钩子 + 四方向', act:'openCoverCombo()', g:'创作'},
    {i:'#️⃣', n:'智能标签', d:'核心/垂直/长尾/低竞争', act:'openTagMatch()', g:'创作'},
    {i:'💬', n:'评论区运营', d:'高意向识别 + 话术', act:'openCommentIntel()', g:'创作'},
    {i:'🎭', n:'账号人设', d:'锁死你的账号语气', act:'openPersonaManager()', g:'创作'},
    {i:'✍️', n:'去 AI 味改写', d:'真人语感 · 防 AI 限流', act:'openDeAIfy()', g:'创作'},
    {i:'🔍', n:'关键词布局', d:'标题/正文/标签搜索优化', act:'openKeywordPlan()', g:'创作'},
    {i:'🛡️', n:'发布前查重', d:'重复检测 + 降重 + 安全评分', act:'openPrePublishCheck()', g:'质检'},
    {i:'🔍', n:'违禁词扫描', d:'发布前检测违规风险', act:'openSensitiveCheck()', g:'质检'},
    {i:'📊', n:'账号健康度', d:'诊断限流 / 权重 / 风险', act:'openAccountHealth()', g:'质检'},
    {i:'🩺', n:'发布前检查台', d:'边写边打分 · 逐项告诉你怎么改', act:'openPreCheckStation()', g:'质检'},
    {i:'🤝', n:'私域合规话术', d:'软引导 + 避坑 + 转化', act:'openConversionScript()', g:'增长'},
    {i:'🎭', n:'博主风格分析', d:'粘链接拆 7 维风格 + 滑块融合改写', act:'openBloggerStyle()', g:'增长'}
  ];
  // V6.41 收敛：按创作 → 质检 → 增长 三组展示，不再 13 个平铺
  const GROUPS = [
    {g:'创作', label:'创作提效', icon:'✍️'},
    {g:'质检', label:'发布质检', icon:'🩺'},
    {g:'增长', label:'商业增长', icon:'📈'}
  ];
  const cur = localStorage.getItem('xhs_persona_id') || '';
  const pName = cur ? (function(){ const p=getPersonas().find(x=>x.id===cur); return p?p.name:''; })() : '';
  const body = GROUPS.map(function(G){
    const list = tools.filter(function(t){ return t.g===G.g; });
    if(!list.length) return '';
    return '<div class="st-card" style="margin-bottom:12px"><div class="st-head">'+G.icon+' '+G.label+'<span class="st-desc" style="font-weight:400">'+(G.g==='创作'?'把想法变成能发的稿子':G.g==='质检'?'发之前把雷排掉':'把流量变成钱')+'</span></div>' +
      '<div class="st-tools">' + list.map(function(t){
        return '<span class="st-btn" onclick="'+t.act+'">'+t.i+' '+t.n+'</span>';
      }).join('') + '</div></div>';
  }).join('');
  return '<div class="pro-tools">' +
    '<div class="pt-head"><span class="pt-title">🧰 发布工具箱</span><span class="pt-sub">按场景选工具，别在一堆入口里找</span>' +
      (pName?'<span class="pt-persona" onclick="openPersonaManager()">🎭 人设：'+esc(pName)+'</span>':'') +
    '</div>' + body +
  '</div>';
}
function personaSelectHtmlForForm(){
  return personaSelectHtml('', true);
}

/* ================= V6.7 变现商业运营中心 ================= */
const VMONEY_SYSTEMS = [
  {id:'ad', ico:'🤝', name:'广告商单变现', desc:'报价表 / 蒲公英入驻 / Brief / 置换协议 / 探店脚本 / 报备合规', color:'var(--red)'},
  {id:'shop',ico:'🛍️', name:'电商带货变现', desc:'选品方向 / 种草文案 / 商品卡标题 / 直播口播 / 佣金预估', color:'#ff9500'},
  {id:'course',ico:'📚', name:'知识付费变现', desc:'课程大纲 / 专栏售卖笔记 / 咨询报价 / 虚拟产品上架文案', color:'#34c759'},
  {id:'private',ico:'🔐', name:'私域合规变现', desc:'低风险引流话术 / 评论区·私信·主页软引导 / 私域承接成交', color:'#0a84ff'},
  {id:'light',ico:'🎁', name:'轻量变现', desc:'好物体验 / 内容授权 / 转载分成 / 素人置换', color:'#8e8e93'}
];
function renderVmoney(){
  if(!proGuard('变现商业')){ navigate('dashboard'); return; }
  const d = Store.data; const ov = d.analytics.overview||{};
  const inc = d.money.records.reduce((a,b)=>a+b.income,0);
  $('#content').innerHTML =
  '<div class="section-head"><h2>💼 变现商业运营中心</h2><span class="pill red">会员</span></div>' +
  '<div class="grid grid-3" style="margin-bottom:14px">' +
    '<div class="metric-card"><div class="m-label">我的粉丝</div><div class="m-row"><span class="m-num">'+fmtNum(ov.fans||0)+'</span></div></div>' +
    '<div class="metric-card"><div class="m-label">累计变现</div><div class="m-row"><span class="m-num" style="color:var(--red)">¥'+inc+'</span></div></div>' +
    '<div class="metric-card"><div class="m-label">变现阶段</div><div class="m-row"><span class="m-num" style="font-size:15px">'+((ov.fans||0)>=10000?'商单/带货成熟期':(ov.fans||0)>=1000?'置换→带货起步期':'新手积累期')+'</span></div></div>' +
  '</div>' +
  '<div class="vm-actions" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">' +
    '<div class="pt-item" onclick="openVpath()"><span class="pt-ico">🧭</span><div class="pt-info"><div class="pt-name">变现路径诊断</div><div class="pt-desc">你的账号该先做什么</div></div></div>' +
    '<div class="pt-item" onclick="openRiskCheck()"><span class="pt-ico">⚠️</span><div class="pt-info"><div class="pt-name">变现风控检测</div><div class="pt-desc">违规导流/硬广自查</div></div></div>' +
    '<div class="pt-item" onclick="openIncomeForecast()"><span class="pt-ico">📈</span><div class="pt-info"><div class="pt-name">收益预估</div><div class="pt-desc">月度收入模拟</div></div></div>' +
  '</div>' +
  '<div style="font-size:12.5px;font-weight:700;color:var(--text2);margin:6px 0 10px;letter-spacing:.3px">全网主流变现模式 · AI 全覆盖</div>' +
  '<div class="vm-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-bottom:14px">' +
    VMONEY_SYSTEMS.map(function(sys){
      return '<div class="pt-item" style="align-items:flex-start" onclick="openVmoneyGen(\''+sys.id+'\')">' +
        '<span class="pt-ico">'+sys.ico+'</span>' +
        '<div class="pt-info"><div class="pt-name">'+sys.name+'</div><div class="pt-desc" style="white-space:normal;line-height:1.5;margin-top:2px">'+sys.desc+'</div></div>' +
      '</div>';
    }).join('') +
  '</div>' +
  '<div style="font-size:10px;color:var(--text4);margin:10px 0 14px;text-align:center;line-height:1.7">⚠️ 免责声明：本页面报价区间/佣金比例均为 AI 趋势测算参考，非官方承诺，实际以小红书蒲公英/橱窗后台为准。</div>' +
  '<div class="card"><div class="card-title">🧩 变现资产库 <span class="more" onclick="openVmoneyAssets()">＋ 添加</span></div>' +
    '<div id="vmAssets" style="font-size:12.5px">'+(renderVmoneyAssetsHtml())+'</div>' +
  '</div>';
}
function renderVmoneyAssetsHtml(){
  const d = Store.data;
  if(!d.vmoney) d.vmoney = {assets:[]};
  if(!d.vmoney.assets.length) return '<div class="empty" style="padding:14px">还没有变现资产，添加你的商单报价档案 / 选品方向 / 话术库，切换账号自动加载</div>';
  return d.vmoney.assets.map(function(a){
    return '<div class="lib-item" style="cursor:default"><div class="draft-thumb" style="background:var(--soft-blue)">'+a.type+'</div><div style="flex:1"><div style="font-weight:600;font-size:13px">'+esc(a.title)+'</div><div style="font-size:11px;color:var(--text3)">'+a.type+' · '+a.date+'</div></div><button class="icon-btn" onclick="delVmoneyAsset(\''+a.id+'\')">🗑️</button></div>';
  }).join('');
}
function openVmoneyAssets(){
  Modal.open('🧩 添加变现资产', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">把常用的变现资料存进资产库（每个账号独立）：<b>商单报价档案 / 选品方向 / 私域话术 / 合作数据</b>。</p>
    <div class="form-group"><label class="label">类型</label><select id="vmType"><option>报价档案</option><option>选品方向</option><option>私域话术</option><option>合作数据</option></select></div>
    <div class="form-group"><label class="label">标题</label><input id="vmTitle" placeholder="如：美妆商单报价表 v2"></div>
    <div class="form-group"><label class="label">内容</label><textarea id="vmBody" style="min-height:80px" placeholder="粘贴报价/话术/选品清单…"></textarea></div>
    <button class="btn btn-red btn-block" onclick="saveVmoneyAsset()">保存</button>`);
}
function saveVmoneyAsset(){
  const title = $('#vmTitle').value.trim();
  if(!title){ Toast('请输入标题'); return; }
  const d = Store.data;
  if(!d.vmoney) d.vmoney = {assets:[]};
  d.vmoney.assets.unshift({id:uid(), title, type:$('#vmType').value, body:$('#vmBody').value.trim(), date:todayStr()});
  Store.save(); Modal.close(); renderVmoney(); Toast('已存入变现资产库 ✅');
}
function delVmoneyAsset(id){
  Store.data.vmoney.assets = Store.data.vmoney.assets.filter(a=>a.id!==id);
  Store.save(); renderVmoney(); Toast('已删除');
}

/* ---------- 四大变现体系生成器 ---------- */
const VMONEY_PROMPTS = {
  ad: function(input){ return '我是小红书「'+input+'」赛道的博主，请帮我搭建「广告商单变现体系」。\\n\\n输出格式（严格按此结构）：\\n【1. 商单报价表】按粉丝量级分档（5k/1w/5w/10w）给出图文/视频/合集报价区间，附报价理由\\n【2. 蒲公英入驻资料】一句话简介（专业版）+ 3 个可展示的代表作品方向\\n【3. 品牌合作 Brief 对接话术】收到品牌需求后 3 条专业回复模板（确认需求/问预算/谈档期）\\n【4. 置换合作协议文案】寄拍/置换合作的一页协议要点（交付标准/版权/排他/结算）\\n【5. 探店合作脚本】一篇探店笔记的结构脚本（开头钩子→环境→菜品→体验→互动引导）\\n【6. 报备 vs 非报备笔记写法】各给 1 篇样例结构，并说明报备笔记的风险规避要点（合作声明、真实体验、合规标签）\\n\\n要求：具体可执行、贴合 2026 年小红书行情。'; },
  shop: function(input){ return '我是小红书「'+input+'」赛道的博主，请帮我搭建「电商带货变现体系」。\\n\\n输出格式（严格按此结构）：\\n【1. 高佣金选品方向】5 个与赛道匹配的选品方向（含佣金区间预估 10%-40%）及选品理由\\n【2. 带货笔记种草文案】1 篇完整样例（真实使用场景自然植入，避免硬广感）\\n【3. 商品卡标题】5 个商品卡标题（短、利益点、有搜索词）\\n【4. 直播口播脚本】30 分钟直播的分段口播框架（开场→主推品→互动→逼单→预告）\\n【5. 带货避坑话术】3 个常见带货坑的规避说法（质量争议/发货慢/尺码问题）\\n【6. 佣金收益预估】按 1000/5000/1w 粉，估算月佣金收入区间与爆款带动力\\n\\n要求：具体、贴合 2026 年小红书电商环境。'; },
  course: function(input){ return '我是小红书「'+input+'」赛道的博主，请帮我搭建「知识付费变现体系」。\\n\\n输出格式（严格按此结构）：\\n【1. 课程大纲】1 门 8 节课程的完整大纲（含每节标题与核心价值点）\\n【2. 专栏售卖笔记】1 篇售卖笔记完整文案（痛点开头→课程价值→限时权益→下单引导）\\n【3. 引流短文案】3 条把免费内容粉丝转化为付费咨询的软性引导文案\\n【4. 付费咨询报价体系】按 15/30/60 分钟三档报价 + 咨询前信息收集清单\\n【5. 虚拟产品上架文案】模板/预设/资料包的标题 + 详情页要点 + 定价策略\\n\\n要求：贴合小红书专栏/付费笔记官方功能，具体可执行。'; },
  private: function(input){ return '我是小红书「'+input+'」赛道的博主，请帮我搭建「私域合规变现体系」。\\n\\n输出格式（严格按此结构）：\\n【1. 评论区软引导】3 条把评论互动自然引到私信的合规说法（不出现微信/手机号等词）\\n【2. 私信承接话术】3 条私信开场（给价值→建立信任→铺垫转化）\\n【3. 主页简介引导】1 条合规的主页简介写法（定位+利益点+安全的联系方式暗示）\\n【4. 成交转化话术】2 条私域成交话术（解除顾虑/临门一脚）\\n【5. 违规划避清单】列出该赛道常见 5 个触发导流判定的表达 + 合规替代说法\\n\\n要求：贴合 2026 年平台导流规则，自然不机械。'; },
  light: function(input){ return '我是小红书「'+input+'」赛道的新人博主，请帮我搭建「轻量变现体系」。\\n\\n输出格式（严格按此结构）：\\n【1. 好物体验申请文案】1 篇完整的申请模板（自我介绍+账号数据+配合度承诺）\\n【2. 内容授权合作协议】一页要点版（授权范围/期限/费用/署名/排他）\\n【3. 转载分成报价方案】按阅读量/粉丝量给出转载授权报价区间\\n【4. 素人置换对接话术】3 条和商家沟通置换合作的模板（0 粉起步怎么谈）\\n【5. 新人变现起步路径】从 0 粉到 1000 粉的 30 天变现起步计划（每周做什么）\\n\\n要求：贴合 2026 年小红书素人变现环境，具体可执行。'; }
};
function openVmoneyGen(kind){
  const sys = VMONEY_SYSTEMS.find(x=>x.id===kind);
  if(!sys){ Toast('未知的变现体系'); return; }
  if(!premiumGuard('变现体系生成')) return;
  Modal.open(sys.ico+' '+sys.name+' · AI 生成器', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">${sys.desc}。输入你的赛道，AI 一键生成完整可落地方案。</p>
    <div style="background:var(--soft-orange);border:1px solid rgba(255,149,0,.3);border-radius:10px;padding:9px 12px;font-size:11.5px;color:var(--text2);line-height:1.6;margin-bottom:12px">⚠️ <b>合规提示</b>：商单类文案请务必区分「蒲公英报备商单」与「私下置换」；平台禁止未报备的商业合作笔记与违规导流，生成内容需经过「变现风控检测」后使用。</div>
    <div class="form-group"><label class="label">你的赛道</label><input id="vgInput" placeholder="如：美妆护肤 / 母婴育儿 / 职场干货…"></div>
    <button class="btn btn-red btn-block" onclick="runVmoneyGen('${kind}')">✨ 生成方案</button>
    <div id="vgOut" style="margin-top:12px"></div>`);
}
let vgResult = '';
async function runVmoneyGen(kind){
  const input = $('#vgInput').value.trim();
  if(!input){ Toast('请输入赛道'); return; }
  const out = $('#vgOut');
  const sb = aiStreamBox(out, '去 AI 味改写');
  const prompt = VMONEY_PROMPTS[kind](input);
  const r = await proAiAsk(prompt, '你是小红书商业变现体系搭建专家，方案要具体、可执行、贴合平台规则。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  vgResult = r.text;
  // P0 风控自动联动：生成后自动扫描本地词库，严重风险>0 禁止入库
  const scan = sensitiveScanText(r.text);
  const severe = scan.hits.filter(function(h){return h.level===2;}).length;
  const riskHtml = '<div style="background:'+(severe?'var(--soft-red)':'var(--soft-green)')+';border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:12px;line-height:1.7">' +
    '<b>🛡️ 自动风控</b>：检出 <b style="color:var(--red)">'+scan.total+'</b> 个平台风险词'+(severe?'（其中严重 '+severe+' 个）':'') +
    (severe
      ? '<br><span style="color:var(--red)">⚠️ 含严重违规词，请先修改后入库/排期（点击下方「🔍 去改写」进入违禁词扫描）</span>'
      : '<br><span style="color:var(--green)">✓ 未命中严重违规词，可安全入库</span>') +
  '</div>';
  const saveBtn = severe
    ? '<button class="btn btn-ghost btn-sm" style="flex:1" onclick="openSensitiveCheck()">🔍 去改写</button>'
    : '<button class="btn btn-red btn-sm" style="flex:1" onclick="saveVgResult()">📥 存入变现资产库</button>';
  out.innerHTML = riskHtml + `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制方案</button>
      ${saveBtn}
    </div>`;
}
function saveVgResult(){
  if(!vgResult){ Toast('暂无内容'); return; }
  // 二次风控复查：命中严重违规词禁止入库（防违规文案流入发布/排期链路）
  try{
    const words = (Store.data && Store.data.sensitiveWords) || [];
    const severe = words.filter(function(w){ return w.level===2 && vgResult.includes(w.w); });
    if(severe.length){
      Toast('检测到 '+severe.length+' 个严重违规词，已拦截入库，请先「去改写」🛡️');
      openRiskCheck();
      return;
    }
  }catch(e){}
  Store.data.vmoney.assets.unshift({id:uid(), title:'AI 变现方案 · '+todayStr(), type:'报价档案', body:vgResult, date:todayStr()});
  Store.save(); Toast('已存入变现资产库 ✅（已通过风控复查）');
}

/* ---------- 决策中枢 1：变现路径诊断 ---------- */
async function openVpath(){
  if(!premiumGuard('变现路径诊断')) return;
  const d = Store.data; const ov = d.analytics.overview||{};
  Modal.open('🧭 变现路径诊断', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">基于你的<b>赛道 / 粉丝 / 内容形式</b>，AI 匹配最适合的变现优先级，给出<b>从 0 到 1</b>的变现起步方案。</p>
    <div class="form-group"><label class="label">你的赛道</label><input id="vpTrack" placeholder="如：美妆护肤" value="${esc((d.userProfile&&d.userProfile.accountType)||'')}"></div>
    <div class="form-group"><label class="label">粉丝量（可自动读取，也可修改）</label><input id="vpFans" type="number" value="${ov.fans||0}"></div>
    <div class="form-group"><label class="label">内容形式</label><select id="vpForm"><option>图文</option><option>视频</option><option>图文+视频</option></select></div>
    <button class="btn btn-red btn-block" onclick="runVpath()">🧭 开始诊断</button>
    <div id="vpOut" style="margin-top:12px"></div>`);
}
let vpResult = '';
async function runVpath(){
  const track = $('#vpTrack').value.trim(); if(!track){ Toast('请填写赛道'); return; }
  const fans = +$('#vpFans').value || 0;
  const form = $('#vpForm').value;
  const out = $('#vpOut');
  const sb = aiStreamBox(out, '生成关键词布局');
  const prompt = '我的小红书账号：赛道「'+track+'」，粉丝 '+fans+'，内容形式 '+form+'。\\n\\n请做「变现路径诊断」，严格按此结构输出：\\n【1. 变现优先级排序】把商单/带货/知识付费/私域/轻量按适合度排序（TOP1-5），各一句话理由\\n【2. 当前阶段最佳起步】明确告诉你现在最该先做哪 1 件事（先置换？先商单？先带货？），为什么\\n【3. 从 0 到 1 变现路线图】分阶段（现在→1个月→3个月→6个月）各 1 个里程碑动作\\n【4. 三个关键动作】本周就能做的 3 个变现动作\\n\\n要求：犀利具体、不空话、贴合 2026 年小红书环境。';
  const r = await proAiAsk(prompt, '你是小红书变现路径规划教练，服务过大量中小博主。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  vpResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:420px;overflow-y:auto">${esc(r.text)}</div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyText(this,'${esc(r.text)}')">📋 复制诊断</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="vpathToSchedule()">📅 生成本周变现排期</button>
    </div>`;
}

/* ---------- 决策中枢 2：变现风控检测 ---------- */
function openRiskCheck(){
  Modal.open('⚠️ 变现风控检测', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">检测你的<b>变现文案</b>中的<b>违规导流 / 硬广营销词</b>，自动改写优化，规避限流与封号风险。</p>
    <textarea id="rcInput" placeholder="粘贴你的带货/商单/引流文案…" style="min-height:100px"></textarea>
    <button class="btn btn-red btn-block" style="margin-top:10px" onclick="runRiskCheck()">⚠️ 开始检测</button>
    <div id="rcOut" style="margin-top:12px"></div>`);
}
let rcResult = '';
async function runRiskCheck(){
  const src = $('#rcInput').value.trim();
  if(!src){ Toast('请粘贴文案'); return; }
  if(!premiumGuard('变现风控检测')) return;
  const out = $('#rcOut');
  const sb = aiStreamBox(out, '诊断变现路径');
  const prompt = '请对下面这篇小红书<b>变现类文案</b>做风控检测。\\n\\n输出格式（严格按此结构）：\\n【1. 风险评分】100 分制（越高越危险）+ 等级 + 一句话结论\\n【2. 违规点清单】逐条列出（导流词/硬广词/承诺词/诱导词/报备缺失），引用原文 + 平台规则\\n【3. 合规改写】给出整篇改写后版本（保留卖点，规避风险，自然不生硬）\\n【4. 发布建议】2 条发布注意事项（标签/置顶评论/报备）\\n\\n文案原文：\\n' + src.slice(0, 4000);
  const r = await proAiAsk(prompt, '你是小红书变现内容风控专家，熟悉导流与广告法红线。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  rcResult = r.text;
  out.innerHTML = `<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:420px;overflow-y:auto">${esc(r.text)}</div>
    <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%" onclick="copyText(this,'${esc(r.text)}')">📋 复制风控报告</button>`;
}

/* ---------- 决策中枢 3：收益预估（V6.8 参数自定义） ---------- */
function openIncomeForecast(){
  const d = Store.data; const ov = d.analytics.overview||{};
  Modal.open('📈 收益预估模型 · 参数自定义', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">可调节<b>4 个运营变量</b>，模拟不同策略下的月度收入区间，让预估贴合你的真实情况。</p>
    <div class="form-group"><label class="label">当前粉丝数</label><input id="fcFans" type="number" value="${ov.fans||0}"></div>
    <div class="form-group"><label class="label">月均涨粉数</label><input id="fcGrowth" type="number" value="${Math.max(50,Math.round((ov.fans||0)*0.06))}"></div>
    <div class="form-group"><label class="label">带货转化率（％）</label><input id="fcConv" type="number" value="3" min="0.5" max="15" step="0.5"></div>
    <div class="form-group"><label class="label">商单月接单量（篇）</label><input id="fcOrders" type="number" value="${(ov.fans||0)>=10000?3:(ov.fans||0)>=1000?1:0}" min="0"></div>
    <div class="form-group"><label class="label">佣金浮动比例（0.5x - 2x）</label><input id="fcRatio" type="number" value="1" min="0.5" max="2" step="0.1"></div>
    <button class="btn btn-red btn-block" onclick="calcIncomeForecast()">📈 计算收益区间</button>
    <div id="fcOut" style="margin-top:12px"></div>`);
}
function calcIncomeForecast(){
  const fans = +$('#fcFans').value || 0;
  const growth = +$('#fcGrowth').value || 0;
  const conv = +$('#fcConv').value || 3;
  const orders = +$('#fcOrders').value || 0;
  const ratio = +$('#fcRatio').value || 1;
  // 基础模型（每粉单价 × 粉丝 × 系数）
  const fansEnd = fans + growth;                       // 月末预估粉丝
  const adBase = (fans + fansEnd)/2;                   // 月均粉丝
  const adMonth = Math.round(adBase * 0.35 / 100 * (orders>0? (orders * 12) : 12)); // 商单：0.35 元/千粉×接单
  const commMonth = Math.round(adBase * 0.15 * (conv/3) * ratio);                    // 佣金：0.15 元/粉×转化×浮动
  const courseMonth = fans>=5000 ? Math.round(adBase*0.08*ratio) : 0;                // 知识付费
  const total = adMonth + commMonth + courseMonth;
  const low = Math.round(total*0.6), high = Math.round(total*1.5);
  const out = $('#fcOut');
  const cell = function(k,v,c){ return '<div style="background:var(--bg);border-radius:10px;padding:12px;text-align:center"><div style="font-size:11px;color:var(--text3)">'+k+'</div><div style="font-size:18px;font-weight:800;color:'+c+'">'+v+'</div></div>'; };
  out.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">' +
      cell('商单预估','¥'+adMonth,'var(--text)') + cell('带货佣金','¥'+commMonth,'var(--text)') +
      cell('知识付费','¥'+courseMonth,'var(--text)') + cell('月度潜力区间','¥'+low+' ~ ¥'+high,'var(--red)') +
    '</div>' +
    '<div style="font-size:12px;color:var(--text3);line-height:1.7;margin-bottom:10px">📐 模型说明：商单按粉丝单价 0.35 元/千粉·篇 估算（月均粉丝×接单量）；佣金按 0.15 元/粉·月 乘转化系数与浮动；知识付费需 5000 粉以上。若月末粉丝达 <b style="color:var(--text2)">'+fmtNum(fansEnd)+'</b>，潜力区间对应调整。</div>' +
    '<button class="btn btn-ghost btn-block" onclick="openVpath()">🧭 用 AI 做完整变现诊断</button>';
}

/* V6.8 变现诊断 → 本周排期联动 */
function vpathToSchedule(){
  const goal = localStorage.getItem('xhs_goal') || '变现增收';
  const d = Store.data;
  const today = new Date();
  const tasks = [
    {t:'变现笔记选题 1：盘点我的账号优势', day:1},
    {t:'发布 1 篇真实体验式内容（自然植入变现方向）', day:2},
    {t:'整理报价档案 / 选品清单并存入资产库', day:3},
    {t:'用「变现风控检测」复查历史变现文案', day:4},
    {t:'发布第 2 篇变现内容（换角度/换案例）', day:5},
    {t:'看今日变现日报，标记 1 条可落地玩法', day:6},
    {t:'复盘本周变现数据，更新下周排期', day:7}
  ];
  tasks.forEach(function(x, i){
    const dt = new Date(today); dt.setDate(dt.getDate()+x.day-1);
    d.schedule.push({id:uid(), date:fmtDate(dt), title:x.t, status:'draft', time:'19:00', cat:'变现', src:'vpath'});
  });
  Store.save();
  Modal.close();
  Toast('已生成未来 7 天变现排期 📅');
  setTimeout(function(){ navigate('schedule'); }, 500);
}


function reportUpdateTime(d){
  try{
    if(!d || !d.updatedAt) return '';
    const dt = new Date(d.updatedAt);
    const diff = Math.max(0, Math.round((Date.now() - dt.getTime())/60000));
    if(diff < 1) return '刚刚';
    if(diff < 60) return diff + ' 分钟前';
    const p = n=>String(n).padStart(2,'0');
    return p(dt.getHours())+':'+p(dt.getMinutes());
  }catch(e){ return ''; }
}

/* ================= V6.7 变现日报中心 ================= */
function getDailyReport(){
  try{
    const v = JSON.parse(localStorage.getItem('xhs_daily_report')||'null');
    if(v && v.date === todayStr() && v.body) return v;
  }catch(e){}
  return null;
}
async function syncDailyReport(){
  try{
    const cfg = (typeof getCloudConfig==='function') ? getCloudConfig() : null;
    if(!cfg || !cfg.api) return;
    const r = await fetch(cfg.api + '/dailyreport', { cache:'no-store' });
    const j = await r.json();
    if(j.ok && j.data && j.data.body){
      const prev = getDailyReport();
      const changed = !prev || prev.date !== j.data.date || JSON.stringify(prev.body) !== JSON.stringify(j.data.body);
      localStorage.setItem('xhs_daily_report', JSON.stringify(j.data));
      // V6.19 局部/整页智能刷新：内容有变化才刷，避免整页闪烁
      if(currentPage === 'vreport') renderVreport();
      else if(currentPage === 'trending' && changed) renderTrending();
    }
  }catch(e){}
}
function renderVreport(){
  const d = getDailyReport();
  const hist = loadReportHistory();
  const body = d ? d.body : null;
  const cats = reportCats();
  // V6.31.2 优化：无日报时主动拉取 + 提供手动刷新，避免首屏长期“加载中”
  if(!d && typeof syncDailyReport==='function'){
    syncDailyReport().then(()=>{ if(currentPage==='vreport' && getDailyReport()) renderVreport(); });
  }
  $('#content').innerHTML =
  '<div class="section-head"><h2>📰 变现日报中心</h2><span class="pill red">'+(d?('每日更新 · '+d.date):'每日自动更新')+'</span></div>' +
  (d ? renderReportToday(d) : '<div class="card" style="text-align:center;padding:36px 20px"><div class="empty"><span class="empty-ico">📰</span><div style="font-size:15px;font-weight:600;margin-bottom:6px">日报正在更新…</div><div style="font-size:12px;color:var(--text3);line-height:1.7">首次进入约 5-10 秒自动拉取；若网络较慢，可点击下方按钮手动刷新</div><button class="btn btn-red btn-sm" style="margin-top:14px" onclick="syncDailyReport().then(()=>renderVreport())">🔄 立即刷新日报</button></div></div>') +
  '<div class="card" style="margin-top:14px"><div class="card-title">📂 历史日报（近 30 天）</div>' +
  '<div id="reportHist">'+(hist.length?hist.map(function(r,i){
    return '<div class="hist-item" style="cursor:pointer" onclick="viewReportDay(\''+r.date+'\')"><span class="h-title">'+r.date+' 日报</span><span class="pill '+(i===0?'red':'')+'" style="flex-shrink:0">'+r.body.rules.length+' 条新规</span><span class="h-meta">'+(r.body.actions?r.body.actions.length:3)+' 条行动</span></div>';
  }).join(''):'<div class="empty" style="padding:14px">暂无历史记录</div>')+'</div>' +
  '</div>' +
  '<div class="card" style="margin-top:14px"><div class="card-title">🎯 按赛道筛选</div>' +
  '<div style="display:flex;flex-wrap:wrap;gap:6px">'+cats.map(function(c){
    return '<span class="chip '+(reportCat===c?'active':'')+'" onclick="reportCat=\''+c+'\';renderVreport()">'+c+'</span>';
  }).join('')+'</div>' +
  '<div style="font-size:11px;color:var(--text3);margin-top:8px">赛道来自每日日报自动更新（覆盖 15+ 行业）· 选择后行情模块只展示对应赛道</div></div>' +
  '<div style="font-size:10px;color:var(--text4);margin-top:14px;text-align:center;line-height:1.7">⚠️ 免责声明：本页面热度、报价、佣金比例均为 AI 趋势测算参考，非小红书官方实时数据，不构成投资/运营建议，平台不对数据精准性做承诺。</div>';
}
function reportCats(){
  const d = getDailyReport();
  const cats = ['全部'];
  if(d && d.body && d.body.market && d.body.market.length){
    d.body.market.forEach(function(m){ if(m.cat && cats.indexOf(m.cat)<0) cats.push(m.cat); });
  } else {
    ['美妆','家居','母婴','职场','美食','穿搭','数码','健身','旅行','宠物','情感','学习','个护','汽车'].forEach(function(c){ cats.push(c); });
  }
  return cats;
}
function renderReportToday(d){
  const b = d.body;
  const mkt = reportCat==='全部' ? b.market : b.market.filter(function(x){return x.cat===reportCat;});
  return '<div class="card" style="border-color:rgba(194,59,82,.3)">' +
    '<div class="card-title">📰 今日变现日报 <span class="pill red" style="font-size:9px;padding:1px 6px">'+(d.source==='ai'?'AI 智能整理':'编辑整理')+'</span></div>' +
    '<div style="font-size:11px;color:var(--text3);margin:-4px 0 10px">'+d.date+' · 今日 '+reportUpdateTime(d)+' 更新 · 汇总平台最新变现玩法 · 仅供参考，以平台官方为准</div>' +
    '<div class="rpt-sec"><div class="rpt-h">📌 平台变现新规</div>'+b.rules.map(function(r){return '<div class="rpt-li">• '+r+'</div>';}).join('')+'</div>' +
    '<div class="rpt-sec"><div class="rpt-h">💡 新增变现玩法</div>'+b.plays.map(function(p){return '<div class="rpt-li"><b>'+p.name+'</b>（门槛：'+p.gate+'）<br><span style="color:var(--text3)">'+p.desc+'</span></div>';}).join('')+'</div>' +
    '<div class="rpt-sec"><div class="rpt-h">💰 赛道变现行情'+(reportCat!=='全部'?'（'+reportCat+'）':'')+'</div>'+(mkt.length?mkt.map(function(x){return '<div class="rpt-li"><b>'+x.cat+'</b> · 商单 '+x.ad+' · 佣金 '+x.comm+'<br><span style="color:var(--text3)">'+x.note+'</span></div>';}).join(''):'<div class="rpt-li" style="color:var(--text3)">该赛道今日无专项行情</div>')+'</div>' +
    '<div class="rpt-sec"><div class="rpt-h">🎯 今日变现案例</div><div class="rpt-li"><b>'+b.caseStudy.name+'</b><br>'+b.caseStudy.desc+'</div></div>' +
    '<div class="rpt-sec"><div class="rpt-h">⚠️ 风险预警</div>'+b.risks.map(function(r){return '<div class="rpt-li" style="color:var(--red)">• '+r+'</div>';}).join('')+'</div>' +
    '<div class="rpt-sec"><div class="rpt-h">✅ 今日行动清单</div>'+b.actions.map(function(a){return '<div class="rpt-li"><b>'+a.tier+'</b>：'+a.act+'</div>';}).join('')+'</div>' +
    '<div style="display:flex;gap:10px;margin-top:14px">' +
      '<button class="btn btn-ghost btn-sm" style="flex:1" onclick="copyReportToday()">📋 复制日报</button>' +
      '<button class="btn btn-red btn-sm" style="flex:1" onclick="openVmoneyGen(\'ad\')">🤝 生成落地文案</button>' +
    '</div>' +
  '</div>';
}
function copyReportToday(){
  const d = getDailyReport();
  if(!d){ Toast('暂无日报'); return; }
  const b = d.body;
  const txt = '【今日变现日报 · '+d.date+'】\n\n📌 新规：\n'+b.rules.join('\n')+'\n\n💡 新玩法：\n'+b.plays.map(p=>p.name+'（'+p.gate+'）').join('\n')+'\n\n💰 行情：\n'+b.market.map(m=>m.cat+' · 商单'+m.ad+' · 佣金'+m.comm).join('\n')+'\n\n🎯 案例：'+b.caseStudy.name+'\n\n⚠️ 风险：\n'+b.risks.join('\n')+'\n\n✅ 行动：\n'+b.actions.map(a=>a.tier+'：'+a.act).join('\n');
  copyText(null, txt);
}
function loadReportHistory(){
  try{
    const h = JSON.parse(localStorage.getItem('xhs_report_history')||'[]');
    return Array.isArray(h) ? h : [];
  }catch(e){ return []; }
}
function saveReportToHistory(d){
  try{
    let h = loadReportHistory();
    h = h.filter(function(x){return x.date!==d.date;});
    h.unshift(d);
    if(h.length>30) h = h.slice(0,30);
    localStorage.setItem('xhs_report_history', JSON.stringify(h));
  }catch(e){}
}
function viewReportDay(date){
  const h = loadReportHistory();
  const r = h.find(function(x){return x.date===date;});
  if(!r){ Toast('该日无日报存档'); return; }
  const b = r.body;
  Modal.open('📰 日报 · '+r.date, '<div style="max-height:60vh;overflow-y:auto">' +
    '<div class="rpt-sec"><div class="rpt-h">📌 平台变现新规</div>'+b.rules.map(function(x){return '<div class="rpt-li">• '+x+'</div>';}).join('')+'</div>' +
    '<div class="rpt-sec"><div class="rpt-h">💡 新增变现玩法</div>'+b.plays.map(function(p){return '<div class="rpt-li"><b>'+p.name+'</b>（'+p.gate+'）</div>';}).join('')+'</div>' +
    '<div class="rpt-sec"><div class="rpt-h">💰 行情</div>'+b.market.map(function(m){return '<div class="rpt-li">'+m.cat+' · 商单 '+m.ad+' · 佣金 '+m.comm+'</div>';}).join('')+'</div>' +
    '<div class="rpt-sec"><div class="rpt-h">✅ 行动清单</div>'+b.actions.map(function(a){return '<div class="rpt-li"><b>'+a.tier+'</b>：'+a.act+'</div>';}).join('')+'</div>' +
  '</div>', true);
}
let reportCat = '全部';

/* ================= V6.7 创作中心 · 商业变现 4 卡 ================= */
function moneyToolsBar(){
  const tools = [
    {i:'🤝', n:'变现方案深度拓展', d:'商单 / 带货 / 知识付费 / 私域 / 轻量全模板', act:'openVmoneyGen(\'ad\')'},
    {i:'⚠️', n:'变现风控检测', d:'变现文案前置合规校验', act:'openRiskCheck()'},
    {i:'🧭', n:'账号变现路径诊断', d:'你的账号该先做什么', act:'openVpath()'},
    {i:'📈', n:'收益预估计算器', d:'月度收入潜力模拟', act:'openIncomeForecast()'}
  ];
  return '<div class="pro-tools" style="border-color:rgba(194,59,82,.25)">' +
    '<div class="pt-head"><span class="pt-title">💼 商业变现</span><span class="pt-sub">全网主流变现模式 · AI 全覆盖</span><span class="pt-persona" style="cursor:pointer" onclick="navigate(\'vmoney\')">进入变现商业中心 →</span></div>' +
    '<div class="pt-grid">' + tools.map(function(t){
      return '<div class="pt-item" onclick="'+t.act+'"><span class="pt-ico">'+t.i+'</span><div class="pt-info"><div class="pt-name">'+t.n+'</div><div class="pt-desc">'+t.d+'</div></div></div>';
    }).join('') + '</div>' +
  '</div>';
}

/* ================= V6.7 发现页日报入口卡 ================= */
function reportEntranceCard(){
  const d = getDailyReport();
  const rules = d ? d.body.rules.length : 0;
  const acts = d ? d.body.actions.length : 3;
  return '<div class="report-entry" onclick="navigate(\'vreport\')">' +
    '<div class="re-ico">📰</div>' +
    '<div class="re-body"><div class="re-title">今日变现日报'+(d?(' · '+d.date):'')+'</div>' +
    '<div class="re-sub">'+(d?('平台新规 '+rules+' 条 · 行情 '+ (d.body.market?d.body.market.length:0) +' 赛道 · 行动 '+acts+' 条'):'全网最新变现玩法 · 平台新规 · 行情 · 案例 · 风险预警')+'</div></div>' +
    '<span class="re-go">→</span></div>';
}

/* ================= V6.30 小红书全链路提效 · 去 AI 味改写 ================= */
function openDeAIfy(){
  if(!proGuard('去 AI 味改写')) return;
  const styles = ['自然口语（推荐）','干货专业','文艺种草','活泼闺蜜','高冷极简'];
  Modal.open('✍️ 去 AI 味改写', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">把 AI 生成的文案改写成<b>真人语感</b>，规避平台「AI 生成内容」判定，同时保留信息密度。多风格可选。</p>
    <div class="form-group"><label class="label">要改写的文案</label><textarea id="daText" rows="7" placeholder="粘贴你的 AI 文案 / 笔记草稿…"></textarea></div>
    <div class="form-group"><label class="label">改写风格</label>
      <div class="select-pills" id="daStyleP">
        ${styles.map(function(s,i){return '<span class="chip '+(i===0?'active':'')+'" onclick="setDaStyle(\''+s+'\',this)">'+s+'</span>';}).join('')}
      </div>
    </div>
    <button class="btn btn-red btn-block" onclick="runDeAIfy()">✍️ 开始改写</button>
    <div id="daOut" style="margin-top:14px"></div>`, true);
}
let daStyle = '自然口语（推荐）';
function setDaStyle(s, el){
  daStyle = s;
  if(el){ $$('#daStyleP .chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); }
}
async function runDeAIfy(){
  const txt = $('#daText').value.trim();
  if(!txt){ Toast('请先粘贴要改写的文案'); return; }
  const box = $('#daOut');
  box.innerHTML = '<div class="loading">AI 正在改写…</div>';
  const sys = '你是小红书爆款文案润色师。目标：把输入文案改写成像真人博主随手写的——去除 AI 腔（"首先/其次/总而言之/此外"等书面连接词、"XX 让你 XX"模板句、过度工整的排比），保留信息量，加入生活化口语、随意的语气词、自然的断句。不要输出任何解释，只输出改写后的正文。';
  const prompt = '改写风格：'+daStyle+'\n\n原文：\n'+txt;
  const r = await proAiAsk(prompt, sys, sb.update);
  if(!r.ok){ box.innerHTML = '<div style="color:var(--red);font-size:13px">' + esc(r.msg||'改写失败') + '</div>'; return; }
  box.innerHTML = '<div style="font-size:12px;color:var(--text3);margin-bottom:8px">✅ 改写完成 · 点击下方按钮复制</div>' +
    '<div class="out-item" onclick="copyText(this, '+JSON.stringify(r.text)+')" style="white-space:pre-wrap;font-size:13px;line-height:1.9;margin-bottom:10px"><span class="out-copy">复制</span>'+esc(r.text)+'</div>' +
    '<div class="gen-options">' +
      '<button class="btn btn-ghost btn-sm" onclick="runDeAIfy()">🔄 换一版</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="openCardMakerFromText(\''+esc(r.text).replace(/'/g,"\\'")+'\')">🖼️ 做图文卡片</button>' +
    '</div>';
}
function openCardMakerFromText(text){
  try{
    if(typeof openCardMaker==='function'){ openCardMaker(true, text); }
    else if(typeof openCardMaker==='function'){ openCardMaker(false, text); }
  }catch(e){}
}

/* ================= V6.30 关键词布局助手（搜索流量优化） ================= */
function openKeywordPlan(){
  if(!proGuard('关键词布局')) return;
  const ints = ['测评对比','教程攻略','好物清单','避坑排雷','经验分享'];
  Modal.open('🔍 关键词布局助手', `
    <p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:12px">输入主题，AI 按<b>搜索流量逻辑</b>给出：标题关键词 / 正文关键词密度 / 话题标签布局，让你的笔记更容易被搜到。</p>
    <div class="form-group"><label class="label">笔记主题</label><input id="kpKw" placeholder="如：油皮粉底液测评、通勤穿搭、副业搞钱"></div>
    <div class="form-group"><label class="label">搜索意图</label>
      <div class="select-pills" id="kpIntP">
        ${ints.map(function(s,i){return '<span class="chip '+(i===0?'active':'')+'" onclick="setKpInt(\''+s+'\',this)">'+s+'</span>';}).join('')}
      </div>
    </div>
    <button class="btn btn-red btn-block" onclick="runKeywordPlan()">🔍 生成关键词布局</button>
    <div id="kpOut" style="margin-top:14px"></div>`, true);
}
let kpInt = '测评对比';
function setKpInt(s, el){
  kpInt = s;
  if(el){ $$('#kpIntP .chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); }
}
async function runKeywordPlan(){
  const kw = $('#kpKw').value.trim();
  if(!kw){ Toast('请输入笔记主题'); return; }
  const box = $('#kpOut');
  box.innerHTML = '<div class="loading">AI 正在分析搜索流量…</div>';
  const sys = '你是小红书搜索流量优化专家。对给定主题输出「关键词布局方案」，严格按以下格式输出：\n【标题关键词】3 个不同组合的爆款标题（各自包含主关键词+修饰词）\n【正文关键词】列出 5-8 个应在正文自然出现的相关词（含 1-2 个长尾词），并说明位置（首段/中段/结尾）\n【话题标签】10 个标签分层：3 个核心词 + 4 个垂直词 + 3 个泛流量词\n【搜索建议】1 句针对该主题的搜索流量提醒\n不要输出其他内容。';
  const prompt = '主题：'+kw+'｜搜索意图：'+kpInt;
  const r = await proAiAsk(prompt, sys, sb.update);
  if(!r.ok){ box.innerHTML = '<div style="color:var(--red);font-size:13px">' + esc(r.msg||'生成失败') + '</div>'; return; }
  box.innerHTML = '<div style="font-size:12px;color:var(--text3);margin-bottom:8px">✅ 布局方案已生成 · 点击复制</div>' +
    '<div class="out-item" onclick="copyText(this, '+JSON.stringify(r.text)+')" style="white-space:pre-wrap;font-size:13px;line-height:1.9"><span class="out-copy">复制</span>'+esc(r.text)+'</div>' +
    '<div style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="runKeywordPlan()">🔄 换一版</button></div>';
}

/* ============================================================
 * 12. 发布前检查台（V6.33 · 本地打分引擎 + AI 改写）
 * ------------------------------------------------------------
 * 设计原则：
 *   - 本地规则即时出分（不依赖 AI、不消耗额度、断网可用），边打字边给反馈
 *   - 每个维度可解释：告诉用户"为什么扣分 / 怎么改"，而不是丢一个黑盒分数
 *   - AI 只做"改写"，不做"评分"，保证评分稳定可复现
 * ============================================================ */

/* ---------- 本地评分词库（小红书生态经验规则） ---------- */
var PP_EMOJI_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\uFE0F/g;
var PP_NUM_RE   = /[0-9０-９]|[一二三四五六七八九十百]|\d+\s*(个|招|步|条|款|种|款|天|岁|块|元|斤|次)/g;
var PP_Q_RE     = /[?？]|为什么|为啥|原来|居然|竟然|难道|到底|真的吗/;
var PP_ABS_RE   = /(最[好佳强便宜大新高]|第一|唯一|绝对|100%|百分百|永久|彻底|根治| guaranteed|顶级|国家级|全网最低)/g;
var PP_CROWD    = ['学生党','打工人','上班族','新手','小白','宝妈','孕妈','小个子','微胖','黄皮','油皮','干皮','敏感肌','男生','女生','南方人','北方人','手残党','懒人','租房党','考研党','宝妈','中老年人','零基础'];
var PP_EMO_WORDS= ['绝了','哭死','救命','谁懂','真的会','太香','封神','暴哭','爱惨','yyds','闭眼入','后悔','吹爆','上头','绝绝子','破防','离谱','狠狠','拿捏','真香','心态崩','我哭了','给我冲'];
var PP_HOOK     = ['原来','居然','竟然','秘密','真相','技巧','攻略','方法','清单','合集','避坑','踩坑','亲测','实测','复盘','保姆级','手把手','建议收藏','抄作业','宝藏','干货','避坑指南'];
var PP_STOP     = ['的','了','是','在','我','有','和','就','不','人','都','一','一个','上','也','很','到','说','要','去','你','会','着','没有','看','好','自己','这'];

function ppCount(str, re){ var m = String(str||'').match(re); return m ? m.length : 0; }
function ppHitList(str, arr){ return arr.filter(function(w){ return String(str||'').indexOf(w) >= 0; }); }

/* ---------- 标题评分（100 分制，逐项可解释） ---------- */
function scoreTitle(t){
  t = String(t||'').trim();
  var dims = [], score = 0;
  var len = t.length;
  var emojiN = ppCount(t, PP_EMOJI_RE);
  var nums = ppCount(t, PP_NUM_RE);
  var crowd = ppHitList(t, PP_CROWD);
  var emo = ppHitList(t, PP_EMO_WORDS);
  var hook = ppHitList(t, PP_HOOK);
  var abs = (t.match(PP_ABS_RE) || []);

  // 1) 长度 20 分：12-20 字最佳（小红书标题曝光完整、信息量足）
  var lenScore = len >= 12 && len <= 20 ? 20 : (len >= 8 && len < 12 ? 14 : (len > 20 && len <= 26 ? 15 : (len > 0 ? 7 : 0)));
  dims.push({k:'标题长度', s:lenScore, m:20, tip: len===0 ? '还没有标题' : (lenScore===20 ? len+' 字，正好在最佳区间' : len+' 字，建议控制在 12-20 字（信息量足且不被折叠）')});

  // 2) 数字/清单感 15 分
  var numScore = nums > 0 ? 15 : 6;
  dims.push({k:'数字锚点', s:numScore, m:15, tip: nums>0 ? '含数字，读者一眼知道能获得几条信息' : '加个数字（如「3 个」「5 招」）会显著提升点击'});

  // 3) 情绪词 15 分
  var emoScore = emo.length >= 1 ? 15 : (emo.length === 0 && /[!！]/.test(t) ? 9 : 5);
  dims.push({k:'情绪张力', s:emoScore, m:15, tip: emo.length>=1 ? '用了「'+emo.slice(0,2).join('、')+'」，有情绪钩子' : '试试「绝了/谁懂/亲测」这类真实口语，比平铺直叙更容易被点'});

  // 4) 人群指向 15 分
  var crowdScore = crowd.length >= 1 ? 15 : 5;
  dims.push({k:'人群指向', s:crowdScore, m:15, tip: crowd.length>=1 ? '锁定「'+crowd.slice(0,2).join('、')+'」，精准人群更容易爆' : '点名人群（学生党/打工人/黄皮/小个子…），算法更好推、读者更有代入'});

  // 5) 悬念/疑问 10 分
  var qScore = PP_Q_RE.test(t) ? 10 : 4;
  dims.push({k:'悬念钩子', s:qScore, m:10, tip: qScore===10 ? '带疑问或反转，勾起好奇' : '加一点悬念（原来…/居然…/为什么…）能拉开点击差'});

  // 6) 关键词/结构化表达 15 分
  var hookScore = hook.length >= 1 ? 15 : (len >= 6 ? 8 : 3);
  dims.push({k:'关键词结构', s:hookScore, m:15, tip: hook.length>=1 ? '含「'+hook.slice(0,2).join('、')+'」，搜索友好' : '带上「攻略/清单/避坑/实测」这类高频搜索词，长尾流量更好'});

  // 7) 表情符号 10 分：1-3 个最佳
  var emoScore2 = emojiN >= 1 && emojiN <= 3 ? 10 : (emojiN === 0 ? 5 : 4);
  dims.push({k:'表情符号', s:emoScore2, m:10, tip: emojiN>=1&&emojiN<=3 ? emojiN+' 个，恰到好处' : (emojiN===0 ? '标题里加 1-2 个表情，视觉更抓眼' : emojiN+' 个偏多，建议留 1-3 个')});

  // 8) 极限词/违规词：直接扣分
  var absPenalty = abs.length ? Math.min(30, abs.length * 15) : 0;
  if(abs.length) dims.push({k:'极限词风险', s:-absPenalty, m:0, tip:'命中「'+abs.slice(0,3).join('、')+'」，属于广告法高危词，大概率被限流，必须替换'});

  dims.forEach(function(d){ score += d.s; });
  score = Math.max(0, Math.min(100, score));
  return {score:score, dims:dims, len:len, abs:abs};
}

/* ---------- 正文评分（100 分制） ---------- */
function scoreBody(b){
  b = String(b||'');
  var dims = [], score = 0;
  var text = b.replace(/#\S+/g,'').replace(PP_EMOJI_RE,'');
  var chars = text.replace(/\s/g,'').length;
  var paras = b.split(/\n+/).filter(function(x){ return x.trim(); }).length;
  var emojiN = ppCount(b, PP_EMOJI_RE);
  var tags = (b.match(/#[^\s#]+/g) || []);
  var lines = b.split(/\n/).filter(function(x){ return x.trim(); }).length;

  // 1) 字数 20：300-800 最佳
  var lenScore = chars >= 300 && chars <= 800 ? 20 : (chars >= 150 && chars < 300 ? 14 : (chars > 800 && chars <= 1200 ? 15 : (chars > 0 ? 7 : 0)));
  dims.push({k:'正文字数', s:lenScore, m:20, tip: lenScore===20 ? chars+' 字，完读率与信息量平衡' : chars+' 字，建议 300-800 字（太短没干货，太长掉完读）'});

  // 2) 分段结构 15
  var paraScore = paras >= 3 && paras <= 12 ? 15 : (paras >= 2 ? 10 : 4);
  dims.push({k:'分段结构', s:paraScore, m:15, tip: paraScore===15 ? paras+' 段，手机阅读友好' : '多分几段（每段 2-3 行），手机端阅读体验会好很多'});

  // 3) 表情/视觉节奏 10
  var emoScore = emojiN >= 3 && emojiN <= 15 ? 10 : (emojiN > 0 ? 6 : 2);
  dims.push({k:'视觉节奏', s:emoScore, m:10, tip: emoScore===10 ? emojiN+' 个表情，节奏轻快' : (emojiN===0 ? '适当加些表情做分隔，视觉不累' : '表情 '+emojiN+' 个，建议 3-15 个区间')});

  // 4) 话题标签 15：3-8 个最佳
  var tagScore = tags.length >= 3 && tags.length <= 8 ? 15 : (tags.length > 0 ? 8 : 0);
  dims.push({k:'话题标签', s:tagScore, m:15, tip: tagScore===15 ? tags.length+' 个标签，覆盖合理' : (tags.length===0 ? '至少加 3 个话题标签，才有标签流量入口' : tags.length+' 个，建议 3-8 个（大小标签搭配）')});

  // 5) 首行钩子 15：前 30 字要点明价值
  var head = b.trim().slice(0, 40);
  var headScore = /[?？!！]|你|我|这|为什么|原来|居然|亲测|实测|分享|总结|建议/.test(head) && chars > 0 ? 15 : (chars > 0 ? 7 : 0);
  dims.push({k:'开头钩子', s:headScore, m:15, tip: headScore===15 ? '开头有钩子，能留住人' : '第一句就要给结论或抛问题，否则前 3 秒就划走了'});

  // 6) 重复词检测 15：同一个词出现过多，读感差
  var words = text.replace(/[，。！？、,.!?\s]/g,' ').split(/\s+/).filter(function(w){ return w.length >= 2 && PP_STOP.indexOf(w) < 0; });
  var freq = {}; words.forEach(function(w){ freq[w] = (freq[w]||0)+1; });
  var dup = Object.keys(freq).filter(function(w){ return freq[w] >= 5; }).sort(function(a,c){ return freq[c]-freq[a]; });
  var dupScore = dup.length === 0 ? 15 : (dup.length <= 2 ? 9 : 4);
  dims.push({k:'用词丰富度', s:dupScore, m:15, tip: dup.length===0 ? '用词自然，没有明显堆砌' : '「'+dup.slice(0,3).join('、')+'」重复较多，换点说法会更自然'});

  // 7) 互动引导 10
  var ctaScore = /评论|留言|私信|收藏|点赞|关注|告诉我|你们|评论区|一起|聊聊/.test(b) ? 10 : 3;
  dims.push({k:'互动引导', s:ctaScore, m:10, tip: ctaScore===10 ? '结尾有互动引导，利于评论量' : '结尾加一句互动（「你们踩过哪些坑？」）能显著拉评论'});

  // 空正文：所有维度归 0，避免「还没写」因兜底项拿到虚高基础分（26 分那种假象）
  if(chars === 0){
    dims.forEach(function(d){ d.s = 0; d.tip = '还没有正文，先写点内容再看分'; });
    return {score:0, dims:dims, chars:0, paras:0, tags:0, dup:[], empty:true};
  }

  dims.forEach(function(d){ score += d.s; });
  score = Math.max(0, Math.min(100, score));
  return {score:score, dims:dims, chars:chars, paras:paras, tags:tags.length, dup:dup};
}

/* ---------- 综合分：标题 45% + 正文 40% + 违规 15% ---------- */
function ppGrade(s){ return s >= 85 ? {t:'优质', c:'var(--green)'} : s >= 70 ? {t:'良好', c:'var(--blue)'} : s >= 55 ? {t:'及格', c:'var(--orange)'} : {t:'待优化', c:'var(--red)'}; }

function ppRenderScore(boxId, title, body){
  var st = scoreTitle(title), sb = scoreBody(body);
  var sens = sensitiveScanText(title + '\n' + body);
  var severe = sens.hits.filter(function(h){ return h.level === 2; }).length;
  var warn = sens.hits.length - severe;
  var riskScore = severe === 0 ? (warn === 0 ? 100 : 70) : Math.max(0, 60 - severe * 20);
  var total = Math.round(st.score * 0.45 + sb.score * 0.40 + riskScore * 0.15);
  var g = ppGrade(total);
  var box = document.getElementById(boxId);
  if(!box) return;

  var ring = '<div style="text-align:center;flex-shrink:0">' +
    '<div style="width:78px;height:78px;border-radius:50%;background:conic-gradient(' + g.c + ' ' + (total*3.6) + 'deg, var(--line) 0deg);display:flex;align-items:center;justify-content:center">' +
      '<div style="width:62px;height:62px;border-radius:50%;background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center">' +
        '<b style="font-size:22px;color:' + g.c + '">' + total + '</b><span style="font-size:10px;color:var(--text3)">分</span>' +
      '</div></div>' +
    '<div style="font-size:12px;font-weight:700;color:' + g.c + ';margin-top:6px">' + g.t + '</div></div>';

  var dimHtml = function(list, name, sub){
    return '<div style="margin-top:12px"><div style="font-size:12.5px;font-weight:700;margin-bottom:6px">' + name +
      ' <span style="font-weight:400;color:var(--text3);font-size:11px">' + sub + '</span></div>' +
      list.map(function(d){
        var pct = d.m ? Math.max(0, Math.min(100, d.s / d.m * 100)) : 0;
        var col = d.s < 0 ? 'var(--red)' : (pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--orange)' : 'var(--red)');
        return '<div style="padding:7px 0;border-bottom:1px solid var(--line)">' +
          '<div style="display:flex;align-items:center;gap:8px;font-size:12.5px">' +
            '<span style="font-weight:600;flex-shrink:0">' + esc(d.k) + '</span>' +
            '<span style="flex:1;height:5px;background:var(--line);border-radius:3px;overflow:hidden;min-width:40px">' +
              '<span style="display:block;height:100%;width:' + pct + '%;background:' + col + ';border-radius:3px"></span></span>' +
            '<b style="color:' + col + ';flex-shrink:0;font-size:12px">' + (d.s < 0 ? d.s : d.s + '/' + d.m) + '</b>' +
          '</div>' +
          '<div style="font-size:11.5px;color:var(--text3);line-height:1.6;margin-top:3px">' + esc(d.tip) + '</div>' +
        '</div>';
      }).join('') + '</div>';
  };

  var riskHtml = '<div style="margin-top:12px;background:' + (severe ? 'rgba(255,59,48,.08)' : 'var(--bg)') + ';border-radius:10px;padding:12px">' +
    '<div style="font-size:12.5px;font-weight:700;margin-bottom:6px">🛡️ 违规风险 ' +
      (sens.total ? '<span style="color:var(--red)">命中 ' + sens.total + ' 处</span>' : '<span style="color:var(--green)">未命中本地词库</span>') + '</div>' +
    (sens.hits.length ? sens.hits.map(function(h){
      return '<div style="font-size:12px;padding:5px 0;line-height:1.6">' +
        '<span style="color:' + (h.level===2?'var(--red)':'var(--orange)') + ';font-weight:700">[' + (h.level===2?'严重':'提醒') + ']</span> ' +
        esc(h.w) + ' — ' + esc(h.tip) + '</div>';
    }).join('') : '<div style="font-size:12px;color:var(--text3)">本地词库未发现高风险表达，可再跑一次 AI 深度复查更保险。</div>') +
  '</div>';

  box.innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:4px 0">' + ring +
      '<div style="flex:1;min-width:180px;font-size:12px;color:var(--text2);line-height:1.9">' +
        '标题 <b style="color:' + ppGrade(st.score).c + '">' + st.score + '</b> · ' +
        '正文 <b style="color:' + ppGrade(sb.score).c + '">' + sb.score + '</b> · ' +
        '合规 <b style="color:' + ppGrade(riskScore).c + '">' + riskScore + '</b>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:2px">权重：标题 45% · 正文 40% · 合规 15%</div>' +
      '</div>' +
    '</div>' +
    dimHtml(st.dims, '📌 标题诊断', st.len + ' 字') +
    dimHtml(sb.dims, '📝 正文诊断', sb.chars + ' 字 · ' + sb.paras + ' 段 · ' + sb.tags + ' 标签') +
    riskHtml;
  return {total:total, st:st, sb:sb, risk:riskScore, sens:sens};
}

/* ---------- 检查台主入口 ---------- */
function openPreCheckStation(pre){
  pre = pre || {};
  var lib = (Store.data.contents || []).filter(function(c){ return c.body; });
  var opts = lib.slice(0, 30).map(function(c){
    return '<option value="' + esc(c.id) + '">' + esc(c.title) + '</option>';
  }).join('');
  Modal.open('🩺 发布前检查台', '' +
    '<p style="font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:10px">发布前最后一道质检：<b>边写边打分</b>（本地规则秒出，不耗 AI 额度），逐项告诉你为什么扣分、怎么改。</p>' +
    (opts ? '<div class="form-group"><label class="label">从内容库带入（可选）</label><select id="pcPick" onchange="pcLoadFromLib()"><option value="">— 手动粘贴 —</option>' + opts + '</select></div>' : '') +
    '<div class="form-group"><label class="label">标题</label><input id="pcTitle" value="' + esc(pre.title||'') + '" placeholder="输入标题，下面会实时打分" oninput="ppRun()"></div>' +
    '<div class="form-group"><label class="label">正文（含话题标签）</label><textarea id="pcBody" placeholder="粘贴正文…" style="min-height:130px" oninput="ppRun()">' + esc(pre.body||'') + '</textarea></div>' +
    '<div id="pcOut"></div>' +
    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
      '<button class="btn btn-red btn-sm" style="flex:1;min-width:140px" onclick="ppAiRewrite()">✨ AI 一键优化到 85+</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="ppCopyReport()">📋 复制诊断报告</button>' +
    '</div>');
  setTimeout(ppRun, 60);
}
function pcLoadFromLib(){
  var id = (document.getElementById('pcPick')||{}).value;
  if(!id) return;
  var c = (Store.data.contents||[]).find(function(x){ return x.id === id; });
  if(!c) return;
  var ti = document.getElementById('pcTitle'), bd = document.getElementById('pcBody');
  if(ti) ti.value = c.title || '';
  if(bd) bd.value = c.body || '';
  ppRun();
}
var ppLast = null;
function ppRun(){
  var t = (document.getElementById('pcTitle')||{}).value || '';
  var b = (document.getElementById('pcBody')||{}).value || '';
  ppLast = ppRenderScore('pcOut', t, b);
}
function ppCopyReport(){
  if(!ppLast){ Toast('还没有诊断结果'); return; }
  var t = (document.getElementById('pcTitle')||{}).value || '';
  var L = ppLast, lines = [];
  lines.push('【发布前检查台诊断报告】总分 ' + L.total + '（' + ppGrade(L.total).t + '）');
  lines.push('标题 ' + L.st.score + ' · 正文 ' + L.sb.score + ' · 合规 ' + L.risk);
  lines.push('');
  lines.push('— 标题 —');
  L.st.dims.forEach(function(d){ lines.push('· ' + d.k + '：' + d.s + (d.m ? '/' + d.m : '') + ' → ' + d.tip); });
  lines.push('');
  lines.push('— 正文 —');
  L.sb.dims.forEach(function(d){ lines.push('· ' + d.k + '：' + d.s + (d.m ? '/' + d.m : '') + ' → ' + d.tip); });
  if(L.sens.hits.length){
    lines.push('');
    lines.push('— 违规风险 —');
    L.sens.hits.forEach(function(h){ lines.push('· [' + (h.level===2?'严重':'提醒') + '] ' + h.w + '：' + h.tip); });
  }
  copyText(null, lines.join('\n'));
  Toast('诊断报告已复制 ✅');
}
async function ppAiRewrite(){
  if(typeof proGuard === 'function' && !proGuard('AI 优化')) return;
  var t = (document.getElementById('pcTitle')||{}).value || '';
  var b = (document.getElementById('pcBody')||{}).value || '';
  if(!t && !b){ Toast('先写点内容'); return; }
  var box = document.getElementById('pcOut');
  var weak = [];
  if(ppLast){
    ppLast.st.dims.forEach(function(d){ if(d.m && d.s / d.m < 0.6) weak.push('标题-' + d.k + '：' + d.tip); });
    ppLast.sb.dims.forEach(function(d){ if(d.m && d.s / d.m < 0.6) weak.push('正文-' + d.k + '：' + d.tip); });
    ppLast.sens.hits.forEach(function(h){ weak.push('违规-' + h.w + '：' + h.tip); });
  }
  box.innerHTML = '<div class="loading">AI 正在针对薄弱项改写…（约 20-35 秒）</div>';
  var prompt = '你是小红书内容优化专家。下面是我的笔记和它当前的自检结果，请针对薄弱项改写，目标是把综合分提到 85 分以上。\n\n' +
    '【当前标题】\n' + t + '\n\n【当前正文】\n' + String(b).slice(0, 3000) + '\n\n' +
    (weak.length ? '【自检薄弱项，必须逐条解决】\n' + weak.map(function(w,i){ return (i+1) + '. ' + w; }).join('\n') + '\n\n' : '') +
    '输出格式（严格）：\n【优化后标题】只给 1 个（12-20 字，含数字/人群/情绪，不要极限词）\n【优化后正文】完整一篇（300-800 字，分段清晰，结尾带互动引导，3-8 个话题标签）\n【改了什么】逐条说明针对薄弱项做了什么改动（3-6 条）\n\n要求：保留原意与商品/事实信息，语气真人化，不要 AI 腔。';
  var r = await proAiAsk(prompt, '你是小红书爆款内容优化专家，精通平台推荐机制与广告法合规。');
  if(!r.ok){ box.innerHTML = '<div style="color:var(--red);font-size:13px">' + esc(r.msg||'生成失败') + '</div>'; setTimeout(ppRun, 100); return; }
  window.__ppAiText = r.text;
  box.innerHTML = '<div style="background:var(--bg);border-radius:10px;padding:14px;font-size:12.5px;line-height:1.85;white-space:pre-wrap;max-height:330px;overflow-y:auto">' + esc(r.text) + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<button class="btn btn-red btn-sm" style="flex:1;min-width:120px" onclick="ppApplyAi()">✅ 用这版（回填并重新打分）</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="copyText(null, window.__ppAiText)">📋 复制</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="ppRun()">↩︎ 回到打分</button>' +
    '</div>';
}
function ppApplyAi(){
  var txt = window.__ppAiText || '';
  var mT = txt.match(/【优化后标题】\s*\n?([\s\S]*?)(?=\n【优化后正文】|$)/);
  var mB = txt.match(/【优化后正文】\s*\n?([\s\S]*?)(?=\n【改了什么】|$)/);
  var ti = document.getElementById('pcTitle'), bd = document.getElementById('pcBody');
  if(mT && ti) ti.value = mT[1].trim().split('\n')[0].replace(/^["'「」]|[」"']$/g,'');
  if(mB && bd) bd.value = mB[1].trim();
  Toast('已回填，重新打分中…');
  ppRun();
}

/* ============================================================
 *  V6.38 博主批量风格分析器 + 融合改写（对标别人家产品亮点）
 *  ------------------------------------------------------------
 *  7 维风格雷达 + 真实 AI 调用 + 本地启发式降级（无 Key 也能跑）
 *  风格融合比例滑块 + 原创性风险评估
 *  一键生成同风格选题（自动入选题池） + 融合改写草稿
 *  报告保存到对标账号库，可复访
 * ============================================================ */
const BS_RADAR = ['人设定位','语气风格','选题角度','结构套路','视觉调性','互动话术','更新节奏'];
/* V6.49 赛道库：覆盖小红书全部主流类目（含「通用」兜底），客户反馈"每次都是美妆/穿搭"是默认 fallback 的 bug */
const BS_INDUSTRY_TIPS = {
  '美妆':['真实上脸对比','平价 vs 大牌','成分党','油皮干皮细分','妆容 step by step','早八通勤妆'],
  '穿搭':['小个子显高','显瘦公式','基础款搭配','场景化通勤','色系协调','一衣多穿'],
  '美食':['10 分钟快手','一个人食','减脂餐','锅具种草','冰箱整理','低脂零食','小吃摊测评'],
  '数码':['千元机横评','参数党对比','生产力工具','游戏性能','学生党首选','护眼屏幕'],
  '母婴':['新手妈妈避坑','辅食指南','好物红黑榜','绘本共读','育儿焦虑','孕期囤货'],
  '家居':['出租屋改造','收纳断舍离','好物种草','清洁妙招','氛围感','小家电'],
  '旅行':['穷游攻略','小众目的地','拍照机位','一人旅','vlog 行程','周末出城'],
  '健身':['新手 30 天','居家徒手','减脂饮食','增肌食谱','体态矫正','跑步训练'],
  '职场':['简历优化','面试话术','副业搞钱','摸鱼技巧','PPT 模板','向上管理'],
  '学习':['考研规划','英语自学','笔记方法','时间管理','论文写作','考试冲刺'],
  '情感':['自我成长','两性沟通','断舍离','独居生活','情绪管理','社恐自救'],
  '宠物':['新手养猫','省钱养狗','猫饭 DIY','宠物医院','训练技巧','猫咪好物'],
  '健康':['养生食谱','体检解读','久坐拉伸','女性护理','颈椎自救','心理疗愈'],
  '三农':['农村生活','特色农产品','养殖分享','种植记录','乡土美食','家乡风景'],
  '摄影':['拍照姿势','手机摄影','构图技巧','滤镜调色','vlog 拍摄','旅拍机位'],
  '教育':['家长课堂','幼教启蒙','考研规划','教师日常','留学申请','考证经验'],
  '汽车':['新车测评','二手车避坑','自驾路线','自驾装备','新能源','通勤省油'],
  '二次元':['cos 摄影','手办测评','动漫推荐','游戏同人','角色扮演','声优周边'],
  '创业':['副业启动','开店日记','加盟避坑','商业思维','一人公司','个体 IP'],
  'AI工具':['AI 工具测评','prompt 实战','AI 副业','AI 提效','AI 变现','AI 教程'],
  '个人IP':['定位打造','人设故事','内容规划','私域沉淀','品牌打造','个人成长'],
  '通用':['避坑指南','好物推荐','新手入门','个人体验','对比测评','实用干货']
};
function bsDetectIndustry(name, link){
  const s = String(name||'').trim() + ' ' + String(link||'');
  if(!s.trim()) return '通用';
  // V6.49 优先顺序：精确关键词 → 模糊匹配 → 通用兜底（不再误判为穿搭/美妆）
  const kws = [
    ['美妆', /美妆|彩妆|化妆|护肤|底妆|口红|眼影|腮红|美甲|香水|乳液|面霜|粉底|妆容|美人|美女|颜值|beauty|makeup|skincare|cosmetics/i],
    ['穿搭', /穿搭|搭配|日常穿|街拍|outfit|look|时装|搭配师|衣服|裤子|裙子/i],
    ['美食', /美食|菜谱|烘焙|甜品|早餐|晚餐|午餐|夜宵|吃货|食谱|下厨|炒菜|煮|炸|烤|火锅|奶茶|探店|小吃|调料|酱|川菜|湘菜|卤味|面条|food|recipe|cooking|coffee|foodie|burger|chicken|steak|recipe|food|brunch/i],
    ['数码', /数码|笔记本|手机|平板|耳机|键鼠|显示器|电脑|科技|开箱|参数|tech|gadget|hardware|chip|gpu/i],
    ['母婴', /母婴|宝妈|奶爸|辅食|宝宝|育儿|孩子|奶粉|纸尿裤|婴儿|baby/i],
    ['家居', /家居|家装|装修|收纳|整理|厨房|客厅|卧室|出租屋|极简/i],
    ['旅行', /旅行|旅游|徒步|自驾|攻略|景点|民宿|酒店|vlog|环游|travel/i],
    ['健身', /健身|跑步|撸铁|瑜伽|减肥|塑形|减脂|塑型|身材|运动|fitness|gym/i],
    ['职场', /职场|工作|简历|面试|上班|求职|跳槽|副业|简历优化|career|interview/i],
    ['学习', /考研|考公|考编|考试|考证|学习|笔记|读书|study/i],
    ['情感', /情感|恋爱|两性|前任|分手|相亲|脱单|独居|社恐|情绪|心理/i],
    ['宠物', /宠物|猫|狗|猫饭|宠物医院|养猫|养狗|猫咪|汪|puppy|kitten/i],
    ['健康', /健康|养生|体检|亚健康|颈椎|腰椎|心理疗愈|睡眠|颈椎/i],
    ['三农', /三农|农村|种植|养殖|农产品|新农人|果农|菜农|乡土/i],
    ['摄影', /摄影|拍照|相机|镜头|胶片|后期|构图|光圈|快门/i],
    ['教育', /家教|幼教|启蒙|教师|留学|雅思|托福|教师资格证/i],
    ['汽车', /汽车|车|新车|二手车|自驾|新能源|蔚来|理想|比亚迪|小米汽车/i],
    ['二次元', /二次元|动漫|cos|cosp|手办|周边|二次元|番剧/i],
    ['创业', /创业|开店|加盟|商业|个体工商|一人公司|副业启动|餐饮加盟/i],
    ['AI工具', /ai工具|AI副业|prompt|gpt|chatgpt|claude|deepseek|ai教程|ai变现/i],
    ['个人IP', /个人ip|人设|打造|定位|品牌|ip打造/i],
    ['通用', /博主|分享|经验|干货|教程|日记|日常|记录|生活|vlog|plog|测评|推荐/i]
  ];
  for(const [k, r] of kws){
    if(r.test(s)) return k;
  }
  return '通用'; // 无法识别 → 不强行套美妆/穿搭
}
function bsParseLink(link){
  if(!link) return null;
  const m1 = String(link).match(/user\/profile\/([a-zA-Z0-9_-]+)/);
  if(m1) return {uid:m1[1], type:'user'};
  const m2 = String(link).match(/xhslink\.com\/[a-zA-Z0-9]+\/?(\S+)?/);
  if(m2) return {uid:(m2[1]||'').slice(0,16)||'short', type:'short'};
  return null;
}
function bsLocalRadar(industry){
  const base = {'人设定位':7,'语气风格':7,'选题角度':7,'结构套路':7,'视觉调性':7,'互动话术':7,'更新节奏':7};
  const t = BS_INDUSTRY_TIPS[industry] || BS_INDUSTRY_TIPS['穿搭'];
  return {
    radar: base,
    desc: '本地启发式分析（未调用 AI），疑似【' + industry + '】赛道。建议接入 AI Key 后做更精细的拆解。',
    sampleQuotes: [
      t[0] + '？这样选不踩雷',
      '用了 3 年的【' + industry + '】小心得',
      '姐妹们！这个真的可以冲'
    ],
    hookPatterns: ['痛点提问', '结果前置', '人群聚焦', '对比反差'],
    structureTemplate: '痛点开场 → 个人经验 → 步骤清单 → 避坑提示 → 互动提问',
    visualFeatures: '封面以大字标题+产品/场景特写为主，配色明亮；正文分段清晰，多用 emoji 与列表'
  };
}
async function bsAnalyze(link, name){
  const industry = bsDetectIndustry(name, link);
  const linkInfo = bsParseLink(link);
  const inputTxt = (link ? '链接：' + link + '\n' : '') + (name ? '昵称/主页名：' + name + '\n' : '') +
    '请基于以上信息（如客户只给了昵称/品类，用该赛道通用画像做合理推断）';
  const sys = '你是小红书博主风格研究专家，擅长从公开资料（昵称/链接/品类/笔记内容）拆解博主的内容风格。输出必须是结构化分析，让用户能据此模仿/融合。';
  const prompt = '请分析以下博主的风格，输出严格的 JSON（不要任何解释文字，只输出 JSON）：\n\n' +
    inputTxt + '\n\n' +
    '{\n' +
    '  "name": "推断的博主昵称（没有就给 \'未知博主\'）",\n' +
    '  "industry": "' + industry + '",\n' +
    '  "radar": {"人设定位":0-10,"语气风格":0-10,"选题角度":0-10,"结构套路":0-10,"视觉调性":0-10,"互动话术":0-10,"更新节奏":0-10},\n' +
    '  "personaDesc": "一句话人设定位（10-25 字）",\n' +
    '  "toneDesc": "语气风格描述（10-25 字）",\n' +
    '  "sampleQuotes": ["3-5 个示例标题/钩子句"],\n' +
    '  "hookPatterns": ["3-4 个常用开场钩子类型"],\n' +
    '  "topicAngles": ["3-5 个常做的选题角度"],\n' +
    '  "structureTemplate": "一句话笔记结构模板",\n' +
    '  "visualFeatures": "一句话视觉特征",\n' +
    '  "interactionStyle": "一句话互动风格",\n' +
    '  "updateRhythm": "一句话更新节奏"\n' +
    '}\n\n' +
    '注意：7 维雷达的字段名必须严格用：人设定位、语气风格、选题角度、结构套路、视觉调性、互动话术、更新节奏；分值要有区分度，不要都打 7-8。';
  const out = {link: link || '', name: name || '未知博主', industry, createdAt: new Date().toISOString(), status:'done'};
  const ai = await proAiAsk(prompt, sys);
  if(ai && ai.ok && ai.text){
    try{
      let txt = ai.text;
      const m = txt.match(/\{[\s\S]*\}/);
      if(m) txt = m[0];
      const j = JSON.parse(txt);
      out.name = j.name || out.name;
      out.industry = j.industry || industry;
      out.radar = j.radar || bsLocalRadar(industry).radar;
      out.personaDesc = j.personaDesc || '';
      out.toneDesc = j.toneDesc || '';
      out.sampleQuotes = j.sampleQuotes || [];
      out.hookPatterns = j.hookPatterns || [];
      out.topicAngles = j.topicAngles || [];
      out.structureTemplate = j.structureTemplate || '';
      out.visualFeatures = j.visualFeatures || '';
      out.interactionStyle = j.interactionStyle || '';
      out.updateRhythm = j.updateRhythm || '';
      out.aiSource = 'deepseek';
    }catch(e){
      Object.assign(out, bsLocalRadar(industry));
      out.aiSource = 'local_fallback';
    }
  }else{
    Object.assign(out, bsLocalRadar(industry));
    out.aiSource = 'local_fallback';
  }
  return out;
}
function bsRadarSVG(radar, size){
  const W = size || 240, cx = W/2, cy = W/2, R = (W/2) - 28;
  const dims = BS_RADAR;
  const n = dims.length;
  const max = 10;
  let grid = '';
  for(let i=1;i<=4;i++){
    const r = R * i/4;
    const pts = [];
    for(let j=0;j<n;j++){
      const a = -Math.PI/2 + 2*Math.PI*j/n;
      pts.push((cx + r*Math.cos(a)).toFixed(1) + ',' + (cy + r*Math.sin(a)).toFixed(1));
    }
    grid += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>';
  }
  let axis = '';
  for(let j=0;j<n;j++){
    const a = -Math.PI/2 + 2*Math.PI*j/n;
    axis += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + R*Math.cos(a)).toFixed(1) + '" y2="' + (cy + R*Math.sin(a)).toFixed(1) + '" stroke="rgba(255,255,255,.08)" stroke-width="1"/>';
  }
  const dataPts = [];
  const labels = [];
  for(let j=0;j<n;j++){
    const v = Math.max(0, Math.min(max, (radar && radar[dims[j]]!=null) ? Number(radar[dims[j]]) : 5));
    const r = R * v / max;
    const a = -Math.PI/2 + 2*Math.PI*j/n;
    dataPts.push((cx + r*Math.cos(a)).toFixed(1) + ',' + (cy + r*Math.sin(a)).toFixed(1));
    const la = R + 18;
    labels.push('<text x="' + (cx + la*Math.cos(a)).toFixed(1) + '" y="' + (cy + la*Math.sin(a)).toFixed(1) + '" fill="rgba(255,255,255,.7)" font-size="10" text-anchor="middle" dominant-baseline="middle">' + dims[j] + '</text>');
  }
  const poly = '<polygon points="' + dataPts.join(' ') + '" fill="rgba(var(--redRGB),.32)" stroke="var(--red)" stroke-width="2"/>';
  return '<svg viewBox="0 0 ' + W + ' ' + W + '" width="' + W + '" height="' + W + '" style="display:block;margin:0 auto">' + grid + axis + poly + labels.join('') + '</svg>';
}
function openBloggerStyle(){
  const existCount = (Store.data.benchmarks||[]).filter(function(b){ return b.styleRadar; }).length;
  Modal.open('🎭 博主批量风格分析 + 融合改写', `
    <div style="font-size:12.5px;color:var(--text2);line-height:1.8;margin-bottom:14px">
      粘小红书博主主页链接（公开的即可），AI 会拆解 <b>7 维风格</b> 并支持 <b>风格融合改写</b>。已分析 <b>${existCount}</b> 位。
    </div>
    <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:10px">
      <div style="font-size:12.5px;font-weight:700;margin-bottom:8px">① 导入博主公开主页</div>
      <input id="bsLink" placeholder="小红书主页链接（如 https://www.xiaohongshu.com/user/profile/xxx）" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#0f0f12;color:#fff;font-size:13px;box-sizing:border-box;margin-bottom:8px">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <span style="font-size:12px;color:var(--text3);white-space:nowrap">或填昵称：</span>
        <input id="bsName" placeholder="博主昵称（如：小鹿的穿搭日记）" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#0f0f12;color:#fff;font-size:12.5px">
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-red btn-sm" style="flex:1" onclick="runBloggerStyle()">🧬 AI 拆解风格</button>
        <button class="btn btn-ghost btn-sm" onclick="openBsHistory()">📚 已分析（${existCount}）</button>
      </div>
    </div>
    <!-- V6.49 赛道选择（识别可能不准，可改）：切换赛道实时重算 7 维雷达 -->
    <div id="bsIndustryPicker" style="display:none;background:var(--bg);border-radius:12px;padding:14px;margin-bottom:10px">
      <div style="font-size:12.5px;font-weight:700;margin-bottom:8px">② 确认/选择赛道 <span style="font-size:11px;color:var(--text3);font-weight:500;margin-left:6px">（AI 识别可能不准，请选真实赛道，本地雷达将重算）</span></div>
      <select id="bsIndustrySel" onchange="bsRerenderIndustry()" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#0f0f12;color:#fff;font-size:13px">
        ${Object.keys(BS_INDUSTRY_TIPS).map(function(k){ return '<option value="'+k+'">'+k+'</option>'; }).join('')}
      </select>
    </div>
    <div id="bsOut"></div>`);
}
function bsRerenderIndustry(){
  const sel = $('#bsIndustrySel');
  const last = window.__bsLast;
  if(!sel || !last){ return; }
  const t = sel.value;
  last.industry = t;
  last.radar = bsLocalRadar(t).radar;
  // 同步保存到对标账号
  const list = Store.data.benchmarks || [];
  const i = list.findIndex(function(x){ return x.id === last.id; });
  if(i>=0){ list[i].industry = t; list[i].radar = last.radar; Store.save(); }
  Toast('已按「'+t+'」赛道重算 7 维雷达 ✅');
  renderBsReport(last);
}
async function runBloggerStyle(){
  const link = ($('#bsLink').value || '').trim();
  const name = ($('#bsName').value || '').trim();
  if(!link && !name){ Toast('请至少填链接或昵称'); return; }
  const out = $('#bsOut');
  const sb = aiStreamBox(out, '生成变现方案');
  const r = await bsAnalyze(link, name);
  const id = uid();
  const rec = {
    id, name:r.name||name||'未知博主', avatar:'🧑',
    fans:0, notes:0, interaction:0,
    link:link||'', linkKey:link||name, watch:true, parsedId:id,
    styleRadar:r.radar, personaDesc:r.personaDesc, toneDesc:r.toneDesc,
    sampleQuotes:r.sampleQuotes||[], hookPatterns:r.hookPatterns||[],
    topicAngles:r.topicAngles||[], structureTemplate:r.structureTemplate,
    visualFeatures:r.visualFeatures, interactionStyle:r.interactionStyle,
    updateRhythm:r.updateRhythm, industry:r.industry,
    aiSource:r.aiSource, createdAt:r.createdAt
  };
  Store.data.benchmarks = Store.data.benchmarks || [];
  const k = (link||name||'').toLowerCase();
  const exist = Store.data.benchmarks.findIndex(function(b){ return ((b.link||'')+(b.name||'')).toLowerCase() === k; });
  if(exist>=0){ Store.data.benchmarks[exist] = Object.assign({}, Store.data.benchmarks[exist], rec); }
  else{ Store.data.benchmarks.unshift(rec); }
  Store.save();
  renderBsReport(rec);
  // V6.49 分析完成后展示赛道选择器，让客户能改赛道（之前默认穿搭是劝退点）
  const picker = $('#bsIndustryPicker');
  const sel = $('#bsIndustrySel');
  if(picker && sel){
    picker.style.display = 'block';
    sel.value = rec.industry || '通用';
  }
}
function renderBsReport(rec){
  const out = $('#bsOut');
  const r = rec.styleRadar || {};
  const tags = (rec.hookPatterns||[]).concat(rec.topicAngles||[]).slice(0,8);
  out.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-top:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;flex-wrap:wrap">
        <div>
          <div style="font-size:18px;font-weight:900;letter-spacing:-.3px">${esc(rec.name)}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span style="background:rgba(var(--redRGB),.14);color:var(--brand);padding:2px 8px;border-radius:6px;font-weight:700">${esc(rec.industry||'通用')}</span>
            <span>${rec.aiSource==='deepseek'?'🤖 AI 拆解':'🛟 本地启发式（无 AI Key 降级）'}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openBsHistory()">📚 历史</button>
      </div>
      <div style="display:grid;grid-template-columns:240px 1fr;gap:18px;align-items:start;margin-top:10px">
        <div>${bsRadarSVG(r, 240)}</div>
        <div>
          <div style="margin-bottom:8px"><b style="color:var(--brand)">人设</b> · ${esc(rec.personaDesc||'-')}</div>
          <div style="margin-bottom:8px"><b style="color:var(--brand)">语气</b> · ${esc(rec.toneDesc||'-')}</div>
          <div style="margin-bottom:8px"><b style="color:var(--brand)">结构</b> · ${esc(rec.structureTemplate||'-')}</div>
          <div style="margin-bottom:8px"><b style="color:var(--brand)">视觉</b> · ${esc(rec.visualFeatures||'-')}</div>
          <div style="margin-bottom:8px"><b style="color:var(--brand)">互动</b> · ${esc(rec.interactionStyle||'-')}</div>
          <div style="margin-bottom:8px"><b style="color:var(--brand)">节奏</b> · ${esc(rec.updateRhythm||'-')}</div>
          ${tags.length?'<div style="margin-top:6px">' + tags.map(function(t){ return '<span style="display:inline-block;font-size:11.5px;padding:3px 9px;background:rgba(255,255,255,.06);border-radius:99px;margin:2px;color:var(--text2)">'+esc(t)+'</span>'; }).join('') + '</div>':''}
        </div>
      </div>
    </div>
    <div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-top:10px">
      <div style="font-size:14px;font-weight:800;margin-bottom:10px">② 风格融合器</div>
      <p style="font-size:12.5px;color:var(--text2);line-height:1.8;margin-bottom:10px">拖动滑块调整参考强度。比例越高，融合的该博主特征越多（同时原创风险上升）。</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:10px">
        <div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:4px">参考该博主风格比例</div>
          <input type="range" id="bsRatio" min="0" max="100" value="30" style="width:100%" oninput="bsUpdateRatio()">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3)"><span>纯自己</span><span><b id="bsRatioV">30%</b></span><span>高度参考</span></div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:4px">原创性风险</div>
          <div id="bsRisk" style="font-size:14px;font-weight:800;color:#4ade80">低</div>
          <div id="bsRiskTip" style="font-size:11.5px;color:var(--text3);margin-top:2px;line-height:1.55">参考 ≤ 40% 风险低，建议手动改 3-5 处细节</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
        <button class="btn btn-red btn-sm" style="flex:1;min-width:180px" onclick="bsGenTopics()">✨ 生成同风格原创选题 ×5</button>
        <button class="btn btn-ghost btn-sm" style="flex:1;min-width:180px" onclick="bsFusionRewrite()">🪄 融合改写我的草稿</button>
      </div>
      <div id="bsOut2" style="margin-top:14px"></div>
    </div>`;
  bsUpdateRatio();
  window.__bsLast = rec;
}
function bsUpdateRatio(){
  const v = parseInt(($('#bsRatio')&&$('#bsRatio').value)||30,10);
  if($('#bsRatioV')) $('#bsRatioV').textContent = v + '%';
  let risk='低', color='#4ade80', tip='参考 ≤ 40% 风险低，建议手动改 3-5 处细节';
  if(v>40 && v<=70){ risk='中低'; color='#a3e635'; tip='参考略高，AI 会主动插入差异化元素'; }
  else if(v>70 && v<=85){ risk='中'; color='#fbbf24'; tip='参考较高，建议加入 3-5 处自己真实经验'; }
  else if(v>85){ risk='高'; color='#ff6b6b'; tip='⚠️ 风险过高，AI 生成结果将主动插入差异化，建议手动再改'; }
  const r = $('#bsRisk'), t = $('#bsRiskTip');
  if(r){ r.textContent=risk; r.style.color=color; }
  if(t) t.textContent = tip;
}
async function bsGenTopics(){
  const rec = window.__bsLast;
  if(!rec){ Toast('请先分析一个博主'); return; }
  const ratio = parseInt(($('#bsRatio')&&$('#bsRatio').value)||30,10);
  const out = $('#bsOut2');
  out.innerHTML = '<div class="loading">✨ AI 按 <b>'+ratio+'%</b> 比例生成 5 条原创选题…</div>';
  const p = '基于以下博主风格 + 我的账号定位，生成 5 条小红书原创选题，要求：\n' +
    '1. 选题角度参考该博主但不抄袭，必须能直接落地写\n' +
    '2. 每条给「标题」「选题理由」「建议类型（图文/视频）」「参考风格比例 '+ratio+'%」\n' +
    '3. 严格 JSON 输出\n\n' +
    '【该博主风格】\n' +
    '人设：'+(rec.personaDesc||'-')+'\n' +
    '语气：'+(rec.toneDesc||'-')+'\n' +
    '结构：'+(rec.structureTemplate||'-')+'\n' +
    '常用角度：'+((rec.topicAngles||[]).join('、')||'-')+'\n' +
    '示例标题：'+((rec.sampleQuotes||[]).slice(0,3).join(' | ')||'-')+'\n\n' +
    '【我的账号】\n' + bsGetMyPersona() + '\n\n' +
    '输出格式（必须是 JSON 数组）：\n[\n  {"title":"...","reason":"...","type":"图文/视频","ratio":"'+ratio+'%"},\n  ...\n]';
  const r = await proAiAsk(p, '你是小红书爆款选题专家，输出必须是严格 JSON 数组。');
  let items = [];
  let usedFallback = false;
  if(r.ok && r.text){
    try{
      const m = r.text.match(/\[[\s\S]*\]/);
      if(m) items = JSON.parse(m[0]);
      else throw new Error('no json');
    }catch(e){
      items = bsFallbackTopics(rec, ratio);
      usedFallback = true;
    }
  } else {
    items = bsFallbackTopics(rec, ratio);
    usedFallback = true;
  }
  if(usedFallback){
    Toast('AI 不可用，已用本地启发式生成（接入 Key 后效果更好）');
  }
  renderBsTopics(items, rec);
  try{
    Store.data.topicPool = Store.data.topicPool || [];
    items.forEach(function(it){
      Store.data.topicPool.unshift({
        id:uid(), cat:rec.industry||'通用',
        title:it.title, heat: 60 + Math.floor(Math.random()*30),
        search: 0, competition: 30, rising: true
      });
    });
    Store.save();
    Toast('已同步到选题池 ✓');
  }catch(e){}
}
function bsFallbackTopics(rec, ratio){
  const ind = rec.industry || '通用';
  const tips = BS_INDUSTRY_TIPS[ind] || BS_INDUSTRY_TIPS['穿搭'];
  return [0,1,2,3,4].map(function(i){
    return {title: tips[i % tips.length] + '？这 3 个技巧我用了 3 年', reason:'参考 ' + (rec.name||'该博主') + ' 的「'+ (rec.personaDesc||'风格') +'」选题角度，落地到 '+ind+' 赛道', type: i%2===0?'图文':'视频', ratio: ratio+'%'};
  });
}
function bsGetMyPersona(){
  try{
    const id = localStorage.getItem('xhs_persona_id') || '';
    if(!id) return '（未设置账号人设，默认自然口吻）';
    const p = (typeof getPersonas==='function' ? getPersonas() : []).find(function(x){ return x.id===id; });
    if(!p) return '（未设置账号人设）';
    return '昵称：'+p.name+'\n语气：'+(p.tone||'-')+'\n补充：'+(p.desc||'-');
  }catch(e){ return ''; }
}
function renderBsTopics(items, rec){
  const out = $('#bsOut2');
  if(!items || !items.length){ out.innerHTML = '<div style="color:var(--text3);font-size:12.5px">生成失败，可重试</div>'; return; }
  out.innerHTML = '<div style="font-size:13px;font-weight:800;margin-bottom:8px">✨ '+items.length+' 条选题（已自动入选题池）</div>' +
    items.map(function(it,i){
      return '<div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:13px;font-weight:800">'+esc(it.title)+'</div>' +
          '<div style="font-size:11.5px;color:var(--text3);margin-top:3px;line-height:1.65">'+esc(it.reason||'')+' · '+esc(it.type||'图文')+' · '+esc(it.ratio||'')+'</div>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" onclick="bsUseTopic('+i+')">去用</button>' +
      '</div>';
    }).join('') + '<div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="bsGenTopics()">🔄 换一批</button><button class="btn btn-ghost btn-sm" onclick="bsFusionRewrite()">🪄 直接融合改写我的草稿</button></div>';
  window.__bsTopics = items;
}
function bsUseTopic(idx){
  const it = (window.__bsTopics||[])[parseInt(idx,10)];
  if(!it) return;
  Modal.close();
  setTimeout(function(){
    try{ navigate('create'); }catch(e){}
    setTimeout(function(){
      try{
        // V6.46 修复断链：此前错找 #drInput（爆款拆解弹窗内）→ 永远为空。
        // 正确链路：跳到「🚀 一键全流程」并把选题标题带进去，点一键生成即可。
        if(typeof openAiFullFlow === 'function') openAiFullFlow();
        const ta = document.getElementById('ffKw');
        if(ta){ ta.value = it.title; }
      }catch(e){}
      Toast('选题已带到「一键全流程」，点 🚀 一键生成即可');
    }, 350);
  }, 200);
}
async function bsFusionRewrite(){
  const rec = window.__bsLast;
  if(!rec){ Toast('请先分析一个博主'); return; }
  const contents = (Store.data.contents||[]).filter(function(c){ return c.body || c.title; });
  let picked = null;
  if(!contents.length){
    // 没草稿，让用户直接输入
    const input = prompt('请输入要改写的笔记标题和正文（用 --- 分隔）：', '原标题：\n\n正文：');
    if(input && input.trim()){
      picked = {id:null, title:input.split('---')[0]||'未命名草稿', body:input.split('---')[1]||input};
    } else { return; }
  } else if(contents.length === 1){
    picked = contents[0];
  } else {
    const choice = prompt('选择要融合改写的笔记序号：\n\n' + contents.slice(0,30).map(function(c,i){ return (i+1)+'. '+((c.title||'(无标题)').slice(0,40)); }).join('\n'), '1');
    const n = parseInt(choice,10) - 1;
    if(isNaN(n) || n<0 || n>=contents.length){ return; }
    picked = contents[n];
  }
  if(!picked){ return; }
  const ratio = parseInt(($('#bsRatio')&&$('#bsRatio').value)||30,10);
  const out = $('#bsOut2');
  // V6.52 修复：sb 未定义导致「融合改写」一点就 JS 报错（V6.51 重构遗留），改为标准流式盒子
  const sb = aiStreamBox(out, '融合改写');
  const p = '把下面这篇小红书笔记按 【'+ratio+'% 参考 '+esc(rec.name)+' + '+(100-ratio)+'% 保持原意】 的比例重写。\n\n' +
    '【目标博主风格】\n' +
    '人设：'+esc(rec.personaDesc||'-')+'\n' +
    '语气：'+esc(rec.toneDesc||'-')+'\n' +
    '结构：'+esc(rec.structureTemplate||'-')+'\n' +
    '示例标题：'+((rec.sampleQuotes||[]).slice(0,3).join(' | ')||'-')+'\n\n' +
    '【我的账号人设】\n'+bsGetMyPersona()+'\n\n' +
    '【原笔记标题】\n'+(picked.title||'')+'\n\n【原笔记正文】\n'+((picked.body||'').slice(0,2500))+'\n\n' +
    '输出：\n【融合后标题】（1-2 个备选，12-20 字）\n【融合后正文】（完整重写，450-700 字，分段清晰，3-8 个话题标签）\n【差异点】（3-5 条说明你具体改了什么）';
  const r = await proAiAsk(p, '你是小红书爆款改写专家，融合风格 + 保持原意。', sb.update);
  sb.done();
  if(!r.ok){ sb.fail(r.msg); return; }
  const mT = r.text.match(/【融合后标题】\s*([\s\S]*?)(?=【|$)/);
  const mB = r.text.match(/【融合后正文】\s*([\s\S]*?)(?=【|$)/);
  const newTitle = mT ? (mT[1]||'').split('\n')[0].replace(/^[「"']/,'').replace(/[」"']$/,'').trim() : '';
  out.innerHTML = '<div style="background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px;margin-top:8px">' +
    '<div style="font-size:13px;font-weight:800;margin-bottom:8px">🪄 融合改写结果</div>' +
    (newTitle?'<div style="margin-bottom:8px"><b style="color:var(--brand)">新标题：</b>'+esc(newTitle)+'</div>':'') +
    '<div style="white-space:pre-wrap;background:#0f0f12;border:1px solid var(--line);border-radius:10px;padding:12px;font-size:12.5px;line-height:1.85;max-height:280px;overflow-y:auto">'+esc((mB?mB[1]:r.text).trim())+'</div>' +
    (picked.id ? '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-red btn-sm" onclick="bsSaveFusion(\''+picked.id+'\',\''+esc(newTitle).replace(/'/g,'').slice(0,80)+'\')">📝 存为新草稿</button><button class="btn btn-ghost btn-sm" onclick="openDeepRemix()">🧬 去深度拆解</button></div>' : '<div style="font-size:11.5px;color:var(--text3);margin-top:8px">💡 先把笔记存到内容库再点「存为新草稿」</div>') +
    '</div>';
  try{
    rec.fusionReports = rec.fusionReports || [];
    rec.fusionReports.unshift({at:new Date().toISOString(), ratio, originalId:picked.id, originalTitle:picked.title, result:r.text.slice(0,500)});
    Store.save();
  }catch(e){}
}
function bsSaveFusion(originalId, newTitle){
  if(!originalId){ Toast('保存失败'); return; }
  const c = (Store.data.contents||[]).find(function(x){ return x.id===originalId; });
  if(!c){ Toast('原笔记已不存在'); return; }
  c.status = 'ready';
  if(newTitle) c.title = newTitle;
  Store.save();
  Toast('已标记为可发布，去「内容库」查看');
  setTimeout(function(){ try{ navigate('library'); }catch(e){} }, 600);
}
function openBsHistory(){
  const list = (Store.data.benchmarks||[]).filter(function(b){ return b.styleRadar; });
  if(!list.length){
    Modal.open('📚 已分析博主', '<div style="color:var(--text3);text-align:center;padding:20px">还没有已分析博主</div>');
    return;
  }
  Modal.open('📚 已分析博主（' + list.length + '）', '<div>' + list.map(function(b){
    return '<div style="background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer" onclick="bsReopen(\''+b.id+'\')"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800">'+esc(b.name)+'</div><div style="font-size:11.5px;color:var(--text3);margin-top:2px">'+esc(b.industry||'通用')+' · '+esc((b.personaDesc||'').slice(0,30))+'</div></div><span style="font-size:11px;color:var(--brand)">查看 →</span></div>';
  }).join('') + '</div>');
}
function bsReopen(id){
  const rec = (Store.data.benchmarks||[]).find(function(b){ return b.id===id; });
  if(!rec){ Toast('记录已删除'); return; }
  Modal.close();
  setTimeout(function(){
    openBloggerStyle();
    setTimeout(function(){ renderBsReport(rec); }, 200);
  }, 200);
}
