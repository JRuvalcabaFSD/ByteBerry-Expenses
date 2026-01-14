/**
 * Represents the properties of an Expense entity.
 *
 * @interface ExpenseProps
 * @property {string} id - The unique identifier for the expense.
 * @property {string} userId - The identifier of the user who created the expense.
 * @property {number} amount - The monetary amount of the expense.
 * @property {string} description - A description of what the expense was for.
 * @property {string | null} category - The category classification of the expense, or null if uncategorized.
 * @property {Date} [expenseDate] - Optional date when the expense occurred. Defaults to creation date if not provided.
 * @property {Date} [createdAt] - Optional timestamp of when the expense record was created.
 * @property {Date} [updatedAt] - Optional timestamp of when the expense record was last updated.
 */

interface ExpenseProps {
	id: string;
	userId: string;
	amount: number;
	description: string;
	category: string | null;
	expenseDate?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Represents an expense entity in the domain layer.
 *
 * This class encapsulates expense data with methods for formatting and querying expense information.
 * The entity uses the private constructor pattern with a static factory method for object creation.
 *
 * @class ExpenseEntity
 *
 * @property {string} id - The unique identifier of the expense
 * @property {string} userId - The ID of the user who created the expense
 * @property {number} amount - The expense amount in cents
 * @property {string} description - A description of the expense
 * @property {string | null} category - The category of the expense, or null if not set
 * @property {Date} expenseDate - The date when the expense occurred
 * @property {Date} createdAt - The timestamp when the expense was created
 * @property {Date} updatedAt - The timestamp when the expense was last updated
 *
 * @example
 * const expense = ExpenseEntity.create({
 *   id: '123',
 *   userId: 'user-456',
 *   amount: 5000,
 *   description: 'Grocery shopping',
 *   expenseDate: new Date(),
 * });
 *
 * console.log(expense.getAmountInDollars()); // 50
 * console.log(expense.isToday()); // true or false
 */

export class ExpenseEntity {
	public readonly id!: string;
	public readonly userId!: string;
	public readonly amount!: number;
	public readonly description!: string;
	public readonly category!: string | null;
	public readonly expenseDate!: Date;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;

	private constructor(data: ExpenseProps) {
		Object.assign(this, data);
	}

	/**
	 * Creates a new instance of ExpenseEntity with default values for optional properties.
	 * @param props - The expense properties to initialize the entity with
	 * @param props.category - Optional category; defaults to null if not provided
	 * @param props.expenseDate - Optional expense date; defaults to current date if not provided
	 * @param props.createdAt - Optional creation timestamp; defaults to current date if not provided
	 * @param props.updatedAt - Optional update timestamp; defaults to current date if not provided
	 * @returns A new instance of ExpenseEntity with all properties initialized
	 */

	public static create(props: ExpenseProps): ExpenseEntity {
		return new ExpenseEntity({
			...props,
			category: props.category ?? null,
			expenseDate: props.expenseDate ?? new Date(),
			createdAt: props.createdAt ?? new Date(),
			updatedAt: props.updatedAt ?? new Date(),
		});
	}

	/**
	 * Gets the amount in dollars by dividing the internal amount (in cents) by 100.
	 * @returns The amount converted to dollars.
	 */

	public getAmountInDollars(): number {
		return this.amount / 100;
	}

	/**
	 * Determines whether the expense date is today.
	 * Compares the expense date with the current date, considering year, month, and day.
	 * @returns {boolean} True if the expense date is today, false otherwise.
	 */

	public isToday(): boolean {
		const today = new Date();
		return (
			this.expenseDate.getDate() === today.getDate() &&
			this.expenseDate.getMonth() === today.getMonth() &&
			this.expenseDate.getFullYear() === today.getFullYear()
		);
	}

	/**
	 * Gets the expense date formatted as an ISO 8601 date string (YYYY-MM-DD).
	 * @returns The formatted date string in ISO 8601 format without the time component.
	 */

	public getFormattedDate(): string {
		return this.expenseDate.toISOString().split('T')[0];
	}

	/**
	 * Converts the Expense entity to a plain JSON object representation.
	 *
	 * @returns {ExpenseProps} A plain object containing all expense properties including
	 * id, userId, amount, description, category, expenseDate, createdAt, and updatedAt.
	 */

	public toJSON(): ExpenseProps {
		return {
			id: this.id,
			userId: this.userId,
			amount: this.amount,
			description: this.description,
			category: this.category,
			expenseDate: this.expenseDate,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
