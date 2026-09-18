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
import type { ConsultantSyncResponse } from '../../types/api';
import SyncResultSummary from './SyncResultSummary';

export interface SyncNotification {
  type: 'success' | 'error' | 'info' | 'progress';
  title: string;
  message?: string;
  /**
   * Either the one flag a single-consultant sync reports, or the whole response of a full run.
   * The full run used to arrive as three numbers picked out of it, and the rest of what the
   * backend reported (departed, returned, unchanged, the vector refresh) never reached the screen.
   */
  details?: { processed: boolean } | { sync: ConsultantSyncResponse };
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

    return <SyncResultSummary result={details.sync} />;
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