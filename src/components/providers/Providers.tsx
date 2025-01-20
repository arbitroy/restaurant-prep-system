'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RestaurantProvider } from '@/contexts/RestaurantContext';
import { ToastProvider } from '@/components/ui/Toast/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <RestaurantProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </RestaurantProvider>
        </QueryClientProvider>
    );
}