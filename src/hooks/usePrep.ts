// src/hooks/usePrep.ts
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { 
    PrepOrderUpdate, 
    PrepItem,
    OrderUpdateResult,
    PrepSheet,
    HistoricalUsage,
    PrepSheetName,
    PREP_SHEETS,
    UsePrepOptions,
    UsePrepReturn
} from '@/types/prep';
import type { ApiResponse } from '@/types/common';
import { useToast } from '@/components/ui/Toast/ToastContext';

export function usePrep({
    restaurantId,
    initialDate = new Date(),
    bufferPercentage = 50
}: UsePrepOptions): UsePrepReturn {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSheet, setSelectedSheet] = useState<PrepSheetName | undefined>(PREP_SHEETS[0]);
    const [optimisticUpdates, setOptimisticUpdates] = useState<PrepOrderUpdate[]>([]);

    // Prep Items Query
    const prepItemsQuery = useQuery<ApiResponse<PrepItem[]>>({
        queryKey: ['prepItems', restaurantId],
        queryFn: async () => {
            const response = await fetch(`/api/items/prep?restaurantId=${restaurantId}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch prep items');
            }
            return response.json();
        },
        staleTime: 30000 // 30 seconds
    });

    // Historical Sales Query
    const historicalSalesQuery = useQuery<ApiResponse<HistoricalUsage[]>>({
        queryKey: ['sales-history', restaurantId, selectedDate],
        queryFn: async () => {
            const startDate = new Date(selectedDate);
            startDate.setDate(startDate.getDate() - 28);

            const params = new URLSearchParams({
                restaurantId: restaurantId.toString(),
                startDate: startDate.toISOString(),
                endDate: selectedDate.toISOString()
            });

            const response = await fetch(`/api/sales/history?${params}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch sales history');
            }
            return response.json();
        },
        staleTime: 300000 // 5 minutes
    });

    // Prep Sheets Query
    const prepSheetsQuery = useQuery<ApiResponse<PrepSheet[]>>({
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
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch prep sheets');
            }

            return response.json();
        },
        retry: 1
    });

    // Order Update Mutation with proper typing
    const updateOrderMutation = useMutation<
        OrderUpdateResult,
        Error,
        PrepOrderUpdate[],
        { previousItems: PrepItem[] }
    >({
        mutationFn: async (items: PrepOrderUpdate[]): Promise<OrderUpdateResult> => {
            const response = await fetch('/api/prep/order', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update order');
            }

            const result = await response.json();
            return result as OrderUpdateResult;
        },
        onMutate: async (newItems: PrepOrderUpdate[]) => {
            await queryClient.cancelQueries({ 
                queryKey: ['prep-sheets', restaurantId] 
            });

            const previousItems = queryClient.getQueryData<ApiResponse<PrepItem[]>>([
                'prepItems',
                restaurantId
            ])?.data || [];

            setOptimisticUpdates(newItems);

            return { previousItems };
        },
        onSuccess: (result: OrderUpdateResult) => {
            if (result.success) {
                queryClient.invalidateQueries({ 
                    queryKey: ['prep-sheets', restaurantId] 
                });
                showToast('Order updated successfully', 'success');
            }
        },
        onError: (error: Error, _variables: PrepOrderUpdate[], context?: { previousItems: PrepItem[] }) => {
            if (context?.previousItems) {
                queryClient.setQueryData(
                    ['prepItems', restaurantId],
                    { status: 'success', data: context.previousItems }
                );
            }
            setOptimisticUpdates([]);
            showToast(error.message || 'Failed to update order', 'error');
        },
        onSettled: () => {
            setOptimisticUpdates([]);
            queryClient.invalidateQueries({ 
                queryKey: ['prep-sheets', restaurantId] 
            });
        }
    });

    const updatePrepItemOrder = useCallback(async (items: PrepOrderUpdate[]): Promise<void> => {
        try {
            await updateOrderMutation.mutateAsync(items);
        } catch (error) {
            console.error('Update order error:', error);
            throw error;
        }
    }, [updateOrderMutation]);

    // Properly typed debounced function
    const debouncedUpdateOrder = useCallback(
        (items: PrepOrderUpdate[]): Promise<void> => 
            new Promise((resolve, reject) => {
                const debouncedFn = debounce(async (itemsToUpdate: PrepOrderUpdate[]) => {
                    try {
                        await updatePrepItemOrder(itemsToUpdate);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }, 500);
                
                debouncedFn(items);
            }),
        [updatePrepItemOrder]
    );

    return {
        prepSheets: prepSheetsQuery.data?.data || [],
        historicalSales: historicalSalesQuery.data?.data || [],
        prepItems: prepItemsQuery.data?.data || [],
        isLoading: prepItemsQuery.isLoading || historicalSalesQuery.isLoading || prepSheetsQuery.isLoading,
        error: (prepItemsQuery.error || historicalSalesQuery.error || prepSheetsQuery.error) as Error | null,
        selectedDate,
        selectedSheet,
        isUpdatingOrder: updateOrderMutation.isPending,
        optimisticUpdates,
        setSelectedDate,
        setSelectedSheet,
        updatePrepItemOrder: debouncedUpdateOrder,
    };
}

export const isItemBeingUpdated = (
    itemId: number, 
    optimisticUpdates: PrepOrderUpdate[]
): boolean => {
    return optimisticUpdates.some(update => update.id === itemId);
};