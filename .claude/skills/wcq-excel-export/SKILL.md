---
name: wcq-excel-export
description: Use whenever the user wants to add, change, fix, or extend the "Export to Excel" feature in the WCQ Graphics Control app (omrial-glitch/wcq-graphics-control) — the button in index.html/admin.js that downloads the live game schedule as an .xlsx styled to match the FIBA production "Timing and follow-up" template. Trigger on things like "the export button downloads a blank file", "add a Referee column to the Excel export", "the exported times look wrong", "add export for Window 5", "here's the updated template, make the export match it", or any request touching the exported workbook's columns, colors, fonts, or sheet layout — even if the user doesn't say "Excel" explicitly and just describes a problem with the downloaded file. Also trigger when the user shares a new or revised FIBA Excel template (BOVM sheet, GFX operators sheet, timing sheet) and wants the site's export brought in line with it.
---

# WCQ Excel export

Maintains the client-side ExcelJS export in `admin.js` (wired to `#exportBtn`
in `index.html`) that turns the live Firestore game schedule into an
`.xlsx` matching the look of the production team's own template. This
session originally reverse-engineered that template cell-by-cell and hit
two real bugs along the way — `references/export-spec.md` has the full
styling contract so you don't have to re-derive it, and both bugs are
covered by the verification script below.

## Before touching anything

Read `references/export-spec.md`. It has the exact column list, fonts,
confederation color map, status-text mapping, and conditional-formatting
colors the export is built to — plus the two gotchas (date-grouping order,
UTC time construction) written up with *why* they bite, not just *what* to
avoid. Changing the export without reading it risks quietly reintroducing
either bug or drifting from the template's look for no reason.

## Workflow

1. **Get the repo.** Clone or pull `omrial-glitch/wcq-graphics-control` into
   a scratch directory (`gh repo view omrial-glitch/wcq-graphics-control`
   confirms you have access; `git clone` if you don't have a local copy,
   `git pull` if you do). Everything below happens on this working copy —
   never edit anything until you've made your change and it's verified.

2. **Understand the request.** Is this a bug fix, a new column, a new
   window, or a new template to match? If the user attached a new/updated
   `.xlsx` template, re-derive the spec from it first (the last section of
   `export-spec.md` shows how) and update `export-spec.md` before writing
   any code — the code should follow the spec, not the other way around.

3. **Make the change** in `admin.js`, inside the block between
   `/* ---------------- Excel export ---------------- */` and
   `async function exportToExcel(){` (that's `buildGamesSheet`,
   `buildRosterSheet`, `buildTechnicalPowerSheet`, and their shared
   constants/helpers). Keep the two fixes from `export-spec.md` intact —
   don't reorder the grouping logic or swap `Date.UTC(...)` for a plain
   `new Date(...)` while you're in there for something unrelated.

4. **Verify before shipping — this is not optional.** In a scratch
   directory with `exceljs@4.4.0` installed (`npm install exceljs@4.4.0`,
   once, reusable across runs):

   ```bash
   node scripts/verify_export.js <path-to-your-working-copy>/admin.js \
                                  <path-to-your-working-copy>/seed-data.js \
                                  w4
   ```

   This extracts your edited builder functions straight out of `admin.js`
   (so it's always testing what you actually changed, not a stale copy),
   builds a real workbook from real seed data, reads it back, and checks
   that every date forms exactly one contiguous block in the right order
   and every GMT time round-trips exactly — the two things that have
   already broken once each. It also sanity-checks the four sheet names
   and that the conditional-formatting rules are still there. Fix whatever
   it reports and rerun until it prints `✓ Export verified clean`. If
   `seed-data.js` doesn't have the window you're testing (e.g. a brand new
   Window 5 with no seed yet), point it at any window that does, or a small
   hand-written JSON array with the same field shape — the point is
   exercising the grouping/time logic, not that specific data.

5. **Syntax-check the whole file**: `node --check admin.js` — a stray
   bracket while editing a 260-line block is easy to miss by eye.

6. **Show the user a summary**: what changed, the verification output, and
   `git diff --stat`.

7. **Stop and ask before pushing.** Don't run `git push` on your own — show
   the diff and wait for an explicit go-ahead. This app is live in
   production (GitHub Pages, admin-authenticated Firestore behind it), and
   the user chose "ask before every push" over "push automatically" when
   this skill was set up. Once they say go: commit with a message that
   explains *why* the change was made, push to `main`, and confirm the
   Pages build actually started:

   ```bash
   gh api repos/omrial-glitch/wcq-graphics-control/pages/builds/latest
   ```

## What this skill does not do

- Doesn't touch Firestore security rules or write to production data —
  export only reads `state.games`, already loaded client-side.
- Doesn't introduce formulas beyond the one already proven
  (`=E<row> + TIME(2,0,0)`) without checking they're supported broadly —
  see the "Choosing formulas" guidance in the `xlsx` skill if you need
  something fancier than a cell reference and `TIME()`.
- Doesn't force-push or bypass hooks.
- Doesn't rebuild `colors.html`/`colors.js` — those are a separate public
  page with no export feature; if the user wants one there too, that's a
  new feature to design, not something this skill already covers.
