-- First create migrations table if not exists
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create base tables with IF NOT EXISTS checks
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prep_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    sheet_name VARCHAR(100) NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prep_item_mappings (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    prep_item_id INTEGER REFERENCES prep_items(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(menu_item_id, prep_item_id)
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist and recreate them
DO $$ 
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_restaurant_updated_at ON restaurants;
    DROP TRIGGER IF EXISTS update_menu_item_updated_at ON menu_items;
    DROP TRIGGER IF EXISTS update_prep_item_updated_at ON prep_items;
    DROP TRIGGER IF EXISTS update_prep_mapping_updated_at ON prep_item_mappings;
    DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
    
    -- Create triggers
    CREATE TRIGGER update_restaurant_updated_at
        BEFORE UPDATE ON restaurants
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_menu_item_updated_at
        BEFORE UPDATE ON menu_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_prep_item_updated_at
        BEFORE UPDATE ON prep_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_prep_mapping_updated_at
        BEFORE UPDATE ON prep_item_mappings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_sales_updated_at
        BEFORE UPDATE ON sales
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Function to automatically set order for new prep items
-- Drop if exists and recreate
DROP FUNCTION IF EXISTS set_prep_item_order() CASCADE;

CREATE OR REPLACE FUNCTION set_prep_item_order() 
RETURNS TRIGGER AS $$
BEGIN
    -- Get the maximum order within the same sheet_name and restaurant_id
    IF NEW."order" IS NULL THEN
        SELECT COALESCE(MAX("order") + 1, 0)
        INTO NEW."order"
        FROM prep_items
        WHERE sheet_name = NEW.sheet_name
        AND restaurant_id = NEW.restaurant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_prep_item_order_trigger ON prep_items;

CREATE TRIGGER set_prep_item_order_trigger
    BEFORE INSERT ON prep_items
    FOR EACH ROW
    EXECUTE FUNCTION set_prep_item_order();

-- Function to reorder prep items
DROP FUNCTION IF EXISTS reorder_prep_items(INTEGER, VARCHAR);

CREATE OR REPLACE FUNCTION reorder_prep_items(p_restaurant_id INTEGER, p_sheet_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    item RECORD;
    current_order INTEGER := 0;
BEGIN
    FOR item IN (
        SELECT id 
        FROM prep_items 
        WHERE restaurant_id = p_restaurant_id 
        AND sheet_name = p_sheet_name 
        ORDER BY name
    ) LOOP
        UPDATE prep_items 
        SET "order" = current_order 
        WHERE id = item.id;
        
        current_order := current_order + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_menu_items_restaurant') THEN
        CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prep_items_restaurant') THEN
        CREATE INDEX idx_prep_items_restaurant ON prep_items(restaurant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prep_mappings_menu_item') THEN
        CREATE INDEX idx_prep_mappings_menu_item ON prep_item_mappings(menu_item_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prep_mappings_prep_item') THEN
        CREATE INDEX idx_prep_mappings_prep_item ON prep_item_mappings(prep_item_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_restaurant_date') THEN
        CREATE INDEX idx_sales_restaurant_date ON sales(restaurant_id, date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_menu_item') THEN
        CREATE INDEX idx_sales_menu_item ON sales(menu_item_id);
    END IF;
END $$;