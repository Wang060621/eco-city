// These event names are the public integration contract.
const eventNames = new Set([
  'building:selected', 'building:placed', 'turn:ended', 'state:changed',
  'game:started', 'game:ended', 'game:reset',
]);
const listeners = new Map();

function assertEvent(eventName) {
  if (!eventNames.has(eventName)) throw new TypeError(`Unknown Eco City event: ${eventName}`);
}

export function on(eventName, callback) {
  assertEvent(eventName);
  if (typeof callback !== 'function') throw new TypeError('An event listener must be a function.');
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(callback);
  return () => off(eventName, callback);
}

export function off(eventName, callback) {
  const callbacks = listeners.get(eventName);
  callbacks?.delete(callback);
  if (callbacks?.size === 0) listeners.delete(eventName);
}

export function emit(eventName, payload) {
  assertEvent(eventName);
  for (const callback of [...(listeners.get(eventName) ?? [])]) {
    try { callback(payload); }
    catch (error) { console.error(`Eco City event listener failed (${eventName}):`, error); }
  }
}
