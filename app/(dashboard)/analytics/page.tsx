'use client';

import PageContainer from '@/components/PageContainer';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Analytics() {
    const [dateRange, setDateRange] = useState('last30');
    const [selectedPlatforms, setSelectedPlatforms] = useState(['all']);

    const togglePlatform = (platform: string) => {
        if (platform === 'all') {
            setSelectedPlatforms(['all']);
            return;
        }

        const newSelection = selectedPlatforms.filter(p => p !== 'all');

        if (newSelection.includes(platform)) {
            // Remove platform if already selected
            const filtered = newSelection.filter(p => p !== platform);
            setSelectedPlatforms(filtered.length === 0 ? ['all'] : filtered);
        } else {
            // Add platform
            setSelectedPlatforms([...newSelection, platform]);
        }
    };

    return (
        <PageContainer title="Analytics Dashboard">
            <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setDateRange('last7')}
                        className={`px-4 py-2 rounded-md ${dateRange === 'last7' ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                            }`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setDateRange('last30')}
                        className={`px-4 py-2 rounded-md ${dateRange === 'last30' ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                            }`}
                    >
                        Last 30 Days
                    </button>
                    <button
                        onClick={() => setDateRange('custom')}
                        className={`px-4 py-2 rounded-md ${dateRange === 'custom' ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                            }`}
                    >
                        Custom
                    </button>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => togglePlatform('all')}
                        className={`px-4 py-2 rounded-md ${selectedPlatforms.includes('all') ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                            }`}
                    >
                        All Platforms
                    </button>
                    <button
                        onClick={() => togglePlatform('facebook')}
                        className={`px-4 py-2 rounded-md ${selectedPlatforms.includes('facebook') ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                            }`}
                    >
                        Facebook
                    </button>
                    <button
                        onClick={() => togglePlatform('instagram')}
                        className={`px-4 py-2 rounded-md ${selectedPlatforms.includes('instagram') ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                            }`}
                    >
                        Instagram
                    </button>
                </div>

                <button className="btn-secondary">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 inline"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    Export Data
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { title: 'Total Impressions', value: '254.8K', change: '+12.4%' },
                    { title: 'Total Clicks', value: '18.2K', change: '+8.7%' },
                    { title: 'Conversions', value: '1,254', change: '+5.2%' },
                    { title: 'Average ROI', value: '245%', change: '+18.3%' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <h3 className="text-gray-400 font-medium">{stat.title}</h3>
                        <div className="flex items-end mt-2">
                            <span className="text-2xl font-bold text-white">{stat.value}</span>
                            <span className="ml-2 text-sm text-green-400">{stat.change}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card h-80">
                    <h3 className="text-lg font-medium mb-4">Performance Overview</h3>
                    <div className="h-64 bg-pure-dark rounded-lg flex items-center justify-center text-gray-500">
                        Chart.js implementation here
                    </div>
                </div>
                <div className="card h-80">
                    <h3 className="text-lg font-medium mb-4">Platform Comparison</h3>
                    <div className="h-64 bg-pure-dark rounded-lg flex items-center justify-center text-gray-500">
                        Chart.js implementation here
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="text-lg font-medium mb-4">Campaign Performance</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-pure-dark">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Campaign
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Platform
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Impressions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Clicks
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    CTR
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Conversions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Cost
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    ROI
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pure-dark">
                            {[
                                {
                                    campaign: 'Summer Collection',
                                    platform: 'Facebook',
                                    impressions: '125K',
                                    clicks: '8.5K',
                                    ctr: '6.8%',
                                    conversions: '685',
                                    cost: '$1,200',
                                    roi: '245%',
                                },
                                {
                                    campaign: 'Summer Collection',
                                    platform: 'Instagram',
                                    impressions: '78K',
                                    clicks: '5.2K',
                                    ctr: '6.7%',
                                    conversions: '425',
                                    cost: '$950',
                                    roi: '215%',
                                },
                                {
                                    campaign: 'Flash Sale',
                                    platform: 'Facebook',
                                    impressions: '45K',
                                    clicks: '4.1K',
                                    ctr: '9.1%',
                                    conversions: '320',
                                    cost: '$650',
                                    roi: '310%',
                                },
                            ].map((campaign, index) => (
                                <motion.tr
                                    key={`${campaign.campaign}-${campaign.platform}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{campaign.campaign}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${campaign.platform === 'Facebook' ? 'bg-blue-900 text-blue-200' : 'bg-pink-900 text-pink-200'
                                                }`}
                                        >
                                            {campaign.platform}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.impressions}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.clicks}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.ctr}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.conversions}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.cost}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">{campaign.roi}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageContainer>
    );
}