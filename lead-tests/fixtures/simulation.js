// TEST FIXTURE ONLY. NEVER copy to src. Verifies orchestration, not game rules.
export function applyBuildingPurchase(state, type, row, col, BUILDINGS) {
  if (state.cityGrid[row][col]) return { ok: false, state, error: 'CELL_OCCUPIED', message: 'Test fixture: occupied lot.' };
  const next = structuredClone(state);
  const building = { id: `fixture-${row}-${col}`, type, row, col, builtAtTurn: state.turn };
  next.cityGrid[row][col] = building; next.buildings.push(building); next.money -= BUILDINGS[type].cost;
  return { ok: true, state: next, building, message: 'Test fixture: placement accepted.' };
}
export function endTurn(state) {
  const next = { ...state, turn: Math.min(state.turn + 1, state.maxTurns), gameOver: state.turn === state.maxTurns };
  return { state: next, turnSummary: { money: 0, energy: 0, co2: 0, happiness: 0, ecoScore: 0 },
    gameOver: next.gameOver, finalResult: next.gameOver ? calculateFinalRating(next) : null };
}
export const calculateFinalRating = (state) => ({ rating: 'Wiring check complete', ecoScore: state.ecoScore,
  summary: 'Test fixture only. This is not a real game result.' });
