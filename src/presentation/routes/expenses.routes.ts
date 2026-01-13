import { Router } from 'express';
import { ExpensesController } from '@presentation';

export function createExpensesRoutes(controller: ExpensesController): Router {
	const router = Router();
	router.get('/', controller.list);
	return router;
}
