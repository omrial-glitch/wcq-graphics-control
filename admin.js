const WINDOWS = [
  { id: 'w4', label: 'Window 4 — Aug 27–31, 2026' },
  { id: 'w5', label: 'Window 5 — November 2026' },
];
const CONT_ORDER = ["Africa", "America", "Asia", "Europe"];
const CONT_LABEL = { Africa: "Africa", America: "Americas", Asia: "Asia", Europe: "Europe" };
const ZONE_ABBR = { Africa: "AFR", America: "AMR", Asia: "ASI", Europe: "EUR" };
const ZONE_HEX = { Africa: "4ade80", America: "f87171", Asia: "facc15", Europe: "60a5fa" };
const COMPANY_COLOR = {
  'Wtvision': 'cyan', 'Wtvision - Remote': 'cyan',
  'TAF': 'violet', 'TV Graphics': 'blue', 'Segev- Remote': 'amber', 'FIBA Americas': 'emerald',
};
const POLL_MS = 45000;

const state = {
  windowId: 'w4', tab: 'games', zone: 'all', search: '', colorContinent: 'Africa',
  games: [], teams: {}, palette: [],
  backendUrl: localStorage.getItem('wcq_backend_url') || '',
  adminToken: localStorage.getItem('wcq_admin_token') || '',
  lastSync: null, pollTimer: null, syncFailures: 0,
};

function esc(s){
  if(s===undefined||s===null) return "";
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function hexToRgb(hex){
  if(!hex) return null;
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  if([r,g,b].some(isNaN)) return null;
  return {r,g,b};
}
function isValidHex(h){ return /^#?[0-9a-fA-F]{6}$/.test(h); }
function normHex(h){ h = h.trim(); if(!h.startsWith('#')) h = '#'+h; return h.toUpperCase(); }
function companyColor(c){ return COMPANY_COLOR[c] || 'slate'; }

function copyText(text, btnEl){
  const done = () => {
    if(!btnEl) return;
    const prev = btnEl.textContent;
    btnEl.textContent = "Copied";
    setTimeout(()=>{ btnEl.textContent = prev; }, 1200);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>{});
  } else {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); try{ document.execCommand('copy'); done(); }catch(e){} document.body.removeChild(ta);
  }
}

/* ---------------- backend ---------------- */

function apiGet(params){
  const url = new URL(state.backendUrl);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
  return fetch(url.toString()).then(r=>r.json());
}
function apiPostOnce(payload){
  return fetch(state.backendUrl, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ token: state.adminToken }, payload)),
  }).then(r=>r.json());
}
// Every write gets 2 retries with backoff before it's reported as failed —
// a save should never silently vanish just because Apps Script had a slow
// or transient blip.
function apiPost(payload, attempt){
  attempt = attempt || 1;
  return apiPostOnce(payload).then(res=>{
    if(res && res.error){ throw new Error(res.error); }
    return res;
  }).catch(err=>{
    if(attempt < 3){
      return new Promise(resolve=>setTimeout(resolve, attempt * 1000))
        .then(()=> apiPost(payload, attempt + 1));
    }
    showToast('Save failed — check your connection and try again.', 'error');
    throw err;
  });
}

function showToast(msg, kind){
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  const styles = {
    ok: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
    error: 'bg-rose-500/15 border-rose-500/40 text-rose-200',
    info: 'bg-slate-700/40 border-slate-600/40 text-slate-200',
  };
  el.className = `px-3 py-2 rounded-lg border text-xs font-medium shadow-lg max-w-[280px] ${styles[kind] || styles.info}`;
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(()=>{ el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(()=>el.remove(), 300); }, 4000);
}

