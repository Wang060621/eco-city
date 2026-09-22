# Developer 1 — Contribution

## Implemented

Built the Vite vanilla JavaScript master application and stable semantic mounts for Eco City. Delivered the complete shared state store and event bus, application orchestration, responsive base visual system, temporary compatible teammate modules, integration instructions and focused lead verification.

The shell includes the required Eco City / Green City Simulator welcome text and Start/How to Play controls, six resource regions, eight building selectors, a 6×6 keyboard-accessible map preview, city mission/status/building details, save/end-turn/reset controls, live feedback and an alternate screen mount.

## Design decisions

1. **One source of state:** the store deep-clones every incoming/outgoing snapshot. Basic structure and grid/list consistency are validated before committing. Economic rules belong to D4, avoiding conflicting formulas.
2. **Predictable notifications:** listeners are deduplicated, isolated on error and notified with independent snapshots. Nested store updates are queued so every observer sees the same transition order.
3. **Clear integration boundaries:** main orchestrates; D2 supplies data, D3 renders the map, D4 computes game changes, D5 renders resources/screens and D6 persists. Placeholders use exact shared exports but contain no competing balance or scoring implementation.
4. **Honest preview behavior:** actions that need unfinished modules return a clear pending result without charging money, placing buildings, inventing a score or claiming a save.
5. **Accessible controls:** native buttons, accessible cell names, selected-card `aria-pressed`, visible focus, keyboard activation, focus restoration from help and a polite live feedback region.
6. **Replaceable presentation:** D1 owns layout/tokens; temporary D3 and D5 component CSS stays in their files. No external fonts, image downloads or runtime asset requests are necessary.
7. **Stable lifecycle:** control listeners are bound once. Reset changes state and view, not the application bootstrap. Cards retain focus during selection. After grid replacement, main focuses only the public mount.

## Verification and reproduction

```sh
npm install
npm test
npm run build
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

With the dev server running and Playwright/Edge available:

```sh
node lead-tests/browser-smoke.mjs
```

See `VERIFICATION.md` for actual results. Unit checks target state isolation, atomic invalid-state rejection, grid/list consistency, subscription cleanup, nested notifications, all seven event channels, duplicate handling and listener failure isolation. The optional browser script covers keyboard navigation, responsive layout, live feedback, repeated start/reset and main's success/load/end/restart wiring. Its last group uses clearly marked fixtures and does not validate teammates' final rules.

## Course evidence

Suggested screenshots for the course submission:

- Running welcome screen with the exact brief copy.
- Desktop city shell showing the resource bar, selectors, map, mission and controls.
- Narrow-screen layout showing responsive behavior.

- Open `src/core/gameState.js` beside the successful focused test output to show cloned state and subscriber notifications.
- Open the `INTEGRATION_GUIDE.md` event-flow diagram and `src/main.js` purchase/end-turn functions to show the integration boundaries.
- Capture the real integrated game after Developers 2–6 are merged: successful placement, signed resource effects and the turn-10 result. Label these separately from the lead preview.

Only capture project content. Exclude unrelated tabs, passwords, keys, student IDs and other personal information. Do not present the test-only fixture result as a real simulation.

## Files and handoff

The complete file list, ownership table and import list are in `INTEGRATION_GUIDE.md`; exact teammate copy destinations and remaining placeholders are in `MERGE_NOTES.md`. No other developer's final module, final test plan or rules document is claimed as this contribution.
