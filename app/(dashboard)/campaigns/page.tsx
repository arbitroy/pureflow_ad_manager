'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/PageContainer';
import StatusMenu from '@/components/campaign/StatusMenu';
import { motion } from 'framer-motion';
import { Campaign, CampaignStatus } from '@/types/models';

export default function Campaigns() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch campaigns
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await fetch('/api/campaigns');

                if (!response.ok) {
                    throw new Error('Failed to fetch campaigns');
                }

                const result = await response.json();

                if (result.success && result.data) {
                    setCampaigns(result.data);
                } else {
                    throw new Error(result.message || 'Failed to fetch campaigns');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error('Error fetching campaigns:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    // Handle status change
    const handleStatusChange = async (campaignId: string | number, newStatus: CampaignStatus) => {
        try {
            const response = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update campaign status');
            }

            // Update local state
            setCampaigns(prevCampaigns =>
                prevCampaigns.map(campaign =>
                    campaign.id === campaignId
                        ? { ...campaign, status: newStatus }
                        : campaign
                )
            );
        } catch (error) {
            console.error('Error updating campaign status:', error);
        }
    };

    // Filter campaigns by search term
    const filteredCampaigns = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get platform display names
    const getPlatformNames = (campaign: Campaign) => {
        return campaign.platforms.map(platform =>
            platform.name === 'FACEBOOK' ? 'Facebook' : 'Instagram'
        );
    };

    // Format date range
    const getDateRange = (campaign: Campaign) => {
        if (!campaign.startDate && !campaign.endDate) {
            return 'Not scheduled';
        }

        const formatDate = (date: Date | string | undefined) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        };

        return `${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}`;
    };

    // Format budget
    const formatBudget = (budget: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(budget);
    };

    return (
        <PageContainer title="Campaign Management">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-pure-dark text-white pl-10 pr-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-pure-primary"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>
                <Link href="/campaigns/new" className="btn-primary flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    New Campaign
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pure-primary"></div>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-900 bg-opacity-50 text-red-200 rounded-lg">
                    {error}
                </div>
            ) : (
                <div className="bg-pure-light-dark rounded-lg overflow-hidden">
                    {filteredCampaigns.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            {searchTerm ? 'No campaigns match your search' : 'No campaigns found. Create your first campaign!'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-pure-dark">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Campaign Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Platforms
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Budget
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Reach
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Conversions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Date Range
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-pure-dark">
                                    {filteredCampaigns.map((campaign, index) => (
                                        <motion.tr
                                            key={campaign.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">{campaign.name}</div>
                                                {campaign.description && (
                                                    <div className="text-xs text-gray-400 truncate max-w-xs">
                                                        {campaign.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex space-x-1">
                                                    {getPlatformNames(campaign).map((platform) => (
                                                        <span
                                                            key={platform}
                                                            className={`px-2 py-1 text-xs rounded-full ${platform === 'Facebook' ? 'bg-blue-900 text-blue-200' : 'bg-pink-900 text-pink-200'
                                                                }`}
                                                        >
                                                            {platform}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusMenu
                                                    campaignId={campaign.id}
                                                    currentStatus={campaign.status}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {formatBudget(campaign.budget)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {campaign.analytics?.impressions || '0'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {campaign.analytics?.conversions || '0'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {getDateRange(campaign)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/campaigns/${campaign.id}/edit`}
                                                    className="text-pure-primary hover:text-pure-secondary mr-3"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => {/* Delete functionality would go here */ }}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}