function cacheKey(winId){ return 'wcq_cache_' + winId; }
function saveCache(winId, data){
  try{ localStorage.setItem(cacheKey(winId), JSON.stringify({ ...data, ts: Date.now() })); }catch(e){}
}
function loadCache(winId){
  try{
    const raw = localStorage.getItem(cacheKey(winId));
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function setConnNote(msg){
  const el = document.getElementById('connNote');
  if(!msg){ el.classList.add('hidden'); el.textContent=''; return; }
  el.textContent = msg;
  el.classList.remove('hidden');
}
function setLiveBadge(mode){
  const el = document.getElementById('liveBadge');
  if(mode === 'live'){
    el.textContent = 'LIVE';
    el.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse';
  } else if(mode === 'connecting'){
    el.textContent = 'CONNECTING…';
    el.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse';
  } else {
    el.textContent = 'OFFLINE';
    el.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-600/20 text-slate-400 border border-slate-600/30';
  }
}

async function loadWindow(opts){
  const silent = !!(opts && opts.silent);
  document.getElementById('pageTitle').textContent = 'FIBA WCQ — ' + (WINDOWS.find(w=>w.id===state.windowId)||{}).label;
  if(!state.backendUrl || !state.adminToken){
    setConnNote(!state.backendUrl
      ? 'Not connected — click the gear icon to link your Google Sheet backend.'
      : 'Missing admin key — click the gear icon and enter the ADMIN_TOKEN you set in Script Properties.');
    setLiveBadge('offline');
    state.games = []; state.teams = {}; state.palette = [];
    renderAll();
    return;
  }

  let paintedFromCache = false;
  if(!silent){
    const cached = loadCache(state.windowId);
    if(cached && (cached.games || []).length){
      state.games = cached.games || []; state.teams = cached.teams || {}; state.palette = cached.palette || [];
      renderAll();
      paintedFromCache = true;
    }
    setLiveBadge('connecting');
    setConnNote(paintedFromCache ? '' : 'Connecting to your Google Sheet — this can take up to a minute on the first load.');
  }

  try{
    const data = await apiGet({ action: 'data', window: state.windowId, token: state.adminToken });
    if(data.error){
      state.syncFailures++;
      if(!silent || state.syncFailures > 2){ setConnNote('Backend error: ' + data.error); setLiveBadge('offline'); }
    } else {
      state.syncFailures = 0;
      setConnNote('');
      setLiveBadge('live');
      state.games = data.games || [];
      state.teams = data.teams || {};
      state.palette = data.palette || [];
      state.lastSync = new Date();
      saveCache(state.windowId, { games: state.games, teams: state.teams, palette: state.palette });
      renderAll();
    }
  }catch(e){
    console.error(e);
    state.syncFailures++;
    // A single missed background poll isn't worth alarming over — the
    // page keeps showing the last good data. Only surface it after it
    // keeps failing, or if this was a load the user is actively waiting on.
    if(!silent || state.syncFailures > 2){
      setConnNote(paintedFromCache
        ? 'Having trouble reaching the backend — showing the last data that loaded successfully.'
        : 'Could not reach the backend — check the Web App URL and that access is set to "Anyone".');
      setLiveBadge('offline');
    }
  }
}

function startPolling(){
  if(state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(()=>{ if(document.visibilityState === 'visible') loadWindow({ silent: true }); }, POLL_MS);
}

function startClock(){
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const zoneFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', timeZoneName: 'short' });
  function tick(){
    document.getElementById('madridClock').textContent = fmt.format(new Date());
    const parts = zoneFmt.formatToParts(new Date());
    const tzPart = parts.find(p=>p.type==='timeZoneName');
    document.getElementById('madridZoneLabel').textContent = tzPart ? `(${tzPart.value})` : '(Madrid)';
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------------- init ---------------- */

function switchTab(name){
  document.querySelectorAll('.tab-btn').forEach(b=>{
    const active = b.dataset.tab === name;
    b.classList.toggle('text-blue-400', active);
    b.classList.toggle('border-blue-500', active);
    b.classList.toggle('text-slate-400', !active);
    b.classList.toggle('border-transparent', !active);
  });
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('panel-'+name).classList.remove('hidden');
  state.tab = name;
}

function init(){
  const winSel = document.getElementById('windowSelect');
  WINDOWS.forEach(w=>{
    const opt = document.createElement('option');
    opt.value = w.id; opt.textContent = w.label;
    winSel.appendChild(opt);
  });
  winSel.value = state.windowId;
  winSel.addEventListener('change', () => { state.windowId = winSel.value; loadWindow(); });

  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> switchTab(btn.dataset.tab));
  });
  document.getElementById('backToScheduleBtn').addEventListener('click', ()=> switchTab('games'));

  document.getElementById('searchInput').addEventListener('input', (e)=>{
    state.search = e.target.value.trim().toLowerCase();
    renderGames();
  });

  document.getElementById('refreshBtn').addEventListener('click', loadWindow);

  document.getElementById('addColorForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = document.getElementById('newColorHex');
    const v = input.value.trim();
    if(!isValidHex(v)) { input.classList.add('border-rose-500'); return; }
    input.classList.remove('border-rose-500');
    const hex = normHex(v);
    if(!state.palette.includes(hex)) state.palette.push(hex);
    renderPalette();
    input.value = '';
    if(state.backendUrl) apiPost({ action: 'addPaletteColor', hex }).catch(e=>console.error(e));
  });

  document.getElementById('addTeamForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const codeInput = document.getElementById('newTeamCode');
    const nameInput = document.getElementById('newTeamName');
    const contSelect = document.getElementById('newTeamContinent');
    const code = codeInput.value.trim().toUpperCase();
    const name = nameInput.value.trim();
    const continent = contSelect.value;
    if(!code || !name){ if(!code) codeInput.classList.add('border-rose-500'); if(!name) nameInput.classList.add('border-rose-500'); return; }
    if(state.teams[code]){ codeInput.classList.add('border-rose-500'); return; }
    codeInput.classList.remove('border-rose-500'); nameInput.classList.remove('border-rose-500');
    state.teams[code] = { code, name, continent, light: null, dark: null, alternate: null };
    state.colorContinent = continent;
    renderColorContinentTabs(); renderTeamColors(); renderPairing();
    codeInput.value=''; nameInput.value='';
    if(state.backendUrl) apiPost({ action:'addTeam', window: state.windowId, code, name, continent }).catch(e=>console.error(e));
  });

  wireSettingsModal();
  startClock();
  loadWindow();
  startPolling();
}

