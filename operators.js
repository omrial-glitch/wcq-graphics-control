/* GFX operator contacts for the admin "GFX Operators" tab.
 *
 * The list is read in the browser from the window's Production Plan (.xlsx, the sheet whose
 * name ends in "GFX") and saved only to the admin-only part of Firestore
 * (windows/<id>/games/_meta/contacts/gfx). Phone numbers and emails never go into this public
 * repo or into seed-data.js.
 *
 * Plain functions only (no DOM), so they can be tested outside the page.
 */

const OP_COMPANY_NAMES = {
  'taf': 'TAF', 'tv graphics': 'TV Graphics', 'wtvision': 'Wtvision',
  'segev - remote': 'Segev - Remote', 'fiba americas': 'FIBA Americas',
};

// Spelling fixes for place names as they appear in the plan.
const OP_PLACE_FIXES = { 'Istambul': 'Istanbul', 'Roma': 'Rome' };
function opPlace(v){ const s = opClean(v); return OP_PLACE_FIXES[s] || s; }

function opClean(v){ return String(v == null ? '' : v).replace(/[ \t\u00a0]+/g, ' ').trim(); }

function opCompanyName(text){
  const key = opClean(text).toLowerCase().replace(/\s*-\s*/g, ' - ');
  return OP_COMPANY_NAMES[key] || opClean(text);
}

/* 'JOHN SMITH' -> 'John Smith'; 'JANE DOE (1)' -> 'Jane Doe'. */
function opPersonName(text){
  let s = opClean(String(text || '').replace(/\(\d\)/g, ''));
  if(s && s === s.toUpperCase()) s = s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return s;
}

function opSplit(value, re){ return String(value || '').split(re).map(opClean).filter(Boolean); }

/* '+972 50-000-0000' / '(+) 44 7700 900000' / '0044 …' -> '+972500000000'.
   Returns '' when the number has no country code, so it is never dialled wrongly. */
function opPhoneE164(phone){
  const raw = opClean(phone);
  let d = raw.replace(/\D/g, '');
  if(!d) return '';
  if(d.startsWith('00')) return '+' + d.slice(2);
  if(!raw.includes('+') && d.startsWith('0')) return '';
  return '+' + d;
}

/* Text of an ExcelJS cell: plain values, rich text, hyperlinks (emails) and formula results. */
function opCellText(cell){
  const v = cell ? cell.value : null;
  if(v == null) return '';
  if(typeof v !== 'object') return String(v);
  if(v instanceof Date) return v.toISOString();
  if(Array.isArray(v.richText)) return v.richText.map(r => (r && r.text) || '').join('');
  if(v.text != null) return typeof v.text === 'object' && Array.isArray(v.text.richText)
    ? v.text.richText.map(r => (r && r.text) || '').join('') : String(v.text);
  if(v.result != null) return String(v.result);
  return '';
}

