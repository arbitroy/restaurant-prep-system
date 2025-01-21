// src/hooks/usePrep.ts
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PrepRequirement, PrepItem } from '@/types/prep';
import { ApiResponse } from '@/types/api';

interface UsePrepOptions {
    restaurantId: number;
    initialDate?: Date;
    bufferPercentage?: number;
}

export function usePrep({
    restaurantId,
    initialDate = new Date(),
    bufferPercentage = 50
}: UsePrepOptions) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSheet, setSelectedSheet] = useState<string | undefined>();
    const queryClient = useQueryClient();

    // Fetch prep items
    const { data: prepItemsData, isLoading: isLoadingPrepItems } = useQuery<ApiResponse<PrepItem[]>>({
        queryKey: ['prepItems', restaurantId],
        queryFn: async () => {
            const response = await fetch(`/api/items/prep?restaurantId=${restaurantId}`);
            if (!response.ok) throw new Error('Failed to fetch prep items');
            return response.json();
        }
    });

    // Fetch historical sales data
    const { data: historicalSales, isLoading: isLoadingHistory, error: historyError } = useQuery({
        queryKey: ['sales-history', restaurantId, selectedDate],
        queryFn: async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 28); // 4 weeks of history

            const response = await fetch(
                `/api/sales/history?restaurantId=${restaurantId}&startDate=${startDate.toISOString()}&endDate=${selectedDate.toISOString()}`
            );
            if (!response.ok) throw new Error('Failed to fetch sales history');
            return response.json();
        }
    });

    // Fetch prep sheets
    const { data: prepSheets, isLoading: isLoadingPrep, error: prepError } = useQuery({
        queryKey: ['prep-sheets', restaurantId, selectedDate, bufferPercentage, selectedSheet],
        queryFn: async () => {
            const params = new URLSearchParams({
                restaurantId: restaurantId.toString(),
                date: selectedDate.toISOString(),
                bufferPercentage: bufferPercentage.toString()
            });

            if (selectedSheet) {
                params.append('sheetName', selectedSheet);
            }

            const response = await fetch(`/api/prep?${params}`);
            if (!response.ok) throw new Error('Failed to fetch prep sheets');
            return response.json();
        }
    });

    // Update prep item order mutation
    const updatePrepItemOrder = useMutation({
        mutationFn: async (items: PrepRequirement[]) => {
            const response = await fetch('/api/prep/order', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, items })
            });
            if (!response.ok) throw new Error('Failed to update item order');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prep-sheets', restaurantId] });
        }
    });

    // Ensure we have valid data structures even when loading
    const sanitizedPrepSheets = prepSheets?.data || [];
    const sanitizedHistoricalSales = historicalSales?.data || [];
    const sanitizedPrepItems = (prepItemsData?.data || []) as PrepItem[];

    const error = historyError || prepError;

    return {
        prepSheets: sanitizedPrepSheets,
        historicalSales: sanitizedHistoricalSales,
        prepItems: sanitizedPrepItems,
        isLoading: isLoadingHistory || isLoadingPrep || isLoadingPrepItems,
        error,
        selectedDate,
        setSelectedDate,
        selectedSheet,
        setSelectedSheet,
        updatePrepItemOrder: updatePrepItemOrder.mutateAsync
    };
}