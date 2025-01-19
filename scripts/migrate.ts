const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;

async function migrate() {
    // Load environment variables
    const config = {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE,
    };

    const pool = new Pool(config);

    try {
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
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter((f: string) => f.endsWith('.sql'))
            .sort();

        // Get executed migrations
        const { rows: executedMigrations } = await pool.query(
            'SELECT name FROM migrations'
        );
        const executedMigrationNames = executedMigrations.map((row: { name: any; }) => row.name);

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
