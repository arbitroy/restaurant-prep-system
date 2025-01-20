import { motion } from "framer-motion";

export function Card({
    children,
    className = ''
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-lg shadow-sm p-6 ${className}`}
        >
            {children}
        </motion.div>
    );
}