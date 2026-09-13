/**
 * WCQ Graphics Control — backend
 * Stores everything in this spreadsheet (tabs: Games, Teams, Palette, Windows)
 * and serves it as JSON to the two static websites (admin + supplier).
 *
 * Deploy: Deploy > New deployment > type "Web app" > Execute as "Me" >
 * Who has access "Anyone" > Deploy. Set ADMIN_TOKEN under
 * Project Settings > Script Properties before deploying.
 */

var GAMES_HEADERS = ['window','id','dateISO','dateLabel','sortKey','home','homeName','away','awayName',
  'venue','city','gmtTime','espTime','espNextDay','bovm','gfxOperator','gfxCompany','continent',
  'homeColorHex','homeColorSlot','awayColorHex','awayColorSlot',
  'backupClockStatus','backupClockNote','gfxExampleStatus','gfxExampleNote','remarks','technicalPower'];
var TEAMS_HEADERS = ['window','code','name','continent','light','dark','alternate'];
var PALETTE_HEADERS = ['hex','name'];
var WINDOWS_HEADERS = ['id','label','active'];

function doGet(e){
  var action = (e.parameter.action || 'data');
  var win = e.parameter.window || 'w4';

  if(action === 'data'){
    // Full data — schedule, BOVM/GFX crew, statuses, remarks. Admin-only:
    // requires the same token as writes, so this stays private even though
    // the site is hosted publicly.
    var token = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
    if(!token || e.parameter.token !== token) return jsonOut({ error: 'unauthorized' });
    return jsonOut(getAllData(win));
  }
  if(action === 'colors'){
    // Public — colours + fixture pairing only, no crew/venue/notes. Used by
    // the supplier-facing page, no token required.
    return jsonOut(getPublicColorData(win));
  }
  return jsonOut({ error: 'unknown action' });
}

function doPost(e){
  var body;
  try{ body = JSON.parse(e.postData.contents); }catch(err){ return jsonOut({ error:'bad json' }); }
  var action = body.action;
  var writeActions = ['updateGame','updateTeamColor','addPaletteColor','removePaletteColor','bulkSeed'];
  if(writeActions.indexOf(action) !== -1){
    var token = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
    if(!token || body.token !== token) return jsonOut({ error:'unauthorized' });
  }
  switch(action){
    case 'updateGame': return jsonOut(updateGame(body));
    case 'updateTeamColor': return jsonOut(updateTeamColor(body));
    case 'addPaletteColor': return jsonOut(addPaletteColor(body));
    case 'removePaletteColor': return jsonOut(removePaletteColor(body));
    case 'bulkSeed': return jsonOut(bulkSeed(body));
    default: return jsonOut({ error:'unknown action' });
  }
}

/* ---------------- sheet plumbing ---------------- */

