import type { ConsultantSyncResponse } from '../../types/api';
import type { SyncNotification } from './SyncNotificationPanel';

/**
 * What to tell the person who pressed "Oppdater CV", from what the backend answered.
 *
 * The single sync answers 200 in every case and says what happened in counters. Before, the page
 * said "CV oppdatert" whenever the request came back, also when Flowcase no longer had the person
 * (skipped) or did not answer (failed). Success, warning and error are three different things to
 * do next, so they get three different notices.
 */
export function singleSyncNotification(result: ConsultantSyncResponse): SyncNotification {
  if (result.succeeded > 0) {
    return {
      type: 'success',
      title: 'CV oppdatert',
      message: result.created > 0
        ? 'Konsulenten var ny her og er hentet fra Flowcase.'
        : 'CV-en er hentet fra Flowcase og skrevet på nytt.',
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
