import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import SyncButton from './SyncButton';
import SyncNotificationPanel, { SyncNotification } from './SyncNotificationPanel';

// Ensure DOM is cleaned between tests to avoid duplicate elements from previous renders
afterEach(() => {
  cleanup();
});

describe('SyncButton', () => {
  it('renders single sync button', () => {
    const mockOnClick = vi.fn();
    
    render(
      <SyncButton
        variant="single"
        onClick={mockOnClick}
      />
    );

    const button = screen.getByText('Oppdater CV');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledOnce();
  });

  it('renders all sync button', () => {
    const mockOnClick = vi.fn();
    
    render(
      <SyncButton
        variant="all"
        onClick={mockOnClick}
      />
    );

    const button = screen.getByText('Hent alle CV-er');
    expect(button).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const mockOnClick = vi.fn();
    
    render(
      <SyncButton
        variant="single"
        loading={true}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('Oppdaterer...')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Oppdaterer...' });
    expect(button).toBeDisabled();
  });

  it('shows disabled state', () => {
    const mockOnClick = vi.fn();
    
    render(
      <SyncButton
        variant="single"
        disabled={true}
        onClick={mockOnClick}
      />
    );

    const buttons = screen.getAllByRole('button');
    const disabledButton = buttons.find(btn => (btn as HTMLButtonElement).disabled);
    expect(disabledButton).toBeDefined();
    expect(disabledButton).toBeDisabled();
  });

  it('handles click events', async () => {
    const mockOnClick = vi.fn();
    
    render(
      <SyncButton
        variant="single"
        onClick={mockOnClick}
      />
    );

    const button = screen.getByTestId('sync-button-single');
    await userEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledOnce();
  });
});

describe('SyncNotificationPanel', () => {
  it('renders success notification', () => {
    const notification: SyncNotification = {
      type: 'success',
      title: 'Synkronisering fullført',
      message: 'Alle CV-er er oppdatert'
    };

    render(<SyncNotificationPanel notification={notification} />);

    expect(screen.getByText('Synkronisering fullført')).toBeInTheDocument();
    expect(screen.getByText('Alle CV-er er oppdatert')).toBeInTheDocument();
  });

  it('renders error notification', () => {
    const notification: SyncNotification = {
      type: 'error',
      title: 'Synkronisering feilet',
      message: 'Kunne ikke hente CV-data'
    };

    render(<SyncNotificationPanel notification={notification} />);

    expect(screen.getByText('Synkronisering feilet')).toBeInTheDocument();
    expect(screen.getByText('Kunne ikke hente CV-data')).toBeInTheDocument();
  });

  it('renders progress notification', () => {
    const notification: SyncNotification = {
      type: 'progress',
      title: 'Henter data',
      message: 'Dette kan ta litt tid...'
    };

    render(<SyncNotificationPanel notification={notification} />);

    expect(screen.getByText('Henter data')).toBeInTheDocument();
    expect(screen.getByText('Dette kan ta litt tid...')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')[0]).toBeInTheDocument();
  });

  it('renders bulk sync details', () => {
    const notification: SyncNotification = {
      type: 'success',
      title: 'Bulk sync complete',
      details: {
        total: 100,
        succeeded: 95,
        failed: 5
      }
    };

    render(<SyncNotificationPanel notification={notification} />);

    expect(screen.getByText('Totalt: 100')).toBeInTheDocument();
    expect(screen.getByText('Vellykket: 95')).toBeInTheDocument();
    expect(screen.getByText('Feilet: 5')).toBeInTheDocument();
  });

  it('renders single consultant sync details', () => {
    const notification: SyncNotification = {
      type: 'success',
      title: 'CV oppdatert',
      details: {
        processed: true
      }
    };

    render(<SyncNotificationPanel notification={notification} />);

    expect(screen.getByText('Prosessert')).toBeInTheDocument();
  });

  it('does not render when notification is null', () => {
    const { container } = render(<SyncNotificationPanel notification={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onDismiss when close button is clicked', () => {
    const mockOnDismiss = vi.fn();
    const notification: SyncNotification = {
      type: 'success',
      title: 'Test notification'
    };

    render(
      <SyncNotificationPanel 
        notification={notification} 
        onDismiss={mockOnDismiss}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockOnDismiss).toHaveBeenCalledOnce();
  });
});