import { query } from '@/lib/db';
import { PrepQuery, PrepRequirementData } from '@/types/api';
import { ApiResponse } from '@/types/common';
import { PrepRequirement, PrepSheet } from '@/types/prep';
import { DatabaseError } from '@/types/errors';


export class PrepService {
    static async calculatePrepRequirements(
        params: PrepQuery
    ): Promise<ApiResponse<PrepRequirement[]>> {
        try {
            const salesQuery = `
        WITH sales_avg AS (
          SELECT 
            menu_item_id,
            EXTRACT(DOW FROM date) as day_of_week,
            AVG(quantity) as avg_quantity
          FROM sales
          WHERE 
            restaurant_id = $1 
            AND date >= $2
            AND date <= $3
          GROUP BY menu_item_id, EXTRACT(DOW FROM date)
        )
        SELECT 
          m.id as menu_item_id,
          sa.day_of_week,
          COALESCE(sa.avg_quantity, 0) as avg_quantity,
          pm.prep_item_id,
          pm.quantity as prep_quantity,
          p.name as prep_name,
          p.unit,
          p.sheet_name
        FROM menu_items m
        LEFT JOIN sales_avg sa ON m.id = sa.menu_item_id
        JOIN prep_item_mappings pm ON m.id = pm.menu_item_id
        JOIN prep_items p ON pm.prep_item_id = p.id
        WHERE m.restaurant_id = $1
        ${params.sheetName ? 'AND p.sheet_name = $4' : ''}
      `;

            const startDate = new Date(params.date);
            startDate.setDate(startDate.getDate() - 28);

            const queryValues = [
                params.restaurantId,
                startDate.toISOString(),
                params.date.toISOString(),
                params.sheetName || null
            ];

            const { rows } = await query({
                text: salesQuery,
                values: queryValues
            });

            const prepRequirementData: PrepRequirementData[] = rows.map(row => ({
                prep_item_id: row.prep_item_id,
                prep_name: row.prep_name,
                unit: row.unit,
                sheet_name: row.sheet_name,
                avg_quantity: row.avg_quantity,
                prep_quantity: row.prep_quantity,
                day_of_week: row.day_of_week,
                buffer_quantity: () => 0, // Add default or calculated values for missing properties
                minimum_quantity: () => 0, // Add default or calculated values for missing properties
                id: row.prep_item_id, // Add default or calculated values for missing properties
                name: row.prep_name, // Add default or calculated values for missing properties
                quantity: row.prep_quantity * row.avg_quantity // Add the missing 'quantity' property
            }));

            const prepRequirements = this.processPrepRequirements(prepRequirementData, params.date.getDay());

            return {
                status: 'success',
                data: prepRequirements
            };
        } catch (error) {
            throw new DatabaseError(
                'Failed to calculate prep requirements',
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
                return {
                    status: 'error'
                };
            }

            const sheetMap = new Map<string, PrepRequirement[]>();

            requirements.data?.forEach(item => {
                if (!sheetMap.has(item.sheetName)) {
                    sheetMap.set(item.sheetName, []);
                }
                sheetMap.get(item.sheetName)?.push(item);
            });

            const sheets: PrepSheet[] = Array.from(sheetMap.entries()).map(([sheetName, items]) => ({
                sheetName,
                date,
                items
            }));

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

    private static processPrepRequirements(
        rows: PrepRequirementData[],
        currentDayOfWeek: number
    ): PrepRequirement[] {
        const nextDayOfWeek = (currentDayOfWeek + 1) % 7;
        const prepRequirements = new Map<number, PrepRequirement>();

        rows.forEach(row => {
            const {
                prep_item_id,
                prep_name,
                unit,
                sheet_name,
                avg_quantity,
                prep_quantity,
                day_of_week
            } = row;

            if (!prepRequirements.has(prep_item_id)) {
                prepRequirements.set(prep_item_id, {
                    id: prep_item_id,
                    name: prep_name,
                    unit,
                    sheetName: sheet_name,
                    quantity: 0
                });
            }

            const requirement = prepRequirements.get(prep_item_id)!;

            if (day_of_week === currentDayOfWeek) {
                requirement.quantity += avg_quantity * prep_quantity;
            } else if (day_of_week === nextDayOfWeek) {
                requirement.quantity += (avg_quantity * prep_quantity * 0.5);
            }
        });

        return Array.from(prepRequirements.values()).map(req => ({
            ...req,
            quantity: Math.ceil(req.quantity)
        }));
    }
}
