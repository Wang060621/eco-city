# Eco City QA checklist

Severity: **Critical** — cannot start/finish, data loss/crash, core rules broken, or build failure. **Major** — important feature/resource result wrong, unusable control/layout, or save/load recovery failure. **Minor** — visual, copy, spacing, or animation issue.

- [ ] `npm install`, `npm run dev`, `npm run build`, and test suite pass.
- [ ] No console errors, unhandled rejections, broken buttons, or duplicate button actions.
- [ ] State, grid, and buildings agree; no duplicate IDs/buildings.
- [ ] No invalid values, `NaN`, `Infinity`, or impossible resource values; clamping works.
- [ ] Cost is deducted exactly once; occupied/invalid/unaffordable placement is rejected.
- [ ] Turn count stops at 10; repeated End Turn is safe; rating boundaries are correct.
- [ ] `ecoCitySave` uses v1; corrupt/unsupported saves recover safely.
- [ ] Refresh, continue, reset, replay, and save deletion work.
- [ ] Keyboard-only flow works; labels, focus, contrast, and non-colour cues are clear.
- [ ] Laptop and narrow screens do not overflow; reduced-motion preference is respected.
- [ ] Sustainability/Green Tech cause-and-effect is visible in player-facing screens.
- [ ] Evidence is complete, private, captioned, and demo runs locally/offline.

## Bug report template

**Title:**  
**Environment/build:**  
**Severity:** Critical / Major / Minor  
**Owner:**  
**Steps to reproduce:**  
**Expected result:**  
**Actual result:**  
**Screenshot/video:**  
**Notes/workaround:**  
