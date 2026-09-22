import { afterEach, describe, expect, it, vi } from 'vitest';
import { on, off, emit } from '../src/core/eventBus.js';
const cleanup = [];
const listen = (event, callback) => { const stop = on(event, callback); cleanup.push(stop); return stop; };
afterEach(() => { cleanup.splice(0).forEach((stop) => stop()); vi.restoreAllMocks(); });
describe('event bus', () => {
  it.each(['building:selected', 'building:placed', 'turn:ended', 'state:changed', 'game:started', 'game:ended', 'game:reset'])('supports %s with the supplied payload', (name) => {
    const observer = vi.fn(); listen(name, observer); const payload = { value: 1 };
    emit(name, payload); expect(observer).toHaveBeenCalledOnce(); expect(observer).toHaveBeenCalledWith(payload);
  });
  it('delivers once per function even when registered twice', () => {
    const first = vi.fn(); const second = vi.fn(); listen('game:started', first); listen('game:started', first); listen('game:started', second);
    emit('game:started'); expect(first).toHaveBeenCalledOnce(); expect(second).toHaveBeenCalledOnce();
  });
  it('isolates channels and permits repeated unsubscribe', () => {
    const observer = vi.fn(); const stop = listen('game:reset', observer);
    emit('game:started'); expect(observer).not.toHaveBeenCalled(); stop(); stop(); emit('game:reset'); expect(observer).not.toHaveBeenCalled();
  });
  it('ignores missing events and callbacks in off', () => {
    expect(() => off('not-registered', () => {})).not.toThrow(); expect(() => off('game:started')).not.toThrow();
  });
  it('takes a listener snapshot during emission', () => {
    const next = vi.fn(); const current = vi.fn();
    listen('game:reset', () => { off('game:reset', current); listen('game:reset', next); }); listen('game:reset', current);
    emit('game:reset'); expect(current).toHaveBeenCalledOnce(); expect(next).not.toHaveBeenCalled();
    emit('game:reset'); expect(current).toHaveBeenCalledOnce(); expect(next).toHaveBeenCalledOnce();
  });
  it('reports listener errors without losing later listeners', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    listen('game:reset', () => { throw new Error('Expected test failure'); }); const observer = vi.fn(); listen('game:reset', observer);
    emit('game:reset'); expect(error).toHaveBeenCalledOnce(); expect(observer).toHaveBeenCalledOnce();
  });
  it('rejects invalid event names and listener types', () => {
    expect(() => on('game:typo', () => {})).toThrow(TypeError); expect(() => emit('game:typo')).toThrow(TypeError); expect(() => on('game:reset', null)).toThrow(TypeError);
  });
});
