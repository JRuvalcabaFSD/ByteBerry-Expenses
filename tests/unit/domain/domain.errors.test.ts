import { AppError, ValueObjectError } from "@domain";

describe('AppError', () => {
	it('should create an AppError with message and errorType', () => {
		const error = new AppError('Test message', 'domain');
		expect(error.message).toBe('Test message');
		expect(error.errorType).toBe('domain');
	});

	it('should have the correct name', () => {
		const error = new AppError('Test', 'http');
		expect(error.name).toBe('AppError');
	});

	it('should be an instance of Error', () => {
		const error = new AppError('Test', 'config');
		expect(error).toBeInstanceOf(Error);
	});

	it('should set context when provided', () => {
		const context = { userId: 123 };
		const error = new AppError('Test', 'oauth', context);
		expect(error.context).toEqual(context);
	});

	it('should not have context when not provided', () => {
		const error = new AppError('Test', 'bootstrap');
		expect(error.context).toBeUndefined();
	});

	it('should capture stack trace', () => {
		const error = new AppError('Test', 'container');
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain('AppError');
	});
});

describe('ValueObjectError', () => {
	it('should create a ValueObjectError with message', () => {
		const error = new ValueObjectError('Invalid value');
		expect(error.message).toBe('Invalid value');
		expect(error.errorType).toBe('domain');
	});

	it('should have the correct name', () => {
		const error = new ValueObjectError('Test');
		expect(error.name).toBe('ValueObjectError');
	});

	it('should be an instance of Error and AppError', () => {
		const error = new ValueObjectError('Test');
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(AppError);
	});

	it('should not have context', () => {
		const error = new ValueObjectError('Test');
		expect(error.context).toBeUndefined();
	});

	it('should capture stack trace', () => {
		const error = new ValueObjectError('Test');
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain('ValueObjectError');
	});
});
