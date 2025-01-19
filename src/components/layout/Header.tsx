import { motion } from 'framer-motion';
import { SITE_CONFIG } from '@/lib/constants/site';

export function Header() {
    return (
        <header className="bg-[#373d20] text-[#fefefe] px-6 py-4">
            <div className="flex items-center justify-between">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-semibold"
                >
                    {SITE_CONFIG.title}
                </motion.h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm">Restaurant Name</span>
                </div>
            </div>
        </header>
    )
}