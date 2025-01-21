import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                SELECT 
                    pi.id,
                    pi.name,
                    pi.unit,
                    pi.sheet_name,
                    pi.created_at,
                    pi.updated_at,
                    COALESCE(ps.buffer_percentage, 50) as buffer_percentage,
                    COALESCE(ps.minimum_quantity, 0) as minimum_quantity
                FROM prep_items pi
                LEFT JOIN prep_settings ps ON pi.id = ps.prep_item_id 
                    AND ps.restaurant_id = pi.restaurant_id
                WHERE pi.restaurant_id = $1
                ORDER BY pi.sheet_name, pi.name
            `,
            values: [restaurantId]
        });

        return NextResponse.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        console.error('Error fetching prep items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prep items' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, name, unit, sheetName } = body;

        // Validate required fields
        if (!restaurantId || !name || !unit || !sheetName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                INSERT INTO prep_items (
                    restaurant_id, 
                    name, 
                    unit, 
                    sheet_name,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING 
                    id, 
                    name, 
                    unit, 
                    sheet_name, 
                    created_at, 
                    updated_at
            `,
            values: [restaurantId, name, unit, sheetName]
        });

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error creating prep item:', error);
        return NextResponse.json(
            { error: 'Failed to create prep item' },
            { status: 500 }
        );
    }
}