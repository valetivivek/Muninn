import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Launcher } from './Launcher';
import type { SiteAdapter } from './adapters/types';
import { setCards, getCards, updateSettings } from '../lib/storage';
import { createCard } from '../lib/cards';

// A fake composer with a non-zero rect (jsdom returns zeros, which would make
// the dock hide). readText/setText round-trip a backing string so the enhance
// flow can read the "typed" prompt and we can assert what gets written back.
function makeAdapter(initialText = '', conversationText = 'THE WHOLE CONVERSATION') {
  let text = initialText;
  const input = document.createElement('div');
  input.getBoundingClientRect = () =>
    ({ right: 600, left: 200, top: 300, bottom: 350, width: 400, height: 50, x: 200, y: 300 }) as DOMRect;
  const setText = vi.fn((_el: HTMLElement, t: string) => {
    text = t;
  });
  const adapter: SiteAdapter = {
    id: 'chatgpt',
    matches: () => true,
    findInput: () => input,
    findAnchor: () => input,
    readText: () => text,
    setText,
    findSendButton: () => null,
    lastMessageText: () => 'THE LAST ASSISTANT MESSAGE',
    conversationText: () => conversationText,
  };
  return { adapter, setText };
}

function mockSelection(text: string) {
  // @ts-expect-error - partial Selection is fine for the launcher's .toString() use
  window.getSelection = () => ({ toString: () => text });
}

describe('Launcher dock', () => {
  beforeEach(() => mockSelection(''));

  it('shows both the memory and enhance buttons when enabled', async () => {
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    expect(await screen.findByLabelText('Open Muninn memory')).toBeInTheDocument();
    expect(await screen.findByLabelText('Enhance prompt')).toBeInTheDocument();
  });

  it('hides the memory button when the launcher is disabled', async () => {
    await updateSettings({ launcherEnabled: false });
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    expect(await screen.findByLabelText('Enhance prompt')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText('Open Muninn memory')).toBeNull());
  });

  it('hides the enhance button when prompt upgrade is disabled', async () => {
    await updateSettings({ upgradeEnabled: false });
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    expect(await screen.findByLabelText('Open Muninn memory')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText('Enhance prompt')).toBeNull());
  });

  it('renders nothing when the adapter cannot find the input', async () => {
    const { adapter } = makeAdapter();
    const dead: SiteAdapter = { ...adapter, findInput: () => null };
    const { container } = render(<Launcher adapter={dead} />);
    await waitFor(() => expect(container.querySelector('button')).toBeNull());
  });
});

