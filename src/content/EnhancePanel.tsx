// The on-page Enhance Prompt panel: refines the prompt the user typed in the
// composer. Opened from the spark button in the dock. Local mode runs the
// offline rule pipeline in-page; "Your key" mode asks the background worker to
// call the user's provider, so the API key never enters this page. The result
// can replace the composer text in place. It adopts the host AI's palette like
// the rest of the dock, so it reads as a native feature.

import { useState } from 'react';
import type { SiteAdapter } from './adapters/types';
import type { Settings, Tone, Aggressiveness } from '../lib/types';
import { runLocalUpgrade } from '../lib/prompt/local';
import { upgradeViaBackground } from '../lib/messaging';
import { Spark } from '../ui/Spark';
import { Button, IconButton, TextArea, Segmented } from '../ui/components';

type Mode = 'local' | 'byok';

const TONES: { value: Tone; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
  { value: 'technical', label: 'Technical' },
];
const STRENGTHS: { value: Aggressiveness; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'radical', label: 'Radical' },
];

function readComposer(adapter: SiteAdapter): string {
  const el = adapter.findInput();
  return el ? adapter.readText(el) : '';
}

interface EnhancePanelProps {
  adapter: SiteAdapter;
  settings: Settings;
  onClose: () => void;
  onReplace: (text: string) => void;
  onToast: (msg: string) => void;
}

export function EnhancePanel({ adapter, settings, onClose, onReplace, onToast }: EnhancePanelProps) {
  const [mode, setMode] = useState<Mode>('local');
  const [tone, setTone] = useState<Tone>(settings.defaultTone);
  const [strength, setStrength] = useState<Aggressiveness>(settings.defaultAggressiveness);
  // Seed the editable prompt from whatever is in the composer right now.
  const [input, setInput] = useState(() => readComposer(adapter));
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const hasKey = settings.apiKey.trim().length > 0;

  async function handleEnhance() {
    setError('');
    setOutput('');
    const prompt = input.trim();
    if (!prompt) {
      setError('Type a prompt to enhance. Write one in the chat box (or here) first.');
      return;
    }
    if (mode === 'local') {
      // Offline, synchronous: no network call is possible here.
      setOutput(runLocalUpgrade(prompt, { tone, aggressiveness: strength }).output);
      return;
    }
    setBusy(true);
    const res = await upgradeViaBackground({ input: prompt, tone, aggressiveness: strength });
    setBusy(false);
    if (res.ok) setOutput(res.text);
    else setError(res.reason);
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2 text-accent">
          <Spark size={18} />
          <span className="mn-display text-sm font-semibold text-text">Enhance prompt</span>
        </div>
        <IconButton label="Close" onClick={onClose}>
          ✕
        </IconButton>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-5 pb-5">
        <Segmented<Mode>
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'local', label: 'Local' },
            { value: 'byok', label: 'Your key' },
          ]}
        />
        <Segmented<Tone> label="Tone" value={tone} onChange={setTone} options={TONES} />
        <Segmented<Aggressiveness>
          label="Revision strength"
          value={strength}
          onChange={setStrength}
          options={STRENGTHS}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text">Your prompt</span>
          <TextArea
            rows={3}
            value={input}
            placeholder="Type a prompt to refine…"
            onChange={(e) => setInput(e.target.value)}
          />
        </label>

        {mode === 'byok' && !hasKey && (
          <p className="text-xs leading-relaxed text-muted">
            No API key yet. Add one in Muninn's Options to use your own model. Local mode works now,
            with no key.
          </p>
        )}

        <Button variant="primary" onClick={handleEnhance} disabled={busy}>
          {busy ? 'Enhancing…' : 'Enhance'}
        </Button>

        {error && <p className="text-xs text-danger">{error}</p>}

        {output && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <span className="text-xs font-medium text-text">Refined</span>
            <TextArea
              rows={5}
              value={output}
              readOnly
              aria-label="Refined prompt"
              className="min-h-[5rem]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="subtle"
                onClick={async () => {
                  await navigator.clipboard.writeText(output);
                  onToast('Copied.');
                }}
              >
                Copy
              </Button>
              <Button variant="primary" onClick={() => onReplace(output)}>
                Replace in composer
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
