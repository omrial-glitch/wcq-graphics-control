# WCQ Team Uniform Colours

Public colour reference for TV graphics vendors on FIBA World Cup Qualifier windows: each team's jersey colours, which colour each side wears in every game, and the approved colour palette.

- `colors.html` / `colors.js` — the page. It reads team colours, per-game pairings and the palette live from Firestore (public, read-only) and falls back to the snapshot embedded in `colors.js`.
- `index.html` — sends visitors to `colors.html`.
- `firebase-config.js` — the Firebase project's public web config (not a secret).
- `fonts/` — the score-stripe typeface.
