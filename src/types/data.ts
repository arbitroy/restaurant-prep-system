export interface BaseData {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface DailyData {
    date: Date;
    value: number;
    trend?: number;
    details?: Record<string, unknown>;
}

export interface ChartData {
    label: string;
    value: number;
    additionalData?: Record<string, unknown>;
}

export interface PaginatedData<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface QueryOptions {
    restaurantId: number;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    status?: string;
}
