import React, { useState } from 'react';
import { Box, Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AISuggestionDto, RequirementScoreDto } from '../../types/api';
import { BAND_TEXT, DEFAULT_VISIBLE, bandOf, formatScore, groupRequirements } from './suggestionText';

const BAND_COLOR = { strong: 'success', partial: 'default', weak: 'warning' } as const;

/** One requirement: the name in bold, the score beside it, the colour from the prompt's band. */
const RequirementChip: React.FC<{ requirement: RequirementScoreDto }> = ({ requirement }) => {
  const band = bandOf(requirement.score);
  return (
    <Tooltip title={BAND_TEXT[band]}>
      <Chip
        size="small"
        variant="outlined"
        color={BAND_COLOR[band]}
        label={<span><strong>{requirement.name}</strong> {requirement.score.toFixed(1).replace('.', ',')}</span>}
        sx={{ height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 } }}
      />
    </Tooltip>
  );
};

const RequirementGroup: React.FC<{ title: string; rows: RequirementScoreDto[] }> = ({ title, rows }) =>
  rows.length === 0 ? null : (
    <Box sx={{ mt: 1 }}>
      <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.6, fontWeight: 600 }}>{title}</Typography>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.5}>
        {rows.map((r, i) => <RequirementChip key={`${r.name}-${i}`} requirement={r} />)}
      </Stack>
    </Box>
  );

/**
 * What the screening said about each candidate.
 *
 * The justification used to be one block of text, and for four of fifteen candidates on request
 * 9011 it ended in the raw JSON of the model's own tool call. The backend now takes that out and
 * sends the per-requirement scores it was made of, which were stored and never shown. The summary
 * is read as markdown, in case the model emphasises something; the scores are laid out under the
 * same two headings as the request above, so a reader can see where a total came from.
 *
 * The five best by default and the rest on request. The run still scores the whole shortlist,
 * because the preselection's order is a poor predictor of the model's: on 9011, the model's second,
 * third and fifth were 9th, 12th and 8th in the preselection.
 */
const AiSuggestions: React.FC<{ suggestions: AISuggestionDto[] }> = ({ suggestions }) => {
  const [showAll, setShowAll] = useState(false);
  // A backend from before the breakdown sends neither field; the page should not go blank for it.
  const scoreOf = (s: AISuggestionDto) => s.score ?? s.matchScore / 10;
  const sorted = [...suggestions].sort((a, b) => scoreOf(b) - scoreOf(a));
  const visible = showAll ? sorted : sorted.slice(0, DEFAULT_VISIBLE);

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Konsulent</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Vurdering</TableCell>
            <TableCell>Tidspunkt</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map(s => {
            const { must, should } = groupRequirements(s.requirements ?? []);
            return (
              <TableRow key={s.userId} sx={{ verticalAlign: 'top' }}>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.consultantName}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatScore(scoreOf(s))}</TableCell>
                <TableCell>
                  <Box sx={{ typography: 'body2', '& p': { m: 0 } }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.justification}</ReactMarkdown>
                  </Box>
                  <RequirementGroup title="Må-krav" rows={must} />
                  <RequirementGroup title="Bør-krav" rows={should} />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(s.createdAt).toLocaleString('no-NO')}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {sorted.length > DEFAULT_VISIBLE && (
        <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAll(v => !v)}>
          {showAll ? `Vis bare de ${DEFAULT_VISIBLE} beste` : `Vis alle ${sorted.length}`}
        </Button>
      )}
    </>
  );
};

export default AiSuggestions;
