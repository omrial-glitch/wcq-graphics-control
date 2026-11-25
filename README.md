# WCQ Graphics Control

Two static pages for tracking TV graphics production on FIBA World Cup Qualifier windows:

- **`index.html`** — internal admin dashboard (game schedule, BOVM/GFX crew, backup clock & GFX example status, team colours editor). Requires signing in with the admin account to read or write the schedule.
- **`colors.html`** — public colour reference for external graphics vendors (palette, team colours, colour pairing per game). No login needed, no access to the schedule/crew data.

Data lives in **Firebase (Firestore)**, read and written directly from the browser via the Firebase SDK. GitHub Pages only hosts the static HTML/CSS/JS; `firebase-config.js` holds the project's public web config (not a secret — Firebase security comes from the Firestore rules below and from sign-in, not from hiding this file). It holds no personal details; the admin's email lives only in the Firestore rules.

## How access is controlled

Firestore rules (set in the Firebase console under Firestore Database → Rules) enforce:
- `windows/{id}/games/**` (the full schedule — BOVM, GFX crew, statuses, notes): **admin only**, both read and write.
- `windows/{id}/teams/**`, `windows/{id}/publicPairings/**`, `palette/**`: anyone can **read** (this is what `colors.html` shows), only the **admin** can write.

"Admin" means signed in with Firebase Authentication (Email/Password) as the one admin account created for this project — checked by email in the rules. Sign in from `index.html` via the gear icon.

## Where the data comes from

The schedule, BOVM/GFX crew, venues and team colours are never typed in by hand — they're imported from the FIBA Excel files (production plan, BOVM/GFX sheets, uniform colours workbook). Whenever there's a new window or a revision to an existing one, send the updated Excel file(s) to Claude; it re-runs the same extraction/cross-referencing and prepares a fresh `seed-data.js` to import.

The only things maintained directly in the app (not imported): live backup-clock/GFX-example status and notes on each game, manual colour tweaks in the Team Colours tab (both the team master colours and per-game colour overrides), and the palette.

## Loading a window for the first time

`seed-data.js` carries the already-extracted data for a window (currently Window 4). Sign in as admin, select the window in the dropdown, and if it's empty you'll see an **"Import"** button — click it once to write that data into Firestore. Re-running it is safe to do again for the same window (it overwrites with the same values) but a *different* window's already-live data is never touched.

## Crew names and operator contacts (admin only)

`seed-data.js` is public, so it carries **no crew names**: BOVM and GFX operator are left empty there. After importing a window, the admin clicks **Load from Production Plan (.xlsx)**. That button is on the schedule banner and on the GFX Operators tab. The browser reads the BOVMS and GFX sheets (`operators.js`, same venue matching as the local pipeline) and writes the crew into the admin-only game documents. The same click also loads the operator contacts.

## GFX operator contacts (admin only)

The **GFX Operators** tab in `index.html` lists the window's graphics operators with phone numbers and emails, filtered by company, with one-click "Copy names & numbers" and "Download contacts (.vcf)" for building WhatsApp groups per company.

Phone numbers and emails are **never committed to this public repo**. The admin clicks "Load from Production Plan (.xlsx)" and picks the window's Production Plan. The browser reads its GFX sheet (`operators.js`) and saves the list to `windows/{id}/games/_meta/contacts/gfx`, which is under the admin-only `games/**` rule. If saving is refused, the Firestore rule for `windows/{id}/games` must cover sub-paths (`{document=**}`).

## Files

```
index.html          admin dashboard
colors.html         public colour reference
styles.css          shared styling for both pages
admin.js            admin dashboard logic (Firebase Auth + Firestore)
operators.js        reads GFX operator contacts from the Production Plan in the browser (admin tab)
colors.js           public colour page logic (Firestore, read-only, with an embedded snapshot as a fallback)
firebase-config.js  Firebase project config (public by design)
seed-data.js        one-time import payload for Window 4 (games, teams, palette)
backend/Code.gs     retired — the earlier Google Sheets/Apps Script backend, kept only for history
```
