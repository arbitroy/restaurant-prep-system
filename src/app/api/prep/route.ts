import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';
import { ApiResponse } from '@/types/common';
import { PrepRequirement, PrepSheet } from '@/types/prep';


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

        let sqlQuery = `
            SELECT * FROM calculate_prep_requirements($1, $2::DATE)
        `;
        const values: (string | number)[] = [
            parseInt(restaurantId),
            date
        ];

        if (sheetName) {
            sqlQuery += ` WHERE sheet_name = $3`;
            values.push(sheetName);
        }

        sqlQuery += ` ORDER BY sheet_name, name`;

        const { rows } = await query<PrepRequirement>({
            text: sqlQuery,
            values
        });

        // Group by sheet
        const sheets: PrepSheet[] = rows.reduce((acc: PrepSheet[], row) => {
            const sheet = acc.find(s => s.sheetName === row.sheetName);
            if (sheet) {
                sheet.items.push({
                    id: row.id,
                    name: row.name,
                    unit: row.unit,
                    quantity: Number(row.quantity),
                    bufferQuantity: Number(row.bufferQuantity),
                    minimumQuantity: Number(row.minimumQuantity),
                    sheetName: row.sheetName
                });
            } else {
                acc.push({
                    sheetName: row.sheetName,
                    date: new Date(date),
                    items: [{
                        id: row.id,
                        name: row.name,
                        unit: row.unit,
                        quantity: Number(row.quantity),
                        bufferQuantity: Number(row.bufferQuantity),
                        minimumQuantity: Number(row.minimumQuantity),
                        sheetName: row.sheetName
                    }]
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
            { status: 'error', error: 'Failed to calculate prep requirements' },
            { status: 500 }
        );
    }
}