'use client';

import { motion } from 'framer-motion';
import { SITE_CONFIG } from '@/lib/constants/site';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/Select';

export function Header() {
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
                    <Select
                        value={restaurantId.toString()}
                        onChange={(e) => setRestaurantId(Number(e.target.value))}
                        options={restaurants?.data?.map((r: any) => ({
                            value: r.id.toString(),
                            label: r.name
                        })) || []}
                        className="w-48 bg-[#717744] border-[#abac7f] text-white"
                    />
                </div>
            </div>
        </header>
    );
}