import React from 'react';
import {Box} from '@mui/material';
import {Outlet} from 'react-router-dom';
import Header from '../components/Header';

const AppLayout: React.FC = () => {
    return (
        <Box sx={{width: '100%', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary'}}>
            <Header/>
            <Box sx={{px: 2, py: 2}}>
                <Outlet/>
            </Box>
        </Box>
    );
};

export default AppLayout;
