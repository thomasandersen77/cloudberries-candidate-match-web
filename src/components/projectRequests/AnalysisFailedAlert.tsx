import React, { useState } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import { reanalyzeDocument } from '../../services/projectRequestsService';
import { apiErrorMessage } from '../../utils/apiError';

type Props = {
  requestId: number;
  /** The server's own words for why the last analysis failed, when it gave any. */
  error?: string | null;
  /** Called after a successful analysis, so the page can read the request again. */
  onAnalysed: () => void;
};

/**
 * The document is stored, but its requirements were not read (plan A5). A failed analysis used to
 * leave a request with an unknown customer and no demands, looking like one that asks for nothing.
 * «Prøv igjen» reads the stored text again; nothing has to be uploaded twice.
 */
const AnalysisFailedAlert: React.FC<Props> = ({ requestId, error, onAnalysed }) => {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const retry = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      await reanalyzeDocument(requestId);
      onAnalysed();
    } catch (e) {
      setRetryError(apiErrorMessage(e) ?? 'Kravtolkingen feilet igjen. Prøv igjen senere.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" disabled={retrying} onClick={() => void retry()}
          startIcon={retrying ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ whiteSpace: 'nowrap' }}>
          {retrying ? 'Tolker…' : 'Prøv igjen'}
        </Button>
      }
    >
      Dokumentet er lagret, men kravtolkingen feilet, så avropet har ingen krav ennå.
      {(retryError ?? error) && <> {retryError ?? error}</>}
    </Alert>
  );
};

export default AnalysisFailedAlert;
