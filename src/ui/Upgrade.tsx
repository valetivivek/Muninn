// Prompt Upgrade panel (feature 2). Two modes the user chooses between:
//   - Local: deterministic offline rules (no network, ever).
//   - BYOK: calls the user's chosen provider with their own key.
// Shared controls: tone + aggressiveness. Output has copy / insert buttons.

import { useState } from 'react';
import type { Tone, Aggressiveness, Settings } from '../lib/types';
import { runLocalUpgrade } from '../lib/prompt/local';
import { runByokUpgrade, ByokError } from '../lib/prompt/byok';
import { insertIntoActiveTab } from '../lib/messaging';
import { Button, TextArea, Segmented } from './components';

type Mode = 'local' | 'byok';

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
  { value: 'technical', label: 'Technical' },
];

const AGGR_OPTIONS: { value: Aggressiveness; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'radical', label: 'Radical' },
];

export function Upgrade({ settings }: { settings: Settings }) {
  const [mode, setMode] = useState<Mode>('local');
  const [tone, setTone] = useState<Tone>(settings.defaultTone);
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>(
    settings.defaultAggressiveness,
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const hasKey = settings.apiKey.trim().length > 0;

  async function handleUpgrade() {
    setError('');
    setStatus('');
    setOutput('');
    if (!input.trim()) return;

    if (mode === 'local') {
      // Synchronous, offline. No network call is possible here.
      const { output: result } = runLocalUpgrade(input, { tone, aggressiveness });
      setOutput(result);
      return;
    }

    // BYOK
    setBusy(true);
    try {
      await runByokUpgrade({
        input,
        tone,
        aggressiveness,
        settings,
        onChunk: (full) => setOutput(full),
      });
    } catch (e) {
      setError(e instanceof ByokError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setStatus('Copied to clipboard.');
  }

  async function handleInsert() {
    const res = await insertIntoActiveTab(output);
    setStatus(res.ok ? 'Inserted into the page.' : res.reason ?? 'Could not insert.');
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <Segmented<Mode>
        label="Upgrade mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'local', label: 'Local (offline)' },
          { value: 'byok', label: 'Your API key' },
        ]}
      />

      <div className="grid grid-cols-1 gap-2">
        <Segmented<Tone> label="Tone" value={tone} onChange={setTone} options={TONE_OPTIONS} />
        <Segmented<Aggressiveness>
          label="Revision strength"
          value={aggressiveness}
          onChange={setAggressiveness}
          options={AGGR_OPTIONS}
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-2xs font-medium uppercase tracking-wide text-muted">Your prompt</span>
        <TextArea
          value={input}
          rows={4}
          placeholder="Paste a rough prompt to refine…"
          onChange={(e) => setInput(e.target.value)}
        />
      </label>

      {mode === 'byok' && !hasKey && (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
          No API key set. Add one in{' '}
          <button
            className="text-accent hover:underline"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            Options
          </button>{' '}
          to use this mode.
        </p>
      )}

      <Button variant="primary" onClick={handleUpgrade} disabled={busy || !input.trim()}>
        {busy ? 'Upgrading…' : 'Upgrade prompt'}
      </Button>

      <label className="flex min-h-0 flex-1 flex-col gap-1">
        <span className="text-2xs font-medium uppercase tracking-wide text-muted">Refined prompt</span>
        <TextArea
          value={output}
          rows={6}
          readOnly
          placeholder="Your refined prompt will appear here."
          className="min-h-[6rem] flex-1"
          aria-label="Refined prompt"
        />
      </label>

      {error && <p className="text-xs text-danger">{error}</p>}
      {status && <p className="text-xs text-muted" role="status">{status}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button variant="subtle" onClick={handleCopy} disabled={!output}>
          Copy
        </Button>
        <Button variant="subtle" onClick={handleInsert} disabled={!output}>
          Insert into page
        </Button>
      </div>
    </div>
  );
}
