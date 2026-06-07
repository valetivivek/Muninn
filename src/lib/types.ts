// Shared domain types for Muninn.

export type CardSource = 'manual' | 'captured';

export interface Card {
  id: string;
  title: string;
  /** Raw markdown. Stored as-authored; rendered for preview only. */
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  source: CardSource;
}

export type Tone = 'auto' | 'business' | 'creative' | 'technical';
export type Aggressiveness = 'conservative' | 'balanced' | 'radical';
export type ProviderId = 'anthropic' | 'openai';

export interface Settings {
  provider: ProviderId;
  /** Stored ONLY in chrome.storage.local. Masked in UI. Never logged. */
  apiKey: string;
  /** Model id for the chosen provider (user-editable). */
  model: string;
  defaultTone: Tone;
  defaultAggressiveness: Aggressiveness;
  /** When true, injected card bodies are wrapped in the template below. */
  wrapInjection: boolean;
  /** Editable injection template. Must contain the {{card.body}} placeholder. */
  injectionTemplate: string;
}

/** The shape of everything Muninn persists in chrome.storage.local. */
export interface StorageRoot {
  'muninn.schemaVersion': number;
  'muninn.cards': Card[];
  'muninn.settings': Settings;
}

export const DEFAULT_INJECTION_TEMPLATE = `[CONTEXT — absorb the following, confirm you've understood it, then wait for my instructions. Do not act yet.]
{{card.body}}
[END CONTEXT]`;

export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  apiKey: '',
  model: 'claude-sonnet-4-6',
  defaultTone: 'auto',
  defaultAggressiveness: 'balanced',
  wrapInjection: true,
  injectionTemplate: DEFAULT_INJECTION_TEMPLATE,
};
