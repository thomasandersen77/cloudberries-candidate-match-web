import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import type { CvScoreBasis, CvScoreBasisRow } from '../../../types/api';

const rows: CvScoreBasisRow[] = [
  { candidateId: 'g1', name: 'Gullik Vetvik Killie', scorePercent: 67, scoredAt: '2026-10-20T11:00:00Z', model: 'claude-opus-5-5', promptVersion: '2026-10-cv-review-v5', stale: false, hasBreakdown: true, rulesStatus: 'CURRENT', currentPromptVersion: '2026-10-cv-review-v5' },
  { candidateId: 'r1', name: 'Rafael Sanchez', scorePercent: 63, scoredAt: '2026-10-20T10:43:00Z', model: 'claude-opus-5-5', promptVersion: '2026-10-cv-review-v3', stale: false, hasBreakdown: false, rulesStatus: 'OUTDATED', currentPromptVersion: '2026-10-cv-review-v5' },
];

const metrics = {
  version: 1, profileWords: 203, keyPoints: 0,
  projects: [
    { customer: 'Statkraft AS', from: '2025-12', to: null, ongoing: true, recent: true, descriptionWords: 0, roles: 1, rolesWithText: 0, roleWords: 0, skills: 8, firstPerson: false, mentionsMethod: false, mentionsTeam: false, measurableValue: false },
  ],
  recent: { projects: 1, emptyDescription: 1, shortDescription: 0, goldRangeDescription: 0, longDescription: 0, withoutRoleText: 1, firstPerson: 0, withMethod: 0, withTeam: 0, withMeasurableValue: 0, withoutSkills: 0 },
};

const gullik: CvScoreBasis = {
  candidateId: 'g1', name: 'Gullik Vetvik Killie', scorePercent: 67, scoredAt: '2026-10-20T11:00:00Z',
  model: 'claude-opus-5-5', promptVersion: '2026-10-cv-review-v5', stale: false,
  criteria: [
    { criterion: 'projectDescriptions', weight: 2.5, score: 60, pointsLost: 10, justification: 'Statkraft er tom, og WindSim har 18 ord.' },
    { criterion: 'roleDescriptions', weight: 2.5, score: 70, pointsLost: 7.5, justification: 'Gode roller hos WindSim.' },
  ],
  calibrationNotes: ['Etiketten «Statkraft» på profilen kan være Flowcase sitt variantnavn.'],
  metrics, currentMetrics: metrics,
};

const rafael: CvScoreBasis = { ...gullik, candidateId: 'r1', name: 'Rafael Sanchez', criteria: [], calibrationNotes: [], metrics: null };

vi.mock('../../../services/adminService', () => ({
  listCvScoreBases: vi.fn(() => Promise.resolve(rows)),
  getCvScoreBasis: vi.fn((id: string) => Promise.resolve(id === 'g1' ? gullik : rafael)),
  getCvReviewPrompt: vi.fn(() => Promise.resolve({
    promptId: 'cv_review', promptVersion: '2026-10-cv-review-v5',
    systemInstructions: '# CV-vurdering\n\nGull-CV-standarden …', userTemplate: 'Kandidatnavn: <kandidatnavn>',
    criteriaWeights: { projectDescriptions: 2.5, roleDescriptions: 2.5 },
  })),
}));

import CvScoreBasisPage from '../CvScoreBasisPage';

const renderPage = (entry = '/cv-score-grunnlag') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <CvScoreBasisPage />
    </MemoryRouter>
  );

