'use client';

import { useState, useEffect } from 'react';
import { useCampaignForm } from '@/contexts/CampaignFormContext';
import FormNavigation from '../FormNavigation';
import { PlatformName } from '@/types/models';
import { motion } from 'framer-motion';

const PlatformsStep: React.FC = () => {
    const { formState, setField, errors } = useCampaignForm();
    const [availablePlatforms, setAvailablePlatforms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch platforms on component mount
    useEffect(() => {
        fetchPlatforms();
    }, []);

    const fetchPlatforms = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/platforms');

            if (!response.ok) {
                throw new Error('Failed to fetch platforms');
            }

            const data = await response.json();

            if (data.success) {
                setAvailablePlatforms(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch platforms');
            }
        } catch (err) {
            console.error('Error fetching platforms:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePlatform = (platform: any) => {
        // Check if platform is already selected
        const isSelected = formState.platforms.some(p => p.id === platform.id);

        if (isSelected) {
            // Remove platform if already selected
            const updatedPlatforms = formState.platforms.filter(p => p.id !== platform.id);
            setField('platforms', updatedPlatforms);
        } else {
            // Add platform to selected list
            setField('platforms', [...formState.platforms, platform]);
        }
    };

    // Check if a platform is selected
    const isPlatformSelected = (platformId: string) => {
        return formState.platforms.some(p => p.id === platformId);
    };

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-6">Select Platforms</h2>

            <div className="space-y-6">
                <p className="text-gray-400">
                    Choose the social media platforms where you want to run your campaign.
                    You'll need to connect your accounts for each platform.
                </p>

                {errors.platforms && (
                    <div className="p-3 bg-red-900 bg-opacity-50 text-red-200 rounded">
                        {errors.platforms}
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-900 bg-opacity-50 text-red-200 rounded">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pure-primary"></div>
                    </div>
                ) : availablePlatforms.length === 0 ? (
                    <div className="bg-yellow-900 bg-opacity-50 p-4 rounded-lg">
                        <p className="text-yellow-200 mb-2">
                            No platforms connected. Please connect a platform first.
                        </p>
                        <a href="/settings/platforms" className="text-pure-primary hover:text-pure-secondary underline">
                            Go to Platform Settings
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availablePlatforms.map(platform => (
                            <PlatformCard
                                key={platform.id}
                                platform={platform}
                                isSelected={isPlatformSelected(platform.id)}
                                onToggle={() => handleTogglePlatform(platform)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <FormNavigation />
        </div>
    );
};

interface PlatformCardProps {
    platform: any;
    isSelected: boolean;
    onToggle: () => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
    platform,
    isSelected,
    onToggle
}) => {
    // Format platform name for display
    const displayName = platform.name === 'FACEBOOK' ? 'Facebook' : 
                         platform.name === 'INSTAGRAM' ? 'Instagram' : 
                         platform.name;

    // Get icon based on platform name
    const getIcon = () => {
        if (platform.name === 'FACEBOOK') {
            return (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
            );
        } 
        if (platform.name === 'INSTAGRAM') {
            return (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.04 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.04.058 2.67 0 2.986-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.04 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.058-4.04-.058zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.466a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.669a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
                </svg>
            );
        }
        // Generic icon for other platforms
        return (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
        );
    };

    return (
        <motion.div
            className={`border rounded-lg p-4 cursor-pointer ${isSelected ? 'border-pure-primary bg-pure-primary bg-opacity-10' : 'border-pure-dark'
                }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggle}
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-pure-primary text-white' : 'bg-pure-dark text-gray-400'
                        }`}>
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="font-medium text-white">{displayName}</h3>
                        <p className="text-sm text-gray-400">
                            {platform.accountId}
                        </p>
                    </div>
                </div>

                <div className="flex items-center">
                    {isSelected ? (
                        <span className="px-2 py-1 bg-pure-primary text-white text-xs rounded-full">Selected</span>
                    ) : (
                        <span className="text-pure-primary">+ Add</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PlatformsStep;