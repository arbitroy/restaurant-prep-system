import { query } from '@/lib/db';
import { MenuItem, PrepItem } from '@/types/common';

export class ItemsService {
    static async getMenuItems(restaurantId: number): Promise<MenuItem[]> {
        const { rows } = await query<MenuItem>({
            text: `
        SELECT id, name, category 
        FROM menu_items 
        WHERE restaurant_id = $1
        ORDER BY category, name
      `,
            values: [restaurantId]
        });
        return rows;
    }

    static async getPrepItems(restaurantId: number): Promise<PrepItem[]> {
        const { rows } = await query<PrepItem>({
            text: `
        SELECT id, name, unit, sheet_name 
        FROM prep_items 
        WHERE restaurant_id = $1
        ORDER BY sheet_name, name
      `,
            values: [restaurantId]
        });
        return rows;
    }
}