function wireSettingsModal(){
  const backdrop = document.getElementById('settingsBackdrop');
  const openModal = () => {
    document.getElementById('backendUrlInput').value = state.backendUrl;
    document.getElementById('adminTokenInput').value = state.adminToken;
    backdrop.classList.remove('hidden'); backdrop.classList.add('flex');
  };
  const closeModal = () => { backdrop.classList.add('hidden'); backdrop.classList.remove('flex'); };
  document.getElementById('settingsBtn').addEventListener('click', openModal);
  document.getElementById('settingsCancel').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) closeModal(); });
  document.getElementById('settingsSave').addEventListener('click', ()=>{
    const url = document.getElementById('backendUrlInput').value.trim();
    const token = document.getElementById('adminTokenInput').value.trim();
    state.backendUrl = url; state.adminToken = token;
    localStorage.setItem('wcq_backend_url', url);
    localStorage.setItem('wcq_admin_token', token);
    closeModal();
    loadWindow();
  });
  if(!state.backendUrl || !state.adminToken) setTimeout(openModal, 300);
}

function renderAll(){
  renderKpiStrip();
  renderZoneChips();
  renderGames();
  renderPalette();
  renderColorContinentTabs();
  renderTeamColors();
  renderPairing();
  renderFooter();
}

function renderColorContinentTabs(){
  const wrap = document.getElementById('colorContinentTabs');
  const counts = {};
  Object.values(state.teams).forEach(t=>{ counts[t.continent] = (counts[t.continent]||0)+1; });
  wrap.innerHTML = CONT_ORDER.map(c=>{
    const active = state.colorContinent === c;
    return `<button data-cc="${c}" class="px-3 py-1.5 text-xs font-semibold border-b-2 -mb-px ${active ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'}">${CONT_LABEL[c]} <span class="text-slate-500 font-normal">(${counts[c]||0})</span></button>`;
  }).join('');
  wrap.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      state.colorContinent = b.dataset.cc;
      renderColorContinentTabs(); renderTeamColors(); renderPairing();
    });
  });
}

/* ---------------- games tab ---------------- */

function filteredGames(){
  return state.games.filter(g=>{
    if(state.zone !== 'all' && g.continent !== state.zone) return false;
    if(state.search){
      const hay = [g.home,g.away,g.homeName,g.awayName,g.city,g.venue,g.bovm,g.gfxOperator].join(' ').toLowerCase();
      if(!hay.includes(state.search)) return false;
    }
    return true;
  }).sort((a,b)=>a.sortKey-b.sortKey);
}

function renderKpiStrip(){
  const g = state.games;
  const total = g.length;
  const bkOk = g.filter(x=>x.backupClock && x.backupClock.status==='ok').length;
  const gfxOk = g.filter(x=>x.gfxExample && x.gfxExample.status==='ok').length;
  const issues = g.filter(x=>(x.backupClock&&x.backupClock.status==='issue')||(x.gfxExample&&x.gfxExample.status==='issue')).length;
  document.getElementById('kpiStrip').innerHTML = `
    <div class="px-3 flex items-baseline gap-1.5"><span class="text-slate-400">Total Matches:</span><span class="text-sm font-bold text-white font-mono">${total}</span></div>
    <div class="px-3 flex items-baseline gap-1.5"><span class="text-slate-400">Clock Cam Valid:</span><span class="text-sm font-bold text-emerald-400 font-mono">${bkOk}<span class="text-xs text-slate-500 font-normal">/${total}</span></span></div>
    <div class="px-3 flex items-baseline gap-1.5"><span class="text-slate-400">GFX Ready:</span><span class="text-sm font-bold text-emerald-400 font-mono">${gfxOk}<span class="text-xs text-slate-500 font-normal">/${total}</span></span></div>
    <div class="pl-3 flex items-baseline gap-1.5"><span class="text-slate-400">Issues:</span>
      <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${issues ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700/30 text-slate-400 border border-slate-700/40'}">${issues} Pending</span>
    </div>`;
}

