import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DatabaseError } from '@/types/errors';

export async function GET() {
    try {
        const { rows } = await query({
            text: 'SELECT id, name, created_at, updated_at FROM restaurants ORDER BY name'
        });

        return NextResponse.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch restaurants' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Restaurant name is required' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: 'INSERT INTO restaurants (name) VALUES ($1) RETURNING *',
            values: [name]
        });

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create restaurant' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name } = body;

        if (!id || !name) {
            return NextResponse.json(
                { error: 'Restaurant ID and name are required' },
                { status: 400 }
            );
        }

        const { rows } = await query({
            text: 'UPDATE restaurants SET name = $1 WHERE id = $2 RETURNING *',
            values: [name, id]
        });

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update restaurant' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        await query({
            text: 'DELETE FROM restaurants WHERE id = $1',
            values: [id]
        });

        return NextResponse.json({
            status: 'success',
            message: 'Restaurant deleted successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete restaurant' },
            { status: 500 }
        );
    }
}