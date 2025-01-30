import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const type = searchParams.get('type');

        if (!restaurantId || !startDate || !endDate || !type) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        let data;
        switch (type) {
            case 'sales':
                data = await getSalesReport(parseInt(restaurantId), new Date(startDate), new Date(endDate));
                break;
            case 'items':
                data = await getItemsReport(parseInt(restaurantId), new Date(startDate), new Date(endDate));
                break;
            case 'trends':
                data = await getTrendsReport(parseInt(restaurantId), new Date(startDate), new Date(endDate));
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid report type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        console.error('Report generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}

async function getSalesReport(restaurantId: number, startDate: Date, endDate: Date) {
    // Category data with percentages calculated in SQL
    const { rows: categoryData } = await query({
        text: `
            WITH category_totals AS (
                SELECT 
                    m.category,
                    SUM(s.quantity) as total
                FROM sales s
                JOIN menu_items m ON s.menu_item_id = m.id
                WHERE s.restaurant_id = $1 
                AND s.date BETWEEN $2 AND $3
                GROUP BY m.category
            ),
            total_sales AS (
                SELECT SUM(total) as grand_total
                FROM category_totals
            )
            SELECT 
                ct.category,
                ct.total,
                ROUND((ct.total::numeric / ts.grand_total * 100)::numeric, 2) as percentage
            FROM category_totals ct
            CROSS JOIN total_sales ts
            ORDER BY ct.total DESC
        `,
        values: [restaurantId, startDate, endDate]
    });

    // Daily data with proper aggregation
    const { rows: dailyData } = await query({
        text: `
            SELECT 
                s.date,
                SUM(s.quantity) as total,
                jsonb_agg(jsonb_build_object(
                    'menuItemId', s.menu_item_id,
                    'name', m.name,
                    'quantity', s.quantity
                ) ORDER BY s.quantity DESC) as items
            FROM sales s
            JOIN menu_items m ON s.menu_item_id = m.id
            WHERE s.restaurant_id = $1 
            AND s.date BETWEEN $2 AND $3
            GROUP BY s.date
            ORDER BY s.date
        `,
        values: [restaurantId, startDate, endDate]
    });

    return {
        summary: {
            totalSales: categoryData.reduce((sum, cat) => sum + parseInt(cat.total), 0),
            averageDaily: dailyData.length > 0 
                ? dailyData.reduce((sum, day) => sum + parseInt(day.total), 0) / dailyData.length 
                : 0,
            salesByCategory: categoryData
        },
        dailyData
    };
}

async function getItemsReport(restaurantId: number, startDate: Date, endDate: Date) {
    try {
        const { rows: items } = await query({
            text: `
                WITH item_totals AS (
                    SELECT 
                        m.id as menu_item_id,
                        m.name,
                        m.category,
                        COALESCE(SUM(s.quantity), 0) as total_quantity,
                        COALESCE(AVG(s.quantity), 0) as average_daily
                    FROM menu_items m
                    LEFT JOIN sales s ON m.id = s.menu_item_id 
                        AND s.date BETWEEN $2 AND $3
                    WHERE m.restaurant_id = $1
                    GROUP BY m.id, m.name, m.category
                ),
                prep_usage AS (
                    SELECT 
                        m.id as menu_item_id,
                        COALESCE(
                            json_agg(
                                CASE WHEN p.id IS NOT NULL THEN
                                    json_build_object(
                                        'prepItemId', p.id,
                                        'name', p.name,
                                        'unit', p.unit,
                                        'totalUsage', COALESCE(s.quantity * pm.quantity, 0)
                                    )
                                END
                            ) FILTER (WHERE p.id IS NOT NULL),
                            '[]'
                        ) as prep_items
                    FROM menu_items m
                    LEFT JOIN prep_item_mappings pm ON m.id = pm.menu_item_id
                    LEFT JOIN prep_items p ON pm.prep_item_id = p.id
                    LEFT JOIN sales s ON m.id = s.menu_item_id 
                        AND s.date BETWEEN $2 AND $3
                    WHERE m.restaurant_id = $1
                    GROUP BY m.id
                )
                SELECT 
                    it.menu_item_id as "menuItemId",
                    it.name,
                    it.category,
                    it.total_quantity as "totalQuantity",
                    it.average_daily as "averageDaily",
                    COALESCE(pu.prep_items, '[]'::json) as "prepItems"
                FROM item_totals it
                LEFT JOIN prep_usage pu ON it.menu_item_id = pu.menu_item_id
                ORDER BY it.total_quantity DESC
            `,
            values: [restaurantId, startDate, endDate]
        });

        return {
            items: items.map(item => ({
                menuItemId: item.menuItemId,
                name: item.name,
                category: item.category,
                totalQuantity: Number(item.totalQuantity) || 0,
                averageDaily: Number(item.averageDaily) || 0,
                prepItems: Array.isArray(item.prepItems) 
                    ? item.prepItems.filter(Boolean).map(prep => ({
                        prepItemId: prep.prepItemId,
                        name: prep.name,
                        totalUsage: Number(prep.totalUsage) || 0,
                        unit: prep.unit || 'unit'
                    }))
                    : []
            }))
        };
    } catch (error) {
        console.error('Items report error:', error);
        throw new Error('Failed to generate items report');
    }
}

async function getTrendsReport(restaurantId: number, startDate: Date, endDate: Date) {
    const { rows: dailyTrends } = await query<{
        date: string;
        total: string;
    }>({
        text: `
            SELECT 
                date::text as date,
                SUM(quantity)::text as total
            FROM sales
            WHERE restaurant_id = $1 
            AND date BETWEEN $2 AND $3
            GROUP BY date
            ORDER BY date
        `,
        values: [restaurantId, startDate, endDate]
    });

    const { rows: categoryTrends } = await query<{
        category: string;
        total: string;
    }>({
        text: `
            SELECT 
                m.category,
                SUM(s.quantity)::text as total
            FROM sales s
            JOIN menu_items m ON s.menu_item_id = m.id
            WHERE s.restaurant_id = $1 
            AND s.date BETWEEN $2 AND $3
            GROUP BY m.category
        `,
        values: [restaurantId, startDate, endDate]
    });

    // Process and return with proper types
    return {
        dailyTrends: dailyTrends.map((day, index) => ({
            date: day.date,
            total: day.total,
            trend: index > 0 
                ? ((parseInt(day.total) - parseInt(dailyTrends[index - 1].total)) / 
                   parseInt(dailyTrends[index - 1].total)) * 100
                : 0
        })),
        categoryTrends: categoryTrends.map(cat => ({
            category: cat.category,
            total: cat.total
        })),
        predictions: dailyTrends.map((day, index) => ({
            date: day.date,
            predictedTotal: parseInt(day.total),
            trend: index > 0 
                ? ((parseInt(day.total) - parseInt(dailyTrends[index - 1].total)) / 
                   parseInt(dailyTrends[index - 1].total)) * 100
                : 0
        }))
    };
}