function renderZoneChips(){
  const wrap = document.getElementById('zoneChips');
  const counts = {};
  state.games.forEach(g=>{ counts[g.continent] = (counts[g.continent]||0)+1; });
  const allActive = state.zone==='all';
  let html = `<span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Zone:</span>`;
  html += `<button data-zone="all" class="px-2.5 py-1 rounded font-semibold shadow-sm flex items-center gap-1.5 text-xs ${allActive ? 'bg-blue-600 text-white' : 'bg-[#162032] hover:bg-[#1f2e48] text-slate-300 border border-[#24334d]'}">
    <span>ALL</span><span class="${allActive?'bg-blue-800':'bg-slate-800'} text-[10px] px-1.5 py-0.5 rounded-full font-mono">${state.games.length}</span></button>`;
  CONT_ORDER.forEach(c=>{
    const active = state.zone === c;
    const hex = ZONE_HEX[c];
    const zoneChipLabel = c === 'Asia' ? 'Asia-Oce' : CONT_LABEL[c];
    html += `<button data-zone="${c}" class="px-2.5 py-1 rounded flex items-center gap-1.5 text-xs transition-colors ${active ? 'bg-[#1f2e48] text-white border border-[#3a5480]' : 'bg-[#162032] hover:bg-[#1f2e48] text-slate-300 border border-[#24334d]'}">
      <span class="w-2 h-2 rounded-full" style="background:#${hex}"></span>
      <span>${zoneChipLabel}</span>
      <span class="text-slate-400 font-mono text-[10px]">(${counts[c]||0})</span>
    </button>`;
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{ state.zone = b.dataset.zone; renderZoneChips(); renderGames(); });
  });
}

function statusLabel(status){ return status==='ok' ? 'OK' : status==='issue' ? 'Issue' : 'Pending'; }

function statusWidgetHtml(field, obj){
  const status = obj.status || 'pending', note = obj.note || '';
  const okActive = status === 'ok';
  const wrapClass = status==='ok' ? 'bg-emerald-500/15 border-emerald-500/30' : (status==='issue' ? 'bg-amber-500/15 border-amber-500/30' : 'bg-slate-700/30 border-slate-600/30');
  const textClass = status==='ok' ? 'text-emerald-200' : (status==='issue' ? 'text-amber-200' : 'text-slate-500');
  const labelClass = status==='ok' ? 'text-emerald-300' : (status==='issue' ? 'text-amber-300' : 'text-slate-400');
  const icon = status==='ok' ? '✓' : (status==='issue' ? '⚠' : '○');
  const okClass = okActive ? 'bg-emerald-400 border-emerald-300 text-emerald-950' : 'border-slate-600 text-slate-500 hover:text-slate-300';
  return `
    <div class="status-widget rounded-md border px-1.5 py-1 flex flex-col gap-0.5 w-full min-w-[170px] ${wrapClass}" data-field="${field}" data-ok="${okActive}">
      <div class="flex items-center justify-between gap-1">
        <span class="status-label text-[10px] font-bold leading-none ${labelClass}"><span class="status-icon">${icon}</span> ${statusLabel(status)}</span>
        <button type="button" title="Mark OK" class="ok-btn shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold leading-none ${okClass}">✓</button>
      </div>
      <textarea rows="2" placeholder="No note" class="status-note w-full bg-transparent text-[11px] leading-tight resize-none overflow-y-auto focus:outline-none ${textClass}">${esc(note)}</textarea>
    </div>`;
}

function restyleStatusWidget(widget, status){
  const noteEl = widget.querySelector('.status-note');
  const okBtn = widget.querySelector('.ok-btn');
  const labelEl = widget.querySelector('.status-label');
  widget.className = 'status-widget rounded-md border px-1.5 py-1 flex flex-col gap-0.5 w-full min-w-[170px] ' +
    (status==='ok' ? 'bg-emerald-500/15 border-emerald-500/30' : status==='issue' ? 'bg-amber-500/15 border-amber-500/30' : 'bg-slate-700/30 border-slate-600/30');
  noteEl.className = 'status-note w-full bg-transparent text-[11px] leading-tight resize-none overflow-y-auto focus:outline-none ' +
    (status==='ok' ? 'text-emerald-200' : status==='issue' ? 'text-amber-200' : 'text-slate-500');
  okBtn.className = 'ok-btn shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold leading-none ' +
    (status==='ok' ? 'bg-emerald-400 border-emerald-300 text-emerald-950' : 'border-slate-600 text-slate-500 hover:text-slate-300');
  labelEl.className = 'status-label text-[10px] font-bold leading-none ' +
    (status==='ok' ? 'text-emerald-300' : status==='issue' ? 'text-amber-300' : 'text-slate-400');
  labelEl.innerHTML = `<span class="status-icon">${status==='ok'?'✓':status==='issue'?'⚠':'○'}</span> ${statusLabel(status)}`;
  widget.dataset.ok = (status === 'ok') ? 'true' : 'false';
}

