/**
 * Test server helper for integration tests - Expenses Service
 */

import type { Application } from 'express';
import type { IContainer, IHttpServer } from '@interfaces';
import { bootstrap } from '@bootstrap';
import type { GracefulShutdown } from '@infrastructure';

/**
 * TestServer manages the full application lifecycle for integration tests.
 */
export class TestServer {
  private container: IContainer | null = null;
  private shutdown: GracefulShutdown | null = null;
  private httpServer: IHttpServer | null = null;
  private readonly port: number;

  /**
   * @param port - Port to listen on (use 0 for random port assignment)
   */
  constructor(port: number = 0) {
    this.port = port;
  }

  /**
   * Starts the test server.
   *
   * @param skipDbValidation - Skip database connection validation (default: false)
   */
  public async start(skipDbValidation: boolean = false): Promise<void> {
    if (this.port !== 0) {
      process.env.PORT = this.port.toString();
    }

    const result = await bootstrap({ skipDbValidation });

    this.container = result.container;
    this.shutdown = result.shutdown;
    this.httpServer = this.container.resolve('HttpServer');
  }

  /**
   * Stops the test server gracefully.
   */
  public async stop(): Promise<void> {
    if (this.shutdown) {
      await this.shutdown.shutdown();
    }

    this.container = null;
    this.shutdown = null;
    this.httpServer = null;
  }

  /**
   * Gets the Express application instance.
   */
  public async getApp(): Promise<Application> {
    if (!this.httpServer) {
      throw new Error('Server not started. Call start() first.');
    }

    return await this.httpServer.getApp();
  }

  /**
   * Gets the dependency injection container.
   */
  public getContainer(): IContainer {
    if (!this.container) {
      throw new Error('Server not started. Call start() first.');
    }

    return this.container;
  }

  /**
   * Gets the actual port the server is listening on.
   */
  public getPort(): number {
    if (!this.httpServer) {
      throw new Error('Server not started. Call start() first.');
    }

    const info = this.httpServer.getServeInfo();
    return info.port;
  }

  /**
   * Constructs a full URL for testing.
   */
  public getUrl(path: string): string {
    const port = this.getPort();
    const basePath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:${port}${basePath}`;
  }

  /**
   * Checks if the server is currently running.
   */
  public isRunning(): boolean {
    return this.httpServer?.isRunning() ?? false;
  }
}
