
export interface PrepQuery {
    restaurantId: number;
    date: Date;
    sheetName?: string;
}

export interface SalesQuery {
    restaurantId: number;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
    type?: 'daily' | 'analytics';
}

export interface ReportQuery {
    restaurantId: number;
    startDate: Date;
    endDate: Date;
    type: 'sales' | 'items' | 'trends';
}

export interface SalesData {
    date: string;
    total: number;
    items: Array<{
        menuItemId: number;
        name: string;
        quantity: number;
    }>;
}

export interface ReportData {
    summary: {
        totalSales: number;
        averageDaily: number;
        salesByCategory: Array<{
            category: string;
            total: number;
            percentage: number;
        }>;
    };
    dailyData: SalesData[];
    items?: Array<{
        menuItemId: number;
        name: string;
        category: string;
        totalQuantity: number;
        averageDaily: number;
        prepItems: Array<{
            prepItemId: number;
            name: string;
            totalUsage: number;
            unit: string;
        }>;
    }>;
    trends?: {
        dailyTrends: Array<{
            date: string;
            total: number;
            trend: number;
        }>;
        predictions: Array<{
            date: string;
            predictedTotal: number;
        }>;
    };
}

export interface PrepRequirementData {
    prep_item_id: number;
    prep_name: string;
    unit: string;
    sheet_name: string;
    avg_quantity: number;
    prep_quantity: number;
    day_of_week: number;
    quantity: number;
    buffer_quantity: () => number;
    minimum_quantity: () => number;
    id: number;
    name: string;
}