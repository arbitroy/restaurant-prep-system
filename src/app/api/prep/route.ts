import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';
import { ApiResponse } from '@/types/common';
import { DbPrepRequirement, PREP_SHEETS, prepRequirementFromDb, PrepSheet, PrepSheetName } from '@/types/prep';
import { z } from 'zod';

const GetRequestSchema = z.object({
    restaurantId: z.string().transform(val => parseInt(val)),
    date: z.string().transform(str => new Date(str)),
    sheetName: z.enum(PREP_SHEETS).optional()
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
        
        // Validate request parameters
        const validated = GetRequestSchema.safeParse({
            restaurantId: searchParams.get('restaurantId'),
            date: searchParams.get('date'),
            sheetName: searchParams.get('sheetName')
        });

        if (!validated.success) {
            return NextResponse.json(
                { 
                    status: 'error',
                    error: 'Invalid request parameters',
                    details: validated.error.errors
                },
                { status: 400 }
            );
        }

        // Construct query with optional sheet name filter
        const sqlQuery = `
            SELECT * FROM calculate_prep_requirements($1, $2::DATE)
            ${validated.data.sheetName ? 'WHERE sheet_name = $3' : ''}
            ORDER BY sheet_name, name
        `;

        const values = [
            validated.data.restaurantId,
            validated.data.date.toISOString(),
            validated.data.sheetName ?? null
        ];

        // Execute query with proper typing
        const { rows } = await query<DbPrepRequirement>({
            text: sqlQuery,
            values
        });

        // Transform and group results
        const sheets = rows.reduce((acc: PrepSheet[], row) => {
            const sheet = acc.find(s => s.sheetName === row.sheet_name);
            const requirement = prepRequirementFromDb(row);

            if (sheet) {
                sheet.items.push(requirement);
            } else {
                acc.push({
                    sheetName: row.sheet_name as PrepSheetName,
                    date: validated.data.date,
                    items: [requirement]
                });
            }
            return acc;
        }, []);

        const response: ApiResponse<PrepSheet[]> = {
            status: 'success',
            data: sheets
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error calculating prep requirements:', error);
        
        return NextResponse.json(
            { 
                status: 'error', 
                error: 'Failed to calculate prep requirements',
                details: error instanceof Error ? error.message : undefined
            },
            { status: 500 }
        );
    }
}