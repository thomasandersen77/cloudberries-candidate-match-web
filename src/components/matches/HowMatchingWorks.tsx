import React, { useEffect, useId, useState } from 'react';
import { Box, Button, Collapse, Paper, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * The three steps, in the order they run, where the numbers are read.
 *
 * The card showed the preselection first and the AI last, and «dekker 8 av 8 må-krav» read as a
 * conclusion: on 9011 the candidate at the top of the preselection scored 6.0 with the model and
 * was eleventh. The page puts the assessment first; this says why, and what each number is.
 * Open on arrival and foldable, like the page help, but not switched off with it: it qualifies
 * numbers that are on screen.
 */
const HOW_MATCHING_WORKS = [
  {
    title: '1. Forutvalg uten AI-vurdering',
    text: 'Et grovt anslag fra ferdighetslistene, tekstlikhet og CV-score, bare for å velge hvem som vurderes. Rekkefølgen her forutsier vurderingen dårlig; på ett avrop var modellens nummer to forutvalgets nummer femten. Derfor går tjue videre.',
  },
  {
    title: '2. AI-vurdering',
    text: 'Modellen leser et strukturert utdrag av CV-en (ferdigheter, de ti nyeste prosjektene, rollebeskrivelser) og gir en skår per krav og en samlet begrunnelse. Kravmatchen regnes ut av systemet fra kravskårene, må-krav teller dobbelt. Ett modellkall per konsulent, anslått til rundt 2 US-cent.',
  },
  {
    title: '3. Rekkefølge og forslag',
    text: 'Listen sorteres på kravmatch veid mot CV-score med prosenten du velger; når CV-scoren flytter noen, står det hvorfor. Å åpne en lagret vurdering starter ingen ny. Forslag skrives først når du ber om det for én person.',
  },
] as const;

/** Set once the help has been shown in this browser; there are no users to remember it for (plan C3). */
export const HOW_MATCHING_WORKS_SEEN_KEY = 'cm.howMatchingWorks.seen';

function seenBefore(): boolean {
  try { return window.localStorage.getItem(HOW_MATCHING_WORKS_SEEN_KEY) === '1'; } catch { return false; }
}

/**
 * Open the first time this browser shows it, folded after that: a reader who has seen how the
 * numbers are made does not need it above every assessment. Folded or open, it can be toggled.
 */
const HowMatchingWorks: React.FC = () => {
  const [open, setOpen] = useState(() => !seenBefore());
  const id = useId();
  useEffect(() => {
    try { window.localStorage.setItem(HOW_MATCHING_WORKS_SEEN_KEY, '1'); } catch { /* private window: shown open each time */ }
  }, []);
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" component="h2">Slik fungerer matchingen</Typography>
        <Button
          size="small"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          endIcon={<ExpandMoreIcon sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />}
          sx={{ textTransform: 'none' }}
        >
          {open ? 'Skjul' : 'Vis'}
        </Button>
      </Stack>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Stack id={id} direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
          {HOW_MATCHING_WORKS.map((step) => (
            <Box key={step.title} sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.title}</Typography>
              <Typography variant="body2" color="text.secondary">{step.text}</Typography>
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default HowMatchingWorks;
