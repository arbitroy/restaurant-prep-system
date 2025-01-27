import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PrepRequirement, PrepTask } from '@/types/prep';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PrepSheetProps {
    title: string;
    date: Date;
    requirements: PrepRequirement[];
    showControls?: boolean;
    onTaskUpdate?: (task: PrepTask) => Promise<void>;
    isUpdating?: boolean;
}
interface TaskUpdate {
    id: number;
    completedQuantity: number;
    status: 'pending' | 'in_progress' | 'completed';
    notes?: string;
}

export const PrepSheet = forwardRef<HTMLDivElement, PrepSheetProps>(
    ({ title, date, requirements, showControls = true }, ref) => {
        const { showToast } = useToast();
        const queryClient = useQueryClient();
        const [completedQuantities, setCompletedQuantities] = useState<Record<number, number>>({});
        const [notes, setNotes] = useState<Record<number, string>>({});
        const [updatingItems, setUpdatingItems] = useState<Record<number, boolean>>({});

        // Update prep task mutation
        const updateTask = useMutation({
            mutationFn: async (params: TaskUpdate) => {
                const response = await fetch('/api/prep/tasks', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params)
                });
                if (!response.ok) throw new Error('Failed to update task');
                return response.json();
            },
            onMutate: (variables) => {
                // Optimistic update
                setUpdatingItems(prev => ({ ...prev, [variables.id]: true }));
            },
            onSuccess: (_, variables) => {
                showToast('Task updated successfully', 'success');
                queryClient.invalidateQueries({ queryKey: ['prepTasks'] });
                // Clear form state for this item
                setCompletedQuantities(prev => {
                    const newState = { ...prev };
                    delete newState[variables.id];
                    return newState;
                });
                setNotes(prev => {
                    const newState = { ...prev };
                    delete newState[variables.id];
                    return newState;
                });
            },
            onError: (error) => {
                showToast(error.message || 'Failed to update task', 'error');
            },
            onSettled: (_, __, variables) => {
                setUpdatingItems(prev => ({ ...prev, [variables.id]: false }));
            }
        });

        const handleComplete = async (requirement: PrepRequirement) => {
            const completedQuantity = completedQuantities[requirement.id] || 0;
            
            // Validate input
            if (completedQuantity <= 0) {
                showToast('Please enter a valid quantity', 'error');
                return;
            }

            if (completedQuantity < requirement.quantity) {
                if (!confirm('Completed quantity is less than required. Mark as in progress?')) {
                    return;
                }
            }

            try {
                await updateTask.mutateAsync({
                    id: requirement.id,
                    completedQuantity,
                    status: completedQuantity >= requirement.quantity ? 'completed' : 'in_progress',
                    notes: notes[requirement.id]
                });
            } catch (error) {
                // Error is handled by mutation error callback
            }
        };

        // Ensure requirements array is unique
        const uniqueRequirements = requirements.filter((req, index, self) =>
            index === self.findIndex((r) => r.id === req.id)
        );

        return (
            <div ref={ref} className="bg-white p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold">{title}</h2>
                        <p className="text-gray-500">
                            {date.toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {uniqueRequirements.map((item) => (
                            <motion.div
                                key={`prep-item-${item.id}-${date.toISOString()}`}
                                initial={showControls ? { opacity: 0, y: 20 } : false}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 border rounded-lg ${
                                    updatingItems[item.id] ? 'bg-gray-50' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium">{item.name}</h4>
                                        <p className="text-sm text-gray-500">
                                            Required: {item.quantity} {item.unit}
                                        </p>
                                    </div>
                                    {showControls && (
                                        <div className="space-y-2">
                                            <Input
                                                type="number"
                                                value={completedQuantities[item.id] || ''}
                                                onChange={(e) => setCompletedQuantities(prev => ({
                                                    ...prev,
                                                    [item.id]: Number(e.target.value)
                                                }))}
                                                placeholder="Completed amount"
                                                className="w-32"
                                                disabled={updatingItems[item.id]}
                                            />
                                            <Input
                                                value={notes[item.id] || ''}
                                                onChange={(e) => setNotes(prev => ({
                                                    ...prev,
                                                    [item.id]: e.target.value
                                                }))}
                                                placeholder="Add notes"
                                                disabled={updatingItems[item.id]}
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => handleComplete(item)}
                                                className="w-full"
                                                isLoading={updatingItems[item.id]}
                                                disabled={updatingItems[item.id]}
                                            >
                                                {updatingItems[item.id] ? 'Updating...' : 'Complete'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {item.status && (
                                    <div className="mt-2">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                            item.status === 'completed' 
                                                ? 'bg-green-100 text-green-800'
                                                : item.status === 'in_progress'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {!showControls && (
                        <div className="mt-8 pt-8 border-t">
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <p className="text-sm text-gray-500">Prepared By</p>
                                    <div className="h-8 border-b border-gray-300 mt-2" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Checked By</p>
                                    <div className="h-8 border-b border-gray-300 mt-2" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Date/Time</p>
                                    <div className="h-8 border-b border-gray-300 mt-2" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);