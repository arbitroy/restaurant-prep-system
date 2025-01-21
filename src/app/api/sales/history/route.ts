import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!restaurantId || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                SELECT 
                    s.id,
                    s.menu_item_id,
                    s.quantity,
                    s.date,
                    m.name as item_name,
                    pim.prep_item_id,
                    pim.quantity as prep_quantity,
                    pi.name as prep_name,
                    pi.unit
                FROM sales s
                JOIN menu_items m ON s.menu_item_id = m.id
                JOIN prep_item_mappings pim ON m.id = pim.menu_item_id
                JOIN prep_items pi ON pim.prep_item_id = pi.id
                WHERE s.restaurant_id = $1 
                AND s.date BETWEEN $2 AND $3
            `,
            values: [restaurantId, startDate, endDate]
        });

        return NextResponse.json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching sales history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sales history' },
            { status: 500 }
        );
    }
}