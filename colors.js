// Filled in once the Apps Script backend is deployed. Until then the page
// renders from the embedded snapshot below so it always works standalone.
const WINDOW_ID = "w5";

const SEED_TEAMS = {"ARG":{"code":"ARG","name":"ARGENTINA","continent":"America","light":"#FFFFFF","dark":"#243D5B","alternate":null},"AUS":{"code":"AUS","name":"AUSTRALIA","continent":"Asia","light":"#FBF6CA","dark":"#0E5034","alternate":null},"BAH":{"code":"BAH","name":"BAHAMAS","continent":"America","light":"#FFFFFF","dark":"#0070C0","alternate":null},"BIH":{"code":"BIH","name":"BOSNIA AND HERZEGOVINA","continent":"Europe","light":"#FFFFFF","dark":"#262D68","alternate":"#F6D412"},"BRA":{"code":"BRA","name":"BRAZIL","continent":"America","light":"#FFFFFF","dark":"#0E5034","alternate":null},"CAN":{"code":"CAN","name":"CANADA","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":null},"CHI":{"code":"CHI","name":"CHILE","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":null},"CHN":{"code":"CHN","name":"CHINA","continent":"Asia","light":"#FFFFFF","dark":"#C00000","alternate":null},"COL":{"code":"COL","name":"COLOMBIA","continent":"America","light":"#FFEA00","dark":"#13314D","alternate":null},"CRO":{"code":"CRO","name":"CROATIA","continent":"Europe","light":"#FFFFFF","dark":"#571F41","alternate":null},"DOM":{"code":"DOM","name":"DOMINICAN REPUBLIC","continent":"America","light":"#FFFFFF","dark":"#294A8F","alternate":null},"ESP":{"code":"ESP","name":"SPAIN","continent":"Europe","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"EST":{"code":"EST","name":"ESTONIA","continent":"Europe","light":"#FFFFFF","dark":"#0070C0","alternate":null},"FIN":{"code":"FIN","name":"FINLAND","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"FRA":{"code":"FRA","name":"FRANCE","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"GEO":{"code":"GEO","name":"GEORGIA","continent":"Europe","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"GER":{"code":"GER","name":"GERMANY","continent":"Europe","light":"#FFFFFF","dark":"#000000","alternate":null},"GRE":{"code":"GRE","name":"GREECE","continent":"Europe","light":"#FFFFFF","dark":"#072D94","alternate":null},"HUN":{"code":"HUN","name":"HUNGARY","continent":"Europe","light":"#FFFFFF","dark":"#C00000","alternate":null},"IRI":{"code":"IRI","name":"IRAN","continent":"Asia","light":"#FFFFFF","dark":"#970000","alternate":null},"ISL":{"code":"ISL","name":"ICELAND","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"ISR":{"code":"ISR","name":"ISRAEL","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"ITA":{"code":"ITA","name":"ITALY","continent":"Europe","light":"#FFFFFF","dark":"#294A8F","alternate":null},"JOR":{"code":"JOR","name":"JORDAN","continent":"Asia","light":"#FFFFFF","dark":"#000000","alternate":null},"JPN":{"code":"JPN","name":"JAPAN","continent":"Asia","light":"#FFFFFF","dark":"#970000","alternate":null},"KOR":{"code":"KOR","name":"KOREA","continent":"Asia","light":"#FFFFFF","dark":"#002060","alternate":null},"KSA":{"code":"KSA","name":"SAUDI ARABIA","continent":"Asia","light":"#FFFFFF","dark":"#0E5034","alternate":null},"LAT":{"code":"LAT","name":"LATVIA","continent":"Europe","light":"#FFFFFF","dark":"#6E0C29","alternate":null},"LBN":{"code":"LBN","name":"LEBANON","continent":"Asia","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"LTU":{"code":"LTU","name":"LITHUANIA","continent":"Europe","light":"#FFFFFF","dark":"#0E5034","alternate":null},"MEX":{"code":"MEX","name":"MEXICO","continent":"America","light":"#FFFFFF","dark":"#000000","alternate":null},"MNE":{"code":"MNE","name":"MONTENEGRO","continent":"Europe","light":"#FFFFFF","dark":"#FF0000","alternate":null},"NED":{"code":"NED","name":"NETHERLANDS","continent":"Europe","light":"#FFFFFF","dark":"#f37045","alternate":null},"NZL":{"code":"NZL","name":"NEW ZEALAND","continent":"Asia","light":"#FFFFFF","dark":"#000000","alternate":null},"PAN":{"code":"PAN","name":"PANAMA","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":null},"PHI":{"code":"PHI","name":"PHILIPPINES","continent":"Asia","light":"#FFFFFF","dark":"#262D68","alternate":null},"POL":{"code":"POL","name":"POLAND","continent":"Europe","light":"#FFFFFF","dark":"#C00000","alternate":null},"POR":{"code":"POR","name":"PORTUGAL","continent":"Europe","light":"#FFFFFF","dark":"#A71E2A","alternate":null},"PUR":{"code":"PUR","name":"PUERTO RICO","continent":"America","light":"#FFFFFF","dark":"#C00000","alternate":"#0070C0"},"QAT":{"code":"QAT","name":"QATAR","continent":"Asia","light":"#FFFFFF","dark":"#571F41","alternate":null},"SLO":{"code":"SLO","name":"SLOVENIA","continent":"Europe","light":"#FFFFFF","dark":"#0087CB","alternate":null},"SRB":{"code":"SRB","name":"SERBIA","continent":"Europe","light":"#FFFFFF","dark":"#262D68","alternate":null},"SWE":{"code":"SWE","name":"SWEDEN","continent":"Europe","light":"#F6D412","dark":"#002060","alternate":null},"SYR":{"code":"SYR","name":"SYRIA","continent":"Asia","light":"#FFFFFF","dark":"#168A4F","alternate":null},"TUR":{"code":"TUR","name":"TURKIYE","continent":"Europe","light":"#FFFFFF","dark":"#C00000","alternate":null},"UKR":{"code":"UKR","name":"UKRAINE","continent":"Europe","light":"#F6D412","dark":"#0070C0","alternate":null},"URU":{"code":"URU","name":"URUGUAY","continent":"America","light":"#8ECAE6","dark":"#002060","alternate":null},"USA":{"code":"USA","name":"USA","continent":"America","light":"#FFFFFF","dark":"#13314D","alternate":null}};
const SEED_PALETTE = ["#FF0000","#C00000","#A71E2A","#970000","#002060","#13314D","#0000EC","#020259","#262D68","#294A8F","#0070C0","#243D5B","#005779","#0087CB","#072D94","#00B0F0","#8ECAE6","#00B050","#008000","#006400","#168A4F","#0E5034","#000000","#262626","#3B455E","#FFFF00","#FFBF00","#FFEA00","#F6D412","#FBF6CA","#F2EDE5","#7030A0","#571F41","#6E0C29","#F37045","#F99728"];
const SEED_PAIRINGS = [{"dateShort":"November 26","home":"KSA","away":"CHN","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"Asia"},{"dateShort":"November 26","home":"QAT","away":"KOR","homeColor":"#571F41","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"November 26","home":"LTU","away":"SRB","homeColor":"#0E5034","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 26","home":"MNE","away":"ESP","homeColor":"#FFFFFF","awayColor":"#A71E2A","continent":"Europe"},{"dateShort":"November 26","home":"GRE","away":"GEO","homeColor":"#FFFFFF","awayColor":"#A71E2A","continent":"Europe"},{"dateShort":"November 26","home":"POR","away":"UKR","homeColor":"#FFFFFF","awayColor":"#0070C0","continent":"Europe"},{"dateShort":"November 26","home":"LBN","away":"JPN","homeColor":"#FFFFFF","awayColor":"#970000","continent":"Asia"},{"dateShort":"November 26","home":"ITA","away":"TUR","homeColor":"#294A8F","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 26","home":"ISL","away":"BIH","homeColor":"#294A8F","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 26","home":"URU","away":"CAN","homeColor":"#8ECAE6","awayColor":"#C00000","continent":"America"},{"dateShort":"November 26","home":"ARG","away":"BAH","homeColor":"#243D5B","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"November 26","home":"PAN","away":"PUR","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"November 27","home":"JOR","away":"NZL","homeColor":"#000000","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"November 27","home":"IRI","away":"AUS","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"Asia"},{"dateShort":"November 27","home":"SYR","away":"PHI","homeColor":"#168A4F","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"November 27","home":"EST","away":"FRA","homeColor":"#0070C0","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 27","home":"LAT","away":"GER","homeColor":"#FFFFFF","awayColor":"#000000","continent":"Europe"},{"dateShort":"November 27","home":"SWE","away":"HUN","homeColor":"#F6D412","awayColor":"#C00000","continent":"Europe"},{"dateShort":"November 27","home":"NED","away":"ISR","homeColor":"#F37045","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 27","home":"SLO","away":"FIN","homeColor":"#0087CB","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 27","home":"POL","away":"CRO","homeColor":"#FFFFFF","awayColor":"#571F41","continent":"Europe"},{"dateShort":"November 27","home":"CHI","away":"MEX","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"November 27","home":"BRA","away":"USA","homeColor":"#FFFFFF","awayColor":"#13314D","continent":"America"},{"dateShort":"November 27","home":"COL","away":"DOM","homeColor":"#FFEA00","awayColor":"#294A8F","continent":"America"},{"dateShort":"November 29","home":"SYR","away":"NZL","homeColor":"#168A4F","awayColor":"#FFFFFF","continent":"Asia"},{"dateShort":"November 29","home":"IRI","away":"PHI","homeColor":"#FFFFFF","awayColor":"#262D68","continent":"Asia"},{"dateShort":"November 29","home":"JOR","away":"AUS","homeColor":"#000000","awayColor":"#FBF6CA","continent":"Asia"},{"dateShort":"November 29","home":"QAT","away":"JPN","homeColor":"#FFFFFF","awayColor":"#970000","continent":"Asia"},{"dateShort":"November 29","home":"GEO","away":"POR","homeColor":"#FFFFFF","awayColor":"#A71E2A","continent":"Europe"},{"dateShort":"November 29","home":"TUR","away":"ISL","homeColor":"#FFFFFF","awayColor":"#294A8F","continent":"Europe"},{"dateShort":"November 29","home":"KSA","away":"KOR","homeColor":"#FFFFFF","awayColor":"#002060","continent":"Asia"},{"dateShort":"November 29","home":"UKR","away":"MNE","homeColor":"#F6D412","awayColor":"#FF0000","continent":"Europe"},{"dateShort":"November 29","home":"ESP","away":"GRE","homeColor":"#FFFFFF","awayColor":"#072D94","continent":"Europe"},{"dateShort":"November 29","home":"BIH","away":"LTU","homeColor":"#FFFFFF","awayColor":"#0E5034","continent":"Europe"},{"dateShort":"November 29","home":"SRB","away":"ITA","homeColor":"#FFFFFF","awayColor":"#294A8F","continent":"Europe"},{"dateShort":"November 29","home":"LBN","away":"CHN","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"Asia"},{"dateShort":"November 29","home":"ARG","away":"CAN","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"America"},{"dateShort":"November 29","home":"PAN","away":"BAH","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"November 29","home":"PUR","away":"URU","homeColor":"#FFFFFF","awayColor":"#002060","continent":"America"},{"dateShort":"November 30","home":"FIN","away":"EST","homeColor":"#294A8F","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 30","home":"HUN","away":"SLO","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"Europe"},{"dateShort":"November 30","home":"ISR","away":"LAT","homeColor":"#FFFFFF","awayColor":"#6E0C29","continent":"Europe"},{"dateShort":"November 30","home":"GER","away":"POL","homeColor":"#FFFFFF","awayColor":"#C00000","continent":"Europe"},{"dateShort":"November 30","home":"CRO","away":"NED","homeColor":"#FFFFFF","awayColor":"#F37045","continent":"Europe"},{"dateShort":"November 30","home":"FRA","away":"SWE","homeColor":"#294A8F","awayColor":"#F6D412","continent":"Europe"},{"dateShort":"November 30","home":"CHI","away":"DOM","homeColor":"#C00000","awayColor":"#FFFFFF","continent":"America"},{"dateShort":"November 30","home":"BRA","away":"MEX","homeColor":"#FFFFFF","awayColor":"#000000","continent":"America"},{"dateShort":"November 30","home":"COL","away":"USA","homeColor":"#FFEA00","awayColor":"#13314D","continent":"America"}];

const CONT_ORDER = ["Africa", "America", "Asia", "Europe"];
const CONT_LABEL = { Africa: "Africa", America: "Americas", Asia: "Asia", Europe: "Europe" };
const ZONE_HEX = { Africa: "4ade80", America: "f87171", Asia: "facc15", Europe: "60a5fa" };
// FIBA team code -> ISO 3166 alpha-2, for the flag images next to each team name.
const FLAG_ISO = { ANG: "ao", CMR: "cm", CPV: "cv", COD: "cd", CIV: "ci", EGY: "eg", GUI: "gn", MLI: "ml", NGR: "ng", SEN: "sn", SSD: "ss", TUN: "tn", ARG: "ar", BAH: "bs", BRA: "br", CAN: "ca", CHI: "cl", COL: "co", DOM: "do", MEX: "mx", PAN: "pa", PUR: "pr", URU: "uy", USA: "us", AUS: "au", CHN: "cn", IRI: "ir", JPN: "jp", JOR: "jo", KOR: "kr", LBN: "lb", NZL: "nz", PHI: "ph", QAT: "qa", KSA: "sa", SYR: "sy", BIH: "ba", CRO: "hr", EST: "ee", FIN: "fi", FRA: "fr", GEO: "ge", GER: "de", GRE: "gr", HUN: "hu", ISL: "is", ISR: "il", ITA: "it", LAT: "lv", LTU: "lt", MNE: "me", NED: "nl", POL: "pl", POR: "pt", SRB: "rs", SLO: "si", ESP: "es", SWE: "se", TUR: "tr", UKR: "ua" };

let TEAMS = SEED_TEAMS;
let PALETTE = SEED_PALETTE;
let PAIRINGS = SEED_PAIRINGS;
let search = "";
let activeContinent = "Africa";

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
    setTimeout(()=>{ btnEl.textContent = prev; }, 1200);
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
    <div class="border border-[#2d3a54] rounded-lg overflow-hidden bg-[#0f172a] cursor-pointer" data-hex="${hex}" title="Click to copy ${hex}">
      <div class="h-10 relative" style="background:${hex}">
        <span class="absolute top-1 right-1" style="color:${contrastTextColor(hex)}">${copyIconSvg()}</span>
      </div>
      <div class="px-2 py-1.5">
        <div class="font-mono text-[11px] text-slate-200">${hex}</div>
        <div class="font-mono text-[10px] text-slate-500">${rgbText}</div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('[data-hex]').forEach(item=>{
    item.addEventListener('click', ()=> copyText(item.dataset.hex, null));
  });
}

function slotRow(label, hex){
  if(!hex) return '';
  const rgb = hexToRgb(hex);
  const rgbText = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '—';
  return `
  <div class="flex items-center gap-2.5">
    <div class="w-7 h-7 rounded-md border border-white/10 flex-shrink-0" style="background:${hex}"></div>
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <span class="text-[10px] uppercase tracking-wide text-slate-500">${label}</span>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="bg-[#0b0f19] border border-[#2d3a54] rounded px-1.5 py-0.5 text-[11px] font-mono w-24 text-slate-200">${hex.toUpperCase()}</span>
        <span class="font-mono text-[10px] text-slate-500">${rgbText}</span>
        <button type="button" class="text-[10px] text-slate-500 hover:text-slate-300 border border-[#2d3a54] rounded px-1.5 py-0.5" data-copy="${hex}">Copy</button>
      </div>
    </div>
  </div>`;
}

function teamMatches(t){
  if(!search) return true;
  return (t.name + ' ' + t.code).toLowerCase().includes(search);
}
function pairingMatches(g){
  if(!search) return true;
  const name = code => (TEAMS[code] && TEAMS[code].name) || '';
  return [g.home, g.away, name(g.home), name(g.away)].join(' ').toLowerCase().includes(search);
}

function flagImgHtml(code){
  const iso = FLAG_ISO[code];
  if(!iso) return '';
  return `<img src="https://flagcdn.com/w80/${iso}.png" alt="" loading="lazy" class="w-7 h-[18px] object-cover rounded-[3px] ring-1 ring-white/15 flex-shrink-0">`;
}

function teamCardHtml(t){
  return `
    <div class="border border-[#1f2937] rounded-lg bg-[#111827] p-3 flex flex-col gap-2.5">
      <div class="flex justify-between items-center gap-2"><div class="flex items-center gap-2.5 min-w-0">${flagImgHtml(t.code)}<span class="font-bold text-lg leading-tight text-white">${esc(t.name)}</span></div><span class="font-mono text-[10px] text-slate-500">${esc(t.code)}</span></div>
      ${slotRow('Light', t.light)}
      ${slotRow('Dark', t.dark)}
      ${slotRow('Alternate', t.alternate)}
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

function copyIconSvg(){
  return `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.4" style="opacity:.7;flex-shrink:0"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M3.5 11V3.5a1 1 0 0 1 1-1H11" stroke-linecap="round"/></svg>`;
}

function teamStripeHtml(homeCode, homeHex, awayCode, awayHex){
  const homeRgb = hexToRgb(homeHex), awayRgb = hexToRgb(awayHex);
  const homeRgbText = homeRgb ? `${homeRgb.r}, ${homeRgb.g}, ${homeRgb.b}` : '—';
  const awayRgbText = awayRgb ? `${awayRgb.r}, ${awayRgb.g}, ${awayRgb.b}` : '—';
  return `
  <div class="flex flex-col gap-1 w-full max-w-[280px]">
    <div class="score-stripe">
      <div class="stripe-team stripe-home" style="background:${esc(homeHex)};color:${contrastTextColor(homeHex)}" data-copy="${esc(homeHex)}" title="Copy ${esc(homeCode)}'s colour for this game (${esc(homeHex)})">
        <span class="stripe-code">${esc(homeCode)}</span>${copyIconSvg()}
      </div>
      <div class="stripe-gap"></div>
      <div class="stripe-team stripe-away" style="background:${esc(awayHex)};color:${contrastTextColor(awayHex)}" data-copy="${esc(awayHex)}" title="Copy ${esc(awayCode)}'s colour for this game (${esc(awayHex)})">
        ${copyIconSvg()}<span class="stripe-code">${esc(awayCode)}</span>
      </div>
    </div>
    <div class="flex justify-between gap-2 text-[10px] font-mono text-slate-500 px-0.5">
      <span>${esc(homeHex.toUpperCase())} · ${homeRgbText}</span>
      <span>${esc(awayHex.toUpperCase())} · ${awayRgbText}</span>
    </div>
  </div>`;
}

function pairingRowHtml(g){
  return `
    <tr style="border-left:3px solid #${ZONE_HEX[g.continent]||'475569'}">
      <td class="py-2 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap align-top">${esc(g.dateShort)}</td>
      <td class="py-2 px-3 align-top">${teamStripeHtml(g.home, g.homeColor, g.away, g.awayColor)}</td>
    </tr>`;
}

function renderContinentTabs(){
  const wrap = document.getElementById('continentTabs');
  const counts = {};
  Object.values(TEAMS).forEach(t=>{ counts[t.continent] = (counts[t.continent]||0)+1; });
  // Only confederations playing in this window; keep the selected one valid.
  const shown = CONT_ORDER.filter(c=>counts[c]);
  const tabs = shown.length ? shown : CONT_ORDER;
  if(!tabs.includes(activeContinent)) activeContinent = tabs[0];
  wrap.innerHTML = tabs.map(c=>{
    const active = activeContinent === c;
    return `<button data-cc="${c}" class="px-3 py-1.5 text-xs font-semibold border-b-2 -mb-px ${active ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'}">${CONT_LABEL[c]} <span class="text-slate-500 font-normal">(${counts[c]||0})</span></button>`;
  }).join('');
  wrap.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{ activeContinent = b.dataset.cc; renderContinentTabs(); renderTeams(); renderPairing(); });
  });
}

function renderTeams(){
  const wrap = document.getElementById('teamsByContinent');
  const tabs = document.getElementById('continentTabs');
  const colTitle = document.getElementById('colorsColTitle');
  const fixTitle = document.getElementById('fixturesColTitle');

  if(search){
    tabs.classList.add('hidden');
    const byCont = {};
    Object.values(TEAMS).forEach(t=>{ if(teamMatches(t)) (byCont[t.continent]=byCont[t.continent]||[]).push(t); });
    const contsWithData = CONT_ORDER.filter(c=>byCont[c] && byCont[c].length);
    colTitle.textContent = 'Team Colours';
    fixTitle.textContent = 'Fixtures';
    if(!contsWithData.length){
      wrap.innerHTML = `<div class="text-slate-500 text-sm py-8 text-center">No teams match "${esc(search)}".</div>`;
    } else {
      wrap.innerHTML = contsWithData.map(c=>{
        const list = byCont[c].sort((a,b)=>a.name.localeCompare(b.name));
        const hex = ZONE_HEX[c];
        return `<div class="flex flex-col gap-2.5">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" style="background:#${hex}"></span>
            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">${CONT_LABEL[c]}</h4>
          </div>
          <div class="flex flex-col gap-2.5">${list.map(teamCardHtml).join('')}</div>
        </div>`;
      }).join('');
    }
  } else {
    tabs.classList.remove('hidden');
    colTitle.textContent = `Team Colours — ${CONT_LABEL[activeContinent]}`;
    fixTitle.textContent = `${CONT_LABEL[activeContinent]} Fixtures`;
    const list = Object.values(TEAMS).filter(t=>t.continent===activeContinent).sort((a,b)=>a.name.localeCompare(b.name));
    wrap.innerHTML = list.length
      ? `<div class="flex flex-col gap-2.5">${list.map(teamCardHtml).join('')}</div>`
      : `<div class="text-slate-500 text-sm py-8 text-center">No teams for this confederation yet.</div>`;
  }
  wrap.querySelectorAll('[data-copy]').forEach(b=>{
    b.addEventListener('click', ()=> copyText(b.dataset.copy, b));
  });
}

function renderPairing(){
  const tbody = document.getElementById('pairingBody');
  const list = search
    ? PAIRINGS.filter(pairingMatches)
    : PAIRINGS.filter(g=>g.continent===activeContinent);
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="2" class="text-center text-slate-500 py-6">${search ? `No fixtures match "${esc(search)}".` : 'No fixtures for this confederation yet.'}</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(pairingRowHtml).join('');
  tbody.querySelectorAll('[data-copy]').forEach(el=>{
    el.addEventListener('click', ()=> copyText(el.dataset.copy, el.querySelector('.stripe-code')));
  });
}

function renderAll(){ renderPalette(); renderContinentTabs(); renderTeams(); renderPairing(); }

function loadLive(){
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.firestore();

    db.collection(`windows/${WINDOW_ID}/teams`).onSnapshot(snap=>{
      if(snap.empty) return; // keep the static snapshot until real data exists
      const t = {};
      snap.docs.forEach(d=>{ t[d.id] = Object.assign({ code: d.id }, d.data()); });
      TEAMS = t;
      renderAll();
    }, err=>console.error('teams listener', err));

    db.collection('palette').onSnapshot(snap=>{
      if(snap.empty) return;
      PALETTE = snap.docs.map(d=>d.data().hex);
      renderAll();
    }, err=>console.error('palette listener', err));

    db.collection(`windows/${WINDOW_ID}/publicPairings`).onSnapshot(snap=>{
      if(snap.empty) return;
      PAIRINGS = snap.docs.map(d=>{
        const g = d.data();
        return {
          dateShort: (g.dateLabel || '').replace(/^[A-Za-z]+,?\s*/, ''),
          home: g.home, away: g.away,
          homeColor: g.homeColorHex, awayColor: g.awayColorHex,
          continent: g.continent, sortKey: g.sortKey,
        };
      }).sort((a,b)=>a.sortKey-b.sortKey);
      renderAll();
    }, err=>console.error('pairings listener', err));
  }catch(e){ console.error(e); /* keep the static snapshot on any failure */ }
}

document.getElementById('searchInput').addEventListener('input', (e)=>{
  search = e.target.value.trim().toLowerCase();
  renderTeams();
  renderPairing();
});

renderAll();
loadLive();
