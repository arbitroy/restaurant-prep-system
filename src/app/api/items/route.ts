import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = Number(searchParams.get('restaurantId'));

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        const { rows: menuItems } = await query({
            text: `
                SELECT 
                    m.id,
                    m.name,
                    m.category,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', pm.id,
                                'prepItemId', p.id,
                                'name', p.name,
                                'quantity', pm.quantity
                            )
                        ) FILTER (WHERE p.id IS NOT NULL),
                        '[]'
                    ) as prep_items
                FROM menu_items m
                LEFT JOIN prep_item_mappings pm ON m.id = pm.menu_item_id
                LEFT JOIN prep_items p ON pm.prep_item_id = p.id
                WHERE m.restaurant_id = $1
                GROUP BY m.id, m.name, m.category
            `,
            values: [restaurantId]
        });



        const { rows: prepItems } = await query({
            text: `
                SELECT id, name, unit, sheet_name 
                FROM prep_items 
                WHERE restaurant_id = $1
                ORDER BY sheet_name, name
            `,
            values: [restaurantId]
        });



        return NextResponse.json({
            status: 'success',
            data: {
                menuItems,
                prepItems
            }
        });
    } catch (error) {
        console.error('Error fetching items:', error); // Debug log
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