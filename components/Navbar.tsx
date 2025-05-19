'use client'
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const Navbar = () => {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/' },
        { name: 'Campaigns', path: '/campaigns' },
        { name: 'Geo-Fencing', path: '/geo-fencing' },
        { name: 'Analytics', path: '/analytics' },
    ];

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

                    <div className="flex items-center space-x-4">
                        <button className="text-white hover:text-pure-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <div className="relative group">
                            <button className="h-8 w-8 rounded-full bg-pure-secondary flex items-center justify-center">
                                <span className="text-white font-bold">U</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-pure-light-dark rounded-md shadow-lg overflow-hidden z-20 opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out origin-top-right">
                                <div className="py-2">
                                    <div className="px-4 py-3 border-b border-pure-dark">
                                        <p className="text-sm text-white">Signed in as</p>
                                        <p className="text-sm font-medium text-pure-primary truncate">user@pureflow.com</p>
                                    </div>
                                    <a href="#" className="block px-4 py-2 text-sm text-white hover:bg-pure-dark">Your Profile</a>
                                    <a href="#" className="block px-4 py-2 text-sm text-white hover:bg-pure-dark">Settings</a>
                                    <button
                                        onClick={() => logout()}
                                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-pure-dark"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;