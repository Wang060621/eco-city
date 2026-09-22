// The only state store. State is plain data; every boundary receives a deep copy.
const fields = new Set([
  'money', 'energy', 'co2', 'happiness', 'ecoScore', 'turn', 'maxTurns',
  'selectedBuilding', 'cityGrid', 'buildings', 'gameOver',
]);
const listeners = new Set();
const notificationQueue = [];
let notifying = false;
const clone = (value) => structuredClone(value);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

export function createInitialState() {
  return {
    money: 10000, energy: 50, co2: 20, happiness: 50, ecoScore: 500,
    turn: 1, maxTurns: 10, selectedBuilding: null,
    cityGrid: Array.from({ length: 6 }, () => Array(6).fill(null)),
    buildings: [], gameOver: false,
  };
}

let state = createInitialState();

function assertState(candidate) {
  if (!isRecord(candidate) || Object.keys(candidate).length !== fields.size
    || Object.keys(candidate).some((key) => !fields.has(key))) {
    throw new TypeError('State must contain exactly the shared top-level fields.');
  }
  for (const key of ['money', 'energy', 'co2', 'happiness', 'ecoScore']) {
    if (!Number.isFinite(candidate[key])) throw new TypeError(`${key} must be a finite number.`);
  }
  if (candidate.maxTurns !== 10 || !Number.isInteger(candidate.turn)
    || candidate.turn < 1 || candidate.turn > candidate.maxTurns) {
    throw new TypeError('Turn must be an integer from 1 to 10; maxTurns must be 10.');
  }
  if (typeof candidate.gameOver !== 'boolean'
    || (candidate.selectedBuilding !== null && (typeof candidate.selectedBuilding !== 'string' || !candidate.selectedBuilding))) {
    throw new TypeError('Invalid gameOver or selectedBuilding field.');
  }
  if (!Array.isArray(candidate.cityGrid) || candidate.cityGrid.length !== 6
    || Array.from(candidate.cityGrid).some((row) => !Array.isArray(row) || row.length !== 6)) {
    throw new TypeError('cityGrid must be a 6 by 6 matrix.');
  }
  if (!Array.isArray(candidate.buildings)) throw new TypeError('buildings must be an array.');
  const gridBuildings = new Map();
  candidate.cityGrid.forEach((row, rowIndex) => {
    for (let colIndex = 0; colIndex < 6; colIndex += 1) {
      const building = row[colIndex];
      if (building === null) continue;
      if (!isRecord(building) || Object.keys(building).length !== 5
        || typeof building.id !== 'string' || !building.id
        || typeof building.type !== 'string' || !building.type
        || building.row !== rowIndex || building.col !== colIndex
        || !Number.isInteger(building.builtAtTurn) || building.builtAtTurn < 1
        || building.builtAtTurn > candidate.turn || gridBuildings.has(building.id)) {
        throw new TypeError('Grid cells must be null or unique, standard building instances.');
      }
      gridBuildings.set(building.id, building);
    }
  });
  if (candidate.buildings.length !== gridBuildings.size) throw new TypeError('Grid and building list must agree.');
  for (const building of candidate.buildings) {
    const cell = gridBuildings.get(building?.id);
    if (!cell || Object.keys(building).length !== 5
      || ['id', 'type', 'row', 'col', 'builtAtTurn'].some((key) => building[key] !== cell[key])) {
      throw new TypeError('Grid and building list must agree.');
    }
    gridBuildings.delete(building.id);
  }
}

export function getState() { return clone(state); }

export function setState(newState) {
  assertState(newState);
  const nextState = clone(newState);
  const previousState = state;
  state = nextState;
  notificationQueue.push({ nextState, previousState, subscribers: [...listeners] });
  // Queue nested updates so every listener sees transitions in the same order.
  if (!notifying) {
    notifying = true;
    try {
      while (notificationQueue.length) {
        const transition = notificationQueue.shift();
        for (const listener of transition.subscribers) {
          try { listener(clone(transition.nextState), clone(transition.previousState)); }
          catch (error) { console.error('Eco City state subscriber failed:', error); }
        }
      }
    } finally { notifying = false; }
  }
  return clone(nextState);
}

export function updateState(partialState) {
  if (!isRecord(partialState) || Object.keys(partialState).some((key) => !fields.has(key))) {
    throw new TypeError('updateState only accepts shared top-level fields.');
  }
  return setState({ ...state, ...partialState });
}

export function resetState() { return setState(createInitialState()); }

export function subscribe(listener) {
  if (typeof listener !== 'function') throw new TypeError('A subscriber must be a function.');
  listeners.add(listener);
  return () => listeners.delete(listener);
}
