export interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

export interface ErrorProps {
    message: string;
    retry?: () => void;
}

export interface SuccessProps {
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}