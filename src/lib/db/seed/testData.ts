interface Restaurant {
    name: string;
}

interface MenuItem {
    name: string;
    category: string;
}

interface PrepItem {
    name: string;
    unit: string;
    sheetName: string;
}

interface ItemMapping {
    menuItem: string;
    prepItem: string;
    quantity: number;
}

interface SalesData {
    restaurantId: string;
    menuItemId: string;
    quantity: number;
    date: string;
}

const testData = {
    restaurants: [
        { name: "Waynesville Prep Kitchen" } as Restaurant
    ],
    
    menuCategories: [
        "Appetizers",
        "Mains",
        "Burgers",
        "Salads",
        "Sides",
        "Desserts"
    ],

    menuItems: [
        // Appetizers
        { name: "Buffalo Wings", category: "Appetizers" } as MenuItem,
        { name: "Mozzarella Sticks", category: "Appetizers" } as MenuItem,
        { name: "Loaded Nachos", category: "Appetizers" } as MenuItem,
        { name: "Spinach Artichoke Dip", category: "Appetizers" } as MenuItem,
        
        // Mains
        { name: "Grilled Salmon", category: "Mains" } as MenuItem,
        { name: "Chicken Alfredo", category: "Mains" } as MenuItem,
        { name: "Steak Frites", category: "Mains" } as MenuItem,
        { name: "BBQ Ribs", category: "Mains" } as MenuItem,
        
        // Burgers
        { name: "Classic Cheeseburger", category: "Burgers" } as MenuItem,
        { name: "Bacon BBQ Burger", category: "Burgers" } as MenuItem,
        { name: "Mushroom Swiss Burger", category: "Burgers" } as MenuItem,
        { name: "Veggie Burger", category: "Burgers" } as MenuItem,
        
        // Salads
        { name: "Caesar Salad", category: "Salads" } as MenuItem,
        { name: "Greek Salad", category: "Salads" } as MenuItem,
        { name: "Cobb Salad", category: "Salads" } as MenuItem,
        
        // Sides
        { name: "French Fries", category: "Sides" } as MenuItem,
        { name: "Sweet Potato Fries", category: "Sides" } as MenuItem,
        { name: "Onion Rings", category: "Sides" } as MenuItem,
        { name: "Coleslaw", category: "Sides" } as MenuItem,
        
        // Desserts
        { name: "Chocolate Cake", category: "Desserts" } as MenuItem,
        { name: "Apple Pie", category: "Desserts" } as MenuItem,
        { name: "Ice Cream Sundae", category: "Desserts" } as MenuItem
    ],

    prepSheets: [
        "AM Prep",
        "PM Prep",
        "Sauces",
        "Proteins",
        "Weekly Prep"
    ],

    prepItems: [
        // AM Prep
        { name: "Diced Tomatoes", unit: "lb", sheetName: "AM Prep" } as PrepItem,
        { name: "Sliced Onions", unit: "lb", sheetName: "AM Prep" } as PrepItem,
        { name: "Chopped Lettuce", unit: "lb", sheetName: "AM Prep" } as PrepItem,
        { name: "Diced Peppers", unit: "lb", sheetName: "AM Prep" } as PrepItem,
        
        // PM Prep
        { name: "Grilled Chicken", unit: "lb", sheetName: "PM Prep" } as PrepItem,
        { name: "Cooked Pasta", unit: "lb", sheetName: "PM Prep" } as PrepItem,
        { name: "Cut Fries", unit: "lb", sheetName: "PM Prep" } as PrepItem,
        
        // Sauces
        { name: "Buffalo Sauce", unit: "oz", sheetName: "Sauces" } as PrepItem,
        { name: "BBQ Sauce", unit: "oz", sheetName: "Sauces" } as PrepItem,
        { name: "Alfredo Sauce", unit: "oz", sheetName: "Sauces" } as PrepItem,
        { name: "Caesar Dressing", unit: "oz", sheetName: "Sauces" } as PrepItem,
        { name: "Ranch Dressing", unit: "oz", sheetName: "Sauces" } as PrepItem,
        
        // Proteins
        { name: "Burger Patties", unit: "count", sheetName: "Proteins" } as PrepItem,
        { name: "Marinated Salmon", unit: "lb", sheetName: "Proteins" } as PrepItem,
        { name: "Prepped Wings", unit: "lb", sheetName: "Proteins" } as PrepItem,
        
        // Weekly Prep
        { name: "Marinara Sauce", unit: "oz", sheetName: "Weekly Prep" } as PrepItem,
        { name: "Coleslaw Mix", unit: "lb", sheetName: "Weekly Prep" } as PrepItem,
        { name: "Veggie Patties", unit: "count", sheetName: "Weekly Prep" } as PrepItem
    ],

    // Mapping quantities for menu items to prep items
    itemMappings: [
        // Buffalo Wings
        { menuItem: "Buffalo Wings", prepItem: "Prepped Wings", quantity: 1 } as ItemMapping,
        { menuItem: "Buffalo Wings", prepItem: "Buffalo Sauce", quantity: 4 } as ItemMapping,
        
        // Burgers
        { menuItem: "Classic Cheeseburger", prepItem: "Burger Patties", quantity: 1 } as ItemMapping,
        { menuItem: "Classic Cheeseburger", prepItem: "Sliced Onions", quantity: 0.125 } as ItemMapping,
        { menuItem: "Classic Cheeseburger", prepItem: "Chopped Lettuce", quantity: 0.125 } as ItemMapping,
        { menuItem: "Classic Cheeseburger", prepItem: "Diced Tomatoes", quantity: 0.125 } as ItemMapping,
        
        // Salads
        { menuItem: "Caesar Salad", prepItem: "Chopped Lettuce", quantity: 0.5 } as ItemMapping,
        { menuItem: "Caesar Salad", prepItem: "Caesar Dressing", quantity: 3 } as ItemMapping,
        { menuItem: "Caesar Salad", prepItem: "Grilled Chicken", quantity: 0.25 } as ItemMapping,
        
        // Sides
        { menuItem: "French Fries", prepItem: "Cut Fries", quantity: 0.5 } as ItemMapping,
        { menuItem: "Coleslaw", prepItem: "Coleslaw Mix", quantity: 0.25 } as ItemMapping
    ],

    // Sample sales data (last 30 days)
    generateSalesData(restaurantId: number, menuItemRows: Array<{id: number; name: string}>) {
        const sales = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 30; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            // Generate 10-20 sales entries per day
            const dailyEntries = Math.floor(Math.random() * 11) + 10;
            
            for (let j = 0; j < dailyEntries; j++) {
                // Get random menu item from the actual database rows
                const menuItem = menuItemRows[Math.floor(Math.random() * menuItemRows.length)];
                
                if (!menuItem || !menuItem.id) {
                    console.warn('Invalid menu item found, skipping:', menuItem);
                    continue;
                }

                // Random quantity (1-5)
                const quantity = Math.floor(Math.random() * 5) + 1;

                sales.push({
                    restaurantId: restaurantId,
                    menuItemId: menuItem.id, // Use the database ID
                    quantity: quantity,
                    date: currentDate.toISOString()
                });
            }
        }

        return sales;
    }
};

module.exports = { testData };