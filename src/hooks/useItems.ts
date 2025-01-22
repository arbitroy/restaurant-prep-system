import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, MenuItem } from '@/types/common';
import { PrepItem } from '@/types/prep';

interface UseItemsOptions {
    restaurantId: number;
}

interface ItemsResponse {
    menuItems: MenuItem[];
    prepItems: PrepItem[];
}

export function useItems({ restaurantId }: UseItemsOptions) {
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        error
    } = useQuery<ApiResponse<ItemsResponse>>({
        queryKey: ['items', restaurantId],
        queryFn: async () => {
            const response = await fetch(`/api/items?restaurantId=${restaurantId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch items');
            }
            return response.json();
        },
        enabled: Boolean(restaurantId)
    });

    // Prefetch prep item mappings for each menu item
    const menuItems = data?.data?.menuItems || [];
    menuItems.forEach(item => {
        queryClient.prefetchQuery({
            queryKey: ['prepMappings', item.id],
            queryFn: async () => {
                const response = await fetch(`/api/items/mapping?menuItemId=${item.id}`);
                if (!response.ok) throw new Error('Failed to fetch mappings');
                return response.json();
            }
        });
    });

    // Group menu items by category
    const menuItemsByCategory = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    // Group prep items by sheet
    const prepItemsBySheet = (data?.data?.prepItems || []).reduce((acc, item) => {
        if (!acc[item.sheetName]) {
            acc[item.sheetName] = [];
        }
        acc[item.sheetName].push(item);
        return acc;
    }, {} as Record<string, PrepItem[]>);


    return {
        menuItems,
        prepItems: data?.data?.prepItems || [],
        menuItemsByCategory,
        prepItemsBySheet,
        isLoadingMenu: isLoading,
        isLoadingPrep: isLoading,
        error: error as Error | null
    };
}