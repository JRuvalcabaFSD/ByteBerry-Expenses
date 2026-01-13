import { Injectable } from '@shared';
import { NextFunction, Request, Response } from 'express';

//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		ExpensesController: ExpensesController;
	}
}

@Injectable({ name: 'ExpensesController' })
export class ExpensesController {
	constructor() {}

	public list = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		res.status(200).json({ msg: 'OKis' });
	};
}
