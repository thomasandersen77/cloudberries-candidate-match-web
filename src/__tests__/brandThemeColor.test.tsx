import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';
import { ColorModeProvider, palettes } from '../theme';

vi.mock('../services/healthService', () => ({
  getHealthStatus: vi.fn().mockResolvedValue({ status: 'UP', details: {} }),
}));

/**
 * A working localStorage, because this runner does not have one: `globalThis.localStorage` is a
 * bare object whose every method throws. The provider survives that by design, but the remembered
 * skin cannot be controlled without somewhere to remember it. Same helper as PageIntro.test.tsx.
 */
const memoryStorage = () => {
  const entries = new Map<string, string>();
  return {
    getItem: (k: string) => entries.get(k) ?? null,
    setItem: (k: string, v: string) => { entries.set(k, String(v)); },
    removeItem: (k: string) => { entries.delete(k); },
    clear: () => entries.clear(),
    key: (i: number) => [...entries.keys()][i] ?? null,
    get length() { return entries.size; },
  } as Storage;
};

const themeColor = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content;

const renderApp = () =>
  render(
    <ColorModeProvider>
      <MemoryRouter><Header /></MemoryRouter>
    </ColorModeProvider>,
  );

const switchTo = (look: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'meny' }));
  fireEvent.click(screen.getByRole('menuitem', { name: look }));
};

/**
 * The colour the browser paints its own toolbar with follows the skin.
 *
 * index.html carried Cloudberries' orange as a constant, so with the Sopra Steria skin on, a phone
 * framed a blue page in orange. These cases pin the wiring rather than the hex: the value comes
 * from `palettes`, and it changes when somebody changes the look.
 */
describe('theme-color follows the brand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A fresh store per case, so one case's chosen skin is not the next one's starting point.
    vi.stubGlobal('localStorage', memoryStorage());
    document.head.querySelector('meta[name="theme-color"]')?.remove();
  });

  it('paints the browser chrome in the starting skin, creating the tag when the document has none', () => {
    renderApp();

    expect(themeColor()).toBe(palettes.soprasteria.primary);
  });

  it('follows the switch in the menu, both ways', () => {
    renderApp();

    switchTo('Cloudberries look');
    expect(themeColor()).toBe(palettes.cloudberries.primary);

    switchTo('Sopra Steria look');
    expect(themeColor()).toBe(palettes.soprasteria.primary);
  });

  it('writes into the tag index.html already has, rather than adding a second one', () => {
    const existing = Object.assign(document.createElement('meta'), { name: 'theme-color', content: '#000000' });
    document.head.appendChild(existing);

    renderApp();

    expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(existing.content).toBe(palettes.soprasteria.primary);
  });

  /** The two brands must differ, or the cases above would pass on a single hardcoded colour. */
  it('has a different colour per skin', () => {
    expect(palettes.cloudberries.primary).not.toBe(palettes.soprasteria.primary);
  });
});
