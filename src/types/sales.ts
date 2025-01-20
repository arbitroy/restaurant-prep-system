export interface SalesItem {
    menuItemId: number;
    name: string;
    quantity: number;
    category?: string;
}

export interface DailySales {
    date: Date;
    items: SalesItem[];
    total: number;
}

export interface TopItem {
    menuItemId: number;
    name: string;
    quantity: number;
    percentage: number;
}

export interface CategorySales {
    category: string;
    total: number;
    percentage: number;
}

export interface SalesAnalytics {
    averageDaily: number;
    averageWeekly: number;
    trendPercentage: number;
    topItems: TopItem[];
    salesByCategory: CategorySales[];
    dailyTrends?: Array<{
        date: string;
        total: number;
        trend: number;
    }>;
}

export interface SalesChartProps {
    data: SalesAnalytics | undefined;
    startDate: Date;
    endDate: Date;
}