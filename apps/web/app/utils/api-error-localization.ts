/**
 * Present API failures in the active UI language. Server messages and status
 * remain unchanged; this module only selects safe client-facing display text.
 * The author's edited content is never mutated by an error translation.
 */
export type ApiErrorMessageKey =
  | 'apiErrorInvalid'
  | 'apiErrorUnauthenticated'
  | 'apiErrorForbidden'
  | 'apiErrorNotFound'
  | 'apiErrorConflict'
  | 'apiErrorDuplicateSpelling';

type ApiPayload = { message?: unknown; code?: unknown; statusCode?: unknown };
type ApiFailure = { data?: unknown; status?: unknown; statusCode?: unknown };

function payload(error: unknown): { message?: unknown; code?: unknown; statusCode?: unknown } {
  if (!error || typeof error !== 'object') return {};
  const result = error as ApiFailure;
  if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data)) return {};
  return result.data as ApiPayload;
}
function statusCode(error: unknown, data: ApiPayload): number | null {
  if (!error || typeof error !== 'object') return null;
  const failure = error as ApiFailure;
  const status = failure.statusCode ?? failure.status ?? data.statusCode;
  return typeof status === 'number' && Number.isInteger(status) ? status : null;
}
export function localizeApiError(
  error: unknown, language: string,
  t: (key: ApiErrorMessageKey) => string,
  fallback: string,
): string {
  const data = payload(error);
  if (language !== 'en') {
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    if (Array.isArray(data.message)) {
      const messages = data.message.filter(
        (value): value is string => typeof value === 'string' && !!value.trim(),
      );
      if (messages.length) return messages.join(' / ');
    }
    return fallback;
  }
  if (data.code === 'duplicate-spelling') return t('apiErrorDuplicateSpelling');
  switch (statusCode(error, data)) {
    case 400: return t('apiErrorInvalid');
    case 401: return t('apiErrorUnauthenticated');
    case 403: return t('apiErrorForbidden');
    case 404: return t('apiErrorNotFound');
    case 409: return t('apiErrorConflict');
    default: return fallback;
  }
}
