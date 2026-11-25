#!/usr/bin/env node
/**
 * Verification harness for the WCQ Excel export in admin.js.
 *
 * Extracts the pure workbook-building functions straight out of admin.js
 * (no copy kept here to drift out of sync), runs them against a real
 * seed-data.js window, writes an actual .xlsx, reads it back with a fresh
 * ExcelJS instance, and checks the two things that have already broken in
 * practice — see references/export-spec.md for the story on each:
 *
 *   1. Every date appears as exactly one contiguous block, in chronological
 *      order (catches a sort-then-group bug that silently splits a date).
 *   2. Every game's GMT cell round-trips to the exact HH:MM from the data
 *      (catches the local-timezone Date-construction bug).
 *
 * It also sanity-checks sheet names and that conditional formatting rules
 * are actually present (easy to lose silently if a rule's `ref` typo'd).
 *
 * Usage:
 *   npm install exceljs@4.4.0   # once, in a scratch dir — see SKILL.md
 *   node verify_export.js <path/to/admin.js> <path/to/seed-data.js> [windowId]
 *
 * Exits non-zero with a list of failures if anything's wrong; exits 0 and
 * prints a summary if everything checks out.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const START_MARKER = '/* ---------------- Excel export ---------------- */';
const END_MARKER = 'async function exportToExcel(){';

function extractBuilderSource(adminJsPath) {
  const src = fs.readFileSync(adminJsPath, 'utf8');
  const start = src.indexOf(START_MARKER);
  const end = src.indexOf(END_MARKER);
  if (start === -1 || end === -1) {
    throw new Error(
      `Could not find the export builder section in ${adminJsPath} ` +
      `(looking for "${START_MARKER}" ... "${END_MARKER}"). ` +
      `Did the section get renamed or restructured? Update the markers here ` +
      `to match, or extend them if exportToExcel() itself changed shape.`
    );
  }
  return src.slice(start, end);
}

