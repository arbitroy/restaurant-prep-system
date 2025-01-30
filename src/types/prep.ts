import { usePrepTasks } from "@/hooks/usePrepTasks";

// Base database types (snake_case)
export interface DbBaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}

export interface DbPrepItem {
    id: number;
    restaurant_id: number;
    name: string;
    unit: string;
    sheet_name: string;
    buffer_percentage?: number;
    minimum_quantity?: number;
    created_at: string;
    updated_at: string;
}

export interface DbPrepRequirement {
    prep_item_id: number;
    name: string;
    unit: string;
    sheet_name: string;
    order: number;
    required_quantity: number;
    buffer_quantity: number;
    minimum_quantity: number;
    menu_items: DbMenuItem[];
}

export interface DbMenuItem {
    menu_item_id: number;
    menu_item_name: string;
    quantity: number;
}

export interface DbHistoricalUsage {
    prep_item_id: number;
    date: string;
    quantity: number;
    name: string;
    unit: string;
}

// Frontend types (camelCase)
export type PrepStatus = 'pending' | 'in_progress' | 'completed';

export interface PrepItemBase {
    id: number;
    name: string;
    unit: string;
    sheetName: PrepSheetName;
    order?: number;
}

export interface PrepItem extends PrepItemBase {
    restaurantId: number;
    bufferPercentage?: number;
    minimumQuantity?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Settings for prep items
export interface PrepItemSettings {
    bufferPercentage: number;
    minimumQuantity: number;
}


export interface MenuItem {
    id: number;
    name: string;
    quantity: number;
}

export interface PrepRequirement extends PrepItemBase {
    quantity: number;
    bufferQuantity: number;
    minimumQuantity: number;
    order: number;
    menuItems: MenuItem[];
    task?: PrepTask;
}

export interface HistoricalUsage {
    prepItemId: number;
    date: Date;
    quantity: number;
    name: string;
    unit: string;
}

export interface PrepCalculation {
    itemId: number;
    name: string;
    unit: string;
    dailyRequirements: DailyRequirement[];
    totalRequired: number;
    bufferPercentage: number;
}

export interface DailyRequirement {
    day: string;
    quantity: number;
    percentage: number;
}

export interface PrepSheet {
    sheetName: string;
    date: Date;
    items: PrepRequirement[];
}

// Interface for prep tasks
export interface PrepTask {
    id: number;
    restaurantId: number;
    prepItemId: number;
    requiredQuantity: number;
    completedQuantity: number;
    status: 'pending' | 'in_progress' | 'completed';
    notes?: string;
    date: Date;
}


// API types
export interface PrepQueryParams {
    restaurantId: number;
    date: Date;
    sheetName?: string;
    bufferPercentage?: number;
}

// Constants
export const PREP_SHEETS = [
    'AM Prep',
    'PM Prep',
    'Weekly Prep',
    'Sauces',
    'Proteins',
    'Produce'
] as const;

export type PrepSheetName = typeof PREP_SHEETS[number];

// Type conversion utilities
export const historicalUsageFromDb = (db: DbHistoricalUsage): HistoricalUsage => ({
    prepItemId: db.prep_item_id,
    date: new Date(db.date),
    quantity: db.quantity,
    name: db.name,
    unit: db.unit
});

// Type conversion utilities
export const prepItemFromDb = (db: DbPrepItem): PrepItem => ({
    id: db.id,
    restaurantId: db.restaurant_id,
    name: db.name,
    unit: db.unit,
    sheetName: db.sheet_name as PrepSheetName,
    bufferPercentage: db.buffer_percentage,
    minimumQuantity: db.minimum_quantity,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at)
});

export const prepRequirementFromDb = (db: DbPrepRequirement): PrepRequirement => ({
    id: db.prep_item_id,
    name: db.name,
    unit: db.unit,
    sheetName: db.sheet_name as PrepSheetName,
    order: db.order ?? 0,
    quantity: db.required_quantity,
    bufferQuantity: db.buffer_quantity,
    minimumQuantity: db.minimum_quantity,
    menuItems: db.menu_items.map(item => ({
        id: item.menu_item_id,
        name: item.menu_item_name,
        quantity: item.quantity
    }))
});

export interface PrepQueryResponse {
    prepSheets: PrepSheet[];
    historicalSales: HistoricalUsage[];
    prepItems: PrepItemBase[];
}

