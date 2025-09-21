import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Paper, CircularProgress, Stack } from '@mui/material';
import { analyzeContent } from '../../services/chatService';

const ChatAnalyzePage: React.FC = () => {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onAnalyze = async () => {
    try {
      setLoading(true);
      setResult('');
      const res = await analyzeContent({ content });
      setResult(res.content ?? '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Chat Analyze</Typography>
      <Paper sx={{ p: 2 }}>
        <TextField label="Tekst" multiline minRows={4} fullWidth value={content} onChange={(e) => setContent(e.target.value)} />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Button variant="contained" onClick={onAnalyze} disabled={loading || !content.trim()}>
            {loading ? 'Analyserer...' : 'Analyser'}
          </Button>
          {loading && <CircularProgress size={20} />}
        </Stack>
      </Paper>
      {(result && !loading) && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">Resultat</Typography>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result}</pre>
        </Paper>
      )}
    </Container>
  );
};

export default ChatAnalyzePage;