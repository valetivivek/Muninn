import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Popup } from './Popup';
import { updateSettings } from '../lib/storage';

describe('Popup tabs', () => {
  it('shows the Upgrade tab when prompt upgrade is enabled', async () => {
    render(<Popup />);
    expect(await screen.findByRole('tab', { name: /upgrade/i })).toBeInTheDocument();
    // The memory search and create affordances stay reachable by accessible name.
    expect(screen.getByPlaceholderText(/search cards/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new card/i })).toBeInTheDocument();
  });

  it('hides the Upgrade tab when prompt upgrade is disabled', async () => {
    await updateSettings({ upgradeEnabled: false });
    render(<Popup />);
    // The memory view still renders…
    await screen.findByPlaceholderText(/search cards/i);
    // …but the Upgrade tab is gone.
    await waitFor(() => expect(screen.queryByRole('tab', { name: /upgrade/i })).toBeNull());
  });
});
