import { NextFunction, Request, RequestHandler, Response } from 'express';

import { JwtTokenVO } from '@domain';
import { IJwtPayload, IJwtVerifier } from '@interfaces';
import { InvalidCredentialsError } from '@shared';

/**
 * Creates an Express middleware for authenticating requests using JWT.
 *
 * - In `test` mode, expects an `X-Test-User-Id` header and injects a mock JWT payload into `req.user`.
 * - In other environments, expects a valid `Authorization: Bearer <token>` header, verifies the JWT,
 *   and attaches the decoded payload to `req.user`.
 *
 * @param jwtVerifier - An instance implementing `IJwtVerifier` to verify JWT tokens.
 * @returns An Express `RequestHandler` middleware function.
 *
 * @throws {InvalidCredentialsError} If required headers are missing or invalid.
 */

export function createAuthMiddleware(jwtVerifier: IJwtVerifier): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			if (process.env.NODE_ENV === 'test') {
				const testUserId = req.headers['x-test-user-id'] as string;

				if (!testUserId) {
					throw new InvalidCredentialsError('X-Test-User-Id header is required in test mode');
				}

				// Mock JWT payload for tests
				const mockPayload: IJwtPayload = {
					sub: testUserId,
					iat: Math.floor(Date.now() / 1000),
					exp: Math.floor(Date.now() / 1000) + 3600,
					iss: 'byteberry-test',
					client_id: 'test-client',
					scope: 'read write',
				};

				req.user = mockPayload;
				return next();
			}

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
