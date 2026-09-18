import type { ConsultantSyncResponse } from '../../types/api';
import type { SyncNotification } from './SyncNotificationPanel';

/**
 * What "Oppdater CV" is doing while it runs. Said in full, because the button used to sit under
 * a spinner that looked like the CV was being sent off for judgement. What actually happens: the
 * CV is fetched from Flowcase and written; if its text changed, the text goes to the embedding
 * model for new search vectors. No language model reads or scores it.
 */
export function singleSyncProgressNotification(): SyncNotification {
  return {
    type: 'progress',
    title: 'Oppdaterer CV',
    message:
      'Henter CV-en fra Flowcase og skriver den. Er teksten endret, sendes den til embedding-modellen ' +
      'for nye søkevektorer. Ingen språkmodell leser eller vurderer CV-en.',
  };
}

/**
 * What to tell the person who pressed "Oppdater CV", from what the backend answered.
 *
 * The single sync answers 200 in every case and says what happened in counters. Before, the page
 * said "CV oppdatert" whenever the request came back, also when Flowcase no longer had the person
 * (skipped) or did not answer (failed). Success, warning and error are three different things to
 * do next, so they get three different notices. The success notice also says what happened to
 * the search vectors, since that is the half of the job the reader cannot see.
 */
export function singleSyncNotification(result: ConsultantSyncResponse): SyncNotification {
  if (result.succeeded > 0) {
    const cv = result.created > 0
      ? 'Konsulenten var ny her og er hentet fra Flowcase.'
      : 'CV-en er hentet fra Flowcase og skrevet på nytt.';
    return {
      type: 'success',
      title: 'CV oppdatert',
      message: `${cv} ${describeVectorRefresh(result.embeddings)}`,
      details: { processed: true },
    };
  }
  if (result.skipped > 0) {
    return {
      type: 'info',
      title: 'Ikke oppdatert',
      message: 'Flowcase har ikke lenger denne konsulenten eller CV-en. Neste fulle synk merker vedkommende som sluttet.',
      details: { processed: false },
    };
  }
  return {
    type: 'error',
    title: 'Oppdatering feilet',
    message: 'Flowcase svarte ikke som forventet. Prøv igjen om litt.',
    details: { processed: false },
  };
}

/** One sentence on the vectors, from the refresh the backend ran for this one person. */
export function describeVectorRefresh(refresh: ConsultantSyncResponse['embeddings']): string {
  if (!refresh) return 'Søkevektorene ble ikke rørt, embeddings er slått av.';
  const whole = refresh.wholeCv;
  const chunks = refresh.chunks;
  if (!whole && !chunks) return 'Søkevektorene ble ikke rørt.';

  const processed = (whole?.processed ?? 0) + (chunks?.processed ?? 0);
  if (processed === 0) {
    return 'Ingen søkevektorer: CV-en har ikke innhold nok, eller personen er merket som sluttet.';
  }
  if ((chunks?.rateLimited ?? 0) > 0) {
    return 'Embedding-tjenesten stoppet på kvote; søkevektorene oppdateres ved neste synk.';
  }
  if ((whole?.failed ?? 0) + (chunks?.failed ?? 0) > 0) {
    return 'Søkevektorene kunne ikke oppdateres. Se loggen.';
  }
  const written = (whole?.created ?? 0) + (whole?.updated ?? 0) + (chunks?.created ?? 0) + (chunks?.updated ?? 0);
  return written > 0
    ? 'Søkevektorene er oppdatert fra den nye teksten.'
    : 'Søkevektorene var allerede i samsvar med CV-en, ingen kall til embedding-tjenesten.';
}
