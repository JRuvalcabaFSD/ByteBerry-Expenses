import { PrismaClient } from "@prisma/client";
import { Application } from "express";
import request from "supertest"

import { cleanDatabase, seedTestDatabase, TestDatabaseSeed } from "../../helpers/database-helper.js";
import { closePrismaTestClient, getPrismaTestClient } from "../../helpers/prisma-test-client.js";
import { TestServer } from "../../helpers/test-server.js";
import { generateTestExpense } from "../../helpers/fixtures-helper.js";

// TODO falta test de Update y delete

describe("Expenses CRUD - User Ownership Isolation",()=>{
	let prisma: PrismaClient;
  let testServer: TestServer;
  let app: Application;
  let seed: TestDatabaseSeed;

  beforeAll(async () => {
    prisma = await getPrismaTestClient();
    testServer = new TestServer(0);
    await testServer.start();
    app = await testServer.getApp();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    seed = await seedTestDatabase(prisma);
  });

  afterAll(async () => {
    await testServer.stop();
    await closePrismaTestClient();
  });

	describe('POST /expense - Create Expense', () => {
    it('should allow User A to create own expense', async () => {
      const expenseData = generateTestExpense(seed.userA.id);

      const response = await request(app)
        .post('/expense')
        .set('X-Test-User-Id', seed.userA.id)
        .send(expenseData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(seed.userA.id);
      expect(response.body.amount).toBe(expenseData.amount);
      expect(response.body.description).toBe(expenseData.description);
    });
  });

	describe("GET /expense - List Expenses",()=>{
		it('should return only User A expenses (User B expenses not visible)', async () => {
      // Arrange: Create expenses for both users
      const userAExpense1 = generateTestExpense(seed.userA.id, { description: 'User A expense 1' });
      const userAExpense2 = generateTestExpense(seed.userA.id, { description: 'User A expense 2' });
      const userBExpense = generateTestExpense(seed.userB.id, { description: 'User B expense' });

      await prisma.expenses.create({ data: userAExpense1 });
      await prisma.expenses.create({ data: userAExpense2 });
      await prisma.expenses.create({ data: userBExpense });

      // Act: List expenses for User A
      const response = await request(app)
        .get('/expense')
        .set('X-Test-User-Id', seed.userA.id)
        .expect(200);

      // Assert: Only User A expenses returned
      expect(response.body).toHaveProperty('expenses');
      expect(Array.isArray(response.body.expenses)).toBe(true);
      expect(response.body.expenses).toHaveLength(2);

      // Verify all returned expenses belong to User A
      response.body.expenses.forEach((expense: any) => {
        expect(expense.userId).toBe(seed.userA.id);
      });

      // Verify User B expense is NOT in results
      const descriptions = response.body.expenses.map((e: any) => e.description);
      expect(descriptions).not.toContain('User B expense');
    });

    it('should return empty array when user has no expenses', async () => {
      const response = await request(app)
        .get('/expense')
        .set('X-Test-User-Id', seed.userA.id) // ✅ Mock authentication
        .expect(200);

      expect(response.body.expenses).toEqual([]);
    });
	})

	describe("User Isolation - Complete Scenario",()=>{
		it('should maintain complete data isolation between users', async () => {
      // Arrange: Create multiple expenses for both users
      await Promise.all([
        prisma.expenses.create({ data: generateTestExpense(seed.userA.id, { description: 'A1' }) }),
        prisma.expenses.create({ data: generateTestExpense(seed.userA.id, { description: 'A2' }) }),
        prisma.expenses.create({ data: generateTestExpense(seed.userA.id, { description: 'A3' }) }),
        prisma.expenses.create({ data: generateTestExpense(seed.userB.id, { description: 'B1' }) }),
        prisma.expenses.create({ data: generateTestExpense(seed.userB.id, { description: 'B2' }) }),
      ]);

      // Act: Get expenses for User A
      const responseA = await request(app)
        .get('/expense')
        .set('X-Test-User-Id', seed.userA.id)
        .expect(200);

      // Act: Get expenses for User B
      const responseB = await request(app)
        .get('/expense')
        .set('X-Test-User-Id', seed.userB.id)
        .expect(200);

      // Assert: User A sees only own expenses
      expect(responseA.body.expenses).toHaveLength(3);
      responseA.body.expenses.forEach((expense: any) => {
        expect(expense.userId).toBe(seed.userA.id);
        expect(expense.description).toMatch(/^A/);
      });

      // Assert: User B sees only own expenses
      expect(responseB.body.expenses).toHaveLength(2);
      responseB.body.expenses.forEach((expense: any) => {
        expect(expense.userId).toBe(seed.userB.id);
        expect(expense.description).toMatch(/^B/);
      });
    });
  });
})
