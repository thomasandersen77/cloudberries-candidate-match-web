import React from 'react';
import { createTheme, type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CssBaseline, ThemeProvider } from '@mui/material';

export type ColorMode = 'light' | 'dark';

const brand = {
  orange: '#F37021',
  orangeHover: '#D85F1B',
  black: '#000000',
  white: '#FFFFFF',
  light: {
    text: '#111111',
    secondaryText: '#555555',
    bg: '#FFFFFF',
    paper: '#FFFFFF',
    divider: '#EDEDED',
    tableHead: '#FAFAFA',
    border: '#EEEEEE',
  },
  dark: {
    text: '#E6E6E6',
    secondaryText: '#B0B3B8',
    bg: '#0B0B0C',
    paper: '#111214',
    divider: '#2A2B2E',
    tableHead: '#16181B',
    border: '#1F2023',
  },
} as const;

export function createAppTheme(mode: ColorMode): Theme {
  const isDark = mode === 'dark';
  const paletteBase = isDark ? brand.dark : brand.light;

  return createTheme({
    palette: {
      mode,
      primary: { main: brand.orange, contrastText: brand.white },
      secondary: { main: isDark ? brand.white : brand.black },
      background: { default: paletteBase.bg, paper: paletteBase.paper },
      text: { primary: paletteBase.text, secondary: paletteBase.secondaryText },
      divider: paletteBase.divider,
      success: { main: '#2E7D32' },
      error: { main: '#D32F2F' },
      warning: { main: '#ED6C02' },
      info: { main: '#0288D1' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h4: { fontWeight: 700 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { border: `1px solid ${paletteBase.border}` },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: { backgroundColor: paletteBase.tableHead },
        },
      },
      MuiButton: {
        defaultProps: {
          color: 'primary',
        },
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: brand.orange,
            '&:hover': { color: brand.orangeHover },
          },
        },
      },
    },
  });
}

export const ColorModeContext = React.createContext<{ mode: ColorMode; toggle: () => void } | undefined>(undefined);

export function useColorMode() {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
}

const STORAGE_KEY = 'color-mode';

export const ColorModeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = React.useState<ColorMode>(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)) as ColorMode | null;
    return saved ?? (prefersDark ? 'dark' : 'light');
  });

  React.useEffect(() => {
    document.body.dataset.colorMode = mode;
    try { window.localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, [mode]);

  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  const value = React.useMemo(() => ({ mode, toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')) }), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
