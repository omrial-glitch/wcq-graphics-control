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
const state = {
  windowId: 'w4', tab: 'games', zone: 'all', search: '', colorContinent: 'Africa',
  games: [], teams: {}, palette: [],
  isAdmin: false, lastSync: null,
};

let auth, db;
let unsubGames = null, unsubTeams = null, unsubPalette = null;

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

function initFirebase(){
  firebase.initializeApp(FIREBASE_CONFIG);
  auth = firebase.auth();
  db = firebase.firestore();
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

function detachListeners(){
  if(unsubGames){ unsubGames(); unsubGames = null; }
  if(unsubTeams){ unsubTeams(); unsubTeams = null; }
  if(unsubPalette){ unsubPalette(); unsubPalette = null; }
}

function attachListeners(windowId){
  detachListeners();
  state.games = []; state.teams = {}; state.palette = [];
  setLiveBadge('connecting');
  setConnNote('');
  renderAll();

  unsubGames = db.collection(`windows/${windowId}/games`).onSnapshot(snap=>{
    state.games = snap.docs.map(d=>Object.assign({ id: d.id }, d.data()));
    setLiveBadge('live'); setConnNote(''); state.lastSync = new Date();
    renderAll();
  }, err=>{
    console.error(err);
    setConnNote('Could not read the schedule: ' + err.message);
    setLiveBadge('offline');
  });

  unsubTeams = db.collection(`windows/${windowId}/teams`).onSnapshot(snap=>{
    const t = {};
    snap.docs.forEach(d=>{ t[d.id] = Object.assign({ code: d.id }, d.data()); });
    state.teams = t;
    renderAll();
  }, err=>console.error(err));

  unsubPalette = db.collection('palette').onSnapshot(snap=>{
    state.palette = snap.docs.map(d=>d.data().hex);
    renderAll();
  }, err=>console.error(err));
}

function updateAuthUI(){
  document.getElementById('settingsSignOut').classList.toggle('hidden', !state.isAdmin);
  document.getElementById('settingsSave').textContent = state.isAdmin ? 'Signed in' : 'Sign in';
  document.getElementById('authModalTitle').textContent = state.isAdmin ? 'Signed in' : 'Sign in';
  document.getElementById('authModalLede').textContent = state.isAdmin
    ? `Signed in as ${auth.currentUser.email}.`
    : 'Sign in with the admin account to view and edit the schedule.';
}

function loadWindow(){
  if(!state.isAdmin){
    state.games = []; state.teams = {}; state.palette = [];
    setLiveBadge('offline');
    setConnNote('Sign in (gear icon) to view and edit the schedule.');
    renderAll();
    return;
  }
  attachListeners(state.windowId);
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
  initFirebase();

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

  document.addEventListener('click', (e)=>{
    if(e.target.closest('.pick-swatch, .palette-picker, [data-pick-game]')) return;
    const hadOpenPicker = document.querySelector('.palette-picker') !== null;
    document.querySelectorAll('.palette-picker').forEach(p=>p.remove());
    document.querySelectorAll('[data-slot-row], [data-game-slot]').forEach(r=>{ r.dataset.pickerOpen = 'false'; });
    if(hadOpenPicker) renderPairing();
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
    if(state.isAdmin) db.collection('palette').doc(hex.replace('#','')).set({ hex })
      .catch(e=>{ console.error(e); showToast('Could not save colour.', 'error'); });
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
    const teamDoc = { code, name, continent, light: null, dark: null, alternate: null };
    state.teams[code] = teamDoc;
    state.colorContinent = continent;
    renderColorContinentTabs(); renderTeamColors(); renderPairing();
    codeInput.value=''; nameInput.value='';
    if(state.isAdmin) db.doc(`windows/${state.windowId}/teams/${code}`).set(teamDoc)
      .catch(e=>{ console.error(e); showToast('Could not add team.', 'error'); });
  });

  document.getElementById('importSeedBtn').addEventListener('click', async ()=>{
    const btn = document.getElementById('importSeedBtn');
    btn.disabled = true; btn.textContent = 'Importing…';
    try{ await importSeedData(state.windowId); showToast('Import complete.', 'ok'); }
    catch(e){ console.error(e); showToast('Import failed: ' + e.message, 'error'); }
    btn.disabled = false; btn.textContent = 'Import ' + ((WINDOWS.find(w=>w.id===state.windowId)||{}).label || 'data');
  });

  wireSettingsModal();
  startClock();

  auth.onAuthStateChanged(user=>{
    state.isAdmin = !!(user && user.email === ADMIN_EMAIL);
    updateAuthUI();
    if(state.isAdmin){
      const backdrop = document.getElementById('settingsBackdrop');
      backdrop.classList.add('hidden'); backdrop.classList.remove('flex');
      loadWindow();
    } else {
      detachListeners();
      state.games = []; state.teams = {}; state.palette = [];
      setLiveBadge('offline');
      setConnNote('Sign in (gear icon) to view and edit the schedule.');
      renderAll();
      const backdrop = document.getElementById('settingsBackdrop');
      backdrop.classList.remove('hidden'); backdrop.classList.add('flex');
    }
  });
}

function wireSettingsModal(){
  const backdrop = document.getElementById('settingsBackdrop');
  const openModal = () => { backdrop.classList.remove('hidden'); backdrop.classList.add('flex'); };
  const closeModal = () => { backdrop.classList.add('hidden'); backdrop.classList.remove('flex'); };
  document.getElementById('settingsBtn').addEventListener('click', openModal);
  document.getElementById('settingsCancel').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) closeModal(); });
  document.getElementById('settingsSignOut').addEventListener('click', ()=>{ auth.signOut(); });
  document.getElementById('settingsSave').addEventListener('click', ()=>{
    if(state.isAdmin) return; // button reads "Signed in" then, no-op
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value;
    const errEl = document.getElementById('authError');
    errEl.classList.add('hidden');
    auth.signInWithEmailAndPassword(email, password).then(()=>{
      closeModal();
    }).catch(err=>{
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    });
  });
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
  // Firestore's realtime listener re-fires on every write, including our
  // own (both the instant local echo and the server-confirmed one) -- a
  // full table rebuild right then would yank focus out from under
  // whatever the user is typing. Skip the rebuild while a cell in this
  // table is focused; it'll catch up the moment they click away.
  if(tbody.contains(document.activeElement)) return;
  const banner = document.getElementById('emptyWindowBanner');
  const tableWrap = document.getElementById('gamesTableWrap');
  const list = filteredGames();

  if(!state.games.length){
    const winLabel = (WINDOWS.find(w=>w.id===state.windowId)||{}).label || 'this window';
    const importBtn = document.getElementById('importSeedBtn');
    const subtitle = document.getElementById('emptyWindowSubtitle');
    if(!state.isAdmin){
      document.getElementById('emptyWindowTitle').textContent = 'Sign in to view this window';
      subtitle.textContent = 'Click the gear icon and sign in with the admin account.';
      importBtn.classList.add('hidden');
    } else {
      document.getElementById('emptyWindowTitle').textContent = `No data yet for ${winLabel}`;
      const hasSeed = typeof SEED_DATA !== 'undefined' && SEED_DATA[state.windowId];
      if(hasSeed){
        subtitle.textContent = 'This window\'s data is ready to load from the Excel import prepared earlier.';
        importBtn.textContent = 'Import ' + winLabel;
        importBtn.classList.remove('hidden');
      } else {
        subtitle.textContent = 'Send the Excel files for this window to Claude and they\'ll be imported here — the schedule, crew and colours all come from a real import, never typed in by hand.';
        importBtn.classList.add('hidden');
      }
    }
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
        <textarea rows="3" placeholder="General note…" class="remarks-note w-full bg-[#0b0f19]/70 text-slate-300 text-xs leading-snug px-2 py-1.5 rounded border border-[#24334d] focus:border-blue-500 focus:ring-0 focus:outline-none resize-none overflow-y-auto">${esc(g.remarks)}</textarea>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
  wireGameRowEvents(tbody);
}

