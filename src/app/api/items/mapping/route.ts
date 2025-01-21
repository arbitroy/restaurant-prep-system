import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { menuItemId, prepItemId, quantity } = body;

        if (!menuItemId || !prepItemId || quantity === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if mapping already exists
        const { rows: existing } = await query({
            text: `
                SELECT id FROM prep_item_mappings
                WHERE menu_item_id = $1 AND prep_item_id = $2
            `,
            values: [menuItemId, prepItemId]
        });

        let result;
        if (existing.length > 0) {
            // Update existing mapping
            result = await query({
                text: `
                    UPDATE prep_item_mappings
                    SET quantity = $3, updated_at = CURRENT_TIMESTAMP
                    WHERE menu_item_id = $1 AND prep_item_id = $2
                    RETURNING id, menu_item_id, prep_item_id, quantity
                `,
                values: [menuItemId, prepItemId, quantity]
            });
        } else {
            // Create new mapping
            result = await query({
                text: `
                    INSERT INTO prep_item_mappings (
                        menu_item_id, 
                        prep_item_id, 
                        quantity,
                        created_at,
                        updated_at
                    ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id, menu_item_id, prep_item_id, quantity
                `,
                values: [menuItemId, prepItemId, quantity]
            });
        }

        return NextResponse.json({
            status: 'success',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error saving prep item mapping:', error);
        return NextResponse.json(
            { error: 'Failed to save mapping' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const menuItemId = searchParams.get('menuItemId');

        if (!menuItemId) {
            return NextResponse.json(
                { error: 'Menu item ID is required' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: `
                SELECT 
                    pim.id,
                    pim.prep_item_id,
                    pim.quantity,
                    pi.name as prep_name,
                    pi.unit
                FROM prep_item_mappings pim
                JOIN prep_items pi ON pim.prep_item_id = pi.id
                WHERE pim.menu_item_id = $1
            `,
            values: [menuItemId]
        });

        return NextResponse.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        console.error('Error fetching prep item mappings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mappings' },
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
                { error: 'Mapping ID is required' },
                { status: 400 }
            );
        }

        await query({
            text: 'DELETE FROM prep_item_mappings WHERE id = $1',
            values: [id]
        });

        return NextResponse.json({
            status: 'success',
            message: 'Mapping deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting prep item mapping:', error);
        return NextResponse.json(
            { error: 'Failed to delete mapping' },
            { status: 500 }
        );
    }
}