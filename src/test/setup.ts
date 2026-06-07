// Vitest setup: jsdom matchers + a minimal in-memory chrome.storage.local mock
// so storage/card logic can be tested without a real extension environment.

import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

interface ChangeListener {
  (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, area: string): void;
}

function makeChromeMock() {
  let store: Record<string, unknown> = {};
  const listeners: ChangeListener[] = [];

  const local = {
    get: (keys: string[] | string | null, cb: (items: Record<string, unknown>) => void) => {
      const keyList = Array.isArray(keys) ? keys : keys ? [keys] : Object.keys(store);
      const out: Record<string, unknown> = {};
      for (const k of keyList) if (k in store) out[k] = store[k];
      cb(out);
    },
    set: (items: Record<string, unknown>, cb?: () => void) => {
      const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};
      for (const [k, v] of Object.entries(items)) {
        changes[k] = { oldValue: store[k], newValue: v };
        store[k] = v;
      }
      listeners.forEach((l) => l(changes, 'local'));
      cb?.();
    },
    clear: (cb?: () => void) => {
      store = {};
      cb?.();
      return Promise.resolve();
    },
  };

  return {
    // extensionAlive() checks chrome.runtime.id; provide it so storage works.
    runtime: { id: 'muninn-test', lastError: undefined },
    storage: {
      local,
      onChanged: {
        addListener: (l: ChangeListener) => listeners.push(l),
        removeListener: (l: ChangeListener) => {
          const i = listeners.indexOf(l);
          if (i >= 0) listeners.splice(i, 1);
        },
      },
    },
    __reset: () => {
      store = {};
      listeners.length = 0;
    },
  };
}

const chromeMock = makeChromeMock();
// @ts-expect-error - assigning a partial chrome mock for tests
globalThis.chrome = chromeMock;

beforeEach(() => {
  chromeMock.__reset();
  vi.restoreAllMocks();
});
