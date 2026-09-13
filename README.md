# WCQ Graphics Control

Two static pages for tracking TV graphics production on FIBA World Cup Qualifier windows:

- **`index.html`** — internal admin dashboard (game schedule, BOVM/GFX crew, backup clock & GFX example status, team colours editor). Requires the admin key below to read or write data.
- **`colors.html`** — public colour reference for external graphics vendors (palette, team colours, colour pairing per game). No login needed.

Data lives in a Google Sheet, served through a small Apps Script Web App (`backend/Code.gs`). GitHub Pages only hosts the static HTML/CSS/JS; all reads and writes go to your own Google account.

## One-time backend setup (~10 minutes)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet. Name it anything, e.g. "WCQ Graphics Data".
2. In the sheet, open **Extensions → Apps Script**.
3. Delete the placeholder code in `Code.gs`, then paste in the contents of `backend/Code.gs` from this repo.
4. Click the gear icon **Project Settings** (left sidebar) → scroll to **Script Properties** → **Add script property**.
   - Property: `ADMIN_TOKEN`
   - Value: any password you choose (keep it private — this is what protects editing and the internal schedule).
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then authorize the script with your Google account when prompted (this is expected — it's your own script accessing your own sheet).
6. Copy the **Web app URL** it gives you (ends in `/exec`).
7. Open `index.html` on the live site, click **Settings**, and paste in the Web app URL and the `ADMIN_TOKEN` you chose. This is saved only in your browser.

Send the Web app URL and admin token to whoever should be able to run the admin dashboard from their own computer — anyone with the link but without the admin key can only see the public colour page.

## Loading a new window's data

Once deployed, data is imported via one `bulkSeed` API call per window (games + team colours + palette) — ask Claude to prepare and send it, or POST it yourself with the shape found in `backend/Code.gs`'s `bulkSeed` function.

## Files

```
index.html      admin dashboard
colors.html     public colour reference
styles.css      shared styling for both pages
admin.js        admin dashboard logic
colors.js       public colour page logic (with an embedded snapshot as a fallback)
backend/Code.gs Apps Script backend — paste into your Google Sheet's script editor
```
