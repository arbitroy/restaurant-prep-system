import React, { useState } from 'react';
import { Reorder } from 'framer-motion';

interface PrepItemOrganizer {
    id: number;
    name: string;
    sheetName: string;
    order: number;
}

export default function PrepSheetOrganizer({
    items,
    onOrderChange
}: {
    items: PrepItemOrganizer[];
    onOrderChange: (items: PrepItemOrganizer[]) => void;
}) {
    const [sheets, setSheets] = useState(() => {
        const grouped = items.reduce((acc, item) => {
            if (!acc[item.sheetName]) {
                acc[item.sheetName] = [];
            }
            acc[item.sheetName].push(item);
            return acc;
        }, {} as Record<string, PrepItemOrganizer[]>);

        // Sort by existing order
        Object.values(grouped).forEach(items => {
            items.sort((a, b) => a.order - b.order);
        });

        return grouped;
    });

    const handleReorder = (sheetName: string, reorderedItems: PrepItemOrganizer[]) => {
        // Update order numbers
        const updatedItems = reorderedItems.map((item, index) => ({
            ...item,
            order: index
        }));

        setSheets(prev => ({
            ...prev,
            [sheetName]: updatedItems
        }));

        // Notify parent of all changes
        const allItems = Object.values(sheets).flat();
        onOrderChange(allItems);
    };

    return (
        <div className="space-y-6">
            {Object.entries(sheets).map(([sheetName, sheetItems]) => (
                <div key={sheetName} className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-medium text-lg mb-3">{sheetName}</h3>
                    <Reorder.Group
                        axis="y"
                        values={sheetItems}
                        onReorder={(items) => handleReorder(sheetName, items)}
                        className="space-y-2"
                    >
                        {sheetItems.map((item) => (
                            <Reorder.Item
                                key={item.id}
                                value={item}
                                className="bg-gray-50 p-3 rounded cursor-move hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="text-[#717744]">☰</div>
                                    <span>{item.name}</span>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </div>
            ))}
        </div>
    );
}