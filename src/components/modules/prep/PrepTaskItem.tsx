import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PrepRequirement, TaskUpdate } from '@/types/prep';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface PrepTaskItemProps {
    requirement: PrepRequirement;
    onTaskUpdate?: (update: TaskUpdate) => Promise<void>;
    isUpdating?: boolean;
}

export function PrepTaskItem({ 
    requirement, 
    onTaskUpdate, 
    isUpdating 
}: PrepTaskItemProps) {
    const { showToast } = useToast();
    const [quantity, setQuantity] = useState(
        requirement.task?.completedQuantity || 0
    );
    const [notes, setNotes] = useState(
        requirement.task?.notes || ''
    );
    

    const progress = Math.min(
        ((requirement.task?.completedQuantity || 0) / requirement.quantity) * 100,
        100
    );

    

    const getStatusColor = () => {
        if (!requirement.task) return 'border-gray-200';
        switch (requirement.task.status) {
            case 'completed': return 'bg-green-50 border-green-200';
            case 'in_progress': return 'bg-yellow-50 border-yellow-200';
            default: return 'border-gray-200';
        }
    };

    const handleUpdate = async () => {
        if (isUpdating || !requirement.task || !onTaskUpdate) return;

        try {
            await onTaskUpdate({
                id: requirement.task.id,
                completedQuantity: quantity,
                status: quantity >= requirement.quantity 
                    ? 'completed' 
                    : quantity > 0 
                        ? 'in_progress' 
                        : 'pending',
                notes: notes.trim() || undefined
            });
            showToast('Task updated successfully', 'success');
            
        } catch (error) {
            console.error('Failed to update task:', error);
            showToast('Failed to update task', 'error');
        }
    };

    // Determine if updates are allowed
    const isUpdateDisabled = 
        isUpdating || 
        !onTaskUpdate || 
        !requirement.task ||
        requirement.task.status === 'completed';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${getStatusColor()}`}
        >
            <div className="mb-2 flex justify-between items-start">
                <div>
                    <h4 className="font-medium">{requirement.name}</h4>
                    <p className="text-sm text-gray-600">
                        Required: {requirement.quantity} {requirement.unit}
                    </p>
                    {requirement.task?.completedQuantity && (
                        <p className="text-sm text-green-600">
                            Completed: {requirement.task.completedQuantity} {requirement.unit}
                        </p>
                    )}
                </div>
                {requirement.task && (
                    <span className={`px-2 py-1 text-sm rounded-full ${
                        requirement.task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : requirement.task.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                    }`}>
                        {requirement.task.status}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full rounded-full bg-[#717744]"
                />
            </div>

            <div className="space-y-4">
                <Input
                    type="number"
                    min="0"
                    max={requirement.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={isUpdateDisabled}
                    placeholder={`Enter completed amount (${requirement.unit})`}
                />

                <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isUpdateDisabled}
                    placeholder="Add notes"
                />

                {onTaskUpdate && ( 
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdateDisabled}
                        isLoading={isUpdating}
                        className="w-full"
                    >
                        {requirement.task?.status === 'in_progress' 
                            ? 'Update Progress' 
                            : 'Complete Task'}
                    </Button>
                )}
            </div>
        </motion.div>
    );
}