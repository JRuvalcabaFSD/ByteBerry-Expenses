import { object, string, ZodType } from 'zod';

import { requiredNumber, requiredString, stringISODate } from './helpers.js';

/**
 * Represents the data required to create a new expense.
 * @interface CreateExpenseData
 * @property {string} userId - The unique identifier of the user who owns the expense.
 * @property {number} amount - The monetary amount of the expense.
 * @property {string} description - A brief description of the expense.
 * @property {string} category - The category classification of the expense.
 * @property {Date} expenseDate - The date when the expense occurred.
 */

export interface CreateExpenseData {
	userId: string;
	amount: number;
	description: string;
	category?: string | null;
	expenseDate: Date;
}

/**
 * Zod schema for validating expense creation data.
 *
 * @description Defines the structure and validation rules for creating a new expense record.
 * Ensures all required fields are present and conform to specified constraints.
 *
 * @property {string} userId - Required user identifier
 * @property {number} amount - Required expense amount (maximum: 99,999,999)
 * @property {string} description - Required expense description (maximum: 500 characters)
 * @property {string} [category] - Optional expense category (maximum: 100 characters)
 * @property {string} expenseDate - Required ISO 8601 formatted date string
 *
 * @type {ZodType<CreateExpenseData>}
 */

export const CreateExpenseSchema: ZodType<CreateExpenseData> = object({
	userId: requiredString('User ID'),
	amount: requiredNumber('Amount', 99999999),
	description: requiredString('Description').max(500, 'Description exceeds maximum length (500 characters)'),
	category: string().max(100, 'Category exceeds maximum length (100 characters)').optional(),
	expenseDate: stringISODate('Expense Date'),
});
