CREATE TYPE prep_status AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE prep_tasks (
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

-- Add buffer settings table
CREATE TABLE prep_settings (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    prep_item_id INTEGER REFERENCES prep_items(id) ON DELETE CASCADE,
    buffer_percentage INTEGER DEFAULT 50,
    minimum_quantity DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, prep_item_id)
);