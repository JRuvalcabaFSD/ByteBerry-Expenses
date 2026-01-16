import { ExpenseEntity } from '@domain';
import type { IExpensesRepository, ILogger, UpdateExpense } from '@interfaces';
import {
	ForbiddenError,
	getErrMessage,
	handledPrismaError,
	Injectable,
	LogContextClass,
	LogContextMethod,
	NotFoundRecordError,
} from '@shared';
import { DBConfig } from '@config';
import { PrismaClient } from '@prisma/client';

/**
 * Repository class for managing expense data persistence using Prisma.
 * Implements the {@link IExpensesRepository} interface and provides CRUD operations
 * and query methods for expense entities.
 *
 * @implements {IExpensesRepository}
 *
 * @example
 * ```typescript
 * const repository = new ExpensesRepository(prismaClient, logger);
 * const expense = await repository.findById('expense-123');
 * ```
 */

@LogContextClass()
@Injectable({ name: 'ExpensesRepository', depends: ['Logger', 'DBConfig'] })
export class ExpensesRepository implements IExpensesRepository {
	private readonly client: PrismaClient;

	constructor(
		private readonly logger: ILogger,
		dbConfig: DBConfig
	) {
		this.client = dbConfig.getClient();
	}

	/**
	 * Creates a new expense record in the database.
	 * @param expense - The expense entity to be created
	 * @returns A promise that resolves to the created expense entity
	 * @throws {PrismaError} If the database operation fails
	 */

	@LogContextMethod()
	public async create(expense: ExpenseEntity): Promise<ExpenseEntity> {
		this.logger.debug('Creating expense in database', { expenseId: expense.id, userId: expense.userId });

		try {
			const data = { ...expense, category: expense.category ?? '' };
			const created = await this.client.expenses.create({ data });
			this.logger.debug('Expense created successfully', { expenseId: created.id, userId: created.userId });
			return ExpenseEntity.create({ ...created });
		} catch (error) {
			this.logger.error('Failed to create expense', { expenseId: expense.id, error: getErrMessage(error) });
			throw handledPrismaError(error);
		}
	}

	/**
	 * Finds an expense by its unique identifier.
	 * @param id - The unique identifier of the expense to retrieve
	 * @returns A promise that resolves to the found ExpenseEntity, or null if no expense exists with the given ID
	 * @throws Will throw a handled Prisma error if the database operation fails
	 */

	@LogContextMethod()
	public async findById(id: string): Promise<ExpenseEntity | null> {
		this.logger.debug('Finding expense by ID', { expenseId: id });
		try {
			const data = await this.client.expenses.findUnique({ where: { id } });

			if (!data) return null;

			this.logger.debug('Expense found', { expenseId: id });
			return ExpenseEntity.create({ ...data });
		} catch (error) {
			this.logger.error('Failed to find expense', { expenseId: id, error: getErrMessage(error) });
			throw handledPrismaError(error);
		}
	}

	/**
	 * Finds all expenses for a specific user, ordered by date in descending order.
	 * @param userId - The ID of the user whose expenses to retrieve
	 * @returns A promise that resolves to an array of ExpenseEntity objects, or null if no expenses are found
	 * @throws {PrismaError} If a database error occurs during the query
	 */

	@LogContextMethod()
	public async findByUserId(userId: string): Promise<ExpenseEntity[]> {
		this.logger.debug('Finding expenses by user ID', { userId });

		try {
			const expenses = await this.client.expenses.findMany({ where: { userId }, orderBy: { expenseDate: 'desc' } });

			this.logger.debug('Expenses found', { userId, count: expenses.length });
			return expenses.map((expense) => ExpenseEntity.create({ ...expense }));
		} catch (error) {
			this.logger.error('Failed to find expenses by userId', { userId, error: getErrMessage(error) });
			throw handledPrismaError(error);
		}
	}

	/**
	 * Finds expenses for a specific user with pagination support.
	 * @param userId - The ID of the user whose expenses to retrieve
	 * @param skip - The number of records to skip (offset)
	 * @param take - The number of records to retrieve (limit)
	 * @returns A promise that resolves to an array of ExpenseEntity objects ordered by expense date in descending order
	 * @throws Will throw a handled Prisma error if the database query fails
	 */

