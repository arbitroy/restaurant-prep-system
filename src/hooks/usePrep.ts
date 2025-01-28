import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    PrepItemBase, 
    PrepOrderUpdate, 
    PrepSheet, 
    HistoricalUsage, 
    PrepItem,
    PrepSheetName,
    PREP_SHEETS,
    UsePrepOptions,
    UsePrepReturn
} from '@/types/prep';
import { ApiResponse } from '@/types/common';

export function usePrep({
    restaurantId,
    initialDate = new Date(),
    bufferPercentage = 50
}: UsePrepOptions): UsePrepReturn {
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSheet, setSelectedSheet] = useState<PrepSheetName | undefined>(PREP_SHEETS[0]);

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
        }
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
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    // Prep Sheets Query with order handling
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
    
            const data = await response.json();
            console.log('Prep sheets response:', data);
            
            if (!data.data) {
                throw new Error('No data returned from server');
            }
    
            return data;
        },
        retry: 1
    });

    // Update Order Mutation
    const updatePrepItemOrderMutation = useMutation({
        mutationFn: async (items: PrepOrderUpdate[]) => {
            const response = await fetch('/api/prep/order', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update item order');
            }
            
            return response.json();
        },
        onSuccess: () => {
            // Invalidate both prep sheets and prep items to ensure order is updated everywhere
            queryClient.invalidateQueries({ queryKey: ['prep-sheets', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['prepItems', restaurantId] });
        },
        onError: (error) => {
            console.error('Error updating prep order:', error);
            throw error;
        }
    });

    // Determine loading and error states
    const isLoading = 
        prepItemsQuery.isLoading || 
        historicalSalesQuery.isLoading || 
        prepSheetsQuery.isLoading;

    const error = 
        prepItemsQuery.error || 
        historicalSalesQuery.error || 
        prepSheetsQuery.error || null;

    return {
        // Data
        prepSheets: prepSheetsQuery.data?.data || [],
        historicalSales: historicalSalesQuery.data?.data || [],
        prepItems: prepItemsQuery.data?.data || [],
        
        // State
        isLoading,
        error: error instanceof Error ? error : null,
        selectedDate,
        selectedSheet,
        
        // Actions
        setSelectedDate,
        setSelectedSheet,
        updatePrepItemOrder: updatePrepItemOrderMutation.mutateAsync,
        isUpdatingOrder: updatePrepItemOrderMutation.isPending
    };
}