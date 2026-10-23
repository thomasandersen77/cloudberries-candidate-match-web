import React, { useEffect, useId, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { MatchesListItemDto, ProjectRequestResponseDto, ProjectRequirementDto, UnscoredCandidateDto, RequirementChangeDto } from '../../types/api';
import RequirementList from './RequirementList';
import { COARSE_POINTER, TOUCH_TARGET_PX } from '../../themeTokens';
import { SECTION_TITLES, type SectionKey } from './requestPageState';

const formatDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('nb-NO') : null);


/**
 * What the request asks for, in its own words: the summary, the period, and every requirement
 * with its priority and elaboration, the consultant's first. The supplier's (submission format,
 * deadlines) stay, marked, after them.
 */
export const RequestRequirements: React.FC<{ request: ProjectRequestResponseDto }> = ({ request }) => {
  const period = [formatDate(request.startDate), formatDate(request.endDate)].filter(Boolean);
  const consultantFirst = (rows: ProjectRequirementDto[] | undefined) =>
    [...(rows ?? [])].sort((a, b) => Number(a.appliesTo === 'SUPPLIER') - Number(b.appliesTo === 'SUPPLIER'));
  return (
    <Box>
      {period.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Periode {period.join(' – ')}</Typography>
      )}
      {request.summary && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1.5 }}>{request.summary}</Typography>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="stretch">
        <RequirementList title="Må-krav" tone="warning" rows={consultantFirst(request.mustRequirements)} />
        <RequirementList title="Bør-krav" tone="info" rows={consultantFirst(request.shouldRequirements)} />
      </Stack>
    </Box>
  );
};

type PageSectionProps = {
  id: SectionKey;
  /** Shown in the heading when the part is folded: «Må-krav (10) · Bør-krav (4)». */
  summary?: string;
  defaultOpen: boolean;
  /** A short line under the heading, always shown. */
  intro?: string;
  children: React.ReactNode;
};

/**
 * One of the page's four parts. Folded parts keep a heading with what is in them, so the page
 * reads top to bottom as the work of its state and nothing is out of reach. Opening one from the
 * part navigation unfolds it.
 */
export const PageSection: React.FC<PageSectionProps> = ({ id, summary, defaultOpen, intro, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  // The state changes the default (a finished run folds the candidate choice); a part the reader
  // opened stays open until the state changes.
  useEffect(() => setOpen(defaultOpen), [defaultOpen]);
  useEffect(() => {
    const unfold = () => { if (window.location.hash === `#${id}`) setOpen(true); };
    window.addEventListener('hashchange', unfold);
    return () => window.removeEventListener('hashchange', unfold);
  }, [id]);
  return (
    <Paper component="section" id={id} aria-labelledby={`${contentId}-title`} sx={{ p: { xs: 1.5, sm: 2 }, scrollMarginTop: 16 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={`${contentId}-title`} variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
            {SECTION_TITLES[id]}
          </Typography>
          {!open && summary && <Typography variant="body2" color="text.secondary">{summary}</Typography>}
        </Box>
        <Button
          size="small"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={contentId}
          endIcon={<ExpandMoreIcon sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />}
          sx={{ textTransform: 'none', flexShrink: 0, [COARSE_POINTER]: { minHeight: TOUCH_TARGET_PX } }}
        >
          {open ? 'Skjul' : 'Vis'}
        </Button>
      </Stack>
      <Collapse in={open} timeout="auto">
        <Box id={contentId} sx={{ mt: 1.5 }}>
          {intro && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{intro}</Typography>}
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

/** The four parts as links, in the order the page shows them, so a phone does not scroll to find one. */
export const SectionNav: React.FC<{ order: SectionKey[]; counts?: Partial<Record<SectionKey, string>> }> = ({ order, counts = {} }) => (
  <Box component="nav" aria-label="Avropets deler" sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 } }}>
    {order.map((key) => (
      <Button
        key={key}
        href={`#${key}`}
        size="small"
        sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, color: 'text.secondary', minHeight: TOUCH_TARGET_PX }}
      >
        {SECTION_TITLES[key]}{counts[key] ? ` (${counts[key]})` : ''}
      </Button>
    ))}
  </Box>
);

const CHANGE_WORDS: Record<string, string> = {
  ADDED: 'Lagt til',
  REMOVED: 'Fjernet',
  PRIORITY: 'Endret prioritet',
  DETAILS: 'Endret beskrivelse',
};
const PRIORITY_WORDS: Record<string, string> = { MUST: 'må-krav', SHOULD: 'bør-krav' };

function describeChange(change: RequirementChangeDto): string {
  const priority = (p?: string | null) => (p ? PRIORITY_WORDS[p] ?? p.toLowerCase() : '');
  switch (change.kind) {
    case 'ADDED': return `${change.name} · ${priority(change.after)}`;
    case 'REMOVED': return `${change.name} · var ${priority(change.before)}`;
    case 'PRIORITY': return `${change.name} · fra ${priority(change.before)} til ${priority(change.after)}`;
    default: return `${change.name} · «${change.before ?? ''}» er nå «${change.after ?? ''}»`;
  }
}

