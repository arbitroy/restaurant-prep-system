import { NextRequest, NextResponse } from 'next/server';
import { PrepService } from '@/services/prep.service';
import { DatabaseError } from '@/types/errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = Number(searchParams.get('restaurantId'));
        const date = searchParams.get('date');
        const sheetName = searchParams.get('sheetName');

        if (!restaurantId || !date) {
            return NextResponse.json(
                { error: 'Restaurant ID and date are required' },
                { status: 400 }
            );
        }

        const prepQuery = {
            restaurantId,
            date: new Date(date),
            sheetName: sheetName || undefined
        };

        const prepRequirements = await PrepService.calculatePrepRequirements(prepQuery);

        if (!sheetName) {
            // If no specific sheet is requested, get all sheets
            const sheets = await PrepService.getSheetsByDate(restaurantId, new Date(date));
            return NextResponse.json(sheets);
        }

        return NextResponse.json(prepRequirements);
    } catch (error) {
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