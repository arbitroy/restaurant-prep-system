import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PrepTask } from '@/types/prep';
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
        mutationFn: async (update: UpdateTaskInput): Promise<PrepTask> => {
            const response = await fetch('/api/prep/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update task');
            }
            
            const result: ApiResponse<PrepTask> = await response.json();
            if (!result.data) {
                throw new Error('No data returned from server');
            }
            return result.data;
        },
        onMutate: async (newTask) => {
            await queryClient.cancelQueries({
                queryKey: ['prepTasks', restaurantId, date]
            });
            
            const previousTasks = queryClient.getQueryData<PrepTask[]>(
                ['prepTasks', restaurantId, date]
            );

            queryClient.setQueryData<PrepTask[]>(
                ['prepTasks', restaurantId, date],
                old => (old ?? []).map(task =>
                    task.id === newTask.id ? { ...task, ...newTask } : task
                )
            );

            return { previousTasks };
        },
        onError: (error, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(
                    ['prepTasks', restaurantId, date],
                    context.previousTasks
                );
            }
            showToast(error instanceof Error ? error.message : 'Failed to update task', 'error');
        },
        onSuccess: (data) => {
            showToast('Task updated successfully', 'success');
            queryClient.invalidateQueries({
                queryKey: ['prepTasks', restaurantId, date]
            });
        }
    });

    return {
        tasks,
        isLoading,
        updateTask: {
            mutate: updateTask.mutate,
            mutateAsync: updateTask.mutateAsync,
            isLoading: updateTask.isPending
        }
    };
}