describe('Memory panel', () => {
  beforeEach(() => mockSelection(''));

  it('inserts a card (template-wrapped, appended) into the composer', async () => {
    await setCards([createCard({ title: 'My coding style', body: 'Prefer TypeScript.' })]);
    const { adapter, setText } = makeAdapter();
    render(<Launcher adapter={adapter} />);

    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));
    fireEvent.click((await screen.findByText('My coding style')).closest('button')!);

    await waitFor(() => expect(setText).toHaveBeenCalled());
    const inserted = setText.mock.calls[0][1] as string;
    expect(inserted).toContain('Prefer TypeScript.'); // the card body
    expect(inserted).toContain('[CONTEXT'); // wrapped in the default template
  });

  it('offers all three capture sources when capture is enabled', async () => {
    await setCards([]);
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));

    expect(await screen.findByRole('button', { name: /^selection$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /last message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /full chat/i })).toBeInTheDocument();
  });

  it('captures the page text selection into a new card', async () => {
    await setCards([]);
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));

    mockSelection('A highlighted passage from the chat.');
    act(() => document.dispatchEvent(new Event('selectionchange')));
    fireEvent.click(screen.getByRole('button', { name: /^selection$/i }));

    const body = (await screen.findByPlaceholderText('Captured text…')) as HTMLTextAreaElement;
    expect(body.value).toBe('A highlighted passage from the chat.');
    expect(screen.getByText(/Captured your selection/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save card/i }));
    await waitFor(async () => {
      const cards = await getCards();
      expect(cards.some((c) => c.source === 'captured')).toBe(true);
    });
  });

  it('disables the Selection source when nothing is selected', async () => {
    await setCards([]);
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));

    const selection = await screen.findByRole('button', { name: /^selection$/i });
    expect(selection).toBeDisabled();
  });

  it('captures the last message via lastMessageText()', async () => {
    await setCards([]);
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));
    fireEvent.click(screen.getByRole('button', { name: /last message/i }));

    const body = (await screen.findByPlaceholderText('Captured text…')) as HTMLTextAreaElement;
    expect(body.value).toBe('THE LAST ASSISTANT MESSAGE');
    expect(screen.getByText(/Captured the last message/i)).toBeInTheDocument();
  });

  it('captures the full chat via conversationText() and saves that body', async () => {
    await setCards([]);
    const { adapter } = makeAdapter('', 'You: hi\n\nChatGPT: hello there');
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));
    fireEvent.click(screen.getByRole('button', { name: /full chat/i }));

    const body = (await screen.findByPlaceholderText('Captured text…')) as HTMLTextAreaElement;
    expect(body.value).toBe('You: hi\n\nChatGPT: hello there');
    expect(screen.getByText(/Captured the full chat/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save card/i }));
    await waitFor(async () => {
      const cards = await getCards();
      const captured = cards.find((c) => c.source === 'captured');
      expect(captured?.body).toBe('You: hi\n\nChatGPT: hello there');
    });
  });

  it('fails gracefully when the full chat is unavailable (no empty card)', async () => {
    await setCards([]);
    const { adapter } = makeAdapter('', ''); // conversationText() returns ''
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));
    fireEvent.click(screen.getByRole('button', { name: /full chat/i }));

    // A helpful message is shown…
    expect(await screen.findByText(/couldn't read the conversation/i)).toBeInTheDocument();
    // …the save form never opens…
    expect(screen.queryByPlaceholderText('Captured text…')).toBeNull();
    // …and no card was created.
    const cards = await getCards();
    expect(cards.length).toBe(0);
  });

  it('hides every capture source when capture is disabled', async () => {
    await updateSettings({ captureEnabled: false });
    await setCards([createCard({ title: 'Keepsake', body: 'Y' })]);
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Open Muninn memory'));
    await screen.findByText('Keepsake'); // panel is open
    expect(screen.queryByRole('button', { name: /^selection$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /last message/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /full chat/i })).toBeNull();
  });
});

describe('Enhance panel', () => {
  beforeEach(() => mockSelection(''));

  it('enhances the composer text locally and replaces it in place', async () => {
    const { adapter, setText } = makeAdapter('write a poem about the sea');
    render(<Launcher adapter={adapter} />);

    fireEvent.click(await screen.findByLabelText('Enhance prompt'));
    fireEvent.click(await screen.findByRole('button', { name: /^enhance$/i }));

    const replace = await screen.findByRole('button', { name: /replace in composer/i });
    fireEvent.click(replace);

    await waitFor(() => expect(setText).toHaveBeenCalled());
    const replaced = setText.mock.calls.at(-1)![1] as string;
    expect(replaced).toContain('write a poem about the sea'); // original intent preserved
    expect(replaced).not.toContain('[CONTEXT'); // a rewrite, not a context wrap
  });

  it('tells the user when there is nothing to enhance', async () => {
    const { adapter } = makeAdapter(''); // empty composer
    render(<Launcher adapter={adapter} />);
    fireEvent.click(await screen.findByLabelText('Enhance prompt'));
    fireEvent.click(await screen.findByRole('button', { name: /^enhance$/i }));
    expect(await screen.findByText(/type a prompt to enhance/i)).toBeInTheDocument();
  });
});
