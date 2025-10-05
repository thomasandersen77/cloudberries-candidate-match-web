import React from 'react';
import {
  Backdrop,
  Box,
  CircularProgress,
  Typography,
  Paper,
  Stack,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Psychology as AiIcon, Timer as TimerIcon } from '@mui/icons-material';

interface ScoringOverlayProps {
  open: boolean;
  title?: string;
  message?: string;
  progress?: number;
  estimatedTime?: string;
}

const ScoringOverlay: React.FC<ScoringOverlayProps> = ({
  open,
  title = "Scorer alle konsulenter via AI",
  message = "Dette kan ta tid - AI analyserer alle CV-er for å gi kvalitetsscore",
  progress,
  estimatedTime = "1-3 minutter"
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme.zIndex.modal + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}
      open={open}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: isMobile ? '90vw' : 400,
          width: '100%',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[20]
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* AI Icon with animation */}
          <Box sx={{ position: 'relative' }}>
            <AiIcon
              sx={{
                fontSize: 64,
                color: 'primary.main',
                animation: 'pulse 2s infinite'
              }}
            />
            <CircularProgress
              size={80}
              thickness={2}
              sx={{
                position: 'absolute',
                top: -8,
                left: -8,
                color: 'primary.light'
              }}
            />
          </Box>

          {/* Title */}
          <Typography variant="h5" gutterBottom color="text.primary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>

          {/* Message */}
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              maxWidth: 320,
              lineHeight: 1.6,
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}
          >
            {message}
          </Typography>

          {/* Progress Bar (if progress is provided) */}
          {progress !== undefined && (
            <Box sx={{ width: '100%' }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4
                  }
                }} 
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {Math.round(progress)}% fullført
              </Typography>
            </Box>
          )}

          {/* Estimated Time */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <TimerIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Estimert tid: {estimatedTime}
            </Typography>
          </Stack>

          {/* Helpful tip */}
          <Box 
            sx={{ 
              bgcolor: 'info.50', 
              border: '1px solid',
              borderColor: 'info.200',
              borderRadius: 2, 
              p: 2, 
              mt: 2 
            }}
          >
            <Typography variant="caption" color="info.main" sx={{ fontWeight: 500 }}>
              💡 Du kan la denne siden være åpen. Scoringen fortsetter i bakgrunnen.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <style>
        {`
          @keyframes pulse {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.05);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </Backdrop>
  );
};

export default ScoringOverlay;