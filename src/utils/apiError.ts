/**
 * What the server said about a refused request: its code and its message.
 *
 * A 409 from a job that is already running («Flowcase-synk pågår allerede (nattlig, startet
 * 02:00)») is the answer, not a failure. Pages that showed a fixed «feilet» for every error hid it.
 */
type ApiErrorBody = { error?: unknown; message?: unknown };

function body(error: unknown): ApiErrorBody | undefined {
  return (error as { response?: { data?: ApiErrorBody } })?.response?.data;
}

export function apiErrorCode(error: unknown): string | null {
  const code = body(error)?.error;
  return typeof code === 'string' ? code : null;
}

export function apiErrorMessage(error: unknown): string | null {
  const message = body(error)?.message;
  return typeof message === 'string' && message.trim() ? message : null;
}

/** Refused because the same job is running, or would do nothing new: said, not shown as an error. */
export function isConflict(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 409;
}
