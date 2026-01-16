/* eslint-disable @typescript-eslint/no-explicit-any */

import { DBConfig } from '@config';
import type { DatabaseHealthResponse, IDatabaseHealthChecker, ILogger } from '@interfaces';
import { PrismaClient } from '@prisma/client';
import { Injectable, LogContextClass } from '@shared';

/**
 * Service responsible for checking the health and status of the database connection and tables.
 *
 * This service provides methods to:
 * - Check if the database connection is active.
 * - Verify the existence of required tables (currently only 'expenses').
 * - Retrieve database health status, including connection status, latency, table existence, and record counts.
 *
 * @remarks
 * Uses PrismaClient for database operations and ILogger for logging.
 *
 * @example
 * ```typescript
 * const healthChecker = new DataBaseHealthCheckerService(prismaClient, logger);
 * const isConnected = await healthChecker.checkConnection();
 * const tables = await healthChecker.checkTables();
 * const healthStatus = await healthChecker.getHealthStatus();
 * ```
 */

@LogContextClass()
@Injectable({ name: 'DatabaseHealthChecker', depends: ['Logger', 'DBConfig'] })
export class DataBaseHealthCheckerService implements IDatabaseHealthChecker {
	private readonly client: PrismaClient;
	constructor(
		private readonly logger: ILogger,
		DBConfig: DBConfig
	) {
		this.client = DBConfig.getClient();
	}

	public async checkConnection(): Promise<boolean> {
		try {
			await this.validateConnection();

			await this.client.$queryRawUnsafe('SELECT 1');
			this.logger.debug('Database connection check successful');
			return true;
		} catch (error) {
			this.logger.error('Database connection check failed', { error });
			return false;
		}
	}

	/**
	 * Checks the existence of required database tables.
	 *
	 * This method validates the database connection and queries the `pg_tables` system catalog
	 * to determine if the 'expenses' table exists in the 'public' schema. It returns an object
	 * indicating the presence of the 'expenses' table.
	 *
	 * @returns A promise that resolves to an object with a boolean property `expenses` indicating
	 *          whether the 'expenses' table exists.
	 * @throws Logs an error and returns the default result if the check fails.
	 */

	public async checkTables(): Promise<{ expenses: boolean }> {
		const tables = {
			expenses: false,
		};

		const tableNames = Object.keys(tables);

		try {
			await this.validateConnection();
			const result = await this.client.$queryRaw<{ tablename: string }[]>`
				SELECT tablename::text AS tablename
				FROM pg_tables
				WHERE schemaname = 'public'
					AND tablename = ANY(${tableNames}::text[])
			`;

			const existingTables = result.map((row) => row.tablename);

			tables.expenses = existingTables.includes('expenses');
			this.logger.debug('Database tables check completed', { tables });
			return tables;
		} catch (error) {
			this.logger.error('Database tables check failed', { error });
			return tables;
		}
	}

	/**
	 * Retrieves the current health status of the database.
	 *
	 * This method checks the database connection, measures latency, verifies required tables,
	 * and optionally retrieves record counts for key tables (e.g., expenses) if the connection is healthy.
	 * It logs relevant information and warnings during the process.
	 *
	 * @returns {Promise<IDatabaseHealthResponse>} A promise that resolves to an object containing:
	 *   - `connected`: Whether the database is connected.
	 *   - `latency`: The time in milliseconds taken to check the connection.
	 *   - `tables`: The status of required tables.
	 *   - `recordCounts` (optional): The number of records in key tables if available.
	 */

	public async getHealthStatus(): Promise<DatabaseHealthResponse> {
		const startTime = Date.now();
		const connected = await this.checkConnection();
		const latency = Date.now() - startTime;
		const tables = await this.checkTables();

		let recordCounts:
			| {
					expenses: number;
			  }
			| undefined;

		if (connected) {
			try {
				await this.validateConnection();
				const [expenses] = await Promise.all([this.client.expenses.count()]);

				recordCounts = {
					expenses,
				};

				this.logger.debug('Database record counts retrieved', { recordCounts });
			} catch (error) {
				this.logger.warn('Failed to retrieve record counts', { error });
			}
		}

		const status = {
			connected,
			latency,
			tables,
			...(recordCounts !== undefined && { recordCounts }),
		};

		this.logger.info('Database health status retrieved', {
			connected: status.connected,
			latency: status.latency,
		});

		return status;
	}

	/**
	 * Validates the current database client's connection.
	 *
	 * Checks if the client has a `$isPooledConnectionActive` method and, if so,
	 * invokes it to determine if the Prisma connection pool is active.
	 * Throws an error if the pool is not active.
	 *
	 * @throws {Error} If the Prisma pool is not active.
	 * @returns {Promise<void>} Resolves if the connection is valid.
	 */

	private async validateConnection(): Promise<void> {
		if (typeof (this.client as any).$isPooledConnectionActive === 'function') {
			const isActive = await (this.client as any).$isPooledConnectionActive();
			if (!isActive) throw new Error('Prisma pool not active');
		}
	}
}
