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

    // Check for Render's provided database URL first
    if (process.env.DATABASE_URL) {
      return {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false // Required for Render's SSL connection
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      };
    }

    // Fallback to individual config parameters
    return {
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DATABASE,
      ssl: isProduction ? {
        rejectUnauthorized: false
      } : false
    };
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