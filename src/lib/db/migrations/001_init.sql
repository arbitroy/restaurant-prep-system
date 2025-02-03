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
  "order" INTEGER NOT NULL,
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

-- Create triggers for all tables
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

-- Create a function to automatically set order for new prep items
CREATE OR REPLACE FUNCTION set_prep_item_order() 
RETURNS TRIGGER AS $$
BEGIN
    -- Get the maximum order within the same sheet_name and restaurant_id
    SELECT COALESCE(MAX("order") + 1, 0)
    INTO NEW."order"
    FROM prep_items
    WHERE sheet_name = NEW.sheet_name
    AND restaurant_id = NEW.restaurant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set order on insert
CREATE TRIGGER set_prep_item_order_trigger
    BEFORE INSERT ON prep_items
    FOR EACH ROW
    EXECUTE FUNCTION set_prep_item_order();

-- Function to reorder all items within a sheet
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