const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function migrate() {
    console.log('Starting migration...');

    // Create a new pool for migrations
    const config = {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE,
        ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false
    };

    console.log('Migration config (without password):', {
        ...config,
        password: '[REDACTED]'
    });

    const pool = new Pool(config);

    try {
        // Test connection before proceeding
        await pool.query('SELECT NOW()');
        console.log('Successfully connected to database');

        // Create migrations table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Read migration files
        const migrationsDir = path.join(__dirname, '../src/lib/db/migrations');
        console.log('Reading migrations from:', migrationsDir);

        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter((f) => f.endsWith('.sql'))
            .sort();

        console.log('Found migration files:', migrationFiles);

        // Get executed migrations
        const { rows: executedMigrations } = await pool.query(
            'SELECT name FROM migrations'
        );
        const executedMigrationNames = executedMigrations.map((row) => row.name);

        // Execute pending migrations
        for (const file of migrationFiles) {
            if (!executedMigrationNames.includes(file)) {
                console.log(`Executing migration: ${file}`);
                const filePath = path.join(migrationsDir, file);
                const sql = await fs.readFile(filePath, 'utf-8');

                await pool.query('BEGIN');
                try {
                    await pool.query(sql);
                    await pool.query(
                        'INSERT INTO migrations (name) VALUES ($1)',
                        [file]
                    );
                    await pool.query('COMMIT');
                    console.log(`Migration ${file} completed successfully`);
                } catch (error) {
                    await pool.query('ROLLBACK');
                    console.error(`Migration ${file} failed:`, error);
                    throw error;
                }
            } else {
                console.log(`Skipping migration ${file} - already executed`);
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