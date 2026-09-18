import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { ConsultantSyncResponse } from '../../types/api';
import { joinCounts, skipReasonLabel } from './syncResultText';

interface SyncResultSummaryProps {
  result: ConsultantSyncResponse;
}

/**
 * The sync response as rows a person can read, instead of the JSON body.
 *
 * Two groups, because the run does two things: it walks the Flowcase list and writes people and
 * CVs, then it brings the vectors in line with what it wrote. Rows that are always interesting
 * (new, updated, unchanged, departed) stay even at zero, so a quiet run looks quiet rather than
 * empty; rows that only matter when they happen (returned, skipped, failed) appear when they do.
 */
const SyncResultSummary: React.FC<SyncResultSummaryProps> = ({ result }) => {
  const skippedReasons = Object.entries(result.skippedReasons ?? {})
    .filter(([, n]) => n > 0)
    .map(([reason, n]) => `${n} ${skipReasonLabel(reason)}`)
    .join(', ');

  return (
    <Stack spacing={1.5} sx={{ mt: 1 }}>
      <Section title="Konsulenter">
        <Row label="Nye" value={String(result.created)} />
        <Row label="Oppdatert CV" value={String(result.updated)} />
        <Row label="Uendret CV" value={String(result.unchanged)} />
        <Row label="Sluttet" value={String(result.departed)} />
        {result.returned > 0 && <Row label="Tilbake" value={String(result.returned)} />}
        {result.skipped > 0 && (
          <Row label="Hoppet over" value={skippedReasons ? `${result.skipped} (${skippedReasons})` : String(result.skipped)} />
        )}
        {result.failed > 0 && <Row label="Feilet" value={String(result.failed)} tone="error" />}
      </Section>

      <Section title="Vektorer">
        <EmbeddingRows result={result} />
      </Section>
    </Stack>
  );
};

const EmbeddingRows: React.FC<{ result: ConsultantSyncResponse }> = ({ result }) => {
  const refresh = result.embeddings;
  if (!refresh) {
    return <Row label="Ikke rørt" value="embeddings er slått av" />;
  }

  const removed = joinCounts([
    [refresh.vectorsDeleted, 'hel-CV-vektorer'],
    [refresh.chunksDeleted, 'biter'],
  ]);
  const wholeCv = refresh.wholeCv;
  const chunks = refresh.chunks;

  return (
    <>
      <Row label="Fjernet for dem som har sluttet" value={removed} />
      {!wholeCv && !chunks && <Row label="Nye vektorer" value="ingen, siden ingen CV var endret" />}
      {wholeCv && (
        <Row
          label="Hel-CV-vektorer"
          value={joinCounts([
            [wholeCv.created, 'nye'],
            [wholeCv.updated, 'oppdatert'],
            [wholeCv.skipped, 'uendret'],
            [wholeCv.failed, 'feilet'],
          ])}
          tone={wholeCv.failed > 0 ? 'error' : undefined}
        />
      )}
      {chunks && (
        <Row
          label="Biter"
          value={describeChunks(chunks)}
          tone={(chunks.failed ?? 0) > 0 ? 'error' : undefined}
        />
      )}
      {(chunks?.rateLimited ?? 0) > 0 && (
        <Typography variant="body2" color="warning.main" sx={{ gridColumn: '1 / -1' }}>
          Embedding-tjenesten stoppet kjøringen på kvote. Neste synk fortsetter der denne stoppet.
        </Typography>
      )}
    </>
  );
};

function describeChunks(chunks: NonNullable<NonNullable<ConsultantSyncResponse['embeddings']>['chunks']>): string {
  const rebuilt = (chunks.created ?? 0) + (chunks.updated ?? 0);
  const parts: string[] = [];
  if (rebuilt > 0) {
    const written = chunks.totalChunks ?? 0;
    parts.push(`${rebuilt} ${rebuilt === 1 ? 'CV' : 'CV-er'} på nytt${written > 0 ? ` (${written} biter)` : ''}`);
  }
  if ((chunks.skipped ?? 0) > 0) parts.push(`${chunks.skipped} uendret`);
  if ((chunks.failed ?? 0) > 0) parts.push(`${chunks.failed} feilet`);
  return parts.length === 0 ? 'ingen' : parts.join(', ');
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box>
    <Typography variant="overline" component="h3" sx={{ lineHeight: 1.6, display: 'block' }}>
      {title}
    </Typography>
    {/*
      Two columns where there is room. At phone width the label column took what it needed and
      the value wrapped one word per line, so there each value goes under its label instead.
    */}
    <Box
      component="dl"
      sx={{
        m: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, auto) 1fr' },
        columnGap: 2,
        rowGap: { xs: 0, sm: 0.25 },
        '& dd': { pl: { xs: 1.5, sm: 0 }, mb: { xs: 0.75, sm: 0 } },
      }}
    >
      {children}
    </Box>
  </Box>
);

const Row: React.FC<{ label: string; value: string; tone?: 'error' }> = ({ label, value, tone }) => (
  <>
    <Typography component="dt" variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography component="dd" variant="body2" sx={{ m: 0 }} color={tone === 'error' ? 'error.main' : 'text.primary'}>
      {value}
    </Typography>
  </>
);

export default SyncResultSummary;
