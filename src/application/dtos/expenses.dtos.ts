import { ExpenseEntity } from '@domain';
import { ValidateRequestError } from '@shared';
import { CreateExpenseData, CreateExpenseSchema, formattedZodError } from '@application';

/**
 * Represents the response object for an expense.
 *
 * Extends the CreateExpenseData interface while omitting the original amount,
 * category, expenseDate, createdAt, and updatedAt properties.
 *
 * @interface ExpenseResponseObject
 * @property {number} amountInDollars - The expense amount represented in dollars
 * @property {string | null} category - The category of the expense, or null if not assigned
 * @property {string} expenseDate - The date the expense occurred, formatted as a string
 * @property {string} createdAt - The timestamp when the expense record was created
 * @property {string} updatedAt - The timestamp when the expense record was last updated
 */

export interface ExpenseResponseObject extends Omit<CreateExpenseData, 'amount' | 'category' | 'expenseDate' | 'createdAt' | 'updatedAt'> {
	amountInDollars: number;
	category: string | null;
	expenseDate: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Data Transfer Object for creating a new expense request.
 *
 * This DTO encapsulates the data required to create an expense, including user ID,
 * amount, description, optional category, and expense date. It provides validation
 * through Zod schema and factory method for instantiation from request bodies.
 *
 * @example
 * const dto = CreateExpenseRequestDTO.fromBody(
 *   { amount: '50', description: 'Lunch', category: 'Food', expenseDate: '2024-01-15' },
 *   'user-123'
 * );
 *
 * @throws {@link ValidateRequestError} When the request body fails schema validation.
 */

export class CreateExpenseRequestDTO {
	public readonly userId!: string;
	public readonly amount!: number;
	public readonly description!: string;
	public readonly category?: string | null;
	public readonly expenseDate!: Date;

	private constructor(data: CreateExpenseData) {
		Object.assign(this, data);
	}

	/**
	 * Creates a CreateExpenseRequestDTO instance from a request body object.
	 *
	 * @param body - A record object containing string key-value pairs from the request body
	 * @param userId - The ID of the user creating the expense
	 * @returns A new CreateExpenseRequestDTO instance with validated data
	 * @throws {ValidateRequestError} If the body data fails schema validation
	 */

	public static fromBody(body: Record<string, string>, userId: string): CreateExpenseRequestDTO {
		const resp = CreateExpenseSchema.safeParse({ ...body, userId });

		if (!resp.success) {
			const formatted = formattedZodError(resp.error, 'form');
			throw new ValidateRequestError(formatted.msg, formatted.errors);
		}

		return new CreateExpenseRequestDTO(resp.data);
	}
}

/**
 * Data Transfer Object for transforming an ExpenseEntity into a JSON response object.
 *
 * This class encapsulates the logic for converting an expense entity to its serializable
 * representation, handling date formatting and computed properties.
 *
 * @example
 * ```typescript
 * const dto = ExpenseResponseDTO.fromEntity(expenseEntity);
 * const jsonResponse = dto.toJSON();
 * ```
 */

export class ExpenseResponseDTO {
	private constructor(private readonly expense: ExpenseEntity) {}

	/**
	 * Converts an ExpenseEntity to an ExpenseResponseDTO.
	 * @param data - The expense entity to convert
	 * @returns A new ExpenseResponseDTO instance populated with the entity data
	 */

	public static fromEntity(data: ExpenseEntity): ExpenseResponseDTO {
		return new ExpenseResponseDTO(data);
	}

	/**
	 * Converts the expense object to a JSON-serializable response object.
	 * @returns {ExpenseResponseObject} A serialized expense object containing all expense details,
	 * formatted amounts, category information, and ISO-formatted timestamps.
	 */

	public toJSON(): ExpenseResponseObject {
		return {
			...this.expense,
			amountInDollars: this.expense.getAmountInDollars(),
			category: this.expense.category ?? null,
			expenseDate: this.expense.getFormattedDate(),
			createdAt: this.expense.createdAt.toISOString(),
			updatedAt: this.expense.updatedAt.toISOString(),
		};
	}
}
