import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

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

        console.log('Adding prep item:', { restaurantId, name, unit, sheetName });

        const { rows } = await query({
            text: `
                INSERT INTO prep_items 
                (restaurant_id, name, unit, sheet_name)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, unit, sheet_name, created_at, updated_at
            `,
            values: [restaurantId, name, unit, sheetName]
        });

        console.log('Added prep item:', rows[0]);

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error adding prep item:', error);
        
        if (error instanceof DatabaseError) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to add prep item' },
            { status: 500 }
        );
    }
}

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
                SELECT id, name, unit, sheet_name, created_at, updated_at
                FROM prep_items
                WHERE restaurant_id = $1
                ORDER BY sheet_name, name
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