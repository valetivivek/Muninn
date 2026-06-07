// Options page: provider + API key, defaults, injection template, and data
// control (export / import / wipe). The API key lives only in
// chrome.storage.local, is masked here, and is never logged.

import { useRef, useState } from 'react';
import type { Tone, Aggressiveness, ProviderId } from '../lib/types';
import { DEFAULT_INJECTION_TEMPLATE } from '../lib/types';
import { PROVIDER_LIST } from '../lib/prompt/providers';
import { templateHasPlaceholder } from '../lib/template';
import { exportAll, importAll, wipeAll } from '../lib/storage';
import { ensureProviderPermission } from '../lib/prompt/byok';
import { useSettings } from '../ui/hooks';
import { Raven } from '../ui/Raven';
import { Button, TextInput, TextArea, Segmented, Toggle } from '../ui/components';

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

export function Options() {
  const { settings, update } = useSettings();
  const [showKey, setShowKey] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2500);
  }

  async function handleProviderChange(provider: ProviderId) {
    const cfg = PROVIDER_LIST.find((p) => p.id === provider)!;
    await update({ provider, model: cfg.defaultModel });
  }

  async function handleSaveKey() {
    // Proactively request the host permission so the first upgrade just works.
    if (settings.apiKey.trim()) {
      await ensureProviderPermission(settings.provider);
    }
    flash('API key saved locally.');
  }

  async function handleExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muninn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    try {
      const data = JSON.parse(await file.text());
      await importAll(data);
      flash('Data imported.');
    } catch {
      flash('Import failed: that file is not valid Muninn JSON.');
    }
  }

  const provider = PROVIDER_LIST.find((p) => p.id === settings.provider)!;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent ring-1 ring-accent/20">
          <Raven size={26} />
        </span>
        <div>
          <h1 className="mn-display text-2xl font-semibold">Muninn</h1>
          <p className="text-xs text-muted">Settings · everything is stored locally on this device.</p>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <Section title="Prompt Upgrade — your API key (optional)">
          <p className="mb-3 text-xs text-muted">
            Local upgrade works offline with no key. To use your own model, choose a provider and
            paste a key.
          </p>
          <Field label="Provider">
            <Segmented<ProviderId>
              label="Provider"
              value={settings.provider}
              onChange={handleProviderChange}
              options={PROVIDER_LIST.map((p) => ({ value: p.id, label: p.label }))}
            />
          </Field>
          <Field label="Model">
            <TextInput
              value={settings.model}
              placeholder={provider.defaultModel}
              onChange={(e) => void update({ model: e.target.value })}
            />
          </Field>
          <Field label="API key">
            <div className="flex gap-2">
              <TextInput
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                autoComplete="off"
                spellCheck={false}
                placeholder={`Your ${provider.label} key`}
                onChange={(e) => void update({ apiKey: e.target.value })}
              />
              <Button variant="ghost" onClick={() => setShowKey((s) => !s)}>
                {showKey ? 'Hide' : 'Show'}
              </Button>
              <Button variant="primary" onClick={handleSaveKey}>
                Save
              </Button>
            </div>
            <p className="mt-1.5 text-2xs text-muted">
              🔒 Stored only on this device (chrome.storage.local) and sent only to your chosen
              provider when you upgrade a prompt. Never synced, never logged.
            </p>
          </Field>
        </Section>

        <Section title="Defaults">
          <Field label="Default tone">
            <Segmented<Tone>
              label="Default tone"
              value={settings.defaultTone}
              onChange={(v) => void update({ defaultTone: v })}
              options={TONE_OPTIONS}
            />
          </Field>
          <Field label="Default revision strength">
            <Segmented<Aggressiveness>
              label="Default revision strength"
              value={settings.defaultAggressiveness}
              onChange={(v) => void update({ defaultAggressiveness: v })}
              options={AGGR_OPTIONS}
            />
          </Field>
        </Section>

        <Section title="Context injection">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Wrap injected context in a template</p>
              <p className="text-xs text-muted">
                Asks the model to absorb and confirm the context before acting.
              </p>
            </div>
            <Toggle
              label="Wrap injected context"
              checked={settings.wrapInjection}
              onChange={(v) => void update({ wrapInjection: v })}
            />
          </div>
          <Field label="Template">
            <TextArea
              rows={5}
              value={settings.injectionTemplate}
              disabled={!settings.wrapInjection}
              onChange={(e) => void update({ injectionTemplate: e.target.value })}
            />
            <div className="mt-1.5 flex items-center justify-between text-2xs text-muted">
              <span>
                Use <code className="rounded bg-surface-2 px-1">{'{{card.body}}'}</code> where the
                card content should go.
              </span>
              <button
                className="text-accent hover:underline"
                onClick={() => void update({ injectionTemplate: DEFAULT_INJECTION_TEMPLATE })}
              >
                Reset to default
              </button>
            </div>
            {settings.wrapInjection && !templateHasPlaceholder(settings.injectionTemplate) && (
              <p className="mt-1 text-2xs text-danger">
                No {'{{card.body}}'} placeholder found — the card body will be appended after the
                template.
              </p>
            )}
          </Field>
        </Section>

        <Section title="Your data">
          <p className="mb-3 text-xs text-muted">
            Export everything (cards, settings, launcher positions — including your key) to a JSON
            file, or restore from one. Import replaces all current data.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" onClick={handleExport}>
              Export JSON
            </Button>
            <Button variant="subtle" onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImportFile(f);
                e.target.value = '';
              }}
            />
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Erase ALL Muninn data on this device? This cannot be undone.')) {
                  void wipeAll().then(() => flash('All data erased.'));
                }
              }}
            >
              Wipe all data
            </Button>
          </div>
        </Section>
      </div>

      {toast && (
        <div
          role="status"
          className="mn-panel fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 text-sm"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mn-panel rounded-2xl p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-xs font-medium text-text">{label}</label>
      {children}
    </div>
  );
}
