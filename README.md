# Eco City · Developer 1 Delivery Package

This project follows `00_Common_Project_Standard.md` and `01_Lead_Developer_Architecture.md`. The delivery scope covers the **Lead Developer / Architecture application framework**.

Completed: Vite project setup, shared state, event bus, responsive green city interface, welcome and help screens, module integration wiring, targeted tests, and integration and merge documentation.

**This is a runnable application framework. The final features from Developers 2–6 have not yet been integrated.** Building prices and effects use clearly marked zero-value preview data. Building placement, ending turns, and saving display “Not yet available” messages without generating simulated game results or saved games. Once the other developers deliver their work, replace the corresponding modules according to the integration guide.

## Getting Started

Node.js 22.12 or later and npm are required. Open a terminal in the `eco-city` folder containing this file and run:

```sh
npm install
npm run dev
```

Open the local address shown in the terminal, usually `http://localhost:5173`. Do not open `index.html` by double-clicking it; ES modules require a development server.

```sh
npm test         # Developer 1's state and event tests
npm run build    # Generate production files in dist
npm run preview  # Preview the production build locally
```

`node_modules` is intentionally excluded from this package. Install the dependencies before running the project for the first time. `package-lock.json` locks dependency versions.

## Files to Read First

| File | Purpose |
| --- | --- |
| `INTEGRATION_GUIDE.md` | Complete directory structure, team responsibilities, all interfaces, page mounting points, and merge workflow |
| `MERGE_NOTES.md` | Exact copy locations for each developer's files, placeholder file list, dependencies, and limitations |
| `CONTRIBUTION.md` | My completed work, design decisions, and suggested evidence for coursework |
| `VERIFICATION.md` | Actual test and build results, along with the commands used |
| `CONTRIBUTION.md` | Recommended screenshots to capture as coursework evidence |
| `lead-tests/` | Developer 1's targeted checks; these do not replace Developer 6's comprehensive tests |

Recommended integration order: **Developer 2: building data → Developer 3: grid → Developer 4: simulation → Developer 5: interface → Developer 6: storage and testing → full end-to-end review**.

`lead-tests/fixtures/` is intended solely for testing successful execution paths in subsequent browser checks. Do not copy these files into `src/`. This delivery does not implement or claim to have verified final scoring, building balance, recovery from corrupted saves, or other areas assigned to the remaining developers.