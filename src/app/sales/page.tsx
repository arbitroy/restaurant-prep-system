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

export default function SalesPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    const {
        dailySales,
        isLoadingDaily,
        selectedDate,
        setSelectedDate
    } = useSales({
        restaurantId
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Sales Management</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Hide Form' : 'Add Sales'}
                </Button>
            </div>

            <div className="flex space-x-4 items-center">
                <Input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-48"
                />
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
                        />
                    </motion.div>
                )}

                <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}>
                    {isLoadingDaily ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                        </div>
                    ) : (
                        <SalesGrid
                            sales={(dailySales?.items || []).map(item => ({
                                ...item,
                                restaurantId,
                                date: selectedDate,
                                id: item.menuItemId,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }))}
                            onDelete={(id) => {
                                if (window.confirm('Are you sure you want to delete this entry?')) {
                                    deleteSales.mutate(id);
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}