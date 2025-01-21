const testData = {
    restaurants: [
        { name: "Waynesville Prep Kitchen" }
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
        { name: "Buffalo Wings", category: "Appetizers" },
        { name: "Mozzarella Sticks", category: "Appetizers" },
        { name: "Loaded Nachos", category: "Appetizers" },
        { name: "Spinach Artichoke Dip", category: "Appetizers" },
        
        // Mains
        { name: "Grilled Salmon", category: "Mains" },
        { name: "Chicken Alfredo", category: "Mains" },
        { name: "Steak Frites", category: "Mains" },
        { name: "BBQ Ribs", category: "Mains" },
        
        // Burgers
        { name: "Classic Cheeseburger", category: "Burgers" },
        { name: "Bacon BBQ Burger", category: "Burgers" },
        { name: "Mushroom Swiss Burger", category: "Burgers" },
        { name: "Veggie Burger", category: "Burgers" },
        
        // Salads
        { name: "Caesar Salad", category: "Salads" },
        { name: "Greek Salad", category: "Salads" },
        { name: "Cobb Salad", category: "Salads" },
        
        // Sides
        { name: "French Fries", category: "Sides" },
        { name: "Sweet Potato Fries", category: "Sides" },
        { name: "Onion Rings", category: "Sides" },
        { name: "Coleslaw", category: "Sides" },
        
        // Desserts
        { name: "Chocolate Cake", category: "Desserts" },
        { name: "Apple Pie", category: "Desserts" },
        { name: "Ice Cream Sundae", category: "Desserts" }
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
        { name: "Diced Tomatoes", unit: "lb", sheetName: "AM Prep" },
        { name: "Sliced Onions", unit: "lb", sheetName: "AM Prep" },
        { name: "Chopped Lettuce", unit: "lb", sheetName: "AM Prep" },
        { name: "Diced Peppers", unit: "lb", sheetName: "AM Prep" },
        
        // PM Prep
        { name: "Grilled Chicken", unit: "lb", sheetName: "PM Prep" },
        { name: "Cooked Pasta", unit: "lb", sheetName: "PM Prep" },
        { name: "Cut Fries", unit: "lb", sheetName: "PM Prep" },
        
        // Sauces
        { name: "Buffalo Sauce", unit: "oz", sheetName: "Sauces" },
        { name: "BBQ Sauce", unit: "oz", sheetName: "Sauces" },
        { name: "Alfredo Sauce", unit: "oz", sheetName: "Sauces" },
        { name: "Caesar Dressing", unit: "oz", sheetName: "Sauces" },
        { name: "Ranch Dressing", unit: "oz", sheetName: "Sauces" },
        
        // Proteins
        { name: "Burger Patties", unit: "count", sheetName: "Proteins" },
        { name: "Marinated Salmon", unit: "lb", sheetName: "Proteins" },
        { name: "Prepped Wings", unit: "lb", sheetName: "Proteins" },
        
        // Weekly Prep
        { name: "Marinara Sauce", unit: "oz", sheetName: "Weekly Prep" },
        { name: "Coleslaw Mix", unit: "lb", sheetName: "Weekly Prep" },
        { name: "Veggie Patties", unit: "count", sheetName: "Weekly Prep" }
    ],

    // Mapping quantities for menu items to prep items
    itemMappings: [
        // Buffalo Wings
        { menuItem: "Buffalo Wings", prepItem: "Prepped Wings", quantity: 1 },
        { menuItem: "Buffalo Wings", prepItem: "Buffalo Sauce", quantity: 4 },
        
        // Burgers
        { menuItem: "Classic Cheeseburger", prepItem: "Burger Patties", quantity: 1 },
        { menuItem: "Classic Cheeseburger", prepItem: "Sliced Onions", quantity: 0.125 },
        { menuItem: "Classic Cheeseburger", prepItem: "Chopped Lettuce", quantity: 0.125 },
        { menuItem: "Classic Cheeseburger", prepItem: "Diced Tomatoes", quantity: 0.125 },
        
        // Salads
        { menuItem: "Caesar Salad", prepItem: "Chopped Lettuce", quantity: 0.5 },
        { menuItem: "Caesar Salad", prepItem: "Caesar Dressing", quantity: 3 },
        { menuItem: "Caesar Salad", prepItem: "Grilled Chicken", quantity: 0.25 },
        
        // Sides
        { menuItem: "French Fries", prepItem: "Cut Fries", quantity: 0.5 },
        { menuItem: "Coleslaw", prepItem: "Coleslaw Mix", quantity: 0.25 }
    ],

    // Sample sales data (last 30 days)
    generateSalesData: function(restaurantId, menuItems) {
        const sales = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 30; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            // Generate 10-20 sales entries per day
            const dailyEntries = Math.floor(Math.random() * 11) + 10;
            
            for (let j = 0; j < dailyEntries; j++) {
                // Random menu item
                const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
                
                // Random quantity (1-5)
                const quantity = Math.floor(Math.random() * 5) + 1;

                sales.push({
                    restaurantId,
                    menuItemId: menuItem.id,
                    quantity,
                    date: currentDate.toISOString()
                });
            }
        }

        return sales;
    }
};

module.exports = { testData };