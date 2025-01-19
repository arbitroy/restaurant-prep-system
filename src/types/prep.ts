export interface PrepRequirement {
    id: number;
    name: string;
    unit: string;
    sheetName: string;
    quantity: number;
}

export interface PrepSheet {
    sheetName: string;
    date: Date;
    items: PrepRequirement[];
}

export interface PrepCalculation {
    currentDay: PrepRequirement[];
    nextDay: PrepRequirement[];
    total: PrepRequirement[];
}