import React from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const HomePage: React.FC = () => {
  const links = [
    { to: '/consultants', title: 'Konsulenter', desc: 'Se liste over konsulenter' },
    { to: '/skills', title: 'Ferdigheter', desc: 'Se ferdigheter i firma og tilhørende konsulenter' },
    { to: '/cv-score', title: 'CV-Score', desc: 'Se kandidater og score' },
    { to: '/matches', title: 'Matcher', desc: 'Finn kandidatmatcher' },
    { to: '/embeddings', title: 'Embeddings', desc: 'Kjør embedding-oppgaver' },
    { to: '/project-requests/upload', title: 'Last opp kundeforspørsel', desc: 'Last opp PDF, analyser og lagre i databasen' },
    { to: '/chat', title: 'Chat Analyze', desc: 'Analyser tekst med AI' },
    { to: '/health', title: 'Helse', desc: 'Systemstatus' },
  ];

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>Cloudberries Candidate Match</Typography>
        <Grid container spacing={2}>
          {links.map((l) => (
            <Grid item xs={12} sm={6} md={4} key={l.to}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>{l.title}</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>{l.desc}</Typography>
                  <Button component={RouterLink} to={l.to} variant="contained">Gå til {l.title}</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;