-- src/lib/db/migrations/004_prep_calculations.sql
DROP FUNCTION IF EXISTS calculate_prep_requirements;

CREATE OR REPLACE FUNCTION calculate_prep_requirements(
    p_restaurant_id INTEGER,
    p_date DATE
)
RETURNS TABLE (
    prep_item_id INTEGER,
    name VARCHAR,
    unit VARCHAR,
    sheet_name VARCHAR,
    required_quantity DECIMAL,
    buffer_quantity DECIMAL,
    minimum_quantity DECIMAL,
    menu_items JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_avg AS (
        -- Calculate daily averages with proper grouping by day of week
        SELECT 
            s.prep_item_id,
            EXTRACT(DOW FROM s.date) as day_of_week,
            AVG(s.quantity * s.prep_quantity) as avg_usage,
            jsonb_agg(
                jsonb_build_object(
                    'menuItemId', s.menu_item_id,
                    'menuItemName', s.item_name,
                    'quantity', s.prep_quantity
                )
            ) as menu_items_data
        FROM 
            (
                SELECT 
                    pim.prep_item_id,
                    s.date,
                    s.quantity,
                    pim.quantity as prep_quantity,
                    s.menu_item_id,
                    m.name as item_name
                FROM sales s
                JOIN menu_items m ON s.menu_item_id = m.id
                JOIN prep_item_mappings pim ON m.id = pim.menu_item_id
                WHERE 
                    s.restaurant_id = p_restaurant_id
                    AND s.date >= (p_date - INTERVAL '28 days')
                    AND s.date < p_date
            ) s
        GROUP BY 
            s.prep_item_id,
            EXTRACT(DOW FROM s.date)
    ),
    prep_calcs AS (
        -- Calculate requirements including next day buffer
        SELECT 
            pi.id as prep_item_id,
            pi.name,
            pi.unit,
            pi.sheet_name,
            COALESCE(cur_day.avg_usage, 0) + 
            COALESCE(next_day.avg_usage * 0.5, 0) as base_quantity,
            COALESCE(ps.buffer_percentage, 50) as buffer_percentage,
            COALESCE(ps.minimum_quantity, 0) as minimum_quantity,
            COALESCE(cur_day.menu_items_data, '[]'::jsonb) as menu_items
        FROM prep_items pi
        LEFT JOIN daily_avg cur_day ON 
            pi.id = cur_day.prep_item_id 
            AND cur_day.day_of_week = EXTRACT(DOW FROM p_date)
        LEFT JOIN daily_avg next_day ON 
            pi.id = next_day.prep_item_id 
            AND next_day.day_of_week = EXTRACT(DOW FROM p_date + INTERVAL '1 day')
        LEFT JOIN prep_settings ps ON 
            pi.id = ps.prep_item_id 
            AND ps.restaurant_id = p_restaurant_id
        WHERE pi.restaurant_id = p_restaurant_id
    )
    SELECT
        pc.prep_item_id,
        pc.name,
        pc.unit,
        pc.sheet_name,
        CEIL(GREATEST(pc.base_quantity, pc.minimum_quantity)) as required_quantity,
        CEIL(pc.base_quantity * (pc.buffer_percentage / 100.0)) as buffer_quantity,
        pc.minimum_quantity,
        pc.menu_items
    FROM prep_calcs pc
    ORDER BY pc.sheet_name, pc.name;
END;
$$ LANGUAGE plpgsql;