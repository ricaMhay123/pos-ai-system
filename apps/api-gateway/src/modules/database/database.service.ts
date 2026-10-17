import * as dotenv from 'dotenv';
dotenv.config();

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private isConnected = false;

  async onModuleInit() {
    try {
      const config = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          }
        : {
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432', 10),
            user: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'pos_db',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          };

      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
      this.logger.log(`🐘 PostgreSQL connection pool established successfully on database "${process.env.DATABASE_NAME || 'pos_db'}".`);
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ PostgreSQL server not reachable at startup (${err.message}). Using resilient active state store.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL connection pool drained.');
    }
  }

  get isDbConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Execute parameterized SQL query against PostgreSQL
   */
  async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database pool not connected');
    }
    const res = await this.pool.query(text, params);
    return res.rows as T[];
  }

  /**
   * Execute an atomic database transaction.
   * Runs callback inside BEGIN ... COMMIT, automatically issuing ROLLBACK on any failure.
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database pool not connected');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
