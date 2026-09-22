function element(doc, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function screen(container, label) {
  if (!container || container.nodeType !== 1 || !container.ownerDocument || typeof container.replaceChildren !== 'function') return null;
  const doc = container.ownerDocument;
  const root = element(doc, 'section', 'eco-ui eco-screen');
  root.setAttribute('aria-label', label);
  return { doc, root, mount() { container.replaceChildren(root); return root; } };
}
function button(doc, text, callback, secondary = false) {
  const node = element(doc, 'button', `eco-button${secondary ? ' eco-button--secondary' : ''}`, text);
  node.type = 'button';
  node.disabled = typeof callback !== 'function';
  if (!node.disabled) node.addEventListener('click', () => callback());
  return node;
}
function heading(doc, root, eyebrow, title, description) {
  root.append(element(doc, 'p', 'eco-eyebrow', eyebrow), element(doc, 'h1', 'eco-screen-title', title), element(doc, 'p', 'eco-screen-intro', description));
}
function facts(doc, entries) {
  const list = element(doc, 'dl', 'eco-screen-facts');
  for (const [label, value] of entries) {
    const item = element(doc, 'div');
    item.append(element(doc, 'dt', '', label), element(doc, 'dd', '', value));
    list.append(item);
  }
  return list;
}
function numeric(value) { return typeof value === 'number' && Number.isFinite(value); }
function format(value) { return numeric(value) ? new Intl.NumberFormat('en-GB', { maximumFractionDigits: 20 }).format(value) : '—'; }

export function renderWelcomeScreen(container, suppliedCallbacks) {
  const view = screen(container, 'Welcome to Eco City');
  if (!view) return null;
  const callbacks = suppliedCallbacks ?? {};
  const { doc, root } = view;
  root.classList.add('eco-welcome');
  const content = element(doc, 'div', 'eco-welcome-content');
  heading(doc, content, 'GREEN CITY SIMULATOR', 'Eco City', 'Build a prosperous city without destroying the planet.');
  content.append(element(doc, 'p', 'eco-muted', 'Explore Sustainability and Green Tech through the city you create. Balance growth with clean energy, lower emissions and happier citizens—one decision at a time.'));
  const actions = element(doc, 'div', 'eco-actions');
  actions.append(button(doc, 'Start Game', callbacks.onStart), button(doc, 'How to Play', callbacks.onHowToPlay, true));
  if (typeof callbacks.onContinue === 'function' && callbacks.hasSavedGame !== false) actions.append(button(doc, 'Continue Saved Game', callbacks.onContinue, true));
  content.append(actions, facts(doc, [['City tiles', '6 × 6'], ['Turns to make a difference', '10'], ['Resources to balance', '6']]));
  const art = element(doc, 'div', 'eco-city-art');
  art.setAttribute('aria-hidden', 'true');
  const sun = element(doc, 'span', 'eco-art-sun');
  const skyline = element(doc, 'div', 'eco-skyline');
  for (let i = 0; i < 5; i++) skyline.append(element(doc, 'span', `eco-tower eco-tower--${i + 1}`));
  const garden = element(doc, 'div', 'eco-art-garden', '🌳  🌿  🌳');
  art.append(sun, element(doc, 'span', 'eco-art-orbit'), skyline, garden, element(doc, 'p', 'eco-art-caption', 'Small choices. A greener tomorrow.'));
  root.append(content, art);
  return view.mount();
}

export function renderHowToPlayScreen(container, suppliedCallbacks) {
  const view = screen(container, 'How to play Eco City');
  if (!view) return null;
  const callbacks = suppliedCallbacks ?? {};
  const { doc, root } = view;
  heading(doc, root, 'YOUR FIRST CITY', 'A greener city starts with a plan.', 'Ten turns. Thirty-six tiles. A future shaped by your choices.');
  const steps = element(doc, 'ol', 'eco-steps');
  const instructions = [
    ['Select a building', 'Choose a building and read its cost and resource impacts.'],
    ['Choose an empty city tile', 'Build on a free tile in your 6 × 6 city. You need enough money to cover the cost.'],
    ['Find your balance', 'Watch money, energy, CO2 and happiness. Resource changes show + and − signs.'],
    ['End your turn', 'Use End Turn to apply city effects, then review how your resources changed.'],
    ['Make all 10 turns count', 'Complete 10 turns and maximize Eco Score. Your final rating reflects the city you built.'],
  ];
  for (const [title, description] of instructions) {
    const item = element(doc, 'li');
    item.append(element(doc, 'h2', '', title), element(doc, 'p', 'eco-muted', description));
    steps.append(item);
  }
  const comparison = element(doc, 'div', 'eco-comparison');
  const options = [
    ['eco-tradeoff', '⚖️ The growth trade-off', 'A Coal Plant can support affordable short-term growth, but increases the environmental cost of your city.'],
    ['eco-greener', '🌱 Invest in the future', 'Renewable energy can cost more upfront. Parks, public transport and recycling offer other ways to support a greener city. Compare each building’s supplied impacts.'],
  ];
  for (const [className, title, description] of options) {
    const card = element(doc, 'article', className);
    card.append(element(doc, 'h2', '', title), element(doc, 'p', '', description));
    comparison.append(card);
  }
  const actions = element(doc, 'div', 'eco-actions');
  actions.append(button(doc, 'Back', callbacks.onBack, true));
  if (typeof callbacks.onStart === 'function') actions.append(button(doc, 'Start Game', callbacks.onStart));
  root.append(steps, comparison, actions);
  return view.mount();
}

export function renderGameOverScreen(container, suppliedState, suppliedResult, suppliedCallbacks) {
  const view = screen(container, 'Final city results');
  if (!view) return null;
  const state = suppliedState ?? {}, finalResult = suppliedResult ?? {}, callbacks = suppliedCallbacks ?? {};
  const { doc, root } = view;
  root.classList.add('eco-game-over');
  const rating = typeof finalResult.rating === 'string' && finalResult.rating.trim() ? finalResult.rating : 'Rating unavailable';
  heading(doc, root, 'YOUR CITY • FINAL REPORT', rating, 'Every building was a choice. Here is the city you created.');
  const score = numeric(finalResult.ecoScore) ? finalResult.ecoScore : state.ecoScore;
  const scorePanel = element(doc, 'div', 'eco-final-score');
  scorePanel.append(element(doc, 'span', 'eco-eyebrow', 'FINAL ECO SCORE'), element(doc, 'strong', '', format(score)), element(doc, 'span', '', 'out of 1,000'));
  const buildingCount = Array.isArray(state.buildings) ? state.buildings.length : Array.isArray(state.cityGrid) ? state.cityGrid.reduce((sum, row) => sum + (Array.isArray(row) ? row.filter(cell => cell != null).length : 0), 0) : undefined;
  const summary = typeof finalResult.summary === 'string' && finalResult.summary.trim() ? finalResult.summary : 'Review your final resources below to reflect on your city’s environmental impact.';
  const summaryNode = element(doc, 'p', 'eco-final-summary', summary);
  const takeaway = element(doc, 'aside', 'eco-takeaway');
  takeaway.append(element(doc, 'h2', '', 'A lesson for the next city'), element(doc, 'p', '', 'Sustainable development means balancing prosperity, reliable energy and quality of life with the carbon cost of growth. Use what you learned to shape your next city.'));
  const actions = element(doc, 'div', 'eco-actions');
  actions.append(button(doc, 'Play Again', callbacks.onRestart));
  root.append(scorePanel, summaryNode, facts(doc, [['Final CO2 · 0–100', format(state.co2)], ['Final Happiness · 0–100', format(state.happiness)], ['Final Energy', format(state.energy)], ['Total buildings', format(buildingCount)]]), takeaway, actions);
  return view.mount();
}
