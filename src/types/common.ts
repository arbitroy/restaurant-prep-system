import { PrepItem } from "./prep";


// Base entity interface for all database models
export interface BaseEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Restaurant extends BaseEntity {
    name: string;
}

export interface MenuItem extends BaseEntity {
    restaurantId: number;
    name: string;
    category: string;
    prepItems?: PrepItemMapping[];
}

export interface PrepItemMapping extends BaseEntity {
    menuItemId: number;
    prepItemId: number;
    quantity: number;
    menuItem?: MenuItem;
    prepItem?: PrepItem;  // Reference to prep types
}

// Common API response type
export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    error?: string;
}

// Common query parameters
export interface QueryParams {
    restaurantId: number;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    sheetName?: string;
}

// Common date range type
export interface DateRange {
    startDate: Date;
    endDate: Date;
}