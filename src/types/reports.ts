export interface SalesReport {
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalSales: number;
        averageDaily: number;
        topItems: Array<{
            menuItemId: number;
            name: string;
            quantity: number;
            percentage: number;
        }>;
        salesByCategory: Array<{
            category: string;
            total: number;
            percentage: number;
        }>;
    };
    dailyData: Array<{
        date: Date;
        total: number;
        items: Array<{
            menuItemId: number;
            name: string;
            quantity: number;
        }>;
    }>;
}

export interface ItemUsageReport {
    period: {
        start: Date;
        end: Date;
    };
    items: Array<{
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
}

export interface TrendReport {
    period: {
        start: Date;
        end: Date;
    };
    dailyTrends: Array<{
        date: Date;
        total: number;
        trend: number; // percentage change from previous period
    }>;
    categoryTrends: Array<{
        category: string;
        currentPeriodTotal: number;
        previousPeriodTotal: number;
        trend: number;
    }>;
    predictions: Array<{
        date: Date;
        predictedTotal: number;
        confidence: number;
    }>;
}