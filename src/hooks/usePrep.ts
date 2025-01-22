import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PrepItemBase, PrepOrderUpdate } from '@/types/prep';
import { ApiResponse } from '@/types/common';

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
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSheet, setSelectedSheet] = useState<string | undefined>();

    // Fetch prep items
    const { data: prepItemsData, isLoading: isLoadingPrepItems } = useQuery<ApiResponse<PrepItemBase[]>>({
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
    const updatePrepItemOrderMutation = useMutation({
        mutationFn: async (items: PrepOrderUpdate[]) => {
            const orderUpdates = items.map(({ id, order, sheetName }) => ({
                id,
                order,
                sheetName
            }));

            const response = await fetch('/api/prep/order', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: orderUpdates })
            });

            if (!response.ok) {
                throw new Error('Failed to update item order');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch queries that are affected by this mutation
            queryClient.invalidateQueries({ queryKey: ['prepItems', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['prep-sheets', restaurantId] });
        }
    });

    // Ensure we have valid data structures even when loading
    const sanitizedPrepSheets = prepSheets?.data || [];
    const sanitizedHistoricalSales = historicalSales?.data || [];
    const sanitizedPrepItems = (prepItemsData?.data || []) as PrepItemBase[];

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
        updatePrepItemOrder: updatePrepItemOrderMutation.mutateAsync,
        isUpdatingOrder: updatePrepItemOrderMutation.isPending
    };
}