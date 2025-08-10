import {Box, createTheme, CssBaseline, ThemeProvider} from '@mui/material';
import CandidateListPage from './pages/CandidateListPage';

const theme = createTheme({
    typography: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                minHeight: '100vh'
            }}>
                <Box sx={{
                    width: '100%',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <CandidateListPage/>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;
