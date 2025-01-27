import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { DbPrepRequirement, prepRequirementFromDb, PrepSheet } from '@/types/prep';

const CalculationRequestSchema = z.object({
    restaurantId: z.number(),
    date: z.string().transform(str => new Date(str)),
    bufferPercentage: z.number().min(0).max(100).default(50)
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Validate and parse request parameters
        const validated = CalculationRequestSchema.parse({
            restaurantId: Number(searchParams.get('restaurantId')),
            date: searchParams.get('date'),
            bufferPercentage: Number(searchParams.get('bufferPercentage'))
        });

        // Fetch calculations with buffer settings
        const { rows: dbCalcs } = await query<DbPrepRequirement & {
            adjusted_quantity: number;
            buffer_percentage: number;
        }>({
            text: `
                WITH prep_calcs AS (
                    SELECT * FROM calculate_prep_requirements($1, $2::date)
                ),
                prep_settings AS (
                    SELECT 
                        prep_item_id,
                        COALESCE(buffer_percentage, $3) as buffer_percentage,
                        minimum_quantity
                    FROM prep_settings
                    WHERE restaurant_id = $1
                )
                SELECT 
                    pc.*,
                    GREATEST(
                        CEIL(pc.required_quantity * (1 + ps.buffer_percentage / 100.0)),
                        COALESCE(ps.minimum_quantity, 0)
                    ) as adjusted_quantity,
                    ps.buffer_percentage
                FROM prep_calcs pc
                LEFT JOIN prep_settings ps ON pc.prep_item_id = ps.prep_item_id
                ORDER BY pc.sheet_name, pc.name
            `,
            values: [
                validated.restaurantId,
                validated.date,
                validated.bufferPercentage
            ]
        });

        // Transform and group by prep sheet
        const prepSheets = dbCalcs.reduce((acc, calc) => {
            const sheet = acc.find(s => s.sheetName === calc.sheet_name);
            const requirement = prepRequirementFromDb({
                ...calc,
                menu_items: calc.menu_items || []
            });

            if (sheet) {
                sheet.items.push(requirement);
            } else {
                acc.push({
                    sheetName: calc.sheet_name,
                    date: validated.date,
                    items: [requirement]
                });
            }
            
            return acc;
        }, [] as PrepSheet[]);

        return NextResponse.json({
            status: 'success',
            data: prepSheets
        });

    } catch (error) {
        console.error('Error calculating prep requirements:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { 
                    status: 'error',
                    error: 'Invalid request parameters',
                    details: error.errors
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { status: 'error', error: 'Failed to calculate prep requirements' },
            { status: 500 }
        );
    }
}