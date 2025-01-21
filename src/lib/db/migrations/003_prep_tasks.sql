-- Check if enum type exists first
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prep_status') THEN
        CREATE TYPE prep_status AS ENUM ('pending', 'in_progress', 'completed');
    END IF;
END $$;

-- Create prep tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS prep_tasks (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    prep_item_id INTEGER REFERENCES prep_items(id) ON DELETE CASCADE,
    required_quantity DECIMAL(10,2) NOT NULL,
    completed_quantity DECIMAL(10,2) DEFAULT 0,
    status prep_status DEFAULT 'pending',
    assigned_to VARCHAR(255),
    notes TEXT,
    date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create prep settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS prep_settings (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    prep_item_id INTEGER REFERENCES prep_items(id) ON DELETE CASCADE,
    buffer_percentage INTEGER DEFAULT 50,
    minimum_quantity DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, prep_item_id)
);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_prep_tasks_timestamp
    BEFORE UPDATE ON prep_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_prep_settings_timestamp
    BEFORE UPDATE ON prep_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();