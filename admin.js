const WINDOWS = [
  { id: 'w4', label: 'Window 4 — Aug 27–31, 2026' },
  { id: 'w5', label: 'Window 5 — November 2026' },
];
const CONT_ORDER = ["Africa", "America", "Asia", "Europe"];
const CONT_LABEL = { Africa: "Africa", America: "Americas", Asia: "Asia", Europe: "Europe" };
const POLL_MS = 45000;

const state = {
  windowId: 'w4', tab: 'games', continent: 'all', search: '',
  games: [], teams: {}, palette: [],
  backendUrl: localStorage.getItem('wcq_backend_url') || '',
  adminToken: localStorage.getItem('wcq_admin_token') || '',
  loading: false, pollTimer: null,
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

function copyText(text, btnEl){
  const done = () => {
    if(!btnEl) return;
    const prev = btnEl.textContent;
    btnEl.textContent = "Copied";
    btnEl.classList.add("copied");
    setTimeout(()=>{ btnEl.textContent = prev; btnEl.classList.remove("copied"); }, 1200);
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
  if(!msg){ el.classList.remove('show'); el.textContent=''; return; }
  el.textContent = msg;
  el.classList.add('show');
}

async function loadWindow(){
  if(!state.backendUrl){
    setConnNote('Not connected — click Settings to link your Google Sheet backend.');
    state.games = []; state.teams = {}; state.palette = [];
    renderAll();
    return;
  }
  if(!state.adminToken){
    setConnNote('Missing admin key — click Settings and enter the ADMIN_TOKEN you set in Script Properties.');
    state.games = []; state.teams = {}; state.palette = [];
    renderAll();
    return;
  }
  state.loading = true;
  try{
    const data = await apiGet({ action: 'data', window: state.windowId, token: state.adminToken });
    if(data.error){ setConnNote('Backend error: ' + data.error); }
    else{
      setConnNote('');
      state.games = data.games || [];
      state.teams = data.teams || {};
      state.palette = data.palette || [];
    }
  }catch(e){
    console.error(e);
    setConnNote('Could not reach the backend — check the Web App URL and that access is set to "Anyone".');
  }
  state.loading = false;
  renderAll();
}

function startPolling(){
  if(state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(()=>{ if(document.visibilityState === 'visible') loadWindow(); }, POLL_MS);
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
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
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
    if(!isValidHex(v)) { input.style.borderColor = 'var(--status-issue-fg)'; return; }
    input.style.borderColor = '';
    const hex = normHex(v);
    if(!state.palette.includes(hex)) state.palette.push(hex);
    renderPalette();
    input.value = '';
    if(state.backendUrl){
      apiPost({ action: 'addPaletteColor', hex }).catch(e=>console.error(e));
    }
  });

  wireSettingsModal();

  document.getElementById('footerNote').textContent =
    'Kickoff times shown in Madrid time (CEST, GMT+2). Data lives in your own Google Sheet.';

  loadWindow();
  startPolling();
}

function wireSettingsModal(){
  const backdrop = document.getElementById('settingsBackdrop');
  const openModal = () => {
    document.getElementById('backendUrlInput').value = state.backendUrl;
    document.getElementById('adminTokenInput').value = state.adminToken;
    backdrop.classList.add('show');
  };
  document.getElementById('settingsBtn').addEventListener('click', openModal);
  document.getElementById('settingsCancel').addEventListener('click', ()=> backdrop.classList.remove('show'));
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) backdrop.classList.remove('show'); });
  document.getElementById('settingsSave').addEventListener('click', ()=>{
    const url = document.getElementById('backendUrlInput').value.trim();
    const token = document.getElementById('adminTokenInput').value.trim();
    state.backendUrl = url; state.adminToken = token;
    localStorage.setItem('wcq_backend_url', url);
    localStorage.setItem('wcq_admin_token', token);
    backdrop.classList.remove('show');
    loadWindow();
  });
  if(!state.backendUrl) setTimeout(openModal, 300);
}

