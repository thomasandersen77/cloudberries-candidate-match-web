import type { ProjectMatchStatusResponse, ProjectRequirementDto } from '../../types/api';

/**
 * Which of the request page's states the reader is in (plan C3; the sketch of four states
 * approved 2026-10-23), the one action the page offers for it (C4), and the order its parts come
 * in. Pure, so every state is tested without rendering the page.
 *
 * NEW: nothing assessed yet; requirements and candidate choice first.
 * RUNNING: an assessment is going; its progress and «Avbryt», the previous result kept on screen.
 * PARTIAL: some have a score, some not; the result first, and «Vurder de N som feilet».
 * OUTDATED: the requirements or CVs changed since; what changed first, and a new assessment.
 * ASSESSED: a complete, current assessment; the result first.
 * BLOCKED: nothing can be assessed, and the page says why.
 */
export type RequestPageState = 'NEW' | 'RUNNING' | 'PARTIAL' | 'OUTDATED' | 'ASSESSED' | 'BLOCKED';

export type SectionKey = 'krav' | 'kandidater' | 'vurdering' | 'forslag';

export const SECTION_TITLES: Record<SectionKey, string> = {
  krav: 'Dokument og krav',
  kandidater: 'Kandidater',
  vurdering: 'Vurdering',
  forslag: 'Forslag',
};

export type PrimaryAction =
  | { kind: 'run'; label: string; disabledReason?: string; auto: boolean }
  | { kind: 'retry'; label: string; count: number }
  | { kind: 'rerun'; label: string; disabledReason?: string; auto: boolean }
  | { kind: 'cancel'; label: string; pending: boolean }
  | { kind: 'none'; reason: string };

export type PageInputs = {
  /** The status endpoint's last answer; null before it has answered, or from an older server. */
  status: ProjectMatchStatusResponse | null;
  /** A run going on: this page's own, or one the status reports. */
  running: boolean;
  cancelPending: boolean;
  /** Scored candidates on screen. */
  hasResults: boolean;
  analysisFailed: boolean;
  /** The consultant's requirements the request has; zero means there is nothing to score against. */
  consultantRequirements: number;
  /** Whether the free preview answered; without it the backend chooses who is assessed. */
  previewAvailable: boolean;
  selectedCount: number;
  /** Scored candidates whose CV has changed since the run. */
  cvChanged: number;
};

export function pageStateOf(i: PageInputs): RequestPageState {
  if (i.running) return 'RUNNING';
  if (i.analysisFailed || i.consultantRequirements === 0) return 'BLOCKED';
  const status = i.status?.status;
  const failed = i.status?.failed ?? 0;
  if (!i.hasResults && status !== 'PARTIAL') return 'NEW';
  if (i.status?.requirementsChanged || i.cvChanged > 0) return 'OUTDATED';
  if ((status === 'PARTIAL' || status === 'FAILED') && failed > 0) return 'PARTIAL';
  return 'ASSESSED';
}

function blockedReason(i: PageInputs): string {
  if (i.analysisFailed) return 'Kan ikke vurdere: kravtolkingen feilet. Prøv tolkingen igjen først.';
  return 'Kan ikke vurdere: avropet har ingen krav til konsulenten å vurdere mot.';
}

/** «Vurder 20 valgte», or the automatic choice when there is no preview to choose from. */
function runScope(i: PageInputs): { label: string; disabledReason?: string; auto: boolean } {
  if (!i.previewAvailable) return { label: 'Vurder automatisk utvalg', auto: true };
  if (i.selectedCount === 0) return { label: 'Vurder valgte', disabledReason: 'Velg minst én kandidat.', auto: false };
  return { label: `Vurder ${i.selectedCount} valgte`, auto: false };
}