function autosize(ta){ ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight)+'px'; }

function wireGameRowEvents(tbody){
  tbody.querySelectorAll('textarea.remarks-note').forEach(inp=>{
    let timer;
    inp.addEventListener('input', ()=>{
      clearTimeout(timer);
      timer = setTimeout(()=>{ writeGameField(inp.closest('tr').dataset.id, 'remarks', inp.value); }, 700);
    });
    inp.addEventListener('blur', ()=>{
      writeGameField(inp.closest('tr').dataset.id, 'remarks', inp.value);
      setTimeout(renderGames, 50); // catch up on anything missed while this field had focus
    });
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
      if(state.isAdmin) db.doc(`windows/${state.windowId}/games/${id}`).update({ [field]: { status, note: ta.value } })
        .catch(e=>{ console.error(e); showToast('Could not save — check your connection.', 'error'); });
    };

    let timer;
    ta.addEventListener('input', ()=>{
      const status = currentStatus();
      if(status !== lastStatus){ restyleStatusWidget(widget, status); lastStatus = status; }
      clearTimeout(timer);
      timer = setTimeout(()=> persist(currentStatus()), 700);
    });
    ta.addEventListener('blur', ()=>{ persist(currentStatus()); setTimeout(renderGames, 50); });
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
  if(!state.isAdmin) return;
  db.doc(`windows/${state.windowId}/games/${id}`).update({ [field]: value })
    .catch(e=>{ console.error(e); showToast('Could not save — check your connection.', 'error'); });
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
      if(state.isAdmin) db.collection('palette').doc(hex.replace('#','')).delete()
        .catch(e=>{ console.error(e); showToast('Could not remove colour.', 'error'); });
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
  if(wrap.contains(document.activeElement)) return; // don't yank focus while editing a hex field
  const teams = state.teams;
  document.getElementById('colorsColTitle').textContent = `Team Colours — ${CONT_LABEL[state.colorContinent]}`;
  document.getElementById('fixturesColTitle').textContent = `${CONT_LABEL[state.colorContinent]} Fixtures`;
  if(!Object.keys(teams).length){
    wrap.innerHTML = `<div class="text-slate-500 text-xs py-4">${state.isAdmin ? 'No team colours loaded for this window yet.' : 'Sign in via the gear icon to load data.'}</div>`;
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
      if(state.isAdmin) db.doc(`windows/${state.windowId}/teams/${code}`).delete()
        .catch(e=>{ console.error(e); showToast('Could not delete team.', 'error'); });
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
  if(!state.isAdmin) return;
  db.doc(`windows/${state.windowId}/teams/${code}`).update({ [slot]: hex })
    .catch(e=>{ console.error(e); showToast('Could not save colour.', 'error'); });
}

/* ---------------- pairing table ---------------- */

function teamColorPickerHtml(gameId, side, teamCode){
  const t = state.teams[teamCode];
  const options = t ? [['light','Light',t.light], ['dark','Dark',t.dark], ['alternate','Alternate',t.alternate]].filter(o=>o[2]) : [];
  const anchor = side === 'home' ? 'right-0' : 'left-0';
  if(!options.length) return `<div class="palette-picker absolute z-20 top-full ${anchor} mt-1 text-[10px] text-slate-500 py-1 px-2 bg-[#0b0f19] border border-[#2d3a54] rounded-lg shadow-xl whitespace-nowrap">${teamCode} has no colours defined yet — set them in the Team Colours cards above.</div>`;
  return `
  <div class="palette-picker absolute z-20 top-full ${anchor} mt-1 flex flex-wrap gap-1.5 p-2 bg-[#0b0f19] border border-[#2d3a54] rounded-lg shadow-xl w-max">
    ${options.map(([slot,label,hex])=>`
      <button type="button" class="flex items-center gap-1.5 px-2 py-1 rounded border border-white/10 bg-[#111827] hover:bg-[#1a2234]" data-pick-apply="${gameId}:${side}:${hex}" title="${hex}">
        <span class="w-4 h-4 rounded border border-white/15" style="background:${hex}"></span>
        <span class="text-[10px] text-slate-300">${label}</span>
      </button>`).join('')}
  </div>`;
}

function contrastTextColor(hex){
  if(!hex) return '#FFFFFF';
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  if([r,g,b].some(isNaN)) return '#FFFFFF';
  const luminance = 0.299*r + 0.587*g + 0.114*b;
  return luminance > 150 ? '#252525' : '#FFFFFF';
}

function teamStripeHtml(gameId, homeCode, homeHex, awayCode, awayHex){
  const homeText = contrastTextColor(homeHex);
  const awayText = contrastTextColor(awayHex);
  return `
  <div class="score-stripe">
    <button type="button" class="stripe-team stripe-home" style="background:${esc(homeHex)};color:${homeText}" data-pick-game="${gameId}:home:${homeCode}" title="Set ${esc(homeCode)}'s colour for this game only">
      <span class="stripe-code">${esc(homeCode)}</span>
    </button>
    <div class="stripe-gap"></div>
    <button type="button" class="stripe-team stripe-away" style="background:${esc(awayHex)};color:${awayText}" data-pick-game="${gameId}:away:${awayCode}" title="Set ${esc(awayCode)}'s colour for this game only">
      <span class="stripe-code">${esc(awayCode)}</span>
    </button>
  </div>`;
}

function renderPairing(){
  const tbody = document.getElementById('pairingBody');
  if(tbody.querySelector('[data-picker-open="true"]')) return;
  const list = state.games.filter(g=>g.continent===state.colorContinent).slice().sort((a,b)=>a.sortKey-b.sortKey);
  if(!list.length){ tbody.innerHTML = `<tr><td colspan="2" class="text-center text-slate-500 py-6">No fixtures for this confederation yet</td></tr>`; return; }
  tbody.innerHTML = list.map(g=>`
    <tr data-fixture-row="${g.id}">
      <td class="py-2 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap align-top">${esc(g.dateLabel.replace(/^[A-Za-z]+,?\s*/,''))}</td>
      <td class="py-2 px-3 align-top relative" data-game-slot="${g.id}">${teamStripeHtml(g.id, g.home, g.homeColor.hex, g.away, g.awayColor.hex)}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-pick-game]').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      const row = sw.closest('[data-game-slot]');
      document.querySelectorAll('.palette-picker').forEach(p=>p.remove());
      const wasOpenHere = row.dataset.pickerOpen === 'true';
      tbody.querySelectorAll('[data-game-slot]').forEach(r=>r.dataset.pickerOpen='false');
      if(wasOpenHere) return;
      const [gameId, side, teamCode] = sw.dataset.pickGame.split(':');
      row.insertAdjacentHTML('beforeend', teamColorPickerHtml(gameId, side, teamCode));
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
  if(!state.isAdmin) return;
  db.doc(`windows/${state.windowId}/games/${gameId}`).update({ [field]: { hex, slot: 'custom' } })
    .catch(e=>{ console.error(e); showToast('Could not save colour.', 'error'); });
  const pubField = side === 'home' ? 'homeColorHex' : 'awayColorHex';
  db.doc(`windows/${state.windowId}/publicPairings/${gameId}`).update({ [pubField]: hex })
    .catch(e=>console.error('publicPairings mirror failed', e));
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

/* ---------------- one-time seed import ---------------- */

async function importSeedData(windowId){
  const seed = (typeof SEED_DATA !== 'undefined') ? SEED_DATA[windowId] : null;
  if(!seed) throw new Error('No seed data prepared for this window');

  const winLabel = (WINDOWS.find(w=>w.id===windowId)||{}).label || windowId;
  const batches = [];
  let batch = db.batch();
  let opCount = 0;
  function addOp(ref, data){
    batch.set(ref, data);
    opCount++;
    if(opCount >= 400){ batches.push(batch); batch = db.batch(); opCount = 0; }
  }

  seed.games.forEach(g=>{
    addOp(db.doc(`windows/${windowId}/games/${g.id}`), g);
    addOp(db.doc(`windows/${windowId}/publicPairings/${g.id}`), {
      id: g.id, dateLabel: g.dateLabel, dateISO: g.dateISO, sortKey: g.sortKey,
      home: g.home, away: g.away,
      homeColorHex: g.homeColor.hex, awayColorHex: g.awayColor.hex,
      continent: g.continent,
    });
  });
  Object.entries(seed.teams).forEach(([code, t])=>{
    addOp(db.doc(`windows/${windowId}/teams/${code}`), t);
  });
  seed.palette.forEach(hex=>{
    addOp(db.collection('palette').doc(hex.replace('#','')), { hex });
  });
  addOp(db.doc(`windows/${windowId}`), { id: windowId, label: winLabel, active: true });

  batches.push(batch);
  for(const b of batches) await b.commit();
}

init();
