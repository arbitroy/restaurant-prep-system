const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;

async function waitForDatabase(pool, maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxAttempts} to connect to database...`);
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('Successfully connected to database');
            return true;
        } catch (error) {
            console.log(`Database connection attempt ${attempt}/${maxAttempts} failed:`, error.message);
            if (attempt === maxAttempts) {
                throw new Error('Failed to connect to database after multiple attempts');
            }
            // Increase wait time between attempts
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        }
    }
}
async function migrate() {
    console.log('Starting migration process...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { 
            rejectUnauthorized: false 
        } : false
    });

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