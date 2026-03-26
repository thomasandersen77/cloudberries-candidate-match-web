import React from 'react';
import { alpha, createTheme, type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CssBaseline, ThemeProvider } from '@mui/material';

export type ColorMode = 'light' | 'dark';

/** Design tokens — premium cold SaaS, warm neutrals (see instructions/new_gui.md) */
export const tokens = {
  orange: '#F26A21',
  orangeHover: '#D85F1B',
  black: '#111111',
  white: '#FFFFFF',
  green: '#3AAA35',
  red: '#E53935',
  light: {
    text: '#111111',
    textSecondary: '#5F5F5F',
    bg: '#FAFAF8',
    paper: '#FFFFFF',
    divider: '#ECE7E1',
    tableHead: 'rgba(250, 250, 248, 0.98)',
    border: '#ECE7E1',
    surfaceMuted: '#F5F3EF',
  },
  dark: {
    text: '#E6E6E6',
    textSecondary: '#B0B3B8',
    bg: '#0B0B0C',
    paper: '#111214',
    divider: '#2A2B2E',
    tableHead: '#16181B',
    border: '#1F2023',
    surfaceMuted: '#16181B',
  },
} as const;

const brand = tokens;

export function createAppTheme(mode: ColorMode): Theme {
  const isDark = mode === 'dark';
  const t = isDark ? brand.dark : brand.light;

  return createTheme({
    palette: {
      mode,
      primary: { main: brand.orange, contrastText: brand.white },
      secondary: { main: isDark ? brand.white : brand.black },
      background: { default: t.bg, paper: t.paper },
      text: { primary: t.text, secondary: t.textSecondary },
      divider: t.divider,
      success: { main: brand.green },
      error: { main: brand.red },
      warning: { main: '#ED6C02' },
      info: { main: '#0288D1' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      h3: { fontWeight: 700, letterSpacing: '-0.02em', color: t.text },
      h4: { fontWeight: 700, letterSpacing: '-0.02em', color: t.text },
      h5: { fontWeight: 600, letterSpacing: '-0.01em', color: t.text },
      h6: { fontWeight: 600, color: t.text },
      subtitle1: { fontWeight: 500, color: t.text },
      subtitle2: { fontWeight: 600, color: t.text },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
      caption: { color: t.textSecondary, letterSpacing: '0.02em' },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    transitions: {
      duration: { shortest: 150, shorter: 200, short: 250, standard: 300 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 1px 2px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.25)'
              : '0 1px 2px rgba(17,17,17,0.04), 0 8px 32px rgba(17,17,17,0.06)',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: t.tableHead,
            '& .MuiTableCell-head': {
              borderBottom: `1px solid ${t.divider}`,
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: isDark ? alpha('#fff', 0.04) : alpha('#111111', 0.03),
            },
            '&:last-of-type td, &:last-of-type th': {
              borderBottom: 'none',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: t.textSecondary,
            borderBottom: `1px solid ${t.divider}`,
            paddingTop: 16,
            paddingBottom: 16,
          },
          root: {
            borderBottom: `1px solid ${alpha(t.divider, isDark ? 0.6 : 1)}`,
            paddingTop: 18,
            paddingBottom: 18,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          color: 'primary',
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            paddingInline: 18,
            paddingBlock: 8,
            transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0 4px 14px ${alpha(brand.orange, 0.35)}`,
              backgroundColor: brand.orangeHover,
            },
          },
          outlined: {
            borderColor: t.border,
            '&:hover': {
              borderColor: alpha(brand.orange, 0.45),
              backgroundColor: alpha(brand.orange, isDark ? 0.08 : 0.06),
            },
          },
          outlinedPrimary: {
            borderWidth: 1.5,
            borderColor: alpha(brand.orange, 0.55),
            '&:hover': {
              borderColor: brand.orange,
              backgroundColor: alpha(brand.orange, isDark ? 0.12 : 0.08),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: alpha(brand.orange, isDark ? 0.1 : 0.08),
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? alpha('#fff', 0.03) : alpha('#111111', 0.02),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: t.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(brand.orange, 0.35),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.orange,
              borderWidth: 1.5,
              boxShadow: `0 0 0 3px ${alpha(brand.orange, 0.18)}`,
            },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            color: t.textSecondary,
            '&.Mui-focused': { color: brand.orange },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 26,
            borderColor: alpha(t.text, isDark ? 0.22 : 0.14),
            '&.MuiChip-outlinedDefault': {
              backgroundColor: isDark ? alpha('#fff', 0.04) : alpha('#111111', 0.03),
            },
          },
          sizeSmall: {
            height: 24,
            fontSize: '0.6875rem',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            marginTop: 8,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            boxShadow: isDark
              ? '0 12px 40px rgba(0,0,0,0.45)'
              : '0 12px 40px rgba(17,17,17,0.1)',
            paddingTop: 4,
            paddingBottom: 4,
            minWidth: 220,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginLeft: 6,
            marginRight: 6,
            minHeight: 44,
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: alpha(brand.orange, isDark ? 0.14 : 0.1),
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: alpha(t.text, 0.65),
            transition: 'color 0.15s ease, background-color 0.15s ease',
            '&:hover': {
              color: t.text,
              backgroundColor: alpha(brand.orange, isDark ? 0.12 : 0.08),
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: brand.orange,
            fontWeight: 500,
            '&:hover': { color: brand.orangeHover },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${t.divider}`,
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
