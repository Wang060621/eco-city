const BUILDING_TYPES = new Set([
  "coalPlant", "solarFarm", "windTurbine", "road", "metro", "park",
  "residential", "recyclingCentre"
]);
const MAX_DIMENSION = 100;
const mountedGrids = new WeakMap();
let fallbackIdCounter = 0;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isBuilding(value, row, col) {
  return isRecord(value) && typeof value.id === "string" && value.id.length > 0
      && BUILDING_TYPES.has(value.type) && value.row === row && value.col === col
      && Number.isSafeInteger(value.builtAtTurn) && value.builtAtTurn >= 1;
}

// Read helpers need only cityGrid. Reject ragged, sparse or malformed grids.
function readGrid(state) {
  if (!isRecord(state) || !Array.isArray(state.cityGrid) || !state.cityGrid.length) return null;
  const grid = state.cityGrid;
  const cols = Array.isArray(grid[0]) ? grid[0].length : 0;
  if (!cols) return null;
  const ids = new Set();
  for (let row = 0; row < grid.length; row += 1) {
    if (!Array.isArray(grid[row]) || grid[row].length !== cols) return null;
    for (let col = 0; col < cols; col += 1) {
      const cell = grid[row][col];
      if (cell === null) continue;
      if (!isBuilding(cell, row, col) || ids.has(cell.id)) return null;
      ids.add(cell.id);
    }
  }
  return grid;
}

function validCell(grid, row, col) {
  return grid !== null && Number.isInteger(row) && Number.isInteger(col)
      && row >= 0 && col >= 0 && row < grid.length && col < grid[0].length;
}

function validBuildingList(state, grid) {
  if (!Array.isArray(state.buildings)) return false;
  const cells = grid.flat().filter((cell) => cell !== null);
  if (cells.length !== state.buildings.length) return false;
  const ids = new Set();
  for (const building of state.buildings) {
    if (!isRecord(building) || !validCell(grid, building.row, building.col)
        || !isBuilding(building, building.row, building.col) || ids.has(building.id)) return false;
    const cell = grid[building.row][building.col];
    if (!cell || cell.id !== building.id || cell.type !== building.type
        || cell.builtAtTurn !== building.builtAtTurn) return false;
    ids.add(building.id);
  }
  return true;
}

function failure(state, error, message) {
  return { ok: false, state, error, message };
}

function createBuildingId(buildings) {
  const used = new Set(buildings.map((building) => building.id));
  if (typeof globalThis.crypto?.randomUUID === "function") {
    const id = globalThis.crypto.randomUUID();
    if (!used.has(id)) return id;
  }
  let id;
  do {
    fallbackIdCounter += 1;
    id = `building-${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}`;
  } while (used.has(id));
  return id;
}

