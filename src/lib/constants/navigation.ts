import {
    LayoutDashboard,
    ClipboardList,
    BarChart2,
    FileSpreadsheet,
    Settings
} from 'lucide-react';

export const navigationItems = [
    {
        name: 'Dashboard',
        path: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
        name: 'Items',
        path: '/items',
        icon: <ClipboardList className="w-5 h-5" />
    },
    {
        name: 'Sales',
        path: '/sales',
        icon: <BarChart2 className="w-5 h-5" />
    },
    {
        name: 'Prep',
        path: '/prep',
        icon: <FileSpreadsheet className="w-5 h-5" />
    },
    {
        name: 'Reports',
        path: '/reports',
        icon: <Settings className="w-5 h-5" />
    }
];