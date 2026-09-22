// Presentation only: all resource and building values come from the caller.
const STATUS = Object.freeze({ extremeCO2: 85, highCO2: 65, lowEnergy: 0, lowHappiness: 25, highEcoScore: 800 });
const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 20 });
const RESOURCES = [
  { key: 'money', label: 'Money', icon: '💰', note: 'Construction budget' },
  { key: 'energy', label: 'Energy', icon: '⚡', note: 'Keep your city powered' },
  { key: 'co2', label: 'CO2', icon: '🌫', note: 'Lower is cleaner', max: 100 },
  { key: 'happiness', label: 'Happiness', icon: '😊', note: 'Citizen wellbeing', max: 100 },
  { key: 'ecoScore', label: 'Eco Score', icon: '🌱', note: 'Your sustainability score', max: 1000 },
  { key: 'turn', label: 'Turn', icon: '🕒', note: 'Every decision matters' },
];

function isNumber(value) { return typeof value === 'number' && Number.isFinite(value); }
function format(value) { return isNumber(value) ? numberFormat.format(value) : '—'; }
function signed(value) { return `${value > 0 ? '+' : ''}${format(value)}`; }
function validContainer(container) {
  return Boolean(container && container.nodeType === 1 && container.ownerDocument && typeof container.replaceChildren === 'function');
}
function element(doc, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function icon(doc, value) {
  const node = element(doc, 'span', 'eco-icon', value);
  node.setAttribute('aria-hidden', 'true');
  return node;
}

function drawDashboard(container, suppliedState, previousState) {
  if (!validContainer(container)) return null;
  const state = suppliedState ?? {};
  const doc = container.ownerDocument;
  const root = element(doc, 'section', 'eco-ui eco-dashboard');
  root.setAttribute('aria-label', 'City resources');
  const heading = element(doc, 'div', 'eco-section-heading');
  heading.append(element(doc, 'h2', '', 'Your city at a glance'), element(doc, 'span', 'eco-eyebrow', 'CITY PULSE'));
  const list = element(doc, 'dl', 'eco-resources');
  for (const resource of RESOURCES) {
    const value = state[resource.key];
    const card = element(doc, 'div', `eco-resource eco-resource--${resource.key}`);
    card.dataset.resource = resource.key;
    const label = element(doc, 'dt', 'eco-resource-label');
    label.append(icon(doc, resource.icon), doc.createTextNode(resource.label));
    const displayed = resource.key === 'turn' ? `${format(value)} / ${format(state.maxTurns)}` : format(value);
    const amount = element(doc, 'dd', 'eco-resource-value', displayed);
    const note = element(doc, 'span', 'eco-resource-note', resource.max ? `${resource.note} · 0–${resource.max}` : resource.note);
    card.append(label, amount, note);
    if (resource.max) {
      const track = element(doc, 'div', 'eco-meter');
      track.setAttribute('aria-hidden', 'true');
      const fill = element(doc, 'span', 'eco-meter-fill');
      fill.style.width = `${isNumber(value) ? Math.max(0, Math.min(100, value / resource.max * 100)) : 0}%`;
      track.append(fill);
      card.append(track);
    }
    if (previousState != null) {
      const before = previousState[resource.key];
      let text = 'Change unavailable';
      let tone = 'neutral';
      if (isNumber(value) && isNumber(before) && Number.isFinite(value - before)) {
        const delta = value - before;
        text = delta === 0 ? 'No change' : `${signed(delta)} since last update`;
        if (delta !== 0) {
          tone = resource.key === 'turn' ? 'neutral' : ((resource.key === 'co2' ? delta < 0 : delta > 0) ? 'positive' : 'negative');
          card.classList.add('eco-resource--changed');
        }
      }
      const change = element(doc, 'span', `eco-change eco-change--${tone}`, text);
      card.append(change);
    }
    list.append(card);
  }
  const status = getCityStatusMessage(state);
  const feedback = element(doc, 'div', `eco-status eco-status--${status.level}`);
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-atomic', 'true');
  const copy = element(doc, 'div');
  copy.append(element(doc, 'h3', '', status.title), element(doc, 'p', '', status.message));
  feedback.append(icon(doc, status.icon), copy);
  root.append(heading, list, feedback);
  // Keep one mounted live region across updates so assistive technology hears deltas.
  const oldRoot = Array.from(container.children).find(child => child.classList.contains('eco-dashboard'));
  let announcer = oldRoot?.querySelector('.eco-announcement');
  if (!announcer) {
    announcer = element(doc, 'p', 'eco-sr-only eco-announcement');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-atomic', 'true');
  }
  if (oldRoot) {
    const oldFeedback = oldRoot.querySelector('.eco-status');
    if (oldFeedback) { oldFeedback.className = feedback.className; oldFeedback.replaceChildren(...feedback.childNodes); }
    oldRoot.replaceChildren(heading, list, oldFeedback ?? feedback, announcer);
  } else {
    root.append(announcer);
    container.replaceChildren(root);
  }
  announcer.textContent = previousState == null ? '' : RESOURCES.flatMap(resource => {
    const current = state[resource.key], before = previousState[resource.key];
    const delta = current - before;
    return isNumber(current) && isNumber(before) && Number.isFinite(delta) && delta !== 0
        ? [`${resource.label}: ${format(current)}, ${signed(delta)} since last update.`] : [];
  }).join(' ') || (previousState == null ? '' : 'No resource changes.');
  return oldRoot ?? root;
}

export function renderResourceDashboard(container, state) {
  return drawDashboard(container, state, null);
}

export function updateResourceDashboard(container, state, previousState) {
  return drawDashboard(container, state, previousState);
}

export function getCityStatusMessage(suppliedState) {
  const state = suppliedState ?? {};
  if (state.gameOver === true) return { level: 'neutral', title: 'Your city story is complete', message: 'Review your final rating and see what your choices taught you.', icon: '🏁' };
  if (isNumber(state.co2) && state.co2 >= STATUS.extremeCO2) return { level: 'danger', title: 'Critical air pollution', message: 'CO2 is extremely high. Consider cleaner energy and greener infrastructure.', icon: '🌫' };
  if (isNumber(state.energy) && state.energy <= STATUS.lowEnergy) return { level: 'danger', title: 'Energy shortage', message: 'Your city needs power. Review energy impacts before your next decision.', icon: '⚡' };
  if (isNumber(state.happiness) && state.happiness <= STATUS.lowHappiness) return { level: 'warning', title: 'Citizens need support', message: 'Happiness is very low. Look for buildings that improve citizen wellbeing.', icon: '😊' };
  if (isNumber(state.co2) && state.co2 >= STATUS.highCO2) return { level: 'warning', title: 'Air quality warning', message: 'CO2 is high. Weigh the carbon impact of your next investment.', icon: '🌫' };
  if (isNumber(state.ecoScore) && state.ecoScore >= STATUS.highEcoScore) return { level: 'positive', title: 'A greener future is taking shape', message: 'Your Eco Score is strong. Keep balancing energy, emissions and happiness.', icon: '🌱' };
  if (!['energy', 'co2', 'happiness', 'ecoScore'].every(key => isNumber(state[key]))) return { level: 'neutral', title: 'Waiting for city data', message: 'Your city feedback will appear when resource data is available.', icon: '🌱' };
  return { level: 'neutral', title: 'A city in balance', message: 'Plan your next investment. A thriving city needs both people and the planet.', icon: '🌿' };
}

export function renderBuildingInfo(container, buildingDefinition) {
  if (!validContainer(container)) return null;
  const doc = container.ownerDocument;
  const root = element(doc, 'section', 'eco-ui eco-building-info');
  root.setAttribute('aria-label', 'Building information');
  root.append(element(doc, 'p', 'eco-eyebrow', 'PLAN YOUR NEXT MOVE'));
  if (!buildingDefinition || typeof buildingDefinition !== 'object') {
    root.append(icon(doc, '🌿'), element(doc, 'h2', '', 'Every tile is a possibility'), element(doc, 'p', 'eco-muted', 'Select a building to explore its cost and environmental impact. Then choose an empty city tile to build.'));
  } else {
    const definition = buildingDefinition;
    const title = element(doc, 'h2', 'eco-building-title');
    title.append(icon(doc, typeof definition.icon === 'string' ? definition.icon : '🏙️'), doc.createTextNode(typeof definition.name === 'string' ? definition.name : 'Building'));
    root.append(title, element(doc, 'span', 'eco-tag', typeof definition.category === 'string' ? definition.category : 'Uncategorised'), element(doc, 'p', 'eco-muted', typeof definition.description === 'string' ? definition.description : 'No description available.'));
    const list = element(doc, 'dl', 'eco-impact-list');
    const fields = [['cost', 'Construction cost'], ['energy', 'Energy impact'], ['co2', 'CO2 impact'], ['happiness', 'Happiness impact'], ['eco', 'Eco impact']];
    if (Object.hasOwn(definition, 'income')) fields.push(['income', 'Income']);
    for (const [key, label] of fields) {
      const row = element(doc, 'div', 'eco-impact-row');
      const value = definition[key];
      const tone = key === 'cost' || !isNumber(value) || value === 0 ? 'neutral' : ((key === 'co2' ? value < 0 : value > 0) ? 'positive' : 'negative');
      row.append(element(doc, 'dt', '', label), element(doc, 'dd', `eco-change--${tone}`, key === 'cost' ? format(value) : isNumber(value) ? (value === 0 ? '0 · No change' : signed(value)) : '—'));
      list.append(row);
    }
    root.append(list, element(doc, 'p', 'eco-footnote', 'Compare these impacts before you build. City effects apply according to the game rules.'));
  }
  container.replaceChildren(root);
  return root;
}
