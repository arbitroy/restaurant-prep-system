import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

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
    // Get daily sales
    const { rows: dailyData } = await query({
        text: `
            SELECT 
                s.date,
                SUM(s.quantity) as total,
                json_agg(json_build_object(
                    'menuItemId', s.menu_item_id,
                    'name', m.name,
                    'quantity', s.quantity
                )) as items
            FROM sales s
            JOIN menu_items m ON s.menu_item_id = m.id
            WHERE s.restaurant_id = $1 
            AND s.date BETWEEN $2 AND $3
            GROUP BY s.date
            ORDER BY s.date
        `,
        values: [restaurantId, startDate, endDate]
    });

    // Get category summary
    const { rows: categoryData } = await query({
        text: `
            SELECT 
                m.category,
                SUM(s.quantity) as total
            FROM sales s
            JOIN menu_items m ON s.menu_item_id = m.id
            WHERE s.restaurant_id = $1 
            AND s.date BETWEEN $2 AND $3
            GROUP BY m.category
        `,
        values: [restaurantId, startDate, endDate]
    });

    // Calculate totals
    const totalSales = dailyData.reduce((sum, day) => sum + parseInt(day.total), 0);
    const averageDaily = totalSales / Math.max(dailyData.length, 1);

    return {
        summary: {
            totalSales,
            averageDaily,
            salesByCategory: categoryData.map(cat => ({
                ...cat,
                percentage: (parseInt(cat.total) / totalSales) * 100
            }))
        },
        dailyData
    };
}

async function getItemsReport(restaurantId: number, startDate: Date, endDate: Date) {
    const { rows: items } = await query({
        text: `
            SELECT 
                m.id as menu_item_id,
                m.name as menu_item_name,
                m.category,
                SUM(s.quantity) as total_quantity,
                AVG(s.quantity) as average_daily,
                json_agg(DISTINCT jsonb_build_object(
                    'prepItemId', p.id,
                    'name', p.name,
                    'unit', p.unit,
                    'totalUsage', (s.quantity * pm.quantity)
                )) as prep_items
            FROM menu_items m
            LEFT JOIN sales s ON m.id = s.menu_item_id
            LEFT JOIN prep_item_mappings pm ON m.id = pm.menu_item_id
            LEFT JOIN prep_items p ON pm.prep_item_id = p.id
            WHERE m.restaurant_id = $1 
            AND (s.date IS NULL OR s.date BETWEEN $2 AND $3)
            GROUP BY m.id, m.name, m.category
        `,
        values: [restaurantId, startDate, endDate]
    });

    return { items };
}

async function getTrendsReport(restaurantId: number, startDate: Date, endDate: Date) {
    // Get daily trends
    const { rows: dailyTrends } = await query({
        text: `
            SELECT 
                date,
                SUM(quantity) as total
            FROM sales
            WHERE restaurant_id = $1 
            AND date BETWEEN $2 AND $3
            GROUP BY date
            ORDER BY date
        `,
        values: [restaurantId, startDate, endDate]
    });

    // Get category trends
    const { rows: categoryTrends } = await query({
        text: `
            SELECT 
                m.category,
                SUM(s.quantity) as total
            FROM sales s
            JOIN menu_items m ON s.menu_item_id = m.id
            WHERE s.restaurant_id = $1 
            AND s.date BETWEEN $2 AND $3
            GROUP BY m.category
        `,
        values: [restaurantId, startDate, endDate]
    });

    // Simple predictions
    const predictions = dailyTrends.map((day, index, array) => {
        const trend = index > 0 
            ? ((parseInt(day.total) - parseInt(array[index - 1].total)) / parseInt(array[index - 1].total)) * 100
            : 0;
        return {
            ...day,
            trend,
            predictedTotal: parseInt(day.total) * (1 + (trend / 100))
        };
    });

    return {
        dailyTrends: dailyTrends.map((day, index) => ({
            ...day,
            trend: index > 0 
                ? ((parseInt(day.total) - parseInt(dailyTrends[index - 1].total)) / parseInt(dailyTrends[index - 1].total)) * 100
                : 0
        })),
        categoryTrends,
        predictions
    };
}