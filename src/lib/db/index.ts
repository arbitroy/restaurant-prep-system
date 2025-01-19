import { QueryResult, QueryResultRow  } from 'pg';
import pool from './pool';

type QueryConfig = {
    text: string;
    values?: any[];
};

export async function query<T extends QueryResultRow>(config: QueryConfig): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
        const result = await client.query(config);
        return result;
    } finally {
        client.release();
    }
}

export async function transaction<T>(
    callback: (client: any) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}