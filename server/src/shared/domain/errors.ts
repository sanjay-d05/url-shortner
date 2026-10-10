export type ErrorKind =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'forbidden'
  | 'unauthorized'
  | 'gone';

/** Framework-agnostic error. The presentation layer maps `kind` to an HTTP status. */
export class DomainError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
