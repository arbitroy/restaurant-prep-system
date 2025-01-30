import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PrepOrderUpdate, OrderUpdateResponse, PrepSheetName } from '@/types/prep';
import { DatabaseError } from '@/types/errors';
import { ApiResponse } from '@/types/common';

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<OrderUpdateResponse[]>>> {
    try {
        const body = await request.json();
        const items = body.items as PrepOrderUpdate[];

        // Type guard
        if (!Array.isArray(items) || !items.every(isValidPrepOrderUpdate)) {
            return NextResponse.json(
                { 
                    status: 'error',
                    error: 'Invalid request format' 
                },
                { status: 400 }
            );
        }

        // Convert arrays to PostgreSQL array literals
        const ids = `{${items.map(i => i.id).join(',')}}`;
        const orders = `{${items.map(i => i.order).join(',')}}`;
        const sheetNames = `{${items.map(i => `"${i.sheetName}"`).join(',')}}`;

        const { rows } = await query<OrderUpdateResponse>({
            text: `
                WITH updates AS (
                    SELECT 
                        unnest($1::int[]) as id,
                        unnest($2::int[]) as item_order,
                        unnest($3::text[]) as sheet_name
                )
                UPDATE prep_items 
                SET 
                    "order" = u.item_order,
                    sheet_name = u.sheet_name,
                    updated_at = CURRENT_TIMESTAMP
                FROM updates u
                WHERE prep_items.id = u.id
                RETURNING 
                    prep_items.id,
                    prep_items.name,
                    prep_items."order",
                    prep_items.sheet_name
            `,
            values: [ids, orders, sheetNames]
        });

        return NextResponse.json({
            status: 'success',
            data: rows.map(row => ({
                ...row,
                sheetName: row.sheetName as PrepSheetName
            }))
        });

    } catch (error) {
        console.error('Error updating prep item order:', error);
        
        if (error instanceof DatabaseError) {
            return NextResponse.json(
                { 
                    status: 'error',
                    error: error.message 
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                status: 'error',
                error: 'Failed to update prep item order' 
            },
            { status: 500 }
        );
    }
}

// Type guard
function isValidPrepOrderUpdate(item: any): item is PrepOrderUpdate {
    return (
        typeof item === 'object' &&
        typeof item.id === 'number' &&
        typeof item.order === 'number' &&
        typeof item.sheetName === 'string'
    );
}