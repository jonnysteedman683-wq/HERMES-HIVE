/**
 * Typed application errors for the HERMES HIVE server.
 *
 * These extend the standard Error with an HTTP status code so the API
 * middleware can translate them into consistent JSON error responses
 * (e.g. `{ error, code, ...details }`) instead of a generic 500.
 *
 * Contract notes:
 * - ValidationError carries `missingFields` so callers know exactly which
 *   request fields were absent (used by the input-validation middleware).
 * - These types are shared (server + future client); keep them framework-free.
 */

/** Stable machine-readable error codes. */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED';

export interface SerializedError {
  error: string;
  code: ErrorCode | string;
  statusCode: number;
  [key: string]: unknown;
}

/** Base class for all domain errors that map to an HTTP status. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode | string;
  /** Optional structured details (e.g. missingFields). */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode | string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Restore prototype chain (TS target ES2022 + extending built-ins).
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Convert to a JSON-safe object for the API response body. */
  toJSON(): SerializedError {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details ?? {}),
    };
  }
}

/** 400 — malformed/incomplete request payload. */
export class ValidationError extends AppError {
  /** Names of the request fields that were missing or empty. */
  public readonly missingFields: string[];

  constructor(message: string, missingFields: string[] = [], details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', { missingFields, ...details });
    this.missingFields = missingFields;
  }
}

/** 404 — requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/** 401 — authentication/authorization required or failed. */
export class AuthError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/** Type guard for AppError instances. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError || (err instanceof Error && 'statusCode' in err);
}

/**
 * Normalize any thrown value into a SerializedError.
 * Unknown errors become a 500 with a generic message.
 */
export function normalizeError(err: unknown): SerializedError {
  if (isAppError(err)) {
    return err.toJSON();
  }
  if (err instanceof Error) {
    return {
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      message: err.message,
    };
  }
  return {
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    message: String(err),
  };
}
