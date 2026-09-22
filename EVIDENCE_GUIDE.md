# Eco City evidence guide

Keep evidence in:

```text
evidence/
├── 01_planning/
├── 02_individual_contributions/
├── 03_integration_and_testing/
└── 04_final_demo/
```

Capture meaningful behavior, use readable filenames/captions, and remove passwords, API keys, account emails, student numbers, unrelated tabs, and private notifications.

| # | Stage / owner | Capture and proof | English caption / filename | Privacy check |
|---|---|---|---|---|
| 1 | Planning / team | Six-person role plan; proves task ownership | `Six-person Eco City role plan` / `01_planning/01_roles.png` | No student IDs |
| 2 | Planning / D1 | Idea or wireframe; proves concept | `Initial Eco City wireframe` / `01_wireframe.png` | Clean browser |
| 3 | Planning / D1 | Shared architecture/contract; proves integration agreement | `Shared module contract` / `02_contract.png` | Hide paths if personal |
| 4 | Build / D1 | Running Vite shell; proves runnable app | `Eco City running locally` / `02_individual_contributions/01_shell.png` | Hide terminal user info |
| 5 | Build / D2 | Catalogue/balance comparison; proves building trade-offs | `Building balance comparison` / `02_catalogue.png` | No unrelated files |
| 6 | Build / D3 | Grid and rejected occupied tile; proves placement rules | `Grid placement validation` / `03_grid_rejection.png` | Clear labels |
| 7 | Build / D4 | Formula/test and resource change; proves deterministic simulation | `Transparent Eco Score calculation` / `04_simulation.png` | No secrets |
| 8 | Build / D5 | Dashboard and screens; proves accessible presentation layer | `Resource dashboard and game screens` / `05_ui.png` | Readable UI |
| 9 | Build / D6 | Save/load test and QA plan; proves persistence safety | `Save/load validation checks` / `06_storage_qa.png` | No real account data |
| 10 | Throughout / all | Git or Codex progress for every member | `Developer progress evidence` / `02_individual_contributions/07_progress.png` | Hide notifications |
| 11 | Integration / D1 | First complete playable build | `First integrated playable version` / `03_integration_and_testing/01_playable.png` | Clean app |
| 12 | Integration / owner | Bug report plus fixed behavior | `Placement bug found and fixed` / `02_bug_fix.png` | No private chat |
| 13 | Testing / D6 | Passing tests/build terminal | `Automated checks and build passed` / `03_checks.png` | Hide local account path |
| 14 | Demo / D4+D5 | Coal Plant before/after | `Coal energy versus CO2 trade-off` / `04_final_demo/01_coal.png` | Values readable |
| 15 | Demo / D4+D5 | Green technology improvement | `Solar and green infrastructure improve Eco Score` / `02_green.png` | Values readable |
| 16 | Demo / team | Finished grid/city | `Final Eco City layout` / `03_final_city.png` | No browser tabs |
| 17 | Demo / D5 | Final rating screen | `Final Eco City rating` / `04_rating.png` | Rating readable |
| 18 | Presentation / team | Six-person group demo | `Eco City team presentation` / `05_team_demo.jpg` | Consent to photo |

## Contribution evidence map

| Developer | Owned files | Recommended proof |
|---|---|---|
| D1 | `main.js`, core, app shell | Running integrated flow |
| D2 | `data/buildings.js`, balance doc | Catalogue and cost comparison |
| D3 | `city/cityGrid.js` | Keyboard grid and rejected tile |
| D4 | `simulation/simulationEngine.js` | Turn calculation and final rating |
| D5 | `ui/dashboard.js`, `gameScreens.js`, `ui.css` | Deltas, warning, final screen |
| D6 | `storage/storage.js`, tests, QA/docs | Save/load, test report, evidence plan |
