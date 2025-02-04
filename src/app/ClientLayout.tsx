'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen">
            {/* Mobile Menu Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#373d20] px-4 py-3 flex items-center">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-white p-2 hover:bg-[#717744] rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <h1 className="ml-4 text-white text-lg font-semibold">Restaurant Prep</h1>
            </div>

            {/* Sidebar wrapper with mobile handling */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-[#717744] transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onMobileItemClick={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="hidden lg:block">
                    <Header />
                </div>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fefefe]">
                    <div className="container mx-auto px-4 lg:px-6 py-8 mt-14 lg:mt-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}