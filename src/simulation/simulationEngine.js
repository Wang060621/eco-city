/**
 * Eco City — Simulation Engine & Eco Score System
 * Owned by Developer 4
 *
 * Core responsibilities:
 * - Deterministic game rules and resource balance formulas
 * - Building purchase validation and pure state transactions
 * - Turn progression, recurring resource deltas, and clamping
 * - 0–1000 Eco Score calculation and 5-tier final rating
 * - Comprehensive state integrity validation
 */

// ============================================================================
// GLOBAL RULE CONSTANTS & WEIGHTS
// ============================================================================

// Grid and Turn Specifications
export const GRID_ROWS = 6;
export const GRID_COLS = 6;
export const MAX_TURNS = 10;

// Resource Clamping Boundaries
export const MIN_HAPPINESS = 0;
export const MAX_HAPPINESS = 100;
export const MIN_CO2 = 0;
export const MAX_CO2 = 100;
export const MIN_ECO_SCORE = 0;
export const MAX_ECO_SCORE = 1000;
export const MIN_ENERGY = -100;
export const MAX_ENERGY = 200;

// Deterministic Eco Score Weights (Total Base Scale: 0–1000)
export const BASE_ECO_SCORE = 200;
export const CO2_WEIGHT = 2.5;                // Up to 250 points: (100 - co2) * 2.5
export const HAPPINESS_WEIGHT = 1.0;          // Up to 100 points: happiness * 1.0
export const ENERGY_HEALTHY_WEIGHT = 1.0;     // Up to 100 points: min(energy, 100) * 1.0
export const ENERGY_SHORTAGE_PENALTY_FACTOR = 1.5; // Shortage penalty: energy * 1.5 (when energy < 0)

// Clean Energy vs Fossil Grid Synergy Bonuses
export const CLEAN_GRID_BONUS = 50;           // Granted when city has renewable power and 0 fossil generation
export const FOSSIL_GRID_PENALTY = -30;       // Applied when city relies entirely on fossil fuel with 0 renewables

// Systemic Turn Penalties & Bonuses
export const ENERGY_SHORTAGE_HAPPINESS_PENALTY = 10; // Blackout distress penalty if net energy < 0
export const HIGH_POLLUTION_HAPPINESS_PENALTY = 5;   // Smog distress penalty if CO2 > 70
export const CLEAN_AIR_HAPPINESS_BONUS = 2;          // Fresh air wellbeing bonus if CO2 <= 15

// Catastrophic Early Failure Thresholds
export const CRITICAL_CO2_LIMIT = 100;
export const CRITICAL_HAPPINESS_LIMIT = 0;
export const CRITICAL_DEFENSIVE_MONEY_LIMIT = -5000;

// 5-Tier Final Rating Bands (Shared Contract)
export const RATING_BANDS = [
  { min: 800, max: 1000, title: "Green City Champion" },
  { min: 650, max: 799,  title: "Sustainable City" },
  { min: 450, max: 649,  title: "Developing City" },
  { min: 250, max: 449,  title: "High-Carbon City" },
  { min: 0,   max: 249,  title: "Environmental Crisis" }
];

// Stable System Error Codes
export const ERROR_CODES = {
  INVALID_STATE: "INVALID_STATE",
  INVALID_BUILDING: "INVALID_BUILDING",
  INVALID_CELL: "INVALID_CELL",
  CELL_OCCUPIED: "CELL_OCCUPIED",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  GAME_OVER: "GAME_OVER"
};

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function generateBuildingId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// CORE SIMULATION EXPORTS
// ============================================================================

