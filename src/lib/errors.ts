/**
 * Discriminated union of expected, recoverable error cases.
 * Throw only for unexpected programmer errors or network failures.
 */
export type AppError =
  | { kind: "not_found"; message: string; resource?: string }
  | { kind: "unauthorized"; message: string }
  | { kind: "forbidden"; message: string }
  | { kind: "validation"; message: string; fields?: Record<string, string> }
  | { kind: "business_rule"; message: string; code?: string }
  | { kind: "rate_limited"; message: string; retryAfterSeconds?: number }
  | { kind: "internal"; message: string };

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const err = (error: AppError): Result<never> => ({ ok: false, error });

export const notFound = (resource: string, id?: string): AppError => ({
  kind: "not_found",
  message: id ? `${resource} ${id} not found` : `${resource} not found`,
  resource,
});

export const unauthorized = (message = "Not authenticated"): AppError => ({
  kind: "unauthorized",
  message,
});

export const forbidden = (message = "Not allowed"): AppError => ({
  kind: "forbidden",
  message,
});

export const validation = (
  message: string,
  fields?: Record<string, string>,
): AppError => ({
  kind: "validation",
  message,
  ...(fields ? { fields } : {}),
});

export const businessRule = (message: string, code?: string): AppError => ({
  kind: "business_rule",
  message,
  ...(code ? { code } : {}),
});

export const rateLimited = (retryAfterSeconds?: number): AppError => ({
  kind: "rate_limited",
  message: "Too many requests, please slow down",
  ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
});

export const internal = (message = "Something went wrong"): AppError => ({
  kind: "internal",
  message,
});

/**
 * Convert an unknown thrown value into an AppError without leaking internals.
 */
export function toAppError(e: unknown): AppError {
  if (e && typeof e === "object" && "kind" in e && "message" in e) {
    return e as AppError;
  }
  return internal(e instanceof Error ? e.message : "Unknown error");
}
