import { vi } from 'vitest';
import { AppError } from '@domain';
import { JwksError } from '@shared';

describe('JwksError', () => {
	it('should be an instance of AppError', () => {
		const error = new JwksError('Test message');
		expect(error).toBeInstanceOf(AppError);
	});

	it('should be an instance of Error', () => {
		const error = new JwksError('Test message');
		expect(error).toBeInstanceOf(Error);
	});

	it('should set the message correctly', () => {
		const message = 'Failed to fetch JWKS';
		const error = new JwksError(message);
		expect(error.message).toBe(message);
	});

	it('should set the name correctly', () => {
		const error = new JwksError('Test message');
		expect(error.name).toBe('JwksError');
	});

	it('should set the cause when provided', () => {
		const cause = 'Network timeout';
		const error = new JwksError('Test message', cause);
		expect(error.cause).toBe(cause);
	});

	it('should have undefined cause when not provided', () => {
		const error = new JwksError('Test message');
		expect(error.cause).toBeUndefined();
	});

	it('should pass the correct category to AppError', () => {
		const error = new JwksError('Test message');
		// Assuming AppError has a errorType property
		expect((error as any).errorType).toBe('oauth');
	});
});
