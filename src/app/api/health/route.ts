import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateConnection } from '@/lib/db/pool';

export async function GET(_request: NextRequest) {
    try {
        // First validate connection with retries
        const isConnected = await validateConnection();
        
        if (!isConnected) {
            return NextResponse.json({
                status: 'unhealthy',
                error: 'Database connection failed after multiple attempts',
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }

        // If connected, get server timestamp
        const { rows } = await query({
            text: 'SELECT NOW() as server_time, version() as db_version'
        });

        return NextResponse.json({
            status: 'healthy',
            database: {
                connected: true,
                serverTime: rows[0].server_time,
                version: rows[0].db_version
            },
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Health check failed:', error);
        
        return NextResponse.json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}