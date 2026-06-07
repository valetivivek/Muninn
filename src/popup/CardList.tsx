// The Memory tab: search, the card list, and per-card actions. Creating and
// editing are delegated to CardForm via the parent's mode state.

import { useMemo, useState } from 'react';
import type { Card } from '../lib/types';
import { searchCards } from '../lib/cards';
import {
  Button,
  IconButton,
  TextInput,
  Tag,
  EmptyState,
  Markdown,
  CardSkeleton,
} from '../ui/components';
import { Raven } from '../ui/Raven';

interface CardListProps {
  cards: Card[];
  loading?: boolean;
  onNew: () => void;
  onEdit: (card: Card) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CardList({ cards, loading, onNew, onEdit, onTogglePin, onDelete }: CardListProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => searchCards(cards, query), [cards, query]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <TextInput
          value={query}
          placeholder="Search cards by title or tag…"
          aria-label="Search cards"
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="primary" onClick={onNew} aria-label="New card" className="shrink-0">
          New card
        </Button>
      </div>

      {loading && cards.length === 0 ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={<Raven size={34} />}
          title="No cards yet"
          hint="Create your first card to save reusable context, then inject it into any AI chat with one click."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" hint={`Nothing matches "${query}". Try a different word or tag.`} />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto pr-0.5">
          {visible.map((card, i) => {
            const isOpen = expanded === card.id;
            return (
              <li
                key={card.id}
                className="mn-card mn-rise rounded-xl px-3 py-2.5"
                style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
              >
                <div className="flex items-start gap-2">
                  <button
                    className="min-w-0 flex-1 rounded-lg text-left"
                    onClick={() => setExpanded(isOpen ? null : card.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-1.5">
                      {card.pinned && (
                        <span aria-label="Pinned" title="Pinned" className="text-accent">
                          ★
                        </span>
                      )}
                      <span className="mn-display truncate text-base font-semibold">{card.title}</span>
                    </div>
                    {card.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {card.tags.map((t) => (
                          <Tag key={t}>#{t}</Tag>
                        ))}
                      </div>
                    )}
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <IconButton
                      label={card.pinned ? 'Unpin card' : 'Pin card'}
                      active={card.pinned}
                      onClick={() => onTogglePin(card.id)}
                    >
                      ★
                    </IconButton>
                    <IconButton label="Edit card" onClick={() => onEdit(card)}>
                      ✎
                    </IconButton>
                    <IconButton
                      label="Delete card"
                      onClick={() => {
                        if (confirm(`Delete "${card.title}"? This can't be undone.`)) onDelete(card.id);
                      }}
                    >
                      ✕
                    </IconButton>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-2.5 border-t border-border pt-2.5">
                    <Markdown>{card.body}</Markdown>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
