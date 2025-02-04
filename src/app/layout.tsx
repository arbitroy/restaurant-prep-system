import './globals.css';
import { getDefaultMetadata } from '@/lib/config/metadata';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Providers } from '@/components/providers/Providers';

export const metadata = getDefaultMetadata();

// Structured Data for Organization
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
                    <div className="flex h-screen">
                        <Sidebar />
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <Header />
                            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fefefe]">
                                <div className="container mx-auto px-6 py-8">
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