function renderGames(){
  const tbody = document.getElementById('gamesBody');
  const banner = document.getElementById('emptyWindowBanner');
  const tableWrap = document.getElementById('gamesTableWrap');
  const list = filteredGames();

  if(!state.games.length){
    const winLabel = (WINDOWS.find(w=>w.id===state.windowId)||{}).label || 'this window';
    document.getElementById('emptyWindowTitle').textContent = state.backendUrl
      ? `No data yet for ${winLabel}`
      : 'Not connected — click the gear icon to link your Google Sheet';
    banner.classList.remove('hidden');
    tableWrap.classList.add('hidden');
    return;
  }
  banner.classList.add('hidden');
  tableWrap.classList.remove('hidden');

  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-slate-500 py-10">No games match this filter</td></tr>`;
    return;
  }
  let html = '';
  let lastDate = null;
  list.forEach(g=>{
    if(g.dateISO !== lastDate){
      lastDate = g.dateISO;
      html += `<tr class="bg-[#0f172a]"><td colspan="9" class="py-1.5 px-3 text-[12px] font-bold uppercase tracking-wide text-slate-300">${esc(g.dateLabel)}</td></tr>`;
    }
    const bk = g.backupClock || {status:'pending',note:''};
    const gx = g.gfxExample || {status:'pending',note:''};
    const zoneHex = ZONE_HEX[g.continent] || '94a3b8';
    const cColor = companyColor(g.gfxCompany);
    html += `
    <tr class="hover:bg-[#162033]/70 transition-colors" data-id="${g.id}" style="border-left:3px solid #${zoneHex}">
      <td class="px-3 py-1 text-center">
        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border" style="background:#${zoneHex}26;color:#${zoneHex};border-color:#${zoneHex}4d">${ZONE_ABBR[g.continent]||'?'}</span>
      </td>
      <td class="px-3 py-1">
        <div class="flex items-center gap-2" title="${esc(g.home)} vs ${esc(g.away)}">
          <span class="font-semibold text-white whitespace-nowrap">${esc(g.homeName)}</span>
          <span class="inline-flex items-center gap-1 px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded shrink-0">
            <span class="w-3.5 h-3 rounded-sm border border-white/10" style="background:${esc(g.homeColor.hex)}"></span>
            <span class="w-3.5 h-3 rounded-sm border border-white/10" style="background:${esc(g.awayColor.hex)}"></span>
          </span>
          <span class="font-semibold text-white whitespace-nowrap">${esc(g.awayName)}</span>
        </div>
      </td>
      <td class="px-3 py-1 text-slate-300"><div class="truncate max-w-[150px]" title="${esc(g.venue)}">${esc(g.city)} <span class="text-slate-500">(${esc(g.venue)})</span></div></td>
      <td class="px-3 py-1 whitespace-nowrap" title="GMT ${esc(g.gmtTime)} · ${esc(g.timeZone)}">
        <span class="font-bold text-white font-mono">${esc(g.espTime)}${g.espNextDay?' <span class="text-blue-400">+1</span>':''} CEST</span>
        <span class="text-[10px] text-slate-400 block font-mono">${esc(g.localTime)} Local</span>
      </td>
      <td class="px-3 py-1 text-slate-300"><div class="truncate max-w-[130px]">${esc(g.bovm)}</div></td>
      <td class="px-3 py-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-slate-200">${esc(g.gfxOperator)}</span>
          <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-${cColor}-300 border border-slate-700">${esc(g.gfxCompany)}</span>
        </div>
      </td>
      <td class="px-3 py-1">${statusWidgetHtml('backupClock', bk)}</td>
      <td class="px-3 py-1">${statusWidgetHtml('gfxExample', gx)}</td>
      <td class="px-3 py-1">
        <input type="text" value="${esc(g.remarks)}" placeholder="General note…" class="remarks-note w-full bg-[#0b0f19]/70 text-slate-300 text-xs px-2 py-1 rounded border border-[#24334d] focus:border-blue-500 focus:ring-0 focus:outline-none">
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
  wireGameRowEvents(tbody);
}

function autosize(ta){ ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight)+'px'; }

function wireGameRowEvents(tbody){
  tbody.querySelectorAll('input.remarks-note').forEach(inp=>{
    let timer;
    inp.addEventListener('input', ()=>{
      clearTimeout(timer);
      timer = setTimeout(()=>{ writeGameField(inp.closest('tr').dataset.id, 'remarks', inp.value); }, 700);
    });
    inp.addEventListener('blur', ()=>{ writeGameField(inp.closest('tr').dataset.id, 'remarks', inp.value); });
  });

  wireStatusWidgets(tbody);
}

function wireStatusWidgets(tbody){
  tbody.querySelectorAll('.status-widget').forEach(widget=>{
    const ta = widget.querySelector('.status-note');
    const okBtn = widget.querySelector('.ok-btn');
    const row = widget.closest('tr');
    const id = row.dataset.id;
    const field = widget.dataset.field;
    let lastStatus = widget.dataset.ok === 'true' ? 'ok' : (ta.value.trim() ? 'issue' : 'pending');

    const currentStatus = () => widget.dataset.ok === 'true' ? 'ok' : (ta.value.trim() ? 'issue' : 'pending');
    const persist = (status) => {
      const g = state.games.find(x=>x.id===id);
      if(g) g[field] = { status, note: ta.value };
      renderKpiStrip();
      if(state.backendUrl) apiPost({ action:'updateGame', window: state.windowId, id, field, value: { status, note: ta.value } }).catch(e=>console.error(e));
    };

    let timer;
    ta.addEventListener('input', ()=>{
      const status = currentStatus();
      if(status !== lastStatus){ restyleStatusWidget(widget, status); lastStatus = status; }
      clearTimeout(timer);
      timer = setTimeout(()=> persist(currentStatus()), 700);
    });
    ta.addEventListener('blur', ()=> persist(currentStatus()));
    okBtn.addEventListener('click', ()=>{
      const turningOn = widget.dataset.ok !== 'true';
      widget.dataset.ok = turningOn ? 'true' : 'false';
      const status = currentStatus();
      restyleStatusWidget(widget, status);
      lastStatus = status;
      persist(status);
    });
  });
}

function writeGameField(id, field, value){
  const g = state.games.find(x=>x.id===id);
  if(g) g[field] = value;
  if(!state.backendUrl) return;
  apiPost({ action: 'updateGame', window: state.windowId, id, field, value }).catch(e=>console.error(e));
}

/* ---------------- team colours tab ---------------- */

function renderPalette(){
  const grid = document.getElementById('paletteGrid');
  if(!state.palette.length){
    grid.innerHTML = `<div class="text-slate-500 text-xs col-span-full">No colours yet — add one above.</div>`;
    return;
  }
  grid.innerHTML = state.palette.map(hex=>{
    const rgb = hexToRgb(hex);
    const rgbText = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '—';
    return `
    <div class="border border-[#2d3a54] rounded-lg overflow-hidden bg-[#0f172a]" data-hex="${hex}">
      <div class="h-10 cursor-pointer swatch-click" style="background:${hex}"></div>
      <div class="px-2 py-1.5 relative">
        <button type="button" data-remove="${hex}" class="absolute top-1 right-1 text-slate-500 hover:text-rose-400 text-xs leading-none">×</button>
        <div class="font-mono text-[11px] text-slate-200">${hex}</div>
        <div class="font-mono text-[10px] text-slate-500">${rgbText}</div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.swatch-click').forEach(sw=>{
    sw.addEventListener('click', ()=> copyText(sw.closest('[data-hex]').dataset.hex, null));
  });
  grid.querySelectorAll('[data-remove]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      const hex = b.dataset.remove;
      state.palette = state.palette.filter(h=>h!==hex);
      renderPalette();
      if(state.backendUrl) apiPost({ action: 'removePaletteColor', hex }).catch(e=>console.error(e));
    });
  });
}