function ensureSheet(ss, name, headers){
  var sh = ss.getSheetByName(name);
  if(!sh){ sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}
function ensureSheets(ss){
  ensureSheet(ss,'Games',GAMES_HEADERS);
  ensureSheet(ss,'Teams',TEAMS_HEADERS);
  ensureSheet(ss,'Palette',PALETTE_HEADERS);
  ensureSheet(ss,'Windows',WINDOWS_HEADERS);
}

function readRows(ss, name){
  var sh = ss.getSheetByName(name);
  if(!sh) return [];
  var values = sh.getDataRange().getValues();
  if(values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for(var i=1;i<values.length;i++){
    var row = values[i];
    var blank = row.every(function(c){ return c === '' || c === null; });
    if(blank) continue;
    var obj = {};
    headers.forEach(function(h, idx){ obj[h] = row[idx]; });
    obj.__row = i+1;
    rows.push(obj);
  }
  return rows;
}
function stripRow(r){ var o = {}; Object.keys(r).forEach(function(k){ if(k!=='__row') o[k]=r[k]; }); return o; }

function jsonOut(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function normalizeHex(h){
  if(!h) return null;
  h = String(h).trim();
  if(h[0] !== '#') h = '#'+h;
  if(!/^#[0-9A-Fa-f]{6}$/.test(h)) return null;
  return h.toUpperCase();
}

/* ---------------- read models ---------------- */

function gameRowToObj(r){
  return {
    id: r.id, date: r.dateLabel, dateLabel: r.dateLabel, dateISO: r.dateISO, sortKey: Number(r.sortKey),
    home: r.home, homeName: r.homeName, away: r.away, awayName: r.awayName,
    venue: r.venue, city: r.city, gmtTime: r.gmtTime, espTime: r.espTime,
    espNextDay: (r.espNextDay === true || r.espNextDay === 'TRUE' || r.espNextDay === 'true'),
    bovm: r.bovm, gfxOperator: r.gfxOperator, gfxCompany: r.gfxCompany, continent: r.continent,
    homeColor: { hex: r.homeColorHex, slot: r.homeColorSlot },
    awayColor: { hex: r.awayColorHex, slot: r.awayColorSlot },
    backupClock: { status: r.backupClockStatus || 'pending', note: r.backupClockNote || '' },
    gfxExample: { status: r.gfxExampleStatus || 'pending', note: r.gfxExampleNote || '' },
    remarks: r.remarks || '', technicalPower: r.technicalPower || ''
  };
}
function teamRowToObj(r){
  return {
    code: r.code, name: r.name, continent: r.continent,
    light: r.light || null, dark: r.dark || null, alternate: r.alternate || null
  };
}

function getAllData(win){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);
  var games = readRows(ss,'Games').filter(function(r){ return r.window === win; }).map(gameRowToObj);
  var teams = {};
  readRows(ss,'Teams').filter(function(r){ return r.window === win; }).forEach(function(r){ teams[r.code] = teamRowToObj(r); });
  var palette = readRows(ss,'Palette').map(function(r){ return String(r.hex).toUpperCase(); });
  var windows = readRows(ss,'Windows').map(stripRow);
  return { games: games, teams: teams, palette: palette, windows: windows };
}

/** Public subset for the supplier-facing colours page: no BOVM, GFX crew,
 * venue, technical notes or remarks — just team colours and, per fixture,
 * which colour each side wears. */
function getPublicColorData(win){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);
  var teams = {};
  readRows(ss,'Teams').filter(function(r){ return r.window === win; }).forEach(function(r){ teams[r.code] = teamRowToObj(r); });
  var palette = readRows(ss,'Palette').map(function(r){ return String(r.hex).toUpperCase(); });
  var games = readRows(ss,'Games').filter(function(r){ return r.window === win; })
    .sort(function(a,b){ return Number(a.sortKey) - Number(b.sortKey); })
    .map(function(r){
      return {
        dateShort: String(r.dateLabel || '').replace(/^[A-Za-z]+,?\s*/, ''),
        home: r.home, away: r.away,
        homeColor: r.homeColorHex, awayColor: r.awayColorHex,
        continent: r.continent,
      };
    });
  return { teams: teams, palette: palette, pairings: games };
}

/* ---------------- writes ---------------- */

function findRow(rows, matcher){
  for(var i=0;i<rows.length;i++){ if(matcher(rows[i])) return rows[i]; }
  return null;
}

function updateGame(body){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Games');
  if(!sh) return { error:'no Games sheet' };
  var rows = readRows(ss,'Games');
  var target = findRow(rows, function(r){ return r.window === body.window && String(r.id) === String(body.id); });
  if(!target) return { error:'game not found' };
  var headers = sh.getDataRange().getValues()[0];
  function setCol(name, val){
    var idx = headers.indexOf(name);
    if(idx >= 0) sh.getRange(target.__row, idx+1).setValue(val);
  }
  if(body.field === 'backupClock'){ setCol('backupClockStatus', body.value.status); setCol('backupClockNote', body.value.note || ''); }
  else if(body.field === 'gfxExample'){ setCol('gfxExampleStatus', body.value.status); setCol('gfxExampleNote', body.value.note || ''); }
  else if(body.field === 'remarks'){ setCol('remarks', body.value); }
  else return { error:'unknown field' };
  return { ok:true };
}

function updateTeamColor(body){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Teams');
  if(!sh) return { error:'no Teams sheet' };
  var rows = readRows(ss,'Teams');
  var target = findRow(rows, function(r){ return r.window === body.window && r.code === body.code; });
  if(!target) return { error:'team not found' };
  var hex = normalizeHex(body.hex);
  if(!hex) return { error:'invalid hex' };
  var headers = sh.getDataRange().getValues()[0];
  var idx = headers.indexOf(body.slot);
  if(idx < 0) return { error:'unknown slot' };
  sh.getRange(target.__row, idx+1).setValue(hex);
  return { ok:true };
}

function addPaletteColor(body){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);
  var hex = normalizeHex(body.hex);
  if(!hex) return { error:'invalid hex' };
  var rows = readRows(ss,'Palette');
  if(findRow(rows, function(r){ return String(r.hex).toUpperCase() === hex; })) return { ok:true, alreadyExists:true };
  ss.getSheetByName('Palette').appendRow([hex, body.name || '']);
  return { ok:true };
}

function removePaletteColor(body){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hex = normalizeHex(body.hex);
  if(!hex) return { error:'invalid hex' };
  removeRowsWhere(ss,'Palette', function(r){ return String(r.hex).toUpperCase() === hex; });
  return { ok:true };
}

function removeRowsWhere(ss, sheetName, predicate){
  var sh = ss.getSheetByName(sheetName);
  if(!sh) return;
  var values = sh.getDataRange().getValues();
  if(values.length < 2) return;
  var headers = values[0];
  for(var i=values.length-1;i>=1;i--){
    var row = values[i];
    var obj = {};
    headers.forEach(function(h, idx){ obj[h] = row[idx]; });
    if(predicate(obj)) sh.deleteRow(i+1);
  }
}

/**
 * One-shot / re-runnable import used to load (or refresh) all data for a
 * single window. Wipes existing rows for that window in Games & Teams,
 * re-inserts the given rows, upserts the Windows entry, and merges any new
 * palette colours (never removes existing palette colours).
 * body: { token, window, windowLabel, games:[...], teams:[...], palette:[...] }
 */
function bulkSeed(body){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);
  var win = body.window;
  if(!win) return { error:'missing window id' };

  removeRowsWhere(ss,'Games', function(r){ return r.window === win; });
  removeRowsWhere(ss,'Teams', function(r){ return r.window === win; });

  var gamesSh = ss.getSheetByName('Games');
  var gameRows = (body.games || []).map(function(g){
    return GAMES_HEADERS.map(function(h){ return g[h] !== undefined ? g[h] : ''; });
  });
  if(gameRows.length) gamesSh.getRange(gamesSh.getLastRow()+1, 1, gameRows.length, GAMES_HEADERS.length).setValues(gameRows);

  var teamsSh = ss.getSheetByName('Teams');
  var teamRows = (body.teams || []).map(function(t){
    return TEAMS_HEADERS.map(function(h){ return t[h] !== undefined ? t[h] : ''; });
  });
  if(teamRows.length) teamsSh.getRange(teamsSh.getLastRow()+1, 1, teamRows.length, TEAMS_HEADERS.length).setValues(teamRows);

  var winRows = readRows(ss,'Windows');
  var winSh = ss.getSheetByName('Windows');
  var existingWin = findRow(winRows, function(r){ return r.id === win; });
  if(existingWin){
    winSh.getRange(existingWin.__row, 1, 1, 3).setValues([[win, body.windowLabel || win, true]]);
  } else {
    winSh.appendRow([win, body.windowLabel || win, true]);
  }

  var paletteRows = readRows(ss,'Palette');
  var existingHex = {};
  paletteRows.forEach(function(r){ existingHex[String(r.hex).toUpperCase()] = true; });
  var paletteSh = ss.getSheetByName('Palette');
  (body.palette || []).forEach(function(hex){
    var H = normalizeHex(hex);
    if(H && !existingHex[H]){ paletteSh.appendRow([H, '']); existingHex[H] = true; }
  });

  return { ok:true, gamesAdded: gameRows.length, teamsAdded: teamRows.length };
}
