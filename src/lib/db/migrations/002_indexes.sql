-- Indexes for foreign keys and common queries
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_prep_items_restaurant ON prep_items(restaurant_id);
CREATE INDEX idx_prep_mappings_menu_item ON prep_item_mappings(menu_item_id);
CREATE INDEX idx_prep_mappings_prep_item ON prep_item_mappings(prep_item_id);
CREATE INDEX idx_sales_restaurant_date ON sales(restaurant_id, date);
CREATE INDEX idx_sales_menu_item ON sales(menu_item_id);

-- Indexes for search/filter operations
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_prep_items_sheet_name ON prep_items(sheet_name);