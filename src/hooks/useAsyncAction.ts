import { useState } from 'react';
import { ActionFeedback } from '@/types/feedback';

export function useAsyncAction() {
    const [state, setState] = useState<ActionFeedback>({ status: 'idle' });

    const execute = async <T>(
        action: () => Promise<T>,
        options?: {
            onSuccess?: (data: T) => void;
            onError?: (error: Error) => void;
            successMessage?: string;
            errorMessage?: string;
        }
    ) => {
        try {
            setState({ status: 'loading' });
            const result = await action();
            setState({
                status: 'success',
                message: options?.successMessage,
                data: result
            });
            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : options?.errorMessage ?? 'An error occurred';
            setState({ status: 'error', message });
            options?.onError?.(error as Error);
            throw error;
        }
    };

    return { state, execute };
}