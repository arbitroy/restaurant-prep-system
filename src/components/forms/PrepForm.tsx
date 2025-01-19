import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Notification } from '@/components/ui/Notification';
import { Table } from '@/components/ui/Table';
import { MenuItem, PrepItem } from '@/types/common';
import { usePrep } from '@/hooks/usePrep';
import { UNITS, PREP_SHEETS } from '@/lib/constants/prep-items';

interface PrepFormProps {
    restaurantId: number;
    menuItems: MenuItem[];
    prepItems: PrepItem[];
}

interface PrepMapping {
    menuItemId: number;
    prepItemId: number;
    quantity: number;
}

export function PrepForm({ restaurantId, menuItems, prepItems }: PrepFormProps) {
    const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');
    const [mappings, setMappings] = useState<PrepMapping[]>([]);
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success' as const
    });
    const [isEditing, setIsEditing] = useState(false);
    const [newPrepItem, setNewPrepItem] = useState({
        name: '',
        unit: UNITS[0] as typeof UNITS[number],
        sheetName: PREP_SHEETS[0] as (typeof PREP_SHEETS)[number]
    });

    const { selectedDate } = usePrep({ restaurantId });

    const handleAddMapping = (prepItemId: number, quantity: number) => {
        if (!selectedMenuItem) return;

        setMappings(prev => [
            ...prev,
            {
                menuItemId: parseInt(selectedMenuItem),
                prepItemId,
                quantity
            }
        ]);
    };

    const handleRemoveMapping = (index: number) => {
        setMappings(prev => prev.filter((_, i) => i !== index));
    };

    const columns = [
        { header: 'Menu Item', accessor: 'menuItemId' as const },
        { header: 'Prep Item', accessor: 'prepItemId' as const },
        { header: 'Quantity', accessor: 'quantity' as const },
        { header: 'Actions', accessor: 'actions' as const }
    ];

    const mappingsData = mappings.map((mapping, index) => ({
        id: index,
        ...mapping,
        menuItemName: menuItems.find(item => item.id === mapping.menuItemId)?.name,
        prepItemName: prepItems.find(item => item.id === mapping.prepItemId)?.name,
        actions: (
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveMapping(index)}
            >
                Remove
            </Button>
        )
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Prep Item Creation */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                    {isEditing ? 'Add New Prep Item' : 'Prep Configuration'}
                </h2>

                {isEditing ? (
                    <form className="space-y-4">
                        <Input
                            label="Item Name"
                            value={newPrepItem.name}
                            onChange={(e) => setNewPrepItem(prev => ({
                                ...prev,
                                name: e.target.value
                            }))}
                        />
                        <Select
                            label="Unit"
                            value={newPrepItem.unit}
                            onChange={(e) => setNewPrepItem(prev => ({
                                ...prev,
                                unit: e.target.value as (typeof UNITS)[number]
                            }))}
                            options={UNITS.map(unit => ({
                                value: unit,
                                label: unit
                            }))}
                        />
                        <Select
                            label="Prep Sheet"
                            value={newPrepItem.sheetName}
                            onChange={(e) => setNewPrepItem(prev => ({
                                ...prev,
                                sheetName: e.target.value as typeof PREP_SHEETS[number]
                            }))}
                            options={PREP_SHEETS.map(sheet => ({
                                value: sheet,
                                label: sheet
                            }))}
                        />
                        <div className="flex space-x-2">
                            <Button
                                type="submit"
                                className="flex-1"
                            >
                                Save Item
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="w-full"
                    >
                        Add New Prep Item
                    </Button>
                )}
            </div>

            {/* Mappings Table */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Prep Mappings</h2>
                <Select
                    label="Select Menu Item"
                    value={selectedMenuItem}
                    onChange={(e) => setSelectedMenuItem(e.target.value)}
                    options={menuItems.map(item => ({
                        value: item.id.toString(),
                        label: item.name
                    }))}
                    className="mb-4"
                />
                {mappingsData.length > 0 ? (
                    <Table
                        data={mappingsData}
                        columns={columns}
                    />
                ) : (
                    <p className="text-gray-500 text-center py-4">
                        No mappings added yet
                    </p>
                )}
            </div>

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