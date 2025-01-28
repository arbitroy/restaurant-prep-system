import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PREP_SHEETS } from '@/lib/constants/prep-items';
import { PrepRequirement, PrepOrderUpdate } from '@/types/prep';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface Props {
    requirements: PrepRequirement[];
    currentDate: Date;
    bufferPercent: number;
    restaurantId: number;
    onOrderChange: (updates: PrepOrderUpdate[]) => Promise<void>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PrepCalculator = ({
    requirements,
    currentDate,
    bufferPercent,
    restaurantId,
    onOrderChange
}: Props) => {
    const { showToast } = useToast();
    const [selectedSheet, setSelectedSheet] = useState<typeof PREP_SHEETS[number]>(PREP_SHEETS[0]);
    const [expandedItems, setExpandedItems] = useState(new Set<number>());

    useEffect(() => {
        if (requirements.length > 0) {
            fetch('/api/prep/tasks/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    date: currentDate.toISOString(),
                    requirements: requirements.map(req => ({
                        prepItemId: req.id,
                        requiredQuantity: Number(req.quantity)
                    }))
                })
            }).then(response => {
                if (!response.ok) throw new Error('Failed to generate tasks');
                return response.json();
            }).then(data => {
                if (data.tasksGenerated > 0) {
                    showToast(`Generated ${data.tasksGenerated} prep tasks`, 'success');
                }
            }).catch(error => {
                console.error('Error generating tasks:', error);
                showToast('Failed to generate prep tasks', 'error');
            });
        }
    }, [requirements, currentDate, restaurantId, showToast]);

    // Filter and sort items by sheet and order
    const sheetItems = requirements
        .filter(req => req.sheetName === selectedSheet)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const handleReorder = async (reorderedItems: PrepRequirement[]) => {
        try {
            const updates = reorderedItems.map((item, index) => ({
                id: item.id,
                order: index,
                sheetName: selectedSheet
            }));

            await onOrderChange(updates);
            showToast('Item order updated successfully', 'success');
        } catch (error) {
            console.error('Error reordering items:', error);
            showToast('Failed to update item order', 'error');
        }
    };

    const toggleExpand = (itemId: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const calculateNextDayBuffer = (quantity: number) => {
        const numericQuantity = Number(quantity);
        if (isNaN(numericQuantity)) return 0;
        return Math.ceil((numericQuantity * bufferPercent) / 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <Select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value as typeof PREP_SHEETS[number])}
                    options={PREP_SHEETS.map(sheet => ({
                        value: sheet,
                        label: sheet
                    }))}
                    className="w-48"
                />
                <div className="text-sm text-gray-500">
                    Buffer: {bufferPercent}%
                </div>
            </div>

            <Reorder.Group
                axis="y"
                values={sheetItems}
                onReorder={handleReorder}
                className="space-y-4"
            >
                {sheetItems.map((req) => (
                    <Reorder.Item
                        key={req.id}
                        value={req}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                        <motion.div onClick={() => toggleExpand(req.id)}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium">{req.name}</h4>
                                    <p className="text-sm text-gray-500">
                                        {Number(req.quantity).toFixed(1)} {req.unit}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(req.id);
                                        }}
                                    >
                                        {expandedItems.has(req.id) ? 'Collapse' : 'Details'}
                                    </Button>
                                    <div className="text-gray-400 cursor-grab">☰</div>
                                </div>
                            </div>

                            {expandedItems.has(req.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 pt-4 border-t"
                                >
                                    <div className="grid grid-cols-7 gap-2">
                                        {DAYS.map((day, i) => {
                                            const isCurrentDay = i === currentDate.getDay();
                                            const isNextDay = i === (currentDate.getDay() + 1) % 7;
                                            const quantity = isCurrentDay ? Number(req.quantity) :
                                                isNextDay ? calculateNextDayBuffer(req.quantity) : 0;

                                            return (
                                                <div
                                                    key={`${req.id}-${day}`}
                                                    className={`p-2 rounded ${quantity > 0 ? 'bg-[#abac7f]/20' : 'bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="text-xs font-medium">{day}</div>
                                                    <div className="text-sm">
                                                        {quantity.toFixed(1)} {req.unit}
                                                    </div>
                                                    {quantity > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            {isCurrentDay ? '100%' : `${bufferPercent}%`}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
    );
};