function slotRowHtml(teamCode, slot, label, hex){
  const rgb = hexToRgb(hex||'#000000');
  const rgbText = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '—';
  return `
  <div class="flex flex-col gap-1.5" data-slot-row="${teamCode}:${slot}">
    <div class="flex items-center gap-2.5">
      <button type="button" class="pick-swatch w-7 h-7 rounded-md border border-white/10 flex-shrink-0" style="background:${hex||'transparent'};${hex?'':'border-style:dashed'}" data-pick="${teamCode}:${slot}" title="Pick from palette"></button>
      <div class="flex-1 min-w-0 flex flex-col gap-0.5">
        <span class="text-[10px] uppercase tracking-wide text-slate-500">${label}</span>
        <div class="flex items-center gap-2 flex-wrap">
          <input class="bg-[#0b0f19] border border-[#2d3a54] rounded px-1.5 py-0.5 text-[11px] font-mono w-24 text-slate-200 focus:border-blue-500 focus:outline-none" value="${hex||''}" placeholder="#RRGGBB" data-team="${teamCode}" data-slot="${slot}">
          <span class="font-mono text-[10px] text-slate-500">${rgbText}</span>
          <button type="button" class="text-[10px] text-slate-500 hover:text-slate-300 border border-[#2d3a54] rounded px-1.5 py-0.5" data-copy="${hex||''}">Copy</button>
        </div>
      </div>
    </div>
  </div>`;
}

