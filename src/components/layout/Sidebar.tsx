'use client';

import { motion } from 'framer-motion';
import { navigationItems } from '@/lib/constants/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Select } from '@/components/ui/Select';
import { useQuery } from '@tanstack/react-query';
import { useRestaurant } from '@/contexts/RestaurantContext';

interface SidebarProps {
    onMobileItemClick?: () => void; // For closing mobile menu when item is clicked
}

export function Sidebar({ onMobileItemClick }: SidebarProps) {
    const pathname = usePathname();
    const { restaurantId, setRestaurantId } = useRestaurant();

    // Fetch restaurants
    const { data: restaurants } = useQuery({
        queryKey: ['restaurants'],
        queryFn: async () => {
            const response = await fetch('/api/restaurants');
            if (!response.ok) throw new Error('Failed to fetch restaurants');
            return response.json();
        }
    });

    return (
        <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="h-full flex flex-col bg-[#717744] text-[#fefefe] py-6 px-4"
        >
            {/* Restaurant Selector */}
            <div className="mb-8 px-2">
                <Select
                    value={restaurantId.toString()}
                    onChange={(e) => setRestaurantId(Number(e.target.value))}
                    options={restaurants?.data?.map((r: { id: number; name: string }) => ({
                        value: r.id.toString(),
                        label: r.name
                    })) || []}
                    className="w-full bg-[#373d20] border-[#abac7f] text-white"
                />
            </div>

            {/* Navigation Links */}
            <nav className="flex-1">
                <ul className="space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        
                        return (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    onClick={onMobileItemClick} // Close mobile menu when clicked
                                    className={`
                                        flex items-center space-x-2 px-4 py-2.5 rounded 
                                        transition duration-200
                                        ${isActive 
                                            ? 'bg-[#373d20] text-white' 
                                            : 'hover:bg-[#abac7f] hover:text-white'
                                        }
                                    `}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Optional: Footer content */}
            <div className="mt-auto pt-6 px-4 text-center">
                <p className="text-xs text-[#abac7f]">
                    Restaurant Prep System
                </p>
            </div>
        </motion.aside>
    );
}