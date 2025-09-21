import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#FFA726' }, // light orange
    secondary: { main: '#424242' }, // dark grey
    background: { default: '#FFFFFF', paper: '#FFFFFF' }, // white
    text: { primary: '#111111', secondary: '#555555' }, // black + grey
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
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
});

export default theme;