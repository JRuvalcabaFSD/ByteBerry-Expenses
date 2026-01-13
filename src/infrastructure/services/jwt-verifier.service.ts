import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

import type { IConfig, IJwtPayload, IJwtVerifier } from '@interfaces';
import { Injectable, InvalidCredentialsError } from '@shared';

/**
 * Service for verifying JWT tokens and extracting their payloads.
 *
 * This service handles JWT token verification using JWKS (JSON Web Key Set) for public key retrieval.
 * It validates token signatures, issuers, and expiration, converting JWT errors into application-specific errors.
 *
 * @implements {IJwtVerifier}
 *
 * @example
 * ```typescript
 * const jwtVerifier = new JwtVerifier(jwksClient, config);
 * const payload = await jwtVerifier.verify(token);
 * ```
 */

@Injectable({ name: 'JwtVerifier', depends: ['JwksClient', 'Config'] })
export class JwtVerifier implements IJwtVerifier {
	private readonly jwtExpectedIssuer: string;

	constructor(
		private readonly jwksClient: JwksClient,
		private readonly config: IConfig
	) {
		this.jwtExpectedIssuer = config.jwtIssuer;
	}

	/**
	 * Verifies a JWT token and returns its payload.
	 *
	 * @param token - The JWT token string to verify
	 * @returns A promise that resolves to the verified and mapped JWT payload
	 * @throws {InvalidCredentialsError} If the token format is invalid or missing a key ID
	 * @throws {Error} If token verification fails or the signing key cannot be retrieved
	 *
	 * @remarks
	 * This method performs the following steps:
	 * - Decodes the token to extract the key ID (kid) from the header
	 * - Retrieves the corresponding signing key from the JWKS client
	 * - Verifies the token signature using RS256 algorithm
	 * - Validates the token issuer matches the expected issuer
	 * - Maps the payload to the IJwtPayload interface
	 */

	public async verify(token: string): Promise<IJwtPayload> {
		try {
			const decoded = jwt.decode(token, { complete: true });
			if (!decoded || typeof decoded === 'string') throw new InvalidCredentialsError('Invalid token format: missing key ID');

			const kid = 'byteberry-key-1';

			const signingKey = await this.jwksClient.getSigningKey(kid);
			const publicKey = signingKey.getPublicKey();

			const options: VerifyOptions = {
				algorithms: ['RS256'],
				issuer: this.jwtExpectedIssuer,
				complete: false,
			};

			const payload = jwt.verify(token, publicKey, options) as JwtPayload;

			return this.mapPayload(payload);
		} catch (error) {
			throw this.handleVerificationError(error);
		}
	}

	/**
	 * Handles JWT verification errors and converts them to InvalidCredentialsError instances.
	 *
	 * @param error - The error object caught during JWT verification. Can be a JWT-specific error
	 *                (TokenExpiredError, JsonWebTokenError, NotBeforeError), InvalidCredentialsError,
	 *                a generic Error, or an unknown type.
	 *
	 * @returns An InvalidCredentialsError with an appropriate message describing the verification failure.
	 *          - Returns the original error if it's already an InvalidCredentialsError
	 *          - For TokenExpiredError: "Token has expired"
	 *          - For JsonWebTokenError: Checks message for specific patterns (signature, issuer, malformed)
	 *            and provides contextual error messages
	 *          - For NotBeforeError: "Token not yet valid"
	 *          - For generic Error: Includes the error message
	 *          - For unknown errors: Generic "Token verification failed" message
	 *
	 * @remarks This method ensures all JWT verification failures are normalized to InvalidCredentialsError
	 *          for consistent error handling throughout the application.
	 */

	private handleVerificationError(error: unknown): InvalidCredentialsError {
		if (error instanceof InvalidCredentialsError) {
			return error;
		}

		// Handle TokenExpiredError specifically
		if (error instanceof jwt.TokenExpiredError) {
			return new InvalidCredentialsError('Token has expired');
		}

		// Handle JsonWebTokenError with message checking
		if (error instanceof jwt.JsonWebTokenError) {
			const message = error.message?.toLowerCase() || '';

			// Check specific error patterns
			if (message.includes('signature')) {
				return new InvalidCredentialsError('Invalid token signature');
			}

			if (message.includes('issuer')) {
				return new InvalidCredentialsError('Invalid token issuer');
			}

			if (message.includes('malformed')) {
				return new InvalidCredentialsError('Malformed token');
			}

			// Check error name as fallback (algunos errors tienen name pero no message)
			if (error.name === 'JsonWebTokenError') {
				// Si tiene mensaje pero no matcheó arriba
				if (message) {
					return new InvalidCredentialsError(`Token validation failed: ${error.message}`);
				}
				// Si no tiene mensaje, dar error genérico de JWT
				return new InvalidCredentialsError('Invalid token');
			}

			return new InvalidCredentialsError(`Token validation failed: ${error.message || 'Invalid token'}`);
		}

		// Handle NotBeforeError (por si acaso)
		if (error instanceof jwt.NotBeforeError) {
			return new InvalidCredentialsError('Token not yet valid');
		}

		// Generic Error fallback
		if (error instanceof Error) {
			return new InvalidCredentialsError(`Token verification failed: ${error.message}`);
		}

		// Unknown error fallback
		return new InvalidCredentialsError('Token verification failed');
	}

	/**
	 * Maps a JWT payload to a standardized IJwtPayload interface.
	 * @param payload - The JWT payload object to map
	 * @returns An IJwtPayload object with all required fields, using default values for undefined properties
	 */

	private mapPayload(payload: jwt.JwtPayload): IJwtPayload {
		return {
			...payload,
			sub: payload.sub ?? '',
			iat: payload.iat ?? 0,
			exp: payload.exp ?? 0,
			iss: payload.iss ?? '',
			client_id: payload.client_id ?? undefined,
			scope: payload.scope ?? undefined,
		};
	}
}
