import { CreateExpenseRequestDTO, ListExpenseRequestDTO } from '@application';
import type { ICreateExpenseUseCase, IListExpensesUseCase } from '@interfaces';
import { Injectable } from '@shared';
import { NextFunction, Request, Response } from 'express';

//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		ExpensesController: ExpensesController;
	}
}

@Injectable({ name: 'ExpensesController', depends: ['CreateExpenseUseCase', 'ListExpensesUseCase'] })
export class ExpensesController {
	constructor(
		private readonly createUseCase: ICreateExpenseUseCase,
		private readonly listUseCase: IListExpensesUseCase
	) {}

	/**
	 * Handles the creation of a new expense for the authenticated user.
	 *
	 * Extracts the user ID and request ID from the request, constructs a
	 * `CreateExpenseRequestDTO` from the request body, and executes the
	 * expense creation use case. Responds with the created expense in JSON
	 * format with a 201 status code. Forwards any errors to the next middleware.
	 *
	 * @param req - Express request object containing user and requestId.
	 * @param res - Express response object used to send the response.
	 * @param next - Express next function for error handling.
	 * @returns A promise that resolves when the response is sent.
	 */

	public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const userId = req.user!.sub;
			const requestId = req.requestId;

			const request = CreateExpenseRequestDTO.fromBody(req.body, userId);
			const response = await this.createUseCase.execute(request, requestId!);

			res.status(201).json(response.toJSON());
		} catch (error) {
			next(error);
		}
	};

	/**
	 * Handles the HTTP request to list expenses for the authenticated user.
	 *
	 * Extracts the user ID and request ID from the request, constructs a `ListExpenseRequestDTO`
	 * from the query parameters, and executes the use case to retrieve the expenses.
	 * Responds with a JSON array of expenses on success, or passes any errors to the next middleware.
	 *
	 * @param req - Express request object containing user and query information.
	 * @param res - Express response object used to send the JSON response.
	 * @param next - Express next function for error handling.
	 * @returns A promise that resolves when the response is sent.
	 */

	public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const userId = req.user!.sub;
			const requestId = req.requestId;

			const request = ListExpenseRequestDTO.fromQuery(req.query as Record<string, string>, userId);
			const response = await this.listUseCase.execute(request, requestId!);

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	};
}
