import { describe, it, expect } from 'vitest';
import { createAppTheme } from './theme';

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
