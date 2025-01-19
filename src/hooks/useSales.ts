import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SalesEntry } from '@/types/common';
import { DailySales, SalesAnalytics } from '@/types/sales';
import { ApiResponse } from '@/types/api';
import { useState } from 'react';

interface UseSalesOptions {
    restaurantId: number;
    initialDate?: Date;
}

export function useSales({ restaurantId, initialDate = new Date() }: UseSalesOptions) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const queryClient = useQueryClient();

    // Fetch daily sales
    const {
        data: dailySales,
        isLoading: isLoadingDaily,
        error: dailyError
    } = useQuery<ApiResponse<DailySales>>({
        queryKey: ['sales', restaurantId, selectedDate],
        queryFn: async () => {
            const response = await fetch(
                `/api/sales?restaurantId=${restaurantId}&date=${selectedDate.toISOString()}`
            );
            if (!response.ok) throw new Error('Failed to fetch daily sales');
            return response.json();
        }
    });

    // Add sales entry
    const {
        mutate: addSalesEntry,
        isLoading: isAddingEntry,
        error: addError
    } = useMutation({
        mutationFn: async (entry: Omit<SalesEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            if (!response.ok) throw new Error('Failed to add sales entry');
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({
                queryKey: ['sales', restaurantId, selectedDate]
            });
        }
    });

    return {
        dailySales: dailySales?.data,
        isLoadingDaily,
        dailyError,
        addSalesEntry,
        isAddingEntry,
        addError,
        selectedDate,
        setSelectedDate
    };
}