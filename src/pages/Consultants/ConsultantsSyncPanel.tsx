import React, { useState } from 'react';
import { Paper, Stack, TextField, Button, Typography } from '@mui/material';
import { runConsultantSync } from '../../services/consultantsService';

const ConsultantsSyncPanel: React.FC = () => {
  const [batchSize, setBatchSize] = useState<number>(100);
  const [result, setResult] = useState<any>(null);

  const onRun = async () => {
    const res = await runConsultantSync(batchSize);
    setResult(res);
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6">Synkroniser konsulenter</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
        <TextField label="Batch size" type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} size="small" />
        <Button variant="contained" onClick={onRun}>Kjør</Button>
      </Stack>
      {result && (
        <pre style={{ marginTop: 12 }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </Paper>
  );
};

export default ConsultantsSyncPanel;