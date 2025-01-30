import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';
import {  PREP_SHEETS } from '@/types/prep';
import { z } from 'zod';

const GetRequestSchema = z.object({
    restaurantId: z.string().transform(val => parseInt(val)),
    date: z.string().transform(str => new Date(str)),
    sheetName: z.enum(PREP_SHEETS).optional(),
    order: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});
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
        const date = searchParams.get('date');
        const sheetName = searchParams.get('sheetName');

        if (!restaurantId || !date) {
            return NextResponse.json(
                { error: 'Restaurant ID and date are required' },
                { status: 400 }
            );
        }

        // Updated query to include prep_tasks data
        const { rows } = await query({
            text: `
                WITH prep_requirements AS (
                    SELECT * FROM calculate_prep_requirements($1, $2::date)
                    ${sheetName ? 'WHERE sheet_name = $3' : ''}
                ),
                grouped_tasks AS (
                    SELECT 
                        prep_item_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'id', id,
                                'prepItemId', prep_item_id,
                                'completedQuantity', completed_quantity,
                                'status', status,
                                'notes', notes,
                                'completedAt', completed_at
                            )
                        ) as tasks
                    FROM prep_tasks
                    WHERE restaurant_id = $1 AND date = $2::date
                    GROUP BY prep_item_id
                )
                SELECT 
                    pr.*,
                    gt.tasks
                FROM prep_requirements pr
                LEFT JOIN grouped_tasks gt ON gt.prep_item_id = pr.prep_item_id
                ORDER BY pr.sheet_name, pr."order", pr.name
            `,
            values: [restaurantId, date, sheetName].filter(Boolean)
        });

        // Transform rows with proper task handling
        const transformedRows = rows.map(row => ({
            id: row.prep_item_id,
            name: row.name,
            unit: row.unit,
            sheetName: row.sheet_name,
            order: row.order || 0,
            quantity: row.required_quantity,
            bufferQuantity: row.buffer_quantity,
            minimumQuantity: row.minimum_quantity,
            menuItems: row.menu_items || [],
            // Take the first active task or most recent one
            task: row.tasks?.[0] || undefined
        }));

        return NextResponse.json({
            status: 'success',
            data: transformedRows
        });
    } catch (error) {
        console.error('Error fetching prep requirements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prep requirements' },
            { status: 500 }
        );
    }
}