// Provider config interface. Each supported LLM provider is a single config
// object implementing this shape, so adding a new provider is just adding one
// file + registering it — no changes to the calling code.

import type { ProviderId } from '../../types';

export interface BuildRequestArgs {
  apiKey: string;
  model: string;
  system: string;
  userPrompt: string;
  stream: boolean;
}

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  /** Origin that must be granted (optional_host_permissions) before fetch. */
  origin: string;
  /** Default model id surfaced in the options page. */
  defaultModel: string;
  supportsStreaming: boolean;
  /** Build the fetch() request for this provider. */
  buildRequest(args: BuildRequestArgs): ProviderRequest;
  /**
   * Extract text from a parsed Server-Sent-Events `data:` JSON object during
   * streaming. Return '' for events that carry no text (e.g. pings).
   */
  parseStreamEvent(json: unknown): string;
  /** Extract the full text from a non-streamed JSON response body. */
  parseFull(json: unknown): string;
}
