'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageContainer from '@/components/PageContainer';
import { Campaign, CampaignStatus, Platform, PlatformName, GeoZone } from '@/types/models';
import CampaignGeoMap from '@/components/campaign/CampaignGeoMap';

export default function CampaignDetail() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.id;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [platformStatus, setPlatformStatus] = useState<Record<string, string>>({});
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [adCreative, setAdCreative] = useState<any | null>(null);
    const [geoZones, setGeoZones] = useState<GeoZone[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

    // Fetch campaign data
    useEffect(() => {
        fetchCampaignData();

        // Set up refresh interval for active campaigns
        const interval = setInterval(() => {
            if (campaign?.status === CampaignStatus.ACTIVE) {
                fetchCampaignData(false);
            }
        }, 30000); // Refresh every 30 seconds

        setRefreshInterval(interval);

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [campaignId, campaign?.status]);

    const fetchCampaignData = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            // Fetch campaign details
            const response = await fetch(`/api/campaigns/${campaignId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch campaign details');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch campaign details');
            }

            setCampaign(data.data.campaign);
            setPlatformStatus(data.data.platformStatus || {});
            setAnalytics(data.data.analytics || []);
            setAdCreative(data.data.adCreative || null);
            setGeoZones(data.data.geoZones || []);
        } catch (error) {
            console.error('Error fetching campaign data:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch campaign data');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    // Handle campaign publishing
    const handlePublish = async () => {
        try {
            setIsPublishing(true);
            setError(null);

            const response = await fetch(`/api/campaigns/${campaignId}/publish`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to publish campaign');
            }

            const data = await response.json();

            if (data.success) {
                setPublishSuccess(true);

                // Refresh campaign data
                await fetchCampaignData(false);

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setPublishSuccess(false);
                }, 3000);
            } else {
                throw new Error(data.message || 'Failed to publish campaign');
            }
        } catch (error) {
            console.error('Error publishing campaign:', error);
            setError(error instanceof Error ? error.message : 'Failed to publish campaign');
        } finally {
            setIsPublishing(false);
        }
    };

    // Helper function to format date
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Helper function to get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-900 text-green-200';
            case 'SCHEDULED':
                return 'bg-yellow-900 text-yellow-200';
            case 'PAUSED':
                return 'bg-orange-900 text-orange-200';
            case 'COMPLETED':
                return 'bg-blue-900 text-blue-200';
            case 'DRAFT':
            default:
                return 'bg-gray-700 text-gray-300';
        }
    };

    // Helper function to get platform status badge color
    const getPlatformStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-green-900 text-green-200';
            case 'PENDING':
                return 'bg-yellow-900 text-yellow-200';
            case 'FAILED':
                return 'bg-red-900 text-red-200';
            default:
                return 'bg-gray-700 text-gray-300';
        }
    };

    // Helper function to format platform name for display
    const formatPlatformName = (name: string) => {
        return name.charAt(0) + name.slice(1).toLowerCase();
    };

    if (loading) {
        return (
            <PageContainer title="Campaign Details">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pure-primary"></div>
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer title="Campaign Details">
                <div className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg">
                    <p>{error}</p>
                    <button
                        className="text-red-200 underline mt-2"
                        onClick={() => router.push('/campaigns')}
                    >
                        Back to Campaigns
                    </button>
                </div>
            </PageContainer>
        );
    }

    if (!campaign) {
        return (
            <PageContainer title="Campaign Details">
                <div className="bg-pure-light-dark p-4 rounded-lg">
                    <p className="text-white">Campaign not found.</p>
                    <button
                        className="text-pure-primary underline mt-2"
                        onClick={() => router.push('/campaigns')}
                    >
                        Back to Campaigns
                    </button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title={campaign.name}>
            {/* Success message */}
            {publishSuccess && (
                <motion.div
                    className="bg-green-900 bg-opacity-50 text-green-200 p-4 rounded-lg mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p>Campaign published successfully!</p>
                </motion.div>
            )}

            {/* Error message */}
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

            {/* Campaign Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold mr-3">{campaign.name}</h1>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                        </span>
                    </div>
                    {campaign.description && (
                        <p className="text-gray-400 mt-1">{campaign.description}</p>
                    )}
                </div>

                <div className="mt-4 md:mt-0 flex space-x-3">
                    {campaign.status === CampaignStatus.DRAFT && (
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="btn-primary"
                        >
                            {isPublishing ? 'Publishing...' : 'Publish Campaign'}
                        </button>
                    )}

                    <button
                        onClick={() => router.push(`/campaigns/${campaignId}/edit`)}
                        className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                    >
                        Edit Campaign
                    </button>
                </div>
            </div>

            {/* Campaign Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Campaign Details Card */}
                <div className="card">
                    <h2 className="text-lg font-medium mb-4">Campaign Details</h2>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                                {campaign.status}
                            </span>
                        </div>

                        <div>
                            <p className="text-sm text-gray-400">Budget</p>
                            <p className="text-white">${campaign.budget.toFixed(2)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-400">Campaign Objective</p>
                            <p className="text-white">{campaign.objective?.replace('_', ' ') || 'Not specified'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-400">Date Range</p>
                            <p className="text-white">
                                {campaign.startDate ? formatDate(campaign.startDate.toString()) : 'Not set'} -
                                {campaign.endDate ? formatDate(campaign.endDate.toString()) : 'Not set'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-400">Created</p>
                            <p className="text-white">{formatDate(campaign.createdAt.toString())}</p>
                        </div>
                    </div>
                </div>

                {/* Platforms Card */}
                <div className="card">
                    <h2 className="text-lg font-medium mb-4">Connected Platforms</h2>

                    {campaign.platforms && campaign.platforms.length > 0 ? (
                        <div className="space-y-4">
                            {campaign.platforms.map((platform, index) => (
                                <div key={platform.id} className="bg-pure-dark p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${platform.name === PlatformName.FACEBOOK ? 'bg-blue-600' : 'bg-gradient-to-tr from-purple-600 to-pink-500'
                                                }`}>
                                                {platform.name === PlatformName.FACEBOOK ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                                                        <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                                                        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{formatPlatformName(platform.name)}</h4>
                                                <p className="text-xs text-gray-400">{platform.accountId}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getPlatformStatusColor(platformStatus[platform.id] || 'UNKNOWN')}`}>
                                            {platformStatus[platform.id] || 'UNKNOWN'}
                                        </span>
                                    </div>

                                    {/* Show error if platform status is failed */}
                                    {platformStatus[platform.id] === 'FAILED' && (
                                        <div className="mt-2 p-2 bg-red-900 bg-opacity-30 rounded text-xs text-red-200">
                                            Error: Failed to publish to {formatPlatformName(platform.name)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No platforms connected.</p>
                    )}
                </div>

                {/* Ad Creative Card */}
                <div className="card">
                    <h2 className="text-lg font-medium mb-4">Ad Creative</h2>

                    {adCreative ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400">Title</p>
                                <p className="text-white">{adCreative.title}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-400">Body</p>
                                <p className="text-white">{adCreative.body}</p>
                            </div>

                            {adCreative.imageUrl && (
                                <div>
                                    <p className="text-sm text-gray-400">Image</p>
                                    <div className="mt-2">
                                        <img
                                            src={adCreative.imageUrl}
                                            alt="Ad Creative"
                                            className="max-w-full rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-400">Call to Action</p>
                                <p className="text-white">
                                    {adCreative.callToActionType?.replace('_', ' ') || 'Not specified'} -
                                    {adCreative.callToActionLink ? (
                                        <a href={adCreative.callToActionLink} target="_blank" rel="noopener noreferrer" className="text-pure-primary ml-1">
                                            {adCreative.callToActionLink}
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 ml-1">No link specified</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400">No ad creative found.</p>
                    )}
                </div>
            </div>

            {/* Performance Metrics */}
            <h2 className="text-xl font-medium mt-8 mb-4">Performance Metrics</h2>

            {campaign.status === CampaignStatus.ACTIVE && analytics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { title: 'Impressions', value: analytics.reduce((sum, a) => sum + a.impressions, 0).toLocaleString() },
                        { title: 'Clicks', value: analytics.reduce((sum, a) => sum + a.clicks, 0).toLocaleString() },
                        { title: 'Conversions', value: analytics.reduce((sum, a) => sum + a.conversions, 0).toLocaleString() },
                        { title: 'ROI', value: `${analytics.reduce((sum, a) => sum + a.roi, 0) / analytics.length}%` },
                    ].map((metric, index) => (
                        <motion.div
                            key={metric.title}
                            className="card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <h3 className="text-gray-400 font-medium">{metric.title}</h3>
                            <div className="mt-2">
                                <span className="text-2xl font-bold text-white">{metric.value}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : campaign.status === CampaignStatus.ACTIVE ? (
                <div className="card p-6 mb-8">
                    <p className="text-center text-gray-400">
                        Performance data is being collected. Check back soon for campaign metrics.
                    </p>
                </div>
            ) : (
                <div className="card p-6 mb-8">
                    <p className="text-center text-gray-400">
                        Performance metrics will be available once the campaign is active.
                    </p>
                    {campaign.status === CampaignStatus.DRAFT && (
                        <div className="text-center mt-4">
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="btn-primary"
                            >
                                {isPublishing ? 'Publishing...' : 'Publish Campaign'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Geographic Targeting */}
            <div className="mt-8">
                <CampaignGeoMap geoZones={geoZones || []} />
            </div>
        </PageContainer>
    );
}
