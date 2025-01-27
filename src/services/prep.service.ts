import { query } from '@/lib/db';
import { ApiResponse } from '@/types/common';
import {
    PrepQueryParams,
    PrepRequirement,
    PrepSheet,
    DbPrepRequirement,
    prepRequirementFromDb,
    DbHistoricalUsage,
    historicalUsageFromDb,
    HistoricalUsage
} from '@/types/prep';
import { DatabaseError } from '@/types/errors';

export class PrepService {
    static async calculatePrepRequirements(
        params: PrepQueryParams
    ): Promise<ApiResponse<PrepRequirement[]>> {
        try {
            const { rows } = await query<DbPrepRequirement>({
                text: `SELECT * FROM calculate_prep_requirements($1, $2::date)
                      ${params.sheetName ? 'WHERE sheet_name = $3' : ''}
                      ORDER BY sheet_name, name`,
                values: [
                    params.restaurantId,
                    params.date.toISOString(),
                    params.sheetName ?? null
                ]
            });

            const requirements = rows.map(prepRequirementFromDb);

            return {
                status: 'success',
                data: requirements
            };
        } catch (error) {
            throw new DatabaseError(
                'Failed to calculate prep requirements',
                error instanceof Error ? error.message : undefined
            );
        }
    }

    static async getHistoricalUsage(
        restaurantId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ApiResponse<HistoricalUsage[]>> {
        try {
            const { rows } = await query<DbHistoricalUsage>({
                text: `
                    SELECT 
                        pi.id as prep_item_id,
                        s.date,
                        SUM(s.quantity * pim.quantity) as quantity,
                        pi.name,
                        pi.unit
                    FROM sales s
                    JOIN prep_item_mappings pim ON s.menu_item_id = pim.menu_item_id
                    JOIN prep_items pi ON pim.prep_item_id = pi.id
                    WHERE s.restaurant_id = $1 
                    AND s.date BETWEEN $2 AND $3
                    GROUP BY pi.id, s.date
                    ORDER BY s.date
                `,
                values: [restaurantId, startDate.toISOString(), endDate.toISOString()]
            });

            return {
                status: 'success',
                data: rows.map(historicalUsageFromDb)
            };
        } catch (error) {
            throw new DatabaseError(
                'Failed to fetch historical usage',
                error instanceof Error ? error.message : undefined
            );
        }
    }

    static async getSheetsByDate(
        restaurantId: number,
        date: Date
    ): Promise<ApiResponse<PrepSheet[]>> {
        try {
            const requirements = await this.calculatePrepRequirements({
                restaurantId,
                date
            });

            if (requirements.status === 'error') {
                return { status: 'error' };
            }

            const sheetMap = new Map<string, PrepRequirement[]>();

            requirements.data?.forEach(item => {
                if (!sheetMap.has(item.sheetName)) {
                    sheetMap.set(item.sheetName, []);
                }
                sheetMap.get(item.sheetName)?.push(item);
            });

            const sheets: PrepSheet[] = Array.from(sheetMap.entries()).map(
                ([sheetName, items]) => ({
                    sheetName,
                    date,
                    items
                })
            );

            return {
                status: 'success',
                data: sheets
            };
        } catch (error) {
            throw new DatabaseError(
                'Failed to generate prep sheets',
                error instanceof Error ? error.message : undefined
            );
        }
    }
}