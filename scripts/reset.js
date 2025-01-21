const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testConnection(pool) {
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

async function reset() {
    console.log('Starting database reset...');
    
    const config = {
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DATABASE || 'prep_system',
    };

    console.log('Using database config:', {
        ...config,
        password: '[REDACTED]'
    });

    const pool = new Pool(config);

    // Test connection before proceeding
    const isConnected = await testConnection(pool);
    if (!isConnected) {
        console.error('Failed to connect to database');
        process.exit(1);
    }

    try {
        await pool.query('BEGIN');

        // Drop all tables in the correct order
        const dropQuery = `
            DROP TABLE IF EXISTS 
                sales,
                prep_item_mappings,
                prep_items,
                menu_items,
                restaurants,
                migrations
            CASCADE;
        `;

        await pool.query(dropQuery);
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

// Execute reset
reset()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });