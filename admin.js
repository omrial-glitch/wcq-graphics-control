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
  lastSync: null, pollTimer: null,
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
function apiPost(payload){
  return fetch(state.backendUrl, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ token: state.adminToken }, payload)),
  }).then(r=>r.json());
}

function setConnNote(msg){
  const el = document.getElementById('connNote');
  if(!msg){ el.classList.add('hidden'); el.textContent=''; return; }
  el.textContent = msg;
  el.classList.remove('hidden');
}
function setLiveBadge(ok){
  const el = document.getElementById('liveBadge');
  if(ok){
    el.textContent = 'LIVE';
    el.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse';
  } else {
    el.textContent = 'OFFLINE';
    el.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-600/20 text-slate-400 border border-slate-600/30';
  }
}

async function loadWindow(){
  document.getElementById('pageTitle').textContent = 'FIBA WCQ — ' + (WINDOWS.find(w=>w.id===state.windowId)||{}).label;
  if(!state.backendUrl || !state.adminToken){
    setConnNote(!state.backendUrl
      ? 'Not connected — click the gear icon to link your Google Sheet backend.'
      : 'Missing admin key — click the gear icon and enter the ADMIN_TOKEN you set in Script Properties.');
    setLiveBadge(false);
    state.games = []; state.teams = {}; state.palette = [];
    renderAll();
    return;
  }
  try{
    const data = await apiGet({ action: 'data', window: state.windowId, token: state.adminToken });
    if(data.error){
      setConnNote('Backend error: ' + data.error);
      setLiveBadge(false);
    } else {
      setConnNote('');
      setLiveBadge(true);
      state.games = data.games || [];
      state.teams = data.teams || {};
      state.palette = data.palette || [];
      state.lastSync = new Date();
    }
  }catch(e){
    console.error(e);
    setConnNote('Could not reach the backend — check the Web App URL and that access is set to "Anyone".');
    setLiveBadge(false);
  }
  renderAll();
}

function startPolling(){
  if(state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(()=>{ if(document.visibilityState === 'visible') loadWindow(); }, POLL_MS);
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
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>{
        b.classList.remove('text-blue-400','border-blue-500');
        b.classList.add('text-slate-400','border-transparent');
      });
      btn.classList.add('text-blue-400','border-blue-500');
      btn.classList.remove('text-slate-400','border-transparent');
      document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
      document.getElementById('panel-'+btn.dataset.tab).classList.remove('hidden');
      state.tab = btn.dataset.tab;
    });
  });

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
    <div class="px-3 flex items-baseline gap-1.5"><span class="text-slate-400">Clock Cam OK:</span><span class="text-sm font-bold text-emerald-400 font-mono">${bkOk}<span class="text-xs text-slate-500 font-normal">/${total}</span></span></div>
    <div class="px-3 flex items-baseline gap-1.5"><span class="text-slate-400">GFX Ready:</span><span class="text-sm font-bold text-emerald-400 font-mono">${gfxOk}<span class="text-xs text-slate-500 font-normal">/${total}</span></span></div>
    <div class="pl-3 flex items-baseline gap-1.5"><span class="text-slate-400">Issues:</span>
      <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${issues ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700/30 text-slate-400 border border-slate-700/40'}">${issues} flagged</span>
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
    html += `<button data-zone="${c}" class="px-2.5 py-1 rounded flex items-center gap-1.5 text-xs transition-colors ${active ? 'bg-[#1f2e48] text-white border border-[#3a5480]' : 'bg-[#162032] hover:bg-[#1f2e48] text-slate-300 border border-[#24334d]'}">
      <span class="w-2 h-2 rounded-full" style="background:#${hex}"></span>
      <span>${CONT_LABEL[c]}</span>
      <span class="text-slate-400 font-mono text-[10px]">(${counts[c]||0})</span>
    </button>`;
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{ state.zone = b.dataset.zone; renderZoneChips(); renderGames(); });
  });
}

function statusPill(state_, note){
  if(state_==='ok') return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓ OK</span>`;
  if(state_==='issue') return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 max-w-[150px] truncate" title="${esc(note)}">⚠ ${note ? esc(note) : 'Issue'}</span>`;
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700/30 text-slate-400 border border-slate-600/30">○ Pending</span>`;
}

