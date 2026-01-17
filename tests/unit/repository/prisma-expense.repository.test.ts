import { ExpenseEntity } from '@domain';
import type { ILogger, UpdateExpense } from '@interfaces';
import { DBConfig } from '@config';
import { PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundRecordError, handledPrismaError } from '@shared';
import { ExpensesRepository } from '@infrastructure'

vi.mock('@shared', async () => {
	const actual = await vi.importActual<any>('@shared');
	return {
		...actual,
		ForbiddenError: vi.fn(),
		NotFoundRecordError: vi.fn(),
		handledPrismaError: vi.fn(),
		getErrMessage: vi.fn((error) => error.message || 'error'),
	};
});

vi.mock('@config', () => ({
	DBConfig: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
	PrismaClient: vi.fn(),
}));

describe('ExpensesRepository', () => {
	let repository: ExpensesRepository;
	let mockLogger: ILogger;
	let mockDbConfig: DBConfig;
	let mockClient: any;

	beforeEach(() => {
		mockLogger = {
			debug: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			info: vi.fn(),
			child: vi.fn(),
			log: vi.fn(),
			checkHealth: vi.fn(),
		} as any;
		mockClient = {
			expenses: {
				create: vi.fn(),
				findUnique: vi.fn(),
				findMany: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
			},
		};
		mockDbConfig = {
			getClient: vi.fn(() => mockClient),
		} as any;
		repository = new ExpensesRepository(mockLogger, mockDbConfig);

		// Mock ExpenseEntity.create to return the data as is
		vi.spyOn(ExpenseEntity, 'create').mockImplementation((data) => data as any);
	});

	describe('create', () => {
		it('should create an expense successfully', async () => {
			const expense = { id: '1', userId: 'user1', category: 'food' };
			const createdData = { ...expense };
			(mockClient.expenses.create as any).mockResolvedValue(createdData);


			const result = await repository.create(expense as any);

			expect(mockClient.expenses.create).toHaveBeenCalledWith({ data: { ...expense, category: 'food' } });
			expect(mockLogger.debug).toHaveBeenCalledWith('[ExpensesRepository.create] Creating expense in database', { expenseId: '1', userId: 'user1' });
			expect(mockLogger.debug).toHaveBeenCalledWith('[ExpensesRepository.create] Expense created successfully', { expenseId: '1', userId: 'user1' });
			expect(result).toEqual(createdData);
		});

		it('should handle errors during creation', async () => {
			const expense = { id: '1', userId: 'user1' };
			const error = new Error('DB error');
			mockClient.expenses.create.mockRejectedValue(error);
			(handledPrismaError as any).mockReturnValue(error);

			await expect(repository.create(expense as any)).rejects.toThrow();
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return expense if found', async () => {
			const data = { id: '1', userId: 'user1' };
			mockClient.expenses.findUnique.mockResolvedValue(data);

			const result = await repository.findById('1');

			expect(mockClient.expenses.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
			expect(result).toEqual(data);
		});

		it('should return null if not found', async () => {
			mockClient.expenses.findUnique.mockResolvedValue(null);

			const result = await repository.findById('1');

			expect(result).toBeNull();
		});

		it('should handle errors', async () => {
			const error = new Error('DB error');
			mockClient.expenses.findUnique.mockRejectedValue(error);
			(handledPrismaError as any).mockReturnValue(error);

			await expect(repository.findById('1')).rejects.toThrow();
		});
	});

	describe('findByUserId', () => {
		it('should return expenses for user', async () => {
			const expenses = [{ id: '1', userId: 'user1' }];
			mockClient.expenses.findMany.mockResolvedValue(expenses);

			const result = await repository.findByUserId('user1');

			expect(mockClient.expenses.findMany).toHaveBeenCalledWith({ where: { userId: 'user1' }, orderBy: { expenseDate: 'desc' } });
			expect(result).toEqual(expenses);
		});

		it('should handle errors', async () => {
			const error = new Error('DB error');
			mockClient.expenses.findMany.mockRejectedValue(error);
			(handledPrismaError as any).mockReturnValue(error);

			await expect(repository.findByUserId('user1')).rejects.toThrow();
		});
	});

	describe('findByUserIdWithPagination', () => {
		it('should return paginated expenses', async () => {
			const expenses = [{ id: '1', userId: 'user1' }];
			mockClient.expenses.findMany.mockResolvedValue(expenses);

			const result = await repository.findByUserIdWithPagination('user1', 0, 10);

			expect(mockClient.expenses.findMany).toHaveBeenCalledWith({ where: { userId: 'user1' }, orderBy: { expenseDate: 'desc' }, skip: 0, take: 10 });
			expect(result).toEqual(expenses);
		});

		it('should return empty array if no expenses', async () => {
			mockClient.expenses.findMany.mockResolvedValue([]);

			const result = await repository.findByUserIdWithPagination('user1', 0, 10);

			expect(result).toEqual([]);
		});

		it('should handle errors', async () => {
			const error = new Error('DB error');
			mockClient.expenses.findMany.mockRejectedValue(error);
			(handledPrismaError as any).mockReturnValue(error);

			await expect(repository.findByUserIdWithPagination('user1', 0, 10)).rejects.toThrow();
		});
	});

	describe('update', () => {
		it('should update expense successfully', async () => {
			const existing = { id: '1', userId: 'user1', category: 'food' };
			const updates: UpdateExpense = { amount: 100 };
			const updatedData = { ...existing, ...updates };
			mockClient.expenses.findUnique.mockResolvedValue(existing);
			mockClient.expenses.update.mockResolvedValue(updatedData);

			const result = await repository.update('1', 'user1', updates);

			expect(mockClient.expenses.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { ...updates, category: 'food' } });
			expect(result).toEqual(updatedData);
			expect(mockLogger.debug).toHaveBeenCalledWith('[ExpensesRepository.update] Updating expense with ownership verification', { expenseId: '1', userId: 'user1' });
			expect(mockLogger.debug).toHaveBeenCalledWith('[ExpensesRepository.update] Expense updated successfully', { expenseId: '1' });
		});

		it('should throw NotFoundRecordError if expense not found', async () => {
			mockClient.expenses.findUnique.mockResolvedValue(null);
			(NotFoundRecordError as any).mockImplementation((message: string) => { throw new Error('Not found'); });
			(handledPrismaError as any).mockImplementation((err: unknown) => err);

			await expect(repository.update('1', 'user1', {})).rejects.toThrow('Not found');
		});

		it('should throw ForbiddenError if user does not own expense', async () => {
			const existing = { id: '1', userId: 'user2' };
			mockClient.expenses.findUnique.mockResolvedValue(existing);
			(ForbiddenError as any).mockImplementation((message: string) => { throw new Error('Forbidden'); });
			(handledPrismaError as any).mockImplementation((err: unknown) => err);

			await expect(repository.update('1', 'user1', {})).rejects.toThrow('Forbidden');
		});

		it('should handle errors', async () => {
			const error = new Error('DB error');
			mockClient.expenses.findUnique.mockResolvedValue({ id: '1', userId: 'user1' });
			mockClient.expenses.update.mockRejectedValue(error);
			(handledPrismaError as any).mockReturnValue(error);

			await expect(repository.update('1', 'user1', {})).rejects.toThrow();
		});
	});

	describe('delete', () => {
		it('should delete expense successfully', async () => {
			const existing = { id: '1', userId: 'user1' };
			mockClient.expenses.findUnique.mockResolvedValue(existing);
			mockClient.expenses.delete.mockResolvedValue(undefined);

			await repository.delete('1', 'user1');

			expect(mockClient.expenses.delete).toHaveBeenCalledWith({ where: { id: '1' } });
			expect(mockLogger.debug).toHaveBeenCalledWith('[ExpensesRepository.delete] Deleting expense with ownership verification', { expenseId: '1', userId: 'user1' });
			expect(mockLogger.debug).toHaveBeenCalledWith('[ExpensesRepository.delete] Expense deleted successfully', { expenseId: '1', userId: 'user1' });
		});

		it('should throw NotFoundRecordError if expense not found', async () => {
			mockClient.expenses.findUnique.mockResolvedValue(null);
			(NotFoundRecordError as any).mockImplementation((message: string) => { throw new Error('Not found'); });
			(handledPrismaError as any).mockImplementation((err: unknown) => err);

			await expect(repository.delete('1', 'user1')).rejects.toThrow('Not found');
		});

		it('should throw ForbiddenError if user does not own expense', async () => {
			const existing = { id: '1', userId: 'user2' };
			mockClient.expenses.findUnique.mockResolvedValue(existing);
			(ForbiddenError as any).mockImplementation((message: string) => { throw new Error('Forbidden'); });
			(handledPrismaError as any).mockImplementation((err: unknown) => err);

			await expect(repository.delete('1', 'user1')).rejects.toThrow('Forbidden');
		});

		it('should handle errors', async () => {
			const error = new Error('DB error');
			mockClient.expenses.findUnique.mockResolvedValue({ id: '1', userId: 'user1' });
			mockClient.expenses.delete.mockRejectedValue(error);
			(handledPrismaError as any).mockReturnValue(error);

			await expect(repository.delete('1', 'user1')).rejects.toThrow();
		});
	});

	describe('countByUserId', () => {
		it('should return count of expenses', async () => {
			mockClient.expenses.count.mockResolvedValue(5);

			const result = await repository.countByUserId('user1');

			expect(mockClient.expenses.count).toHaveBeenCalledWith({ where: { userId: 'user1' } });
			expect(result).toBe(5);
		});

		it('should handle errors', async () => {
			const error = new Error('DB error');
			mockClient.expenses.count.mockRejectedValue(error);
			(handledPrismaError as any).mockReturnValue(error);

			await expect(repository.countByUserId('user1')).rejects.toThrow();
		});
	});
});
