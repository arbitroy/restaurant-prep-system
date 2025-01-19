export type DateRange = {
    startDate: Date;
    endDate: Date;
};

export type SortOrder = 'asc' | 'desc';

export type SortConfig = {
    field: string;
    order: SortOrder;
};

export type FilterConfig = {
    field: string;
    value: string | number | boolean | null;
    operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
};
