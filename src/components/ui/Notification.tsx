import { motion, AnimatePresence } from 'framer-motion';

interface NotificationProps {
    show: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
}

export function Notification({ show, message, type = 'info', onClose }: NotificationProps) {
    const bgColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className={`fixed bottom-4 right-4 p-4 rounded-lg text-white ${bgColors[type]} shadow-lg`}
                >
                    <div className="flex items-center space-x-3">
                        <span>{message}</span>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/20 rounded"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}