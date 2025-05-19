'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function MetaAuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('Processing authentication...');

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // Extract params from URL
                const code = searchParams.get('code');
                const state = searchParams.get('state'); // 'facebook' or 'instagram'
                const error = searchParams.get('error');
                const errorReason = searchParams.get('error_reason');
                const errorDescription = searchParams.get('error_description');

                // Handle authentication errors
                if (error) {
                    console.error('Authentication error:', error, errorReason, errorDescription);
                    setStatus('error');
                    setMessage(`Authentication failed: ${errorDescription || 'Unknown error'}`);
                    return;
                }

                // Handle missing code or state
                if (!code || !state) {
                    setStatus('error');
                    setMessage('Missing required authentication parameters');
                    return;
                }

                // Handle authentication with backend
                const response = await fetch('/api/platforms/auth/callback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        state,
                        redirectUri: `${window.location.origin}/settings/platforms/auth/callback`,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Authentication failed');
                }

                const data = await response.json();

                // Update status based on response
                if (data.success) {
                    setStatus('success');
                    setMessage(`Successfully connected ${state === 'facebook' ? 'Facebook' : 'Instagram'}`);

                    // Redirect back to platforms page after a delay
                    setTimeout(() => {
                        router.push('/settings/platforms');
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Authentication failed');
                }
            } catch (err) {
                console.error('Error handling auth callback:', err);
                setStatus('error');
                setMessage(err instanceof Error ? err.message : 'Authentication failed');
            }
        };

        handleAuth();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-pure-dark p-4">
            <motion.div
                className="w-full max-w-md text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-6">
                    {status === 'loading' && (
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pure-primary mx-auto"></div>
                    )}

                    {status === 'success' && (
                        <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    {status === 'loading' && 'Connecting Platform'}
                    {status === 'success' && 'Connection Successful'}
                    {status === 'error' && 'Connection Failed'}
                </h2>

                <p className="text-gray-400 mb-6">{message}</p>

                <div>
                    {status === 'error' && (
                        <button
                            onClick={() => router.push('/settings/platforms')}
                            className="btn-primary"
                        >
                            Back to Platforms
                        </button>
                    )}

                    {status === 'success' && (
                        <p className="text-gray-400">Redirecting back to platforms page...</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}