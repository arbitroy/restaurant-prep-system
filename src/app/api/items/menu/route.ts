import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, name, category } = body;

        if (!restaurantId || !name || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                INSERT INTO menu_items (restaurant_id, name, category)
                VALUES ($1, $2, $3)
                RETURNING id, name, category
            `,
            values: [restaurantId, name, category]
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

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, category } = body;

        if (!id || !name || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                UPDATE menu_items
                SET name = $2, category = $3
                WHERE id = $1
                RETURNING id, name, category
            `,
            values: [id, name, category]
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

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        await query({
            text: 'DELETE FROM menu_items WHERE id = $1',
            values: [id]
        });

        return NextResponse.json({
            status: 'success',
            message: 'Menu item deleted successfully'
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