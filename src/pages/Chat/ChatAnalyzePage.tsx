import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, Typography, TextField, Button, Paper, CircularProgress, Stack, 
  Box, Fade, Chip, useTheme, useMediaQuery 
} from '@mui/material';
import { Send as SendIcon, SmartToy as AiIcon, Person as PersonIcon } from '@mui/icons-material';
import { analyzeContent } from '../../services/chatService';

interface ChatMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const ChatAnalyzePage: React.FC = () => {
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const onAnalyze = async () => {
    if (!content.trim() || loading) return;
    
    const questionId = Date.now().toString();
    const answerIdTemp = questionId + '_answer';
    
    // Add question message
    const questionMessage: ChatMessage = {
      id: questionId,
      type: 'question',
      content: content.trim(),
      timestamp: new Date()
    };
    
    // Add loading answer message
    const loadingMessage: ChatMessage = {
      id: answerIdTemp,
      type: 'answer', 
      content: '',
      timestamp: new Date(),
      loading: true
    };
    
    setMessages(prev => [questionMessage, loadingMessage, ...prev]);
    setContent(''); // Clear input
    setLoading(true);
    
    try {
      const res = await analyzeContent({ content: content.trim() });
      
      // Replace loading message with actual answer
      const answerMessage: ChatMessage = {
        id: answerIdTemp,
        type: 'answer',
        content: res.content ?? 'Ingen respons mottatt fra AI.',
        timestamp: new Date(),
        loading: false
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === answerIdTemp ? answerMessage : msg
      ));
    } catch (error) {
      // Replace loading message with error
      const errorMessage: ChatMessage = {
        id: answerIdTemp,
        type: 'answer',
        content: 'Feil ved AI-analyse. Prøv igjen senere.',
        timestamp: new Date(),
        loading: false
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === answerIdTemp ? errorMessage : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAnalyze();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isQuestion = message.type === 'question';
    
    return (
      <Fade in={true} timeout={300}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isQuestion ? 'flex-end' : 'flex-start',
            mb: 2,
            alignItems: 'flex-start'
          }}
        >
          {!isQuestion && (
            <Box sx={{ mr: 1, mt: 0.5 }}>
              <AiIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
          )}
          
          <Box
            sx={{
              maxWidth: isMobile ? '85%' : '70%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isQuestion ? 'flex-end' : 'flex-start'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: isQuestion ? 'primary.main' : 'grey.100',
                color: isQuestion ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
                borderTopRightRadius: isQuestion ? 0.5 : 2,
                borderTopLeftRadius: isQuestion ? 2 : 0.5,
                position: 'relative',
                wordBreak: 'break-word'
              }}
            >
              {message.loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Kontakter AI, venter på svar...
                  </Typography>
                </Box>
              ) : (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  {message.content}
                </Typography>
              )}
            </Paper>
            
            <Chip
              label={formatTimestamp(message.timestamp)}
              size="small"
              variant="outlined"
              sx={{
                mt: 0.5,
                height: 20,
                fontSize: '0.7rem',
                opacity: 0.7
              }}
            />
          </Box>
          
          {isQuestion && (
            <Box sx={{ ml: 1, mt: 0.5 }}>
              <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
          )}
        </Box>
      </Fade>
    );
  };

  return (
    <Container sx={{ py: isMobile ? 2 : 4, height: '100vh', display: 'flex', flexDirection: 'column' }} maxWidth="md">
      <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        AI Chat Analyse
      </Typography>
      
      {/* Input Section */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <TextField 
          label="Skriv din tekst for AI-analyse" 
          multiline 
          minRows={isMobile ? 3 : 4} 
          maxRows={isMobile ? 6 : 8}
          fullWidth 
          value={content} 
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="F.eks: Kan du analysere denne CV-teksten og gi meg et sammendrag?"
          disabled={loading}
        />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }} justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {content.length} tegn • Trykk Enter for å sende
          </Typography>
          <Button 
            variant="contained" 
            onClick={onAnalyze} 
            disabled={loading || !content.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            sx={{ minWidth: 100 }}
          >
            {loading ? 'Sender...' : 'Analyser'}
          </Button>
        </Stack>
      </Paper>

      {/* Chat Messages Area */}
      <Paper 
        elevation={1} 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'grey.50', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 300
        }}
      >
        {messages.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              flexDirection: 'column',
              gap: 2,
              p: 4
            }}
          >
            <AiIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" textAlign="center">
              Start en samtale med AI
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
              Skriv inn tekst du vil at AI skal analysere, som CV-tekster, jobbeskrivelser eller annet innhold.
            </Typography>
          </Box>
        ) : (
          <Box
            ref={chatContainerRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column-reverse' // Latest messages at top
            }}
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ChatAnalyzePage;
