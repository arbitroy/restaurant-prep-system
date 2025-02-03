import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface DatabaseConfig extends PoolConfig {
  ssl?: boolean | {
    rejectUnauthorized: boolean;
  };
}

class DatabasePool {
  private static instance: Pool;

  private static getConfig(): DatabaseConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const baseConfig: DatabaseConfig = {
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DATABASE || 'prep_system',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    };

    if (isProduction) {
      return {
        ...baseConfig,
        ssl: { rejectUnauthorized: false },
        // Production optimizations
        statement_timeout: 10000,
        query_timeout: 10000
      };
    }

    return baseConfig;
  }

  static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool(DatabasePool.getConfig());

      // Event handlers
      DatabasePool.instance.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        // In production, log error but don't crash
        if (process.env.NODE_ENV !== 'production') {
          process.exit(-1);
        }
      });

      DatabasePool.instance.on('connect', () => {
        console.log('New database connection established');
      });
    }

    return DatabasePool.instance;
  }

  static async end(): Promise<void> {
    if (DatabasePool.instance) {
      await DatabasePool.instance.end();
      DatabasePool.instance = undefined!;
    }
  }
}

// Get pool instance
const pool = DatabasePool.getInstance();

// Helper functions that maintain the existing API
export async function query<T extends QueryResultRow>(config: { 
  text: string; 
  values?: unknown[] 
}): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query(config);
  } finally {
    client.release();
  }
}

export async function transaction<T>(
  callback: (client: unknown) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function validateConnection(maxAttempts = 5): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
          return true;
      } catch (error) {
          console.error(`Database connection attempt ${attempt}/${maxAttempts} failed:`, error);
          if (attempt === maxAttempts) return false;
          await new Promise(resolve => setTimeout(resolve, 5000));
      }
  }
  return false;
}

// Export testConnection function for health checks
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Successfully connected to database');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// Export pool for direct access if needed
export default pool;