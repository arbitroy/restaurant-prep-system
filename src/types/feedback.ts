export interface FeedbackState {
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message?: string;
}

export interface ActionFeedback {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    data?: unknown;
}

export type FeedbackHandler = (feedback: ActionFeedback) => void;