function loadSeedData(seedPath) {
  const src = fs.readFileSync(seedPath, 'utf8');
  const wrapped = src.replace(/^const SEED_DATA\s*=/m, 'module.exports =');
  const tmpFile = path.join(os.tmpdir(), `wcq_seed_${Date.now()}.js`);
  fs.writeFileSync(tmpFile, wrapped);
  try {
    delete require.cache[require.resolve(tmpFile)];
    return require(tmpFile);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

async function main() {
  const [, , adminJsPath, seedPath, windowIdArg] = process.argv;
  if (!adminJsPath || !seedPath) {
    console.error('Usage: node verify_export.js <admin.js> <seed-data.js> [windowId]');
    process.exit(2);
  }
  const windowId = windowIdArg || 'w4';

  let ExcelJS;
  try {
    ExcelJS = require('exceljs');
  } catch (e) {
    console.error(
      'exceljs is not installed. In a scratch directory: npm install exceljs@4.4.0\n' +
      'then run this script with that directory as your cwd (or NODE_PATH set to its node_modules).'
    );
    process.exit(2);
  }

  const builderSrc = extractBuilderSource(path.resolve(adminJsPath));
  // eslint-disable-next-line no-eval
  eval(builderSrc); // defines buildGamesSheet, buildRosterSheet, buildTechnicalPowerSheet in this scope

  const seed = loadSeedData(path.resolve(seedPath));
  const games = seed[windowId] && seed[windowId].games;
  if (!games || !games.length) {
    console.error(`No games found for window "${windowId}" in ${seedPath}. Known windows: ${Object.keys(seed).join(', ')}`);
    process.exit(2);
  }

  const label = windowId.toUpperCase();
  const wb = new ExcelJS.Workbook();
  wb.calcProperties.fullCalcOnLoad = true;
  buildGamesSheet(wb, `Games ${label}`, games);
  buildRosterSheet(wb, 'GFX Operators', games, 'gfxOperator', 'gfxCompany');
  buildRosterSheet(wb, 'BOVM', games, 'bovm', null);
  buildTechnicalPowerSheet(wb, games);

  const outPath = path.join(os.tmpdir(), `wcq_export_verify_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(outPath);

  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.readFile(outPath);

  const failures = [];
  const gamesSheetName = `Games ${label}`;
  const gs = wb2.getWorksheet(gamesSheetName);

  // --- sheet presence ---
  ['GFX Operators', 'BOVM', 'Technical power'].forEach(name => {
    if (!wb2.getWorksheet(name)) failures.push(`Missing sheet "${name}"`);
  });
  if (!gs) {
    failures.push(`Missing sheet "${gamesSheetName}" — cannot run the rest of the checks`);
  } else {
    // --- check 1: date blocks are contiguous and chronological ---
    const dateMerges = gs.model.merges.filter(m => /^A\d+:H\d+$/.test(m));
    const blockLabels = dateMerges
      .map(m => Number(m.match(/^A(\d+):/)[1]))
      .sort((a, b) => a - b)
      .map(row => String(gs.getRow(row).getCell(1).value));

    const seenLabels = new Set();
    blockLabels.forEach(label => {
      if (seenLabels.has(label)) {
        failures.push(`Date "${label}" appears in more than one block — a date got split. Check that buildGamesSheet groups by dateISO fully before sorting (see export-spec.md, bug #1).`);
      }
      seenLabels.add(label);
    });

    const expectedDates = [...new Set(games.map(g => g.dateISO))].sort();
    const expectedLabels = expectedDates.map(iso => games.find(g => g.dateISO === iso).dateLabel);
    if (blockLabels.length !== expectedLabels.length) {
      failures.push(`Expected ${expectedLabels.length} date blocks (one per unique date), found ${blockLabels.length}`);
    } else {
      expectedLabels.forEach((label, i) => {
        if (blockLabels[i] !== label) {
          failures.push(`Date blocks out of order: expected "${label}" at position ${i}, found "${blockLabels[i]}"`);
        }
      });
    }

    // --- check 2: every game's GMT cell round-trips exactly ---
    // Build a lookup of every row keyed by (home, away, venue, city), which
    // is unique per game even though `home` alone can repeat across dates.
    const rowByKey = new Map();
    for (let r = 1; r <= gs.rowCount; r++) {
      const row = gs.getRow(r);
      const a = row.getCell(1).value, b = row.getCell(2).value, c = row.getCell(3).value, d = row.getCell(4).value;
      if (a && b && c && d) rowByKey.set(`${a}|${b}|${c}|${d}`, r);
    }
    let gmtMismatches = 0, notFound = 0;
    games.forEach(g => {
      const key = `${g.home}|${g.away}|${g.venue}|${g.city}`;
      const r = rowByKey.get(key);
      if (!r) { notFound++; failures.push(`Game ${g.home} vs ${g.away} (${g.venue}) not found in the sheet at all`); return; }
      const cellVal = gs.getRow(r).getCell(5).value; // column E = GMT
      const [expH, expM] = (g.gmtTime || '0:0').split(':').map(Number);
      const gotH = cellVal instanceof Date ? cellVal.getUTCHours() : null;
      const gotM = cellVal instanceof Date ? cellVal.getUTCMinutes() : null;
      if (gotH !== expH || gotM !== expM) {
        gmtMismatches++;
        failures.push(`GMT time wrong for ${g.home} vs ${g.away}: expected ${g.gmtTime}, got ${gotH}:${String(gotM).padStart(2, '0')} — check Date.UTC() is used, not the local Date constructor (bug #2).`);
      }
    });

    // --- check 3: conditional formatting rules survived ---
    const cfCount = gs.conditionalFormattings.length;
    if (cfCount < 4) {
      failures.push(`Expected at least 4 conditional formatting rules on ${gamesSheetName} (OK/NO on I:J, yes/no on K), found ${cfCount}`);
    }
  }

  fs.unlinkSync(outPath);

  if (failures.length) {
    console.error(`\n✗ ${failures.length} problem(s) found:\n`);
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }

  console.log(`✓ Export verified clean — ${games.length} games, window "${windowId}", 4 sheets, dates contiguous, GMT times exact, conditional formatting present.`);
}

main().catch(e => {
  console.error('FAILED:', e.message || e);
  process.exit(1);
});
