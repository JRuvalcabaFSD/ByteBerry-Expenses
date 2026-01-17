import { vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { IJwtVerifier } from '@interfaces';
import { InvalidCredentialsError } from '@shared';
import { JwtTokenVO } from '@domain';
import { createAuthMiddleware } from '@presentation';

vi.mock('../../../src/domain/value-objects/token.vo', () => ({
	JwtTokenVO: {
		create: vi.fn(),
	},
}));

describe('createAuthMiddleware', () => {
	let mockJwtVerifier: IJwtVerifier;
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		process.env.NODE_ENV = 'production';
		mockJwtVerifier = {
			verify: vi.fn(),
		};
		mockReq = {
			headers: {},
		};
		mockRes = {};
		mockNext = vi.fn();
	});

	it('should throw InvalidCredentialsError if Authorization header is missing', async () => {
		const middleware = createAuthMiddleware(mockJwtVerifier);

		await middleware(mockReq as Request, mockRes as Response, mockNext);

		expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidCredentialsError));
		expect(mockNext).toHaveBeenCalledWith(
			expect.objectContaining({ message: 'Authorization header is required' })
		);
	});

	it('should throw InvalidCredentialsError if Authorization header format is invalid', async () => {
		(mockReq as any).headers.authorization = 'InvalidToken';
		const middleware = createAuthMiddleware(mockJwtVerifier);

		await middleware(mockReq as Request, mockRes as Response, mockNext);

		expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidCredentialsError));
		expect(mockNext).toHaveBeenCalledWith(
			expect.objectContaining({ message: 'Invalid Authorization header format. Expected: Bearer <token>' })
		);
	});

	it('should verify token and attach payload to req.user on success', async () => {
		const token = 'valid.jwt.token';
		const payload = { userId: 1 };
		(mockReq as any).headers.authorization = `Bearer ${token}`;
		(JwtTokenVO.create as any).mockReturnValue({ getValue: () => token });
		(mockJwtVerifier.verify as any).mockResolvedValue(payload);
		const middleware = createAuthMiddleware(mockJwtVerifier);

		await middleware(mockReq as Request, mockRes as Response, mockNext);

		expect(JwtTokenVO.create).toHaveBeenCalledWith(token);
		expect(mockJwtVerifier.verify).toHaveBeenCalledWith(token);
		expect(mockReq.user).toEqual(payload);
		expect(mockNext).toHaveBeenCalledWith();
	});

	it('should call next with error if token verification fails', async () => {
		const token = 'invalid.jwt.token';
		const error = new Error('Verification failed');
		(mockReq as any).headers.authorization = `Bearer ${token}`;
		(JwtTokenVO.create as any).mockReturnValue({ getValue: () => token });
		(mockJwtVerifier.verify as any).mockRejectedValue(error);
		const middleware = createAuthMiddleware(mockJwtVerifier);

		await middleware(mockReq as Request, mockRes as Response, mockNext);

		expect(mockJwtVerifier.verify).toHaveBeenCalledWith(token);
		expect(mockNext).toHaveBeenCalledWith(error);
	});
});
