import React from 'react';
import {Box} from '@mui/material';
import {Outlet} from 'react-router-dom';
import Header from '../components/Header';

const AppLayout: React.FC = () => {
    return (
        <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <Header />
            <Box
                sx={{
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 3 },
                    maxWidth: 1280,
                    mx: 'auto',
                    width: '100%',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default AppLayout;
