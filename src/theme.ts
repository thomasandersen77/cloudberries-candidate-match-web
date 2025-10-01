import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#D32F2F' }, // red
    secondary: { main: '#1976D2' }, // blue
    success: { main: '#2E7D32' }, // green (buttons)
    background: { default: '#F5F9FF', paper: '#FFFFFF' }, // light blue background, white surfaces
    text: { primary: '#111111', secondary: '#555555' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid #eee' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { backgroundColor: '#fafafa' },
      },
    },
    MuiButton: {
      defaultProps: {
        color: 'success',
      },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
});

export default theme;