/**
 * «Endret siden vurderingen» (plan C3): what the request asks for now that the scores do not
 * answer, and whose CV has changed. First on an outdated page, because it decides whether the
 * scores under it can be trusted.
 */
export const ChangesSinceCard: React.FC<{ at: string | null; changes: RequirementChangeDto[]; requirementsChanged: boolean; cvChangedNames: string[] }> = ({
  at, changes, requirementsChanged, cvChangedNames,
}) => (
  <Paper variant="outlined" sx={(theme) => ({ p: { xs: 1.5, sm: 2 }, borderColor: theme.palette.warning.main })}>
    <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
      Endret siden vurderingen{at ? ` ${formatDate(at)}` : ''}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      Skårene under svarer på kravene og CV-ene slik de var. Et gjenforsøk ville blandet to grunnlag, så valget er en ny vurdering.
    </Typography>
    <Stack spacing={0.5} component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
      {changes.map((c) => (
        <Typography key={`${c.kind}-${c.name}`} component="li" variant="body2">
          <strong>{CHANGE_WORDS[c.kind] ?? c.kind}:</strong> {describeChange(c)}
        </Typography>
      ))}
      {requirementsChanged && changes.length === 0 && (
        <Typography component="li" variant="body2"><strong>Endret:</strong> rekkefølgen på kravene</Typography>
      )}
      {cvChangedNames.length > 0 && (
        <Typography component="li" variant="body2"><strong>CV endret siden:</strong> {cvChangedNames.join(', ')}</Typography>
      )}
    </Stack>
  </Paper>
);

/** «Uten skår (3)»: who the run has no score for, and why, in words the server wrote for a reader. */
export const UnscoredList: React.FC<{ rows: UnscoredCandidateDto[] }> = ({ rows }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" component="h3">Uten skår ({rows.length})</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>De står ikke i listen over. Grunnen står per person.</Typography>
    <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 0, listStyle: 'none' }}>
      {rows.map((r) => (
        <Typography key={r.userId} component="li" variant="body2">
          <strong>{r.name}:</strong> {r.reason}
        </Typography>
      ))}
    </Stack>
  </Box>
);

type RequestHeaderProps = {
  item: MatchesListItemDto | null | undefined;
  request: ProjectRequestResponseDto | null | undefined;
  requestId: number;
  /** The one action, already a button: the panel owns what it does. */
  action: React.ReactNode;
  help: string;
  /** Settings and other quiet controls under the help. */
  extra?: React.ReactNode;
  frames: React.ReactNode;
  onClose?: () => Promise<void>;
};

/**
 * The top of the request page (plan C1, approved sketch): who, what, when, the one action with
 * what it costs, and three frames that answer «are the requirements right», «is anyone there» and
 * «has the model assessed them». The same on a phone, stacked.
 */
export const RequestHeader: React.FC<RequestHeaderProps> = ({ item, request, requestId, action, help, extra, frames, onClose }) => {
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const customer = item?.customerName ?? request?.customerName ?? '';
  const role = item?.role ?? request?.role;
  const closed = item?.workStatus === 'CLOSED' || request?.status === 'CLOSED';
  const meta = [
    item?.deadlineDate || request?.deadlineDate ? `Frist ${formatDate(item?.deadlineDate ?? request?.deadlineDate)}` : null,
    item?.date || request?.uploadedAt ? `lastet opp ${formatDate(item?.date ?? request?.uploadedAt)}` : null,
    item?.workStatus === 'DEADLINE_PASSED' ? 'frist passert' : null,
    closed ? 'lukket' : null,
  ].filter(Boolean).join(' · ');
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Avrop {requestId}
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.6rem', sm: '1.9rem' } }}>{customer || 'Ukjent kunde'}</Typography>
          {role && <Typography sx={{ fontWeight: 600, fontSize: '1.05rem' }}>{role}</Typography>}
          {item?.title && item.title !== role && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{item.title}</Typography>
          )}
          {meta && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{meta}</Typography>}
        </Box>
        <Stack spacing={0.75} alignItems={{ xs: 'stretch', md: 'flex-end' }} sx={{ maxWidth: { md: 380 }, flexShrink: 0 }}>
          {action}
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: { md: 'right' } }}>{help}</Typography>
          {extra}
        </Stack>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25, mt: 2 }}>
        {frames}
      </Box>
      {onClose && !closed && (
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" color="inherit" onClick={() => setConfirmClose(true)} sx={{ textTransform: 'none', color: 'text.secondary', minHeight: TOUCH_TARGET_PX }}>
            Lukk avropet
          </Button>
        </Box>
      )}
      <Dialog open={confirmClose} onClose={() => { if (!closing) setConfirmClose(false); }}>
        <DialogTitle>Lukke avropet?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Avropet merkes som lukket og vises under «Lukket» i listen. Vurderingene beholdes. Det kan ikke åpnes igjen her ennå.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)} disabled={closing}>Avbryt</Button>
          <Button
            variant="contained"
            disabled={closing}
            onClick={async () => {
              setClosing(true);
              try { await onClose?.(); setConfirmClose(false); } finally { setClosing(false); }
            }}
          >
            {closing ? 'Lukker…' : 'Lukk avropet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
