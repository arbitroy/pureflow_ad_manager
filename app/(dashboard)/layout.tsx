'use client';

import Navbar from '@/components/Navbar';

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex flex-col bg-pure-dark">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
}