'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/lib/constants/navigation';

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="flex space-x-4">
            {navigationItems.map((item) => (
                <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded transition duration-200 ${pathname === item.path
                            ? 'bg-[#373d20] text-white'
                            : 'text-gray-700 hover:bg-[#abac7f] hover:text-white'
                        }`}
                >
                    <item.icon />
                    <span>{item.name}</span>
                </Link>
            ))}
        </nav>
    );
}