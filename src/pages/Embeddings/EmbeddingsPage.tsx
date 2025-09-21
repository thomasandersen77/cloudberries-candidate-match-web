import React, { useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { runJason, runForUserCv, runMissing } from '../../services/embeddingsService';

const EmbeddingsPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [cvId, setCvId] = useState('');
  const [batchSize, setBatchSize] = useState<number>(50);
  const [result, setResult] = useState<any>(null);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Embeddings</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Kjør Jason-demo</Typography>
        <Button variant="contained" sx={{ mt: 1 }} onClick={async () => setResult(await runJason())}>Kjør</Button>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Kjør for User/CV</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} size="small" />
          <TextField label="CV ID" value={cvId} onChange={(e) => setCvId(e.target.value)} size="small" />
          <Button variant="contained" onClick={async () => userId && cvId && setResult(await runForUserCv(userId, cvId))}>
            Kjør
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Kjør for manglende</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <TextField label="Batch size" type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} size="small" />
          <Button variant="contained" onClick={async () => setResult(await runMissing(batchSize))}>Kjør</Button>
        </Stack>
      </Paper>

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Resultat</Typography>
          <Paper sx={{ p: 2 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default EmbeddingsPage;