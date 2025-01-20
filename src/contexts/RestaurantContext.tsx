'use client';

import React, { createContext, useContext, useState } from 'react';

interface RestaurantContextType {
    restaurantId: number;
    setRestaurantId: (id: number) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
    const [restaurantId, setRestaurantId] = useState<number>(1);

    return (
        <RestaurantContext.Provider 
            value={{ 
                restaurantId, 
                setRestaurantId 
            }}
        >
            {children}
        </RestaurantContext.Provider>
    );
}

export function useRestaurant() {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
}