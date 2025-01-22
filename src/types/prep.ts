// Common status type for prep items
export type PrepStatus = 'pending' | 'in_progress' | 'completed';

// Base interface for common prep item properties
export interface PrepItemBase {
    id: number;
    name: string;
    sheetName: string;
    order?: number;
    createdAt?: Date;
    updatedAt?: Date;
    unit: string;    // Moved to base as it's commonly used
}

// Full prep item interface with restaurant-specific properties
export interface PrepItem extends PrepItemBase {
    restaurantId: number;
    bufferPercentage?: number;
    minimumQuantity?: number;
}

// Interface for order updates sent to the API
export interface PrepOrderUpdate {
    id: number;
    order: number;
    sheetName: string;
}

// Interface for prep requirements
export interface PrepRequirement extends PrepItemBase {
    quantity: number;
    bufferQuantity?: number;
    minimumQuantity?: number;
    status?: PrepStatus;
    notes?: string;
    completedQuantity?: number;
}

// Interface for daily prep calculations
export interface PrepCalculation {
    itemId: number;
    name: string;
    unit: string;
    dailyRequirements: PrepDailyRequirement[];
    totalRequired: number;
    bufferPercentage: number;
}

export interface PrepDailyRequirement {
    day: string;
    quantity: number;
    percentage: number;
}

// Interface for prep tasks
export interface PrepTask {
    id: number;
    prepItemId: number;
    requiredQuantity: number;
    completedQuantity?: number;
    status: PrepStatus;
    assignedTo?: string;
    notes?: string;
    date: Date;
}

// Interface for prep sheet data
export interface PrepSheet {
    sheetName: string;
    date: Date;
    items: PrepRequirement[];
}

// Interface for historical usage data
export interface HistoricalUsage {
    prepItemId: number;
    itemId: number;
    name: string;
    date: Date;
    quantity: number;
    unit: string;
}