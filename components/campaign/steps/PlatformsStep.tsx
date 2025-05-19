'use client';

import { useState } from 'react';
import { useCampaignForm } from '@/contexts/CampaignFormContext';
import FormNavigation from '../FormNavigation';
import { PlatformName } from '@/types/models';
import { motion } from 'framer-motion';

const PlatformsStep: React.FC = () => {
    const { formState, setField, errors } = useCampaignForm();
    const [platformsConnected, setPlatformsConnected] = useState({
        [PlatformName.FACEBOOK]: formState.platforms.some(p => p.name === PlatformName.FACEBOOK),
        [PlatformName.INSTAGRAM]: formState.platforms.some(p => p.name === PlatformName.INSTAGRAM)
    });

    const handleTogglePlatform = async (platform: PlatformName) => {
        // Check if platform is already in the list
        const isSelected = formState.platforms.some(p => p.name === platform);

        if (isSelected) {
            // Remove platform if already selected
            const updatedPlatforms = formState.platforms.filter(p => p.name !== platform);
            setField('platforms', updatedPlatforms);
            setPlatformsConnected(prev => ({ ...prev, [platform]: false }));
        } else {
            // If not already selected, simulate connecting to platform
            try {
                // In a real app, this would connect to the platform's API
                // For now, we'll just simulate a successful connection

                // Fake API delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Mock platform connection data
                const newPlatform = {
                    id: `${platform.toLowerCase()}_${Date.now()}`,
                    name: platform,
                    accountId: `acc_${platform.toLowerCase()}_${Date.now()}`,
                    accessToken: `token_${Date.now()}`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Add platform to list
                setField('platforms', [...formState.platforms, newPlatform]);
                setPlatformsConnected(prev => ({ ...prev, [platform]: true }));
            } catch (error) {
                console.error(`Error connecting to ${platform}:`, error);
                // In a real app, show error message to user
            }
        }
    };

    // Validate platforms before proceeding
    const validatePlatforms = async () => {
        return formState.platforms.length > 0;
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PlatformCard
                        name="Facebook"
                        platformKey={PlatformName.FACEBOOK}
                        isConnected={platformsConnected[PlatformName.FACEBOOK]}
                        isSelected={formState.platforms.some(p => p.name === PlatformName.FACEBOOK)}
                        onToggle={() => handleTogglePlatform(PlatformName.FACEBOOK)}
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                        }
                    />

                    <PlatformCard
                        name="Instagram"
                        platformKey={PlatformName.INSTAGRAM}
                        isConnected={platformsConnected[PlatformName.INSTAGRAM]}
                        isSelected={formState.platforms.some(p => p.name === PlatformName.INSTAGRAM)}
                        onToggle={() => handleTogglePlatform(PlatformName.INSTAGRAM)}
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.04 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.04.058 2.67 0 2.986-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.04 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.058-4.04-.058zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.466a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.669a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
                            </svg>
                        }
                    />
                </div>
            </div>

            <FormNavigation onCustomNext={validatePlatforms} />
        </div>
    );
};

interface PlatformCardProps {
    name: string;
    platformKey: PlatformName;
    isConnected: boolean;
    isSelected: boolean;
    onToggle: () => void;
    icon: React.ReactNode;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
    name,
    isConnected,
    isSelected,
    onToggle,
    icon
}) => {
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
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-medium text-white">{name}</h3>
                        <p className="text-sm text-gray-400">
                            {isConnected ? 'Connected' : 'Not connected'}
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