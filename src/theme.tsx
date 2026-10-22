import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createAppTheme, palettes, type BrandTheme, type ColorMode } from './themeTokens';
import { ColorModeContext } from './colorMode';

const MODE_STORAGE_KEY = 'color-mode';
const BRAND_STORAGE_KEY = 'brand-theme';

/**
 * The remembered choice, or null when there is nowhere to remember it.
 *
 * The write was already guarded; the read was not, and it is the one that runs during render. A
 * browser with site data blocked, and a test environment without a Storage implementation, both
 * make window.localStorage.getItem throw, and a throw here takes the whole application down before
 * anything is painted. A forgotten preference is the right way to fail.
 */
function remembered(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * The browser's own chrome, painted in the skin's colour.
 *
 * `theme-color` tints the toolbar around the page on a phone, and it sat in index.html as
 * Cloudberries' orange whatever skin was on: the browser framed a Sopra Steria page in another
 * company's colour. It follows [palettes] now, from the same effect that records the skin.
 *
 * The tag is created when the document has none, so the rule holds in a test renderer as well as
 * in the real index.html, and a document without a head (there is none in practice) is left alone
 * rather than throwing during render.
 */
function applyBrandThemeColor(brandTheme: BrandTheme): void {
  const head = document.head;
  if (!head) return;
  const existing = head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const meta = existing ?? head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
  meta.content = palettes[brandTheme].primary;
}

export const ColorModeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = React.useState<ColorMode>(() => {
    const saved = remembered(MODE_STORAGE_KEY) as ColorMode | null;
    return saved ?? (prefersDark ? 'dark' : 'light');
  });
  const [brandTheme, setBrandTheme] = React.useState<BrandTheme>(() => {
    const saved = remembered(BRAND_STORAGE_KEY) as BrandTheme | null;
    return saved ?? 'soprasteria';
  });

  React.useEffect(() => {
    document.body.dataset.colorMode = mode;
    document.body.dataset.brandTheme = brandTheme;
    applyBrandThemeColor(brandTheme);
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
