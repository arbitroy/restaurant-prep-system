import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, name, unit, sheetName } = body;

        if (!restaurantId || !name || !unit || !sheetName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                INSERT INTO prep_items (restaurant_id, name, unit, sheet_name)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `,
            values: [restaurantId, name, unit, sheetName]
        });

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        if (error instanceof DatabaseError) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}