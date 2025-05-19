'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/');
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pure-dark p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-pure-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-xl font-bold">PF</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">PURE FLOW</h2>
                    <p className="text-gray-400 mt-2">Login to manage your ad campaigns</p>
                </div>

                <div className="bg-pure-light-dark rounded-lg shadow-xl overflow-hidden">
                    <div className="p-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-900 bg-opacity-50 text-red-200 p-3 rounded-lg mb-4"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                                        Password
                                    </label>
                                    <button type="button" className="text-sm text-pure-primary hover:text-pure-secondary">
                                        Forgot Password?
                                    </button>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="flex items-center mb-6">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="h-4 w-4 text-pure-primary focus:ring-pure-primary border-gray-600 rounded bg-pure-dark"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-400">
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-pure-primary hover:bg-opacity-90 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pure-primary transition-colors"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Don't have an account? Contact your administrator.
                </p>
            </motion.div>
        </div>
    );
}