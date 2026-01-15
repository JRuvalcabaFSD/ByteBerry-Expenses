import { vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { Router } from 'express';
import type { IConfig, IClock, IHealthService, IJwtVerifier, HomeResponse } from '@interfaces';
import { AppRouter, ExpensesController } from '@presentation';

// Mock dependencies
const mockConfig: IConfig = {
	serviceUrl: 'http://localhost',
	port: 3000,
	serviceName: 'TestService',
	version: '1.0.0',
	nodeEnv: 'test',
} as unknown as IConfig;

const mockClock: IClock = {
	isoString: vi.fn(() => '2023-01-01T00:00:00.000Z'),
} as unknown as IClock;

const mockHealthService: IHealthService = {
	getHealth: vi.fn(),
	getDeepHealth: vi.fn(),
	checkHealth: vi.fn(),
} as unknown as IHealthService;

const mockJwtVerifier: IJwtVerifier = {
	verify: vi.fn(),
} as unknown as IJwtVerifier;

const mockExpensesCtl: ExpensesController = {
	create: vi.fn(),
	list: vi.fn(),
} as unknown as ExpensesController;

describe('AppRouter', () => {
	let appRouter: AppRouter;
	let app: express.Application;

	beforeEach(() => {
		vi.clearAllMocks();
		appRouter = new AppRouter(mockConfig, mockClock, mockHealthService, mockJwtVerifier, mockExpensesCtl);
		app = express();
		app.use(express.json()); // To parse JSON bodies if needed
		app.use((req, res, next) => {
			req.requestId = req.headers['x-request-id'] as string;
			next();
		});
		app.use(appRouter.getRoutes());
	});

	it('should return a Router instance from getRoutes', () => {
		const router = appRouter.getRoutes();
		expect(router).toBeInstanceOf(Router);
	});

	it('should respond with home data on GET /', async () => {
		const response = await supertest(app)
			.get('/')
			.set('x-request-id', 'test-request-id'); // Assuming requestId is set via middleware

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			service: 'TestService',
			version: '1.0.0',
			status: 'running',
			timestamp: '2023-01-01T00:00:00.000Z',
			requestId: 'test-request-id',
			environment: 'test',
			endpoints: {
				'home [GET]': 'http://localhost:3000/',
				'deepHealth [GET]': 'http://localhost:3000/health/deep',
				'health [GET]': 'http://localhost:3000/health',
				'createExpense [POST]': 'http://localhost:3000/expense',
				'listExpense [GET]': 'http://localhost:3000/expense',
			},
		} as HomeResponse);
	});

	it('should respond with 404 for unknown routes', async () => {
		const response = await supertest(app)
			.get('/unknown')
			.set('x-request-id', 'test-request-id');

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: 'Not found',
			message: 'Route GET /unknown not found',
			requestId: 'test-request-id',
			timestamp: '2023-01-01T00:00:00.000Z',
			endpoints: {
				'home [GET]': 'http://localhost:3000/',
				'deepHealth [GET]': 'http://localhost:3000/health/deep',
				'health [GET]': 'http://localhost:3000/health',
				'createExpense [POST]': 'http://localhost:3000/expense',
				'listExpense [GET]': 'http://localhost:3000/expense',
			},
		});
	});

	// Note: Testing /expense and /health routes would require mocking createExpensesRoutes and createHealthRoutes,
	// which are external functions. For integration tests, you might need to set up those mocks or test them separately.
});
