import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PrepRequirement, TaskUpdate } from '@/types/prep';

interface PrepSheetProps {
    title: string;
    date: Date;
    requirements: PrepRequirement[];
    showControls?: boolean;
    onTaskUpdate?: (update: TaskUpdate) => Promise<void>;
    isUpdating?: boolean;
}

export function PrepSheet({
    title,
    date,
    requirements,
    showControls = true,
    onTaskUpdate,
    isUpdating
}: PrepSheetProps) {
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});

    const handleComplete = async (req: PrepRequirement) => {
        if (!onTaskUpdate) return;

        const completedQuantity = quantities[req.id] || 0;
        if (completedQuantity <= 0) return;

        const update: TaskUpdate = {
            id: req.id,
            completedQuantity,
            status: completedQuantity >= req.quantity ? 'completed' : 'in_progress',
            notes: notes[req.id]
        };

        await onTaskUpdate(update);

        // Clear inputs after update
        setQuantities(prev => ({ ...prev, [req.id]: 0 }));
        setNotes(prev => ({ ...prev, [req.id]: '' }));
    };

    const getStatusColor = (req: PrepRequirement) => {
        if (!req.task) return 'border-gray-200';
        switch (req.task.status) {
            case 'completed': return 'bg-green-50 border-green-200';
            case 'in_progress': return 'bg-yellow-50 border-yellow-200';
            default: return 'border-gray-200';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-gray-500">{date.toLocaleDateString()}</p>
            </div>

            <div className="space-y-4">
                {requirements.map((req) => (
                    <motion.div
                        key={req.id}
                        initial={showControls ? { opacity: 0, y: 20 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${getStatusColor(req)}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium">{req.name}</h3>
                                <p className="text-sm text-gray-600">
                                    Required: {req.quantity} {req.unit}
                                </p>
                                {req.task?.completedQuantity && (
                                    <p className="text-sm text-green-600">
                                        Completed: {req.task.completedQuantity} {req.unit}
                                    </p>
                                )}
                                {req.task?.notes && (
                                    <p className="text-sm text-gray-500 mt-2 italic">
                                        "{req.task.notes}"
                                    </p>
                                )}
                            </div>

                            {showControls && req.task?.status !== 'completed' && (
                                <div className="space-y-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={quantities[req.id] || ''}
                                        onChange={e => setQuantities(prev => ({
                                            ...prev,
                                            [req.id]: Number(e.target.value)
                                        }))}
                                        placeholder={`Enter ${req.unit}`}
                                        className="w-32"
                                    />
                                    <Input
                                        value={notes[req.id] || ''}
                                        onChange={e => setNotes(prev => ({
                                            ...prev,
                                            [req.id]: e.target.value
                                        }))}
                                        placeholder="Add notes"
                                    />
                                    <Button
                                        onClick={() => handleComplete(req)}
                                        disabled={isUpdating || !quantities[req.id]}
                                        className="w-full"
                                    >
                                        {req.task?.status === 'in_progress' ? 'Update' : 'Complete'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}