function palettePickerHtml(teamCode, slot){
  if(!state.palette.length) return `<div class="text-[10px] text-slate-500 py-1">No palette colours yet.</div>`;
  return `
  <div class="palette-picker flex flex-wrap gap-1.5 p-2 bg-[#0b0f19] border border-[#2d3a54] rounded-lg mt-1">
    ${state.palette.map(hex=>`<button type="button" class="w-6 h-6 rounded border border-white/10" style="background:${hex}" data-pick-apply="${teamCode}:${slot}:${hex}" title="${hex}"></button>`).join('')}
  </div>`;
}

function renderTeamColors(){
  const wrap = document.getElementById('teamsByContinent');
  const teams = state.teams;
  document.getElementById('colorsColTitle').textContent = `Team Colours — ${CONT_LABEL[state.colorContinent]}`;
  document.getElementById('fixturesColTitle').textContent = `${CONT_LABEL[state.colorContinent]} Fixtures`;
  if(!Object.keys(teams).length){
    wrap.innerHTML = `<div class="text-slate-500 text-xs py-4">${state.backendUrl ? 'No team colours loaded for this window yet.' : 'Connect a backend via the gear icon to load data.'}</div>`;
    return;
  }
  const list = Object.values(teams).filter(t=>t.continent===state.colorContinent).sort((a,b)=>a.name.localeCompare(b.name));
  if(!list.length){
    wrap.innerHTML = `<div class="text-slate-500 text-xs py-4">No teams for this confederation yet.</div>`;
    return;
  }
  wrap.innerHTML = list.map(t=>`
    <div class="border border-[#1f2937] rounded-lg bg-[#111827] p-3 flex flex-col gap-2.5">
      <div class="flex justify-between items-baseline">
        <span class="font-semibold text-sm text-white">${esc(t.name)}</span>
        <span class="flex items-center gap-2">
          <span class="font-mono text-[10px] text-slate-500">${esc(t.code)}</span>
          <button type="button" data-delete-team="${t.code}" class="text-slate-500 hover:text-rose-400 text-xs leading-none" title="Delete team">×</button>
        </span>
      </div>
      ${slotRowHtml(t.code,'light','Light',t.light)}
      ${slotRowHtml(t.code,'dark','Dark',t.dark)}
      ${t.alternate
        ? slotRowHtml(t.code,'alternate','Alternate',t.alternate)
        : `<button type="button" data-add-alt="${t.code}" class="text-[11px] text-slate-500 hover:text-slate-300 border border-dashed border-[#2d3a54] rounded px-2 py-1 self-start">+ Add alternate colour</button>`}
    </div>
  `).join('');

  wrap.querySelectorAll('input[data-team]').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const v = inp.value.trim();
      if(!v) return;
      if(!isValidHex(v)){ inp.classList.add('border-rose-500'); return; }
      inp.classList.remove('border-rose-500');
      writeTeamField(inp.dataset.team, inp.dataset.slot, normHex(v));
    });
  });
  wrap.querySelectorAll('[data-copy]').forEach(b=>{
    b.addEventListener('click', ()=>{ if(b.dataset.copy) copyText(b.dataset.copy, b); });
  });
  wrap.querySelectorAll('[data-add-alt]').forEach(b=>{
    b.addEventListener('click', ()=>{ writeTeamField(b.dataset.addAlt, 'alternate', '#FFFFFF'); });
  });
  wrap.querySelectorAll('[data-delete-team]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const code = b.dataset.deleteTeam;
      if(!confirm(`Delete ${code} from Team Colours? This does not remove it from the schedule.`)) return;
      delete state.teams[code];
      renderColorContinentTabs(); renderTeamColors(); renderPairing();
      if(state.backendUrl) apiPost({ action:'deleteTeam', window: state.windowId, code }).catch(e=>console.error(e));
    });
  });
  wrap.querySelectorAll('[data-pick]').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      const row = sw.closest('[data-slot-row]');
      const existingPicker = row.querySelector('.palette-picker');
      document.querySelectorAll('.palette-picker').forEach(p=>p.remove());
      if(existingPicker) return; // was open, click closed it
      const [teamCode, slot] = sw.dataset.pick.split(':');
      row.insertAdjacentHTML('beforeend', palettePickerHtml(teamCode, slot));
      row.querySelectorAll('[data-pick-apply]').forEach(pb=>{
        pb.addEventListener('click', ()=>{
          const [tc, sl, hex] = pb.dataset.pickApply.split(':');
          writeTeamField(tc, sl, hex);
        });
      });
    });
  });
}

