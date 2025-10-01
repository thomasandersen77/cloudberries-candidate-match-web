import React, { useState } from 'react';
import { Box, Container, Paper, Tab, Tabs } from '@mui/material';
import ChatAnalyzePage from './ChatAnalyzePage';
import ChatSearchTab from './ChatSearchTab';

const TAB_KEY = 'chat.selectedTab';

const ChatPage: React.FC = () => {
  const initialTab = (() => {
    try {
      const saved = sessionStorage.getItem(TAB_KEY);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  })();
  const [tab, setTab] = useState<number>(initialTab);

  const onChange = (_: React.SyntheticEvent, value: number) => {
    setTab(value);
    try { sessionStorage.setItem(TAB_KEY, String(value)); } catch {}
  };

  return (
    <Container sx={{ py: 4 }} maxWidth="lg">
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={onChange}
          aria-label="chat-tabs"
          variant="scrollable"
          scrollButtons="auto"
          data-testid="chat-tabs"
        >
          <Tab label="AI-søk" data-testid="ai-search-tab" />
          <Tab label="Analyser" data-testid="analyze-tab" />
        </Tabs>
      </Paper>

      <Box>
{tab === 0 && <ChatSearchTab />}
        {tab === 1 && <ChatAnalyzePage />}
      </Box>
    </Container>
  );
};

export default ChatPage;