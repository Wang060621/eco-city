// Developer 1 focused checks. Developer 6 may incorporate these into the final suite.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, getState, setState, updateState, resetState, subscribe } from '../src/core/gameState.js';
const cleanup = [];
const listen = (fn) => { const stop = subscribe(fn); cleanup.push(stop); return stop; };
beforeEach(() => resetState());
afterEach(() => { cleanup.splice(0).forEach((stop) => stop()); vi.restoreAllMocks(); });

describe('state contract and isolation', () => {
  it('creates exact resources and fresh independent grid rows', () => {
    const first = createInitialState();
    expect(first).toEqual({ money: 10000, energy: 50, co2: 20, happiness: 50, ecoScore: 500, turn: 1,
      maxTurns: 10, selectedBuilding: null, cityGrid: Array.from({ length: 6 }, () => Array(6).fill(null)), buildings: [], gameOver: false });
    first.cityGrid[0][0] = 'changed';
    expect(first.cityGrid[1][0]).toBeNull(); expect(createInitialState().cityGrid[0][0]).toBeNull();
  });
  it('isolates input, reads, and write results from private state', () => {
    const input = createInitialState(); setState(input); input.cityGrid[0][0] = 'changed';
    getState().buildings.push('changed');
    const result = updateState({ money: 200 }); result.money = 99;
    expect(getState().money).toBe(200); expect(getState().cityGrid[0][0]).toBeNull(); expect(getState().buildings).toEqual([]);
  });
  it('merges approved fields without losing other fields', () => {
    updateState({ selectedBuilding: 'solarFarm', money: 1500 });
    expect(getState()).toMatchObject({ selectedBuilding: 'solarFarm', money: 1500, turn: 1, energy: 50 });
  });
  it.each([null, [], { unknown: 2 }, JSON.parse('{"__proto__":{}}')])('rejects invalid patch atomically: %j', (patch) => {
    const observer = vi.fn(); listen(observer);
    expect(() => updateState(patch)).toThrow(TypeError);
    expect(observer).not.toHaveBeenCalled(); expect(getState()).toEqual(createInitialState());
  });
  it.each([{ money: NaN }, { energy: Infinity }, { turn: 11 }, { maxTurns: 9 }, { gameOver: 1 }, { selectedBuilding: {} }, { cityGrid: [] }, { buildings: [{}] }])('rejects malformed state atomically: %j', (patch) => {
    const observer = vi.fn(); listen(observer);
    expect(() => setState({ ...createInitialState(), ...patch })).toThrow(TypeError);
    expect(observer).not.toHaveBeenCalled(); expect(getState()).toEqual(createInitialState());
  });
  it('rejects missing cells in sparse grids', () => {
    const input = createInitialState(); delete input.cityGrid[0][0]; expect(() => setState(input)).toThrow(TypeError);
  });
  it('requires the grid and building list to contain matching instances', () => {
    const input = createInitialState();
    const building = { id: 'test-1', type: 'solarFarm', row: 0, col: 0, builtAtTurn: 1 };
    input.cityGrid[0][0] = building; input.buildings.push({ ...building });
    setState(input); expect(getState().buildings[0]).toEqual(building);
    input.buildings[0].row = 2; expect(() => setState(input)).toThrow(TypeError);
  });
  it('rejects duplicate building IDs', () => {
    const input = createInitialState();
    input.cityGrid[0][0] = { id: 'duplicate', type: 'park', row: 0, col: 0, builtAtTurn: 1 };
    input.cityGrid[0][1] = { id: 'duplicate', type: 'park', row: 0, col: 1, builtAtTurn: 1 };
    input.buildings = input.cityGrid[0].filter(Boolean); expect(() => setState(input)).toThrow(TypeError);
  });
});
describe('notifications', () => {
  it('delivers independent next and previous snapshots to each observer', () => {
    listen((next, previous) => { next.money = -1; previous.money = -2; });
    const observer = vi.fn(); listen(observer); updateState({ money: 90 });
    expect(observer).toHaveBeenCalledOnce();
    expect(observer.mock.calls[0][0].money).toBe(90); expect(observer.mock.calls[0][1].money).toBe(10000); expect(getState().money).toBe(90);
  });
  it('reports listener failures without blocking the next listener', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    listen(() => { throw new Error('Expected test failure'); });
    const observer = vi.fn(); listen(observer); updateState({ money: 90 });
    expect(error).toHaveBeenCalledOnce(); expect(observer).toHaveBeenCalledOnce();
  });
  it('deduplicates subscriptions and supports repeated unsubscribe', () => {
    const observer = vi.fn(); const stop = listen(observer); listen(observer);
    updateState({ money: 90 }); expect(observer).toHaveBeenCalledOnce();
    stop(); stop(); updateState({ money: 80 }); expect(observer).toHaveBeenCalledOnce();
  });
  it('preserves transition order when a listener makes a nested update', () => {
    listen((next) => { if (next.money === 90) updateState({ money: 80 }); });
    const values = []; listen((next) => values.push(next.money)); updateState({ money: 90 });
    expect(values).toEqual([90, 80]); expect(getState().money).toBe(80);
  });
  it('resets, notifies, and returns an independent snapshot', () => {
    updateState({ money: 0, selectedBuilding: 'park' }); const observer = vi.fn(); listen(observer);
    const result = resetState(); result.cityGrid[0][0] = 'changed';
    expect(observer).toHaveBeenCalledOnce(); expect(getState()).toEqual(createInitialState());
  });
  it('rejects non-function listeners', () => { expect(() => subscribe('listener')).toThrow(TypeError); });
});