function renderAll(){
  renderSummary();
  renderContinentChips();
  renderGames();
  renderPalette();
  renderTeamColors();
  renderPairing();
  const isEmpty = !state.games.length;
  const st = document.getElementById('windowStatus');
  st.textContent = isEmpty ? 'No data yet' : `${state.games.length} games`;
  st.className = 'window-status ' + (isEmpty ? 'empty' : 'live');
}

/* ---------------- games tab ---------------- */

function filteredGames(){
  return state.games.filter(g=>{
    if(state.continent !== 'all' && g.continent !== state.continent) return false;
    if(state.search){
      const hay = [g.home,g.away,g.homeName,g.awayName,g.city,g.venue,g.bovm,g.gfxOperator].join(' ').toLowerCase();
      if(!hay.includes(state.search)) return false;
    }
    return true;
  }).sort((a,b)=>a.sortKey-b.sortKey);
}

function renderSummary(){
  const g = state.games;
  const total = g.length;
  const bkOk = g.filter(x=>x.backupClock && x.backupClock.status==='ok').length;
  const bkIssue = g.filter(x=>x.backupClock && x.backupClock.status==='issue').length;
  const gfxOk = g.filter(x=>x.gfxExample && x.gfxExample.status==='ok').length;
  const gfxIssue = g.filter(x=>x.gfxExample && x.gfxExample.status==='issue').length;
  const row = document.getElementById('summaryRow');
  row.innerHTML = `
    <div class="summary-chip"><span class="n">${total}</span><span class="l">games this window</span></div>
    <div class="summary-chip"><span class="n">${bkOk}/${total}</span><span class="l">backup clock received</span></div>
    <div class="summary-chip ${bkIssue?'warn':''}"><span class="n">${bkIssue}</span><span class="l">backup clock flagged</span></div>
    <div class="summary-chip"><span class="n">${gfxOk}/${total}</span><span class="l">GFX example received</span></div>
    <div class="summary-chip ${gfxIssue?'warn':''}"><span class="n">${gfxIssue}</span><span class="l">GFX example flagged</span></div>
  `;
}

function renderContinentChips(){
  const wrap = document.getElementById('continentChips');
  const conts = ['all', ...CONT_ORDER];
  const dotVar = {Africa:'--cont-africa-fg',Asia:'--cont-asia-fg',America:'--cont-americas-fg',Europe:'--cont-europe-fg'};
  wrap.innerHTML = conts.map(c=>{
    const label = c==='all' ? 'All' : CONT_LABEL[c];
    const dot = c==='all' ? '' : `<span class="dot" style="background:var(${dotVar[c]})"></span>`;
    return `<button class="chip" data-cont="${c}" data-active="${state.continent===c}">${dot}${label}</button>`;
  }).join('');
  wrap.querySelectorAll('.chip').forEach(ch=>{
    ch.addEventListener('click', ()=>{ state.continent = ch.dataset.cont; renderContinentChips(); renderGames(); });
  });
}

function statusLabel(s){ return s==='ok' ? 'OK' : (s==='issue' ? 'Issue' : 'Pending'); }

