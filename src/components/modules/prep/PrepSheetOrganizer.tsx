import React, { useState } from 'react';
import { Reorder, useDragControls, motion } from 'framer-motion';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { PrepItemBase } from '@/types/prep';
import { LoadingSpinner } from '@/components/ui/loading';

interface PrepSheetOrganizerProps {
    items: PrepItemBase[];
    isLoading?: boolean;
    onOrderChange: (items: PrepItemBase[]) => Promise<void>;
}

export default function PrepSheetOrganizer({
    items,
    isLoading = false,
    onOrderChange
}: PrepSheetOrganizerProps) {
    const { showToast } = useToast();
    const [updatingSheet, setUpdatingSheet] = useState<string | null>(null);
    const [localItems, setLocalItems] = useState(() => {
        // Group items by sheet and sort by existing order
        return Object.entries(
            items.reduce((acc, item) => {
                if (!acc[item.sheetName]) {
                    acc[item.sheetName] = [];
                }
                acc[item.sheetName].push(item);
                return acc;
            }, {} as Record<string, PrepItemBase[]>)
        ).map(([sheetName, items]) => ({
            sheetName,
            items: items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        }));
    });

    const handleReorder = async (sheetName: string, reorderedItems: PrepItemBase[]) => {
        try {
            setUpdatingSheet(sheetName);
            
            // Update local state immediately for smooth UX
            setLocalItems(prev => 
                prev.map(sheet => 
                    sheet.sheetName === sheetName
                        ? { ...sheet, items: reorderedItems }
                        : sheet
                )
            );

            // Update order numbers
            const updatedItems = reorderedItems.map((item, index) => ({
                ...item,
                order: index
            }));

            // Notify parent of all changes
            await onOrderChange(updatedItems);
            showToast(`Updated ${sheetName} order successfully`, 'success');
        } catch (error) {
            showToast(`Failed to update ${sheetName} order`, 'error');
            
            // Revert local state on error
            setLocalItems(prev => 
                prev.map(sheet => 
                    sheet.sheetName === sheetName
                        ? { 
                            ...sheet, 
                            items: sheet.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) 
                          }
                        : sheet
                )
            );
        } finally {
            setUpdatingSheet(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {localItems.map(({ sheetName, items }) => (
                <div 
                    key={sheetName} 
                    className={`bg-white p-4 rounded-lg shadow-sm ${
                        updatingSheet === sheetName ? 'opacity-75' : ''
                    }`}
                >
                    <h3 className="font-medium text-lg mb-3 flex items-center justify-between">
                        {sheetName}
                        {updatingSheet === sheetName && (
                            <span className="text-sm text-gray-500 flex items-center">
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Updating order...</span>
                            </span>
                        )}
                    </h3>
                    <Reorder.Group
                        axis="y"
                        values={items}
                        onReorder={(items) => handleReorder(sheetName, items)}
                        className="space-y-2"
                    >
                        {items.map((item) => (
                            <ReorderItem 
                                key={item.id} 
                                item={item}
                                disabled={updatingSheet === sheetName}
                            />
                        ))}
                    </Reorder.Group>
                </div>
            ))}
        </div>
    );
}

interface ReorderItemProps {
    item: PrepItemBase;
    disabled: boolean;
}

function ReorderItem({ item, disabled }: ReorderItemProps) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={dragControls}
            className={`bg-gray-50 p-3 rounded cursor-move hover:bg-gray-100 transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
            <motion.div
                className="flex items-center gap-2"
                onPointerDown={(e) => {
                    if (!disabled) {
                        dragControls.start(e);
                    }
                }}
                whileTap={{ cursor: disabled ? 'not-allowed' : 'grabbing' }}
            >
                <div className="text-[#717744]">☰</div>
                <span>{item.name}</span>
                {item.unit && (
                    <span className="text-sm text-gray-500">({item.unit})</span>
                )}
            </motion.div>
        </Reorder.Item>
    );
}