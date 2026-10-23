import { Box, Chip, Paper, Stack, Typography, alpha } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { ProjectRequirementDto } from '../../types/api';

/**
 * The requirements, in full, on the request's own page and on its matching page.
 *
 * They used to be chips. A chip is a short token and does not wrap, so a requirement reading "Det
 * stilles krav til bakgrunnssjekk av kandidaten: verifisering av høyeste utdannelse, siste 10 års
 * erfaring og ID-kontroll" made its column as wide as the sentence. With flex: 1 and no minWidth,
 * a flex item may not shrink below its content, so the Må-krav column grew past its half of the
 * row and pushed Bør-krav off the right edge of the window: on request 8 it started 88 pixels
 * outside it, and six requirements looked like none.
 *
 * The details also sat in a separate list underneath, so a requirement and its own elaboration were
 * two items with nothing tying them together. They are one row here.
 *
 * appliesTo is shown for the supplier's requirements only. The consultant's are what a CV can
 * answer and what a score is about; the supplier's are submission deadlines and framework
 * agreements, and a reader counting competence demands should not have to read all of them to find
 * out which is which. Marking only one side keeps the common case quiet.
 */
export function RequirementList({ title, tone, rows, marks }: {
  title: string;
  /**
   * Which palette entry colours the list. warning for må, info for bør: two hues that stay apart
   * in both brands and both colour modes, where primary and info do not — the blue brand's primary
   * is a blue, and the orange brand's is an orange.
   */
  tone: 'warning' | 'info' | 'neutral';
  rows: ProjectRequirementDto[];
  /**
   * A mark per row, in place of «Leverandør»: the supplier's own list says «Må» or «Bør» on each,
   * since being in that list already says whose they are.
   */
  marks?: (string | null)[];
}) {
  // Neutral is the supplier's list: requirements nobody's CV is assessed against.
  const color = (theme: Theme) => (tone === 'neutral' ? theme.palette.text.secondary : theme.palette[tone].main);
  return (
    <Paper sx={{ p: 1.5, flex: 1, minWidth: 0, alignSelf: 'stretch' }}>
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={(theme) => ({ color: color(theme), fontWeight: 600 })}
      >
        {title}{rows.length > 0 && ` (${rows.length})`}
      </Typography>
      {rows.length > 0 ? (
        <Stack component="ul" spacing={1} sx={{ listStyle: 'none', pl: 0, m: 0 }}>
          {rows.map((r, i) => (
            <Box
              component="li"
              key={i}
              sx={{
                px: 1.25,
                py: 0.875,
                borderRadius: 1,
                // A tint rather than a fill: these are paragraphs, and text on a saturated ground
                // is harder to read the longer it gets. The bar on the left is what actually
                // separates one requirement from the next.
                borderLeft: 3,
                borderColor: (theme) => color(theme),
                bgcolor: (theme) => alpha(color(theme), theme.palette.mode === 'dark' ? 0.16 : 0.08)
              }}
            >
              <Typography
                variant="body2"
                // A div, not the default p: the supplier chip inside is a div, and a div in a p is
                // invalid HTML that React reports on every request page.
                component="div"
                // anywhere rather than break-word: a reference like "20250001)" is one long token
                // and would otherwise widen the column on its own.
                sx={{ overflowWrap: 'anywhere' }}
              >
                {r.name}
                {(marks ? marks[i] : r.appliesTo === 'SUPPLIER' ? 'Leverandør' : null) && (
                  <Chip
                    label={marks ? marks[i] : 'Leverandør'}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 0.75, height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Typography>
              {r.details && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25, overflowWrap: 'anywhere' }}
                >
                  {r.details}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">Ingen krav</Typography>
      )}
    </Paper>
  );
}

export default RequirementList;
