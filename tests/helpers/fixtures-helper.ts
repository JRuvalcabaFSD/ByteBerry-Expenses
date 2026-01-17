/**
 * Fixtures Helper - Generadores de datos de prueba para Expenses
 */

import crypto from 'node:crypto';
import type { ExpenseEntity } from '@domain';

// Define un tipo para los datos de ExpenseEntity (excluyendo métodos)
type ExpenseData = Omit<ExpenseEntity, 'id' | 'createdAt' | 'updatedAt' | 'getAmountInDollars' | 'isToday' | 'getFormattedDate' | 'toJSON'> & {
  category: string; // Forzar category como string (no null)
};

/**
 * Genera un ID único para tests
 */
export function generateTestId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Genera un expense de prueba
 */


export function generateTestExpense(userId: string, overrides?: Partial<ExpenseData>): ExpenseData {
  return {
    userId,
    amount: 10050, // $100.50 en centavos
    description: 'Test expense',
    category: 'food', // Valor por defecto no null
    expenseDate: new Date(),
    ...overrides,
  };
}

/**
 * Genera múltiples expenses de prueba
 */
export function generateTestExpenses(userId: string, count: number): ExpenseData[] {
  return Array.from({ length: count }, (_, i) =>
    generateTestExpense(userId, {
      description: `Test expense ${i + 1}`,
      amount: (i + 1) * 10,
    })
  );
}
