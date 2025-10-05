import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Fade,
  LinearProgress,
  Chip
} from '@mui/material';
import { CheckCircle, Error, Info } from '@mui/icons-material';

export interface SyncNotification {
  type: 'success' | 'error' | 'info' | 'progress';
  title: string;
  message?: string;
  details?: {
    total?: number;
    succeeded?: number;
    failed?: number;
    processed?: boolean;
  };
}

interface SyncNotificationPanelProps {
  notification: SyncNotification | null;
  onDismiss?: () => void;
}

const SyncNotificationPanel: React.FC<SyncNotificationPanelProps> = ({ 
  notification, 
  onDismiss 
}) => {
  if (!notification) {
    return null;
  }

  const { type, title, message, details } = notification;
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      case 'progress':
        return null;
      default:
        return <Info />;
    }
  };

  const renderDetails = () => {
    if (!details) return null;

    if ('processed' in details) {
      // Single consultant sync
      return (
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={details.processed ? 'Prosessert' : 'Ikke prosessert'} 
            color={details.processed ? 'success' : 'warning'}
            size="small"
          />
        </Box>
      );
    }

    if ('total' in details) {
      // Bulk sync with statistics
      return (
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {details.total && (
            <Chip 
              label={`Totalt: ${details.total}`} 
              variant="outlined" 
              size="small" 
            />
          )}
          {details.succeeded && (
            <Chip 
              label={`Vellykket: ${details.succeeded}`} 
              color="success" 
              size="small" 
            />
          )}
          {details.failed && details.failed > 0 && (
            <Chip 
              label={`Feilet: ${details.failed}`} 
              color="error" 
              size="small" 
            />
          )}
        </Box>
      );
    }

    return null;
  };

  return (
    <Fade in timeout={300}>
      <Box sx={{ mb: 2 }}>
        <Alert 
          severity={type === 'progress' ? 'info' : type}
          onClose={onDismiss}
          icon={getIcon()}
          sx={{ borderRadius: 2 }}
        >
          <AlertTitle>{title}</AlertTitle>
          {message && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {message}
            </Typography>
          )}
          {type === 'progress' && (
            <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
          )}
          {renderDetails()}
        </Alert>
      </Box>
    </Fade>
  );
};

export default SyncNotificationPanel;