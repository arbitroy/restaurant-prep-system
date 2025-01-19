import { useQuery } from '@tanstack/react-query';
import { MenuItem, PrepItem } from '@/types/common';
import { ApiResponse } from '@/types/api';

interface UseItemsOptions {
    restaurantId: number;
}

export function useItems({ restaurantId }: UseItemsOptions) {
    // Fetch menu items
    const {
        data: menuItems,
        isLoading: isLoadingMenu,
        error: menuError
    } = useQuery<ApiResponse<MenuItem[]>>({
        queryKey: ['menuItems', restaurantId],
        queryFn: async () => {
            const response = await fetch(`/api/items?restaurantId=${restaurantId}`);
            if (!response.ok) throw new Error('Failed to fetch menu items');
            return response.json();
        }
    });

    // Fetch prep items
    const {
        data: prepItems,
        isLoading: isLoadingPrep,
        error: prepError
    } = useQuery<ApiResponse<PrepItem[]>>({
        queryKey: ['prepItems', restaurantId],
        queryFn: async () => {
            const response = await fetch(`/api/items?restaurantId=${restaurantId}&type=prep`);
            if (!response.ok) throw new Error('Failed to fetch prep items');
            return response.json();
        }
    });

    // Group menu items by category
    const menuItemsByCategory = menuItems?.data?.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>) || {};

    // Group prep items by sheet
    const prepItemsBySheet = prepItems?.data?.reduce((acc, item) => {
        if (!acc[item.sheetName]) {
            acc[item.sheetName] = [];
        }
        acc[item.sheetName].push(item);
        return acc;
    }, {} as Record<string, PrepItem[]>) || {};

    return {
        menuItems: menuItems?.data || [],
        prepItems: prepItems?.data || [],
        menuItemsByCategory,
        prepItemsBySheet,
        isLoadingMenu,
        isLoadingPrep,
        menuError,
        prepError
    };
}