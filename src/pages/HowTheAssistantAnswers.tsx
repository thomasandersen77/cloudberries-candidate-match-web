import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Paper, Stack, Typography } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';

/**
 * How the assistant arrives at an answer, in three steps and without the acronym.
 *
 * The pattern is retrieval-augmented generation, and naming it explains nothing to the person
 * deciding whether to trust what they just read. What they need to know is the order of events:
 * the database is consulted first, only what it returned is sent on, and the model writes the
 * sentence rather than supplying the facts in it.
 *
 * It sits under the assistant card because that is the claim the card makes — "svarene bygger på
 * databasen" — and this is the part that says why that is more than a promise.
 */
const STEPS = [
  {
    title: 'Vi slår opp først',
    body: 'Spørsmålet går til vår egen database før noe annet skjer: CV-ene fra Flowcase og avropene som er lastet opp. Ingen AI er involvert ennå.',
    Icon: SearchOutlinedIcon,
  },
  {
    title: 'AI-en får bare det vi fant',
    body: 'Treffene sendes til AI-modellen sammen med spørsmålet. Den får ikke resten av basen, og den blir bedt om å holde seg til det den har fått.',
    Icon: AutoAwesomeOutlinedIcon,
  },
  {
    title: 'Svaret peker tilbake',
    body: 'Modellen formulerer svaret, men dataene bestemmer innholdet. Hver påstand viser hvilken CV eller hvilket avrop den kommer fra, og finner oppslaget ingenting, sier assistenten det i stedet for å gjette.',
    Icon: FactCheckOutlinedIcon,
  },
];

const HowTheAssistantAnswers: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        p: { xs: 2, md: 2.5 },
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? alpha('#fff', 0.02) : alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 650, mb: 0.5 }}>
        Hvordan assistenten kommer fram til svaret
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
        Den kombinerer våre egne data med en AI-modell, i den rekkefølgen. Modellen kjenner ikke
        konsulentene våre; den får dem utlevert for hvert spørsmål.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 2.5 }}>
        {STEPS.map(({ title, body, Icon }, index) => (
          <Stack key={title} direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.1),
              }}
              aria-hidden
            >
              <Icon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 650, mb: 0.25 }}>
                {index + 1}. {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {body}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};

export default HowTheAssistantAnswers;
