import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    className?: string;
}

export function LoadingSpinner({
    size = 'md',
    message,
    className = ''
}: LoadingSpinnerProps) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <motion.div
                className={`border-2 border-t-[#717744] rounded-full ${sizes[size]}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {message && (
                <p className="mt-2 text-sm text-[#373d20]">{message}</p>
            )}
        </div>
    );
}

interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
    return (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <LoadingSpinner message={message} />
        </div>
    );
}

interface LoadingStateProps {
    loading: boolean;
    children: React.ReactNode;
    message?: string;
}

export function LoadingState({ loading, children, message }: LoadingStateProps) {
    return (
        <div className="relative">
            {children}
            {loading && <LoadingOverlay message={message} />}
        </div>
    );
}