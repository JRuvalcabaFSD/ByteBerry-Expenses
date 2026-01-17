/**
 * Global setup for integration tests
 *
 * Loads test environment variables before running tests
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test file
const envPath = resolve(process.cwd(), '.env.test');
config({ path: envPath });

console.log('✅ Test environment loaded from .env.test');


/**
 * Global setup for integration tests
 * Configures environment variables and test conditions
 */

beforeAll(() => {
	// Configure environment for testing
	process.env.NODE_ENV = 'test';
	process.env.LOG_LEVEL = 'error'; // Minimize logging noise in tests
	process.env.LOG_REQUESTS = 'false'; // Disable request logging

	// Use test-specific configuration
	process.env.PORT = '0'; // Use random available port
});
