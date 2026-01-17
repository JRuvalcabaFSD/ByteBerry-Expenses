import { AppError } from '@domain';

/**
 * Error thrown when there is an issue retrieving or validating JSON Web Key Set (JWKS).
 * Extends {@link AppError} with additional context for OAuth-related JWKS failures.
 *
 * @extends AppError
 * @example
 * ```typescript
 * throw new JwksError('Failed to fetch JWKS', 'Network timeout');
 * ```
 */

export class JwksError extends AppError {
	public readonly cause?: string;
	constructor(msg: string, cause?: string) {
		super(msg, 'oauth');
		this.cause = cause;
		this.name = 'JwksError';

		Error.captureStackTrace(this, JwksError);
	}
}
