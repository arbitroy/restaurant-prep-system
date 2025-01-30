import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PrepTask, TaskUpdate } from '@/types/prep';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { ApiResponse } from '@/types/common';

interface UsePrepTasksOptions {
    restaurantId: number;
    date: Date;
}

interface UpdateTaskInput {
    id: number;
    completedQuantity?: number;
    status?: 'pending' | 'in_progress' | 'completed';
    notes?: string;
}

export function usePrepTasks({ restaurantId, date }: UsePrepTasksOptions) {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    // Properly typed query with error handling
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['prepTasks', restaurantId, date] as const,
        queryFn: async (): Promise<PrepTask[]> => {
            try {
                const response = await fetch(
                    `/api/prep/tasks?restaurantId=${restaurantId}&date=${date.toISOString()}`
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch prep tasks');
                }
                const result: ApiResponse<PrepTask[]> = await response.json();
                return result.data ?? [];
            } catch (error) {
                showToast('Failed to load prep tasks', 'error');
                throw error;
            }
        }
    });

    // Task update mutation with proper typing
    
    const updateTask = useMutation({
        mutationFn: async (update: TaskUpdate) => {
            const response = await fetch('/api/prep/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...update,
                    notes: update.notes || ''  // Ensure notes is always a string
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update task');
            }
            
            return response.json();
        },
        onSuccess: () => {
            // Invalidate both prep requirements and tasks queries
            queryClient.invalidateQueries({ 
                queryKey: ['prep-requirements', restaurantId, date] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['prep-tasks', restaurantId, date] 
            });
        }
    });

    const filterTasks = (tasks: PrepTask[], showCompleted: boolean = false) => {
        return tasks.filter(task => showCompleted || task.status !== 'completed');
    };

    return {
        tasks,
        isLoading,
        filterTasks,
        updateTask: {
            mutate: updateTask.mutate,
            mutateAsync: updateTask.mutateAsync,
            isLoading: updateTask.isPending
        }
    };
}