'use client'
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/' },
        { name: 'Campaigns', path: '/campaigns' },
        { name: 'Geo-Fencing', path: '/geo-fencing' },
        { name: 'Analytics', path: '/analytics' },
    ];

    // Get first letter of user's name for avatar
    const avatarText = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    const handleLogout = async () => {
        await logout();
        // Redirect is handled in the logout function
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Add mounted state to protect against hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        // Add event listener when dropdown is open
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Clean up event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);
    
    // Simple version for server-side rendering to prevent hydration mismatch
    if (!mounted) {
        return (
            <nav className="bg-pure-light-dark py-4">
                <div className="pure-container">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="h-10 w-10 rounded-full bg-pure-primary flex items-center justify-center">
                                <span className="text-white font-bold">PF</span>
                            </div>
                            <span className="text-white font-bold text-xl">PURE FLOW</span>
                        </div>

                        <div className="hidden md:flex space-x-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className="relative"
                                >
                                    <span className="text-white hover:text-pure-secondary transition-colors">
                                        {item.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-pure-light-dark py-4">
            <div className="pure-container">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {/* Logo placeholder - create actual logo later */}
                        <div className="h-10 w-10 rounded-full bg-pure-primary flex items-center justify-center">
                            <span className="text-white font-bold">PF</span>
                        </div>
                        <span className="text-white font-bold text-xl">PURE FLOW</span>
                    </div>

                    <div className="hidden md:flex space-x-8">
                        {navItems.map((item) => {
                            const isActive = pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className="relative"
                                >
                                    <span className={`${isActive ? 'text-pure-primary' : 'text-white'} hover:text-pure-secondary transition-colors`}>
                                        {item.name}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-pure-primary"
                                            initial={false}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {isAuthenticated && (
                        <div className="flex items-center space-x-4">
                            <button className="text-white hover:text-pure-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={toggleDropdown}
                                    className="h-8 w-8 rounded-full bg-pure-secondary flex items-center justify-center" 
                                    aria-label="User menu"
                                    aria-expanded={dropdownOpen}
                                    aria-haspopup="true"
                                >
                                    <span className="text-white font-bold">{avatarText}</span>
                                </button>
                                {dropdownOpen && (
                                    <motion.div 
                                        className="absolute right-0 mt-2 w-48 bg-pure-light-dark rounded-md shadow-lg overflow-hidden z-20"
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="py-2">
                                            <div className="px-4 py-3 border-b border-pure-dark">
                                                <p className="text-sm text-white">Signed in as</p>
                                                <p className="text-sm font-medium text-pure-primary truncate">{user?.email}</p>
                                            </div>
                                            <Link href="/profile" className="block px-4 py-2 text-sm text-white hover:bg-pure-dark">
                                                Your Profile
                                            </Link>
                                            <Link href="/settings" className="block px-4 py-2 text-sm text-white hover:bg-pure-dark">
                                                Settings
                                            </Link>
                                            <Link href="/settings/platforms" className="block px-4 py-2 text-sm text-white hover:bg-pure-dark">
                                                Connected Platforms
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-pure-dark"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;