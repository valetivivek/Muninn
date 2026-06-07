// Muninn toolbar popup (~380×560). Two tabs: Memory (context cards) and
// Upgrade (prompt refinement). A gear opens the options page.

import { useState } from 'react';
import type { Card } from '../lib/types';
import { addCard, updateCard, deleteCard, togglePin, parseTags } from '../lib/cards';
import { useCards, useSettings } from '../ui/hooks';
import { Raven } from '../ui/Raven';
import { IconButton } from '../ui/components';
import { CardList } from './CardList';
import { CardForm, type CardDraft } from './CardForm';
import { Upgrade } from '../ui/Upgrade';

type Tab = 'memory' | 'upgrade';
type View = { kind: 'list' } | { kind: 'new'; seed?: Partial<Card> } | { kind: 'edit'; card: Card };

export function Popup() {
  const { cards, loading, save } = useCards();
  const { settings } = useSettings();
  const [tab, setTab] = useState<Tab>('memory');
  const [view, setView] = useState<View>({ kind: 'list' });

  const upgradeOn = settings.upgradeEnabled;
  // If upgrade is turned off, never show its tab; fall back to memory.
  const activeTab: Tab = tab === 'upgrade' && upgradeOn ? 'upgrade' : 'memory';

  function handleCreate(draft: CardDraft) {
    void save(
      addCard(cards, {
        title: draft.title,
        body: draft.body,
        tags: parseTags(draft.tagsInput),
        source: 'manual',
      }),
    );
    setView({ kind: 'list' });
  }

  function handleUpdate(id: string, draft: CardDraft) {
    void save(
      updateCard(cards, id, {
        title: draft.title,
        body: draft.body,
        tags: parseTags(draft.tagsInput),
      }),
    );
    setView({ kind: 'list' });
  }

  return (
    <div className="flex h-[560px] w-[380px] flex-col bg-bg text-text">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/20">
            <Raven size={20} />
          </span>
          <h1 className="mn-display text-xl font-semibold leading-none">Muninn</h1>
        </div>
        <IconButton label="Open settings" onClick={() => chrome.runtime.openOptionsPage()}>
          <svg
            width={17}
            height={17}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2.3" />
            <circle cx="8" cy="17" r="2.3" />
          </svg>
        </IconButton>
      </header>

      {upgradeOn ? (
        <nav
          className="flex gap-5 border-b border-border px-4"
          role="tablist"
          aria-label="Sections"
        >
          <TabButton
            active={activeTab === 'memory'}
            onClick={() => {
              setTab('memory');
              setView({ kind: 'list' });
            }}
          >
            Memory
          </TabButton>
          <TabButton active={activeTab === 'upgrade'} onClick={() => setTab('upgrade')}>
            Upgrade
          </TabButton>
        </nav>
      ) : (
        <div className="border-b border-border" />
      )}

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === 'memory' ? (
          view.kind === 'list' ? (
            <CardList
              cards={cards}
              loading={loading}
              onNew={() => setView({ kind: 'new' })}
              onEdit={(card) => setView({ kind: 'edit', card })}
              onTogglePin={(id) => void save(togglePin(cards, id))}
              onDelete={(id) => void save(deleteCard(cards, id))}
            />
          ) : view.kind === 'new' ? (
            <CardForm
              submitLabel="Create card"
              onSubmit={handleCreate}
              onCancel={() => setView({ kind: 'list' })}
            />
          ) : (
            <CardForm
              initial={view.card}
              submitLabel="Save changes"
              onSubmit={(draft) => handleUpdate(view.card.id, draft)}
              onCancel={() => setView({ kind: 'list' })}
            />
          )
        ) : (
          <Upgrade settings={settings} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-accent text-text'
          : 'border-transparent text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}
