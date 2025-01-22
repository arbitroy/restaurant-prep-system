import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DailySales, SalesAnalytics, SalesEntry } from '@/types/sales';
import { ApiResponse } from '@/types/common';
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

    // Fetch sales analytics
    const {
        data: analyticsData,
        isLoading: isLoadingAnalytics,
        error: analyticsError
    } = useQuery<ApiResponse<SalesAnalytics>>({
        queryKey: ['sales-analytics', restaurantId, selectedDate],
        queryFn: async () => {
            const startDate = new Date(selectedDate);
            startDate.setDate(startDate.getDate() - 30);

            const response = await fetch(
                `/api/sales?restaurantId=${restaurantId}&type=analytics&startDate=${startDate.toISOString()}&endDate=${selectedDate.toISOString()}`
            );
            if (!response.ok) throw new Error('Failed to fetch sales analytics');
            return response.json();
        }
    });

    // Add sales entry mutation
    const {
        mutate: addSalesEntry,
        isPending: isAddingEntry,
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
            queryClient.invalidateQueries({ queryKey: ['sales', restaurantId, selectedDate] });
            queryClient.invalidateQueries({ queryKey: ['sales-analytics', restaurantId, selectedDate] });
        }
    });

    return {
        dailySales: dailySales?.data,
        salesAnalytics: analyticsData?.data,
        isLoadingDaily,
        isLoadingAnalytics,
        isLoading: isLoadingDaily || isLoadingAnalytics,
        error: dailyError || analyticsError,
        addSalesEntry,
        isAddingEntry,
        addError,
        selectedDate,
        setSelectedDate
    };
}