import React from 'react';
import {Box} from '@mui/material';
import {Outlet} from 'react-router-dom';
import Header from '../components/Header';

const AppLayout: React.FC = () => {
    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100vh',
                bgcolor: 'background.default',
                color: 'text.primary',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Header />
            <Box
                component="main"
                sx={{
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, md: 4 },
                    maxWidth: 1280,
                    mx: 'auto',
                    width: '100%',
                    flex: 1,
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default AppLayout;
