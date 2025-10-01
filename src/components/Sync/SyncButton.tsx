import React from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { Sync, CloudDownload } from '@mui/icons-material';

interface SyncButtonProps {
  loading?: boolean;
  disabled?: boolean;
  variant?: 'all' | 'single';
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
}

const SyncButton: React.FC<SyncButtonProps> = ({
  loading = false,
  disabled = false,
  variant = 'single',
  onClick,
  size = 'medium'
}) => {
  const isAllSync = variant === 'all';
  const buttonText = isAllSync ? 'Hent alle CV-er' : 'Oppdater CV';
  const icon = isAllSync ? <CloudDownload /> : <Sync />;

  return (
    <Tooltip 
      title={
        disabled 
          ? 'Venter på tidligere operasjon' 
          : isAllSync 
            ? 'Henter alle CV-er fra Flowcase' 
            : 'Oppdaterer CV fra Flowcase'
      }
    >
      <span>
        <Button
          data-testid={`sync-button-${isAllSync ? 'all' : 'single'}`}
          variant="outlined"
          color="primary"
          size={size}
          onClick={onClick}
          disabled={disabled || loading}
          startIcon={loading ? <CircularProgress size={16} /> : icon}
          sx={{
            textTransform: 'none',
            fontWeight: 'medium',
            borderRadius: 2,
            ...(loading && {
              '& .MuiButton-startIcon': {
                marginRight: 1
              }
            })
          }}
        >
          {loading ? (isAllSync ? 'Henter...' : 'Oppdaterer...') : buttonText}
        </Button>
      </span>
    </Tooltip>
  );
};

export default SyncButton;