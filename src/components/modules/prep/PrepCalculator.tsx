import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { PREP_SHEETS } from '@/lib/constants/prep-items';
import { PrepRequirement } from '@/types/prep';

interface Props {
    requirements: PrepRequirement[];
    currentDate: Date;
    bufferPercent: number;
    onSheetAssign: (itemId: number, sheet: string) => void;
    onOrderChange: (items: PrepRequirement[]) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PrepCalculator = ({
    requirements,
    currentDate,
    bufferPercent,
    onSheetAssign,
    onOrderChange
}: Props) => {
    const { showToast } = useToast();
    const [selectedSheet, setSelectedSheet] = useState<string>(PREP_SHEETS[0]);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const filteredRequirements = requirements
        .filter(req => req.sheetName === selectedSheet)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const [items, setItems] = useState(filteredRequirements);

    const handleReorder = (reorderedItems: PrepRequirement[]) => {
        setItems(reorderedItems);
        onOrderChange(reorderedItems);
        showToast('Item order updated', 'success');
    };

    const toggleExpand = (itemId: number) => {
        const newExpanded = new Set(expandedItems);
        if (expandedItems.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const calculateNextDayBuffer = (quantity: number) => {
        return (quantity * bufferPercent) / 100;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    options={PREP_SHEETS.map(sheet => ({
                        value: sheet,
                        label: sheet
                    }))}
                    className="w-48"
                />
                <Button onClick={() => window.print()}>Print Sheet</Button>
            </div>

            <Reorder.Group
                axis="y"
                values={items}
                onReorder={handleReorder}
                className="space-y-4"
            >
                <AnimatePresence>
                    {items.map((req) => (
                        <Reorder.Item
                            key={req.id}
                            value={req}
                            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                onClick={() => toggleExpand(req.id)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">{req.name}</h4>
                                        <p className="text-sm text-gray-500">
                                            {req.quantity} {req.unit}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <Select
                                            value={req.sheetName}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                onSheetAssign(req.id, e.target.value);
                                            }}
                                            options={PREP_SHEETS.map(sheet => ({
                                                value: sheet,
                                                label: sheet
                                            }))}
                                            className="w-36"
                                        />
                                        <div className="text-gray-400">☰</div>
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
                                                const quantity = isCurrentDay ? req.quantity :
                                                    isNextDay ? calculateNextDayBuffer(req.quantity) : 0;

                                                return (
                                                    <div
                                                        key={day}
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
                </AnimatePresence>
            </Reorder.Group>
        </div>
    );
};

export default PrepCalculator;