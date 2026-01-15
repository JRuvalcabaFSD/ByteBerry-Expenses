import { ExpenseEntity } from '@domain';
import { Injectable, LogContextClass, LogContextMethod } from '@shared';
import { CreateExpenseRequestDTO, ExpenseResponseDTO } from '@application';
import type { ICreateExpenseUseCase, IExpensesRepository, ILogger, IUuid } from '@interfaces';

/**
 * Use case for creating a new expense.
 *
 * This use case handles the creation of a new expense entity, persisting it to the repository,
 * and returning the created expense as a response DTO.
 *
 * @implements {ICreateExpenseUseCase}
 *
 * @example
 * ```typescript
 * const useCase = new CreateExpenseUseCase(repository, logger, uuid);
 * const response = await useCase.execute(
 *   { userId: '123', amount: 50, description: 'Lunch' },
 *   'request-id-123'
 * );
 * ```
 */

@LogContextClass()
@Injectable({ name: 'CreateExpenseUseCase', depends: ['ExpensesRepository', 'Logger', 'Uuid'] })
export class CreateExpenseUseCase implements ICreateExpenseUseCase {
	constructor(
		private readonly repository: IExpensesRepository,
		private readonly logger: ILogger,
		private readonly uuid: IUuid
	) {}

	/**
	 * Executes the create expense use case.
	 *
	 * @param request - The create expense request DTO containing expense details
	 * @param requestId - The unique identifier for tracking this request
	 * @returns A promise that resolves to the created expense response DTO
	 */

	@LogContextMethod()
	public async execute(request: CreateExpenseRequestDTO, requestId: string): Promise<ExpenseResponseDTO> {
		this.logger.debug('Executing CreateExpenseUseCase', { requestId, userId: request.userId });

		const expenseEntity = ExpenseEntity.create({
			...request,
			id: this.uuid.generate(),
			category: request.category ?? null,
			expenseDate: request.expenseDate ?? new Date(),
		});

		this.logger.debug('Expense entity created', { requestId, expenseId: expenseEntity.id, userId: expenseEntity.userId });

		const createdExpense = await this.repository.create(expenseEntity);
		this.logger.debug('Expense created successfully', { requestId, expenseId: createdExpense.id, userId: createdExpense.userId });

		return ExpenseResponseDTO.fromEntity(createdExpense);
	}
}
