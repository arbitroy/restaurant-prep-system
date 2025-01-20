import {
    LayoutDashboard,
    ClipboardList,
    BarChart2,
    FileSpreadsheet,
    Settings,
    Store
} from 'lucide-react';

export const navigationItems = [
    {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard
    },
    {
        name: 'Restaurants',
        path: '/restaurants',
        icon: Store
    },
    {
        name: 'Items',
        path: '/items',
        icon: ClipboardList
    },
    {
        name: 'Sales',
        path: '/sales',
        icon: BarChart2
    },
    {
        name: 'Prep',
        path: '/prep',
        icon: FileSpreadsheet
    },
    {
        name: 'Reports',
        path: '/reports',
        icon: Settings
    }
];