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
}

export function SalesEntry({ restaurantId, menuItems }: SalesEntryProps) {
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
        isAddingEntry,
        selectedDate
    } = useSales({
        restaurantId
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedItem || !quantity) {
            setNotification({
                show: true,
                message: 'Please fill in all fields',
                type: 'error'
            });
            return;
        }

        try {
            await addSalesEntry({
                restaurantId,
                menuItemId: parseInt(selectedItem),
                quantity: parseInt(quantity),
                date: selectedDate
            });

            setNotification({
                show: true,
                message: 'Sales entry added successfully',
                type: 'success'
            });

            // Reset form
            setSelectedItem('');
            setQuantity('');
        } catch (error) {
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
            <h2 className="text-xl font-semibold mb-4">Add Sales Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Menu Item"
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    options={menuOptions}
                />
                <Input
                    label="Quantity"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />
                <Button
                    type="submit"
                    isLoading={isAddingEntry}
                    className="w-full"
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
