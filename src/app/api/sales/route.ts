import { NextRequest, NextResponse } from 'next/server';
import { SalesService } from '@/services/sales.service';
import { DatabaseError } from '@/types/errors';
import { SalesEntry } from '@/types/common';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, menuItemId, quantity, date } = body;

        if (!restaurantId || !menuItemId || !quantity || !date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const entry: Omit<SalesEntry, 'id' | 'createdAt' | 'updatedAt'> = {
            restaurantId,
            menuItemId,
            quantity,
            date: new Date(date)
        };

        const result = await SalesService.addSalesEntry(entry);
        return NextResponse.json(result);
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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = Number(searchParams.get('restaurantId'));
        const date = searchParams.get('date');
        const type = searchParams.get('type'); // 'daily' or 'analytics'
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        if (type === 'analytics') {
            if (!startDate || !endDate) {
                return NextResponse.json(
                    { error: 'Start and end dates are required for analytics' },
                    { status: 400 }
                );
            }

            const analytics = await SalesService.getSalesAnalytics(
                restaurantId,
                new Date(startDate),
                new Date(endDate)
            );
            return NextResponse.json(analytics);
        }

        if (!date) {
            return NextResponse.json(
                { error: 'Date is required for daily sales' },
                { status: 400 }
            );
        }

        const sales = await SalesService.getDailySales(
            restaurantId,
            new Date(date)
        );
        return NextResponse.json(sales);
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

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        // Extract ID from request's URL search params
        const { searchParams } = new URL(request.url);
        const idParam = searchParams.get('id');
        
        if (!idParam) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid ID format' },
                { status: 400 }
            );
        }

        const result = await SalesService.deleteSalesEntry(id);

        return NextResponse.json({
            status: 'success',
            message: 'Sales entry deleted successfully',
            deletedCount: result
        });
    } catch (error) {
        console.error('Delete operation error:', error);
        
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