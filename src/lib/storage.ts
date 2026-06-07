// Typed wrapper around chrome.storage.local plus schema-versioned migrations.
//
// Everything Muninn knows lives here. We never touch chrome.storage.sync (the
// API key must never leave the device via sync), and there is no remote store.

import {
  type StorageRoot,
  type Card,
  type Settings,
  type LauncherPosition,
  DEFAULT_SETTINGS,
} from './types';

export const SCHEMA_VERSION = 1;

const KEYS = {
  schemaVersion: 'muninn.schemaVersion',
  cards: 'muninn.cards',
  settings: 'muninn.settings',
  launcherPos: 'muninn.launcherPos',
} as const;

type StorageKey = (typeof KEYS)[keyof typeof KEYS];

const DEFAULTS: StorageRoot = {
  'muninn.schemaVersion': SCHEMA_VERSION,
  'muninn.cards': [],
  'muninn.settings': DEFAULT_SETTINGS,
  'muninn.launcherPos': {},
};

/**
 * True while the extension context backing this script is still alive. After
 * the extension is reloaded/updated, an old content script lingers on the page
 * until it's refreshed; calling chrome.* then throws "Extension context
 * invalidated". We check this (and swallow errors) so we fail quietly instead
 * of surfacing an uncaught error on the host page.
 */
function extensionAlive(): boolean {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}

function rawGet(keys: StorageKey[]): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    if (!extensionAlive()) return resolve({});
    try {
      chrome.storage.local.get(keys, (items) => {
        // Reading lastError marks it handled (avoids console noise).
        void chrome.runtime.lastError;
        resolve(items ?? {});
      });
    } catch {
      resolve({});
    }
  });
}

function rawSet(items: Partial<StorageRoot>): Promise<void> {
  return new Promise((resolve) => {
    if (!extensionAlive()) return resolve();
    try {
      chrome.storage.local.set(items, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

/**
 * Run forward migrations. Each migration takes the current root and returns an
 * upgraded root. Add new entries as the schema evolves; the loop applies any
 * that are newer than the stored version.
 */
const MIGRATIONS: Record<number, (root: StorageRoot) => StorageRoot> = {
  // v1 is the baseline — nothing to migrate from yet. Future example:
  // 2: (root) => ({ ...root, 'muninn.cards': root['muninn.cards'].map(addNewField) }),
};

export async function runMigrations(): Promise<void> {
  const stored = await rawGet([KEYS.schemaVersion]);
  const current = (stored[KEYS.schemaVersion] as number | undefined) ?? 0;
  if (current >= SCHEMA_VERSION) return;

  // Load the full root, fold every pending migration over it, persist once.
  let root = await loadRoot();
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const migrate = MIGRATIONS[v];
    if (migrate) root = migrate(root);
  }
  root['muninn.schemaVersion'] = SCHEMA_VERSION;
  await rawSet(root);
}

/** Load the entire store, filling any missing keys with defaults. */
export async function loadRoot(): Promise<StorageRoot> {
  const items = await rawGet(Object.values(KEYS) as StorageKey[]);
  return {
    'muninn.schemaVersion':
      (items[KEYS.schemaVersion] as number) ?? DEFAULTS['muninn.schemaVersion'],
    'muninn.cards': (items[KEYS.cards] as Card[]) ?? DEFAULTS['muninn.cards'],
    'muninn.settings': {
      // Merge so a partial stored settings object still gets new defaults.
      ...DEFAULT_SETTINGS,
      ...((items[KEYS.settings] as Partial<Settings>) ?? {}),
    },
    'muninn.launcherPos':
      (items[KEYS.launcherPos] as Record<string, LauncherPosition>) ??
      DEFAULTS['muninn.launcherPos'],
  };
}

// ---- Cards ----------------------------------------------------------------

export async function getCards(): Promise<Card[]> {
  const items = await rawGet([KEYS.cards]);
  return (items[KEYS.cards] as Card[]) ?? [];
}

export async function setCards(cards: Card[]): Promise<void> {
  await rawSet({ 'muninn.cards': cards });
}

// ---- Settings -------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const items = await rawGet([KEYS.settings]);
  return { ...DEFAULT_SETTINGS, ...((items[KEYS.settings] as Partial<Settings>) ?? {}) };
}

export async function setSettings(settings: Settings): Promise<void> {
  await rawSet({ 'muninn.settings': settings });
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await setSettings(next);
  return next;
}

// ---- Launcher position (per hostname) -------------------------------------

export async function getLauncherPos(host: string): Promise<LauncherPosition | undefined> {
  const items = await rawGet([KEYS.launcherPos]);
  const map = (items[KEYS.launcherPos] as Record<string, LauncherPosition>) ?? {};
  return map[host];
}

export async function setLauncherPos(host: string, pos: LauncherPosition): Promise<void> {
  const items = await rawGet([KEYS.launcherPos]);
  const map = (items[KEYS.launcherPos] as Record<string, LauncherPosition>) ?? {};
  map[host] = pos;
  await rawSet({ 'muninn.launcherPos': map });
}

// ---- Export / import / wipe ----------------------------------------------

/** Full export of every Muninn key (used by the options page). */
export async function exportAll(): Promise<StorageRoot> {
  return loadRoot();
}

/**
 * Replace the store with an imported root. Validated shallowly: we only accept
 * keys we recognize and coerce missing pieces to defaults so a malformed file
 * can't wedge the extension.
 */
export async function importAll(data: Partial<StorageRoot>): Promise<void> {
  const root: StorageRoot = {
    'muninn.schemaVersion': SCHEMA_VERSION,
    'muninn.cards': Array.isArray(data['muninn.cards']) ? data['muninn.cards']! : [],
    'muninn.settings': { ...DEFAULT_SETTINGS, ...(data['muninn.settings'] ?? {}) },
    'muninn.launcherPos':
      typeof data['muninn.launcherPos'] === 'object' && data['muninn.launcherPos']
        ? data['muninn.launcherPos']!
        : {},
  };
  await chrome.storage.local.clear();
  await rawSet(root);
}

export async function wipeAll(): Promise<void> {
  await chrome.storage.local.clear();
  await rawSet({ ...DEFAULTS });
}

// ---- Change subscription --------------------------------------------------

type ChangeListener = (root: StorageRoot) => void;

/** Subscribe to any Muninn storage change; receives the freshly-loaded root. */
export function subscribe(listener: ChangeListener): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'local') return;
    const touched = Object.keys(changes).some((k) => k.startsWith('muninn.'));
    if (!touched) return;
    void loadRoot().then(listener);
  };
  if (!extensionAlive()) return () => {};
  try {
    chrome.storage.onChanged.addListener(handler);
  } catch {
    return () => {};
  }
  return () => {
    try {
      chrome.storage.onChanged.removeListener(handler);
    } catch {
      /* context already gone */
    }
  };
}
