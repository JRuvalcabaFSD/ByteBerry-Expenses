import jwksClient, { JwksClient as JwksRsaClient } from 'jwks-rsa';

import type { IConfig } from '@interfaces';
import { getErrMessage, Injectable, JwksError } from '@shared';

//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		JwksClient: JwksClient;
	}
}

/**
 * Client for fetching and managing JSON Web Key Set (JWKS) signing keys.
 *
 * This class provides a wrapper around the `jwks-rsa` library to handle OAuth2 JWKS
 * key retrieval with built-in caching and rate limiting capabilities.
 *
 * @class JwksClient
 *
 * @example
 * ```typescript
 * const config = { oauth2JwksUrl: 'https://example.com/.well-known/jwks.json', jwksCacheMaxAge: 600000 };
 * const client = new JwksClient(config);
 * const publicKey = await client.getSigningKey('key-id');
 * ```
 */

@Injectable({ name: 'JwksClient', depends: ['Config'] })
export class JwksClient {
	private client: JwksRsaClient;
	private readonly jwksUrl: string;
	private readonly cacheMaxAge: number;

	constructor(private readonly config: IConfig) {
		if (!config.oauth2JwksUrl) throw new JwksError('JWKS URL is required');
		this.cacheMaxAge = config.jwksCacheMaxAge;

		this.jwksUrl = config.oauth2JwksUrl;
		this.client = jwksClient({
			jwksUri: this.jwksUrl,
			cache: true,
			cacheMaxAge: this.cacheMaxAge,
			rateLimit: true,
			jwksRequestsPerMinute: 10,
		});
	}

	/**
	 * Retrieves the public key for a given key ID from the JWKS client.
	 * @param kid - The key ID to retrieve the signing key for
	 * @returns A promise that resolves to the public key string
	 * @throws {JwksError} If the signing key retrieval fails
	 */

	public async getSigningKey(kid: string): Promise<string> {
		try {
			const key = await this.client.getSigningKey(kid);
			return key.getPublicKey();
		} catch (error) {
			throw new JwksError(`Failed to get signing key: ${getErrMessage(error)}`);
		}
	}

	/**
	 * Retrieves the JWKS (JSON Web Key Set) URL.
	 * @returns {string} The JWKS URL used for validating JWT signatures.
	 */

	public getJwksUrl(): string {
		return this.jwksUrl;
	}

	public getClient(): JwksRsaClient {
		return this.client;
	}
}
