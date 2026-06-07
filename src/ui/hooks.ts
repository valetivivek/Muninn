// React hooks that bind component state to chrome.storage.local and stay in
// sync across the popup, options page, and content script via the storage
// change subscription.

import { useEffect, useState, useCallback } from 'react';
import type { Card, Settings } from '../lib/types';
import { DEFAULT_SETTINGS } from '../lib/types';
import {
  getCards,
  setCards as persistCards,
  getSettings,
  updateSettings as persistSettings,
  subscribe,
} from '../lib/storage';

/** Live list of cards, with a setter that persists. */
export function useCards(): {
  cards: Card[];
  loading: boolean;
  save: (cards: Card[]) => Promise<void>;
} {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCards().then((c) => {
      if (active) {
        setCards(c);
        setLoading(false);
      }
    });
    const unsub = subscribe((root) => setCards(root['muninn.cards']));
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const save = useCallback(async (next: Card[]) => {
    setCards(next); // optimistic
    await persistCards(next);
  }, []);

  return { cards, loading, save };
}

/** Live settings with a partial-update setter that persists. */
export function useSettings(): {
  settings: Settings;
  loading: boolean;
  update: (patch: Partial<Settings>) => Promise<void>;
} {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSettings().then((s) => {
      if (active) {
        setSettings(s);
        setLoading(false);
      }
    });
    const unsub = subscribe((root) => setSettings(root['muninn.settings']));
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch })); // optimistic
    await persistSettings(patch);
  }, []);

  return { settings, loading, update };
}
