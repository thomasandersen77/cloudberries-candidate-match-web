import React from 'react';
import { Box, Typography } from '@mui/material';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 2,
      mb: 2
    }}>
      <Box>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          flexShrink: 0
        }}>
          {action}
        </Box>
      )}
    </Box>
  );
}