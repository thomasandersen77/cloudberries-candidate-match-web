import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import { getToken } from '../services/authService';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const token = getToken();
  const publicPaths = new Set<string>(['/login', '/health']);
  const isPublic = publicPaths.has(location.pathname);

  if (!token && !isPublic) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Header />
      <Box sx={{ px: 2, py: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
