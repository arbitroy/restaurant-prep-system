import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PrepOrderUpdate } from '@/types/prep';
import { DatabaseError } from '@/types/errors';


export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const items: PrepOrderUpdate[] = body.items;

        if (!Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid request format' },
                { status: 400 }
            );
        }

        // PostgreSQL supports array operations directly
        const { rows } = await query({
            text: `
                UPDATE prep_items 
                SET 
                    "order" = c.item_order,
                    sheet_name = c.sheet_name,
                    updated_at = CURRENT_TIMESTAMP
                FROM (
                    SELECT 
                        UNNEST($1::int[]) as id,
                        UNNEST($2::int[]) as item_order,
                        UNNEST($3::text[]) as sheet_name
                ) c
                WHERE prep_items.id = c.id
                RETURNING prep_items.id, prep_items.name, prep_items."order", prep_items.sheet_name;
            `,
            values: [
                ...items.map(i => i.id),
                ...items.map(i => i.order),
                ...items.map(i => i.sheetName)
            ]
        });

        return NextResponse.json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        console.error('Error updating prep item order:', error);
        if (error instanceof DatabaseError) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update prep item order' },
            { status: 500 }
        );
    }
}