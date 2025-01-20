'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PrepForm } from '@/components/forms/PrepForm';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { useItems } from '@/hooks/useItems';
import { PrepItemMapping, MenuItem } from '@/types/common';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type ViewMode = 'menu' | 'prep' | 'mapping';

export default function ItemsPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<ViewMode>('menu');
    const [showPrepForm, setShowPrepForm] = useState(false);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

    const {
        menuItems,
        prepItems,
        menuItemsByCategory,
        prepItemsBySheet,
        isLoadingMenu,
        isLoadingPrep
    } = useItems({
        restaurantId
    });

    // Delete menu item mutation
    const deleteMenuItem = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/items/menu?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete menu item');
            return response.json();
        },
        onSuccess: () => {
            showToast('Menu item deleted successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['items'] });
        },
        onError: () => {
            showToast('Failed to delete menu item', 'error');
        }
    });

    const menuColumns = [
        { header: 'Name', accessor: 'name' as const },
        { header: 'Category', accessor: 'category' as const },
        {
            header: 'Prep Items',
            accessor: 'prepItems' as const,
            render: (value: string | number | PrepItemMapping[] | Date | undefined, item: MenuItem) => 
                <span>{Array.isArray(value) ? value.length : 0}</span>
        },
        {
            header: 'Actions',
            accessor: 'id' as const,
            render: (value: string | number | Date | PrepItemMapping[] | undefined, item: MenuItem) => (
                <div className="flex space-x-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingMenuItem(item)}
                    >
                        Edit
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this item?')) {
                                if (typeof value === 'number') {
                                    deleteMenuItem.mutate(value);
                                }
                            }
                        }}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    const prepColumns = [
        { header: 'Name', accessor: 'name' as const },
        { header: 'Unit', accessor: 'unit' as const },
        { header: 'Sheet', accessor: 'sheetName' as const }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Item Management</h1>
                <div className="flex space-x-4">
                    <Button
                        variant={viewMode === 'menu' ? 'primary' : 'outline'}
                        onClick={() => setViewMode('menu')}
                    >
                        Menu Items
                    </Button>
                    <Button
                        variant={viewMode === 'prep' ? 'primary' : 'outline'}
                        onClick={() => setViewMode('prep')}
                    >
                        Prep Items
                    </Button>
                    <Button
                        variant={viewMode === 'mapping' ? 'primary' : 'outline'}
                        onClick={() => setViewMode('mapping')}
                    >
                        Mappings
                    </Button>
                </div>
            </div>

            {viewMode === 'menu' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {showMenuForm || editingMenuItem ? (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-medium mb-4">
                                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
                            </h2>
                            <MenuItemForm
                                restaurantId={restaurantId}
                                initialData={editingMenuItem || undefined}
                                onSubmit={() => {
                                    setShowMenuForm(false);
                                    setEditingMenuItem(null);
                                    queryClient.invalidateQueries({ queryKey: ['items'] });
                                }}
                                onCancel={() => {
                                    setShowMenuForm(false);
                                    setEditingMenuItem(null);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="text-lg font-medium">Menu Items</h2>
                                <Button onClick={() => setShowMenuForm(true)}>
                                    Add Menu Item
                                </Button>
                            </div>
                            {isLoadingMenu ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                                </div>
                            ) : (
                                <Table
                                    data={menuItems}
                                    columns={menuColumns}
                                />
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {viewMode === 'prep' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {showPrepForm ? (
                        <PrepForm
                            restaurantId={restaurantId}
                            onSubmit={() => setShowPrepForm(false)}
                            onCancel={() => setShowPrepForm(false)}
                        />
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="text-lg font-medium">Prep Items</h2>
                                <Button onClick={() => setShowPrepForm(true)}>
                                    Add Prep Item
                                </Button>
                            </div>
                            {isLoadingPrep ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                                </div>
                            ) : (
                                <Table
                                    data={prepItems}
                                    columns={prepColumns}
                                />
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {viewMode === 'mapping' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <PrepForm
                        restaurantId={restaurantId}
                        onSubmit={() => setShowPrepForm(false)}
                        onCancel={() => setShowPrepForm(false)}
                    />
                </motion.div>
            )}
        </div>
    );
}