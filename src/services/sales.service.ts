import { query, transaction } from '@/lib/db';
import { ApiResponse } from '@/types/api';
import { SalesEntry } from '@/types/common';
import { DailySales, SalesAnalytics } from '@/types/sales';
import { DatabaseError } from '@/types/errors';
import { QueryResultRow } from 'pg';

// Interface for the raw query result
interface SalesQueryResult extends QueryResultRow {
    id: number;
    menu_item_id: number;
    quantity: number;
    date: Date;
    menu_item_name: string;
    category: string;
    restaurant_id: number;
}

export class SalesService {
    static async addSalesEntry(
        entry: Omit<SalesEntry, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<ApiResponse<{ id: number }>> {
        try {
            const result = await transaction(async (client) => {
                const { rows } = await client.query({
                    text: `
            INSERT INTO sales (
              restaurant_id, 
              menu_item_id, 
              quantity, 
              date
            ) VALUES ($1, $2, $3, $4)
            RETURNING id
          `,
                    values: [
                        entry.restaurantId,
                        entry.menuItemId,
                        entry.quantity,
                        entry.date
                    ]
                });

                return rows[0];
            });

            return {
                status: 'success',
                data: { id: result.id }
            };
        } catch (error) {
            throw new DatabaseError(
                'Failed to add sales entry',
                error instanceof Error ? error.message : undefined
            );
        }
    }

    static async getDailySales(
        restaurantId: number,
        date: Date
    ): Promise<ApiResponse<DailySales>> {
        try {
            const { rows } = await query<SalesQueryResult>({
                text: `
          SELECT 
            s.id,
            s.restaurant_id,
            s.menu_item_id,
            s.quantity,
            s.date,
            s.created_at,
            s.updated_at,
            m.name as menu_item_name,
            m.category
          FROM sales s
          JOIN menu_items m ON s.menu_item_id = m.id
          WHERE 
            s.restaurant_id = $1 
            AND s.date = $2
        `,
                values: [restaurantId, date]
            });

            // Transform the raw query results into SalesEntry objects
            const salesEntries: SalesEntry[] = rows.map(row => ({
                id: row.id,
                restaurantId: row.restaurant_id,
                menuItemId: row.menu_item_id,
                quantity: row.quantity,
                date: row.date,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                menuItem: {
                    id: row.menu_item_id,
                    name: row.menu_item_name,
                    category: row.category,
                    restaurantId: row.restaurant_id,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                }
            }));

            const total = salesEntries.reduce((sum, entry) => sum + entry.quantity, 0);

            return {
                status: 'success',
                data: {
                    date,
                    items: salesEntries,
                    total
                }
            };
        } catch (error) {
            throw new DatabaseError(
                'Failed to fetch daily sales',
                error instanceof Error ? error.message : undefined
            );
        }
    }

    static async getSalesAnalytics(
        restaurantId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ApiResponse<SalesAnalytics>> {
        try {
            const { rows } = await query({
                text: `
          WITH daily_totals AS (
            SELECT 
              date,
              SUM(quantity) as daily_total
            FROM sales
            WHERE 
              restaurant_id = $1
              AND date BETWEEN $2 AND $3
            GROUP BY date
          ),
          item_totals AS (
            SELECT 
              m.id as menu_item_id,
              m.name,
              SUM(s.quantity) as total_quantity
            FROM sales s
            JOIN menu_items m ON s.menu_item_id = m.id
            WHERE 
              s.restaurant_id = $1
              AND s.date BETWEEN $2 AND $3
            GROUP BY m.id, m.name
            ORDER BY total_quantity DESC
            LIMIT 5
          )
          SELECT
            (SELECT AVG(daily_total) FROM daily_totals) as avg_daily,
            (SELECT AVG(weekly_total) 
             FROM (
               SELECT date_trunc('week', date) as week, 
                      SUM(daily_total) as weekly_total 
               FROM daily_totals 
               GROUP BY week
             ) w
            ) as avg_weekly,
            json_agg(
              json_build_object(
                'menuItemId', menu_item_id,
                'name', name,
                'quantity', total_quantity
              )
            ) as top_items
          FROM item_totals
        `,
                values: [restaurantId, startDate, endDate]
            });

            const result = rows[0];
            return {
                status: 'success',
                data: {
                    averageDaily: Number(result.avg_daily) || 0,
                    averageWeekly: Number(result.avg_weekly) || 0,
                    trendPercentage: 0, // Calculate trend based on previous period
                    topItems: result.top_items || []
                }
            };
        } catch (error) {
            throw new DatabaseError(
                'Failed to fetch sales analytics',
                error instanceof Error ? error.message : undefined
            );
        }
    }
}