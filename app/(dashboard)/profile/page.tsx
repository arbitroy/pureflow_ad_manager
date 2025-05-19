'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import PageContainer from '@/components/PageContainer';

export default function Profile() {
    const { user, lastLogin } = useAuth();
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'long',
            timeStyle: 'short'
        }).format(date);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        // Validation
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPasswordError(data.message || 'Failed to change password');
                return;
            }

            setPasswordSuccess('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsChangingPassword(false);
        } catch (error) {
            setPasswordError('An error occurred. Please try again.');
            console.error('Password change error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <PageContainer title="Profile">
                <div className="card p-8">
                    <p className="text-center text-gray-400">Loading user data...</p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="Your Profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Information Card */}
                <div className="md:col-span-1">
                    <motion.div 
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex flex-col items-center py-6">
                            <div className="h-24 w-24 rounded-full bg-pure-secondary flex items-center justify-center mb-4">
                                <span className="text-white text-4xl font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                            <p className="text-gray-400 mb-4">{user.email}</p>
                            <span className="px-3 py-1 bg-pure-dark rounded-full text-xs text-white">
                                {user.role} ROLE
                            </span>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="card mt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <h3 className="text-lg font-medium mb-4">Account Information</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-400 text-sm">Last Login</p>
                                <p className="text-white">{formatDate(lastLogin)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Account Type</p>
                                <p className="text-white">{user.role}</p>
                            </div>
                            <div className="pt-4">
                                <button 
                                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                                    className="text-pure-primary hover:text-pure-secondary text-sm"
                                >
                                    {isChangingPassword ? 'Cancel' : 'Change Password'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2">
                    {isChangingPassword ? (
                        <motion.div 
                            className="card"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3 className="text-lg font-medium mb-4">Change Password</h3>
                            
                            {passwordError && (
                                <div className="bg-red-900 bg-opacity-50 text-red-200 p-3 rounded-lg mb-4">
                                    {passwordError}
                                </div>
                            )}
                            
                            {passwordSuccess && (
                                <div className="bg-green-900 bg-opacity-50 text-green-200 p-3 rounded-lg mb-4">
                                    {passwordSuccess}
                                </div>
                            )}
                            
                            <form onSubmit={handlePasswordChange}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsChangingPassword(false)}
                                        className="px-4 py-2 bg-pure-dark text-white rounded-lg"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-pure-primary text-white rounded-lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="card"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3 className="text-lg font-medium mb-4">Account Activity</h3>
                            <p className="text-gray-400 mb-4">
                                View your recent account activity and manage your security settings.
                            </p>
                            
                            <div className="bg-pure-dark rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-white mb-2">Last Login</h4>
                                <p className="text-gray-400">
                                    You last logged in on {formatDate(lastLogin)}
                                </p>
                            </div>
                            
                            <div className="bg-pure-dark rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Security Recommendations</h4>
                                <ul className="text-gray-400 space-y-2">
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Regular password updates enhance your account security.
                                    </li>
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Enable two-factor authentication for additional security.
                                    </li>
                                </ul>
                            </div>
                        </motion.div>
                    )}
                    
                    <motion.div 
                        className="card mt-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <h3 className="text-lg font-medium mb-4">Recent Campaigns</h3>
                        <p className="text-gray-400 mb-2">Your most recent campaign activity:</p>
                        
                        <div className="space-y-3">
                            {[1, 2, 3].map((_, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-pure-dark rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Campaign {index + 1}</h4>
                                        <p className="text-sm text-gray-400">{index === 0 ? 'Created' : 'Updated'} {index + 1} day{index === 0 ? '' : 's'} ago</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm ${index % 2 === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {index % 2 === 0 ? 'Active' : 'Draft'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageContainer>
    );
}