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

export interface PrepItem extends BaseEntity {
    restaurantId: number;
    name: string;
    unit: string;
    sheetName: string;
}

export interface PrepItemMapping extends BaseEntity {
    menuItemId: number;
    prepItemId: number;
    quantity: number;
    menuItem?: MenuItem;
    prepItem?: PrepItem;
}

export interface SalesEntry extends BaseEntity {
    restaurantId: number;
    menuItemId: number;
    quantity: number;
    date: Date;
    menuItem?: MenuItem;
}