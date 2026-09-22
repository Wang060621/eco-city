# Developer 1 — Merge Notes

## What to copy

Copy this `eco-city/` directory as the master project. Runtime source, root HTML, package files, lead documentation and `lead-tests/` are included. Do not copy generated `node_modules/` or `dist/`; run the package scripts to recreate them.

Production lead-owned files: `index.html`, `package.json`, `package-lock.json`, `src/main.js`, `src/style.css`, `src/core/gameState.js`, `src/core/eventBus.js`. Supporting files: `.gitignore`, `README_中文.md`, `INTEGRATION_GUIDE.md`, `MERGE_NOTES.md`, `CONTRIBUTION.md`, `VERIFICATION.md`, `lead-tests/`.

## Teammate copy destinations

Paths are relative to the master project root. Replace these exact placeholders with the teammate's final delivery; do not merge the internal implementation line by line.

| Developer | Placeholder(s) to replace | Additional files to copy |
| --- | --- | --- |
| 2 | `src/data/buildings.js` | `BUILDING_BALANCE.md` |
| 3 | `src/city/cityGrid.js`, `src/city/cityGrid.css` | `CITY_GRID_API.md` |
| 4 | `src/simulation/simulationEngine.js` | `GAME_RULES.md` |
| 5 | `src/ui/dashboard.js`, `src/ui/gameScreens.js`, `src/ui/ui.css` | `UI_API.md` |
| 6 | `src/storage/storage.js` | `tests/`, `TEST_PLAN.md`, `QA_CHECKLIST.md`, `EVIDENCE_GUIDE.md`, `DEMO_SCRIPT.md` |

There are exactly eight runtime placeholder files, counting both CSS files. If D3 supplies no CSS, retain an empty `src/city/cityGrid.css` file so the existing import succeeds. D5 screen functions must manage their internal focus when replacing screen content.

**Never overwrite a real module with `lead-tests/fixtures/*`.** These are tiny success-path probes loaded only by browser request interception. They are neither teammates' final implementations nor files to copy into master module paths.

## Imports and dependencies

`src/main.js` is already wired to the exact shared named exports and paths. See the exhaustive import block in `INTEGRATION_GUIDE.md`. All game/UI data is passed via state snapshots, parameters and callbacks. No second store or loop exists.

Only Vite and Vitest are application development dependencies. Versions are pinned in `package.json` and `package-lock.json`. No framework, backend, database or paid service is used. Node >=22.12 is required. No shared helper file was added because there was no cross-module lead-owned helper to extract.

Optional browser verification uses a separately installed Playwright package plus Edge; these are not required for `npm install`, `npm run dev`, `npm test` or `npm run build`. The delivered browser check can find Playwright through `PLAYWRIGHT_MODULE` or a normal local install.

## Merge order and verification

Merge D2 → D3 → D4 → D5 → D6 → final wiring. Preserve the common contract when implementations disagree. Re-run:

```sh
npm install
npm test
npm run build
npm run dev
```

Lead unit tests live in `lead-tests/` to avoid taking ownership of D6's `tests/`. The standard `vitest run` script discovers both. Browser smoke: with a dev server at `http://127.0.0.1:5173`, run `node lead-tests/browser-smoke.mjs` when Playwright/Edge are available. This lead-specific script expects preview behavior before replacing modules; D6 should adapt it for the final game.

Actual command outcomes are listed in `VERIFICATION.md`. The final integrated-game smoke checklist remains in `INTEGRATION_GUIDE.md`.

## Integration decisions to retain

- State snapshots are cloned; subscribers cannot mutate private state or another subscriber's arguments. The grid and building list must always match. Resource bounds/scoring remain D4-owned.
- Cards are generated only from `BUILDINGS`. The placeholder-only `preview: true` metadata renders “Preview” instead of a misleading zero price; final definitions may omit it.
- A single state subscription handles rendering and `state:changed`. Event listeners are registered once. Reset returns to welcome and removes the saved game without autosaving over the deletion.
- Main delegates all purchases/turn effects to D4 and persistence to D6. Grid methods never become a second purchase path.
- Recommend D6 return `{ ok, message? }` from save/autoSave/delete, because the common contract does not specify those return types. This allows accurate failed-overwrite/deletion feedback; void and boolean implementations remain callable but have less diagnostic precision.
- Main checks only `error` on the temporary end-turn result to display pending feedback. Final D4 results need no readiness export or extra flag.
- Unknown event names and malformed states throw clear errors. Expected storage errors must be handled by D6. Unexpected listener errors are logged and isolated, not hidden.

## Known limitations of this delivery

The shell intentionally cannot construct buildings, progress turns, save a session or calculate ratings until teammates replace their modules. Every balance value is a neutral preview fixture. Final score bands, energy bounds, unique building IDs/fallback, storage corruption/quota tests and the full game test suite are explicitly deferred to their assigned owners. The preview is usable with mouse and keyboard and demonstrates the architecture and visual shell; it does not demonstrate the completed sustainability simulation.
