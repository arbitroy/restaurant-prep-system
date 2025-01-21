import { useState, useCallback } from 'react';
import { FeedbackState } from '@/types/feedback';

export function useFeedback(initialState?: Partial<FeedbackState>) {
    const [feedback, setFeedback] = useState<FeedbackState>({
        isLoading: false,
        isSuccess: false,
        isError: false,
        message: undefined,
        ...initialState
    });

    const handleAction = useCallback(async <T>(
        action: () => Promise<T>,
        successMessage?: string
    ) => {
        try {
            setFeedback({ isLoading: true, isSuccess: false, isError: false });
            const result = await action();
            setFeedback({
                isLoading: false,
                isSuccess: true,
                isError: false,
                message: successMessage
            });
            return result;
        } catch (error) {
            setFeedback({
                isLoading: false,
                isSuccess: false,
                isError: true,
                message: error instanceof Error ? error.message : 'An error occurred'
            });
            throw error;
        }
    }, []);

    const reset = useCallback(() => {
        setFeedback({
            isLoading: false,
            isSuccess: false,
            isError: false,
            message: undefined
        });
    }, []);

    return {
        feedback,
        handleAction,
        reset
    };
}