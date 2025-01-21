import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PrepRequirement } from '@/types/prep';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PrepSheetProps {
    title: string;
    date: Date;
    requirements: PrepRequirement[];
    showControls?: boolean;
}

export const PrepSheet = forwardRef<HTMLDivElement, PrepSheetProps>(
    ({ title, date, requirements, showControls = true }, ref) => {
        const { showToast } = useToast();
        const queryClient = useQueryClient();
        const [completedQuantities, setCompletedQuantities] = useState<Record<number, number>>({});
        const [notes, setNotes] = useState<Record<number, string>>({});

        // Update prep task mutation
        const updateTask = useMutation({
            mutationFn: async (params: {
                id: number;
                completedQuantity: number;
                status: 'pending' | 'in_progress' | 'completed';
                notes?: string;
            }) => {
                const response = await fetch('/api/prep/tasks', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params)
                });
                if (!response.ok) throw new Error('Failed to update task');
                return response.json();
            },
            onSuccess: () => {
                showToast('Prep task updated successfully', 'success');
                queryClient.invalidateQueries({ queryKey: ['prepTasks'] });
            },
            onError: () => {
                showToast('Failed to update prep task', 'error');
            }
        });

        const handleComplete = (requirement: PrepRequirement) => {
            const completedQuantity = completedQuantities[requirement.id] || 0;
            if (completedQuantity >= requirement.quantity) {
                updateTask.mutate({
                    id: requirement.id,
                    completedQuantity,
                    status: 'completed',
                    notes: notes[requirement.id]
                });
            } else {
                showToast('Please complete the required quantity', 'error');
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
                                className="p-4 border rounded-lg"
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
                                            />
                                            <Input
                                                value={notes[item.id] || ''}
                                                onChange={(e) => setNotes(prev => ({
                                                    ...prev,
                                                    [item.id]: e.target.value
                                                }))}
                                                placeholder="Add notes"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => handleComplete(item)}
                                                className="w-full"
                                            >
                                                Complete
                                            </Button>
                                        </div>
                                    )}
                                </div>
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