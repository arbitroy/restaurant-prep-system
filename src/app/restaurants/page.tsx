'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RestaurantForm } from '@/components/forms/RestaurantForm';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '@/contexts/RestaurantContext';

interface Restaurant {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export default function RestaurantsPage() {
    const { setRestaurantId } = useRestaurant();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

    // Fetch restaurants
    const { data: restaurants, isLoading } = useQuery<{ data: Restaurant[] }>({
        queryKey: ['restaurants'],
        queryFn: async () => {
            const response = await fetch('/api/restaurants');
            if (!response.ok) throw new Error('Failed to fetch restaurants');
            return response.json();
        }
    });

    // Delete restaurant mutation
    const deleteRestaurant = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/restaurants?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete restaurant');
            return response.json();
        },
        onSuccess: () => {
            showToast('Restaurant deleted successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['restaurants'] });
        },
        onError: () => {
            showToast('Failed to delete restaurant', 'error');
        }
    });

    const columns = [
        { 
            header: 'Name', 
            accessor: 'name' as const 
        },
        {
            header: 'Created At',
            accessor: 'created_at' as const,
            render: (value: string | number) => new Date(value as string).toLocaleDateString()
        },
        {
            header: 'Actions',
            accessor: 'id' as const,
            render: (value: string | number, item: Restaurant) => (
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRestaurantId(Number(value))}
                    >
                        Switch To
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRestaurant(item)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this restaurant?')) {
                                deleteRestaurant.mutate(Number(value));
                            }
                        }}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Restaurant Management</h1>
                <Button onClick={() => setShowForm(true)}>
                    Add Restaurant
                </Button>
            </div>

            {(showForm || editingRestaurant) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <h2 className="text-lg font-medium mb-4">
                        {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
                    </h2>
                    <RestaurantForm
                        initialData={editingRestaurant || undefined}
                        onSubmit={() => {
                            setShowForm(false);
                            setEditingRestaurant(null);
                            queryClient.invalidateQueries({ queryKey: ['restaurants'] });
                        }}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingRestaurant(null);
                        }}
                    />
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg shadow-sm"
            >
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                ) : (
                    <Table
                        data={restaurants?.data || []}
                        columns={columns}
                    />
                )}
            </motion.div>
        </div>
    );
}