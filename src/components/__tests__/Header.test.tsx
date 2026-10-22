import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EVERYDAY_MODULES, SUPERUSER_MODULES } from '../../pages/modules';
import Header from '../Header';
import { ColorModeProvider } from '../../theme';

vi.mock('../../services/healthService', () => ({
  getHealthStatus: vi.fn().mockResolvedValue({ status: 'UP', details: {} }),
}));

const renderHeader = (at = '/') => render(
  <ColorModeProvider>
    <MemoryRouter initialEntries={[at]}><Header /></MemoryRouter>
  </ColorModeProvider>
);

/**
 * The quick menu, and where it sits.
 *
 * It used to be hidden above the lg breakpoint, on the reasoning that the top navigation replaces
 * it. The two hold different things: the bar has the six everyday destinations, and the menu is the
 * only way to Embeddings, Statistikk, Systemstatus, Søk, Semantisk søk, the brand switch and the
 * page-help setting. On a wide screen those were reachable from the dashboard's cards and nowhere
 * else, so landing on a subpage meant going back to the front page to get anywhere.
 *
 * jsdom does not evaluate media queries, so no test here can prove what happens at a given width;
 * that was measured in a browser from 320px to 1440px. What these cases hold is the part jsdom can
 * see: the button exists, it opens the menu, it carries no responsive display rule, and it sits
 * where it was asked to sit.
 */
describe('Header', () => {
  beforeEach(() => vi.clearAllMocks());

  it('has a menu button that opens the menu', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'meny' }));

    expect(screen.getByRole('menuitem', { name: 'Systemstatus' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Statistikk' })).toBeInTheDocument();
  });

  /**
   * The destinations that exist only here. If one of them ever moves into the top bar this can be
   * loosened, but until then losing the menu means losing the page.
   */
  it('is the only way to the pages that are not in the top bar', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'meny' }));

    for (const name of ['Embeddings', 'Statistikk', 'Systemstatus', 'Søk', 'Semantisk søk']) {
      expect(screen.getByRole('menuitem', { name })).toBeInTheDocument();
    }
  });

  /** Asked for explicitly: to the left of the health dot, first in the cluster. */
  it('puts the menu button before the health indicator', async () => {
    renderHeader();

    // The indicator is a spinner until the health call resolves, then the dot.
    const health = await screen.findByTestId('CircleIcon');
    const menu = screen.getByRole('button', { name: 'meny' });

    expect(menu.compareDocumentPosition(health) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /**
   * A breakpoint rule on this button is what hid it in the first place, so its absence is the thing
   * worth pinning. MUI compiles `sx={{ display: { lg: 'none' } }}` into a class with a media query;
   * jsdom cannot run the query, but it can see that no display rule was asked for.
   */
  it('carries no responsive rule that could hide it', () => {
    renderHeader();

    const menu = screen.getByRole('button', { name: 'meny' });

    expect(menu.style.display).toBe('');
    expect(window.getComputedStyle(menu).display).not.toBe('none');
  });

  /**
   * The menu was a third hand-kept list beside the top bar and the dashboard: «Chat Analyze» for
   * the assistant, and no way to Ferdigheter, CV-scoregrunnlag or Superbruker. It reads the
   * module lists now, so a page has one name everywhere.
   */
  it('lists every module under the name the dashboard gives it, and Superbruker', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'meny' }));

    for (const m of [...EVERYDAY_MODULES, ...SUPERUSER_MODULES]) {
      expect(screen.getByRole('menuitem', { name: m.title })).toHaveAttribute('href', m.to);
    }
    expect(screen.getByRole('menuitem', { name: 'Superbruker' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Chat Analyze' })).not.toBeInTheDocument();
    expect(screen.queryByText(/kundeforspørsel|look$/i)).not.toBeInTheDocument();
  });

  /** Where you are, said to the eye and to a screen reader, on every page under a section. */
  it('marks the section you are in, also on a page under it', () => {
    renderHeader('/matches/9011');

    expect(screen.getByRole('link', { name: 'Matcher' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Konsulenter' })).not.toHaveAttribute('aria-current');
  });

  /** A button that did nothing is gone until there is a profile to show. */
  it('has no profile button', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: 'profil' })).not.toBeInTheDocument();
  });
});
