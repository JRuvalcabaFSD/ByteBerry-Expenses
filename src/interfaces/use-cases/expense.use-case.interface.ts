import { CreateExpenseRequestDTO, ExpenseResponseDTO } from '@application';

//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		CreateExpenseUseCase: ICreateExpenseUseCase;
	}
}

/**
 * Use case interface for creating a new expense.
 *
 * @interface ICreateExpenseUseCase
 * @method execute - Executes the create expense use case with the provided data
 * @param {CreateExpenseDTO} request - The data transfer object containing the expense creation details
 * @returns {Promise<ExpenseResponseDTO>} A promise that resolves to the response data transfer object containing the created expense information
 */

export interface ICreateExpenseUseCase {
	execute(request: CreateExpenseRequestDTO, requestId: string): Promise<ExpenseResponseDTO>;
}
