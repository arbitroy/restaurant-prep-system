import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const date = searchParams.get('date');

        if (!restaurantId || !date) {
            return NextResponse.json(
                { error: 'Restaurant ID and date are required' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                SELECT 
                    pt.*,
                    pi.name as item_name,
                    pi.unit,
                    pi.sheet_name,
                    ps.buffer_percentage,
                    ps.minimum_quantity
                FROM prep_tasks pt
                JOIN prep_items pi ON pt.prep_item_id = pi.id
                LEFT JOIN prep_settings ps ON (
                    ps.prep_item_id = pi.id AND 
                    ps.restaurant_id = pt.restaurant_id
                )
                WHERE pt.restaurant_id = $1 AND pt.date = $2
                ORDER BY pi.sheet_name, pi.name
            `,
            values: [restaurantId, date]
        });

        return NextResponse.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch prep tasks' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, prepItemId, requiredQuantity, date, assignedTo, notes } = body;

        const { rows } = await query({
            text: `
                INSERT INTO prep_tasks (
                    restaurant_id, prep_item_id, required_quantity, 
                    date, assigned_to, notes
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `,
            values: [restaurantId, prepItemId, requiredQuantity, date, assignedTo, notes]
        });

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create prep task' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, completedQuantity, status, notes } = body;

        const { rows } = await query({
            text: `
                UPDATE prep_tasks
                SET 
                    completed_quantity = $2,
                    status = $3,
                    notes = $4,
                    completed_at = CASE WHEN $3 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
                WHERE id = $1
                RETURNING *
            `,
            values: [id, completedQuantity, status, notes]
        });

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update prep task' },
            { status: 500 }
        );
    }
}