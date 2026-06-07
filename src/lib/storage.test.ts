import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  loadRoot,
  getCards,
  setCards,
  getSettings,
  updateSettings,
  exportAll,
  importAll,
  wipeAll,
  runMigrations,
} from './storage';
import { createCard } from './cards';
import { DEFAULT_SETTINGS } from './types';

describe('storage defaults', () => {
  it('loads defaults on an empty store', async () => {
    const root = await loadRoot();
    expect(root['muninn.cards']).toEqual([]);
    expect(root['muninn.settings']).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips cards', async () => {
    const c = createCard({ title: 't', body: 'b' });
    await setCards([c]);
    expect((await getCards())[0].title).toBe('t');
  });

  it('merges partial stored settings with defaults', async () => {
    await updateSettings({ apiKey: 'secret' });
    const s = await getSettings();
    expect(s.apiKey).toBe('secret');
    expect(s.wrapInjection).toBe(true); // default preserved
  });

  it('defaults every feature toggle to enabled', async () => {
    const s = await getSettings();
    expect(s.launcherEnabled).toBe(true);
    expect(s.captureEnabled).toBe(true);
    expect(s.upgradeEnabled).toBe(true);
  });
});

describe('migrations', () => {
  it('stamps the schema version on a fresh store', async () => {
    await runMigrations();
    const root = await loadRoot();
    expect(root['muninn.schemaVersion']).toBe(SCHEMA_VERSION);
  });
});

describe('export / import / wipe', () => {
  it('exports then imports an identical store', async () => {
    await setCards([createCard({ title: 'keep', body: 'b' })]);
    await updateSettings({ model: 'custom-model' });
    const dump = await exportAll();

    await wipeAll();
    expect((await getCards()).length).toBe(0);

    await importAll(dump);
    expect((await getCards())[0].title).toBe('keep');
    expect((await getSettings()).model).toBe('custom-model');
  });

  it('imports defensively from a malformed object', async () => {
    await importAll({ 'muninn.cards': 'not-an-array' as unknown as [] });
    expect(await getCards()).toEqual([]);
  });

  it('wipe restores empty defaults', async () => {
    await setCards([createCard({ title: 'gone', body: 'b' })]);
    await wipeAll();
    const root = await loadRoot();
    expect(root['muninn.cards']).toEqual([]);
    expect(root['muninn.schemaVersion']).toBe(SCHEMA_VERSION);
  });
});
