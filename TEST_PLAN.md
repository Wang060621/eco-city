# Eco City test plan

Status starts as `Not run`. Critical items must pass before the classroom demo. Automated means the Node storage suite or final integration suite; Manual means a browser check with a screenshot.

| ID | Feature | Precondition | Steps | Expected result | Evidence | Priority | Status |
|---|---|---|---|---|---|---|---|
| A | Start game | Welcome visible | Select Start | Fresh 6×6 city and initial resources | Welcome/game view | Critical | Not run |
| B | Building selection | Game running | Select each card | Selected type and info update once | Selected card | High | Not run |
| C | Valid placement | Empty tile, funds | Place selected building | One instance appears in grid/list | Grid view | Critical | Not run |
| D | Money deduction | Known cost | Place once | Money falls by exact catalogue cost once | Dashboard delta | Critical | Not run |
| E | Insufficient money | Funds below cost | Try placement | Clear rejection; state unchanged | Warning | Critical | Not run |
| F | Occupied tile | Building on tile | Place on same tile | Rejected; existing building remains | Grid warning | Critical | Not run |
| G | Invalid placement | API test | Use invalid coordinates | Safe invalid-cell result | Test output | High | Not run |
| H | Coal Plant trade-off | Funds, empty tile | Build Coal Plant | Energy benefit and environmental downside shown | Before/after | High | Not run |
| I | Solar Farm | Funds, empty tile | Build Solar Farm | Clean-energy sustainability effect | Before/after | High | Not run |
| J | Wind Turbine | Funds, empty tile | Build Wind Turbine | Catalogue effect applied | Before/after | Medium | Not run |
| K | Road | Funds, empty tile | Build Road | Catalogue effect applied | Before/after | Medium | Not run |
| L | Metro | Funds, empty tile | Build Metro | Catalogue effect applied | Before/after | Medium | Not run |
| M | Park | Funds, empty tile | Build Park | Happiness effect applied | Before/after | Medium | Not run |
| N | Residential | Funds, empty tile | Build Residential | Development/energy demand visible | Before/after | Medium | Not run |
| O | Recycling Centre | Funds, empty tile | Build centre | Catalogue effect applied | Before/after | Medium | Not run |
| P | End Turn | Active game | End one turn | Deltas, summary, and turn advance correctly | Dashboard | Critical | Not run |
| Q | Turn 10 | Turn 10 prepared | End turn | Game ends at 10; no Turn 11 | Final screen | Critical | Not run |
| R | Rating boundaries | Fixtures for 0/249/250/449/450/649/650/799/800/1000 | Calculate final ratings | Exact named band at each boundary | Automated log | Critical | Not run |
| S | Determinism | Same fixture twice | Calculate Eco Score twice | Same score and no mutation | Automated log | Critical | Not run |
| T | Energy shortage | Energy at/under limit | End turn | Defined penalty/feedback occurs | Warning | High | Not run |
| U | Save game | Valid runtime state | Save | `ecoCitySave`, v1 envelope, valid timestamp | DevTools/test | Critical | Not run |
| V | Load game | Valid save | Refresh/continue | Equivalent fresh state restored | Before/after | Critical | Not run |
| W | Corrupt save | Invalid JSON | Load/continue | Safe recovery; game still starts | Test/browser | Critical | Not run |
| X | Version rejection | Save version ≠1 | Load | Rejected safely | Test output | High | Not run |
| Y | Reset/delete | Existing save | Reset | Fresh state and no save | DevTools/test | Critical | Not run |
| Z | Refresh/continue | Mid-game save | Refresh then continue | Same city/resources resume | Browser | High | Not run |
| AA | Repeat start/reset | Game started/reset repeatedly | Repeat controls | No duplicated listeners/actions | Console/video | High | Not run |
| AB | Keyboard/focus | Browser | Tab, Enter, Space on controls/grid | Reachable controls and visible focus | Screenshot | High | Not run |
| AC | Narrow layout | 320–600px viewport | Navigate screens | No clipped controls/overflow | Responsive screenshot | Medium | Not run |
| AD | Production build | Dependencies installed | `npm run build` | Build succeeds; no console errors in preview | Terminal | Critical | Not run |
| AE | Green 10-turn run | Prepared green strategy | Complete 10 turns | High-score sustainable final city | Final rating | High | Not run |
| AF | High-carbon run | Prepared coal-heavy strategy | Complete 10 turns | Lower-score trade-off visible | Final rating | High | Not run |

## Test layers

- **Automated module:** `node --test tests/storage.test.mjs`; add game-state, grid, catalogue, simulation, and UI tests after integration.
- **Automated integration:** exercise Start → placement → End Turn → Save → reload → Turn 10 with the real modules.
- **Manual presentation:** AB, AC, dashboard readability, reduced motion, captions, and all demo steps.

Before demo, run Critical items A, C–F, P–S, U–W, Y, and AD, then one AE or AF full run.
