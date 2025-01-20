'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/lib/constants/navigation';
import { ToastProvider } from '../ui/Toast/ToastContext';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <ToastProvider>
            <div className="min-h-screen bg-[#fefefe]">
                {/* Sidebar */}
                <motion.aside
                    initial={{ x: -250 }}
                    animate={{ x: 0 }}
                    className="fixed top-0 left-0 h-screen w-64 bg-[#717744] text-white p-6"
                >
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold">Prep System</h1>
                    </div>
                    <nav className="space-y-2">
                        {navigationItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${pathname === item.path
                                            ? 'bg-[#373d20] text-white'
                                            : 'hover:bg-[#abac7f]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </motion.aside>

                {/* Main Content */}
                <main className="pl-64">
                    <header className="bg-[#373d20] text-white p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                {navigationItems.find(item => item.path === pathname)?.name || 'Dashboard'}
                            </h2>
                        </div>
                    </header>
                    <div className="p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}