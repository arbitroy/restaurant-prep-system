'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PrepForm } from '@/components/forms/PrepForm';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import { PrepItemMapping } from '@/components/modules/prep/PrepItemMapping';
import { PrepItemMapping as PIM } from '@/types/common';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { useItems } from '@/hooks/useItems';
import { MenuItem } from '@/types/common';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PrepItem } from '@/types/prep';

type ViewMode = 'menu' | 'prep' | 'mapping';

export default function ItemsPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<ViewMode>('menu');
    const [showPrepForm, setShowPrepForm] = useState(false);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
    const [mappingMenuItem, setMappingMenuItem] = useState<MenuItem | null>(null);

    const {
        menuItems,
        prepItems,
        isLoadingMenu,
        isLoadingPrep,
        error
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

    const handleShowMapping = (menuItem: MenuItem) => {
        setMappingMenuItem(menuItem);
        setViewMode('mapping');
    };

    const menuColumns = [
        { header: 'Name', accessor: 'name' as const },
        { header: 'Category', accessor: 'category' as const },
        {
            header: 'Prep Items',
            accessor: 'prepItems' as const,
            render: (value: string | number | Date | PIM[] | undefined) => {
                return (
                    <span className="px-2 py-1 bg-[#abac7f]/20 rounded-full">
                        {Array.isArray(value) ? value.length : 0}
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            accessor: 'id' as const,
            render: (value: string | number | Date | PIM[] | undefined, item: MenuItem) => (
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
                        onClick={() => handleShowMapping(item)}
                    >
                        Prep Items
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this item?')) {
                                if (typeof value === 'number') {
                                    deleteMenuItem.mutate(value);
                                } else {
                                    showToast('Invalid item ID', 'error');
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
        { header: 'Name', accessor: 'name' as keyof PrepItem },
        { header: 'Unit', accessor: 'unit' as keyof PrepItem },
        { header: 'Sheet', accessor: 'sheetName' as keyof PrepItem }
    ];

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800">Error loading items: {error.message}</p>
            </div>
        );
    }

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
                </div>
            </div>

            {/* Main content area */}
            {isLoadingMenu || isLoadingPrep ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                </div>
            ) : viewMode === 'menu' && !mappingMenuItem ? (
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
                            <Table
                                data={menuItems}
                                columns={menuColumns}
                            />
                        </div>
                    )}
                </motion.div>
            ) : viewMode === 'prep' ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {showPrepForm ? (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-medium mb-4">Add Prep Item</h2>
                            <PrepForm
                                restaurantId={restaurantId}
                                onSubmit={() => {
                                    setShowPrepForm(false);
                                    queryClient.invalidateQueries({ queryKey: ['items'] });
                                }}
                                onCancel={() => setShowPrepForm(false)}
                            />
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="text-lg font-medium">Prep Items</h2>
                                <Button onClick={() => setShowPrepForm(true)}>
                                    Add Prep Item
                                </Button>
                            </div>
                            <Table
                                data={prepItems}
                                columns={prepColumns}
                            />
                        </div>
                    )}
                </motion.div>
            ) : mappingMenuItem ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium">Prep Requirements</h2>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setMappingMenuItem(null);
                                setViewMode('menu');
                            }}
                        >
                            Back to Menu Items
                        </Button>
                    </div>
                    <PrepItemMapping
                        menuItem={mappingMenuItem}
                        prepItems={prepItems}
                        existingMappings={mappingMenuItem.prepItems?.map(mapping => ({
                            prepItemId: mapping.prepItemId,
                            quantity: mapping.quantity
                        }))}
                        onSave={() => {
                            queryClient.invalidateQueries({ queryKey: ['items'] });
                            setMappingMenuItem(null);
                            setViewMode('menu');
                        }}
                    />
                </motion.div>
            ) : null}
        </div>
    );
}