export interface PrepHookState {
    isLoading: boolean;
    error: Error | null;
    selectedDate: Date;
    selectedSheet: PrepSheetName | undefined;
}

export interface PrepHookActions {
    setSelectedDate: (date: Date) => void;
    setSelectedSheet: (sheet: PrepSheetName | undefined) => void;
    updatePrepItemOrder: (items: PrepOrderUpdate[]) => Promise<void>;
}

export interface PrepOrderUpdate {
    id: number;
    order: number;
    sheetName: PrepSheetName;
}

export interface UsePrepOptions {
    restaurantId: number;
    initialDate?: Date;
    bufferPercentage?: number;
}

export type UsePrepReturn = PrepQueryResponse & PrepHookState & PrepHookActions & {
    isUpdatingOrder: boolean;
};

// API request/response types
export interface CreatePrepItemRequest {
    restaurantId: number;
    name: string;
    unit: string;
    sheetName: string;
}

export interface UpdatePrepItemRequest extends Partial<CreatePrepItemRequest> {
    id: number;
}

export interface PrepItemResponse {
    id: number;
    name: string;
    unit: string;
    sheetName: string;
    restaurantId: number;
    bufferPercentage?: number;
    minimumQuantity?: number;
    createdAt: string;
    updatedAt: string;
}

export type PrepView = 'calculator' | 'tasks' | 'organize' | 'print' | 'settings';

export interface PrepControlsProps {
    activeView: PrepView;
    setActiveView: (view: PrepView) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    setShowSettings: (show: boolean) => void;
}

export interface PrepContentProps {
    activeView: PrepView;
    prepSheets: PrepSheet[];
    historicalSales: HistoricalUsage[];
    selectedDate: Date;
    bufferPercentage: number;
    setSelectedSheet: (sheet: PrepSheetName) => void;
    handleBufferChange: (value: number) => void;
    handleOrderChange: (items: PrepItemBase[]) => Promise<void>;
    handlePrint: () => void;
    printRef: React.RefObject<HTMLDivElement>;
    tasks: PrepTask[];
    isLoadingTasks: boolean;
    updateTask: ReturnType<typeof usePrepTasks>['updateTask'];
}

export interface PrepTasksViewProps {
    prepSheets: PrepSheet[];
    tasks: PrepTask[];
    selectedDate: Date;
    updateTask: ReturnType<typeof usePrepTasks>['updateTask'];
    isLoading: boolean;
}

export interface TaskWithStatus extends PrepRequirement {
    task?: PrepTask;
    status: PrepStatus;
    completedQuantity: number;
}

export interface PrepItemFormData {
    id: number;
    restaurantId: number;
    name: string;
    unit: string;
    sheetName: string;
    order?: number;
}


export interface DbPrepTask {
    id: number;
    restaurant_id: number;
    prep_item_id: number;
    required_quantity: number;
    completed_quantity: number;
    status: 'pending' | 'in_progress' | 'completed';
    assigned_to: string | null;
    notes: string | null;
    date: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PrepTask {
    id: number;
    restaurantId: number;
    prepItemId: number;
    requiredQuantity: number;
    completedQuantity: number;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo?: string;
    notes?: string;
    date: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export function prepTaskFromDb(db: DbPrepTask): PrepTask {
    return {
        id: db.id,
        restaurantId: db.restaurant_id,
        prepItemId: db.prep_item_id,
        requiredQuantity: db.required_quantity,
        completedQuantity: db.completed_quantity,
        status: db.status,
        assignedTo: db.assigned_to || undefined,
        notes: db.notes || undefined,
        date: new Date(db.date),
        completedAt: db.completed_at ? new Date(db.completed_at) : undefined,
        createdAt: new Date(db.created_at),
        updatedAt: new Date(db.updated_at)
    };
}

export interface TaskUpdate {
    id: number;
    completedQuantity?: number;
    status?: 'pending' | 'in_progress' | 'completed';
    notes?: string;
}

export function isPrepRequirement(obj: any): obj is PrepRequirement {
    return obj &&
        typeof obj === 'object' &&
        'id' in obj &&
        'sheetName' in obj &&
        typeof obj.sheetName === 'string' &&
        PREP_SHEETS.includes(obj.sheetName as PrepSheetName);
}