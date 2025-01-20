export interface PrepRequirement {
    id: number;
    name: string;
    unit: string;
    sheetName: string;
    quantity: number;
    bufferPercentage?: number;
    minimumQuantity?: number;
    completed?: boolean;
    completedQuantity?: number;
    status?: 'pending' | 'in_progress' | 'completed';
    notes?: string;
}

export interface PrepSheet {
    sheetName: string;
    date: Date;
    items: PrepRequirement[];
}

export interface PrepSetting {
    id: number;
    restaurantId: number;
    prepItemId: number;
    bufferPercentage: number;
    minimumQuantity: number;
    itemName?: string;
    unit?: string;
}

export interface PrepTask {
    id: number;
    prepItemId: number;
    requiredQuantity: number;
    completedQuantity: number;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo?: string;
    notes?: string;
    date: Date;
    completedAt?: Date;
    itemName?: string;
    unit?: string;
    sheetName?: string;
}