function renderGames(){
  const tbody = document.getElementById('gamesBody');
  const list = filteredGames();
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-faint);padding:40px 0">
      ${state.games.length ? 'No games match this filter' : (state.backendUrl ? 'No games loaded for this window yet' : 'Connect a backend in Settings to load data')}</td></tr>`;
    return;
  }
  let html = '';
  let lastDate = null;
  list.forEach(g=>{
    if(g.dateISO !== lastDate){
      lastDate = g.dateISO;
      html += `<tr class="date-row"><td colspan="9">${esc(g.dateLabel)}</td></tr>`;
    }
    const bk = g.backupClock || {status:'pending',note:''};
    const gx = g.gfxExample || {status:'pending',note:''};
    html += `
    <tr class="game-row cont-${g.continent}" data-id="${g.id}">
      <td class="time-cell">${esc(g.espTime)}${g.espNextDay?' <span class="nextday">+1</span>':''}<span class="gmt">GMT ${esc(g.gmtTime)}</span></td>
      <td><div class="team-cell"><span class="swatch" style="background:${esc(g.homeColor.hex)}"></span><span><span class="team-code">${esc(g.home)}</span><span class="team-full">${esc(g.homeName)}</span></span></div></td>
      <td><div class="team-cell"><span class="swatch" style="background:${esc(g.awayColor.hex)}"></span><span><span class="team-code">${esc(g.away)}</span><span class="team-full">${esc(g.awayName)}</span></span></div></td>
      <td class="venue-cell"><span class="city">${esc(g.city)}</span><span class="venue">${esc(g.venue)}</span></td>
      <td class="person-cell">${esc(g.bovm)}</td>
      <td class="person-cell">${esc(g.gfxOperator)}<span class="company">${esc(g.gfxCompany)}</span></td>
      <td class="status-cell" data-field="backupClock">
        <button class="status-pill ${bk.status}" type="button"><span class="dot"></span>${statusLabel(bk.status)}</button>
      </td>
      <td class="status-cell" data-field="gfxExample">
        <button class="status-pill ${gx.status}" type="button"><span class="dot"></span>${statusLabel(gx.status)}</button>
      </td>
      <td class="remarks-cell"><textarea rows="1" placeholder="General note…">${esc(g.remarks)}</textarea></td>
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
      timer = setTimeout(()=>{
        const id = ta.closest('tr').dataset.id;
        writeGameField(id, 'remarks', ta.value);
      }, 700);
    });
    ta.addEventListener('blur', ()=>{
      const id = ta.closest('tr').dataset.id;
      writeGameField(id, 'remarks', ta.value);
    });
  });

  tbody.querySelectorAll('.status-cell').forEach(cell=>{
    const btn = cell.querySelector('.status-pill');
    btn.addEventListener('click', ()=> openStatusEditor(cell));
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
  editor.className = 'status-editor';
  editor.innerHTML = `
    <div class="opts">
      <button type="button" class="o-pending" data-v="pending" data-sel="${cur.status==='pending'}">Pending</button>
      <button type="button" class="o-ok" data-v="ok" data-sel="${cur.status==='ok'}">OK</button>
      <button type="button" class="o-issue" data-v="issue" data-sel="${cur.status==='issue'}">Issue</button>
    </div>
    <textarea rows="1" placeholder="Note (optional)">${esc(cur.note)}</textarea>
    <div class="close-row"><button type="button" class="close-btn">Close</button></div>
  `;
  cell.appendChild(editor);
  const ta = editor.querySelector('textarea');
  autosize(ta);

  let localStatus = cur.status;
  const commit = () => {
    writeGameField(id, field, { status: localStatus, note: ta.value });
  };

  editor.querySelectorAll('.opts button').forEach(b=>{
    b.addEventListener('click', ()=>{
      localStatus = b.dataset.v;
      editor.querySelectorAll('.opts button').forEach(x=>x.setAttribute('data-sel', x===b));
      commit();
    });
  });
  let timer;
  ta.addEventListener('input', ()=>{ autosize(ta); clearTimeout(timer); timer = setTimeout(commit, 700); });
  ta.addEventListener('blur', commit);
  editor.querySelector('.close-btn').addEventListener('click', ()=>{ commit(); editor.remove(); });
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
    grid.innerHTML = `<div style="color:var(--text-faint);font-size:12.5px;padding:6px 0">No colours yet — add one above.</div>`;
    return;
  }
  grid.innerHTML = state.palette.map(hex=>{
    const rgb = hexToRgb(hex);
    const rgbText = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '—';
    return `
    <div class="palette-item" data-hex="${hex}">
      <div class="palette-swatch" style="background:${hex}"></div>
      <div class="palette-meta">
        <button class="palette-remove" data-remove="${hex}" title="Remove colour" type="button">×</button>
        <span class="hex">${hex}</span>
        <span class="rgb">${rgbText}</span>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.palette-swatch').forEach(sw=>{
    sw.addEventListener('click', ()=> copyText(sw.parentElement.dataset.hex, null));
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
  <div class="slot-row" data-slot="${slot}">
    <div class="slot-swatch" style="background:${hex||'transparent'};${hex?'':'border-style:dashed'}"></div>
    <div class="slot-body">
      <span class="slot-label">${label}</span>
      <div class="slot-values">
        <input class="hex-input" value="${hex||''}" placeholder="#RRGGBB" data-team="${teamCode}" data-slot="${slot}">
        <span class="rgb-text">${rgbText}</span>
        <button type="button" class="copy-btn" data-copy="${hex||''}">Copy</button>
      </div>
    </div>
  </div>`;
}

function renderTeamColors(){
  const wrap = document.getElementById('teamsByContinent');
  const teams = state.teams;
  if(!Object.keys(teams).length){
    wrap.innerHTML = `<div style="color:var(--text-faint);padding:20px 0">${state.backendUrl ? 'No team colours loaded for this window yet.' : 'Connect a backend in Settings to load data.'}</div>`;
    return;
  }
  const byCont = {};
  Object.values(teams).forEach(t=>{ (byCont[t.continent] = byCont[t.continent]||[]).push(t); });

  wrap.innerHTML = CONT_ORDER.filter(c=>byCont[c]).map(c=>{
    const list = byCont[c].sort((a,b)=>a.name.localeCompare(b.name));
    const dotVar = {Africa:'--cont-africa-fg',Asia:'--cont-asia-fg',America:'--cont-americas-fg',Europe:'--cont-europe-fg'}[c];
    const cards = list.map(t=>`
      <div class="team-card" data-team="${t.code}">
        <div class="team-card-head"><span class="name">${esc(t.name)}</span><span class="code">${esc(t.code)}</span></div>
        ${slotRowHtml(t.code,'light','Light',t.light)}
        ${slotRowHtml(t.code,'dark','Dark',t.dark)}
        ${t.alternate
          ? slotRowHtml(t.code,'alternate','Alternate',t.alternate)
          : `<button type="button" class="add-alt-btn" data-add-alt="${t.code}">+ Add alternate colour</button>`}
      </div>
    `).join('');
    return `<div class="continent-block">
      <div class="continent-title"><span class="continent-flag" style="background:var(${dotVar})"></span><h3>${CONT_LABEL[c]}</h3><span class="continent-count">${list.length} teams</span></div>
      <div class="team-grid">${cards}</div>
    </div>`;
  }).join('');

  wrap.querySelectorAll('.hex-input').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const v = inp.value.trim();
      if(!v){ return; }
      if(!isValidHex(v)){ inp.style.borderColor = 'var(--status-issue-fg)'; return; }
      inp.style.borderColor = '';
      const hex = normHex(v);
      writeTeamField(inp.dataset.team, inp.dataset.slot, hex);
    });
  });
  wrap.querySelectorAll('.copy-btn').forEach(b=>{
    b.addEventListener('click', ()=>{ if(b.dataset.copy) copyText(b.dataset.copy, b); });
  });
  wrap.querySelectorAll('[data-add-alt]').forEach(b=>{
    b.addEventListener('click', ()=>{ writeTeamField(b.dataset.addAlt, 'alternate', '#FFFFFF'); });
  });
}

function writeTeamField(code, slot, hex){
  if(state.teams[code]) state.teams[code][slot] = hex;
  renderTeamColors();
  renderGames();
  renderPairing();
  if(!state.backendUrl) return;
  apiPost({ action: 'updateTeamColor', window: state.windowId, code, slot, hex }).catch(e=>console.error(e));
}

/* ---------------- pairing table ---------------- */

function renderPairing(){
  const tbody = document.getElementById('pairingBody');
  const list = state.games.slice().sort((a,b)=>a.sortKey-b.sortKey);
  if(!list.length){ tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-faint);padding:24px">No data yet</td></tr>`; return; }
  tbody.innerHTML = list.map(g=>`
    <tr class="cont-${g.continent}">
      <td class="date-col">${esc(g.dateLabel.replace(/^[A-Za-z]+,?\s*/,''))}</td>
      <td><div class="team-cell"><span class="swatch" style="background:${esc(g.homeColor.hex)}"></span>${esc(g.home)}</div></td>
      <td class="vs-col">–</td>
      <td><div class="team-cell"><span class="swatch" style="background:${esc(g.awayColor.hex)}"></span>${esc(g.away)}</div></td>
    </tr>
  `).join('');
}

init();
