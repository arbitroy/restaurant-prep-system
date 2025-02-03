const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function waitForDatabase(pool, maxAttempts = 10) {
    // Add debug logging
    console.log('Database connection configuration:', {
        hasUrl: !!process.env.DATABASE_URL,
        env: process.env.NODE_ENV,
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxAttempts} to connect to database...`);
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('Successfully connected to database');
            return true;
        } catch (error) {
            console.error(`Database connection attempt ${attempt}/${maxAttempts} failed:`, error.message);
            if (attempt === maxAttempts) {
                throw new Error('Failed to connect to database after multiple attempts');
            }
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 30000)));
        }
    }
}

async function migrate() {
    console.log('Starting migration process...');
    const config = process.env.DATABASE_URL ? 
        { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } } :
        {
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            host: process.env.POSTGRES_HOST,
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            database: process.env.POSTGRES_DATABASE,
        };

    const pool = new Pool(config);

    try {
        await waitForDatabase(pool);
        
        // Run migrations
        const migrationsDir = path.join(__dirname, '../src/lib/db/migrations');
        const files = await fs.readdir(migrationsDir);
        
        for (const file of files.sort()) {
            console.log(`Running migration: ${file}`);
            const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
            
            await pool.query('BEGIN');
            try {
                await pool.query(sql);
                await pool.query(
                    'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
                    [file]
                );
                await pool.query('COMMIT');
                console.log(`Migration ${file} completed`);
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        }
        
        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();