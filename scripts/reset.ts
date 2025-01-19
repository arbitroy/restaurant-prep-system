const { Pool: PgPool } = require('pg');

async function reset() {
    const config = {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE,
    };

    const pool = new PgPool(config);

    try {
        await pool.query('BEGIN');

        // Drop all tables
        await pool.query(`
      DROP TABLE IF EXISTS 
        migrations,
        sales,
        prep_item_mappings,
        prep_items,
        menu_items,
        restaurants
      CASCADE
    `);

        await pool.query('COMMIT');
        console.log('Database reset successfully');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Reset failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

reset();