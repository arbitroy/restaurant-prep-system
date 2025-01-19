export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface DateRangeQuery {
    startDate: Date;
    endDate: Date;
    restaurantId: number;
}

export interface PrepQuery {
    date: Date;
    restaurantId: number;
    sheetName?: string;
}