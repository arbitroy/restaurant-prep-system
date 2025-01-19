import { NextRequest, NextResponse } from 'next/server';
import { ItemsService } from '@/services/items.service';
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

        const items = await ItemsService.getMenuItems(restaurantId);
        return NextResponse.json(items);
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