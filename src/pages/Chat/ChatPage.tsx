import React, { useState } from 'react';
import { Box, Container, Paper, Tab, Tabs } from '@mui/material';
import ChatAnalyzePage from './ChatAnalyzePage';
import ChatSearchTab from './ChatSearchTab';

// Bumped when the tabs swapped places. The old key stored an index whose meaning changed, so a
// reader who had last used the assistant would have landed on the search tool, which is precisely
// the opposite of the point. The stale key is removed rather than migrated: it is one click to
// restore, and guessing what an old index meant is worse than forgetting it.
const TAB_KEY = 'chat.selectedTab.assistantFirst';
const LEGACY_TAB_KEY = 'chat.selectedTab';

/**
 * The assistant is the product; the search tab is the operator surface behind it.
 *
 * It used to open on the search tab, which is a diagnostic tool: it asks the reader to choose
 * between STRUCTURED, SEMANTIC, HYBRID and RAG before they have asked anything. A reader should
 * pick what they want to know, not which retrieval engine answers it.
 */
const ASSISTANT_TAB = 0;
const ADVANCED_SEARCH_TAB = 1;

const ChatPage: React.FC = () => {
  const initialTab = (() => {
    try {
      sessionStorage.removeItem(LEGACY_TAB_KEY);
      const saved = sessionStorage.getItem(TAB_KEY);
      return saved ? Number(saved) : ASSISTANT_TAB;
    } catch {
      return ASSISTANT_TAB;
    }
  })();
  const [tab, setTab] = useState<number>(initialTab);

  const onChange = (_: React.SyntheticEvent, value: number) => {
    setTab(value);
    try { 
      sessionStorage.setItem(TAB_KEY, String(value)); 
    } catch {
      // Ignore sessionStorage errors
    }
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
          <Tab label="Assistent" data-testid="analyze-tab" />
          <Tab label="Avansert søk" data-testid="ai-search-tab" />
        </Tabs>
      </Paper>

      <Box>
        {tab === ASSISTANT_TAB && <ChatAnalyzePage />}
        {tab === ADVANCED_SEARCH_TAB && <ChatSearchTab />}
      </Box>
    </Container>
  );
};

export default ChatPage;