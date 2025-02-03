import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateConnection } from '@/lib/db/pool';

export async function GET(_request: NextRequest) {
    try {
        // First validate connection with retries
        const isConnected = await validateConnection(3); // 3 retries max
        
        if (!isConnected) {
            return NextResponse.json({
                status: 'unhealthy',
                error: 'Database connection failed after multiple attempts',
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }

        // Check database connection by running a simple query
        const { rows } = await query({
            text: 'SELECT CURRENT_TIMESTAMP as time, current_database() as db, version() as version'
        });

        return NextResponse.json({
            status: 'healthy',
            database: {
                connected: true,
                currentDb: rows[0].db,
                serverTime: rows[0].time,
                version: rows[0].version
            },
            env: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Health Check Failed]:', error);
        
        return NextResponse.json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}