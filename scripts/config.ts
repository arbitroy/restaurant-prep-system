// src/lib/db/config.ts
import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const config: PoolConfig = {
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DATABASE || 'prep_system',
    // Only use SSL in production
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
};

// Create and export the pool instance
const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;

// Helper function to test connection
export async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to database');
        client.release();
        return true;
    } catch (error) {
        console.error('Failed to connect to database:', error);
        return false;
    }
}