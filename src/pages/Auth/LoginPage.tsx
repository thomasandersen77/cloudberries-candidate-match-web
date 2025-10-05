import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Container, TextField, Typography, Alert } from '@mui/material';
import { login } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch {
      setError('Ugyldig brukernavn eller passord');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>Logg inn</Typography>
          <Box component="form" onSubmit={onSubmit}>
            <TextField
              fullWidth
              label="Brukernavn"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <TextField
              fullWidth
              type="password"
              label="Passord"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Logg inn</Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default LoginPage;