export function createEmptyGrid(rows = 6, cols = 6) {
  if (![rows, cols].every((size) => Number.isSafeInteger(size) && size >= 1 && size <= MAX_DIMENSION)) {
    throw new RangeError("Grid dimensions must be integers between 1 and 100.");
  }
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

export function isCellEmpty(state, row, col) {
  const grid = readGrid(state);
  return validCell(grid, row, col) && grid[row][col] === null;
}

export function getBuildingAt(state, row, col) {
  const grid = readGrid(state);
  return validCell(grid, row, col) ? grid[row][col] : null;
}

/** Grid editing only. The final game must purchase through applyBuildingPurchase. */
export function placeBuilding(state, type, row, col, buildingDefinition) {
  const grid = readGrid(state);
  if (!validCell(grid, row, col)) {
    return failure(state, "INVALID_CELL", "Choose a valid tile within the city.");
  }
  if (!validBuildingList(state, grid) || !Number.isSafeInteger(state.turn) || state.turn < 1) {
    return failure(state, "INVALID_STATE", "The city data is invalid. Please reset or reload the city.");
  }
  if (!BUILDING_TYPES.has(type) || !isRecord(buildingDefinition) || buildingDefinition.id !== type) {
    return failure(state, "INVALID_BUILDING", "Choose a valid building type.");
  }
  if (grid[row][col] !== null) {
    return failure(state, "CELL_OCCUPIED", "This tile is already occupied.");
  }
  const building = { id: createBuildingId(state.buildings), type, row, col, builtAtTurn: state.turn };
  const cityGrid = grid.map((cells) => [...cells]);
  cityGrid[row][col] = building;
  const nextState = { ...state, cityGrid, buildings: [...state.buildings, building] };
  const name = typeof buildingDefinition.name === "string" && buildingDefinition.name.trim()
      ? buildingDefinition.name : type;
  return { ok: true, state: nextState, building, message: `${name} placed.` };
}

export function removeBuilding(state, row, col) {
  const grid = readGrid(state);
  if (!validCell(grid, row, col)) {
    return failure(state, "INVALID_CELL", "Choose a valid tile within the city.");
  }
  if (!validBuildingList(state, grid)) {
    return failure(state, "INVALID_STATE", "The city data is invalid. Please reset or reload the city.");
  }
  const building = grid[row][col];
  if (building === null) return failure(state, "CELL_EMPTY", "This tile is already empty.");
  const cityGrid = grid.map((cells) => [...cells]);
  cityGrid[row][col] = null;
  const nextState = { ...state, cityGrid, buildings: state.buildings.filter((item) => item.id !== building.id) };
  return { ok: true, state: nextState, building, message: "Building removed." };
}

function requireContainer(container) {
  if (!container || container.nodeType !== 1 || !container.ownerDocument
      || typeof container.appendChild !== "function" || typeof container.querySelector !== "function") {
    throw new TypeError("City grid requires a valid DOM element container.");
  }
}

function presentation(type, callbacks) {
  const definition = typeof callbacks.getBuildingDefinition === "function"
      ? callbacks.getBuildingDefinition(type) : null;
  return {
    name: typeof definition?.name === "string" && definition.name.trim() ? definition.name : type,
    icon: typeof definition?.icon === "string" && definition.icon.trim() ? definition.icon : "▦"
  };
}

function makeElement(document, tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function clearGrid(container) {
  requireContainer(container);
  const mount = mountedGrids.get(container);
  if (!mount) return;
  if (mount.onClick) mount.root.removeEventListener("click", mount.onClick);
  // An unrelated child, even one using the same class, is never removed.
  if (mount.root.parentNode === container) mount.root.remove();
  mountedGrids.delete(container);
}

export function renderCityGrid(container, state, callbacks = {}) {
  requireContainer(container);
  callbacks = isRecord(callbacks) ? callbacks : {};
  const document = container.ownerDocument;
  const previous = mountedGrids.get(container);
  const focused = document.activeElement;
  const focusCell = previous?.root.contains(focused) && focused?.matches("button.city-grid__cell")
      ? { row: focused.dataset.row, col: focused.dataset.col } : null;
  // This is render metadata only; city content always comes from state.cityGrid.
  const previousIds = new Set(previous
      ? Array.from(previous.root.querySelectorAll("[data-building-id]"), (cell) => cell.dataset.buildingId)
      : []);
  const grid = readGrid(state);
  clearGrid(container);
  const root = makeElement(document, "section", "city-grid-shell");
  root.setAttribute("aria-label", "City map");
  if (!grid) {
    const fallback = makeElement(document, "p", "city-grid__error", "The city map is unavailable. Please reset or reload the city.");
    fallback.setAttribute("role", "alert");
    root.appendChild(fallback);
    container.appendChild(root);
    mountedGrids.set(container, { root });
    return root;
  }
  const disabled = state.gameOver === true || callbacks.disabled === true;
  const selectedType = BUILDING_TYPES.has(state.selectedBuilding) ? state.selectedBuilding : null;
  const selected = selectedType ? presentation(selectedType, callbacks) : null;
  const hint = disabled ? "City building is paused."
      : selected ? `${selected.name} selected. Choose an empty tile.` : "Choose a building, then choose an empty tile.";
  root.appendChild(makeElement(document, "p", "city-grid__instructions", hint));
  const gridElement = makeElement(document, "div", "city-grid");
  gridElement.setAttribute("role", "group");
  gridElement.setAttribute("aria-label", `City map, ${grid.length} rows, ${grid[0].length} columns. ${hint}`);
  gridElement.style.setProperty("--city-grid-columns", String(grid[0].length));
  if (selectedType && !disabled) {
    gridElement.classList.add("city-grid--placement-mode");
    gridElement.dataset.selectedBuilding = selectedType;
  }
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const building = grid[row][col];
      const view = building ? presentation(building.type, callbacks) : { name: "Empty", icon: "+" };
      const cell = makeElement(document, "button", "city-grid__cell");
      cell.type = "button";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.disabled = disabled;
      cell.classList.add(building ? "city-grid__cell--occupied" : "city-grid__cell--empty");
      if (disabled) cell.classList.add("city-grid__cell--disabled");
      if (!building && selectedType && !disabled) cell.classList.add("city-grid__cell--placement-target");
      if (building) {
        cell.dataset.buildingId = building.id;
        cell.dataset.buildingType = building.type;
        cell.classList.add(`city-grid__cell--${building.type}`);
        if (previous && !previousIds.has(building.id)) cell.classList.add("city-grid__cell--newly-built");
      }
      const label = `Row ${row + 1}, column ${col + 1}. ${view.name}. ${building ? "Occupied." : "Empty tile."}`
          + (disabled ? " Building is paused." : selected ? ` Selected: ${selected.name}.` : "");
      cell.setAttribute("aria-label", label);
      cell.title = label;
      const icon = makeElement(document, "span", "city-grid__icon", view.icon);
      icon.setAttribute("aria-hidden", "true");
      cell.append(icon, makeElement(document, "span", "city-grid__name", view.name));
      gridElement.appendChild(cell);
    }
  }
  // Native buttons already produce one click for Enter/Space. Do not synthesize another.
  const onClick = (event) => {
    const cell = event.target.closest?.("button.city-grid__cell");
    if (!cell || cell.parentNode !== gridElement || cell.disabled) return;
    if (typeof callbacks.onCellClick === "function") {
      callbacks.onCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
    }
  };
  root.addEventListener("click", onClick);
  root.appendChild(gridElement);
  container.appendChild(root);
  mountedGrids.set(container, { root, onClick });
  if (focusCell && !disabled) {
    gridElement.querySelector(`[data-row="${focusCell.row}"][data-col="${focusCell.col}"]`)?.focus({ preventScroll: true });
  }
  return gridElement;
}

