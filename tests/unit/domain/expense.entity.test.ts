import { ExpenseEntity } from "@domain";

describe('ExpenseEntity', () => {
	describe('create', () => {
		it('should create an ExpenseEntity with all provided properties', () => {
			const props = {
				id: '123',
				userId: 'user-456',
				amount: 5000,
				description: 'Grocery shopping',
				category: 'Food',
				expenseDate: new Date('2023-01-01'),
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			};
			const expense = ExpenseEntity.create(props);
			expect(expense.id).toBe('123');
			expect(expense.userId).toBe('user-456');
			expect(expense.amount).toBe(5000);
			expect(expense.description).toBe('Grocery shopping');
			expect(expense.category).toBe('Food');
			expect(expense.expenseDate).toEqual(new Date('2023-01-01'));
			expect(expense.createdAt).toEqual(new Date('2023-01-01'));
			expect(expense.updatedAt).toEqual(new Date('2023-01-01'));
		});

		it('should set defaults for optional properties when not provided', () => {
			const props = {
				id: '123',
				userId: 'user-456',
				amount: 5000,
				description: 'Grocery shopping',
				category: null,
			};
			const expense = ExpenseEntity.create(props);
			expect(expense.category).toBeNull();
			expect(expense.expenseDate).toBeInstanceOf(Date);
			expect(expense.createdAt).toBeInstanceOf(Date);
			expect(expense.updatedAt).toBeInstanceOf(Date);
		});
	});

	describe('getAmountInDollars', () => {
		it('should return the amount in dollars', () => {
			const expense = ExpenseEntity.create({
				id: '123',
				userId: 'user-456',
				amount: 5000,
				description: 'Test',
				category: null,
			});
			expect(expense.getAmountInDollars()).toBe(50);
		});
	});

	describe('isToday', () => {
		it('should return true if expenseDate is today', () => {
			const today = new Date();
			const expense = ExpenseEntity.create({
				id: '123',
				userId: 'user-456',
				amount: 5000,
				description: 'Test',
				expenseDate: today,
				category: null,
			});
			expect(expense.isToday()).toBe(true);
		});

		it('should return false if expenseDate is not today', () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const expense = ExpenseEntity.create({
				id: '123',
				userId: 'user-456',
				amount: 5000,
				description: 'Test',
				expenseDate: yesterday,
				category: null,
			});
			expect(expense.isToday()).toBe(false);
		});
	});

	describe('getFormattedDate', () => {
		it('should return the expenseDate in YYYY-MM-DD format', () => {
			const expense = ExpenseEntity.create({
				id: '123',
				userId: 'user-456',
				amount: 5000,
				description: 'Test',
				expenseDate: new Date('2023-01-01T12:00:00Z'),
				category: null,
			});
			expect(expense.getFormattedDate()).toBe('2023-01-01');
		});
	});

	describe('toJSON', () => {
		it('should return a plain object with all properties', () => {
			const props = {
				id: '123',
				userId: 'user-456',
				amount: 5000,
				description: 'Grocery shopping',
				category: 'Food',
				expenseDate: new Date('2023-01-01'),
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			};
			const expense = ExpenseEntity.create(props);
			const json = expense.toJSON();
			expect(json).toEqual(props);
		});
	});
});
