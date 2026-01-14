import { ExpenseEntity } from '@domain';
import type { IExpensesRepository, ILogger } from '@interfaces';
import { getErrMessage, handledPrismaError, Injectable, LogContextClass, LogContextMethod } from '@shared';
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
	public async findByUserId(userId: string): Promise<ExpenseEntity[] | null> {
		this.logger.debug('Finding expenses by user ID', { userId });

		try {
			const expenses = await this.client.expenses.findMany({ where: { userId }, orderBy: { expenseDate: 'desc' } });
			if (!expenses) return null;

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

	@LogContextMethod()
	public async update(id: string, _updates: Partial<ExpenseEntity>): Promise<ExpenseEntity> {
		this.logger.debug('Update method called but not implemented in F2', { expenseId: id });
		throw new Error('Method not implemented.');
	}

	/**
	 * Deletes an expense record by its unique identifier.
	 * @param id - The unique identifier of the expense to delete
	 * @returns A promise that resolves when the expense has been successfully deleted
	 * @throws {Error} If the expense with the given id is not found or if the deletion operation fails
	 */

	@LogContextMethod()
	public async delete(id: string): Promise<void> {
		this.logger.debug('Delete method called but not implemented in F2', { expenseId: id });
		throw new Error('Method not implemented.');
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
