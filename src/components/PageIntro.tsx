import React, { useId, useState } from 'react';
import { Box, Button, Collapse, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { PAGE_INTROS, type PageIntroKey } from '../pages/pageIntros';
import { setPageIntrosHidden, usePageIntrosHidden } from './pageIntroPreference';

/**
 * The same help on every page: a line or two under the title, and the how-to folded away behind it.
 *
 * Deliberately not a card and not an Alert. Those read either as another module on a page that
 * already has several, or as something being wrong, and both push the actual work below the fold.
 * This is the page saying one sentence about itself in secondary text, and then getting out of the
 * way. The steps open on request and start closed, so a page still loads showing the table, the
 * form or the list somebody came for.
 *
 * Turning the help off is a decision about the app, not about one page, so it applies everywhere at
 * once. What stays behind is "Om denne siden", one small button in the same spot on every page:
 * somebody who switched it off in week one and needs it in week six should not have to work out
 * that the way back is in the hamburger menu.
 *
 * Anything about what an action costs or changes belongs next to that action, not in here. This
 * can be switched off; a warning about spending money cannot.
 *
 * Nor does a module's claim about itself belong in here. `HowTheAssistantAnswers` is the assistant
 * saying why its answers can be trusted; it borrows the fold and the button style from this
 * component and keeps its own state, because switching the page help off is a decision about the
 * app, and the basis for believing an answer does not go with it. The rule, for both: page help is
 * visible on arrival, module explanations may fold.
 */
const PageIntro: React.FC<{ page: PageIntroKey }> = ({ page }) => {
  // Open on arrival. They started folded away, on the reasoning that the work surface should be
  // what you see when a page loads; three short lines turned out not to be what was pushing the
  // table down. Somebody who has read them once turns the whole thing off with "Skjul", which is a
  // better trade than making everyone click to find out what a page does.
  const [stepsOpen, setStepsOpen] = useState(true);
  const stepsId = useId();
  const hidden = usePageIntrosHidden();
  const { intro, steps } = PAGE_INTROS[page];

  if (hidden) {
    return (
      <Button
        size="small"
        startIcon={<HelpOutlineIcon sx={{ fontSize: 16 }} />}
        onClick={() => setPageIntrosHidden(false)}
        sx={{ textTransform: 'none', color: 'text.secondary', ml: -1, mb: 2 }}
      >
        Om denne siden
      </Button>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.6 }}>
        {intro}
      </Typography>

      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, ml: -1 }}>
        <Button
          size="small"
          aria-expanded={stepsOpen}
          aria-controls={stepsId}
          onClick={() => setStepsOpen(open => !open)}
          endIcon={
            <ExpandMoreIcon
              sx={{ fontSize: 18, transition: 'transform 150ms', transform: stepsOpen ? 'rotate(180deg)' : 'none' }}
            />
          }
          sx={{ textTransform: 'none' }}
        >
          Slik bruker du siden
        </Button>
        <Button
          size="small"
          onClick={() => setPageIntrosHidden(true)}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Skjul
        </Button>
      </Stack>

      {/* unmountOnExit so the folded steps are not read out, or found by a search, while invisible. */}
      <Collapse in={stepsOpen} unmountOnExit>
        <Box component="ul" id={stepsId} sx={{ m: 0, mt: 0.5, pl: 2.5, maxWidth: 760 }}>
          {steps.map(step => (
            <Typography
              key={step}
              component="li"
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.6, mb: 0.5 }}
            >
              {step}
            </Typography>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default PageIntro;
