import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HowTheAssistantAnswers from './HowTheAssistantAnswers';
import { EXAMPLE_QUESTIONS } from './exampleQuestions';

/**
 * The assistant as the way into the application.
 *
 * It was a card among cards, its own heading the same size as theirs, with a hero above it saying
 * most of what the card then said again. Now it carries the page: one sentence on what it answers
 * from, three questions to start with, and the explanation folded to three lines.
 */
const AssistantHero: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${alpha(theme.palette.primary.main, 0.45)}`,
        background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12)} 0%, ${alpha(
          theme.palette.secondary.main,
          isDark ? 0.08 : 0.05
        )} 70%, transparent 100%)`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2 } } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }} alignItems={{ md: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
              <ChatOutlinedIcon aria-hidden sx={{ color: 'primary.main' }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                Assistent
              </Typography>
              <Chip label="Start her" size="small" color="primary" />
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820, lineHeight: 1.55 }}>
              Spør på vanlig norsk om konsulenter, avrop og tidligere vurderinger. Svaret viser kildene
              sine, og står det ikke i basen, sier assistenten det i stedet for å gjette.
            </Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
              {EXAMPLE_QUESTIONS.map(q => (
                <Chip
                  key={q}
                  label={q}
                  component={RouterLink}
                  to={`/chat?q=${encodeURIComponent(q)}`}
                  clickable
                  variant="outlined"
                  sx={{ bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#fff', 0.7) }}
                />
              ))}
            </Stack>
          </Box>
          <Button
            component={RouterLink}
            to="/chat"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{ flexShrink: 0, px: 4, alignSelf: { xs: 'flex-start', md: 'center' } }}
          >
            Åpne assistenten
          </Button>
        </Stack>
        <Box sx={{ mt: 1 }}>
          <HowTheAssistantAnswers collapsible compact />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssistantHero;
