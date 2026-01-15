import { CreateExpenseRequestDTO } from '@application';
import type { ICreateExpenseUseCase } from '@interfaces';
import { Injectable } from '@shared';
import { NextFunction, Request, Response } from 'express';

//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		ExpensesController: ExpensesController;
	}
}

@Injectable({ name: 'ExpensesController', depends: ['CreateExpenseUseCase'] })
export class ExpensesController {
	constructor(private readonly createUseCase: ICreateExpenseUseCase) {}

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
}