function writeTeamField(code, slot, hex){
  if(state.teams[code]) state.teams[code][slot] = hex;
  renderTeamColors(); renderGames(); renderPairing();
  if(!state.backendUrl) return;
  apiPost({ action: 'updateTeamColor', window: state.windowId, code, slot, hex }).catch(e=>console.error(e));
}

/* ---------------- pairing table ---------------- */

function renderPairing(){
  const tbody = document.getElementById('pairingBody');
  const list = state.games.filter(g=>g.continent===state.colorContinent).slice().sort((a,b)=>a.sortKey-b.sortKey);
  if(!list.length){ tbody.innerHTML = `<tr><td colspan="4" class="text-center text-slate-500 py-6">No fixtures for this confederation yet</td></tr>`; return; }
  const swatchBtn = (gameId, side, code, hex) =>
    `<button type="button" class="pick-swatch w-5 h-5 rounded border border-white/15" style="background:${esc(hex)}" data-pick-game="${gameId}:${side}" title="Set ${esc(code)}'s colour for this game only"></button>`;
  tbody.innerHTML = list.map(g=>`
    <tr data-fixture-row="${g.id}">
      <td class="py-2 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">${esc(g.dateLabel.replace(/^[A-Za-z]+,?\s*/,''))}</td>
      <td class="py-2 px-3 text-right" data-game-slot="${g.id}:home"><span class="inline-flex items-center justify-end gap-2"><span class="font-semibold text-slate-100">${esc(g.home)}</span>${swatchBtn(g.id, 'home', g.home, g.homeColor.hex)}</span></td>
      <td class="py-2 px-2 text-center text-slate-600 w-8">–</td>
      <td class="py-2 px-3" data-game-slot="${g.id}:away"><span class="inline-flex items-center gap-2">${swatchBtn(g.id, 'away', g.away, g.awayColor.hex)}<span class="font-semibold text-slate-100">${esc(g.away)}</span></span></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-pick-game]').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      const row = sw.closest('[data-game-slot]');
      document.querySelectorAll('.palette-picker').forEach(p=>p.remove());
      const wasOpenHere = row.dataset.pickerOpen === 'true';
      tbody.querySelectorAll('[data-game-slot]').forEach(r=>r.dataset.pickerOpen='false');
      if(wasOpenHere) return;
      const [gameId, side] = sw.dataset.pickGame.split(':');
      row.insertAdjacentHTML('beforeend', palettePickerHtml(gameId, side));
      row.dataset.pickerOpen = 'true';
      row.querySelectorAll('[data-pick-apply]').forEach(pb=>{
        pb.addEventListener('click', ()=>{
          const [gid, sd, hex] = pb.dataset.pickApply.split(':');
          writeGameColor(gid, sd, hex);
        });
      });
    });
  });
}

function writeGameColor(gameId, side, hex){
  const g = state.games.find(x=>x.id===gameId);
  const field = side === 'home' ? 'homeColor' : 'awayColor';
  if(g) g[field] = { hex, slot: 'custom' };
  renderGames(); renderPairing();
  if(!state.backendUrl) return;
  apiPost({ action:'updateGame', window: state.windowId, id: gameId, field, value: { hex } }).catch(e=>console.error(e));
}

/* ---------------- footer ---------------- */

function renderFooter(){
  const g = state.games;
  const ok = g.filter(x=>(x.backupClock&&x.backupClock.status==='ok')&&(x.gfxExample&&x.gfxExample.status==='ok')).length;
  const issue = g.filter(x=>(x.backupClock&&x.backupClock.status==='issue')||(x.gfxExample&&x.gfxExample.status==='issue')).length;
  const pending = g.length - ok - issue;
  document.getElementById('statusSummary').innerHTML = `
    <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-slate-300">${ok} fully confirmed</span></span>
    <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400"></span><span class="text-slate-300">${issue} flagged</span></span>
    <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-slate-500"></span><span class="text-slate-300">${pending} pending</span></span>
  `;
  const conn = document.getElementById('footerConn');
  conn.textContent = state.lastSync ? `Synced ${state.lastSync.toLocaleTimeString('en-GB')}` : 'Not connected';
}

init();
