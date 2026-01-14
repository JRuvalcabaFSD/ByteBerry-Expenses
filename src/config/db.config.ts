import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@prisma/client';
import type { IConfig, ILogger } from '@interfaces';
import { Injectable, LogContextClass, LogContextMethod } from '@shared';

//TODO documentar
declare module '@ServiceMap' {
	interface ServiceMap {
		DBConfig: DBConfig;
	}
}

/**
 * Manages database configuration and connection pooling for Prisma ORM.
 *
 * This class initializes a connection pool and Prisma client instance,
 * providing methods to retrieve the client, test the connection, and
 * gracefully disconnect from the database.
 *
 * @class DBConfig
 * @example
 * const dbConfig = new DBConfig(config, logger);
 * const client = dbConfig.getClient();
 * await dbConfig.testConnection();
 * await dbConfig.disconnect();
 */

@LogContextClass()
@Injectable({ name: 'DBConfig', depends: ['Config', 'Logger'] })
export class DBConfig {
	private readonly client: PrismaClient;
	private readonly pool: Pool;

	constructor(
		config: IConfig,
		private readonly logger: ILogger
	) {
		this.pool = new Pool({
			connectionString: config.databaseUrl,
			min: config.databasePoolMin,
			max: config.databasePoolMax,
		});

		const adapter = new PrismaPg(this.pool);
		this.client = new PrismaClient({ adapter });
	}

	/**
	 * Retrieves the Prisma client instance.
	 * @returns {PrismaClient} The Prisma client used for database operations.
	 */

	public getClient(): PrismaClient {
		return this.client;
	}

	/**
	 * Tests the database connection.
	 * @returns A promise that resolves to `true` if the connection is successful.
	 * @throws An error if the connection fails.
	 */

	@LogContextMethod()
	public async testConnection(): Promise<boolean> {
		await this.client.$queryRawUnsafe('SELECT 1');
		this.logger.info('Connection to the database was successful');
		return true;
	}

	/**
	 * Disconnects from the database and logs the disconnection.
	 * @returns A promise that resolves when the disconnection is complete.
	 */

	@LogContextMethod()
	public async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.$disconnect();
			this.logger.info('Disconnected with the database');
		}
	}
}