export function primaryActionOf(state: RequestPageState, i: PageInputs): PrimaryAction {
  switch (state) {
    case 'RUNNING':
      return { kind: 'cancel', label: i.cancelPending ? 'Avbryter…' : 'Avbryt vurderingen', pending: i.cancelPending };
    case 'BLOCKED':
      return { kind: 'none', reason: blockedReason(i) };
    case 'NEW':
      return { kind: 'run', ...runScope(i) };
    case 'PARTIAL': {
      const count = i.status?.failed ?? 0;
      return { kind: 'retry', label: `Vurder de ${count} som feilet`, count };
    }
    case 'OUTDATED': {
      const scope = runScope(i);
      const n = scope.auto ? '' : `${i.selectedCount} `;
      return { kind: 'rerun', ...scope, label: scope.disabledReason ? 'Vurder på nytt mot dagens krav' : `Vurder ${n}på nytt mot dagens krav` };
    }
    case 'ASSESSED': {
      const scope = runScope(i);
      return { kind: 'rerun', ...scope, label: scope.auto ? 'Ny vurdering av automatisk utvalg' : scope.disabledReason ? 'Ny vurdering' : `Ny vurdering av ${i.selectedCount} valgte` };
    }
  }
}

/** The help under the button: what pressing it costs and does, in one or two sentences. */
export function actionHelpOf(action: PrimaryAction): string {
  switch (action.kind) {
    case 'run':
    case 'rerun':
      return action.auto
        ? 'Backend velger de 20 best rangerte. Ett modellkall per kandidat, rundt 2 US-cent hver.'
        : 'Ett modellkall per kandidat, rundt 2 US-cent hver. Ingenting skjer før du trykker.';
    case 'retry':
      return `Samme krav og instruksjoner, i samme vurdering. ${action.count} modellkall.`;
    case 'cancel':
      return 'Kall som alt er sendt, gjøres ferdig og lagres; resten sendes ikke.';
    case 'none':
      return action.reason;
  }
}

/** The parts in the order the state calls for: the work first when nothing is assessed, the answer first after. */
export function sectionOrderOf(state: RequestPageState): SectionKey[] {
  return state === 'NEW' || state === 'BLOCKED'
    ? ['krav', 'kandidater', 'vurdering', 'forslag']
    : ['vurdering', 'forslag', 'kandidater', 'krav'];
}

/** Whether a part starts open. The requirements and the candidate choice fold away once there is an answer. */
export function sectionOpenOf(state: RequestPageState, key: SectionKey): boolean {
  if (state === 'NEW' || state === 'BLOCKED') return true;
  return key === 'vurdering' || key === 'forslag';
}

type RequirementRows = { mustRequirements?: ProjectRequirementDto[] | null; shouldRequirements?: ProjectRequirementDto[] | null };

/**
 * The request's requirements by whose they are: the consultant's musts and shoulds, which the
 * assessment scores against, and the supplier's, which nobody's CV is. One split, so the frame, the
 * folded summary and the lists count the same thing; they did not, and a request with one
 * consultant must and eight supplier musts read «1 må-krav» above a list headed «Må-krav (9)».
 */
export function splitRequirements(request: RequirementRows) {
  const isSupplier = (r: ProjectRequirementDto) => r.appliesTo === 'SUPPLIER';
  const musts = request.mustRequirements ?? [];
  const shoulds = request.shouldRequirements ?? [];
  const supplierMusts = musts.filter(isSupplier);
  const supplierShoulds = shoulds.filter(isSupplier);
  return {
    must: musts.filter((r) => !isSupplier(r)),
    should: shoulds.filter((r) => !isSupplier(r)),
    supplier: [...supplierMusts, ...supplierShoulds],
    supplierMarks: [...supplierMusts.map(() => 'Må'), ...supplierShoulds.map(() => 'Bør')],
  };
}

/** «Må-krav (1) · Bør-krav (0) · Leverandørkrav (9)»: the folded part's heading and the frame use the same counts. */
export function requirementCountsLabel(c: { must: number; should: number; supplier: number }): string {
  return `Må-krav (${c.must}) · Bør-krav (${c.should})${c.supplier > 0 ? ` · Leverandørkrav (${c.supplier})` : ''}`;
}