function renderGames(){
  const tbody = document.getElementById('gamesBody');
  const list = filteredGames();
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-slate-500 py-10">
      ${state.games.length ? 'No games match this filter' : (state.backendUrl ? 'No games loaded for this window yet' : 'Connect a backend via the gear icon to load data')}</td></tr>`;
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
      <td class="px-3 py-1.5 text-center">
        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border" style="background:#${zoneHex}26;color:#${zoneHex};border-color:#${zoneHex}4d">${ZONE_ABBR[g.continent]||'?'}</span>
      </td>
      <td class="px-3 py-1.5">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="w-3 h-3 rounded-sm border border-black/30" style="background:${esc(g.homeColor.hex)}"></span>
          <span class="font-semibold text-white">${esc(g.home)}</span>
          <span class="text-slate-500 text-[10px]">vs</span>
          <span class="font-semibold text-white">${esc(g.away)}</span>
          <span class="w-3 h-3 rounded-sm border border-black/30" style="background:${esc(g.awayColor.hex)}"></span>
        </div>
        <div class="text-[10px] text-slate-500 truncate mt-0.5">${esc(g.homeName)} — ${esc(g.awayName)}</div>
      </td>
      <td class="px-3 py-1.5 text-slate-300"><div class="truncate max-w-[150px]">${esc(g.city)}</div><div class="text-[10px] text-slate-500 truncate max-w-[150px]">${esc(g.venue)}</div></td>
      <td class="px-3 py-1.5 whitespace-nowrap">
        <span class="font-bold text-white font-mono">${esc(g.espTime)}${g.espNextDay?' <span class="text-blue-400">+1</span>':''}</span>
        <span class="text-[10px] text-slate-400 block font-mono">${esc(g.localTime)} ${esc(g.timeZone)} local</span>
      </td>
      <td class="px-3 py-1.5 text-slate-300"><div class="truncate max-w-[130px]">${esc(g.bovm)}</div></td>
      <td class="px-3 py-1.5">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-slate-200">${esc(g.gfxOperator)}</span>
          <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-${cColor}-500/10 text-${cColor}-300 border border-${cColor}-500/30">${esc(g.gfxCompany)}</span>
        </div>
      </td>
      <td class="px-3 py-1.5 text-center status-cell" data-field="backupClock">${statusPill(bk.status, bk.note)}</td>
      <td class="px-3 py-1.5 text-center status-cell" data-field="gfxExample">${statusPill(gx.status, gx.note)}</td>
      <td class="px-3 py-1.5">
        <textarea rows="1" placeholder="General note…" class="w-full bg-[#0b0f19]/70 text-slate-300 text-xs px-2 py-1 rounded border border-[#24334d] focus:border-blue-500 focus:ring-0 resize-none">${esc(g.remarks)}</textarea>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
  wireGameRowEvents(tbody);
}

function autosize(ta){ ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight)+'px'; }

function wireGameRowEvents(tbody){
  tbody.querySelectorAll('textarea').forEach(ta=>{
    autosize(ta);
    let timer;
    ta.addEventListener('input', ()=>{
      autosize(ta);
      clearTimeout(timer);
      timer = setTimeout(()=>{ writeGameField(ta.closest('tr').dataset.id, 'remarks', ta.value); }, 700);
    });
    ta.addEventListener('blur', ()=>{ writeGameField(ta.closest('tr').dataset.id, 'remarks', ta.value); });
  });

  tbody.querySelectorAll('.status-cell').forEach(cell=>{
    cell.addEventListener('click', ()=> openStatusEditor(cell));
  });
}

function openStatusEditor(cell){
  const existing = cell.querySelector('.status-editor');
  if(existing){ existing.remove(); return; }
  document.querySelectorAll('.status-editor').forEach(e=>e.remove());

  const row = cell.closest('tr');
  const id = row.dataset.id;
  const field = cell.dataset.field;
  const game = state.games.find(g=>g.id===id);
  const cur = (game && game[field]) || {status:'pending', note:''};

  const editor = document.createElement('div');
  editor.className = 'status-editor mt-1.5 bg-[#0b0f19] border border-[#2d3a54] rounded-lg p-2 flex flex-col gap-1.5 text-left min-w-[180px]';
  const opt = (v, label, activeClasses) => `<button type="button" data-v="${v}" class="flex-1 border border-[#2d3a54] rounded px-1.5 py-1 text-[10px] font-semibold ${cur.status===v ? activeClasses : 'bg-[#1a2234] text-slate-400'}">${label}</button>`;
  editor.innerHTML = `
    <div class="flex gap-1">
      ${opt('pending','Pending','bg-slate-700/40 text-slate-200')}
      ${opt('ok','OK','bg-emerald-500/20 text-emerald-300')}
      ${opt('issue','Issue','bg-amber-500/20 text-amber-300')}
    </div>
    <textarea rows="1" placeholder="Note (optional)" class="bg-[#111827] border border-[#2d3a54] rounded px-2 py-1 text-[11px] text-slate-200 resize-none">${esc(cur.note)}</textarea>
    <div class="flex justify-end"><button type="button" class="close-btn text-[10px] text-slate-500 hover:text-slate-300 px-1">Close</button></div>
  `;
  cell.appendChild(editor);
  const ta = editor.querySelector('textarea');
  autosize(ta);

  let localStatus = cur.status;
  const commit = () => { writeGameField(id, field, { status: localStatus, note: ta.value }); };

  editor.querySelectorAll('[data-v]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      localStatus = b.dataset.v;
      commit();
      openStatusEditorRefresh(cell);
    });
  });
  let timer;
  ta.addEventListener('click', e=>e.stopPropagation());
  ta.addEventListener('input', ()=>{ autosize(ta); clearTimeout(timer); timer = setTimeout(commit, 700); });
  ta.addEventListener('blur', commit);
  editor.querySelector('.close-btn').addEventListener('click', (e)=>{ e.stopPropagation(); commit(); editor.remove(); });
}
function openStatusEditorRefresh(cell){
  cell.querySelector('.status-editor').remove();
  openStatusEditor(cell);
}

function writeGameField(id, field, value){
  const g = state.games.find(x=>x.id===id);
  if(g) g[field] = value;
  if(field !== 'remarks'){ renderGames(); renderKpiStrip(); }
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
  <div class="flex items-center gap-2.5">
    <div class="w-7 h-7 rounded-md border border-white/10 flex-shrink-0" style="background:${hex||'transparent'};${hex?'':'border-style:dashed'}"></div>
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <span class="text-[10px] uppercase tracking-wide text-slate-500">${label}</span>
      <div class="flex items-center gap-2 flex-wrap">
        <input class="bg-[#0b0f19] border border-[#2d3a54] rounded px-1.5 py-0.5 text-[11px] font-mono w-24 text-slate-200 focus:border-blue-500 focus:outline-none" value="${hex||''}" placeholder="#RRGGBB" data-team="${teamCode}" data-slot="${slot}">
        <span class="font-mono text-[10px] text-slate-500">${rgbText}</span>
        <button type="button" class="text-[10px] text-slate-500 hover:text-slate-300 border border-[#2d3a54] rounded px-1.5 py-0.5" data-copy="${hex||''}">Copy</button>
      </div>
    </div>
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
      <div class="flex justify-between items-baseline"><span class="font-semibold text-sm text-white">${esc(t.name)}</span><span class="font-mono text-[10px] text-slate-500">${esc(t.code)}</span></div>
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
  tbody.innerHTML = list.map(g=>`
    <tr>
      <td class="py-1.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">${esc(g.dateLabel.replace(/^[A-Za-z]+,?\s*/,''))}</td>
      <td class="py-1.5 px-3"><span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border border-black/30" style="background:${esc(g.homeColor.hex)}"></span>${esc(g.home)}</span></td>
      <td class="py-1.5 px-3 text-center text-slate-600">–</td>
      <td class="py-1.5 px-3"><span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border border-black/30" style="background:${esc(g.awayColor.hex)}"></span>${esc(g.away)}</span></td>
    </tr>
  `).join('');
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
