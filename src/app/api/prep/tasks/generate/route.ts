import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types/common';
import { DatabaseError } from '@/types/errors';

const GenerateTasksSchema = z.object({
    restaurantId: z.number(),
    date: z.string().transform((str, ctx) => {
        const date = new Date(str);
        if (isNaN(date.getTime())) {
            ctx.addIssue({
                code: z.ZodIssueCode.invalid_date,
                message: "Invalid date format"
            });
            return z.NEVER;
        }
        return date;
    }),
    requirements: z.array(z.object({
        prepItemId: z.number(),
        requiredQuantity: z.number().min(0)
    })).nonempty({
        message: "At least one requirement must be provided"
    })
});


type GenerateTasksResponse = {
    tasksGenerated: number;
    date: string;
};

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<GenerateTasksResponse>>> {
    try {
        const body = await request.json();
        const validatedData = GenerateTasksSchema.parse(body);
        const { restaurantId, date, requirements } = validatedData;

        // Check for existing tasks but exclude completed ones
        const { rows: existingTasks } = await query({
            text: `
                SELECT prep_item_id 
                FROM prep_tasks 
                WHERE restaurant_id = $1 
                AND date = $2::date
                AND status != 'completed'
            `,
            values: [restaurantId, date]
        });

        const existingPrepIds = new Set(existingTasks.map(t => t.prep_item_id));
        const newRequirements = requirements.filter(
            req => !existingPrepIds.has(req.prepItemId)
        );

        if (newRequirements.length === 0) {
            return NextResponse.json({
                status: 'success',
                data: {
                    tasksGenerated: 0,
                    date: date.toISOString()
                }
            });
        }

        // Generate tasks only for items that don't have active tasks
        const values = newRequirements.map((req, index) => 
            `($1, $${index * 2 + 2}, $${index * 2 + 3}, 'pending', $${newRequirements.length * 2 + 2})`
        ).join(', ');

        const queryText = `
            INSERT INTO prep_tasks (
                restaurant_id,
                prep_item_id,
                required_quantity,
                status,
                date
            )
            VALUES ${values}
            RETURNING id
        `;

        const queryValues = [
            restaurantId,
            ...newRequirements.flatMap(req => [req.prepItemId, req.requiredQuantity]),
            date
        ];

        const { rowCount } = await query({
            text: queryText,
            values: queryValues
        });

        return NextResponse.json({
            status: 'success',
            data: {
                tasksGenerated: rowCount ?? 0,
                date: date.toISOString()
            }
        });

    } catch (error) {
        console.error('Error generating prep tasks:', error);
        
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
                error: 'Failed to generate prep tasks'
            },
            { status: 500 }
        );
    }
}