const freezeDefinition = (definition) => Object.freeze({ ...definition });

/**
 * Single source of truth for all building catalogue and balance values.
 * Definitions and the catalogue are frozen so consumers cannot accidentally
 * change shared game data at runtime.
 */
export const BUILDINGS = Object.freeze({
  coalPlant: freezeDefinition({
    id: "coalPlant",
    name: "Coal Plant",
    icon: "🏭",
    category: "Energy",
    description:
        "Produces large amounts of low-cost energy but creates heavy carbon emissions.",
    cost: 1000,
    energy: 45,
    co2: 22,
    happiness: -5,
    eco: -45,
    income: 120,
  }),
  solarFarm: freezeDefinition({
    id: "solarFarm",
    name: "Solar Farm",
    icon: "☀️",
    category: "Energy",
    description:
        "Generates clean electricity with no direct carbon emissions.",
    cost: 1500,
    energy: 25,
    co2: -5,
    happiness: 2,
    eco: 30,
    income: 0,
  }),
  windTurbine: freezeDefinition({
    id: "windTurbine",
    name: "Wind Turbine",
    icon: "🌬️",
    category: "Energy",
    description:
        "Generates renewable electricity with a small noise and visual impact.",
    cost: 1200,
    energy: 18,
    co2: -3,
    happiness: -1,
    eco: 25,
    income: 0,
  }),
  road: freezeDefinition({
    id: "road",
    name: "Road",
    icon: "🛣️",
    category: "Transport",
    description:
        "Improves access and supports development but increases traffic emissions.",
    cost: 400,
    energy: -1,
    co2: 6,
    happiness: 3,
    eco: -8,
    income: 20,
  }),
  metro: freezeDefinition({
    id: "metro",
    name: "Metro",
    icon: "🚇",
    category: "Transport",
    description:
        "Provides high-capacity public transport that reduces road emissions.",
    cost: 2500,
    energy: -5,
    co2: -12,
    happiness: 12,
    eco: 35,
    income: 60,
  }),
  park: freezeDefinition({
    id: "park",
    name: "Park",
    icon: "🌳",
    category: "Environment",
    description:
        "Adds green space that absorbs carbon and improves citizen wellbeing.",
    cost: 900,
    energy: -2,
    co2: -6,
    happiness: 8,
    eco: 18,
    income: 0,
  }),
  residential: freezeDefinition({
    id: "residential",
    name: "Residential Area",
    icon: "🏘️",
    category: "Housing",
    description:
        "Grows the city and its income while adding energy demand and emissions.",
    cost: 900,
    energy: -12,
    co2: 5,
    happiness: 8,
    eco: -5,
    income: 150,
  }),
  recyclingCentre: freezeDefinition({
    id: "recyclingCentre",
    name: "Recycling Centre",
    icon: "♻️",
    category: "Waste",
    description:
        "Processes reusable materials to reduce waste and city emissions.",
    cost: 1100,
    energy: -4,
    co2: -10,
    happiness: -1,
    eco: 30,
    income: 30,
  }),
});

const hasOwnBuilding = (type) =>
    typeof type === "string" &&
    Object.prototype.hasOwnProperty.call(BUILDINGS, type);

/**
 * Returns true only for one of the eight agreed building type IDs.
 */
export function validateBuildingType(type) {
  return hasOwnBuilding(type);
}

/**
 * Returns the frozen definition for a valid type, or null for an unknown type.
 */
export function getBuildingDefinition(type) {
  return validateBuildingType(type) ? BUILDINGS[type] : null;
}

/**
 * Returns a finite, non-negative construction cost, or null for an invalid type.
 */
export function getBuildingCost(type) {
  const definition = getBuildingDefinition(type);

  if (
      definition === null ||
      !Number.isFinite(definition.cost) ||
      definition.cost < 0
  ) {
    return null;
  }

  return definition.cost;
}

/**
 * Exact-cost purchases are allowed. Invalid and non-finite money values fail.
 */
export function canAffordBuilding(type, money) {
  const cost = getBuildingCost(type);

  return (
      cost !== null &&
      typeof money === "number" &&
      Number.isFinite(money) &&
      money >= cost
  );
}

/**
 * Returns a new resource-effect object so callers cannot mutate the catalogue.
 */
export function calculateBuildingImmediateEffect(type) {
  const definition = getBuildingDefinition(type);

  if (definition === null) {
    return null;
  }

  return {
    energy: definition.energy,
    co2: definition.co2,
    happiness: definition.happiness,
    eco: definition.eco,
    income: definition.income ?? 0,
  };
}

/**
 * Returns a fresh grouping on every call. Definitions remain read-only.
 */
export function getBuildingsByCategory() {
  const groups = {};

  for (const definition of Object.values(BUILDINGS)) {
    if (!groups[definition.category]) {
      groups[definition.category] = [];
    }

    groups[definition.category].push(definition);
  }

  for (const category of Object.keys(groups)) {
    groups[category] = Object.freeze([...groups[category]]);
  }

  return Object.freeze({ ...groups });
}

