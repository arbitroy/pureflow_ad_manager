'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const { isAuthenticated, loading } = useAuth();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render anything on the server to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    // If the user is on the login page, just show the login page
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // If the auth is still loading, show a loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pure-dark">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-16 w-16 bg-pure-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">PF</span>
                    </div>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pure-secondary"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    // If the user is not authenticated, show a redirect message
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pure-dark">
                <div className="flex flex-col items-center space-y-4 p-8 bg-pure-light-dark rounded-lg shadow-lg max-w-md">
                    <div className="h-16 w-16 bg-pure-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">PF</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Authentication Required</h2>
                    <p className="text-gray-300 text-center">
                        You need to be logged in to access this page. Please log in to continue.
                    </p>
                    <Link
                        href="/login"
                        className="mt-4 w-full bg-pure-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded-lg text-center"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    // If the user is authenticated, show the content
    return <>{children}</>;
}