/* ExcelJS workbook -> { operators: [{name, company, phones, emails, venues:[{country, city}]}], warnings } */
function parseGfxOperators(wb){
  const ws = wb.worksheets.find(w => /GFX\s*$/i.test(String(w.name).trim()));
  if(!ws) throw new Error('No sheet ending in "GFX" in this file. Is it the Production Plan?');
  const byName = new Map();
  const warnings = [];
  let cols = null, stop = false;

  ws.eachRow({ includeEmpty: false }, row => {
    if(stop) return;
    const texts = [];
    row.eachCell({ includeEmpty: true }, (cell, c) => { texts[c] = opCellText(cell).trim(); });
    // Only the window's own block at the top of the sheet: the Segev pool below it is not this window.
    if(texts.some(t => t && /segev operators/i.test(t))){ stop = true; return; }
    const low = texts.map(t => (t || '').toLowerCase());
    const col = key => low.findIndex(t => t && (t === key || t.startsWith(key)));
    if(col('company') >= 1 && col('gfx operator') >= 1){
      cols = { country: col('country'), city: col('city'), company: col('company'),
               operator: col('gfx operator'), email: col('email'), phone: col('telephone') };
      return;
    }
    if(!cols) return;
    // Section titles ("EUROPE", "ASIA") are merged across the row, so every column repeats the same text.
    if(new Set(texts.filter(Boolean)).size <= 1) return;
    const get = key => (cols[key] >= 1 ? (texts[cols[key]] || '') : '');
    const company = opCompanyName(get('company'));
    const names = opSplit(get('operator'), /\n|;/).map(opPersonName).filter(Boolean);
    if(!company || !names.length) return;
    const emails = opSplit(get('email'), /[\n;,\s]+/).filter(e => e.includes('@'));
    const phones = opSplit(get('phone'), /\n|;/);
    const venue = { country: opPlace(get('country')), city: opPlace(get('city')) };
    if(names.length > 1 && phones.length < names.length){
      warnings.push(`${venue.city || venue.country}: ${names.length} operators but ${phones.length} phone numbers`);
    }
    names.forEach((name, i) => {
      const key = name.toLowerCase();
      const op = byName.get(key) || { name, company, phones: [], emails: [], venues: [] };
      const phone = phones[i] || '';
      if(phone && !op.phones.some(p => p === phone || (opPhoneE164(p) && opPhoneE164(p) === opPhoneE164(phone)))) op.phones.push(phone);
      const email = emails[i] || '';
      if(email && !op.emails.includes(email)) op.emails.push(email);
      if(!op.venues.some(v => v.city === venue.city && v.country === venue.country)) op.venues.push(venue);
      byName.set(key, op);
    });
  });

  if(!cols) throw new Error('Could not find the "Company / GFX Operator / Email / Telephone" header row in the GFX sheet.');
  const operators = [...byName.values()].sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
  operators.forEach(o => {
    if(!o.phones.length) warnings.push(`${o.name} (${o.company}): no phone number`);
    else if(!o.phones.some(opPhoneE164)) warnings.push(`${o.name} (${o.company}): phone number has no country code`);
  });
  return { operators, warnings };
}

/* vCard 3.0 file for a list of operators. The company goes into the contact name, e.g.
   "John Smith (TAF)", so typing "TAF" in WhatsApp finds the whole group. */
