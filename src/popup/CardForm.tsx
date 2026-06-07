// Create / edit form for a context card. Controlled, keyboard-friendly, with a
// live markdown preview of the body.

import { useState } from 'react';
import type { Card } from '../lib/types';
import { Button, TextInput, TextArea, Markdown } from '../ui/components';

export interface CardDraft {
  title: string;
  body: string;
  tagsInput: string;
}

interface CardFormProps {
  /** When editing, the existing card; when creating, a partial seed (capture). */
  initial?: Partial<Card> & { tagsInput?: string };
  submitLabel: string;
  onSubmit: (draft: CardDraft) => void;
  onCancel: () => void;
}

export function CardForm({ initial, submitLabel, onSubmit, onCancel }: CardFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [tagsInput, setTagsInput] = useState(
    initial?.tagsInput ?? (initial?.tags ?? []).join(', '),
  );
  const [showPreview, setShowPreview] = useState(false);

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  return (
    <form
      className="flex h-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) onSubmit({ title, body, tagsInput });
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-2xs font-medium uppercase tracking-wide text-muted">Title</span>
        <TextInput
          autoFocus
          value={title}
          placeholder="e.g. My product brief"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="flex min-h-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between text-2xs font-medium uppercase tracking-wide text-muted">
          Body (markdown)
          <button
            type="button"
            className="normal-case text-accent hover:underline"
            onClick={() => setShowPreview((p) => !p)}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </span>
        {showPreview ? (
          <div className="min-h-[8rem] flex-1 overflow-auto rounded-xl border border-border bg-surface-2 px-3 py-2">
            {body.trim() ? <Markdown>{body}</Markdown> : <span className="text-xs text-muted">Nothing to preview yet.</span>}
          </div>
        ) : (
          <TextArea
            value={body}
            rows={7}
            placeholder="The context you want to reuse. Markdown is supported."
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[8rem] flex-1"
          />
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-2xs font-medium uppercase tracking-wide text-muted">Tags</span>
        <TextInput
          value={tagsInput}
          placeholder="comma separated, e.g. work, brief"
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </label>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!canSave}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
