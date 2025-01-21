import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { MenuItem, PrepItem } from '@/types/common';

interface PrepItemMappingProps {
    menuItem: MenuItem;
    prepItems: PrepItem[];
    existingMappings?: Array<{
        prepItemId: number;
        quantity: number;
    }>;
    onSave: () => void;
}

export function PrepItemMapping({
    menuItem,
    prepItems,
    existingMappings = [],
    onSave
}: PrepItemMappingProps) {
    const { showToast } = useToast();
    const [mappings, setMappings] = useState<Array<{
        prepItemId: number | string;
        quantity: number;
    }>>(existingMappings.length > 0 ? existingMappings : [{ prepItemId: '', quantity: 0 }]);

    const handleAddMapping = () => {
        setMappings([...mappings, { prepItemId: '', quantity: 0 }]);
    };

    const handleRemoveMapping = (index: number) => {
        setMappings(mappings.filter((_, i) => i !== index));
    };

    const handleMappingChange = (index: number, field: 'prepItemId' | 'quantity', value: string | number) => {
        const newMappings = [...mappings];
        newMappings[index] = {
            ...newMappings[index],
            [field]: field === 'prepItemId' ? value : Number(value)
        };
        setMappings(newMappings);
    };

    const handleSave = async () => {
        try {
            // Filter out incomplete mappings
            const validMappings = mappings.filter(m => 
                m.prepItemId !== '' && m.quantity > 0
            );

            if (validMappings.length === 0) {
                showToast('Please add at least one valid mapping', 'error');
                return;
            }

            // Save each mapping
            for (const mapping of validMappings) {
                const response = await fetch('/api/items/mapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        menuItemId: menuItem.id,
                        prepItemId: mapping.prepItemId,
                        quantity: mapping.quantity
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save mapping');
                }
            }

            showToast('Mappings saved successfully', 'success');
            onSave();
        } catch {
            showToast('Failed to save mappings', 'error');
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">
                Prep Requirements for {menuItem.name}
            </h3>

            {mappings.map((mapping, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-4"
                >
                    <div className="flex-1">
                        <Select
                            label="Prep Item"
                            value={mapping.prepItemId.toString()}
                            onChange={(e) => handleMappingChange(index, 'prepItemId', e.target.value)}
                            options={[
                                { value: '', label: 'Select prep item...' },
                                ...prepItems.map(item => ({
                                    value: item.id.toString(),
                                    label: `${item.name} (${item.unit})`
                                }))
                            ]}
                        />
                    </div>
                    
                    <div className="w-32">
                        <Input
                            type="number"
                            label="Quantity"
                            min="0"
                            step="0.1"
                            value={mapping.quantity}
                            onChange={(e) => handleMappingChange(index, 'quantity', e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => handleRemoveMapping(index)}
                    >
                        Remove
                    </Button>
                </motion.div>
            ))}

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={handleAddMapping}
                >
                    Add Prep Item
                </Button>
                <Button onClick={handleSave}>
                    Save Mappings
                </Button>
            </div>
        </div>
    );
}