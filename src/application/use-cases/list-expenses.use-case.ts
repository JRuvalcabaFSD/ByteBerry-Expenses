import { Injectable, LogContextClass, LogContextMethod } from '@shared';
import type { IExpensesRepository, IListExpensesUseCase, ILogger } from '@interfaces';
import { ExpenseResponseDTO, ListExpenseRequestDTO, PaginatedExpensesDTO } from '@application';

/**
 * Use case for listing expenses with pagination for a specific user.
 *
 * This class handles the logic for retrieving a paginated list of expenses
 * from the repository, including logging and limiting the maximum number of
 * items returned per request.
 *
 * @remarks
 * - Applies default values for pagination (`skip`, `take`) if not provided.
 * - Enforces a maximum limit on the number of items (`MAX_TAKE`).
 * - Logs key steps and data for traceability.
 *
 * @example
 * ```typescript
 * const useCase = new ListExpensesUseCase(repository, logger);
 * const result = await useCase.execute({ userId: '123', skip: 0, take: 10 }, 'req-456');
 * ```
 *
 * @param repository - The expenses repository for data access.
 * @param logger - The logger for recording execution details.
 *
 * @method execute
 * Executes the use case to retrieve paginated expenses for a user.
 *
 * @param request - The DTO containing userId and pagination parameters.
 * @param requestId - A unique identifier for the request (for logging).
 * @returns A paginated DTO containing expenses and pagination metadata.
 */

@LogContextClass()
@Injectable({ name: 'ListExpensesUseCase', depends: ['ExpensesRepository', 'Logger'] })
export class ListExpensesUseCase implements IListExpensesUseCase {
	private readonly DEFAULT_SKIP = 0;
	private readonly DEFAULT_TAKE = 20;
	private readonly MAX_TAKE = 100;

	constructor(
		private readonly repository: IExpensesRepository,
		private readonly logger: ILogger
	) {}

	/**
	 * Executes the use case to list expenses for a user with pagination.
	 *
	 * Logs the execution and repository fetch actions, retrieves expenses and their total count,
	 * maps the expense entities to DTOs, and returns a paginated result.
	 *
	 * @param request - The DTO containing userId, skip, and take parameters for pagination.
	 * @param requestId - A unique identifier for the request, used for logging.
	 * @returns A promise that resolves to a paginated DTO containing the expenses, total count, pagination info, and a flag indicating if more expenses are available.
	 */

	@LogContextMethod()
	public async execute(request: ListExpenseRequestDTO, requestId: string): Promise<PaginatedExpensesDTO> {
		this.logger.info('Executing ListExpensesUseCase', {
			requestId,
			userId: request.userId,
			skip: request.skip,
			take: request.take,
		});

		const skip = request.skip ?? this.DEFAULT_SKIP;
		const take = Math.min(request.take ?? this.DEFAULT_TAKE, this.MAX_TAKE);

		this.logger.debug('Fetching expenses from repository', {
			requestId,
			userId: request.userId,
			skip,
			take,
		});

		const userId = request.userId as string;

		const expenses = await this.repository.findByUserIdWithPagination(userId, skip, take);

		const total = await this.repository.countByUserId(userId);

		this.logger.info('Expenses retrieved successfully', {
			requestId,
			userId,
			count: expenses.length,
			total,
			skip,
			take,
		});

		const expensesDTOs = expenses.map((expense) => ExpenseResponseDTO.fromEntity(expense));

		return {
			expenses: expensesDTOs,
			total,
			skip,
			take,
			hasMore: skip + take < total,
		};
	}
}
