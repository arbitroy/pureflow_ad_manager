'use client';

import Navbar from '@/components/Navbar';
import { MapsProvider } from '@/contexts/MapsContext'; // Import the provider

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex flex-col bg-pure-dark">
            <Navbar />
            <MapsProvider> {/* Add Maps Provider here */}
                <main className="flex-grow">
                    {children}
                </main>
            </MapsProvider>
        </div>
    );
}