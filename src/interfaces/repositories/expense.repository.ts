import { ExpenseEntity } from '@domain';

//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		ExpensesRepository: IExpensesRepository;
	}
}

/**
 * Represents the updateable properties of an expense entity.
 * @typedef {Object} UpdateExpense
 * @property {number} [amount] - The expense amount. Optional.
 * @property {string} [description] - The expense description. Optional.
 * @property {string | null} [category] - The expense category, or null to clear it. Optional.
 * @property {Date} [expenseDate] - The date of the expense. Optional.
 */

export interface UpdateExpense {
	amount?: number;
	description?: string;
	category?: string | null;
	expenseDate?: Date;
}

/**
 * Repository interface for managing expense data operations.
 * Provides methods for creating, retrieving, updating, and deleting expenses,
 * with support for user-specific queries and pagination.
 */

export interface IExpensesRepository {
	/**
	 * Creates a new expense record.
	 * @param expense - The expense entity to create
	 * @returns A promise that resolves to the created expense entity
	 */

	create(expense: ExpenseEntity): Promise<ExpenseEntity>;

	/**
	 * Retrieves an expense by its unique identifier.
	 * @param id - The unique identifier of the expense
	 * @returns A promise that resolves to the expense entity, or null if not found
	 */

	findById(id: string): Promise<ExpenseEntity | null>;

	/**
	 * Retrieves an expense by the associated user identifier.
	 * @param userId - The unique identifier of the user
	 * @returns A promise that resolves to the expense entity, or null if not found
	 */

	findByUserId(userId: string): Promise<ExpenseEntity[] | null>;

	/**
	 * Retrieves a paginated list of expenses for a specific user.
	 * @param userId - The unique identifier of the user
	 * @param skip - The number of records to skip
	 * @param take - The number of records to retrieve
	 * @returns A promise that resolves to an array of expense entities
	 */

	findByUserIdWithPagination(userId: string, skip: number, take: number): Promise<ExpenseEntity[]>;

	/**
	 * Updates an existing expense with partial data.
	 * @param id - The unique identifier of the expense to update
	 * @param updates - An object containing the fields to update
	 * @returns A promise that resolves to the updated expense entity
	 */

	update(id: string, userId: string, updates: UpdateExpense): Promise<ExpenseEntity>;

	/**
	 * Deletes an expense by its unique identifier.
	 * @param id - The unique identifier of the expense to delete
	 * @returns A promise that resolves when the expense is deleted
	 */

	delete(id: string, userId: string): Promise<void>;

	/**
	 * Counts the total number of expenses for a specific user.
	 * @param userId - The unique identifier of the user
	 * @returns A promise that resolves to the total count of expenses
	 */

	countByUserId(userId: string): Promise<number>;
}
