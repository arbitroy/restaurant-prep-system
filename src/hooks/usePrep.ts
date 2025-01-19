import { useQuery } from '@tanstack/react-query';
import { PrepRequirement, PrepSheet } from '@/types/prep';
import { ApiResponse } from '@/types/api';
import { useState } from 'react';

interface UsePrepOptions {
    restaurantId: number;
    initialDate?: Date;
}

export function usePrep({ restaurantId, initialDate = new Date() }: UsePrepOptions) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSheet, setSelectedSheet] = useState<string | undefined>();

    // Fetch prep requirements
    const {
        data: prepData,
        isLoading,
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
        isLoading,
        error,
        selectedDate,
        setSelectedDate,
        selectedSheet,
        setSelectedSheet,
        getSheetRequirements
    };
}