import { MenuItem } from "./common";

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

export interface SalesEntry {
    id: number;
    restaurantId: number;
    menuItemId: number;
    quantity: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
    menuItem?: MenuItem;  // Reference to common types
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

export interface SalesReport extends SalesAnalytics {
    period: {
        start: Date;
        end: Date;
    };
}