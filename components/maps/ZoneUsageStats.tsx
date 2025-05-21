'use client';

import { useState, useEffect } from 'react';
import { GeoZone } from '@/types/models';
import { motion } from 'framer-motion';

interface CampaignUsage {
    id: string;
    name: string;
    status: string;
}

interface ZoneUsageStatsProps {
    zoneId: string;
}

const ZoneUsageStats: React.FC<ZoneUsageStatsProps> = ({ zoneId }) => {
    const [campaigns, setCampaigns] = useState<CampaignUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchZoneUsage = async () => {
            try {
                setLoading(true);

                const response = await fetch(`/api/geo-zones/${zoneId}/usage`);

                if (!response.ok) {
                    throw new Error('Failed to fetch zone usage data');
                }

                const data = await response.json();

                if (data.success) {
                    setCampaigns(data.data);
                } else {
                    throw new Error(data.message || 'Failed to fetch zone usage data');
                }
            } catch (err) {
                console.error('Error fetching zone usage:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (zoneId) {
            fetchZoneUsage();
        }
    }, [zoneId]);

    // Status badge color
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
            default:
                return 'bg-gray-700 text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pure-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900 bg-opacity-50 text-red-200 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Campaigns Using This Zone</h3>

            {campaigns.length === 0 ? (
                <div className="bg-pure-dark p-4 rounded-lg text-gray-400">
                    <p>This zone is not currently used in any campaigns.</p>
                </div>
            ) : (
                <div className="divide-y divide-pure-dark">
                    {campaigns.map((campaign, index) => (
                        <motion.div
                            key={campaign.id}
                            className="py-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                            <div className="flex justify-between items-center">
                                <a
                                    href={`/campaigns/${campaign.id}`}
                                    className="text-pure-primary hover:text-pure-secondary font-medium"
                                >
                                    {campaign.name}
                                </a>
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                                    {campaign.status}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ZoneUsageStats;