import './globals.css';
import { getDefaultMetadata } from '@/lib/config/metadata';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Providers } from '@/components/providers/Providers';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export const metadata = getDefaultMetadata();

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Restaurant Prep System',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <html lang="en">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            </head>
            <body className="bg-[#fefefe]">
                <Providers>
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

                    <div className="flex h-screen">
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
                </Providers>
            </body>
        </html>
    );
}