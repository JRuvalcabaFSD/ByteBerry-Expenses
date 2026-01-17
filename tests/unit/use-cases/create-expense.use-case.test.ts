import { ExpenseEntity } from '@domain';
import { CreateExpenseRequestDTO, CreateExpenseUseCase, ExpenseResponseDTO } from '@application';
import type { IExpensesRepository, ILogger, IUuid } from '@interfaces';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

describe('CreateExpenseUseCase', () => {
	let useCase: CreateExpenseUseCase;
	let mockRepository: Mocked<IExpensesRepository>;
	let mockLogger: Mocked<ILogger>;
	let mockUuid: Mocked<IUuid>;

	beforeEach(() => {
		mockRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByUserId: vi.fn(),
			findByUserIdWithPagination: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			countByUserId: vi.fn(),
		} as any;
		mockLogger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
			child: vi.fn(),
			checkHealth: vi.fn(),
		} as any;
		mockUuid = {
			generate: vi.fn(),
			isValid: vi.fn(),
			checkHealth: vi.fn(),
		} as any;
		useCase = new CreateExpenseUseCase(mockRepository, mockLogger, mockUuid);
	});

	describe('execute', () => {
		it('should create an expense successfully with provided data', async () => {
			const request: CreateExpenseRequestDTO = {
				userId: 'user-123',
				amount: 100,
				description: 'Test expense',
				category: 'Food',
				expenseDate: new Date('2023-01-01'),
			};
			const requestId = 'req-123';
			const generatedId = 'expense-456';
			const createdExpense = ExpenseEntity.create({
				id: generatedId,
				userId: request.userId,
				amount: request.amount,
				description: request.description,
				category: request.category ?? null,
				expenseDate: request.expenseDate,
			});

			mockUuid.generate.mockReturnValue(generatedId);
			mockRepository.create.mockResolvedValue(createdExpense);

			const result = await useCase.execute(request, requestId);

			expect(mockUuid.generate).toHaveBeenCalled();
			expect(mockLogger.debug).toHaveBeenCalledWith('[CreateExpenseUseCase.execute] Executing CreateExpenseUseCase', { requestId, userId: request.userId });
			expect(mockLogger.debug).toHaveBeenCalledWith('[CreateExpenseUseCase.execute] Expense entity created', { requestId, expenseId: generatedId, userId: request.userId });
			expect(mockRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: generatedId,
					userId: request.userId,
					amount: request.amount,
					description: request.description,
					category: request.category,
					expenseDate: request.expenseDate,
				})
			);
			expect(mockLogger.debug).toHaveBeenCalledWith('[CreateExpenseUseCase.execute] Expense created successfully', { requestId, expenseId: generatedId, userId: request.userId });
			expect(result).toEqual(ExpenseResponseDTO.fromEntity(createdExpense));
		});

		it('should create an expense with default category and expenseDate when not provided', async () => {
			const request: CreateExpenseRequestDTO = {
				userId: 'user-123',
				amount: 50,
				description: 'Lunch',
				expenseDate: new Date(),
			};
			const requestId = 'req-456';
			const generatedId = 'expense-789';
			const now = new Date();
			const createdExpense = ExpenseEntity.create({
				...request,
				id: generatedId,
				category: null,
			});

			mockUuid.generate.mockReturnValue(generatedId);
			mockRepository.create.mockResolvedValue(createdExpense);

			const result = await useCase.execute(request, requestId);

			expect(mockRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: generatedId,
					userId: request.userId,
					amount: request.amount,
					description: request.description,
					category: null,
					expenseDate: expect.any(Date),
				})
			);
			expect(result).toEqual(ExpenseResponseDTO.fromEntity(createdExpense));
		});
	});
});
