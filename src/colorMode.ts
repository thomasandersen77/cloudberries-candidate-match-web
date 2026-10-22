import React from 'react';
import type { BrandTheme, ColorMode } from './themeTokens';

export type ThemeContextValue = {
  mode: ColorMode;
  brandTheme: BrandTheme;
  toggle: () => void;
  setBrandTheme: (theme: BrandTheme) => void;
};

export const ColorModeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function useColorMode() {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
}
