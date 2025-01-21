
export interface PrepItemBase {
    id: number;
    name: string;
    unit: string;
    sheetName: string;
    order?: number;
}

export interface PrepRequirementData {
    prep_item_id: number;
    name: string;
    unit: string;
    sheet_name: string;
    required_quantity: number;
    buffer_quantity?: number;
    minimum_quantity?: number;
}

export interface PrepRequirement {
    id: number;
    name: string;
    unit: string;
    sheetName: string;
    quantity: number;
    bufferQuantity?: number;
    minimumQuantity?: number;
    status?: 'pending' | 'in_progress' | 'completed';
    notes?: string;
    completedQuantity?: number;
}

export interface PrepSheet {
    sheetName: string;
    date: Date;
    items: PrepRequirement[];
}

export interface PrepTask {
    id: number;
    prepItemId: number;
    requiredQuantity: number;
    completedQuantity?: number;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo?: string;
    notes?: string;
}

export interface PrepItemOrder {
    id: number;
    order: number;
    sheetName: string;
}

export interface HistoricalUsage {
    prepItemId: number;
    date: string;
    quantity: number;
    itemName: string;
    unit: string;
}

export interface PrepCalculation {
    itemId: number;
    name: string;
    unit: string;
    dailyRequirements: Array<{
        day: string;
        quantity: number;
        percentage: number;
    }>;
    totalRequired: number;
    bufferPercentage: number;
}