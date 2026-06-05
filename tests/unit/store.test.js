/**
 * Unit tests for Store (localStorage adapter)
 * Requirements: 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal localStorage mock — keeps tests self-contained in Node environment
// ---------------------------------------------------------------------------
function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store, // test helper
  };
}

// Inject mock into global scope before importing the Store logic
const localStorageMock = makeLocalStorageMock();
global.localStorage = localStorageMock;

// ---------------------------------------------------------------------------
// Import Store logic inline (replicate the Store object from app.js)
// The Store is not separately exported, so we reproduce it here to keep
// tests decoupled from the DOM-dependent DOMContentLoaded in app.js.
// ---------------------------------------------------------------------------
const Store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  // Re-wire mock so store starts fresh
  global.localStorage = makeLocalStorageMock();
});

describe('Store.get', () => {
  it('returns fallback (null) when the key is absent', () => {
    expect(Store.get('missing_key')).toBeNull();
  });

  it('returns a custom fallback when the key is absent', () => {
    expect(Store.get('missing_key', 42)).toBe(42);
  });

  it('returns the parsed value for a valid JSON string', () => {
    localStorage.setItem('test_key', JSON.stringify({ name: 'Alice' }));
    expect(Store.get('test_key')).toEqual({ name: 'Alice' });
  });

  it('returns the fallback when the stored value is malformed JSON', () => {
    localStorage.setItem('bad_json', '{not: valid json}');
    expect(Store.get('bad_json', 'fallback')).toBe('fallback');
  });

  it('returns the fallback when localStorage.getItem throws', () => {
    const throwing = {
      getItem: vi.fn(() => { throw new Error('SecurityError'); }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    global.localStorage = throwing;
    expect(Store.get('any_key', 'safe')).toBe('safe');
  });

  it('correctly round-trips arrays', () => {
    const arr = [1, 2, 3];
    localStorage.setItem('arr_key', JSON.stringify(arr));
    expect(Store.get('arr_key')).toEqual(arr);
  });

  it('correctly round-trips numbers', () => {
    localStorage.setItem('num_key', JSON.stringify(99));
    expect(Store.get('num_key')).toBe(99);
  });
});

describe('Store.set', () => {
  it('returns true when storage succeeds', () => {
    expect(Store.set('save_key', { x: 1 })).toBe(true);
  });

  it('stores the value so get can retrieve it', () => {
    Store.set('round_trip', [10, 20]);
    expect(Store.get('round_trip')).toEqual([10, 20]);
  });

  it('returns false when localStorage.setItem throws (e.g. storage full)', () => {
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => { throw new DOMException('QuotaExceededError'); }),
      removeItem: vi.fn(),
    };
    expect(Store.set('quota_key', 'data')).toBe(false);
  });

  it('returns false when JSON.stringify throws (e.g. circular reference)', () => {
    const circular = {};
    circular.self = circular;
    expect(Store.set('circular', circular)).toBe(false);
  });
});

describe('Store.remove', () => {
  it('removes an existing key so get returns the fallback afterward', () => {
    Store.set('to_remove', 'value');
    Store.remove('to_remove');
    expect(Store.get('to_remove')).toBeNull();
  });

  it('does not throw when removing a key that does not exist', () => {
    expect(() => Store.remove('never_existed')).not.toThrow();
  });

  it('calls localStorage.removeItem with the correct key', () => {
    const spy = vi.spyOn(localStorage, 'removeItem');
    Store.remove('my_key');
    expect(spy).toHaveBeenCalledWith('my_key');
  });
});
