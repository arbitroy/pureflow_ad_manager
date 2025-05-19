
'use client';

import PageContainer from '@/components/PageContainer';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([
        {
            id: 1,
            name: 'Summer Collection Launch',
            platforms: ['Facebook', 'Instagram'],
            status: 'Active',
            budget: '$1,200',
            reach: '45K',
            conversions: '320',
            dateRange: 'May 15 - Jun 15, 2025',
        },
        {
            id: 2,
            name: 'Flash Sale Promotion',
            platforms: ['Instagram'],
            status: 'Scheduled',
            budget: '$800',
            reach: '0',
            conversions: '0',
            dateRange: 'Jun 1 - Jun 5, 2025',
        },
        {
            id: 3,
            name: 'New Product Announcement',
            platforms: ['Facebook', 'Instagram'],
            status: 'Draft',
            budget: '$500',
            reach: '0',
            conversions: '0',
            dateRange: 'Not scheduled',
        },
    ]);

    return (
        <PageContainer title="Campaign Management">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
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
                <button className="btn-primary flex items-center">
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
                </button>
            </div>

            <div className="bg-pure-light-dark rounded-lg overflow-hidden">
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
                            {campaigns.map((campaign, index) => (
                                <motion.tr
                                    key={campaign.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{campaign.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-1">
                                            {campaign.platforms.map((platform) => (
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
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${campaign.status === 'Active'
                                                    ? 'bg-green-900 text-green-200'
                                                    : campaign.status === 'Scheduled'
                                                        ? 'bg-yellow-900 text-yellow-200'
                                                        : 'bg-gray-700 text-gray-300'
                                                }`}
                                        >
                                            {campaign.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.budget}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.reach}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.conversions}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{campaign.dateRange}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-pure-primary hover:text-pure-secondary">Edit</button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageContainer>
    );
}