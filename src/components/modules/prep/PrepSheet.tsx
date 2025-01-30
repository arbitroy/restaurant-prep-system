import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PrepRequirement, PrepTask, PrepStatus } from '@/types/prep';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface PrepSheetProps {
    title: string;
    date: Date;
    requirements: PrepRequirement[];
    restaurantId: number;
    showControls?: boolean;
    onTaskUpdate?: (update: {
        id: number;
        completedQuantity?: number;
        status?: PrepStatus;
        notes?: string;
    }) => Promise<void>;
    isUpdating?: boolean;
}
// Add new interface for validation state
interface ValidationState {
    isValid: boolean;
    message: string;
}

// Enhanced PrepSheet component
export function PrepSheet({
    date,
    requirements,
    restaurantId,
    showControls = true,
    onTaskUpdate,
}: PrepSheetProps) {
    const { showToast } = useToast();
    const [updatingTasks, setUpdatingTasks] = useState<Record<number, boolean>>({});
    const [taskInputs, setTaskInputs] = useState<Record<number, string>>({});
    const [validationStates, setValidationStates] = useState<Record<number, ValidationState>>({});
    const queryClient = useQueryClient();

    // Real-time validation function
    const validateQuantity = (value: string, requirement: PrepRequirement): ValidationState => {
        const quantity = parseFloat(value);
        if (isNaN(quantity)) {
            return { isValid: false, message: 'Please enter a valid number' };
        }
        if (quantity < 0) {
            return { isValid: false, message: 'Quantity cannot be negative' };
        }
        if (quantity > requirement.quantity) {
            return { 
                isValid: false, 
                message: `Cannot exceed required quantity (${requirement.quantity} ${requirement.unit})`
            };
        }
        return { isValid: true, message: '' };
    };

    const handleUpdateTask = async (
        requirement: PrepRequirement,
        completedQuantity: number
    ) => {
        if (!requirement.task?.id || !onTaskUpdate) return;

        const validation = validateQuantity(completedQuantity.toString(), requirement);
        if (!validation.isValid) {
            showToast(validation.message, 'error');
            return;
        }

        setUpdatingTasks(prev => ({ ...prev, [requirement.task!.id]: true }));

        // Optimistic update
        const oldData = queryClient.getQueryData(['prepTasks', restaurantId, date]);
        const newStatus: PrepStatus = 
            completedQuantity >= requirement.quantity ? 'completed' : 
            completedQuantity > 0 ? 'in_progress' : 'pending';

        // Optimistically update the cache
        queryClient.setQueryData(['prepTasks', restaurantId, date], (old: any) => ({
            ...old,
            data: (old?.data || []).map((task: PrepTask) => 
                task.id === requirement.task?.id
                    ? {
                        ...task,
                        completedQuantity,
                        status: newStatus
                    }
                    : task
            )
        }));

        try {
            await onTaskUpdate({
                id: requirement.task.id,
                completedQuantity,
                status: newStatus
            });

            showToast('Task updated successfully', 'success');
            setTaskInputs(prev => ({ ...prev, [requirement.task!.id]: '' }));
            
        } catch (error) {
            // Revert optimistic update
            queryClient.setQueryData(['prepTasks', restaurantId, date], oldData);
            showToast('Failed to update task', 'error');
        } finally {
            setUpdatingTasks(prev => ({ ...prev, [requirement.task!.id]: false }));
        }
    };

    const handleQuantityChange = (taskId: number, value: string, requirement: PrepRequirement) => {
        setTaskInputs(prev => ({ ...prev, [taskId]: value }));
        
        // Real-time validation
        const validation = validateQuantity(value, requirement);
        setValidationStates(prev => ({ ...prev, [taskId]: validation }));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* ... existing header code ... */}
            <div className="p-4">
                <div className="space-y-4">
                    {requirements.map((requirement: PrepRequirement) => (
                        <motion.div
                            key={requirement.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{requirement.name}</span>
                                    <span className="text-sm text-gray-500">
                                        {requirement.quantity} {requirement.unit}
                                    </span>
                                </div>
                                {showControls && requirement.task && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative flex-1">
                                                <Input
                                                    type="number"
                                                    value={taskInputs[requirement.task.id] || ''}
                                                    onChange={(e) => handleQuantityChange(
                                                        requirement.task!.id,
                                                        e.target.value,
                                                        requirement
                                                    )}
                                                    min="0"
                                                    max={requirement.quantity}
                                                    step="0.1"
                                                    className={`w-24 ${
                                                        validationStates[requirement.task.id]?.isValid === false
                                                            ? 'border-red-500'
                                                            : ''
                                                    }`}
                                                    disabled={
                                                        updatingTasks[requirement.task.id] || 
                                                        requirement.task.status === 'completed'
                                                    }
                                                />
                                                <AnimatePresence>
                                                    {validationStates[requirement.task.id]?.isValid === false && (
                                                        <motion.span
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute left-0 top-full mt-1 text-xs text-red-500"
                                                        >
                                                            {validationStates[requirement.task.id].message}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <Button
                                                onClick={() => handleUpdateTask(
                                                    requirement,
                                                    parseFloat(taskInputs[requirement.task!.id] || '0')
                                                )}
                                                disabled={
                                                    updatingTasks[requirement.task.id] || 
                                                    requirement.task.status === 'completed' ||
                                                    !taskInputs[requirement.task.id] ||
                                                    !validationStates[requirement.task.id]?.isValid
                                                }
                                                isLoading={updatingTasks[requirement.task.id]}
                                            >
                                                Update
                                            </Button>
                                        </div>
                                        <motion.div
                                            className={`flex items-center justify-between px-2 py-1 rounded ${
                                                requirement.task.status === 'completed' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : requirement.task.status === 'in_progress' 
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            <span className="text-sm font-medium">
                                                {requirement.task.completedQuantity} / {requirement.quantity}
                                            </span>
                                            <span className="text-xs">
                                                {requirement.task.status.replace('_', ' ')}
                                            </span>
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}