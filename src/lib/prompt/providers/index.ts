// Provider registry. Add a provider by importing its config and listing it
// here — nothing else in the codebase needs to change.

import type { ProviderId } from '../../types';
import type { ProviderConfig } from './types';
import { anthropic } from './anthropic';
import { openai } from './openai';

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  anthropic,
  openai,
};

export const PROVIDER_LIST: ProviderConfig[] = Object.values(PROVIDERS);

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS[id];
}

export type { ProviderConfig } from './types';