export function validateState(state, BUILDINGS = null) {
  const errors = [];

  if (!state || typeof state !== "object") {
    return { valid: false, errors: ["State must be a non-null object."] };
  }

  const requiredFields = [
    "money",
    "energy",
    "co2",
    "happiness",
    "ecoScore",
    "turn",
    "maxTurns",
    "selectedBuilding",
    "cityGrid",
    "buildings",
    "gameOver"
  ];

  for (const field of requiredFields) {
    if (!(field in state)) {
      errors.push(`Missing required state field: '${field}'.`);
    }
  }

  const numericFields = ["money", "energy", "co2", "happiness", "ecoScore"];
  for (const field of numericFields) {
    if (typeof state[field] !== "number" || !Number.isFinite(state[field])) {
      errors.push(`Field '${field}' must be a finite number, received: ${state[field]}.`);
    }
  }

  if (!Number.isInteger(state.turn) || state.turn < 1) {
    errors.push(`Field 'turn' must be an integer >= 1, received: ${state.turn}.`);
  }
  if (!Number.isInteger(state.maxTurns) || state.maxTurns < 1) {
    errors.push(`Field 'maxTurns' must be an integer >= 1, received: ${state.maxTurns}.`);
  }
  if (Number.isInteger(state.turn) && Number.isInteger(state.maxTurns) && state.turn > state.maxTurns) {
    errors.push(`Field 'turn' (${state.turn}) cannot exceed 'maxTurns' (${state.maxTurns}).`);
  }

  if (typeof state.gameOver !== "boolean") {
    errors.push(`Field 'gameOver' must be a boolean, received: ${typeof state.gameOver}.`);
  }

  if (!Array.isArray(state.cityGrid)) {
    errors.push("Field 'cityGrid' must be an array.");
  } else if (state.cityGrid.length !== GRID_ROWS) {
    errors.push(`Field 'cityGrid' must have exactly ${GRID_ROWS} rows, found ${state.cityGrid.length}.`);
  } else {
    for (let r = 0; r < GRID_ROWS; r++) {
      const row = state.cityGrid[r];
      if (!Array.isArray(row)) {
        errors.push(`Row ${r} in 'cityGrid' must be an array.`);
      } else if (row.length !== GRID_COLS) {
        errors.push(`Row ${r} in 'cityGrid' must have exactly ${GRID_COLS} columns, found ${row.length}.`);
      }
    }
  }

  if (!Array.isArray(state.buildings)) {
    errors.push("Field 'buildings' must be an array.");
  }

  if (Array.isArray(state.cityGrid) && state.cityGrid.length === GRID_ROWS && Array.isArray(state.buildings)) {
    const gridBuildingIds = new Set();
    let occupiedCellCount = 0;

    for (let r = 0; r < GRID_ROWS; r++) {
      const row = state.cityGrid[r];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < GRID_COLS; c++) {
        const cell = row[c];
        if (cell !== null) {
          occupiedCellCount++;

          if (typeof cell !== "object" || cell === null) {
            errors.push(`Cell [${r}, ${c}] must be null or an object instance.`);
            continue;
          }

          if (typeof cell.id !== "string" || cell.id.trim() === "") {
            errors.push(`Cell [${r}, ${c}] building must have a non-empty string 'id'.`);
          } else if (gridBuildingIds.has(cell.id)) {
            errors.push(`Duplicate building ID detected in grid: '${cell.id}'.`);
          } else {
            gridBuildingIds.add(cell.id);
          }

          if (typeof cell.type !== "string" || cell.type.trim() === "") {
            errors.push(`Cell [${r}, ${c}] building must have a non-empty string 'type'.`);
          } else if (BUILDINGS && !(cell.type in BUILDINGS)) {
            errors.push(`Cell [${r}, ${c}] has unrecognized building type: '${cell.type}'.`);
          }

          if (cell.row !== r || cell.col !== c) {
            errors.push(`Cell [${r}, ${c}] coordinates mismatch: cell has (${cell.row}, ${cell.col}).`);
          }

          if (!Number.isInteger(cell.builtAtTurn) || cell.builtAtTurn < 1 || cell.builtAtTurn > state.turn) {
            errors.push(`Cell [${r}, ${c}] has invalid builtAtTurn: ${cell.builtAtTurn}.`);
          }
        }
      }
    }

    if (occupiedCellCount !== state.buildings.length) {
      errors.push(
          `Discrepancy: 'cityGrid' has ${occupiedCellCount} occupied cells, but 'buildings' list has ${state.buildings.length} items.`
      );
    }

    const listBuildingIds = new Set();
    for (const b of state.buildings) {
      if (!b || typeof b !== "object") {
        errors.push("An element in 'buildings' is not an object.");
        continue;
      }
      if (listBuildingIds.has(b.id)) {
        errors.push(`Duplicate building ID in 'buildings' array: '${b.id}'.`);
      }
      listBuildingIds.add(b.id);

      if (!gridBuildingIds.has(b.id)) {
        errors.push(`Building ID '${b.id}' exists in 'buildings' list but is not present in 'cityGrid'.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function calculateCityTotals(state, BUILDINGS = {}) {
  const totals = {
    totalBuildings: 0,
    grossEnergy: 0,
    energyDemand: 0,
    netEnergy: 0,
    grossCO2: 0,
    netCO2: 0,
    grossHappiness: 0,
    netHappiness: 0,
    totalIncome: 0,
    totalEco: 0,
    cleanEnergyCapacity: 0,
    cleanEnergyCount: 0,
    fossilEnergyCapacity: 0,
    fossilEnergyCount: 0,
    cleanEnergyRatio: 0,
    parksCount: 0,
    metroCount: 0,
    recyclingCount: 0,
    residentialCount: 0,
    roadCount: 0,
    typeCounts: {}
  };

  if (!state || !Array.isArray(state.buildings)) {
    return totals;
  }

  for (const building of state.buildings) {
    if (!building || !building.type) continue;

    const def = BUILDINGS && BUILDINGS[building.type] ? BUILDINGS[building.type] : null;

    totals.totalBuildings++;
    totals.typeCounts[building.type] = (totals.typeCounts[building.type] || 0) + 1;

    if (building.type === "park") totals.parksCount++;
    if (building.type === "metro") totals.metroCount++;
    if (building.type === "recyclingCentre") totals.recyclingCount++;
    if (building.type === "residential") totals.residentialCount++;
    if (building.type === "road") totals.roadCount++;

    if (def) {
      const energy = Number.isFinite(def.energy) ? def.energy : 0;
      const co2 = Number.isFinite(def.co2) ? def.co2 : 0;
      const happiness = Number.isFinite(def.happiness) ? def.happiness : 0;
      const eco = Number.isFinite(def.eco) ? def.eco : 0;
      const income = Number.isFinite(def.income) ? def.income : 0;

      totals.netEnergy += energy;
      if (energy > 0) {
        totals.grossEnergy += energy;
      } else if (energy < 0) {
        totals.energyDemand += Math.abs(energy);
      }

      totals.netCO2 += co2;
      if (co2 > 0) {
        totals.grossCO2 += co2;
      }

      totals.netHappiness += happiness;
      if (happiness > 0) {
        totals.grossHappiness += happiness;
      }

      totals.totalIncome += income;
      totals.totalEco += eco;

      if (building.type === "solarFarm" || building.type === "windTurbine" || (def.category === "Energy" && co2 <= 0)) {
        totals.cleanEnergyCapacity += energy;
        totals.cleanEnergyCount++;
      } else if (building.type === "coalPlant" || (def.category === "Energy" && co2 > 0)) {
        totals.fossilEnergyCapacity += energy;
        totals.fossilEnergyCount++;
      }
    }
  }

  const totalGen = totals.cleanEnergyCapacity + totals.fossilEnergyCapacity;
  totals.cleanEnergyRatio = totalGen > 0 ? totals.cleanEnergyCapacity / totalGen : 0;

  return totals;
}

export function calculateEcoScore(state, BUILDINGS = {}) {
  if (!state) return 0;

  const co2 = clamp(state.co2 ?? 0, MIN_CO2, MAX_CO2);
  const happiness = clamp(state.happiness ?? 0, MIN_HAPPINESS, MAX_HAPPINESS);
  const energy = Number.isFinite(state.energy) ? state.energy : 0;

  const co2Score = (MAX_CO2 - co2) * CO2_WEIGHT;
  const happinessScore = happiness * HAPPINESS_WEIGHT;

  let energyScore = 0;
  if (energy >= 0) {
    energyScore = Math.min(energy, 100) * ENERGY_HEALTHY_WEIGHT;
  } else {
    energyScore = energy * ENERGY_SHORTAGE_PENALTY_FACTOR;
  }

  const totals = calculateCityTotals(state, BUILDINGS);
  const buildingEcoScore = totals.totalEco;

  let energySynergyBonus = 0;
  const totalGeneration = totals.cleanEnergyCapacity + totals.fossilEnergyCapacity;

  if (totalGeneration > 0) {
    if (totals.fossilEnergyCapacity === 0) {
      energySynergyBonus = CLEAN_GRID_BONUS;
    } else if (totals.cleanEnergyCapacity === 0) {
      energySynergyBonus = FOSSIL_GRID_PENALTY;
    } else {
      const cleanRatio = totals.cleanEnergyCapacity / totalGeneration;
      energySynergyBonus = Math.round(cleanRatio * 40) - 20;
    }
  }

  const rawScore = BASE_ECO_SCORE + co2Score + happinessScore + energyScore + buildingEcoScore + energySynergyBonus;
  return clamp(Math.round(rawScore), MIN_ECO_SCORE, MAX_ECO_SCORE);
}

export function calculateTurnEffects(state, BUILDINGS = {}) {
  const totals = calculateCityTotals(state, BUILDINGS);

  const moneyDelta = totals.totalIncome;
  const energyDelta = totals.netEnergy;
  const co2Delta = totals.netCO2;
  let happinessDelta = totals.netHappiness;

  const projectedEnergy = (state.energy || 0) + energyDelta;
  if (projectedEnergy < 0) {
    happinessDelta -= ENERGY_SHORTAGE_HAPPINESS_PENALTY;
  }

  const projectedCO2 = clamp((state.co2 || 0) + co2Delta, MIN_CO2, MAX_CO2);
  if (projectedCO2 > 70) {
    happinessDelta -= HIGH_POLLUTION_HAPPINESS_PENALTY;
  } else if (projectedCO2 <= 15) {
    happinessDelta += CLEAN_AIR_HAPPINESS_BONUS;
  }

  const projectedState = {
    ...state,
    money: (state.money || 0) + moneyDelta,
    energy: clamp(projectedEnergy, MIN_ENERGY, MAX_ENERGY),
    co2: projectedCO2,
    happiness: clamp((state.happiness || 0) + happinessDelta, MIN_HAPPINESS, MAX_HAPPINESS)
  };

  const currentEco = calculateEcoScore(state, BUILDINGS);
  const projectedEco = calculateEcoScore(projectedState, BUILDINGS);
  const ecoScoreDelta = projectedEco - currentEco;

  return {
    money: moneyDelta,
    energy: energyDelta,
    co2: co2Delta,
    happiness: happinessDelta,
    ecoScore: ecoScoreDelta
  };
}

export function applyBuildingPurchase(state, buildingType, row, col, BUILDINGS = {}) {
  const validation = validateState(state);
  if (!validation.valid) {
    return {
      ok: false,
      state,
      error: ERROR_CODES.INVALID_STATE,
      message: `Cannot build: Invalid game state (${validation.errors[0] || "unknown"}).`
    };
  }

  if (state.gameOver) {
    return {
      ok: false,
      state,
      error: ERROR_CODES.GAME_OVER,
      message: "Construction disabled: The game has already ended."
    };
  }

  if (!BUILDINGS || typeof BUILDINGS !== "object") {
    return {
      ok: false,
      state,
      error: ERROR_CODES.INVALID_BUILDING,
      message: "Building catalogue is missing or unavailable."
    };
  }

  const definition = BUILDINGS[buildingType];
  if (!definition) {
    return {
      ok: false,
      state,
      error: ERROR_CODES.INVALID_BUILDING,
      message: `Unknown building type '${buildingType}'.`
    };
  }

  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
    return {
      ok: false,
      state,
      error: ERROR_CODES.INVALID_CELL,
      message: `Invalid cell coordinates (${row}, ${col}). Grid is ${GRID_ROWS}x${GRID_COLS}.`
    };
  }

  if (state.cityGrid[row][col] !== null) {
    return {
      ok: false,
      state,
      error: ERROR_CODES.CELL_OCCUPIED,
      message: `Cell (${row}, ${col}) is already occupied.`
    };
  }

  const cost = Number.isFinite(definition.cost) ? definition.cost : 0;
  if (state.money < cost) {
    return {
      ok: false,
      state,
      error: ERROR_CODES.INSUFFICIENT_FUNDS,
      message: `You need ${cost - state.money} more funds to construct ${definition.name || buildingType}.`
    };
  }

  const newBuilding = {
    id: generateBuildingId(),
    type: buildingType,
    row,
    col,
    builtAtTurn: state.turn
  };

  const nextCityGrid = state.cityGrid.map((r, rIdx) => {
    if (rIdx !== row) return [...r];
    const newRow = [...r];
    newRow[col] = newBuilding;
    return newRow;
  });

  const nextBuildings = [...state.buildings, newBuilding];
  const nextMoney = state.money - cost;

  const nextState = {
    ...state,
    money: nextMoney,
    cityGrid: nextCityGrid,
    buildings: nextBuildings
  };

  nextState.ecoScore = calculateEcoScore(nextState, BUILDINGS);

  return {
    ok: true,
    state: nextState,
    building: newBuilding,
    message: `${definition.name || buildingType} successfully constructed at (${row}, ${col}).`
  };
}

export function checkGameOver(state) {
  if (!state || typeof state !== "object") return true;
  if (state.gameOver === true) return true;
  if (state.turn >= state.maxTurns) return true;

  if (state.co2 >= CRITICAL_CO2_LIMIT) return true;
  if (state.happiness <= CRITICAL_HAPPINESS_LIMIT) return true;
  if (state.money < CRITICAL_DEFENSIVE_MONEY_LIMIT) return true;

  return false;
}

export function calculateFinalRating(state) {
  const ecoScore = clamp(state?.ecoScore ?? 0, MIN_ECO_SCORE, MAX_ECO_SCORE);
  const band = RATING_BANDS.find(b => ecoScore >= b.min && ecoScore <= b.max) || RATING_BANDS[RATING_BANDS.length - 1];

  let summary = "";
  const co2 = state?.co2 ?? 0;
  const energy = state?.energy ?? 0;
  const happiness = state?.happiness ?? 0;

  if (ecoScore >= 800) {
    summary = `Exceptional leadership! Your city operates with clean renewable power, low CO2 emissions (${co2}), and vibrant public spaces that keep citizens happy (${happiness}%).`;
  } else if (ecoScore >= 650) {
    summary = `Great job! Your city combined green technologies with practical transit, achieving sustainable growth with manageable emissions (${co2}) and stable energy (${energy}).`;
  } else if (ecoScore >= 450) {
    summary = `A growing metropolis that shows promise. However, high reliance on conventional infrastructure and moderate emissions (${co2}) leave room for green tech innovation.`;
  } else if (ecoScore >= 250) {
    summary = `High carbon trap! Heavy fossil fuel usage generated power but degraded environmental quality (CO2: ${co2}) and limited sustainable development.`;
  } else {
    summary = `Environmental collapse. Uncontrolled pollution (CO2: ${co2}) and severe energy or social imbalances have led to an unsustainable ecological crisis.`;
  }

  return {
    rating: band.title,
    ecoScore,
    band: { min: band.min, max: band.max },
    summary,
    metrics: {
      money: state?.money ?? 0,
      energy: state?.energy ?? 0,
      co2: state?.co2 ?? 0,
      happiness: state?.happiness ?? 0,
      turn: state?.turn ?? 0
    }
  };
}

export function endTurn(state, BUILDINGS = {}) {
  if (state.gameOver) {
    return {
      state: { ...state },
      turnSummary: {
        money: 0,
        energy: 0,
        co2: 0,
        happiness: 0,
        ecoScore: 0
      },
      gameOver: true,
      finalResult: calculateFinalRating(state)
    };
  }

  const effects = calculateTurnEffects(state, BUILDINGS);

  const nextMoney = state.money + effects.money;
  const nextEnergy = clamp(state.energy + effects.energy, MIN_ENERGY, MAX_ENERGY);
  const nextCO2 = clamp(state.co2 + effects.co2, MIN_CO2, MAX_CO2);
  const nextHappiness = clamp(state.happiness + effects.happiness, MIN_HAPPINESS, MAX_HAPPINESS);

  const nextCityGrid = state.cityGrid.map(row => [...row]);
  const nextBuildings = [...state.buildings];

  const intermediateState = {
    ...state,
    money: nextMoney,
    energy: nextEnergy,
    co2: nextCO2,
    happiness: nextHappiness,
    cityGrid: nextCityGrid,
    buildings: nextBuildings
  };

  const nextEcoScore = calculateEcoScore(intermediateState, BUILDINGS);
  intermediateState.ecoScore = nextEcoScore;

  const isTurnTen = state.turn >= state.maxTurns;
  const isEarlyCatastrophe = (
      nextCO2 >= CRITICAL_CO2_LIMIT ||
      nextHappiness <= CRITICAL_HAPPINESS_LIMIT ||
      nextMoney < CRITICAL_DEFENSIVE_MONEY_LIMIT
  );

  let nextTurn = state.turn;
  let isGameOver = false;
  let finalResult = null;

  if (isTurnTen || isEarlyCatastrophe) {
    isGameOver = true;
    nextTurn = state.turn;
    intermediateState.turn = nextTurn;
    intermediateState.gameOver = true;
    finalResult = calculateFinalRating(intermediateState);
  } else {
    nextTurn = state.turn + 1;
    intermediateState.turn = nextTurn;
    intermediateState.gameOver = false;
    finalResult = null;
  }

  const turnSummary = {
    money: nextMoney - state.money,
    energy: nextEnergy - state.energy,
    co2: nextCO2 - state.co2,
    happiness: nextHappiness - state.happiness,
    ecoScore: nextEcoScore - state.ecoScore
  };

  return {
    state: intermediateState,
    turnSummary,
    gameOver: isGameOver,
    finalResult
  };
}
