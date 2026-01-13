//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		JwtVerifier: IJwtVerifier;
	}
}

/**
 * Represents the payload of a JWT (JSON Web Token) used for authentication.
 *
 * @property sub - Subject identifier (usually the user ID).
 * @property iat - Issued at timestamp (seconds since epoch).
 * @property exp - Expiration timestamp (seconds since epoch).
 * @property iss - Issuer of the token.
 * @property client_id - (Optional) Client identifier associated with the token.
 * @property scope - (Optional) Scope of access granted by the token.
 * @property [key: string] - Additional custom claims as key-value pairs.
 */

export interface IJwtPayload {
	sub: string;
	iat: number;
	exp: number;
	iss: string;
	client_id?: string | undefined;
	scope?: string | undefined;
	[key: string]: unknown;
}

export interface IJwtVerifier {
	/**
	 * Verifies the given JWT token and returns its payload.
	 *
	 * @param {string} token - The JWT token to verify.
	 * @return {*}  {Promise<IJwtPayload>} - A promise that resolves to the JWT payload if the token is valid.
	 * @memberof IJwtVerifier
	 */

	verify(token: string): Promise<IJwtPayload>;
}
