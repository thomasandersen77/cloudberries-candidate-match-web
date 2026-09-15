import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageIntro from '../PageIntro';
import Header from '../Header';
import { ColorModeProvider } from '../../theme';
import { PAGE_INTROS, type PageIntroKey } from '../../pages/pageIntros';

/**
 * A working localStorage, because this runner does not have one.
 *
 * `globalThis.localStorage` here is a bare object with no getItem, no setItem and no clear: Node's
 * own `--localstorage-file` storage is enabled without a path and shadows the one jsdom would
 * provide. Every call on it throws a TypeError. The component survives that by design, which is
 * also the private-browsing case, but it means storing a preference cannot be exercised at all
 * unless the test supplies somewhere to store it.
 */
const memoryStorage = () => {
  const entries = new Map<string, string>();
  return {
    getItem: (k: string) => entries.get(k) ?? null,
    setItem: (k: string, v: string) => { entries.set(k, String(v)); },
    removeItem: (k: string) => { entries.delete(k); },
    clear: () => entries.clear(),
    key: (i: number) => [...entries.keys()][i] ?? null,
    get length() { return entries.size; }
  } as Storage;
};

/** The header reads brand and colour mode from the theme context, so it needs one. */
const renderWithHeader = (page: PageIntroKey) => render(
  <ColorModeProvider>
    <MemoryRouter>
      <Header />
      <PageIntro page={page} />
    </MemoryRouter>
  </ColorModeProvider>
);

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'meny' }));
const menuItem = () => screen.getByRole('menuitem', { name: /Vis sideforklaringer/ });

describe('PageIntro', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));

  it('shows the intro for the page it is given', () => {
    render(<MemoryRouter><PageIntro page="matches" /></MemoryRouter>);

    expect(screen.getByText(PAGE_INTROS.matches.intro)).toBeInTheDocument();
  });

  /**
   * Open when you arrive, and foldable from there.
   *
   * They started closed, so the work surface would be the first thing on screen. Three short lines
   * were not what pushed the table down, and a reader who has to click to find out what a page does
   * mostly does not click. Somebody who knows the pages turns the whole thing off with "Skjul".
   */
  it('shows the steps on arrival, and folds them on request', async () => {
    render(<MemoryRouter><PageIntro page="matches" /></MemoryRouter>);
    const firstStep = PAGE_INTROS.matches.steps[0];

    expect(screen.getByText(firstStep)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Slik bruker du siden/ }));

    // Collapse unmounts its children when the transition ends, not on the click.
    await waitFor(() => expect(screen.queryByText(firstStep)).not.toBeInTheDocument());
  });

  /** Every step, not just the first: the whole list is the help. */
  it('shows every step for the page', () => {
    render(<MemoryRouter><PageIntro page="skills" /></MemoryRouter>);

    for (const step of PAGE_INTROS.skills.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  /**
   * Hiding is a decision about the app, not about one page. Six blocks put away one at a time is a
   * chore, and somebody who wants one gone usually wants the rest gone too.
   */
  it('hides every page at once, not just the one that was dismissed', () => {
    render(
      <MemoryRouter>
        <PageIntro page="matches" />
        <PageIntro page="health" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Skjul' })[0]);

    expect(screen.queryByText(PAGE_INTROS.matches.intro)).not.toBeInTheDocument();
    expect(screen.queryByText(PAGE_INTROS.health.intro)).not.toBeInTheDocument();
  });

  /**
   * The way back, without knowing where the setting lives. Somebody who switched this off in week
   * one and wants it in week six should not have to guess that the answer is the hamburger menu.
   */
  it('leaves a button on the page that brings the help back', () => {
    render(<MemoryRouter><PageIntro page="consultants" /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Skjul' }));
    expect(screen.queryByText(PAGE_INTROS.consultants.intro)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Om denne siden' }));

    expect(screen.getByText(PAGE_INTROS.consultants.intro)).toBeInTheDocument();
  });

  it('can be switched both ways from the menu', () => {
    renderWithHeader('stats');

    openMenu();
    fireEvent.click(menuItem());
    expect(screen.queryByText(PAGE_INTROS.stats.intro)).not.toBeInTheDocument();

    openMenu();
    fireEvent.click(menuItem());
    expect(screen.getByText(PAGE_INTROS.stats.intro)).toBeInTheDocument();
  });

  /** So the choice survives a reload, which is the whole point of storing it. */
  it('reads the stored choice on first render', () => {
    localStorage.setItem('pageIntrosHidden', '1');

    render(<MemoryRouter><PageIntro page="cvScore" /></MemoryRouter>);

    expect(screen.queryByText(PAGE_INTROS.cvScore.intro)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Om denne siden' })).toBeInTheDocument();
  });

  /**
   * Three is the cap, and it is a real cap: a fourth bullet is the point where this stops being an
   * introduction and starts being documentation nobody reads.
   */
  it('keeps every page to an intro and at most three steps', () => {
    for (const [page, content] of Object.entries(PAGE_INTROS)) {
      expect(content.intro.length, page).toBeGreaterThan(40);
      expect(content.steps.length, page).toBeGreaterThan(0);
      expect(content.steps.length, page).toBeLessThanOrEqual(3);
      for (const step of content.steps) {
        expect(step.trim(), page).toBe(step);
        expect(step.length, `${page}: ${step}`).toBeLessThan(160);
      }
    }
  });
});
