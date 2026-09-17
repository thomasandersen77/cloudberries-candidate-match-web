import React, { useId, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, Collapse, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
 * It sits inside the assistant card because that is the claim the card makes — "svarene bygger på
 * databasen" — and this is the part that says why that is more than a promise. It was a box of its
 * own underneath for one afternoon, which read as a separate module rather than as the assistant
 * explaining itself.
 *
 * Two sentences here used to promise more than the backend delivers, and a text that exists to earn
 * trust has to be true in exactly the details it uses to earn it:
 *
 *  - "Ingen AI er involvert ennå" was false for a semantic lookup. The question is embedded by
 *    gemini-embedding-001 before the vector search: one request logged "Query embedding dimension:
 *    768" and "Found 5 semantic matches" before the answering model saw anything. The lookup is
 *    free of the *answering* model, not of models.
 *  - "Hver påstand viser hvilken CV eller hvilket avrop den kommer fra" promised claim-level
 *    provenance. SourceReferenceGuard.enforce removes cited labels that were not in the turn's
 *    allowed set and returns the answer untouched when it removed nothing; it never requires a
 *    claim to carry a source. What it does guarantee is worth saying instead, because it is
 *    concrete: a source you can see is a source that was really in the lookup.
 *
 * The third step says the reference is removed and the answer marked, not that the content goes.
 * An earlier draft said "fjernes det før du ser svaret", which reads as unsupported text being
 * taken out. It is not: enforce() strips the label and appends a note saying the claims that leaned
 * on it were not checked against the database. The sentence itself stays, and a reader who thought
 * otherwise would trust it more than they should.
 *
 * The steps also apply to the "Interne data" mode only. ChatAssistantService branches on
 * ChatScope.GENERAL before grounding is touched, so the caveat belongs where the steps are, not
 * only in the card's own description above them.
 *
 * Two places show it, and they are not the same job:
 *
 *  - On the front page it is folded behind "Hvordan fungerer dette?" and opens on request. Open,
 *    it pushed the first module card to 2290 px on a 390 px phone, almost three screens down, so a
 *    reader on a phone saw an assistant and nothing else. `e2e/home.spec.ts` measures this.
 *  - On the assistant page it stands open under the composer, because that is where somebody is
 *    about to decide whether to trust an answer.
 *
 * Deliberately not tied to `pageIntrosHidden`. That switch is the page's help about itself, "Slik
 * bruker du siden", and an experienced reader turns it off for the whole app. This is the
 * assistant's claim about why its answers can be trusted, which is the basis for believing one and
 * must not disappear with the page help. Same Collapse, same button style, its own state.
 */
const STEPS = [
  {
    title: 'Vi slår opp først',
    body: 'Spørsmålet går til vår egen database før noe annet skjer: CV-ene fra Flowcase og avropene som er lastet opp. Selve søket kan bruke AI til å finne innhold som ligner, men svaret er ikke skrevet ennå.',
    Icon: SearchOutlinedIcon,
  },
  {
    title: 'AI-en får bare det vi fant',
    body: 'Treffene sendes til AI-modellen sammen med spørsmålet. Den får ikke resten av basen, og den blir bedt om å holde seg til det den har fått.',
    Icon: AutoAwesomeOutlinedIcon,
  },
  {
    title: 'Svaret peker tilbake',
    body: 'Modellen formulerer svaret, men dataene bestemmer innholdet. Kildene følger med, så du kan kontrollere det mot CV-en eller avropet. Viser svaret til en kilde som ikke var i oppslaget, fjernes referansen og svaret merkes med at påstanden ikke er kontrollert. Finner oppslaget ingenting, sier assistenten det i stedet for å gjette.',
    Icon: FactCheckOutlinedIcon,
  },
];

const HowTheAssistantAnswers: React.FC<{
  /** Folded behind a link until asked for. The front page; the assistant page shows it open. */
  collapsible?: boolean;
}> = ({ collapsible = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [open, setOpen] = useState(!collapsible);
  const regionId = useId();

  const explanation = (
    <Box id={regionId}>
      <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 650, mb: 0.5 }}>
        Hvordan assistenten kommer fram til svaret
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
        Den kombinerer våre egne data med en AI-modell, i den rekkefølgen. Modellen kjenner ikke
        konsulentene våre; den får dem utlevert for hvert spørsmål. Slik er det når du spør med
        Interne data. Velger du Generell AI, svarer modellen på egen hånd, uten å hente noe fra
        basen.
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
    </Box>
  );

  return (
    <Box
      sx={{
        mb: collapsible ? { xs: 1, sm: 2 } : 3,
        pt: collapsible ? { xs: 1, sm: 1.5 } : 2.5,
        borderTop: `1px solid ${alpha(theme.palette.divider, isDark ? 1 : 0.8)}`,
      }}
    >
      {collapsible ? (
        <>
          {/*
            A text button rather than a "?" icon: it says what it opens, and it is tall enough to
            press on a phone. MUI's small IconButton is 40 px and small Button around 30; both are
            under the 44 px a thumb needs, so the button gets the height on xs.
          */}
          <Button
            size="small"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => setOpen(current => !current)}
            endIcon={
              <ExpandMoreIcon
                sx={{ fontSize: 18, transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }}
              />
            }
            sx={{ textTransform: 'none', ml: -1, minHeight: { xs: 44, sm: 'auto' } }}
          >
            Hvordan fungerer dette?
          </Button>
          {/* unmountOnExit: the folded steps are not read out, or found by a search, while invisible. */}
          <Collapse in={open} unmountOnExit>
            <Box sx={{ mt: 1.5 }}>{explanation}</Box>
          </Collapse>
        </>
      ) : (
        explanation
      )}
    </Box>
  );
};

export default HowTheAssistantAnswers;
