import { Alert, Button, Box } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export default function ErrorState({ 
  message, 
  onRetry, 
  showRetry = true 
}: ErrorStateProps) {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity="error" 
        action={
          showRetry && onRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshIcon />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Prøv igjen
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Box>
  );
}