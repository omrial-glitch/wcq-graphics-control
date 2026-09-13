// Filled in once the Apps Script backend is deployed. Until then the page
// renders from the embedded snapshot below so it always works standalone.
const BACKEND_URL = "__BACKEND_URL__";
const WINDOW_ID = "w4";

const SEED_TEAMS = {"ANG":{"code":"ANG","name":"ANGOLA","continent":"Africa","light":"#FFFFFF","dark":"#000000","alternate":null},"CMR":{"code":"CMR","name":"CAMEROON","continent":"Africa","light":"#FFFFFF","dark":"#0E5034","alternate":null},"CPV":{"code":"CPV","name":"CAPE VERDE","continent":"Africa","light":"#FFFFFF","dark":"#072D94","alternate":null},"COD":{"code":"COD","name":"CONGO DR","continent":"Africa","light":"#F6D412","dark":"#072D94","alternate":null},"CIV":{"code":"CIV","name":"COTE D'IVOIRE","continent":"Africa","light":"#FFFFFF","dark":"#f37045","alternate":null},"EGY":{"code":"EGY","name":"EGYPT","continent":"Africa","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"GUI":{"code":"GUI","name":"GUINEA","continent":"Africa","light":"#FFFFFF","dark":"#0E5034","alternate":"#C00000"},"MLI":{"code":"MLI","name":"MALI","continent":"Africa","light":"#FFFFFF","dark":"#0E5034","alternate":null},"NGR":{"code":"NGR","name":"NIGERIA","continent":"Africa","light":"#FFFFFF","dark":"#00B050","alternate":null},"SEN":{"code":"SEN","name":"SENEGAL","continent":"Africa","light":"#FFFFFF","dark":"#008000","alternate":null},"SSD":{"code":"SSD","name":"SOUTH SUDAN","continent":"Africa","light":"#FFFFFF","dark":"#000000","alternate":null},"TUN":{"code":"TUN","name":"TUNISIA","continent":"Africa","light":"#FFFFFF","dark":"#C00000","alternate":null},"ARG":{"code":"ARG","name":"ARGENTINA","continent":"America","light":"#FFFFFF","dark":"#243D5B","alternate":null},"BAH":{"code":"BAH","name":"BAHAMAS","continent":"America","light":"#FFFFFF","dark":"#0070C0","alternate":null},"BRA":{"code":"BRA","name":"BRAZIL","continent":"America","light":"#FFFFFF","dark":"#0E5034","alternate":null},"CAN":{"code":"CAN","name":"CANADA","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":null},"CHI":{"code":"CHI","name":"CHILE","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":null},"COL":{"code":"COL","name":"COLOMBIA","continent":"America","light":"#FFEA00","dark":"#020259","alternate":null},"DOM":{"code":"DOM","name":"DOMINICAN REPUBLIC","continent":"America","light":"#FFFFFF","dark":"#294A8F","alternate":null},"MEX":{"code":"MEX","name":"MEXICO","continent":"America","light":"#FFFFFF","dark":"#000000","alternate":null},"PAN":{"code":"PAN","name":"PANAMA","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":null},"PUR":{"code":"PUR","name":"PUERTO RICO","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":"#0070C0"},"URU":{"code":"URU","name":"URUGUAY","continent":"America","light":"#8ECAE6","dark":"#002060","alternate":null},"USA":{"code":"USA","name":"USA","continent":"America","light":"#FFFFFF","dark":"#13314D","alternate":null},"AUS":{"code":"AUS","name":"AUSTRALIA","continent":"Asia","light":"#FBF6CA","dark":"#0E5034","alternate":null},"CHN":{"code":"CHN","name":"CHINA","continent":"Asia","light":"#FFFFFF","dark":"#C00000","alternate":null},"IRI":{"code":"IRI","name":"IRAN","continent":"Asia","light":"#FFFFFF","dark":"#970000","alternate":null},"JPN":{"code":"JPN","name":"JAPAN","continent":"Asia","light":"#FFFFFF","dark":"#970000","alternate":null},"JOR":{"code":"JOR","name":"JORDAN","continent":"Asia","light":"#FFFFFF","dark":"#000000","alternate":null},"KOR":{"code":"KOR","name":"KOREA","continent":"Asia","light":"#FFFFFF","dark":"#002060","alternate":null},"LBN":{"code":"LBN","name":"LEBANON","continent":"Asia","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"NZL":{"code":"NZL","name":"NEW ZEALAND","continent":"Asia","light":"#FFFFFF","dark":"#000000","alternate":null},"PHI":{"code":"PHI","name":"PHILIPPINES","continent":"Asia","light":"#FFFFFF","dark":"#294A8F","alternate":null},"QAT":{"code":"QAT","name":"QATAR","continent":"Asia","light":"#FFFFFF","dark":"#571F41","alternate":null},"KSA":{"code":"KSA","name":"SAUDI ARABIA","continent":"Asia","light":"#FFFFFF","dark":"#0E5034","alternate":null},"SYR":{"code":"SYR","name":"SYRIA","continent":"Asia","light":"#FFFFFF","dark":"#168A4F","alternate":null},"BIH":{"code":"BIH","name":"BOSNIA AND HERZEGOVINA","continent":"Europe","light":"#FFFFFF","dark":"#262D68","alternate":"#F6D412"},"CRO":{"code":"CRO","name":"CROATIA","continent":"Europe","light":"#FFFFFF","dark":"#571F41","alternate":null},"EST":{"code":"EST","name":"ESTONIA","continent":"Europe","light":"#FFFFFF","dark":"#0070C0","alternate":null},"FIN":{"code":"FIN","name":"FINLAND","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"FRA":{"code":"FRA","name":"FRANCE","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"GEO":{"code":"GEO","name":"GEORGIA","continent":"Europe","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"GER":{"code":"GER","name":"GERMANY","continent":"Europe","light":"#FFFFFF","dark":"#000000","alternate":null},"GRE":{"code":"GRE","name":"GREECE","continent":"Europe","light":"#FFFFFF","dark":"#072D94","alternate":null},"HUN":{"code":"HUN","name":"HUNGARY","continent":"Europe","light":"#FFFFFF","dark":"#C00000","alternate":null},"ISL":{"code":"ISL","name":"ICELAND","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"ISR":{"code":"ISR","name":"ISRAEL","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"ITA":{"code":"ITA","name":"ITALY","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"LAT":{"code":"LAT","name":"LATVIA","continent":"Europe","light":"#FFFFFF","dark":"#6E0C29","alternate":null},"LTU":{"code":"LTU","name":"LITHUANIA","continent":"Europe","light":"#FFFFFF","dark":"#0E5034","alternate":null},"MNE":{"code":"MNE","name":"MONTENEGRO","continent":"Europe","light":"#FFFFFF","dark":"#FF0000","alternate":null},"NED":{"code":"NED","name":"NETHERLANDS","continent":"Europe","light":"#FFFFFF","dark":"#f37045","alternate":null},"POL":{"code":"POL","name":"POLAND","continent":"Europe","light":"#FFFFFF","dark":"#C00000","alternate":null},"POR":{"code":"POR","name":"PORTUGAL","continent":"Europe","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"SRB":{"code":"SRB","name":"SERBIA","continent":"Europe","light":"#FFFFFF","dark":"#262D68","alternate":null},"SLO":{"code":"SLO","name":"SLOVENIA","continent":"Europe","light":"#FFFFFF","dark":"#0087CB","alternate":null},"ESP":{"code":"ESP","name":"SPAIN","continent":"Europe","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"SWE":{"code":"SWE","name":"SWEDEN","continent":"Europe","light":"#F6D412","dark":"#002060","alternate":null},"TUR":{"code":"TUR","name":"TURKIYE","continent":"Europe","light":"#FFFFFF","dark":"#C00000","alternate":null},"UKR":{"code":"UKR","name":"UKRAINE","continent":"Europe","light":"#F6D412","dark":"#0070C0","alternate":null}};
const SEED_PALETTE = ["#FF0000","#C00000","#A71E2A","#970000","#002060","#13314D","#0000EC","#020259","#262D68","#294A8F","#0070C0","#243D5B","#005779","#0087CB","#072D94","#00B0F0","#8ECAE6","#00B050","#008000","#006400","#168A4F","#0E5034","#000000","#262626","#3B455E","#FFFF00","#FFBF00","#FFEA00","#F6D412","#FBF6CA","#F2EDE5","#7030A0","#571F41","#6E0C29","#F37045","#F99728"];
const SEED_PAIRINGS = [{"dateShort":"August 27","home":"PAN","away":"CAN","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"August 27","home":"MEX","away":"COL","homeColor":"#000000","awayColor":"#FFEA00","continent":"America"},{"dateShort":"August 27","home":"GUI","away":"SSD","homeColor":"#FFFFFF","awayColor":"#000000","continent":"Africa"},{"dateShort":"August 27","home":"ANG","away":"COD","homeColor":"#FFFFFF","awayColor":"#072D94","continent":"Africa"},{"dateShort":"August 27","home":"NGR","away":"CMR","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"Africa"},{"dateShort":"August 27","home":"MLI","away":"CIV","homeColor":"#FFFFFF","awayColor":"#f37045","continent":"Africa"},{"dateShort":"August 27","home":"FIN","away":"SWE","homeColor":"#294A8F","awayColor":"#F6D412","continent":"Europe"},{"dateShort":"August 27","home":"HUN","away":"EST","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 27","home":"QAT","away":"CHN","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"Asia"},{"dateShort":"August 27","home":"KSA","away":"JPN","homeColor":"#FFFFFF","awayColor":"#970000","continent":"Asia"},{"dateShort":"August 27","home":"TUN","away":"CPV","homeColor":"#FFFFFF","awayColor":"#072D94","continent":"Africa"},{"dateShort":"August 27","home":"LBN","away":"KOR","homeColor":"#FFFFFF","awayColor":"#002060","continent":"Asia"},{"dateShort":"August 27","home":"CRO","away":"LAT","homeColor":"#FFFFFF","awayColor":"#6E0C29","continent":"Europe"},{"dateShort":"August 27","home":"GER","away":"NED","homeColor":"#FFFFFF","awayColor":"#f37045","continent":"Europe"},{"dateShort":"August 27","home":"ISR","away":"POL","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"Europe"},{"dateShort":"August 27","home":"EGY","away":"SEN","homeColor":"#FFFFFF","awayColor":"#008000","continent":"Africa"},{"dateShort":"August 27","home":"FRA","away":"SLO","homeColor":"#294A8F","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 27","home":"ARG","away":"PUR","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"America"},{"dateShort":"August 27","home":"CHI","away":"USA","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"August 27","home":"BRA","away":"DOM","homeColor":"#FFFFFF","awayColor":"#294A8F","continent":"America"},{"dateShort":"August 27","home":"URU","away":"BAH","homeColor":"#8ECAE6","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"August 28","home":"IRI","away":"NZL","homeColor":"#970000","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"August 28","home":"SYR","away":"AUS","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"Asia"},{"dateShort":"August 28","home":"SSD","away":"NGR","homeColor":"#FFFFFF","awayColor":"#00B050","continent":"Africa"},{"dateShort":"August 28","home":"JOR","away":"PHI","homeColor":"#FFFFFF","awayColor":"#294A8F","continent":"Asia"},{"dateShort":"August 28","home":"CPV","away":"GUI","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"Africa"},{"dateShort":"August 28","home":"GEO","away":"MNE","homeColor":"#FFFFFF","awayColor":"#FF0000","continent":"Europe"},{"dateShort":"August 28","home":"UKR","away":"GRE","homeColor":"#F6D412","awayColor":"#072D94","continent":"Europe"},{"dateShort":"August 28","home":"CMR","away":"TUN","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"Africa"},{"dateShort":"August 28","home":"TUR","away":"LTU","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"Europe"},{"dateShort":"August 28","home":"SRB","away":"ISL","homeColor":"#FFFFFF","awayColor":"#294A8F","continent":"Europe"},{"dateShort":"August 28","home":"BIH","away":"ITA","homeColor":"#FFFFFF","awayColor":"#294A8F","continent":"Europe"},{"dateShort":"August 28","home":"ESP","away":"POR","homeColor":"#FFFFFF","awayColor":"#A71E2A","continent":"Europe"},{"dateShort":"August 29","home":"CIV","away":"EGY","homeColor":"#FFFFFF","awayColor":"#A71E2A","continent":"Africa"},{"dateShort":"August 29","home":"COD","away":"MLI","homeColor":"#F6D412","awayColor":"#0E5034","continent":"Africa"},{"dateShort":"August 29","home":"SEN","away":"ANG","homeColor":"#FFFFFF","awayColor":"#000000","continent":"Africa"},{"dateShort":"August 30","home":"NZL","away":"SYR","homeColor":"#000000","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"August 30","home":"AUS","away":"JOR","homeColor":"#0E5034","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"August 30","home":"PHI","away":"IRI","homeColor":"#FFFFFF","awayColor":"#970000","continent":"Asia"},{"dateShort":"August 30","home":"NGR","away":"CPV","homeColor":"#FFFFFF","awayColor":"#072D94","continent":"Africa"},{"dateShort":"August 30","home":"EGY","away":"COD","homeColor":"#FFFFFF","awayColor":"#072D94","continent":"Africa"},{"dateShort":"August 30","home":"NED","away":"CRO","homeColor":"#f37045","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 30","home":"POL","away":"GER","homeColor":"#FFFFFF","awayColor":"#000000","continent":"Europe"},{"dateShort":"August 30","home":"GUI","away":"CMR","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"Africa"},{"dateShort":"August 30","home":"ANG","away":"CIV","homeColor":"#FFFFFF","awayColor":"#f37045","continent":"Africa"},{"dateShort":"August 30","home":"SWE","away":"FRA","homeColor":"#F6D412","awayColor":"#294A8F","continent":"Europe"},{"dateShort":"August 30","home":"LAT","away":"ISR","homeColor":"#FFFFFF","awayColor":"#294A8F","continent":"Europe"},{"dateShort":"August 30","home":"EST","away":"FIN","homeColor":"#0070C0","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 30","home":"TUN","away":"SSD","homeColor":"#FFFFFF","awayColor":"#000000","continent":"Africa"},{"dateShort":"August 30","home":"SLO","away":"HUN","homeColor":"#0087CB","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 30","home":"MLI","away":"SEN","homeColor":"#FFFFFF","awayColor":"#008000","continent":"Africa"},{"dateShort":"August 31","home":"DOM","away":"CHI","homeColor":"#294A8F","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"August 31","home":"BAH","away":"PAN","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"America"},{"dateShort":"August 31","home":"MEX","away":"BRA","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"America"},{"dateShort":"August 31","home":"KOR","away":"KSA","homeColor":"#002060","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"August 31","home":"JPN","away":"QAT","homeColor":"#970000","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"August 31","home":"CHN","away":"LBN","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"August 31","home":"LTU","away":"BIH","homeColor":"#0E5034","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 31","home":"GRE","away":"ESP","homeColor":"#FFFFFF","awayColor":"#A71E2A","continent":"Europe"},{"dateShort":"August 31","home":"ITA","away":"SRB","homeColor":"#294A8F","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 31","home":"POR","away":"GEO","homeColor":"#FFFFFF","awayColor":"#A71E2A","continent":"Europe"},{"dateShort":"August 31","home":"MNE","away":"UKR","homeColor":"#FFFFFF","awayColor":"#0070C0","continent":"Europe"},{"dateShort":"August 31","home":"ISL","away":"TUR","homeColor":"#294A8F","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"August 31","home":"USA","away":"COL","homeColor":"#FFFFFF","awayColor":"#020259","continent":"America"},{"dateShort":"August 31","home":"CAN","away":"ARG","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"August 31","home":"URU","away":"PUR","homeColor":"#8ECAE6","awayColor":"#C00000","continent":"America"}];

const CONT_ORDER = ["Africa", "America", "Asia", "Europe"];
const CONT_LABEL = { Africa: "Africa", America: "Americas", Asia: "Asia", Europe: "Europe" };

let TEAMS = SEED_TEAMS;
let PALETTE = SEED_PALETTE;
let PAIRINGS = SEED_PAIRINGS;
let search = "";

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

function renderPalette(){
  const grid = document.getElementById('paletteGrid');
  grid.innerHTML = PALETTE.map(hex=>{
    const rgb = hexToRgb(hex);
    const rgbText = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '—';
    return `
    <div class="palette-item" data-hex="${hex}">
      <div class="palette-swatch" style="background:${hex}"></div>
      <div class="palette-meta">
        <span class="hex">${hex}</span>
        <span class="rgb">${rgbText}</span>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.palette-item').forEach(item=>{
    item.style.cursor = 'pointer';
    item.addEventListener('click', ()=> copyText(item.dataset.hex, null));
  });
}

function slotRow(label, hex){
  if(!hex) return '';
  const rgb = hexToRgb(hex);
  const rgbText = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '—';
  return `
  <div class="slot-row">
    <div class="slot-swatch" style="background:${hex}"></div>
    <div class="slot-body">
      <span class="slot-label">${label}</span>
      <div class="slot-values">
        <span class="hex-text">${hex.toUpperCase()}</span>
        <span class="rgb-text">${rgbText}</span>
        <button type="button" class="copy-btn" data-copy="${hex}">Copy</button>
      </div>
    </div>
  </div>`;
}

function teamMatches(t){
  if(!search) return true;
  const hay = (t.name + ' ' + t.code).toLowerCase();
  return hay.includes(search);
}
function pairingMatches(g){
  if(!search) return true;
  const hay = (g.home + ' ' + g.away).toLowerCase();
  return hay.includes(search);
}

function renderTeams(){
  const wrap = document.getElementById('teamsByContinent');
  const byCont = {};
  Object.values(TEAMS).forEach(t=>{ if(teamMatches(t)) (byCont[t.continent]=byCont[t.continent]||[]).push(t); });
  const contsWithData = CONT_ORDER.filter(c=>byCont[c] && byCont[c].length);
  if(!contsWithData.length){
    wrap.innerHTML = `<div class="empty-note">No teams match "${esc(search)}".</div>`;
    return;
  }
  const dotVarMap = {Africa:'--cont-africa-fg',Asia:'--cont-asia-fg',America:'--cont-americas-fg',Europe:'--cont-europe-fg'};
  wrap.innerHTML = contsWithData.map(c=>{
    const list = byCont[c].sort((a,b)=>a.name.localeCompare(b.name));
    const cards = list.map(t=>`
      <div class="card team-card-view">
        <div class="team-card-head"><span class="name">${esc(t.name)}</span><span class="code">${esc(t.code)}</span></div>
        ${slotRow('Light', t.light)}
        ${slotRow('Dark', t.dark)}
        ${slotRow('Alternate', t.alternate)}
      </div>`).join('');
    return `<div class="continent-block">
      <div class="continent-title"><span class="continent-flag" style="background:var(${dotVarMap[c]})"></span><h3>${CONT_LABEL[c]}</h3><span class="continent-count">${list.length} teams</span></div>
      <div class="team-grid">${cards}</div>
    </div>`;
  }).join('');
  wrap.querySelectorAll('.copy-btn').forEach(b=>{
    b.addEventListener('click', ()=> copyText(b.dataset.copy, b));
  });
}

function renderPairing(){
  const tbody = document.getElementById('pairingBody');
  const list = PAIRINGS.filter(pairingMatches);
  const section = document.getElementById('pairingSection');
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">No fixtures match "${esc(search)}".</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(g=>`
    <tr class="cont-${g.continent}">
      <td class="date-col">${esc(g.dateShort)}</td>
      <td><div class="team-cell"><span class="swatch" style="background:${esc(g.homeColor)}"></span>${esc(g.home)}</div></td>
      <td class="vs-col">–</td>
      <td><div class="team-cell"><span class="swatch" style="background:${esc(g.awayColor)}"></span>${esc(g.away)}</div></td>
    </tr>`).join('');
}

function renderAll(){
  renderPalette();
  renderTeams();
  renderPairing();
}

async function loadLive(){
  if(!BACKEND_URL || BACKEND_URL.indexOf('__') === 0) return;
  try{
    const url = new URL(BACKEND_URL);
    url.searchParams.set('action', 'colors');
    url.searchParams.set('window', WINDOW_ID);
    const res = await fetch(url.toString());
    const data = await res.json();
    if(data && data.teams && Object.keys(data.teams).length){
      TEAMS = data.teams;
      PALETTE = (data.palette && data.palette.length) ? data.palette : PALETTE;
      PAIRINGS = data.pairings || PAIRINGS;
      renderAll();
    }
  }catch(e){ /* keep the static snapshot on any failure */ }
}

document.getElementById('searchInput').addEventListener('input', (e)=>{
  search = e.target.value.trim().toLowerCase();
  renderTeams();
  renderPairing();
});

renderAll();
loadLive();
