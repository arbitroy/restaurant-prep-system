const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import test data
const { testData } = require('../src/lib/db/seed/testData');

// Console colors
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// Helper functions for colored output
const log = {
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
    progress: (current, total) => {
        process.stdout.write(`\r${colors.green}Progress: ${current}/${total}${colors.reset}`);
    }
};

async function testConnection(pool) {
    try {
        const client = await pool.connect();
        log.success('Successfully connected to database');
        client.release();
        return true;
    } catch (error) {
        log.error(`Failed to connect to database: ${error.message}`);
        return false;
    }
}

async function seed() {
    log.info('\n🌱 Starting database seed...\n');
    
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
        log.error('Aborting seed due to connection failure');
        process.exit(1);
    }

    try {
        await pool.query('BEGIN');

        // Create restaurant
        log.warn('\nCreating restaurant...');
        const { rows: [restaurant] } = await pool.query(`
            INSERT INTO restaurants (name)
            VALUES ($1)
            RETURNING id
        `, [testData.restaurants[0].name]);
        log.success(`Created restaurant: ${testData.restaurants[0].name}`);

        // Create menu items with progress tracking
        log.warn('\nCreating menu items...');
        const menuItemRows = [];
        for (const [index, item] of testData.menuItems.entries()) {
            const { rows } = await pool.query(`
                INSERT INTO menu_items (restaurant_id, name, category)
                VALUES ($1, $2, $3)
                RETURNING id, name
            `, [restaurant.id, item.name, item.category]);
            
            menuItemRows.push(rows[0]);
            log.progress(index + 1, testData.menuItems.length);
        }
        console.log('\n');

        // Create prep items with progress tracking
        log.warn('\nCreating prep items...');
        const prepItemRows = [];
        for (const [index, item] of testData.prepItems.entries()) {
            const { rows } = await pool.query(`
                INSERT INTO prep_items (restaurant_id, name, unit, sheet_name)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name
            `, [restaurant.id, item.name, item.unit, item.sheetName]);
            
            prepItemRows.push(rows[0]);
            log.progress(index + 1, testData.prepItems.length);
        }
        console.log('\n');

        // Create mappings with progress tracking
        log.warn('\nCreating prep item mappings...');
        let mappingCount = 0;
        for (const [index, mapping] of testData.itemMappings.entries()) {
            const menuItem = menuItemRows.find(row => row.name === mapping.menuItem);
            const prepItem = prepItemRows.find(row => row.name === mapping.prepItem);
            
            if (menuItem && prepItem) {
                await pool.query(`
                    INSERT INTO prep_item_mappings (menu_item_id, prep_item_id, quantity)
                    VALUES ($1, $2, $3)
                `, [menuItem.id, prepItem.id, mapping.quantity]);
                mappingCount++;
            }
            
            log.progress(index + 1, testData.itemMappings.length);
        }
        console.log(`\n`);
        log.success(`Created ${mappingCount} mappings`);

        // Generate and insert sales data with progress tracking
        log.warn('\nGenerating sales data...');
        const salesData = testData.generateSalesData(restaurant.id, menuItemRows);
        
        for (const [index, sale] of salesData.entries()) {
            await pool.query(`
                INSERT INTO sales (restaurant_id, menu_item_id, quantity, date)
                VALUES ($1, $2, $3, $4)
            `, [sale.restaurantId, sale.menuItemId, sale.quantity, sale.date]);
            
            if (index % 10 === 0) { // Update less frequently for better performance
                log.progress(index + 1, salesData.length);
            }
        }
        console.log('\n');

        await pool.query('COMMIT');
        log.success('\n✨ Seed data inserted successfully');

    } catch (error) {
        await pool.query('ROLLBACK');
        log.error('\nSeed failed: ' + error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Add error handling for the entire process
process.on('unhandledRejection', (error) => {
    log.error('\nUnhandled promise rejection: ' + error.message);
    process.exit(1);
});

// Execute the seed function
seed()
    .then(() => {
        log.success('\n✅ Database seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        log.error('\n❌ Database seeding failed: ' + error.message);
        process.exit(1);
    });