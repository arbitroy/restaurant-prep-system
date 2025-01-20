import { useQuery } from '@tanstack/react-query';
import { PrepRequirement, PrepSheet } from '@/types/prep';
import { ApiResponse } from '@/types/api';
import { PrepItem } from '@/types/common';
import { useState } from 'react';

interface UsePrepOptions {
    restaurantId: number;
    initialDate?: Date;
}

export function usePrep({ restaurantId, initialDate = new Date() }: UsePrepOptions) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSheet, setSelectedSheet] = useState<string | undefined>();

    // Fetch prep items
    const { data: prepItemsData, isLoading: isLoadingPrepItems } = useQuery<ApiResponse<PrepItem[]>>({
        queryKey: ['prepItems', restaurantId],
        queryFn: async () => {
            const response = await fetch(`/api/items?restaurantId=${restaurantId}&type=prep`);
            if (!response.ok) throw new Error('Failed to fetch prep items');
            return response.json();
        }
    });

    // Fetch prep requirements
    const {
        data: prepData,
        isLoading: isLoadingPrep,
        error
    } = useQuery<ApiResponse<PrepSheet[]>>({
        queryKey: ['prep', restaurantId, selectedDate, selectedSheet],
        queryFn: async () => {
            const params = new URLSearchParams({
                restaurantId: restaurantId.toString(),
                date: selectedDate.toISOString()
            });

            if (selectedSheet) {
                params.append('sheetName', selectedSheet);
            }

            const response = await fetch(`/api/prep?${params}`);
            if (!response.ok) throw new Error('Failed to fetch prep requirements');
            return response.json();
        }
    });

    // Calculate prep requirements for a specific sheet
    const getSheetRequirements = (sheetName: string): PrepRequirement[] => {
        if (!prepData?.data) return [];
        const sheet = prepData.data.find(s => s.sheetName === sheetName);
        return sheet?.items || [];
    };

    return {
        prepSheets: prepData?.data || [],
        prepItems: prepItemsData?.data || [],
        isLoading: isLoadingPrep || isLoadingPrepItems,
        error,
        selectedDate,
        setSelectedDate,
        selectedSheet,
        setSelectedSheet,
        getSheetRequirements
    };
}