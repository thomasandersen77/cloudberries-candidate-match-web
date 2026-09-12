import { describe, it, expect } from 'vitest';
import { createAppTheme, palettes } from './theme';

/** Relative luminance per WCAG, so the assertions below are the same number a checker reports. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Tooltip text has to come from the tooltip, not from the page.
 *
 * A tooltip paints its own dark ground in both colour modes. Typography sets `color: text.primary`
 * on itself, so a tooltip built out of Typography elements ignored the white the tooltip had
 * already set on them: in dark mode text.primary is light and it looked right by accident, and in
 * light mode it is #4B5563, dark slate grey on the tooltip's dark grey. That is what made the
 * health popover in the header close to unreadable.
 *
 * This pins the rule, not the rendering. jsdom resolves a computed colour without applying
 * emotion's descendant selector, so a render test here would report text.primary whether the
 * override existed or not; the cascade was checked in a browser in both modes instead.
 */
describe('createAppTheme', () => {
  it.each(['light', 'dark'] as const)('lets tooltip content inherit the tooltip colour in %s mode', mode => {
    const theme = createAppTheme(mode, 'soprasteria');

    expect(theme.components?.MuiTooltip?.styleOverrides?.tooltip).toMatchObject({
      '& .MuiTypography-root': { color: 'inherit' }
    });
  });

  /** Both brands and both modes, since the rule is about the tooltip's ground, not the palette. */
  it('applies the same rule to the other brand', () => {
    const theme = createAppTheme('light', 'cloudberries');

    expect(theme.components?.MuiTooltip?.styleOverrides?.tooltip).toMatchObject({
      '& .MuiTypography-root': { color: 'inherit' }
    });
  });
});

/**
 * Dark mode has to separate a card from the ground it sits on, and near black that takes more than
 * the same ratio light mode gets away with.
 *
 * The cards were #111214 on #0B0B0C and #171D24 on #0F1318: contrasts of 1.05 and 1.10, the same
 * step light mode has between its white card and its near-white ground. It reads there and not
 * here, because perceived lightness is compressed at the dark end, and the dashboard's cards
 * looked painted on.
 */
describe('dark palette separation', () => {
  const brands = ['cloudberries', 'soprasteria'] as const;

  it.each(brands)('%s lifts a card clear of the background', brand => {
    const { bg, paper } = palettes[brand].dark;

    expect(contrast(bg, paper)).toBeGreaterThan(1.2);
  });

  it.each(brands)('%s keeps the card edge visible against the card', brand => {
    const { paper, border } = palettes[brand].dark;

    expect(contrast(paper, border)).toBeGreaterThan(1.25);
  });

  /**
   * A brand colour is chosen against white. Sopra Steria's #0056B3 measured 2.8 against the dark
   * ground and 2.1 on a card, which is what made the Superbruker link hard to find; it has a
   * lighter foreground colour in dark mode. Filled buttons still use the brand colour, where it is
   * the background rather than the text.
   */
  it.each(brands)('%s uses a link colour that clears AA on the dark ground', brand => {
    const { bg, paper, primaryText } = palettes[brand].dark;

    expect(contrast(primaryText, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(primaryText, paper)).toBeGreaterThanOrEqual(4.5);
  });

  /** In light mode the brand colour is already the right foreground, and stays it. */
  it.each(brands)('%s leaves the light-mode brand colour alone', brand => {
    expect(palettes[brand].light.primaryText).toBe(palettes[brand].primary);
  });
});
