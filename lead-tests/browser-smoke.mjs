// Optional lead-only check: Playwright + Microsoft Edge, with npm run dev running.
// Success-path fixtures are intercepted here only. They never replace files in src.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.ECO_CITY_URL || 'http://127.0.0.1:5173';
const evidence = fileURLToPath(new URL('../evidence/', import.meta.url));
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const checks = [];
const check = (label, condition) => { assert.ok(condition, label); checks.push(label); };
const state = () => page.evaluate(async () => (await import('/src/core/gameState.js')).getState());
try {
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Start Game', exact: true }).waitFor();
  await page.screenshot({ path: `${evidence}/01-welcome.png`, fullPage: true });
  await page.keyboard.press('Tab');
  check('Start Game is keyboard reachable after the heading', await page.getByRole('button', { name: 'Start Game', exact: true }).evaluate((el) => el === document.activeElement));
  await page.keyboard.press('Enter');
  check('Keyboard start opens the shell', await page.locator('#game-shell').isVisible());
  check('36 keyboard-accessible cells are rendered', await page.locator('#city-grid button').count() === 36);
  await page.locator('[data-building-type="solarFarm"]').focus();
  await page.keyboard.press('Enter');
  check('Selection updates the state store', (await state()).selectedBuilding === 'solarFarm');
  check('Selection preserves keyboard focus', await page.locator('[data-building-type="solarFarm"]').evaluate((el) => el === document.activeElement));
  await page.locator('#city-grid button').first().focus();
  check('Grid keyboard focus has a visible outline', await page.locator('#city-grid button').first().evaluate((el) => getComputedStyle(el).outlineStyle !== 'none'));
  await page.keyboard.press('Enter');
  check('Pending construction reports feedback without mutation', (await page.locator('#game-feedback').innerText()).includes('not available') && (await state()).buildings.length === 0);
  await page.locator('#end-turn-button').click();
  check('Pending turn module does not fake progression', (await state()).turn === 1);
  await page.locator('#save-game-button').click();
  check('Pending storage does not claim a save', (await page.locator('#game-feedback').innerText()).includes('not available'));
  await page.locator('#help-button').click();
  await page.keyboard.press('Escape');
  check('Escape closes help and restores focus', await page.locator('#help-button').evaluate((el) => el === document.activeElement));
  await page.screenshot({ path: `${evidence}/02-city-shell.png`, fullPage: true });
  await page.evaluate(async () => {
    const { on } = await import('/src/core/eventBus.js');
    window.__counts = { selected: 0, reset: 0, started: 0, changed: 0 };
    for (const [event, key] of [['building:selected', 'selected'], ['game:reset', 'reset'], ['game:started', 'started'], ['state:changed', 'changed']]) on(event, () => { window.__counts[key] += 1; });
  });
  for (let i = 0; i < 3; i += 1) {
    await page.locator('#reset-game-button').click();
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await page.locator('[data-building-type="park"]').click();
  }
  check('Repeated reset/start has one response per action', JSON.stringify(await page.evaluate(() => window.__counts)) === JSON.stringify({ selected: 3, reset: 3, started: 3, changed: 6 }));
  await page.setViewportSize({ width: 1366, height: 768 });
  check('Laptop layout has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 390, height: 844 });
  check('390px layout has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${evidence}/03-mobile-shell.png`, fullPage: true });
  await page.setViewportSize({ width: 1366, height: 900 });
  for (const [module, fixture] of [['simulation/simulationEngine.js', 'simulation.js'], ['storage/storage.js', 'storage.js']]) {
    const body = await readFile(new URL(`./fixtures/${fixture}`, import.meta.url), 'utf8');
    await page.route(`**/src/${module}`, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body }));
  }
  await page.reload();
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.locator('[data-building-type="solarFarm"]').click();
  await page.locator('#city-grid button').first().click();
  check('Successful result is installed and autosaved', (await state()).buildings.length === 1 && await page.evaluate(() => JSON.parse(localStorage.getItem('ecoCitySave')).state.buildings.length === 1));
  await page.locator('#city-grid button').first().click();
  check('Failed placement preserves the successful state', (await state()).buildings.length === 1);
  await page.reload();
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  check('A saved state loads before welcome/start', (await state()).buildings.length === 1);
  await page.evaluate(async () => {
    window.__endCount = 0;
    (await import('/src/core/eventBus.js')).on('game:ended', () => { window.__endCount += 1; });
  });
  for (let turn = 1; turn <= 10; turn += 1) await page.locator('#end-turn-button').click();
  check('Turn 10 stays at 10 and opens the final renderer once', (await state()).turn === 10 && (await state()).gameOver && await page.getByRole('heading', { name: 'Wiring check complete' }).isVisible() && await page.evaluate(() => window.__endCount) === 1);
  await page.getByRole('button', { name: 'Restart Game', exact: true }).click();
  check('Restart resets and removes the saved game', (await state()).turn === 1 && (await state()).buildings.length === 0 && await page.evaluate(() => localStorage.getItem('ecoCitySave')) === null);
  check('No console errors or uncaught exceptions', errors.length === 0);
  const report = { testedAt: new Date().toISOString(), browser: await browser.version(), checks, errors,
    note: 'Screenshots use the real preview. Success, save/load and turn-10 checks use isolated test fixtures; final teammate rules are not verified.' };
  await writeFile(`${evidence}/browser-checks.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
