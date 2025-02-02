import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationContext, PrepTask, QueryData, TaskUpdate } from '@/types/prep';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { ApiResponse } from '@/types/common';

interface UsePrepTasksOptions {
    restaurantId: number;
    date: Date;
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
                    notes: update.notes || ''
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update task');
            }
            
            return response.json();
        },
        onMutate: async (_newTask) => {
            await queryClient.cancelQueries({ 
                queryKey: ['prepTasks', restaurantId, date] 
            });
    
            const previousTasks = queryClient.getQueryData<QueryData<PrepTask>>(['prepTasks', restaurantId, date]);
    
            return { previousTasks: previousTasks?.data || [] };
        },
        onError: (_err: Error, _newTask: TaskUpdate, context: MutationContext | undefined) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(
                    ['prepTasks', restaurantId, date],
                    { status: 'success', data: context.previousTasks }
                );
            }
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