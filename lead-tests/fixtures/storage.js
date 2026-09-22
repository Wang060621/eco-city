// TEST FIXTURE ONLY. Happy-path persistence probe, not Developer 6's storage logic.
export const saveGame = (state) => { localStorage.setItem('ecoCitySave', JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state })); return { ok: true }; };
export const autoSave = saveGame;
export const loadGame = () => JSON.parse(localStorage.getItem('ecoCitySave') ?? 'null')?.state ?? null;
export const hasSavedGame = () => localStorage.getItem('ecoCitySave') !== null;
export const deleteSavedGame = () => { localStorage.removeItem('ecoCitySave'); return { ok: true }; };