describe('CvScoreBasisPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists the scored consultants and marks scores without stored criteria', async () => {
    renderPage();

    expect(await screen.findByText('Gullik Vetvik Killie')).toBeInTheDocument();
    const rafaelRow = screen.getByText('Rafael Sanchez').closest('tr')!;
    expect(within(rafaelRow).getByText('Uten kriterier')).toBeInTheDocument();
  });

  it('shows each criterion with its points lost, the model notes and the CV counts', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Gullik Vetvik Killie'));

    const criteria = await screen.findByRole('table', { name: 'Kriterier og trekk' });
    expect(within(criteria).getByText('Prosjektbeskrivelser')).toBeInTheDocument();
    expect(within(criteria).getByText('−10.0')).toBeInTheDocument();
    expect(within(criteria).getByText('−17.5')).toBeInTheDocument();
    expect(screen.getByText(/variantnavn/)).toBeInTheDocument();
    expect(screen.getByText('Uten prosjektbeskrivelse: 1')).toBeInTheDocument();
    expect(within(screen.getByRole('table', { name: 'Tellinger per prosjekt' })).getByText('12/2025 – pågående')).toBeInTheDocument();
  });

  it('opens the selected basis directly after its consultant row, before the next consultant', async () => {
    renderPage();
    const row = (await screen.findByText('Gullik Vetvik Killie')).closest('tr')!;
    fireEvent.click(within(row).getByText('Gullik Vetvik Killie'));
    await screen.findByRole('heading', { name: 'Gullik Vetvik Killie' });
    expect(row.nextElementSibling).not.toBeNull();
    expect(within(row.nextElementSibling as HTMLElement).getByRole('heading', { name: 'Gullik Vetvik Killie' })).toBeInTheDocument();
    expect(row.nextElementSibling?.nextElementSibling).toContainElement(screen.getByText('Rafael Sanchez'));
  });

  it('keeps an open basis with its row when sorting, and lets the same control close it', async () => {
    renderPage();
    const toggle = await screen.findByRole('button', { name: 'Gullik Vetvik Killie' });
    toggle.focus();
    fireEvent.click(toggle);
    const region = await screen.findByRole('region', { name: 'Gullik Vetvik Killie' });
    await within(region).findByRole('heading', { name: 'Gullik Vetvik Killie' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Sorter etter score' }));
    expect(toggle.closest('tr')?.nextElementSibling).toContainElement(region);
    const { getCvScoreBasis } = await import('../../../services/adminService');
    expect(getCvScoreBasis).toHaveBeenCalledTimes(1);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Gullik Vetvik Killie' })).not.toBeInTheDocument();
  });

  it('sorts by score and by date in both directions without fetching a new basis', async () => {
    const { listCvScoreBases, getCvScoreBasis } = await import('../../../services/adminService');
    vi.mocked(listCvScoreBases).mockResolvedValueOnce([
      { ...rows[0], candidateId: 'a', name: 'Kari', scorePercent: 80, scoredAt: '2026-10-19T11:00:00Z' },
      { ...rows[0], candidateId: 'b', name: 'Ola', scorePercent: 90, scoredAt: '2026-10-18T11:00:00Z' },
      { ...rows[0], candidateId: 'c', name: 'Anne', scorePercent: 80, scoredAt: '2026-10-20T11:00:00Z' },
    ]);
    renderPage();
    await screen.findByText('Kari');
    const names = () => within(screen.getByRole('table', { name: 'Vurderte konsulenter' }))
      .getAllByRole('row').slice(1).map(row => row.querySelector('td')?.textContent);
    expect(names().map(name => name?.match(/Kari|Ola|Anne/)?.[0])).toEqual(['Ola', 'Anne', 'Kari']);
    fireEvent.click(screen.getByRole('button', { name: 'Sorter etter score' }));
    expect(names().map(name => name?.match(/Kari|Ola|Anne/)?.[0])).toEqual(['Anne', 'Kari', 'Ola']);
    fireEvent.click(screen.getByRole('button', { name: 'Sorter etter dato' }));
    expect(names().map(name => name?.match(/Kari|Ola|Anne/)?.[0])).toEqual(['Anne', 'Kari', 'Ola']);
    fireEvent.click(screen.getByRole('button', { name: 'Sorter etter dato' }));
    expect(names().map(name => name?.match(/Kari|Ola|Anne/)?.[0])).toEqual(['Ola', 'Kari', 'Anne']);
    expect(getCvScoreBasis).not.toHaveBeenCalled();
  });

  it('filters by scoring rules separately from CV freshness without requesting a new review', async () => {
    renderPage();
    await screen.findByText('Gullik Vetvik Killie');
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Vurderingsregler' }));
    fireEvent.click(screen.getByRole('option', { name: 'Eldre vurderingsregler' }));
    expect(screen.queryByText('Gullik Vetvik Killie')).not.toBeInTheDocument();
    expect(screen.getByText('Rafael Sanchez')).toBeInTheDocument();
    const { getCvScoreBasis } = await import('../../../services/adminService');
    expect(getCvScoreBasis).not.toHaveBeenCalled();
  });

  it('keeps the selected consultant when earlier requests finish last', async () => {
    const { getCvScoreBasis } = await import('../../../services/adminService');
    let resolveA!: (basis: CvScoreBasis) => void;
    let resolveB!: (basis: CvScoreBasis) => void;
    vi.mocked(getCvScoreBasis)
      .mockImplementationOnce(() => new Promise(resolve => { resolveA = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveB = resolve; }));
    renderPage();
    fireEvent.click(await screen.findByText('Gullik Vetvik Killie'));
    fireEvent.click(screen.getByText('Rafael Sanchez'));
    await act(async () => resolveB(rafael));
    expect(screen.getByRole('heading', { name: 'Rafael Sanchez' })).toBeInTheDocument();
    await act(async () => resolveA(gullik));
    expect(screen.getByRole('heading', { name: 'Rafael Sanchez' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Gullik Vetvik Killie' })).not.toBeInTheDocument();
  });

  it('clears previous data on failure and clears the failure on a new selection', async () => {
    const { getCvScoreBasis } = await import('../../../services/adminService');
    vi.mocked(getCvScoreBasis).mockResolvedValueOnce(gullik).mockRejectedValueOnce(new Error('failed'));
    renderPage();
    fireEvent.click(await screen.findByText('Gullik Vetvik Killie'));
    await screen.findByRole('heading', { name: 'Gullik Vetvik Killie' });
    fireEvent.click(screen.getByText('Rafael Sanchez'));
    await screen.findByText('Kunne ikke hente grunnlaget for denne scoren.');
    expect(screen.queryByRole('heading', { name: 'Gullik Vetvik Killie' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Gullik Vetvik Killie'));
    await screen.findByRole('heading', { name: 'Gullik Vetvik Killie' });
    expect(screen.queryByText('Kunne ikke hente grunnlaget for denne scoren.')).not.toBeInTheDocument();
  });

  /** A count made with older rules is not shown as if it were right. */
  it('counts again with today’s rules when the stored count used older ones', async () => {
    const older = { ...metrics, version: 1, recent: { ...metrics.recent, withMeasurableValue: 0 } };
    const current = { ...metrics, version: 2, recent: { ...metrics.recent, withMeasurableValue: 3 } };
    const { getCvScoreBasis } = await import('../../../services/adminService');
    (getCvScoreBasis as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ...gullik, metrics: older, currentMetrics: current });

    renderPage('/cv-score-grunnlag?id=g1');

    expect(await screen.findByText(/Samme CV-innhold, talt på nytt/)).toBeInTheDocument();
    expect(screen.getByText('Tall med enhet (målbar verdi): 3')).toBeInTheDocument();
  });

  it('keeps historical counts apart from changed CV content and newer rules', async () => {
    const { getCvScoreBasis } = await import('../../../services/adminService');
    vi.mocked(getCvScoreBasis).mockResolvedValueOnce({ ...gullik, stale: true,
      metrics: { ...metrics, version: 1, countedOn: '2026-10-19', cvHash: 'old' },
      currentMetrics: { ...metrics, version: 2, countedOn: '2026-10-20', cvHash: 'new' } });
    renderPage('/cv-score-grunnlag?id=g1');
    expect(await screen.findByText(/Lagrede tellinger.*v1, talt 2026-10-19/)).toBeInTheDocument();
    expect(screen.getByText(/Fra dagens CV, som kan ha annet innhold.*v2, talt 2026-10-20/)).toBeInTheDocument();
    expect(screen.getAllByRole('table', { name: 'Tellinger per prosjekt' })).toHaveLength(2);
  });

  it('shows a new counting date separately even when the CV and rules are unchanged', async () => {
    const { getCvScoreBasis } = await import('../../../services/adminService');
    vi.mocked(getCvScoreBasis).mockResolvedValueOnce({ ...gullik,
      metrics: { ...metrics, countedOn: '2026-09-20', cvHash: 'same' },
      currentMetrics: { ...metrics, countedOn: '2026-10-20', cvHash: 'same' } });
    renderPage('/cv-score-grunnlag?id=g1');
    expect(await screen.findByText(/Samme CV-innhold, talt på nytt.*2026-10-20/)).toBeInTheDocument();
    expect(screen.getAllByRole('table', { name: 'Tellinger per prosjekt' })).toHaveLength(2);
  });

  /** A score from before the basis was kept says so, and still shows the CV as it is now. */
  it('says when a score was stored without its criteria', async () => {
    renderPage('/cv-score-grunnlag?id=r1');

    expect(await screen.findByText(/lagret før kriteriene ble tatt vare på/)).toBeInTheDocument();
    expect(screen.getByText(/Ingen merknader/)).toBeInTheDocument();
    expect(screen.getByText(/Fra CV-en slik den er nå/)).toBeInTheDocument();
  });

  /** The rule a deduction came from is readable next to the deduction, with its version. */
  it('shows the review prompt with its version on request', async () => {
    renderPage();

    const toggle = await screen.findByRole('button', { name: 'Vis prompten' });
    expect(screen.getByText(/2026-10-cv-review-v5/)).toBeInTheDocument();
    fireEvent.click(toggle);

    expect(screen.getByText(/Gull-CV-standarden/)).toBeInTheDocument();
    expect(screen.getByText(/Prosjektbeskrivelser 2\.5/)).toBeInTheDocument();
  });
});
