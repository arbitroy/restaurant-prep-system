import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Notification } from '@/components/ui/Notification';
import { MenuItem } from '@/types/common';
import { useSales } from '@/hooks/useSales';

interface SalesEntryProps {
    restaurantId: number;
    menuItems: MenuItem[];
    selectedDate: Date;
}

export function SalesEntry({ restaurantId, menuItems, selectedDate }: SalesEntryProps) {
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [notification, setNotification] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({
        show: false,
        message: '',
        type: 'success'
    });

    const {
        addSalesEntry,
        isAddingEntry
    } = useSales({
        restaurantId
    });

    const validateForm = (): boolean => {
        // Convert and validate quantity
        const numericQuantity = parseInt(quantity);
        if (!quantity || isNaN(numericQuantity) || numericQuantity <= 0) {
            setNotification({
                show: true,
                message: 'Please enter a valid quantity',
                type: 'error'
            });
            return false;
        }

        // Validate selected item
        const itemId = parseInt(selectedItem);
        if (!selectedItem || isNaN(itemId) || !menuItems.find(item => item.id === itemId)) {
            setNotification({
                show: true,
                message: 'Please select a valid menu item',
                type: 'error'
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await addSalesEntry({
                restaurantId,
                menuItemId: parseInt(selectedItem),
                quantity: parseInt(quantity),
                date: selectedDate
            });

            // Reset form on success
            setSelectedItem('');
            setQuantity('');
            
            setNotification({
                show: true,
                message: 'Sales entry added successfully',
                type: 'success'
            });
        } catch {
            setNotification({
                show: true,
                message: 'Failed to add sales entry',
                type: 'error'
            });
        }
    };

    const menuOptions = menuItems.map(item => ({
        value: item.id.toString(),
        label: item.name
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white rounded-lg shadow-sm"
        >
            <h2 className="text-xl font-semibold mb-2">Add Sales Entry</h2>
            <div className="text-sm text-gray-500 mb-4">
                Adding entry for: {selectedDate.toLocaleDateString()}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Menu Item"
                    value={selectedItem}
                    onChange={(e) => {
                        setSelectedItem(e.target.value);
                        // Clear any error notification when user makes a selection
                        if (notification.show && notification.type === 'error') {
                            setNotification(prev => ({ ...prev, show: false }));
                        }
                    }}
                    options={[
                        { value: '', label: 'Select an item...' },
                        ...menuOptions
                    ]}
                />
                <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                        setQuantity(e.target.value);
                        // Clear any error notification when user types
                        if (notification.show && notification.type === 'error') {
                            setNotification(prev => ({ ...prev, show: false }));
                        }
                    }}
                    placeholder="Enter quantity"
                />
                <Button
                    type="submit"
                    isLoading={isAddingEntry}
                    className="w-full"
                    disabled={isAddingEntry}
                >
                    Add Entry
                </Button>
            </form>

            <AnimatePresence>
                {notification.show && (
                    <Notification
                        show={notification.show}
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}