	@LogContextMethod()
	public async findByUserIdWithPagination(userId: string, skip: number, take: number): Promise<ExpenseEntity[]> {
		this.logger.debug('Finding expenses with pagination', { userId, skip, take });

		try {
			const expenses = await this.client.expenses.findMany({ where: { userId }, orderBy: { expenseDate: 'desc' }, skip, take });

			if (!expenses) return [];

			return expenses.map((expense) => ExpenseEntity.create({ ...expense }));
		} catch (error) {
			this.logger.error('Failed to find expenses with pagination', { userId, error: getErrMessage(error) });
			throw handledPrismaError(error);
		}
	}

	/**
	 * Updates an expense by its ID with the provided partial updates.
	 * @param id - The unique identifier of the expense to update
	 * @param _updates - Partial expense data containing the fields to update
	 * @returns A promise that resolves to the updated ExpenseEntity
	 * @throws {Error} This method is not yet implemented
	 */

	// TODO mover la validación del ownership al use case
	@LogContextMethod()
	public async update(id: string, userId: string, updates: UpdateExpense): Promise<ExpenseEntity> {
		this.logger.debug('Updating expense with ownership verification', { expenseId: id, userId });

		try {
			const existing = await this.client.expenses.findUnique({ where: { id } });

			if (!existing) {
				this.logger.warn('Expense not found for update', { expenseId: id });
				throw new NotFoundRecordError(`Expense with id ${id} not found`);
			}

			if (existing.userId !== userId) {
				this.logger.warn('Ownership verification failed for update', {
					expenseId: id,
					requestingUserId: userId,
					ownerUserId: existing.userId,
				});
				throw new ForbiddenError(`User ${userId} does not have permission to update expense ${id}`);
			}

			const data = { ...updates, category: updates.category ?? existing.category };
			const updated = await this.client.expenses.update({ where: { id }, data });
			this.logger.debug('Expense updated successfully', { expenseId: id });
			return ExpenseEntity.create({ ...updated });
		} catch (error) {
			this.logger.error('Failed to update expense', { expenseId: id, error: getErrMessage(error) });
			throw handledPrismaError(error);
		}
	}

	/**
	 * Deletes an expense record by its unique identifier.
	 * @param id - The unique identifier of the expense to delete
	 * @returns A promise that resolves when the expense has been successfully deleted
	 * @throws {Error} If the expense with the given id is not found or if the deletion operation fails
	 */

	// TODO mover la validación del ownership al use case
	@LogContextMethod()
	public async delete(id: string, userId: string): Promise<void> {
		this.logger.debug('Deleting expense with ownership verification', { expenseId: id, userId });

		try {
			const existing = await this.client.expenses.findUnique({ where: { id } });
			if (!existing) {
				this.logger.warn('Expense not found for deletion', { expenseId: id });
				throw new NotFoundRecordError(`Expense with id ${id} not found`);
			}

			if (existing.userId !== userId) {
				this.logger.warn('Ownership verification failed for deletion', {
					expenseId: id,
					requestingUserId: userId,
					ownerUserId: existing.userId,
				});
				throw new ForbiddenError(`User ${userId} does not have permission to delete expense ${id}`);
			}

			await this.client.expenses.delete({ where: { id } });

			this.logger.debug('Expense deleted successfully', { expenseId: id, userId });
		} catch (error) {
			this.logger.error('Failed to delete expense', { expenseId: id, userId, error: getErrMessage(error) });
			throw handledPrismaError(error);
		}
	}

	/**
	 * Counts the total number of expenses for a specific user.
	 * @param userId - The unique identifier of the user whose expenses should be counted.
	 * @returns A promise that resolves to the total number of expenses for the user.
	 * @throws {PrismaError} If the database query fails, throws a handled Prisma error.
	 */

	@LogContextMethod()
	public async countByUserId(userId: string): Promise<number> {
		this.logger.debug('Counting expenses for user', { userId });

		try {
			const count = await this.client.expenses.count({ where: { userId } });
			this.logger.debug('Expense count retrieved', { userId, count });

			return count;
		} catch (error) {
			this.logger.error('Failed to count expenses', { userId, error: getErrMessage(error) });
			throw handledPrismaError(error);
		}
	}
}
