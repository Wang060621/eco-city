/** Browser-only persistence for Eco City. This module has no import-time side effects. */

const STORAGE_KEY = "ecoCitySave";
const SAVE_VERSION = 1;
const GRID_SIZE = 6;
const MAX_TURNS = 10;

function resultError(error, message) { return { ok: false, error, message }; }
function getStorage() {
    try {
        const storage = globalThis.localStorage;
        if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") return null;
        return storage;
    } catch { return null; }
}
function isFiniteNumber(value) { return typeof value === "number" && Number.isFinite(value); }
function isPlainJson(value, seen = new WeakSet()) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value !== "object" || seen.has(value)) return false;
    if (Object.getPrototypeOf(value) !== Object.prototype && !Array.isArray(value)) return false;
    seen.add(value);
    const valid = Object.values(value).every(item => isPlainJson(item, seen));
    seen.delete(value);
    return valid;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }

/** Validates only the shared runtime-save shape, not simulation business rules. */
function isValidState(state) {
    if (!state || typeof state !== "object" || !isPlainJson(state)) return false;
    const numericKeys = ["money", "energy", "co2", "happiness", "ecoScore", "turn", "maxTurns"];
    if (!numericKeys.every(key => isFiniteNumber(state[key]))) return false;
    if (!Array.isArray(state.buildings) || !Array.isArray(state.cityGrid) || state.cityGrid.length !== GRID_SIZE) return false;
    if (state.maxTurns !== MAX_TURNS || state.turn < 1 || state.turn > MAX_TURNS || !Number.isInteger(state.turn)) return false;
    if (typeof state.gameOver !== "boolean" || !(state.selectedBuilding === null || typeof state.selectedBuilding === "string")) return false;
    if (!state.cityGrid.every(row => Array.isArray(row) && row.length === GRID_SIZE)) return false;
    const buildingIds = new Set();
    for (const building of state.buildings) {
        if (!building || typeof building !== "object" || typeof building.id !== "string" || !building.id || typeof building.type !== "string" || !building.type || !Number.isInteger(building.row) || !Number.isInteger(building.col) || !Number.isInteger(building.builtAtTurn)) return false;
        if (building.row < 0 || building.row >= GRID_SIZE || building.col < 0 || building.col >= GRID_SIZE || building.builtAtTurn < 1 || building.builtAtTurn > MAX_TURNS || buildingIds.has(building.id)) return false;
        buildingIds.add(building.id);
        const gridRecord = state.cityGrid[building.row][building.col];
        if (!gridRecord || gridRecord.id !== building.id || gridRecord.type !== building.type || gridRecord.row !== building.row || gridRecord.col !== building.col) return false;
    }
    for (let row = 0; row < GRID_SIZE; row += 1) for (let col = 0; col < GRID_SIZE; col += 1) {
        const record = state.cityGrid[row][col];
        if (record !== null && (!record || !buildingIds.has(record.id) || record.row !== row || record.col !== col)) return false;
    }
    return true;
}

function readEnvelope() {
    const storage = getStorage();
    if (!storage) return null;
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const envelope = JSON.parse(raw);
        if (!envelope || envelope.version !== SAVE_VERSION || typeof envelope.savedAt !== "string" || !isValidState(envelope.state)) return null;
        return envelope;
    } catch { return null; }
}

/** Saves a validated cloned JSON state under the exact shared storage key. */
export function saveGame(state) {
    if (!isValidState(state)) return resultError("INVALID_STATE", "This game state cannot be saved safely.");
    const storage = getStorage();
    if (!storage) return resultError("STORAGE_UNAVAILABLE", "Saving is unavailable in this browser.");
    const savedAt = new Date().toISOString();
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, savedAt, state: clone(state) }));
        return { ok: true, savedAt };
    } catch { return resultError("STORAGE_WRITE_FAILED", "The game could not be saved. You can keep playing."); }
}

/** Returns a fresh valid state clone, or null for missing/corrupt/unsupported saves. */
export function loadGame() {
    const envelope = readEnvelope();
    return envelope ? clone(envelope.state) : null;
}

/** True only when a valid, supported save can be loaded. */
export function hasSavedGame() { return loadGame() !== null; }

/** Safe for a missing key and returns a result object for optional UI feedback. */
export function deleteSavedGame() {
    const storage = getStorage();
    if (!storage) return resultError("STORAGE_UNAVAILABLE", "Saved-game storage is unavailable in this browser.");
    try { storage.removeItem(STORAGE_KEY); return { ok: true }; }
    catch { return resultError("STORAGE_DELETE_FAILED", "The saved game could not be deleted."); }
}

/** Uses the same validation and envelope as a manual save. */
export function autoSave(state) { return saveGame(state); }
