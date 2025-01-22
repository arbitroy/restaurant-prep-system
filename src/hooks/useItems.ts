import { useQuery } from '@tanstack/react-query';
import { ApiResponse, MenuItem} from '@/types/common';
import { PrepItem } from '@/types/prep';

interface UseItemsOptions {
    restaurantId: number;
}

interface ItemsResponse {
    menuItems: MenuItem[];
    prepItems: PrepItem[];
}

export function useItems({ restaurantId }: UseItemsOptions) {
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
        enabled: !!restaurantId
    });

    // Group menu items by category
    const menuItemsByCategory = data?.data?.menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>) || {};

    // Group prep items by sheet
    const prepItemsBySheet = data?.data?.prepItems.reduce((acc, item) => {
        if (!acc[item.sheetName]) {
            acc[item.sheetName] = [];
        }
        acc[item.sheetName].push(item);
        return acc;
    }, {} as Record<string, PrepItem[]>) || {};

    return {
        menuItems: data?.data?.menuItems || [],
        prepItems: data?.data?.prepItems || [],
        menuItemsByCategory,
        prepItemsBySheet,
        isLoadingMenu: isLoading,
        isLoadingPrep: isLoading,
        error
    };
}