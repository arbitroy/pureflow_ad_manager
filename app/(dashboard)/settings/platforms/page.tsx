'use client';

import PageContainer from '@/components/PageContainer';
import FacebookSDK from '@/components/auth/FacebookSDK';
import useFacebookLogin from '@/hooks/useFacebookLogin';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Platform, PlatformName } from '@/types/models';

export default function PlatformsSettings() {
    const { user, isAuthenticated } = useAuth();
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);

    const {
        isLoading: fbLoading,
        error: fbError,
        login: fbLogin,
        checkLoginStatus
    } = useFacebookLogin();

    useEffect(() => {
        if (isAuthenticated) {
            fetchPlatforms();
        }
    }, [isAuthenticated]);

    const fetchPlatforms = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/platforms');

            if (!response.ok) {
                throw new Error('Failed to fetch platforms');
            }

            const data = await response.json();

            if (data.success) {
                setPlatforms(data.data);
            } else {
                setError(data.message || 'An error occurred while fetching platforms');
            }
        } catch (err) {
            console.error('Error fetching platforms:', err);
            setError('Failed to load connected platforms');
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookConnect = async () => {
        try {
            setError(null);
            
            if (!sdkLoaded) {
                setError('Facebook SDK is still loading. Please wait a moment and try again.');
                return;
            }

            // Attempt Facebook login
            const result = await fbLogin();
            
            if (result) {
                // Send the access token to our backend to store the platform connection
                const response = await fetch('/api/platforms/facebook/connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accessToken: result.accessToken,
                        userInfo: result.user,
                        platform: 'FACEBOOK'
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setSuccessMessage('Facebook connected successfully!');
                        fetchPlatforms(); // Refresh the platforms list
                        
                        // Clear success message after 3 seconds
                        setTimeout(() => {
                            setSuccessMessage(null);
                        }, 3000);
                    } else {
                        throw new Error(data.message || 'Failed to connect Facebook');
                    }
                } else {
                    throw new Error('Failed to save Facebook connection');
                }
            }
        } catch (err) {
            console.error('Error connecting Facebook:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect Facebook');
        }
    };

    const handleInstagramConnect = async () => {
        try {
            setError(null);
            
            if (!sdkLoaded) {
                setError('Facebook SDK is still loading. Please wait a moment and try again.');
                return;
            }

            // For Instagram, we also use Facebook login with Instagram-specific scopes
            const result = await fbLogin();
            
            if (result) {
                // Send the access token to our backend for Instagram connection
                const response = await fetch('/api/platforms/instagram/connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accessToken: result.accessToken,
                        userInfo: result.user,
                        platform: 'INSTAGRAM'
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setSuccessMessage('Instagram connected successfully!');
                        fetchPlatforms(); // Refresh the platforms list
                        
                        // Clear success message after 3 seconds
                        setTimeout(() => {
                            setSuccessMessage(null);
                        }, 3000);
                    } else {
                        throw new Error(data.message || 'Failed to connect Instagram');
                    }
                } else {
                    throw new Error('Failed to save Instagram connection');
                }
            }
        } catch (err) {
            console.error('Error connecting Instagram:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect Instagram');
        }
    };

    const disconnectPlatform = async (platformId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/platforms/${platformId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to disconnect platform');
            }

            const data = await response.json();

            if (data.success) {
                setPlatforms(platforms.filter(p => p.id !== platformId));
                setSuccessMessage('Platform disconnected successfully');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            } else {
                setError(data.message || 'An error occurred while disconnecting platform');
            }
        } catch (err) {
            console.error('Error disconnecting platform:', err);
            setError('Failed to disconnect platform');
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async (platformId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/platforms/${platformId}/refresh`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            if (data.success) {
                // Update the platform in the state
                setPlatforms(platforms.map(p => p.id === platformId ? data.data : p));
                setSuccessMessage('Token refreshed successfully');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            } else {
                setError(data.message || 'An error occurred while refreshing token');
            }
        } catch (err) {
            console.error('Error refreshing token:', err);
            setError('Failed to refresh token');
        } finally {
            setLoading(false);
        }
    };

    const getPlatformStatusBadge = (platform: Platform) => {
        if (!platform.tokenExpiry) {
            return <span className="px-2 py-1 text-xs rounded-full bg-yellow-900 text-yellow-200">Unknown</span>;
        }

        const now = new Date();
        const expiry = new Date(platform.tokenExpiry);

        if (expiry < now) {
            return <span className="px-2 py-1 text-xs rounded-full bg-red-900 text-red-200">Expired</span>;
        }

        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 5) {
            return <span className="px-2 py-1 text-xs rounded-full bg-yellow-900 text-yellow-200">Expires Soon</span>;
        }

        return <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-200">Connected</span>;
    };

    return (
        <>
            {/* Initialize Facebook SDK */}
            <FacebookSDK onInit={() => setSdkLoaded(true)} />
            
            <PageContainer title="Connected Platforms">
                {/* SDK Loading Status */}
                {!sdkLoaded && (
                    <div className="bg-blue-900 bg-opacity-50 text-blue-200 p-4 rounded-lg mb-6">
                        <p>Loading Facebook SDK...</p>
                    </div>
                )}

                {error && (
                    <motion.div
                        className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p>{error}</p>
                        <button
                            className="text-red-200 underline mt-2"
                            onClick={() => setError(null)}
                        >
                            Dismiss
                        </button>
                    </motion.div>
                )}

                {fbError && (
                    <motion.div
                        className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p>Facebook Error: {fbError}</p>
                    </motion.div>
                )}

                {successMessage && (
                    <motion.div
                        className="bg-green-900 bg-opacity-50 text-green-200 p-4 rounded-lg mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p>{successMessage}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Facebook Connection Card */}
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Facebook</h3>
                                    <p className="text-gray-400 text-sm">Connect to publish ads on Facebook</p>
                                </div>
                            </div>

                            {/* Connection Status */}
                            {platforms.some(p => p.name === PlatformName.FACEBOOK) ? (
                                <div className="text-right">
                                    {getPlatformStatusBadge(platforms.find(p => p.name === PlatformName.FACEBOOK)!)}
                                </div>
                            ) : null}
                        </div>

                        {/* Connection Details */}
                        {platforms.some(p => p.name === PlatformName.FACEBOOK) ? (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Account ID</p>
                                    <p className="text-white font-mono text-sm">{platforms.find(p => p.name === PlatformName.FACEBOOK)?.accountId}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Connected On</p>
                                    <p className="text-white">
                                        {new Date(platforms.find(p => p.name === PlatformName.FACEBOOK)?.createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Token Expires</p>
                                    <p className="text-white">
                                        {platforms.find(p => p.name === PlatformName.FACEBOOK)?.tokenExpiry
                                            ? new Date(platforms.find(p => p.name === PlatformName.FACEBOOK)?.tokenExpiry!).toLocaleString()
                                            : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {/* Connection Actions */}
                        <div className="flex justify-end space-x-3">
                            {platforms.some(p => p.name === PlatformName.FACEBOOK) ? (
                                <>
                                    <button
                                        onClick={() => refreshToken(platforms.find(p => p.name === PlatformName.FACEBOOK)!.id)}
                                        className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                                        disabled={loading || fbLoading}
                                    >
                                        Refresh Token
                                    </button>
                                    <button
                                        onClick={() => disconnectPlatform(platforms.find(p => p.name === PlatformName.FACEBOOK)!.id)}
                                        className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-opacity-80"
                                        disabled={loading || fbLoading}
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleFacebookConnect}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50"
                                    disabled={loading || fbLoading || !sdkLoaded}
                                >
                                    {fbLoading ? 'Connecting...' : 'Connect Facebook'}
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Instagram Connection Card */}
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Instagram</h3>
                                    <p className="text-gray-400 text-sm">Connect to publish ads on Instagram</p>
                                </div>
                            </div>

                            {/* Connection Status */}
                            {platforms.some(p => p.name === PlatformName.INSTAGRAM) ? (
                                <div className="text-right">
                                    {getPlatformStatusBadge(platforms.find(p => p.name === PlatformName.INSTAGRAM)!)}
                                </div>
                            ) : null}
                        </div>

                        {/* Connection Details */}
                        {platforms.some(p => p.name === PlatformName.INSTAGRAM) ? (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Account ID</p>
                                    <p className="text-white font-mono text-sm">{platforms.find(p => p.name === PlatformName.INSTAGRAM)?.accountId}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Connected On</p>
                                    <p className="text-white">
                                        {new Date(platforms.find(p => p.name === PlatformName.INSTAGRAM)?.createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Token Expires</p>
                                    <p className="text-white">
                                        {platforms.find(p => p.name === PlatformName.INSTAGRAM)?.tokenExpiry
                                            ? new Date(platforms.find(p => p.name === PlatformName.INSTAGRAM)?.tokenExpiry!).toLocaleString()
                                            : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {/* Connection Actions */}
                        <div className="flex justify-end space-x-3">
                            {platforms.some(p => p.name === PlatformName.INSTAGRAM) ? (
                                <>
                                    <button
                                        onClick={() => refreshToken(platforms.find(p => p.name === PlatformName.INSTAGRAM)!.id)}
                                        className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                                        disabled={loading || fbLoading}
                                    >
                                        Refresh Token
                                    </button>
                                    <button
                                        onClick={() => disconnectPlatform(platforms.find(p => p.name === PlatformName.INSTAGRAM)!.id)}
                                        className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-opacity-80"
                                        disabled={loading || fbLoading}
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleInstagramConnect}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50"
                                    disabled={loading || fbLoading || !sdkLoaded}
                                >
                                    {fbLoading ? 'Connecting...' : 'Connect Instagram'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-medium mb-4">About Platform Connections</h3>
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Connected platforms allow PURE FLOW to publish ad campaigns directly to your social media accounts.
                            You can manage your connected platforms here and disconnect them at any time.
                        </p>

                        <div className="bg-pure-dark p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Facebook Integration</h4>
                            <p className="text-gray-400">
                                Connecting your Facebook account allows PURE FLOW to publish ads to your Facebook Page. You need to have admin
                                access to the Facebook Page and ad account you want to use.
                            </p>
                        </div>

                        <div className="bg-pure-dark p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Instagram Integration</h4>
                            <p className="text-gray-400">
                                Instagram ads are created through your Facebook ad account. You need to have a Facebook Page connected to your
                                Instagram Professional account to run Instagram ads.
                            </p>
                        </div>

                        <div className="bg-yellow-900 bg-opacity-50 p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Access Token Expiration</h4>
                            <p className="text-yellow-200">
                                Access tokens for Meta platforms typically expire after 60 days. You'll need to refresh the token or reconnect
                                the platform before it expires to maintain uninterrupted service.
                            </p>
                        </div>

                        <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Local Development</h4>
                            <p className="text-blue-200">
                                For local development, you can test the Facebook integration using localhost. 
                                Make sure to add your local development URL (e.g., http://localhost:3000) to your Facebook App settings.
                            </p>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}