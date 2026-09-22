# Eco City classroom demo (3–5 minutes)

Prepare two local saves: `Green Turn 10` and `Carbon Turn 10`. Update any bracketed values after final balance integration; do not claim values the completed app does not show.

| Time | Speaker | On-screen cue | Simple English line |
|---|---|---|---|
| 0:00–0:25 | D1 | Welcome screen | “Hello. We are presenting Eco City, a Green City Simulator. Our challenge is to grow a city without damaging its future.” |
| 0:25–0:45 | D5 | Dashboard | “The player manages Money, Energy, CO2, Happiness, Eco Score, and ten turns. The dashboard makes each change visible.” |
| 0:45–1:05 | D1 | Start; select building | “I start a new city, choose a building, and place it on an empty tile. The game prevents invalid placements.” |
| 1:05–1:30 | D2 | Coal Plant card then tile | “A Coal Plant gives affordable energy. But it also increases CO2 and can damage our Eco Score. This is the short-term versus long-term trade-off.” |
| 1:30–1:55 | D2 | Solar Farm card then tile | “Now we choose a Solar Farm. It costs more at first, but it provides clean energy and supports a sustainable city.” |
| 1:55–2:20 | D3 | Metro, Park, Recycling Centre | “We can also use Metro, Park, and Recycling Centre. Infrastructure affects transport, happiness, waste, and the environment.” |
| 2:20–2:45 | D4 | Dashboard deltas; End Turn | “When we end a turn, the simulation applies transparent city effects. We can read the resource changes and explain the Eco Score.” |
| 2:45–3:05 | D6 | Save then load, if available | “The game saves a validated state in the browser. If saving is unavailable, the city still keeps running and shows a warning.” |
| 3:05–3:35 | D5 | Load prepared Green Turn 10; final screen | “To show the full result quickly, we prepared a Turn 10 city. Its final rating is [UPDATE AFTER BALANCE INTEGRATION].” |
| 3:35–4:00 | D6 | Final screen / team slide | “Our learning outcome is that green technology may need investment now, but it creates better long-term results for people and the planet.” |
| 4:00–4:20 | All / D1 | Contribution slide | “Developer 1 integrated the app; 2 built the catalogue; 3 built the grid; 4 built the simulation; 5 built the interface; and 6 delivered storage, tests, QA, and evidence.” |

## Prepared-state plan

1. Before class, run `npm install`, `npm run build`, the tests, and `npm run dev` once on the presentation laptop.
2. Prepare one fresh start for the interactive first two placements.
3. Prepare the two documented, validated 10-turn states using the game itself: a green strategy and a coal-heavy strategy.
4. Verify both final rating labels and replace bracketed text above with actual rating/score only after the final simulation values are locked.
5. Keep the browser zoom at 100%, close unrelated tabs, and use a local network-independent Vite session.

## Fallback

- **Save/load fails:** say, “Storage is optional; the game continues safely without persistence,” then continue with the pre-open Turn 10 tab or approved screenshot.
- **Dev server fails:** show the recorded screenshots in `evidence/04_final_demo/` and explain the tested flow; do not invent a live result.
- **Time is short:** show Coal Plant once, Solar Farm once, End Turn, then jump to prepared Turn 10.

## Final pre-demo checklist

- [ ] Fresh game, green final state, and coal-heavy final state have been checked.
- [ ] Final score/rating wording reflects the merged simulation.
- [ ] Build, storage test, and critical QA checks passed.
- [ ] Screen is readable; keyboard focus and no-motion mode were checked.
- [ ] Evidence folder is complete and private information has been removed.
- [ ] One person controls the laptop while speakers follow this order.
