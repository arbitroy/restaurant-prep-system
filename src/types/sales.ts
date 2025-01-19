import { SalesEntry } from "./common";

export interface DailySales {
    date: Date;
    items: SalesEntry[];
    total: number;
}

export interface SalesAnalytics {
    averageDaily: number;
    averageWeekly: number;
    trendPercentage: number;
    topItems: {
        menuItemId: number;
        name: string;
        quantity: number;
    }[];
}

export interface SalesByCategory {
    category: string;
    total: number;
    items: {
        menuItemId: number;
        name: string;
        quantity: number;
    }[];
}