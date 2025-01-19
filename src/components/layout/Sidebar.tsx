import { motion } from 'framer-motion';
import { navigationItems } from '@/lib/constants/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();

    return (
        <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="bg-[#717744] text-[#fefefe] w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform md:relative md:translate-x-0 transition duration-200 ease-in-out"
        >
            <nav>
                <ul className="space-y-2">
                    {navigationItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                href={item.path}
                                className={`flex items-center space-x-2 px-4 py-2.5 rounded transition duration-200 ${pathname === item.path
                                        ? 'bg-[#373d20] text-white'
                                        : 'hover:bg-[#abac7f] hover:text-white'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </motion.aside>
    )
}