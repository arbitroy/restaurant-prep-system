import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid ID format' },
                { status: 400 }
            );
        }

        await query({
            text: 'DELETE FROM sales WHERE id = $1',
            values: [id]
        });

        return NextResponse.json({
            status: 'success',
            message: 'Sales entry deleted successfully'
        });
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