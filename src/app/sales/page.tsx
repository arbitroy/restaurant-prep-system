'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SalesEntry } from '@/components/forms/SalesEntry';
import { SalesGrid } from '@/components/modules/sales/SalesGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSales } from '@/hooks/useSales';
import { useItems } from '@/hooks/useItems';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Helper function to generate a numeric hash from multiple values
function generateNumericId(restaurantId: number, menuItemId: number, timestamp: number, index: number): number {
    // Use a combination of values to create a unique number
    // We'll use a simple hashing approach that should avoid collisions for our use case
    const baseNumber = parseInt(`${restaurantId}${menuItemId}${index}`, 10);
    const timeComponent = timestamp % 10000; // Use last 4 digits of timestamp
    return baseNumber * 10000 + timeComponent;
}

export default function SalesPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    // Date constraints
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 90); // Allow sales up to 90 days back

    const {
        dailySales,
        isLoadingDaily,
        selectedDate,
        setSelectedDate
    } = useSales({
        restaurantId,
        initialDate: today
    });

    const { menuItems } = useItems({
        restaurantId
    });

    // Delete sales entry mutation
    const deleteSales = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/sales/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete sales entry');
            return response.json();
        },
        onSuccess: () => {
            showToast('Sales entry deleted successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['sales', restaurantId] });
        },
        onError: () => {
            showToast('Failed to delete sales entry', 'error');
        }
    });

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        // Ensure date is within valid range
        if (newDate > today) {
            showToast('Cannot select future dates', 'error');
            return;
        }
        if (newDate < minDate) {
            showToast('Cannot select dates more than 90 days in the past', 'error');
            return;
        }
        setSelectedDate(newDate);
    };

    // Transform sales data with numeric IDs
    const transformedSales = (dailySales?.items || []).map((item, index) => {
        const uniqueId = generateNumericId(
            restaurantId,
            item.menuItemId,
            selectedDate.getTime(),
            index
        );

        return {
            id: uniqueId,
            restaurantId,
            menuItemId: item.menuItemId,
            name: item.name,
            category: item.category || '',
            quantity: item.quantity,
            date: selectedDate,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Sales Management</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Hide Form' : 'Add Sales'}
                </Button>
            </div>

            <div className="flex space-x-4 items-center">
                <div className="flex flex-col">
                    <Input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={handleDateChange}
                        max={today.toISOString().split('T')[0]}
                        min={minDate.toISOString().split('T')[0]}
                        className="w-48"
                    />
                    <span className="text-sm text-gray-500 mt-1">
                        Select date (up to 90 days ago)
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="xl:col-span-1"
                    >
                        <SalesEntry
                            restaurantId={restaurantId}
                            menuItems={menuItems}
                            selectedDate={selectedDate}
                        />
                    </motion.div>
                )}

                <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}>
                    {isLoadingDaily ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                        </div>
                    ) : (
                        <SalesGrid
                            sales={transformedSales}
                            onDelete={(id) => {
                                if (window.confirm('Are you sure you want to delete this entry?')) {
                                    const saleItem = transformedSales.find(sale => sale.id === id);
                                    if (saleItem) {
                                        deleteSales.mutate(saleItem.menuItemId);
                                    }
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}