import './style.css';
import './city/cityGrid.css';
import './ui/ui.css';
import { getState, setState, updateState, resetState, subscribe } from './core/gameState.js';
import { emit } from './core/eventBus.js';
import { BUILDINGS, getBuildingDefinition } from './data/buildings.js';
import { renderCityGrid } from './city/cityGrid.js';
import { applyBuildingPurchase, endTurn, calculateFinalRating } from './simulation/simulationEngine.js';
import { renderResourceDashboard, updateResourceDashboard, getCityStatusMessage, renderBuildingInfo } from './ui/dashboard.js';
import { renderWelcomeScreen, renderHowToPlayScreen, renderGameOverScreen } from './ui/gameScreens.js';
import { autoSave, saveGame, deleteSavedGame, loadGame, hasSavedGame } from './storage/storage.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <a class="skip-link" href="#city-grid">Skip to city</a>
  <header class="site-header">
    <a class="brand" href="#" id="brand-link" aria-label="Eco City home">
      <span class="brand-icon" aria-hidden="true">↗</span>
      <span><strong>Eco City</strong><span class="brand-subtitle">Green City Simulator</span></span>
    </a>
    <span class="header-note">SMALL CHOICES. GREENER CITIES.</span>
    <button class="button button-quiet" id="help-button" type="button">How to Play <span aria-hidden="true">↗</span></button>
  </header>
  <main id="game-shell" hidden>
    <section class="page-heading" aria-labelledby="city-heading">
      <div><p class="eyebrow">YOUR CITY, REIMAGINED</p><h1 id="city-heading" tabindex="-1">A greener future starts here.</h1></div>
      <span class="edition-badge">● <span id="city-phase">City planning</span></span>
    </section>
    <section id="resource-dashboard" class="resource-bar" aria-label="City resources"></section>
    <div class="workspace">
      <aside class="panel catalogue" aria-labelledby="build-title">
        <div class="panel-heading"><div><p class="eyebrow">01 / PLAN</p><h2 id="build-title">Build your city</h2></div><span class="count-badge" id="building-count"></span></div>
        <p class="panel-intro">Choose a building, then a city lot.</p>
        <div id="building-selector" aria-label="Building selection"></div>
      </aside>
      <section class="panel city-panel" aria-labelledby="grid-title">
        <div class="panel-heading"><div><p class="eyebrow">02 / BUILD</p><h2 id="grid-title">Your city map</h2></div><span class="map-label">6 × 6 LOTS</span></div>
        <div class="map-surface"><span class="compass" aria-hidden="true">N ↑</span><div id="city-grid" tabindex="-1"></div></div>
        <div class="map-caption"><span><span class="legend-square" aria-hidden="true"></span> Available land</span><span id="land-count">0 / 36 lots used</span></div>
        <p class="map-hint" id="map-hint">Select a building to begin planning.</p>
      </section>
      <aside class="insight-column" aria-label="City insights">
        <section class="mission-panel" aria-labelledby="mission-title"><p class="eyebrow">03 / BALANCE</p><h2 id="mission-title">Prosperity with<br>a lighter footprint.</h2><p>Balance growth, clean energy and the wellbeing of your citizens.</p><div class="mission-foot"><span aria-hidden="true">◎</span><span>One city. Ten turns.<br><strong>Make every choice count.</strong></span></div></section>
        <section class="panel status-panel" aria-labelledby="status-title"><p class="eyebrow" id="status-title">CITY PULSE</p><p id="city-status"></p></section>
        <section class="panel selection-panel" aria-labelledby="selection-title"><p class="eyebrow" id="selection-title">BUILDING DETAILS</p><div id="building-info"></div></section>
      </aside>
    </div>
    <footer class="control-bar"><div class="feedback-wrap"><div id="game-feedback" role="status" aria-live="polite" aria-atomic="true">Your next chapter starts with a plan.</div><span id="save-status">Session only</span></div><div class="control-actions"><button class="button button-quiet" id="reset-game-button" type="button">Reset Game</button><button class="button button-secondary" id="save-game-button" type="button">Save City</button><button class="button button-primary" id="end-turn-button" type="button">End Turn <span aria-hidden="true">→</span></button></div></footer>
    <p class="page-footnote">ECO CITY <span>•</span> SUSTAINABILITY & GREEN TECH</p>
  </main>
  <section id="screen-layer" aria-label="Game screen"></section>
  <dialog id="save-success-dialog" class="save-dialog" aria-labelledby="save-dialog-title" aria-describedby="save-dialog-message">
    <span class="save-dialog-icon" aria-hidden="true">✓</span>
    <h2 id="save-dialog-title">City saved successfully!</h2>
    <p id="save-dialog-message">Your city has been saved on this device. You can come back and continue playing anytime.</p>
    <form method="dialog"><button class="button button-primary" type="submit" autofocus>OK</button></form>
  </dialog>
