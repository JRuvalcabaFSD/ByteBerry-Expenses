/**
 * Database Helper para tests de integración - Expenses Service
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Limpia TODAS las tablas de la base de datos
 */
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  // Solo tenemos la tabla expenses por ahora (F2)
  await prisma.expenses.deleteMany({});
}

/**
 * Datos de prueba que retorna seedTestDatabase
 */
export interface TestDatabaseSeed {
  userA: {
    id: string;
    username: string;
  };
  userB: {
    id: string;
    username: string;
  };
}

/**
 * Siembra datos mínimos necesarios para tests
 * Crea dos usuarios ficticios (A y B) para probar ownership
 */
export async function seedTestDatabase(
  prisma: PrismaClient
): Promise<TestDatabaseSeed> {
  // En F2, no tenemos tabla de usuarios en Expenses
  // Los userId son strings que vienen del JWT (OAuth2)
  // Así que solo retornamos IDs ficticios

  return {
    userA: {
      id: 'test-user-a-uuid-12345',
      username: 'userA',
    },
    userB: {
      id: 'test-user-b-uuid-67890',
      username: 'userB',
    },
  };
}

/**
 * Verifica que la DB esté vacía
 */
export async function isDatabaseEmpty(prisma: PrismaClient): Promise<boolean> {
  const count = await prisma.expenses.count();
  return count === 0;
}
