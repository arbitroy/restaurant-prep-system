import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types/common';
import { DatabaseError } from '@/types/errors';
import { z } from 'zod';
import { PrepTask } from '@/types/prep';

const TaskUpdateSchema = z.object({
    id: z.number(),
    completedQuantity: z.number().optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    notes: z.string().optional()
});


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
    } catch {
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
    } catch {
        return NextResponse.json(
            { error: 'Failed to create prep task' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<PrepTask>>> {
    try {
        const body = await request.json();
        const validated = TaskUpdateSchema.parse(body);

        const updateFields: string[] = [];
        const values: (string | number | null)[] = [validated.id];
        let paramCount = 2;

        if (validated.completedQuantity !== undefined) {
            updateFields.push(`completed_quantity = $${paramCount}`);
            values.push(validated.completedQuantity);
            paramCount++;
        }

        if (validated.status !== undefined) {
            updateFields.push(`status = $${paramCount}`);
            values.push(validated.status);
            paramCount++;

            if (validated.status === 'completed') {
                updateFields.push('completed_at = CURRENT_TIMESTAMP');
            }
        }

        if (validated.notes !== undefined) {
            updateFields.push(`notes = $${paramCount}`);
            values.push(validated.notes);
            paramCount++;
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                {
                    status: 'error',
                    error: 'No fields to update'
                },
                { status: 400 }
            );
        }

        const { rows } = await query<PrepTask>({
            text: `
          UPDATE prep_tasks
          SET ${updateFields.join(', ')},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `,
            values
        });

        if (rows.length === 0) {
            return NextResponse.json(
                {
                    status: 'error',
                    error: 'Task not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });

    } catch (error) {
        console.error('Error updating prep task:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    status: 'error',
                    error: 'Invalid request data',
                    details: error.errors
                },
                { status: 400 }
            );
        }

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
                error: 'Internal server error'
            },
            { status: 500 }
        );
    }
}