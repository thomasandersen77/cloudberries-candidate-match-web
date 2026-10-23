import { describe, expect, it } from 'vitest';
import { actionHelpOf, pageStateOf, primaryActionOf, sectionOpenOf, sectionOrderOf, type PageInputs } from './requestPageState';

const base: PageInputs = {
  status: null, running: false, cancelPending: false, hasResults: false, analysisFailed: false,
  consultantRequirements: 10, previewAvailable: true, selectedCount: 20, cvChanged: 0,
};
const status = (s: Record<string, unknown>) => ({ projectRequestId: 1, ...s }) as PageInputs['status'];

/** The four states of the approved sketch, and the blocked one Codex asked to be explicit. */
describe('request page state', () => {
  it('is NEW until something is assessed, and offers the chosen candidates', () => {
    const state = pageStateOf(base);
    expect(state).toBe('NEW');
    expect(primaryActionOf(state, base)).toEqual({ kind: 'run', label: 'Vurder 20 valgte', auto: false });
    expect(sectionOrderOf(state)).toEqual(['krav', 'kandidater', 'vurdering', 'forslag']);
  });

  /** C4: nobody ticked is nobody, not «let the backend choose». */
  it('will not start with nobody chosen, and says why; without a preview it offers the automatic choice', () => {
    expect(primaryActionOf('NEW', { ...base, selectedCount: 0 })).toEqual({ kind: 'run', label: 'Vurder valgte', disabledReason: 'Velg minst én kandidat.', auto: false });
    const auto = primaryActionOf('NEW', { ...base, previewAvailable: false, selectedCount: 0 });
    expect(auto).toEqual({ kind: 'run', label: 'Vurder automatisk utvalg', auto: true });
    expect(actionHelpOf(auto)).toContain('Backend velger de 20 best rangerte');
  });

  it('is RUNNING while a run goes on, whoever started it, and offers to cancel', () => {
    const inputs = { ...base, running: true, hasResults: true };
    expect(pageStateOf(inputs)).toBe('RUNNING');
    expect(primaryActionOf('RUNNING', inputs)).toEqual({ kind: 'cancel', label: 'Avbryt vurderingen', pending: false });
    expect(primaryActionOf('RUNNING', { ...inputs, cancelPending: true })).toMatchObject({ label: 'Avbryter…', pending: true });
    expect(sectionOrderOf('RUNNING')[0]).toBe('vurdering');
  });

  it('is PARTIAL when some have no score, and offers to ask only those again', () => {
    const inputs = { ...base, hasResults: true, status: status({ status: 'PARTIAL', failed: 3, succeeded: 17, attempted: 20 }) };
    expect(pageStateOf(inputs)).toBe('PARTIAL');
    expect(primaryActionOf('PARTIAL', inputs)).toEqual({ kind: 'retry', label: 'Vurder de 3 som feilet', count: 3 });
  });

  /** A retry would mix two sets of requirements; changed requirements mean a new assessment. */
  it('is OUTDATED when the requirements or a CV changed, even with failures, and offers a new assessment', () => {
    const changed = { ...base, hasResults: true, status: status({ status: 'PARTIAL', failed: 3, requirementsChanged: true }) };
    expect(pageStateOf(changed)).toBe('OUTDATED');
    expect(primaryActionOf('OUTDATED', changed)).toEqual({ kind: 'rerun', label: 'Vurder 20 på nytt mot dagens krav', auto: false });
    expect(pageStateOf({ ...base, hasResults: true, cvChanged: 2, status: status({ status: 'COMPLETED' }) })).toBe('OUTDATED');
  });

  it('is ASSESSED when complete and current, with the result first and the choice folded away', () => {
    const inputs = { ...base, hasResults: true, status: status({ status: 'COMPLETED', failed: 0 }) };
    expect(pageStateOf(inputs)).toBe('ASSESSED');
    expect(primaryActionOf('ASSESSED', inputs)).toMatchObject({ kind: 'rerun', label: 'Ny vurdering av 20 valgte' });
    expect(sectionOpenOf('ASSESSED', 'kandidater')).toBe(false);
    expect(sectionOpenOf('ASSESSED', 'vurdering')).toBe(true);
    expect(sectionOpenOf('NEW', 'krav')).toBe(true);
  });

  it('is BLOCKED when the requirements were not read or there are none for the consultant, and says which', () => {
    expect(primaryActionOf('BLOCKED', { ...base, analysisFailed: true })).toEqual({ kind: 'none', reason: 'Kan ikke vurdere: kravtolkingen feilet. Prøv tolkingen igjen først.' });
    expect(pageStateOf({ ...base, consultantRequirements: 0 })).toBe('BLOCKED');
    expect(primaryActionOf('BLOCKED', { ...base, consultantRequirements: 0 })).toMatchObject({ reason: expect.stringContaining('ingen krav til konsulenten') });
  });
});
