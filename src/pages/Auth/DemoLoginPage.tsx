import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Typography, 
  Alert,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import { demoLogin } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Warning, Code } from '@mui/icons-material';

const DemoLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await demoLogin();
      setSuccess(true);
      // Navigate after a brief success message
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Demo login failed:', err);
      setError('Demo login failed. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>
                <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
                Demo Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Database-free authentication for development and testing
              </Typography>
            </Box>

            {/* Status Indicators */}
            <Stack direction="row" spacing={1} justifyContent="center">
              <Chip 
                icon={<Warning />} 
                label="No Database Required" 
                color="warning" 
                variant="outlined" 
                size="small"
              />
              <Chip 
                label="Development Mode" 
                color="info" 
                variant="outlined" 
                size="small"
              />
            </Stack>

            {/* Info Box */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Demo Login</strong> generates a JWT token without requiring database connectivity. 
                This allows you to access all pages and test the frontend functionality even when the database is not available.
              </Typography>
            </Alert>

            {/* Success Message */}
            {success && (
              <Alert severity="success" icon={<CheckCircle />}>
                Demo login successful! Redirecting to dashboard...
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert severity="error">
                {error}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Make sure the backend is running and the <code>/api/auth/demo</code> endpoint is available.
                </Typography>
              </Alert>
            )}

            {/* Login Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleDemoLogin}
              disabled={loading || success}
              sx={{ 
                mt: 3,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Authenticating...
                </>
              ) : success ? (
                'Login Successful!'
              ) : (
                'Login with Demo Token'
              )}
            </Button>

            {/* Additional Info */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Backend endpoint: <code>POST /api/auth/demo</code>
              </Typography>
            </Box>

            {/* Regular Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Button 
                variant="text" 
                onClick={() => navigate('/login')}
                size="small"
              >
                Use Regular Login Instead
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default DemoLoginPage;