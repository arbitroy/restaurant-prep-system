DO $$ 
BEGIN
    -- Indexes for foreign keys and common queries
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

    -- Indexes for search/filter operations
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_menu_items_category') THEN
        CREATE INDEX idx_menu_items_category ON menu_items(category);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prep_items_sheet_name') THEN
        CREATE INDEX idx_prep_items_sheet_name ON prep_items(sheet_name);
    END IF;

EXCEPTION 
    WHEN duplicate_table THEN 
        RAISE NOTICE 'Index already exists, skipping...';
    WHEN others THEN
        RAISE NOTICE 'Error creating indexes: %', SQLERRM;
        RAISE;
END $$;