import React from 'react';
import { alpha, createTheme, type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CssBaseline, ThemeProvider } from '@mui/material';

export type ColorMode = 'light' | 'dark';
export type BrandTheme = 'cloudberries' | 'soprasteria';

type BrandPalette = {
  name: string;
  primary: string;
  primaryHover: string;
  accent: string;
  success: string;
  red: string;
  light: {
    text: string;
    textSecondary: string;
    bg: string;
    paper: string;
    divider: string;
    tableHead: string;
    border: string;
    surfaceMuted: string;
  };
  dark: {
    text: string;
    textSecondary: string;
    bg: string;
    paper: string;
    divider: string;
    tableHead: string;
    border: string;
    surfaceMuted: string;
  };
};

export const palettes: Record<BrandTheme, BrandPalette> = {
  cloudberries: {
    name: 'Cloudberries',
    primary: '#F26A21',
    primaryHover: '#D85F1B',
    accent: '#111111',
    success: '#3AAA35',
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
  },
  soprasteria: {
    name: 'Sopra Steria',
    primary: '#0056B3',
    primaryHover: '#004A99',
    accent: '#FF6B6B',
    success: '#00B894',
    red: '#FF6B6B',
    light: {
      text: '#212529',
      textSecondary: '#4B5563',
      bg: '#F8F9FA',
      paper: '#FFFFFF',
      divider: '#DDE2E7',
      tableHead: 'rgba(248, 249, 250, 0.98)',
      border: '#DDE2E7',
      surfaceMuted: '#EEF1F4',
    },
    dark: {
      text: '#E9EDF2',
      textSecondary: '#AAB4C0',
      bg: '#0F1318',
      paper: '#171D24',
      divider: '#2A323B',
      tableHead: '#1C242D',
      border: '#2A323B',
      surfaceMuted: '#1C242D',
    },
  },
};

export function createAppTheme(mode: ColorMode, brandTheme: BrandTheme): Theme {
  const isDark = mode === 'dark';
  const brand = palettes[brandTheme];
  const t = isDark ? brand.dark : brand.light;

  return createTheme({
    palette: {
      mode,
      primary: { main: brand.primary, contrastText: '#FFFFFF' },
      secondary: { main: brand.accent },
      background: { default: t.bg, paper: t.paper },
      text: { primary: t.text, secondary: t.textSecondary },
      divider: t.divider,
      success: { main: brand.success },
      error: { main: brand.red },
      warning: { main: '#ED6C02' },
      info: { main: isDark ? '#65D0FF' : '#0288D1' },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily:
        "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      h3: { fontWeight: 700, letterSpacing: '-0.028em', color: t.text },
      h4: { fontWeight: 700, letterSpacing: '-0.025em', color: t.text },
      h5: { fontWeight: 650, letterSpacing: '-0.015em', color: t.text },
      h6: { fontWeight: 650, color: t.text },
      subtitle1: { fontWeight: 500, color: t.text },
      subtitle2: { fontWeight: 600, color: t.text },
      body1: { lineHeight: 1.62 },
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
          ':root': {
            colorScheme: mode,
          },
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            backgroundImage: isDark
              ? `radial-gradient(1200px 500px at 20% -10%, ${alpha(brand.primary, 0.14)}, transparent 65%),
                 radial-gradient(1000px 450px at 100% 0%, ${alpha(brand.accent, 0.2)}, transparent 70%)`
              : `radial-gradient(1200px 500px at 20% -10%, ${alpha(brand.primary, 0.1)}, transparent 65%),
                 radial-gradient(1000px 450px at 100% 0%, ${alpha(brand.accent, 0.08)}, transparent 70%)`,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${t.border}`,
            borderRadius: 18,
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 1px 2px rgba(0,0,0,0.35), 0 16px 48px rgba(0,0,0,0.26)'
              : '0 1px 2px rgba(17,17,17,0.04), 0 16px 46px rgba(17,17,17,0.07)',
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
            borderRadius: 18,
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
              backgroundColor: isDark ? alpha('#fff', 0.04) : alpha(brand.accent, 0.035),
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
            transition:
              'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: `0 8px 20px ${alpha(brand.primary, 0.35)}`,
              backgroundColor: brand.primaryHover,
            },
          },
          outlined: {
            borderColor: t.border,
            '&:hover': {
              borderColor: alpha(brand.primary, 0.45),
              backgroundColor: alpha(brand.primary, isDark ? 0.08 : 0.06),
            },
          },
          outlinedPrimary: {
            borderWidth: 1.5,
            borderColor: alpha(brand.primary, 0.55),
            '&:hover': {
              borderColor: brand.primary,
              backgroundColor: alpha(brand.primary, isDark ? 0.12 : 0.08),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: alpha(brand.primary, isDark ? 0.1 : 0.08),
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
            backgroundColor: isDark ? alpha('#fff', 0.03) : alpha(brand.accent, 0.02),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: t.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(brand.primary, 0.35),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.primary,
              borderWidth: 1.5,
              boxShadow: `0 0 0 3px ${alpha(brand.primary, 0.18)}`,
            },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            color: t.textSecondary,
            '&.Mui-focused': { color: brand.primary },
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
              backgroundColor: isDark ? alpha('#fff', 0.04) : alpha(brand.accent, 0.03),
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
              backgroundColor: alpha(brand.primary, isDark ? 0.14 : 0.1),
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
              backgroundColor: alpha(brand.primary, isDark ? 0.12 : 0.08),
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: brand.primary,
            fontWeight: 500,
            '&:hover': { color: brand.primaryHover },
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

const MODE_STORAGE_KEY = 'color-mode';
const BRAND_STORAGE_KEY = 'brand-theme';

export const ColorModeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = React.useState<ColorMode>(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(MODE_STORAGE_KEY)) as ColorMode | null;
    return saved ?? (prefersDark ? 'dark' : 'light');
  });
  const [brandTheme, setBrandTheme] = React.useState<BrandTheme>(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(BRAND_STORAGE_KEY)) as BrandTheme | null;
    return saved ?? 'soprasteria';
  });

  React.useEffect(() => {
    document.body.dataset.colorMode = mode;
    document.body.dataset.brandTheme = brandTheme;
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
      window.localStorage.setItem(BRAND_STORAGE_KEY, brandTheme);
    } catch {
      // Ignore localStorage limitations in private mode.
    }
  }, [mode, brandTheme]);

  const theme = React.useMemo(() => createAppTheme(mode, brandTheme), [mode, brandTheme]);

  const value = React.useMemo(
    () => ({
      mode,
      brandTheme,
      toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
      setBrandTheme,
    }),
    [mode, brandTheme]
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
