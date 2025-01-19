import './globals.css'
import { Navigation } from '@/components/layout/Navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-[#fefefe]">
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
            </body>
        </html>
    )
}