`;

const byId = (id) => document.getElementById(id);
const shell = byId('game-shell');
const screen = byId('screen-layer');
const cards = new Map();
let currentView = 'welcome'; // View state only; game state lives exclusively in gameState.js.
let helpReturnView = 'welcome';
let returnFocus = null;
let dashboardRendered = false;
let unsubscribe;

function showFeedback(message, kind = 'info') {
  const region = byId('game-feedback');
  region.textContent = message;
  region.dataset.kind = kind;
}

function buildSelector() {
  const selector = byId('building-selector');
  const fragment = document.createDocumentFragment();
  for (const definition of Object.values(BUILDINGS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'building-card';
    button.dataset.buildingType = definition.id;
    button.setAttribute('aria-pressed', 'false');
    const icon = document.createElement('span');
    icon.className = 'building-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = definition.icon;
    const label = document.createElement('span');
    label.className = 'building-label';
    const name = document.createElement('strong');
    name.textContent = definition.name;
    const category = document.createElement('small');
    category.textContent = definition.category;
    label.append(name, category);
    const cost = document.createElement('span');
    cost.className = 'building-cost';
    cost.textContent = definition.preview ? 'Preview' : `$${definition.cost.toLocaleString('en-US')}`;
    button.append(icon, label, cost);
    fragment.append(button);
    cards.set(definition.id, button);
  }
  selector.replaceChildren(fragment);
  byId('building-count').textContent = String(cards.size).padStart(2, '0');
}

function renderApp(previousState) {
  const state = getState();
  if (!dashboardRendered) {
    renderResourceDashboard(byId('resource-dashboard'), state);
    dashboardRendered = true;
  } else updateResourceDashboard(byId('resource-dashboard'), state, previousState);
  for (const [type, button] of cards) {
    button.setAttribute('aria-pressed', String(type === state.selectedBuilding));
    button.disabled = state.gameOver;
  }
  // Selection changes do not replace the grid. This preserves keyboard focus.
  if (!previousState || JSON.stringify(previousState.cityGrid) !== JSON.stringify(state.cityGrid)
    || previousState.gameOver !== state.gameOver) {
    renderCityGrid(byId('city-grid'), state, { onCellClick: handleCellClick, getBuildingDefinition });
  }
  byId('city-status').textContent = getCityStatusMessage(state);
  const selected = getBuildingDefinition(state.selectedBuilding);
  renderBuildingInfo(byId('building-info'), selected);
  byId('map-hint').textContent = selected ? `${selected.name} selected · Choose an empty lot.` : 'Select a building to begin planning.';
  byId('land-count').textContent = `${state.buildings.length} / 36 lots used`;
  byId('city-phase').textContent = state.gameOver ? 'City complete' : 'City planning';
  byId('end-turn-button').disabled = state.gameOver;
}

function showView(view, finalResult) {
  currentView = view;
  const isGame = view === 'game';
  shell.hidden = !isGame;
  screen.hidden = isGame;
  if (isGame) {
    screen.replaceChildren();
    byId('city-heading').focus();
    return;
  }
  if (view === 'welcome') renderWelcomeScreen(screen, { onStart: startGame, onHowToPlay: openHelp });
  if (view === 'help') renderHowToPlayScreen(screen, { onBack: closeHelp });
  if (view === 'over') renderGameOverScreen(screen, getState(), finalResult ?? calculateFinalRating(getState()), { onRestart: handleReset });
  // Screen renderers control their own markup and focus management.
}

function startGame() {
  const state = getState();
  renderApp();
  if (state.gameOver) { showView('over'); return; }
  showView('game');
  emit('game:started', { state });
}

function openHelp() {
  if (currentView === 'help') return;
  returnFocus = document.activeElement;
  helpReturnView = currentView;
  showView('help');
}

function closeHelp() {
  showView(helpReturnView);
  if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus();
}

function selectBuilding(type) {
  if (currentView !== 'game' || getState().gameOver || !getBuildingDefinition(type)) return;
  const state = updateState({ selectedBuilding: type });
  emit('building:selected', { type, state });
  showFeedback(`${getBuildingDefinition(type).name} selected. Choose an empty lot.`);
}

function persist(state, manual = false) {
  const result = manual ? saveGame(state) : autoSave(state);
  const failed = result === false || result?.ok === false;
  byId('save-status').textContent = failed ? 'Session only · Save unavailable' : hasSavedGame() ? 'City saved on this device' : 'Session only';
  if (manual || failed) showFeedback(failed ? result?.message ?? 'Your city could not be saved on this device.'
    : hasSavedGame() ? 'Your city has been saved on this device.' : 'No saved city is available on this device.', failed ? 'error' : 'info');
  if (manual && result?.ok === true) {
    const dialog = byId('save-success-dialog');
    if (!dialog.open) dialog.showModal();
  }
}

function handleCellClick(row, col) {
  const state = getState();
  if (currentView !== 'game' || state.gameOver) return;
  if (!state.selectedBuilding) { showFeedback('Choose a building first.', 'error'); return; }
  const result = applyBuildingPurchase(state, state.selectedBuilding, row, col, BUILDINGS);
  if (!result.ok) { showFeedback(result.message, 'error'); return; }
  setState(result.state); // Subscription owns rendering; there is no second render here.
  emit('building:placed', { building: result.building, state: getState() });
  showFeedback(result.message, 'success');
  persist(getState());
  // A renderer may replace its cells; focus the public mount without inspecting its DOM.
  byId('city-grid').focus();
}

function handleEndTurn() {
  const state = getState();
  if (currentView !== 'game' || state.gameOver) return;
  const result = endTurn(state, BUILDINGS);
  if (result.error) { showFeedback(result.message, 'error'); return; } // Only the temporary stub uses this branch.
  setState(result.state);
  emit('turn:ended', { state: getState(), turnSummary: result.turnSummary, gameOver: result.gameOver });
  showFeedback(`Turn ${state.turn} completed. ${Object.entries(result.turnSummary).map(([key, value]) => `${key} ${value >= 0 ? '+' : ''}${value}`).join(' · ')}`, 'success');
  persist(getState());
  if (result.gameOver) {
    emit('game:ended', { state: getState(), finalResult: result.finalResult });
    showView('over', result.finalResult);
  }
}

function handleReset() {
  const state = resetState();
  const result = deleteSavedGame();
  emit('game:reset', { state });
  byId('save-status').textContent = 'Session only';
  showFeedback(result === false || result?.ok === false ? 'City reset. Saved data could not be cleared on this device.' : 'A fresh city is ready.', 'info');
  showView('welcome');
}

function initApp() {
  const saved = loadGame();
  if (saved) {
    try { setState(saved); }
    catch (error) { console.warn('Eco City ignored an invalid saved state:', error); }
  }
  buildSelector();
  unsubscribe = subscribe((nextState, previousState) => {
    renderApp(previousState);
    emit('state:changed', { nextState, previousState });
  });
  byId('building-selector').addEventListener('click', (event) => {
    const button = event.target.closest('[data-building-type]');
    if (button) selectBuilding(button.dataset.buildingType);
  });
  byId('end-turn-button').addEventListener('click', handleEndTurn);
  byId('reset-game-button').addEventListener('click', handleReset);
  byId('save-game-button').addEventListener('click', () => persist(getState(), true));
  byId('help-button').addEventListener('click', openHelp);
  byId('brand-link').addEventListener('click', (event) => { event.preventDefault(); showView('welcome'); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && currentView === 'help') closeHelp(); });
  renderApp();
  showView('welcome');
}

initApp();
// Vite replaces the page DOM on module update; release the store subscription too.
if (import.meta.hot) import.meta.hot.dispose(() => unsubscribe?.());
