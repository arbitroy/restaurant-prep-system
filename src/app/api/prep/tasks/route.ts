import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types/common';
import { DatabaseError } from '@/types/errors';
import { z } from 'zod';
import { PrepTask } from '@/types/prep';

const TaskUpdateSchema = z.object({
    id: z.number(),
    completedQuantity: z.number(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    notes: z.string()
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

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const validated = TaskUpdateSchema.parse(body);

        // Get existing task
        const { rows: [existingTask] } = await query({
            text: 'SELECT * FROM prep_tasks WHERE id = $1',
            values: [validated.id]
        });

        if (!existingTask) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        // Validation checks
        if (existingTask.status === 'completed') {
            return NextResponse.json(
                { error: 'Cannot update completed task' },
                { status: 400 }
            );
        }

        if (validated.completedQuantity && 
            validated.completedQuantity > existingTask.required_quantity) {
            return NextResponse.json(
                { error: 'Completed quantity cannot exceed required quantity' },
                { status: 400 }
            );
        }

        // Determine status based on completed quantity
        const newStatus = validated.completedQuantity >= existingTask.required_quantity
            ? 'completed'
            : validated.completedQuantity > 0
                ? 'in_progress'
                : 'pending';

        // Update task
        const { rows: [updatedTask] } = await query({
            text: `
                UPDATE prep_tasks
                SET 
                    completed_quantity = COALESCE($1, completed_quantity),
                    status = $2,
                    notes = COALESCE($3, notes),
                    completed_at = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *
            `,
            values: [
                validated.completedQuantity,
                newStatus,
                validated.notes,
                newStatus === 'completed' ? new Date() : null,
                validated.id
            ]
        });

        return NextResponse.json({
            status: 'success',
            data: updatedTask
        });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
        );
    }
}