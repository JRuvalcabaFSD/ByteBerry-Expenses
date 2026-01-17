import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import type { IExpensesRepository, ILogger } from '@interfaces';
import { ListExpenseRequestDTO, ListExpensesUseCase, ExpenseResponseDTO } from '@application';

// Mock data and helpers
const mockExpenseEntity = (id: string, userId: string) => ({
	id,
	userId,
	amount: 100,
	description: 'Test expense',
	category: null,
	expenseDate: new Date(),
	createdAt: new Date(),
	updatedAt: new Date(),
	getAmountInDollars: vi.fn(() => 1),
	isToday: vi.fn(() => false),
	getFormattedDate: vi.fn(() => '2024-06-01'),
	toJSON: vi.fn(),
});

const mockExpenseDTO = (entity: any) => ({
	id: entity.id,
	userId: entity.userId,
	description: entity.description,
	amountInDollars: entity.amount / 100,
	category: entity.category,
	expenseDate: entity.expenseDate.toISOString().split('T')[0],
	createdAt: entity.createdAt.toISOString(),
	updatedAt: entity.updatedAt.toISOString(),
});

describe('ListExpensesUseCase', () => {
	let repository: Mocked<IExpensesRepository>;
	let logger: Mocked<ILogger>;
	let useCase: ListExpensesUseCase;

	beforeEach(() => {
		repository = {
			findByUserIdWithPagination: vi.fn(),
			countByUserId: vi.fn(),
		} as any;

		logger = {
			info: vi.fn(),
			debug: vi.fn(),
		} as any;

		useCase = new ListExpensesUseCase(repository, logger);

		// Mock ExpenseResponseDTO.fromEntity
		vi.spyOn(ExpenseResponseDTO, 'fromEntity').mockImplementation((entity) => mockExpenseDTO(entity) as any);
	});

	it('should list expenses with default pagination', async () => {
		const userId = 'user-1';
		const expenses = [mockExpenseEntity('1', userId), mockExpenseEntity('2', userId)];
		repository.findByUserIdWithPagination.mockResolvedValue(expenses);
		repository.countByUserId.mockResolvedValue(25);

		const request: ListExpenseRequestDTO = { userId };
		const result = await useCase.execute(request, 'req-1');

		expect(repository.findByUserIdWithPagination).toHaveBeenCalledWith(userId, 0, 20);
		expect(repository.countByUserId).toHaveBeenCalledWith(userId);
		expect(result.expenses).toEqual(expenses.map(mockExpenseDTO));
		expect(result.total).toBe(25);
		expect(result.skip).toBe(0);
		expect(result.take).toBe(20);
		expect(result.hasMore).toBe(true);
	});

	it('should apply skip and take from request', async () => {
		const userId = 'user-2';
		const expenses = [mockExpenseEntity('3', userId)];
		repository.findByUserIdWithPagination.mockResolvedValue(expenses);
		repository.countByUserId.mockResolvedValue(5);

		const request: ListExpenseRequestDTO = { userId, skip: 2, take: 2 };
		const result = await useCase.execute(request, 'req-2');

		expect(repository.findByUserIdWithPagination).toHaveBeenCalledWith(userId, 2, 2);
		expect(result.skip).toBe(2);
		expect(result.take).toBe(2);
		expect(result.hasMore).toBe(true);
	});

	it('should not allow take greater than MAX_TAKE', async () => {
		const userId = 'user-3';
		const expenses = Array.from({ length: 100 }, (_, i) => mockExpenseEntity(`${i}`, userId));
		repository.findByUserIdWithPagination.mockResolvedValue(expenses);
		repository.countByUserId.mockResolvedValue(200);

		const request: ListExpenseRequestDTO = { userId, take: 150 };
		const result = await useCase.execute(request, 'req-3');

		expect(repository.findByUserIdWithPagination).toHaveBeenCalledWith(userId, 0, 100);
		expect(result.take).toBe(100);
		expect(result.hasMore).toBe(true);
	});

	it('should set hasMore to false if no more expenses', async () => {
		const userId = 'user-4';
		const expenses = [mockExpenseEntity('1', userId)];
		repository.findByUserIdWithPagination.mockResolvedValue(expenses);
		repository.countByUserId.mockResolvedValue(1);

		const request: ListExpenseRequestDTO = { userId, skip: 0, take: 1 };
		const result = await useCase.execute(request, 'req-4');

		expect(result.hasMore).toBe(false);
	});

	it('should log execution steps', async () => {
		const userId = 'user-5';
		repository.findByUserIdWithPagination.mockResolvedValue([]);
		repository.countByUserId.mockResolvedValue(0);

		const request: ListExpenseRequestDTO = { userId };
		await useCase.execute(request, 'req-5');

		expect(logger.info).toHaveBeenCalledWith('[ListExpensesUseCase.execute] Executing ListExpensesUseCase', expect.objectContaining({ userId }));
		expect(logger.debug).toHaveBeenCalledWith('[ListExpensesUseCase.execute] Fetching expenses from repository', expect.objectContaining({ userId }));
		expect(logger.info).toHaveBeenCalledWith('[ListExpensesUseCase.execute] Expenses retrieved successfully', expect.objectContaining({ userId }));
	});
});
