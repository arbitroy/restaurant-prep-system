export interface PrepQuery {
    restaurantId: number;
    date: Date;
    sheetName?: string;
}
export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    error?: string;
}

export interface PrepItemData {
    id: number;
    name: string;
    unit: string;
    sheet_name: string;
    buffer_percentage?: number;
    minimum_quantity?: number;
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
    buffer_quantity(buffer_quantity: any): number | undefined;
    minimum_quantity(minimum_quantity: any): number | undefined;
    id: number;
    name: string;
    unit: string;
    sheet_name: string;
    quantity: number;
    bufferQuantity?: number;
    minimumQuantity?: number;
}

export interface PrepSheetData {
    sheetName: string;
    date: string;
    items: PrepRequirementData[];
}

// Type for formatDataForExport function
export interface ExportableData {
    summary?: Record<string, number | string>;
    daily?: SalesData[];
    items?: Array<Record<string, unknown>>;
}