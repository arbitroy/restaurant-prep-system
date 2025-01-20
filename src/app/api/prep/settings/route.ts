import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

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
                    ps.*,
                    pi.name as item_name,
                    pi.unit
                FROM prep_settings ps
                JOIN prep_items pi ON ps.prep_item_id = pi.id
                WHERE ps.restaurant_id = $1
            `,
            values: [restaurantId]
        });

        return NextResponse.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch prep settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, prepItemId, bufferPercentage, minimumQuantity } = body;

        const { rows } = await query({
            text: `
                INSERT INTO prep_settings (
                    restaurant_id, prep_item_id, 
                    buffer_percentage, minimum_quantity
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (restaurant_id, prep_item_id) DO UPDATE
                SET 
                    buffer_percentage = $3,
                    minimum_quantity = $4
                RETURNING *
            `,
            values: [restaurantId, prepItemId, bufferPercentage, minimumQuantity]
        });

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update prep settings' },
            { status: 500 }
        );
    }
}