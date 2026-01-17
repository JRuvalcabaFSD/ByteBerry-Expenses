import { DatabaseError, ConflictError, handledPrismaError, NotFoundRecordError } from '@shared';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

describe('Database Errors', () => {
	describe('DatabaseError base class', () => {
		it('should create DatabaseError with default message', () => {
			const error = new DatabaseError();

			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe('Database operation failed');
			expect(error.statusCode).toBe(422);
			expect(error.errorType).toBe('database');
		});

		it('should create DatabaseError with custom message', () => {
			const error = new DatabaseError('Custom database error');

			expect(error.message).toBe('Custom database error');
			expect(error.statusCode).toBe(422);
			expect(error.errorType).toBe('database');
		});

		it('should create DatabaseError with cause', () => {
			const cause = new Error('Original error');
			const error = new DatabaseError('Database failed', cause);

			expect(error.message).toBe('Database failed');
			expect(error.cause).toBe(cause);
		});

		it('should capture stack trace', () => {
			const error = new DatabaseError('Test error');
			expect(error.stack).toBeDefined();
		});
	});

	describe('ConflictError', () => {
		it('should create ConflictError with message', () => {
			const error = new ConflictError('Duplicate entry found');

			expect(error).toBeInstanceOf(DatabaseError);
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('ConflictError');
			expect(error.message).toBe('Duplicate entry found');
			expect(error.statusCode).toBe(422);
			expect(error.errorType).toBe('database');
			expect(error.cause).toBe('Registros duplicados');
		});

		it('should capture stack trace', () => {
			const error = new ConflictError('Conflict detected');
			expect(error.stack).toBeDefined();
		});
	});

	describe('handledPrismaError function', () => {
		describe('P2002 - Unique constraint violation', () => {
			it('should handle P2002 error with target field', () => {
				const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
					code: 'P2002',
					clientVersion: '5.0.0',
					meta: { target: ['email'] },
				});

				const result = handledPrismaError(prismaError);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('UniqueConstraintError');
				expect(result.message).toBe('Unique constraint violated on field: email');
			});

			it('should handle P2002 error with multiple target fields', () => {
				const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
					code: 'P2002',
					clientVersion: '5.0.0',
					meta: { target: ['userId', 'categoryId'] },
				});

				const result = handledPrismaError(prismaError);

				expect(result.message).toBe('Unique constraint violated on field: userId, categoryId');
			});

			it('should handle P2002 error without target field', () => {
				const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
					code: 'P2002',
					clientVersion: '5.0.0',
					meta: {},
				});

				const result = handledPrismaError(prismaError);

				expect(result.message).toBe('Unique constraint violated on field: unknown');
			});
		});

		describe('P2003 - Foreign key constraint violation', () => {
			it('should handle P2003 error', () => {
				const prismaError = new PrismaClientKnownRequestError('Foreign key constraint failed', {
					code: 'P2003',
					clientVersion: '5.0.0',
					meta: { field_name: 'fk_user_id' },
				});

				const result = handledPrismaError(prismaError);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('ForeignKeyConstraintError');
				expect(result.message).toBe('Foreign key constraint violated: fk_user_id');
			});
		});

		describe('P2025 - Record not found', () => {
			it('should handle P2025 error', () => {
				const prismaError = new PrismaClientKnownRequestError('Record to update not found', {
					code: 'P2025',
					clientVersion: '5.0.0',
				});

				const result = handledPrismaError(prismaError);

				expect(result).toBeInstanceOf(NotFoundRecordError);
				expect(result.name).toBe('NotFoundRecordError');
			});
		});

		describe('P2011 - Null constraint violation', () => {
			it('should handle P2011 error', () => {
				const prismaError = new PrismaClientKnownRequestError('Null constraint violation', {
					code: 'P2011',
					clientVersion: '5.0.0',
				});

				const result = handledPrismaError(prismaError);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('UniqueConstraintError');
				expect(result.message).toBe('Unique constraint violated on field: null_constraint');
			});
		});

		describe('Connection errors (P1001, P1003, P1017)', () => {
			it('should handle P1001 error', () => {
				const prismaError = new PrismaClientKnownRequestError('Cannot reach database server', {
					code: 'P1001',
					clientVersion: '5.0.0',
				});

				const result = handledPrismaError(prismaError);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('DatabaseConnectionError');
				expect(result.message).toBe('Database connection failed or timeout');
			});

			it('should handle P1003 error', () => {
				const prismaError = new PrismaClientKnownRequestError('Database does not exist', {
					code: 'P1003',
					clientVersion: '5.0.0',
				});

				const result = handledPrismaError(prismaError);

				expect(result.name).toBe('DatabaseConnectionError');
				expect(result.message).toBe('Database connection failed or timeout');
			});

			it('should handle P1017 error', () => {
				const prismaError = new PrismaClientKnownRequestError('Server closed connection', {
					code: 'P1017',
					clientVersion: '5.0.0',
				});

				const result = handledPrismaError(prismaError);

				expect(result.name).toBe('DatabaseConnectionError');
				expect(result.message).toBe('Database connection failed or timeout');
			});
		});

		describe('Unknown Prisma errors', () => {
			it('should handle unknown Prisma error code as DatabaseConnectionError', () => {
				const prismaError = new PrismaClientKnownRequestError('Unknown error', {
					code: 'P9999',
					clientVersion: '5.0.0',
				});

				const result = handledPrismaError(prismaError);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('DatabaseConnectionError');
			});
		});

		describe('Non-Prisma errors', () => {
			it('should handle generic Error as DatabaseConnectionError', () => {
				const genericError = new Error('Some random error');

				const result = handledPrismaError(genericError);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('DatabaseConnectionError');
				expect(result.cause).toBe(genericError);
			});

			it('should handle string error as DatabaseConnectionError', () => {
				const result = handledPrismaError('string error');

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('DatabaseConnectionError');
			});

			it('should handle null error as DatabaseConnectionError', () => {
				const result = handledPrismaError(null);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('DatabaseConnectionError');
			});

			it('should handle undefined error as DatabaseConnectionError', () => {
				const result = handledPrismaError(undefined);

				expect(result).toBeInstanceOf(DatabaseError);
				expect(result.name).toBe('DatabaseConnectionError');
			});
		});

		describe('Production environment behavior', () => {
			const originalEnv = process.env.NODE_ENV;

			afterEach(() => {
				process.env.NODE_ENV = originalEnv;
			});

			it('should remove stack trace in production', () => {
				process.env.NODE_ENV = 'production';

				const prismaError = new PrismaClientKnownRequestError('Error', {
					code: 'P2002',
					clientVersion: '5.0.0',
					meta: { target: ['email'] },
				});

				const result = handledPrismaError(prismaError);

				expect(result.stack).toBeUndefined();
			});

			it('should keep stack trace in development', () => {
				process.env.NODE_ENV = 'development';

				const prismaError = new PrismaClientKnownRequestError('Error', {
					code: 'P2002',
					clientVersion: '5.0.0',
					meta: { target: ['email'] },
				});

				const result = handledPrismaError(prismaError);

				expect(result.stack).toBeDefined();
			});
		});
	});

	describe('Error inheritance chain', () => {
		it('should maintain proper inheritance for DatabaseError', () => {
			const error = new DatabaseError('test');

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(DatabaseError);
		});

		it('should maintain proper inheritance for ConflictError', () => {
			const error = new ConflictError('test');

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(DatabaseError);
			expect(error).toBeInstanceOf(ConflictError);
		});

		it('should preserve cause chain in errors', () => {
			const originalError = new Error('Original');
			const dbError = new DatabaseError('Database failed', originalError);

			expect(dbError.cause).toBe(originalError);
		});
	});
});
