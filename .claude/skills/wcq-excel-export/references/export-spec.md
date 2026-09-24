# WCQ Excel export — styling contract

This is the frozen visual spec the export was built to match, derived by
inspecting `WCQ-W4-Timinig-and-follow-up.xlsx` (the production team's own
"Timing and follow-up" tracker) cell-by-cell with openpyxl. Read this before
changing `buildGamesSheet` / `buildRosterSheet` / `buildTechnicalPowerSheet`
in `admin.js` — it's cheaper than re-opening the template and re-deriving
colors from theme XML again.

If the user gives you a **new or revised template file**, don't assume this
spec still applies — re-inspect it (see "Re-deriving this spec from a new
template" at the bottom) and update this file before touching the code.

## Workbook shape

4 sheets, in this order:

1. **`Games <LABEL>`** (e.g. `Games W4`) — the main schedule, one boxed table
   per broadcast date.
2. **`GFX Operators`** — contact roster, deduped by (city, gfxOperator).
3. **`BOVM`** — contact roster, deduped by (city, bovm).
4. **`Technical power`** — one row per unique venue.

## `Games <LABEL>` sheet

Columns (letter → header → width):

| Col | Header | Width | Source field |
|---|---|---|---|
| A | Home | 8.43 | `g.home` |
| B | Away | 7.86 | `g.away` |
| C | Venue | 39.71 | `g.venue` |
| D | City | 18.29 | `g.city` |
| E | GMT | 7.43 | `g.gmtTime` ("HH:MM") — real Excel time value |
| F | ESP Time | 7.29 | formula `=E<row> + TIME(2,0,0)`, not a stored value |
| G | BOVM | 21.43 | `g.bovm` |
| H | GFX operator | 26.86 | `g.gfxOperator` |
| I | BKP CLOCK | 16.43 | `g.backupClock.status`, mapped (see below) |
| J | GFX EXAMPLES | 14.43 | `g.gfxExample.status`, mapped (see below) |
| K | Technical power | 13.43 | `g.technicalPower` (raw, usually `""`) |
| L | Additional Remarks | 49.0 | `g.remarks`, prefixed if `g.espNextDay` |

**Layout, top to bottom, repeated per broadcast date:**
1. One row, merged A:H, the date label (`g.dateLabel`), font `DAZN Trim` 18pt
   bold, centered, row height 21.95.
2. One header row repeating the 12 column headers above, font
   `DAZN Oscine XBold` 14pt bold, centered, wrapped, row height 47.1, medium
   border on all four sides of the row.
3. One row per game in that date, in `sortKey` order. First data row: 15.95
   height. Every data cell: medium border on top of the first row and
   bottom of the last row in the block, thin everywhere else, medium on the
   left of column A and right of column L (closes the outer box).
4. Two blank rows before the next date's block.

**Fonts:** columns A–F use `Aptos` 11pt; columns G–L use `Aptos Narrow` 11pt.
Both are real fonts the production team has installed — if a future
recipient doesn't have them, Excel substitutes a default, which is fine.

**Row fill (confederation banding):** every data cell in a game's row is
filled solid by `g.continent`:

| Continent | ARGB | Derivation |
|---|---|---|
| Africa | `FFB4E5A2` | template's theme accent6, tint 0.6 |
| Europe | `FF83CBEB` | template's theme accent1, tint 0.6 |
| America | `FFF6C6AD` | template's theme accent2, tint 0.6 |
| Asia | `FFFFFF99` | plain yellow, not theme-derived |
| (unknown) | `FFD9D9D9` | fallback, not in the original template |

(The tint math: HSL lightness `l' = l*(1-tint) + tint` for tint > 0, then
back to RGB. Only matters if a 5th confederation is ever added.)

**Status mapping** (`backupClock.status` / `gfxExample.status` → cell text):
- `"ok"` → `"ok"`
- `"issue"` → `"NO"`
- `"pending"` or anything else → `""` (blank)

**Conditional formatting** (green `FF00B050`, red `FFFF0000` with white
`FFFFFFFF` font — colors pulled from the template's own `dxfs`):
- `I1:J<lastRow>`: equals `"OK"` → green *(case-insensitive, matches "ok")*
- `I1:J<lastRow>`: equals `"NO"` → red
- `K1:K<lastRow>`: equals `"yes"` → green
- `K1:K<lastRow>`: equals `"no"` → red

**GMT/ESP time cells:** the GMT cell holds a real Excel time value built
from `Date.UTC(1899,11,30,hh,mm)` and formatted `h:mm`. ESP Time is a live
formula, not a stored value, so editing GMT in Excel recalculates it.

## `GFX Operators` / `BOVM` sheets

Headers: `Country, City, Company, GFX operator , Email, Telephone`
(GFX Operators) or `Country, City, BOVM, Email, Telephone` (BOVM). One row
per unique `(city, role-person)` pair found across the window's games,
`Country` taken from `g.homeName`. `Email`/`Telephone` are always blank —
that data isn't in the Firestore game documents, only in the original
template's own roster sheets, which this export doesn't read.

## `Technical power` sheet

Headers: `Country, Venue, Technical Power`. One row per unique venue.
Conditional formatting: `"yes"` → green, `"no"` → red, same colors as above.

## Two bugs already found and fixed — don't reintroduce them

1. **Group by full calendar date *before* sorting, never sort-then-group.**
   If you sort the whole games list by a single global key and then start a
   new date block whenever `dateISO` changes from the previous row, a date
   whose games aren't already contiguous in that sort order gets split into
   two separate blocks in the output (confirmed happening for two different
   dates when the club-graphics artifact used a per-continent sort-key
   nudge). The safe pattern, already in `buildGamesSheet`: bucket every game
   into a `Map` keyed by `dateISO` first, order the map's keys
   chronologically, *then* sort each bucket's games internally.

2. **Time cells must use `Date.UTC(1899,11,30,hh,mm)`, never the local
   `Date` constructor.** Excel's time-only serial format uses 1899-12-30 as
   day zero. JS's local-timezone `Date` constructor for a date that old
   picks up the *host machine's historical zone offset* — which for some
   timezones (e.g. `Asia/Jerusalem`) isn't even a whole number of hours, so
   a 12:00 GMT kickoff silently became 09:39 in one real test run. `Date.UTC`
   sidesteps host-timezone entirely and is what's actually in the code.

`scripts/verify_export.js` checks for both of these — run it before shipping
any change (see `SKILL.md`).

## Re-deriving this spec from a new template

If the user hands you a different/updated `.xlsx` template and wants the
export to match it instead:

```python
import openpyxl
wb = openpyxl.load_workbook('the-new-template.xlsx')
ws = wb['Games W4']  # or whatever the relevant sheet is named
# walk header/data rows and print cell.font, cell.fill.fgColor, cell.border,
# cell.alignment, cell.number_format for a header cell, a data cell, and a
# date-separator cell — see the values above for the shape to expect.
# Column widths: ws.column_dimensions['A'].width etc.
# Merged ranges: ws.merged_cells.ranges
# Conditional formatting colors live in the raw XML, not cleanly through
# openpyxl's object model:
import zipfile, re
z = zipfile.ZipFile('the-new-template.xlsx')
xml = z.read('xl/styles.xml').decode('utf-8')
print(re.search(r'<dxfs.*?</dxfs>', xml, re.S).group(0))
```

Update the tables above with whatever's different, then update
`buildGamesSheet`/`buildRosterSheet`/`buildTechnicalPowerSheet` in
`admin.js` to match, and re-run `scripts/verify_export.js`.
