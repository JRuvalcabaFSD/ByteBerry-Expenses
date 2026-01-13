import { NextFunction, Request, RequestHandler, Response } from 'express';

import { JwtTokenVO } from '@domain';
import { IJwtVerifier } from '@interfaces';
import { InvalidCredentialsError } from '@shared';

/**
 * Creates an authentication middleware that verifies JWT tokens from the Authorization header.
 *
 * @param jwtVerifier - The JWT verifier instance used to validate and decode tokens
 * @returns An Express middleware function that validates the Authorization header and attaches the decoded JWT payload to the request object
 *
 * @throws {InvalidCredentialsError} If the Authorization header is missing
 * @throws {InvalidCredentialsError} If the Authorization header format is invalid (expected: "Bearer <token>")
 *
 * @example
 * ```typescript
 * const authMiddleware = createAuthMiddleware(jwtVerifier);
 * app.use(authMiddleware);
 * ```
 *
 * @remarks
 * The middleware expects the Authorization header to follow the format: "Bearer <token>".
 * Upon successful verification, the decoded JWT payload is attached to `req.user`.
 * Any errors are passed to the next middleware for centralized error handling.
 */

export function createAuthMiddleware(jwtVerifier: IJwtVerifier): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const authHeader = req.headers.authorization;

			if (!authHeader) throw new InvalidCredentialsError('Authorization header is required');

			const parts = authHeader.split(' ');
			if (parts.length !== 2) throw new InvalidCredentialsError('Invalid Authorization header format. Expected: Bearer <token>');

			const token = JwtTokenVO.create(parts[1]);
			const payload = await jwtVerifier.verify(token.getValue());

			req.user = payload;

			next();
		} catch (error) {
			next(error);
		}
	};
}