function operatorsVcf(ops, windowLabel){
  const v = s => String(s || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r?\n/g, '\\n');
  return ops.map(o => {
    const parts = o.name.split(' ');
    const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : o.name;
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const lines = ['BEGIN:VCARD', 'VERSION:3.0',
      `N:${v((last ? last + ' ' : '') + '(' + o.company + ')')};${v(first)};;;`,
      `FN:${v(o.name + ' (' + o.company + ')')}`,
      `ORG:${v(o.company)}`];
    o.phones.map(opPhoneE164).filter(Boolean).forEach(p => lines.push(`TEL;TYPE=CELL:${p}`));
    o.emails.forEach(e => lines.push(`EMAIL;TYPE=INTERNET:${v(e)}`));
    lines.push(`NOTE:${v(`${windowLabel} GFX operator · ${o.venues.map(x => x.city || x.country).join(', ')}`)}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }).join('\r\n') + '\r\n';
}

/* Google Contacts CSV (the Google CSV import format). Every operator gets the label "WCQ GFX" plus a
   label per company ("WCQ GFX - TAF" …), so each company is one label in Google Contacts. */
function operatorsGoogleCsv(ops, windowLabel){
  const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const header = ['Name', 'Given Name', 'Family Name', 'Group Membership', 'E-mail 1 - Type', 'E-mail 1 - Value',
    'Phone 1 - Type', 'Phone 1 - Value', 'Phone 2 - Type', 'Phone 2 - Value', 'Organization 1 - Name', 'Notes'];
  const rows = ops.map(o => {
    const parts = o.name.split(' ');
    const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : o.name;
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const phones = o.phones.map(opPhoneE164).filter(Boolean);
    return [`${o.name} (${o.company})`, first, `${last ? last + ' ' : ''}(${o.company})`,
      `* myContacts ::: WCQ GFX ::: WCQ GFX - ${o.company}`,
      o.emails[0] ? 'Work' : '', o.emails[0] || '',
      phones[0] ? 'Mobile' : '', phones[0] || '', phones[1] ? 'Mobile' : '', phones[1] || '',
      o.company, `${windowLabel} GFX operator · ${o.venues.map(v => v.city || v.country).join(', ')}`].map(q).join(',');
  });
  return '\ufeff' + [header.map(q).join(','), ...rows].join('\r\n') + '\r\n';
}

if(typeof module !== 'undefined') module.exports = { parseGfxOperators, operatorsVcf, operatorsGoogleCsv, opPhoneE164, opPersonName, opCompanyName };

/* ---------------------------------------------------------------------------
 * Crew (BOVM + GFX operator per game), also read from the Production Plan in the browser.
 * The public seed-data.js carries no crew names; the admin loads them into the admin-only
 * game documents with the same "Load from Production Plan" action.
 * Mirrors build_window_games.py (read_roster / lookup / place_key).
 * ------------------------------------------------------------------------- */

const CREW_TEXT_FIXES = { 'Istambul': 'Istanbul', 'Turckcell': 'Turkcell', 'Zarate': 'Zárate' };
const CREW_PLACE_ALIASES = { 'roma': 'rome', 'malaysia': 'seremban' };
// Remote companies list several operators per venue but work as one desk: their games go under a
// single name, the listed operator whose surname is the company's name (or else the first one listed).
const CREW_SINGLE_OPERATOR_COMPANIES = ['Segev - Remote'];
function crewSingleOperator(company, ops){
  const word = company.split(/\s|-/)[0].toLowerCase();
  return ops.find(n => n.toLowerCase().split(' ').pop() === word) || ops[0];
}

function crewPlaceKey(text){
  let t = opClean(text);
  Object.entries(CREW_TEXT_FIXES).forEach(([wrong, right]) => { t = t.replace(new RegExp('\\b' + wrong + '\\b', 'g'), right); });
  t = t.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\x7f]/g, '').toLowerCase();
  t = t.replace(/\(.*?\)/g, '').trim();
  return CREW_PLACE_ALIASES[t] || t;
}

/* place key -> first roster row {values…}, reading only the window's own block (up to stopMarker). */
function crewRoster(ws, valueCols, stopMarker){
  const roster = {};
  let stop = false;
  ws.eachRow({ includeEmpty: false }, row => {
    if(stop) return;
    const t = []; for(let c = 1; c <= 6; c++) t[c] = opCellText(row.getCell(c)).trim();
    if(t.some(v => v && v.includes(stopMarker))){ stop = true; return; }
    const country = opClean(t[1]), city = opClean(t[2]);
    if(!country || country === 'Country' || !Object.values(valueCols).some(c => t[c])) return;
    const entry = {}; Object.entries(valueCols).forEach(([k, c]) => { entry[k] = t[c] || ''; });
    new Set([crewPlaceKey(city), crewPlaceKey(country)]).forEach(k => { if(k && !roster[k]) roster[k] = entry; });
  });
  return roster;
}

/* ExcelJS workbook + games -> { updates: [{id, bovm, gfxOperator, gfxCompany}], warnings } */
function crewFromPlan(wb, games){
  const sheet = suffix => wb.worksheets.find(w => String(w.name).trim().toUpperCase().endsWith(suffix));
  const bovmWs = sheet('BOVMS'), gfxWs = sheet('GFX');
  if(!bovmWs || !gfxWs) throw new Error('This file has no BOVMS / GFX sheets. Is it the Production Plan?');
  const bovms = crewRoster(bovmWs, { bovm: 3 }, 'TOTAL ORIGINS');
  const gfx = crewRoster(gfxWs, { company: 3, operator: 4 }, 'Segev Operators');
  const find = (roster, g) => roster[crewPlaceKey(g.city)] || roster[crewPlaceKey(g.venue)] || null;
  const warnings = [];
  const updates = games.map(g => {
    const b = find(bovms, g), x = find(gfx, g);
    const tag = `${g.home}-${g.away} (${g.city})`;
    if(!b) warnings.push(`${tag}: no BOVM row`);
    if(!x) warnings.push(`${tag}: no GFX row`);
    const company = x ? opCompanyName(x.company) : (g.gfxCompany || '');
    let ops = x ? opSplit(x.operator, /\n|;/).map(opPersonName).filter(Boolean) : [];
    if(CREW_SINGLE_OPERATOR_COMPANIES.includes(company) && ops.length > 1) ops = [crewSingleOperator(company, ops)];
    return { id: g.id, bovm: b ? opPersonName(b.bovm) : '', gfxOperator: ops.join(' / '), gfxCompany: company };
  });
  return { updates, warnings };
}

if(typeof module !== 'undefined') Object.assign(module.exports, { crewFromPlan, crewPlaceKey });
