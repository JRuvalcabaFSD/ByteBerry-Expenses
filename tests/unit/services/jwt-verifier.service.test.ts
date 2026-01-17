import jwt, { JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import type { IConfig } from '@interfaces';
import { InvalidCredentialsError } from '@shared';
import { JwtVerifier } from '@infrastructure';
import { Mock } from 'vitest';

// Mock the dependencies
vi.mock('jsonwebtoken', async () => {
	const actual = await vi.importActual<any>('jsonwebtoken');
	const mocked = {
		...actual,
		decode: vi.fn(),
		verify: vi.fn(),
		TokenExpiredError: actual.TokenExpiredError,
		JsonWebTokenError: actual.JsonWebTokenError,
		NotBeforeError: actual.NotBeforeError,
	};
	return {
		default: mocked,
		JwtPayload: actual.JwtPayload,
		VerifyOptions: actual.VerifyOptions,
		TokenExpiredError: actual.TokenExpiredError,
		JsonWebTokenError: actual.JsonWebTokenError,
		NotBeforeError: actual.NotBeforeError,
	};
});
vi.mock('jwks-rsa');

describe('JwtVerifier', () => {
	let jwtVerifier: JwtVerifier;
	let mockJwksClient: any;
	let mockConfig: IConfig;

	beforeEach(() => {
		mockJwksClient = {};
		mockConfig = {
			jwtIssuer: 'expected-issuer',
		} as IConfig;
		jwtVerifier = new JwtVerifier(mockJwksClient, mockConfig);
	});

	describe('verify', () => {
		it('should successfully verify a valid token and return mapped payload', async () => {
			const token = 'valid.jwt.token';
			const kid = 'test-kid';
			const publicKey = 'test-public-key';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const payload: JwtPayload = {
				sub: 'user123',
				iat: 1234567890,
				exp: 1234567900,
				iss: 'expected-issuer',
				client_id: 'client123',
				scope: 'read write',
			};

			(jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockReturnValue(payload);

			const result = await jwtVerifier.verify(token);

			expect(jwt.decode).toHaveBeenCalledWith(token, { complete: true });
			expect(mockJwksClient.getSigningKey).toHaveBeenCalledWith(kid);
			expect(jwt.verify).toHaveBeenCalledWith(token, publicKey, {
				algorithms: ['RS256'],
				issuer: 'expected-issuer',
				complete: false,
			});
			expect(result).toEqual({
				...payload,
				sub: 'user123',
				iat: 1234567890,
				exp: 1234567900,
				iss: 'expected-issuer',
				client_id: 'client123',
				scope: 'read write',
			});
		});

		it('should throw InvalidCredentialsError for invalid token format (missing kid)', async () => {
			const token = 'invalid.jwt.token';
			const decoded = {
				header: {},
				payload: {},
			};

			 (jwt.decode as any).mockReturnValue(decoded);

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Invalid token format: missing key ID');
			await expect(jwtVerifier.verify(token)).rejects.toThrow('Invalid token format: missing key ID');
		});

		it('should throw InvalidCredentialsError for token decoded as string', async () => {
			const token = 'invalid.jwt.token';

			 (jwt.decode as any).mockReturnValue('string');

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Invalid token format: missing key ID');
		});

		it('should throw InvalidCredentialsError for null decoded token', async () => {
			const token = 'invalid.jwt.token';

			 (jwt.decode as any).mockReturnValue(null);

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Invalid token format: missing key ID');
		});

		it('should handle key retrieval failure', async () => {
			const token = 'valid.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockRejectedValue(new Error('Key not found'));

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Token verification failed: Key not found');
		});

		it('should handle TokenExpiredError', async () => {
			const token = 'expired.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw new jwt.TokenExpiredError('jwt expired', new Date());
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Token has expired');
		});

		it('should handle JsonWebTokenError with signature issue', async () => {
			const token = 'invalid.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw new jwt.JsonWebTokenError('invalid signature');
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Invalid token signature');
		});

		it('should handle JsonWebTokenError with issuer issue', async () => {
			const token = 'invalid.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw new jwt.JsonWebTokenError('jwt issuer invalid. expected: expected-issuer');
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Invalid token issuer');
		});

		it('should handle JsonWebTokenError with malformed token', async () => {
			const token = 'malformed.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw new jwt.JsonWebTokenError('jwt malformed');
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Malformed token');
		});

		it('should handle JsonWebTokenError with generic message', async () => {
			const token = 'invalid.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw new jwt.JsonWebTokenError('some other error');
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Token validation failed: some other error');
		});

		it('should handle JsonWebTokenError without message', async () => {
			const token = 'invalid.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';
			const error = new jwt.JsonWebTokenError('');
			error.message = '';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw error;
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Invalid token');
		});

		it('should handle NotBeforeError', async () => {
			const token = 'notyet.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw new jwt.NotBeforeError('jwt not active', new Date());
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Token validation failed: jwt not active');
		});

		it('should handle generic Error', async () => {
			const token = 'error.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw new Error('Generic error');
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Token verification failed: Generic error');
		});

		it('should handle unknown error', async () => {
			const token = 'unknown.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw 'unknown error';
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow('Token verification failed');
		});

		it('should return existing InvalidCredentialsError unchanged', async () => {
			const token = 'invalid.jwt.token';
			const kid = 'test-kid';
			const decoded = {
				header: { kid },
				payload: {},
			};
			const publicKey = 'test-public-key';
			const originalError = new InvalidCredentialsError('Original error');

			 (jwt.decode as any).mockReturnValue(decoded);
			mockJwksClient.getSigningKey = vi.fn().mockResolvedValue(publicKey);
			(jwt.verify as any).mockImplementation(() => {
				throw originalError;
			});

			await expect(jwtVerifier.verify(token)).rejects.toThrow(originalError);
		});
	});

	describe('mapPayload', () => {
		it('should map payload with all fields present', () => {
			const payload: JwtPayload = {
				sub: 'user123',
				iat: 1234567890,
				exp: 1234567900,
				iss: 'issuer',
				client_id: 'client123',
				scope: 'read write',
				extra: 'field',
			};

			const result = (jwtVerifier as any).mapPayload(payload);

			expect(result).toEqual({
				...payload,
				sub: 'user123',
				iat: 1234567890,
				exp: 1234567900,
				iss: 'issuer',
				client_id: 'client123',
				scope: 'read write',
			});
		});

		it('should map payload with missing fields using defaults', () => {
			const payload: JwtPayload = {};

			const result = (jwtVerifier as any).mapPayload(payload);

			expect(result).toEqual({
				...payload,
				sub: '',
				iat: 0,
				exp: 0,
				iss: '',
				client_id: undefined,
				scope: undefined,
			});
		});
	});
});
