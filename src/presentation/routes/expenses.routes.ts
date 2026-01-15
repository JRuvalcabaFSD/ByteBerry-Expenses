import { Router } from 'express';
import { ExpensesController } from '@presentation';

//TODO documentar
export function createExpensesRoutes(controller: ExpensesController): Router {
	const router = Router();
	router.post('/', controller.create);
	return router;
}
