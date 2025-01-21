-- src/lib/db/migrations/004_prep_calculations.sql

-- Function to calculate prep requirements
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
    minimum_quantity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_sales AS (
        -- Calculate average daily sales for each menu item
        SELECT 
            m.id as menu_item_id,
            EXTRACT(DOW FROM s.date) as day_of_week,
            AVG(s.quantity) as avg_quantity
        FROM sales s
        JOIN menu_items m ON s.menu_item_id = m.id
        WHERE 
            s.restaurant_id = p_restaurant_id
            AND s.date >= (p_date - INTERVAL '28 days')
            AND s.date < p_date
        GROUP BY m.id, EXTRACT(DOW FROM s.date)
    ),
    prep_requirements AS (
        -- Calculate base prep requirements
        SELECT 
            pi.id as prep_item_id,
            pi.name,
            pi.unit,
            pi.sheet_name,
            SUM(
                CASE 
                    WHEN EXTRACT(DOW FROM p_date) = ds.day_of_week 
                    THEN ds.avg_quantity * pim.quantity
                    ELSE 0 
                END
            ) as required_quantity,
            COALESCE(ps.buffer_percentage, 50) as buffer_percentage,
            COALESCE(ps.minimum_quantity, 0) as minimum_quantity
        FROM prep_items pi
        JOIN prep_item_mappings pim ON pi.id = pim.prep_item_id
        JOIN daily_sales ds ON pim.menu_item_id = ds.menu_item_id
        LEFT JOIN prep_settings ps ON pi.id = ps.prep_item_id 
            AND ps.restaurant_id = p_restaurant_id
        WHERE pi.restaurant_id = p_restaurant_id
        GROUP BY 
            pi.id, 
            pi.name, 
            pi.unit, 
            pi.sheet_name,
            ps.buffer_percentage,
            ps.minimum_quantity
    )
    SELECT 
        pr.prep_item_id,
        pr.name,
        pr.unit,
        pr.sheet_name,
        GREATEST(CEIL(pr.required_quantity), pr.minimum_quantity) as required_quantity,
        CEIL(pr.required_quantity * (pr.buffer_percentage / 100.0)) as buffer_quantity,
        pr.minimum_quantity
    FROM prep_requirements pr
    ORDER BY pr.sheet_name, pr.name;
END;
$$ LANGUAGE plpgsql;