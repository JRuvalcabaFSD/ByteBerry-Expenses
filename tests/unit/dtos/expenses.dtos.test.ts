import { describe, it, expect } from "vitest";
import { ValidateRequestError } from "@shared";
import { CreateExpenseRequestDTO, ListExpenseRequestDTO, ExpenseResponseDTO } from "@application";
import { ExpenseEntity } from "@domain";

const validBody = {
	amount: "100",
	description: "Dinner",
	category: "Food",
	expenseDate: "2024-06-01",
};
const validUserId = "user-123";

describe("CreateExpenseRequestDTO", () => {
	it("should create DTO from valid body", () => {
		const dto = CreateExpenseRequestDTO.fromBody(validBody, validUserId);
		expect(dto).toBeInstanceOf(CreateExpenseRequestDTO);
		expect(dto.userId).toBe(validUserId);
		expect(dto.amount).toBe(100);
		expect(dto.description).toBe("Dinner");
		expect(dto.category).toBe("Food");
		expect(dto.expenseDate).toBeInstanceOf(Date);
		expect(dto.expenseDate.toISOString()).toBe(new Date("2024-06-01").toISOString());
	});

	it("should throw ValidateRequestError for missing amount", () => {
		const body = { ...validBody, amount: undefined as any };
		expect(() => CreateExpenseRequestDTO.fromBody(body, validUserId)).toThrow(ValidateRequestError);
	});

	it("should throw ValidateRequestError for invalid amount", () => {
		const body = { ...validBody, amount: "not-a-number" };
		expect(() => CreateExpenseRequestDTO.fromBody(body, validUserId)).toThrow(ValidateRequestError);
	});

	it("should throw ValidateRequestError for missing description", () => {
		const body = { ...validBody, description: undefined as any };
		expect(() => CreateExpenseRequestDTO.fromBody(body, validUserId)).toThrow(ValidateRequestError);
	});

	it("should throw ValidateRequestError for missing expenseDate", () => {
		const body = { ...validBody, expenseDate: undefined as any };
		expect(() => CreateExpenseRequestDTO.fromBody(body, validUserId)).toThrow(ValidateRequestError);
	});

	it("should throw ValidateRequestError for null category", () => {
		const body = { ...validBody, category: null as any };
		expect(() => CreateExpenseRequestDTO.fromBody(body, validUserId)).toThrow(ValidateRequestError);
	});
});

describe("ListExpenseRequestDTO", () => {
	const validUserId = "user-123";

	it("should create DTO from valid query", () => {
		const query = { skip: "10", take: "20" };
		const dto = ListExpenseRequestDTO.fromQuery(query, validUserId);
		expect(dto).toBeInstanceOf(ListExpenseRequestDTO);
		expect(dto.userId).toBe(validUserId);
		expect(dto.skip).toBe(10);
		expect(dto.take).toBe(20);
	});

	it("should create DTO with undefined skip/take if not provided", () => {
		const query = {};
		const dto = ListExpenseRequestDTO.fromQuery(query, validUserId);
		expect(dto.userId).toBe(validUserId);
		expect(dto.skip).toBeUndefined();
		expect(dto.take).toBeUndefined();
	});

	it("should throw ValidateRequestError for missing userId", () => {
		const query = { skip: "5", take: "10" };
		expect(() => ListExpenseRequestDTO.fromQuery(query, undefined as any)).toThrow(ValidateRequestError);
	});

	it("should throw ValidateRequestError for invalid skip", () => {
		const query = { skip: "not-a-number", take: "10" };
		expect(() => ListExpenseRequestDTO.fromQuery(query, validUserId)).toThrow(ValidateRequestError);
	});

	it("should throw ValidateRequestError for invalid take", () => {
		const query = { skip: "5", take: "NaN" };
		expect(() => ListExpenseRequestDTO.fromQuery(query, validUserId)).toThrow(ValidateRequestError);
	});
});

describe("ExpenseResponseDTO", () => {
	const fixedDate = new Date("2024-06-15T10:30:00.000Z");

	const createMockExpenseEntity = (overrides: Partial<{
		id: string;
		userId: string;
		amount: number;
		description: string;
		category: string | null;
		expenseDate: Date;
		createdAt: Date;
		updatedAt: Date;
	}> = {}) => {
		return ExpenseEntity.create({
			id: "expense-123",
			userId: "user-456",
			amount: 5000,
			description: "Test expense",
			category: "Food",
			expenseDate: fixedDate,
			createdAt: fixedDate,
			updatedAt: fixedDate,
			...overrides,
		});
	};

	describe("fromEntity", () => {
		it("should create DTO from ExpenseEntity", () => {
			const entity = createMockExpenseEntity();
			const dto = ExpenseResponseDTO.fromEntity(entity);
			expect(dto).toBeInstanceOf(ExpenseResponseDTO);
		});
	});

	describe("toJSON", () => {
		it("should return correctly formatted response object", () => {
			const entity = createMockExpenseEntity();
			const dto = ExpenseResponseDTO.fromEntity(entity);
			const json = dto.toJSON();

			expect(json.id).toBe("expense-123");
			expect(json.userId).toBe("user-456");
			expect(json.amountInDollars).toBe(50);
			expect(json.description).toBe("Test expense");
			expect(json.category).toBe("Food");
			expect(json.expenseDate).toBe("2024-06-15");
			expect(json.createdAt).toBe(fixedDate.toISOString());
			expect(json.updatedAt).toBe(fixedDate.toISOString());
		});

		it("should return null category when expense has no category", () => {
			const entity = createMockExpenseEntity({ category: null });
			const dto = ExpenseResponseDTO.fromEntity(entity);
			const json = dto.toJSON();

			expect(json.category).toBeNull();
		});

		it("should convert amount from cents to dollars correctly", () => {
			const entity = createMockExpenseEntity({ amount: 12345 });
			const dto = ExpenseResponseDTO.fromEntity(entity);
			const json = dto.toJSON();

			expect(json.amountInDollars).toBe(123.45);
		});

		it("should format expenseDate as ISO date string (YYYY-MM-DD)", () => {
			const customDate = new Date("2025-12-31T23:59:59.000Z");
			const entity = createMockExpenseEntity({ expenseDate: customDate });
			const dto = ExpenseResponseDTO.fromEntity(entity);
			const json = dto.toJSON();

			expect(json.expenseDate).toBe("2025-12-31");
		});

		it("should format createdAt and updatedAt as full ISO strings", () => {
			const createdDate = new Date("2024-01-01T08:00:00.000Z");
			const updatedDate = new Date("2024-06-15T14:30:00.000Z");
			const entity = createMockExpenseEntity({
				createdAt: createdDate,
				updatedAt: updatedDate,
			});
			const dto = ExpenseResponseDTO.fromEntity(entity);
			const json = dto.toJSON();

			expect(json.createdAt).toBe("2024-01-01T08:00:00.000Z");
			expect(json.updatedAt).toBe("2024-06-15T14:30:00.000Z");
		});
	});
});
