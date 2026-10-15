/**
 * Error raised when a business rule is violated.
 * The message is user-facing (Spanish) so the UI can display it directly.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
