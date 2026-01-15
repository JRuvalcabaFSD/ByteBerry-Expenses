import { CreateExpenseRequestDTO, ListExpenseRequestDTO } from '@application';
import type { ICreateExpenseUseCase, IListExpensesUseCase } from '@interfaces';
import { ExpensesController } from '@presentation';
import { Request, Response, NextFunction } from 'express';

// Mock the use cases
const mockCreateUseCase = {
	execute: vi.fn(),
} as any;

const mockListUseCase = {
	execute: vi.fn(),
} as any;

describe('ExpensesController', () => {
	let controller: ExpensesController;
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		controller = new ExpensesController(mockCreateUseCase, mockListUseCase);
		mockReq = {};
		mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		};
		mockNext = vi.fn();
		vi.clearAllMocks();
	});

	describe('create', () => {
		it('should create an expense successfully', async () => {
			const userId = 'user123';
			const requestId = 'req123';
			const body = { amount: 100, description: 'Test expense' };
			const mockResponse = { id: 'exp123', ...body };

			mockReq.user = { sub: userId, iat: 0, exp: 0, iss: '' };
			mockReq.requestId = requestId;
			mockReq.body = body;

			vi.spyOn(CreateExpenseRequestDTO, 'fromBody').mockReturnValue({} as any);
			mockCreateUseCase.execute.mockResolvedValue({
				toJSON: () => mockResponse,
			} as any);

			await controller.create(mockReq as Request, mockRes as Response, mockNext);

			expect(CreateExpenseRequestDTO.fromBody).toHaveBeenCalledWith(body, userId);
			expect(mockCreateUseCase.execute).toHaveBeenCalledWith({}, requestId);
			expect(mockRes.status).toHaveBeenCalledWith(201);
			expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should call next with error on create failure', async () => {
			const userId = 'user123';
			const requestId = 'req123';
			const body = { amount: 100, description: 'Test expense' };
			const error = new Error('Create failed');

			mockReq.user = { sub: userId, iat: 0, exp: 0, iss: '' };
			mockReq.requestId = requestId;
			mockReq.body = body;

			vi.spyOn(CreateExpenseRequestDTO, 'fromBody').mockReturnValue({} as any);
			mockCreateUseCase.execute.mockRejectedValue(error);

			await controller.create(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
			expect(mockRes.status).not.toHaveBeenCalled();
			expect(mockRes.json).not.toHaveBeenCalled();
		});
	});

	describe('list', () => {
		it('should list expenses successfully', async () => {
			const userId = 'user123';
			const requestId = 'req123';
			const query = { limit: '10', offset: '0' };
			const mockResponse = [{ id: 'exp1' }, { id: 'exp2' }];

			mockReq.user = { sub: userId, iat: 0, exp: 0, iss: '' };
			mockReq.requestId = requestId;
			mockReq.query = query;

			vi.spyOn(ListExpenseRequestDTO, 'fromQuery').mockReturnValue({} as any);
			mockListUseCase.execute.mockResolvedValue(mockResponse as any);

			await controller.list(mockReq as Request, mockRes as Response, mockNext);

			expect(ListExpenseRequestDTO.fromQuery).toHaveBeenCalledWith(query, userId);
			expect(mockListUseCase.execute).toHaveBeenCalledWith({}, requestId);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should call next with error on list failure', async () => {
			const userId = 'user123';
			const requestId = 'req123';
			const query = { limit: '10', offset: '0' };
			const error = new Error('List failed');

			mockReq.user = { sub: userId, iat: 0, exp: 0, iss: '' };
			mockReq.requestId = requestId;
			mockReq.query = query;

			vi.spyOn(ListExpenseRequestDTO, 'fromQuery').mockReturnValue({} as any);
			mockListUseCase.execute.mockRejectedValue(error);

			await controller.list(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
			expect(mockRes.status).not.toHaveBeenCalled();
			expect(mockRes.json).not.toHaveBeenCalled();
		});
	});
});
