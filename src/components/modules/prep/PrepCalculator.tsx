import React, { useState, useEffect, useCallback } from 'react';
import { motion, Reorder} from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PREP_SHEETS } from '@/lib/constants/prep-items';
import { 
    PrepRequirement, 
    PrepOrderUpdate, 
    PrepSheetName 
} from '@/types/prep';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface PrepCalculatorProps {
    requirements: PrepRequirement[];
    currentDate: Date;
    bufferPercent: number;
    restaurantId: number;
    onOrderChange: (updates: PrepOrderUpdate[]) => Promise<void>;
    isUpdating: boolean;
    optimisticUpdates: PrepOrderUpdate[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PrepCalculator: React.FC<PrepCalculatorProps> = ({
    requirements,
    currentDate,
    bufferPercent,
    restaurantId,
    onOrderChange,
    isUpdating,
    optimisticUpdates
}) => {
    const { showToast } = useToast();
    const [selectedSheet, setSelectedSheet] = useState<PrepSheetName>(PREP_SHEETS[0]);
    const [expandedItems, setExpandedItems] = useState(new Set<number>());
    const [, setIsGeneratingTasks] = useState(false);
    
    const generateTasks = useCallback(async () => {
        if (requirements.length === 0) return;
    
        try {
            setIsGeneratingTasks(true);
            const response = await fetch('/api/prep/tasks/generate', {
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
            });
    
            if (!response.ok) {
                throw new Error('Failed to generate tasks');
            }
    
            const data = await response.json();
            if (data.data.tasksGenerated > 0) {
                showToast(`Generated ${data.data.tasksGenerated} new prep tasks`, 'success');
            }
        } catch (error) {
            console.error('Error generating tasks:', error);
            showToast('Failed to generate prep tasks', 'error');
        } finally {
            setIsGeneratingTasks(false);
        }
    }, [requirements, currentDate, restaurantId, showToast]);

    useEffect(() => {
        generateTasks();
    }, [currentDate]);


    // Filter and sort requirements by selected sheet
    const sheetItems = requirements
        .filter(req => req.sheetName === selectedSheet)
        .sort((a, b) => a.order - b.order);

    const handleReorder = async (reorderedItems: PrepRequirement[]) => {
        if (isUpdating) return; // Prevent multiple updates

        try {
            const updates: PrepOrderUpdate[] = reorderedItems.map((item, index) => ({
                id: item.id,
                order: index,
                sheetName: selectedSheet
            }));

            await onOrderChange(updates);
        } catch (error) {
            console.error('Error reordering items:', error);
            showToast('Failed to update item order', 'error');
        }
    };

    const toggleExpand = (itemId: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
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

    const calculateNextDayBuffer = (quantity: number): number => {
        const numericQuantity = Number(quantity);
        return isNaN(numericQuantity) ? 0 : Math.ceil((numericQuantity * bufferPercent) / 100);
    };

    const isItemBeingUpdated = (itemId: number): boolean => {
        return optimisticUpdates.some(update => update.id === itemId);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <Select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value as PrepSheetName)}
                    options={PREP_SHEETS.map(sheet => ({
                        value: sheet,
                        label: sheet
                    }))}
                    className="w-48"
                    disabled={isUpdating}
                />
                <div className="text-sm text-gray-500">
                    Buffer: {bufferPercent}%
                </div>
            </div>

            {sheetItems.length > 0 ? (
                <Reorder.Group
                    axis="y"
                    values={sheetItems}
                    onReorder={handleReorder}
                    className="space-y-4"
                >
                    {sheetItems.map((req) => {
                        const isUpdating = isItemBeingUpdated(req.id);
                        
                        return (
                            <Reorder.Item
                                key={req.id}
                                value={req}
                                className={`
                                    bg-white p-4 rounded-lg shadow-sm 
                                    ${isUpdating ? 'opacity-50' : 'hover:shadow-md'} 
                                    transition-all cursor-move
                                `}
                                disabled={isUpdating}
                            >
                                <motion.div 
                                    className="select-none"
                                    onClick={() => toggleExpand(req.id)}
                                    layout
                                >
                                    {/* Item Header */}
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
                                                onClick={(e) => toggleExpand(req.id, e)}
                                                disabled={isUpdating}
                                            >
                                                {expandedItems.has(req.id) ? 'Collapse' : 'Details'}
                                            </Button>
                                            <div className="text-gray-400 cursor-grab">☰</div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedItems.has(req.id) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-4 pt-4 border-t"
                                            layout
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
                                                            className={`
                                                                p-2 rounded 
                                                                ${quantity > 0 ? 'bg-[#abac7f]/20' : 'bg-gray-50'}
                                                            `}
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
                        );
                    })}
                </Reorder.Group>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No prep items found for {selectedSheet}
                </div>
            )}
        </div>
    );
};