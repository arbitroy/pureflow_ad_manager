'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageContainer from '@/components/PageContainer';
import { Campaign, CampaignStatus, PlatformName, GeoZone } from '@/types/models';
import { MetaAdCreative } from '@/lib/api/meta';

export default function CreateCampaign() {
    const router = useRouter();

    // Form states
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availablePlatforms, setAvailablePlatforms] = useState<{ id: string, name: string }[]>([]);
    const [geoZones, setGeoZones] = useState<GeoZone[]>([]);

    // Form data
    const [campaignName, setCampaignName] = useState('');
    const [campaignDescription, setCampaignDescription] = useState('');
    const [objective, setObjective] = useState('CONSIDERATION');
    const [budget, setBudget] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedGeoZones, setSelectedGeoZones] = useState<string[]>([]);

    // Ad creative data
    const [adTitle, setAdTitle] = useState('');
    const [adBody, setAdBody] = useState('');
    const [adImage, setAdImage] = useState<File | null>(null);
    const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
    const [adLinkUrl, setAdLinkUrl] = useState('');
    const [callToActionType, setCallToActionType] = useState('LEARN_MORE');

    // Media upload refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch available platforms and geo zones on component mount
    useEffect(() => {
        fetchPlatforms();
        fetchGeoZones();
    }, []);

    // Handle image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAdImage(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setAdImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Fetch connected platforms
    const fetchPlatforms = async () => {
        try {
            const response = await fetch('/api/platforms');
            if (!response.ok) {
                throw new Error('Failed to fetch platforms');
            }

            const data = await response.json();
            if (data.success) {
                setAvailablePlatforms(data.data.map((p: any) => ({
                    id: p.id,
                    name: p.name === 'FACEBOOK' ? 'Facebook' : 'Instagram'
                })));
            }
        } catch (error) {
            console.error('Error fetching platforms:', error);
            setError('Failed to load available platforms');
        }
    };

    // Fetch geo zones
    const fetchGeoZones = async () => {
        try {
            const response = await fetch('/api/geo-zones');
            if (!response.ok) {
                throw new Error('Failed to fetch geo zones');
            }

            const data = await response.json();
            if (data.success) {
                setGeoZones(data.data);
            }
        } catch (error) {
            console.error('Error fetching geo zones:', error);
            setError('Failed to load geo zones');
        }
    };

    // Handle platform selection
    const togglePlatformSelection = (platformId: string) => {
        if (selectedPlatforms.includes(platformId)) {
            setSelectedPlatforms(selectedPlatforms.filter(id => id !== platformId));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platformId]);
        }
    };

    // Handle geo zone selection
    const toggleGeoZoneSelection = (zoneId: string) => {
        if (selectedGeoZones.includes(zoneId)) {
            setSelectedGeoZones(selectedGeoZones.filter(id => id !== zoneId));
        } else {
            setSelectedGeoZones([...selectedGeoZones, zoneId]);
        }
    };

    // Navigate to next step
    const nextStep = () => {
        setStep(step + 1);
    };

    // Navigate to previous step
    const prevStep = () => {
        setStep(step - 1);
    };

    // Submit campaign
    const submitCampaign = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Validate form data
            if (!campaignName) {
                setError('Campaign name is required');
                setIsLoading(false);
                return;
            }

            if (selectedPlatforms.length === 0) {
                setError('Please select at least one platform');
                setIsLoading(false);
                return;
            }

            if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
                setError('Please enter a valid budget amount');
                setIsLoading(false);
                return;
            }

            // Ad creative validation
            if (!adTitle || !adBody) {
                setError('Ad title and body are required');
                setIsLoading(false);
                return;
            }

            if (!adLinkUrl) {
                setError('Call to action link URL is required');
                setIsLoading(false);
                return;
            }

            // Upload image if selected
            let imageUrl = null;
            if (adImage) {
                // Create form data for image upload
                const formData = new FormData();
                formData.append('file', adImage);

                const uploadResponse = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }

                const uploadData = await uploadResponse.json();
                imageUrl = uploadData.imageUrl;
            }

            // Prepare ad creative data
            const adCreative: MetaAdCreative = {
                title: adTitle,
                body: adBody,
                imageUrl: imageUrl || undefined,
                callToAction: {
                    type: callToActionType,
                    value: {
                        link: adLinkUrl
                    }
                }
            };

            // Prepare campaign data
            const campaignData = {
                name: campaignName,
                description: campaignDescription,
                objective,
                status: CampaignStatus.DRAFT, // Start as draft
                budget: parseFloat(budget),
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                endDate: endDate ? new Date(endDate).toISOString() : undefined,
                platformIds: selectedPlatforms,
                geoZoneIds: selectedGeoZones,
                adCreative
            };

            // Submit campaign
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(campaignData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create campaign');
            }

            const data = await response.json();

            // Navigate to the campaign detail page
            router.push(`/campaigns/${data.data.id}`);
        } catch (error) {
            console.error('Error creating campaign:', error);
            setError(error instanceof Error ? error.message : 'Failed to create campaign');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer title="Create New Campaign">
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

            {/* Progress indicator */}
            <div className="mb-8">
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-pure-primary' : 'bg-pure-light-dark'}`}>
                        <span className="text-white">1</span>
                    </div>
                    <div className={`h-1 flex-1 ${step >= 2 ? 'bg-pure-primary' : 'bg-pure-light-dark'}`}></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-pure-primary' : 'bg-pure-light-dark'}`}>
                        <span className="text-white">2</span>
                    </div>
                    <div className={`h-1 flex-1 ${step >= 3 ? 'bg-pure-primary' : 'bg-pure-light-dark'}`}></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-pure-primary' : 'bg-pure-light-dark'}`}>
                        <span className="text-white">3</span>
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                    <span>Campaign Details</span>
                    <span>Targeting Options</span>
                    <span>Ad Creative</span>
                </div>
            </div>

            {/* Step 1: Basic Campaign Info */}
            {step === 1 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card"
                >
                    <h2 className="text-xl font-medium mb-6">Campaign Details</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Campaign Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                placeholder="Enter a name for your campaign"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Campaign Description
                            </label>
                            <textarea
                                value={campaignDescription}
                                onChange={(e) => setCampaignDescription(e.target.value)}
                                className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                placeholder="Enter a description for your campaign"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Campaign Objective <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                            >
                                <option value="AWARENESS">Brand Awareness</option>
                                <option value="CONSIDERATION">Traffic & Engagement</option>
                                <option value="CONVERSION">Conversions & Sales</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Budget (USD) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">$</span>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    className="w-full bg-pure-dark text-white pl-8 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    placeholder="Enter campaign budget"
                                    min="1"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-8">
                        <button
                            type="button"
                            onClick={nextStep}
                            className="btn-primary"
                            disabled={!campaignName || !budget}
                        >
                            Next: Targeting Options
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 2: Platform and Geo-targeting */}
            {step === 2 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card"
                >
                    <h2 className="text-xl font-medium mb-6">Targeting Options</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-medium mb-4">Select Platforms <span className="text-red-500">*</span></h3>

                            {availablePlatforms.length === 0 ? (
                                <div className="bg-yellow-900 bg-opacity-50 p-4 rounded-lg">
                                    <p className="text-yellow-200">
                                        No platforms connected. Please connect a platform in
                                        <a href="/settings/platforms" className="text-pure-primary ml-1">Platform Settings</a>.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availablePlatforms.map((platform) => (
                                        <div
                                            key={platform.id}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedPlatforms.includes(platform.id)
                                                    ? 'border-pure-primary bg-pure-primary bg-opacity-10'
                                                    : 'border-pure-light-dark bg-pure-dark'
                                                }`}
                                            onClick={() => togglePlatformSelection(platform.id)}
                                        >
                                            <div className="flex items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${platform.name === 'Facebook' ? 'bg-blue-600' : 'bg-gradient-to-tr from-purple-600 to-pink-500'
                                                    }`}>
                                                    {platform.name === 'Facebook' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                                                            <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                                                            <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{platform.name}</h4>
                                                    <p className="text-sm text-gray-400">
                                                        {selectedPlatforms.includes(platform.id) ? 'Selected' : 'Click to select'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-4">Geographic Targeting</h3>

                            {geoZones.length === 0 ? (
                                <div className="bg-pure-dark p-4 rounded-lg">
                                    <p className="text-gray-400">
                                        No geo-zones available. You can create geo-zones in the
                                        <a href="/geo-fencing" className="text-pure-primary ml-1">Geo-Fencing</a> section.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {geoZones.map((zone) => (
                                        <div
                                            key={zone.id}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedGeoZones.includes(zone.id)
                                                    ? 'border-pure-primary bg-pure-primary bg-opacity-10'
                                                    : 'border-pure-light-dark bg-pure-dark'
                                                }`}
                                            onClick={() => toggleGeoZoneSelection(zone.id)}
                                        >
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-pure-secondary flex items-center justify-center mr-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
                                                        <circle cx="12" cy="9" r="2.5"></circle>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{zone.name}</h4>
                                                    <p className="text-sm text-gray-400">
                                                        {zone.type === 'CIRCLE'
                                                            ? `${zone.radiusKm} km radius`
                                                            : `${zone.points?.length || 0} points polygon`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                        >
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={nextStep}
                            className="btn-primary"
                            disabled={selectedPlatforms.length === 0}
                        >
                            Next: Ad Creative
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 3: Ad Creative */}
            {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="card"
                    >
                        <h2 className="text-xl font-medium mb-6">Ad Creative</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Ad Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={adTitle}
                                    onChange={(e) => setAdTitle(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    placeholder="Enter ad title"
                                    maxLength={40}
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {adTitle.length}/40 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Ad Text <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={adBody}
                                    onChange={(e) => setAdBody(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    placeholder="Enter ad text"
                                    rows={4}
                                    maxLength={125}
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {adBody.length}/125 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Ad Image
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                                    >
                                        Choose Image
                                    </button>
                                    <span className="ml-3 text-sm text-gray-400">
                                        {adImage ? adImage.name : 'No image selected'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Recommended size: 1200 x 628 pixels
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Call To Action Type
                                </label>
                                <select
                                    value={callToActionType}
                                    onChange={(e) => setCallToActionType(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                >
                                    <option value="LEARN_MORE">Learn More</option>
                                    <option value="SHOP_NOW">Shop Now</option>
                                    <option value="SIGN_UP">Sign Up</option>
                                    <option value="BOOK_TRAVEL">Book Now</option>
                                    <option value="DOWNLOAD">Download</option>
                                    <option value="GET_OFFER">Get Offer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Destination URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={adLinkUrl}
                                    onChange={(e) => setAdLinkUrl(e.target.value)}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    placeholder="https://example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={submitCampaign}
                                className="btn-primary"
                                disabled={isLoading || !adTitle || !adBody || !adLinkUrl}
                            >
                                {isLoading ? 'Creating...' : 'Create Campaign'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Ad Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="card"
                    >
                        <h2 className="text-xl font-medium mb-6">Ad Preview</h2>

                        <div className="bg-white rounded-lg overflow-hidden">
                            {/* Facebook Ad Preview */}
                            <div className="p-4">
                                <div className="flex items-center mb-2">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                                        <span className="text-white font-bold">F</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Your Page Name</p>
                                        <p className="text-xs text-gray-500">Sponsored · {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <p className="text-gray-800 mb-2">{adBody || 'Your ad text will appear here'}</p>

                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    {adImagePreview ? (
                                        <img
                                            src={adImagePreview}
                                            alt="Ad Preview"
                                            className="w-full h-52 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-52 bg-gray-200 flex items-center justify-center">
                                            <p className="text-gray-400">Image Preview</p>
                                        </div>
                                    )}

                                    <div className="p-3 bg-gray-50">
                                        <p className="text-xs text-gray-500 uppercase">YourDomain.com</p>
                                        <p className="font-medium text-gray-800">{adTitle || 'Your ad title will appear here'}</p>
                                        <button className="mt-2 bg-blue-600 text-white text-sm px-4 py-1 rounded">
                                            {callToActionType.replace('_', ' ')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Platform Display */}
                            <div className="bg-gray-100 p-3 flex justify-center space-x-3">
                                {selectedPlatforms.some(id =>
                                    availablePlatforms.find(p => p.id === id)?.name === 'Facebook'
                                ) && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#4267B2">
                                                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                                            </svg>
                                            <span className="ml-1">Facebook</span>
                                        </div>
                                    )}

                                {selectedPlatforms.some(id =>
                                    availablePlatforms.find(p => p.id === id)?.name === 'Instagram'
                                ) && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#E1306C">
                                                <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                                            </svg>
                                            <span className="ml-1">Instagram</span>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* Geo-targeting Display */}
                        {selectedGeoZones.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-medium mb-3">Geo-Targeting</h3>
                                <div className="bg-pure-dark p-4 rounded-lg">
                                    <p className="text-white mb-2">This ad will be shown to users in:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedGeoZones.map(zoneId => {
                                            const zone = geoZones.find(z => z.id === zoneId);
                                            return zone ? (
                                                <span
                                                    key={zone.id}
                                                    className="px-2 py-1 bg-pure-primary bg-opacity-20 rounded-full text-sm text-white"
                                                >
                                                    {zone.name}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </PageContainer>
    );
}