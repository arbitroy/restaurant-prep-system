const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function seed() {
    console.log('Starting database seed...');
    
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

    console.log('Seed config (without password):', {
        ...config,
        password: '[REDACTED]'
    });

    const pool = new Pool(config);

    try {
        // Test connection before proceeding
        await pool.query('SELECT NOW()');
        console.log('Successfully connected to database');

        await pool.query('BEGIN');

        // Insert sample restaurant
        console.log('Creating sample restaurant...');
        const { rows: [restaurant] } = await pool.query(`
            INSERT INTO restaurants (name)
            VALUES ($1)
            RETURNING id
        `, ['Sample Restaurant']);

        // Insert sample menu items
        console.log('Creating menu items...');
        const menuItems = [
            { name: 'Chicken Wings', category: 'Appetizers' },
            { name: 'French Fries', category: 'Sides' },
            { name: 'Burger', category: 'Mains' },
            { name: 'Caesar Salad', category: 'Salads' },
            { name: 'Buffalo Wings', category: 'Appetizers' }
        ];

        for (const item of menuItems) {
            await pool.query(`
                INSERT INTO menu_items (restaurant_id, name, category)
                VALUES ($1, $2, $3)
            `, [restaurant.id, item.name, item.category]);
        }

        // Insert sample prep items
        console.log('Creating prep items...');
        const prepItems = [
            { name: 'Wing Sauce', unit: 'oz', sheetName: 'Sauces' },
            { name: 'Cut Fries', unit: 'lb', sheetName: 'Prep List' },
            { name: 'Burger Patties', unit: 'count', sheetName: 'Proteins' },
            { name: 'Caesar Dressing', unit: 'oz', sheetName: 'Sauces' },
            { name: 'Buffalo Sauce', unit: 'oz', sheetName: 'Sauces' }
        ];

        for (const item of prepItems) {
            await pool.query(`
                INSERT INTO prep_items (restaurant_id, name, unit, sheet_name)
                VALUES ($1, $2, $3, $4)
            `, [restaurant.id, item.name, item.unit, item.sheetName]);
        }

        // Sample mapping between menu items and prep items
        console.log('Creating prep item mappings...');
        const mappings = [
            { menuItem: 'Chicken Wings', prepItem: 'Wing Sauce', quantity: 2 },
            { menuItem: 'French Fries', prepItem: 'Cut Fries', quantity: 0.5 },
            { menuItem: 'Burger', prepItem: 'Burger Patties', quantity: 1 },
            { menuItem: 'Caesar Salad', prepItem: 'Caesar Dressing', quantity: 3 },
            { menuItem: 'Buffalo Wings', prepItem: 'Buffalo Sauce', quantity: 2 }
        ];

        for (const mapping of mappings) {
            const { rows: [menuItem] } = await pool.query(
                'SELECT id FROM menu_items WHERE name = $1 AND restaurant_id = $2',
                [mapping.menuItem, restaurant.id]
            );

            const { rows: [prepItem] } = await pool.query(
                'SELECT id FROM prep_items WHERE name = $1 AND restaurant_id = $2',
                [mapping.prepItem, restaurant.id]
            );

            await pool.query(`
                INSERT INTO prep_item_mappings (menu_item_id, prep_item_id, quantity)
                VALUES ($1, $2, $3)
            `, [menuItem.id, prepItem.id, mapping.quantity]);
        }

        await pool.query('COMMIT');
        console.log('Seed data inserted successfully');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Seed failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Execute the seed function
seed()
    .then(() => {
        console.log('Database seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database seeding failed:', error);
        process.exit(1);
    });