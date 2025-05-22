// components/analytics/AnalyticsFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DateRangePicker, { DateRange } from './DateRangePicker';

export interface AnalyticsFilters {
    dateRange: DateRange;
    platforms: string[];
    campaigns: string[];
    metrics: string[];
    groupBy: 'day' | 'week' | 'month';
    comparison: {
        enabled: boolean;
        type: 'period' | 'campaigns';
        previousPeriod?: DateRange;
        compareCampaigns?: string[];
    };
}

interface AnalyticsFiltersProps {
    filters: AnalyticsFilters;
    onFiltersChange: (filters: AnalyticsFilters) => void;
    availablePlatforms: Array<{ id: string; name: string }>;
    availableCampaigns: Array<{ id: string; name: string }>;
    loading?: boolean;
}

const AVAILABLE_METRICS = [
    { id: 'impressions', label: 'Impressions', category: 'reach' },
    { id: 'clicks', label: 'Clicks', category: 'engagement' },
    { id: 'conversions', label: 'Conversions', category: 'performance' },
    { id: 'cost', label: 'Cost', category: 'budget' },
    { id: 'ctr', label: 'Click-Through Rate', category: 'efficiency' },
    { id: 'conversionrate', label: 'Conversion Rate', category: 'efficiency' },
    { id: 'cpc', label: 'Cost Per Click', category: 'efficiency' },
    { id: 'cpa', label: 'Cost Per Acquisition', category: 'efficiency' },
    { id: 'roi', label: 'Return on Investment', category: 'performance' }
];

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
    filters,
    onFiltersChange,
    availablePlatforms,
    availableCampaigns,
    loading = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Default date range (last 30 days)
    const defaultDateRange: DateRange = {
        label: 'Last 30 days',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
    };

    // Initialize filters if not provided
    useEffect(() => {
        if (!filters.dateRange) {
            onFiltersChange({
                ...filters,
                dateRange: defaultDateRange
            });
        }
    }, []);

    // Handle date range change
    const handleDateRangeChange = (dateRange: DateRange) => {
        const updatedFilters = { ...filters, dateRange };
        
        // If comparison is enabled and type is period, update previous period
        if (filters.comparison.enabled && filters.comparison.type === 'period') {
            const daysDiff = Math.ceil(
                (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            const previousStartDate = new Date(dateRange.startDate.getTime() - daysDiff * 24 * 60 * 60 * 1000);
            const previousEndDate = new Date(dateRange.endDate.getTime() - daysDiff * 24 * 60 * 60 * 1000);
            
            updatedFilters.comparison.previousPeriod = {
                label: `Previous ${daysDiff} days`,
                startDate: previousStartDate,
                endDate: previousEndDate
            };
        }
        
        onFiltersChange(updatedFilters);
    };

    // Handle platform toggle
    const handlePlatformToggle = (platformId: string) => {
        const platforms = filters.platforms.includes(platformId)
            ? filters.platforms.filter(id => id !== platformId)
            : [...filters.platforms, platformId];
        
        onFiltersChange({ ...filters, platforms });
    };

    // Handle campaign toggle
    const handleCampaignToggle = (campaignId: string) => {
        const campaigns = filters.campaigns.includes(campaignId)
            ? filters.campaigns.filter(id => id !== campaignId)
            : [...filters.campaigns, campaignId];
        
        onFiltersChange({ ...filters, campaigns });
    };

    // Handle metric toggle
    const handleMetricToggle = (metricId: string) => {
        const metrics = filters.metrics.includes(metricId)
            ? filters.metrics.filter(id => id !== metricId)
            : [...filters.metrics, metricId];
        
        onFiltersChange({ ...filters, metrics });
    };

    // Handle group by change
    const handleGroupByChange = (groupBy: 'day' | 'week' | 'month') => {
        onFiltersChange({ ...filters, groupBy });
    };

    // Handle comparison toggle
    const handleComparisonToggle = () => {
        const comparison = { ...filters.comparison, enabled: !filters.comparison.enabled };
        onFiltersChange({ ...filters, comparison });
    };

    // Handle comparison type change
    const handleComparisonTypeChange = (type: 'period' | 'campaigns') => {
        const comparison = { ...filters.comparison, type };
        onFiltersChange({ ...filters, comparison });
    };

    // Handle compare campaigns toggle
    const handleCompareCampaignToggle = (campaignId: string) => {
        const compareCampaigns = filters.comparison.compareCampaigns || [];
        const newCompareCampaigns = compareCampaigns.includes(campaignId)
            ? compareCampaigns.filter(id => id !== campaignId)
            : [...compareCampaigns, campaignId];
        
        const comparison = { ...filters.comparison, compareCampaigns: newCompareCampaigns };
        onFiltersChange({ ...filters, comparison });
    };

    // Reset all filters
    const handleResetFilters = () => {
        onFiltersChange({
            dateRange: defaultDateRange,
            platforms: [],
            campaigns: [],
            metrics: ['impressions', 'clicks', 'conversions', 'cost'],
            groupBy: 'day',
            comparison: {
                enabled: false,
                type: 'period'
            }
        });
    };

    // Group metrics by category
    const metricsByCategory = AVAILABLE_METRICS.reduce((acc, metric) => {
        if (!acc[metric.category]) {
            acc[metric.category] = [];
        }
        acc[metric.category].push(metric);
        return acc;
    }, {} as Record<string, typeof AVAILABLE_METRICS>);

    return (
        <div className="bg-pure-light-dark rounded-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Primary Filters Row */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Date Range Picker */}
                    <DateRangePicker
                        value={filters.dateRange || defaultDateRange}
                        onChange={handleDateRangeChange}
                        className="min-w-0"
                    />

                    {/* Group By */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Group by:</span>
                        <div className="flex bg-pure-dark rounded-lg p-1">
                            {(['day', 'week', 'month'] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleGroupByChange(option)}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${
                                        filters.groupBy === option
                                            ? 'bg-pure-primary text-white'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Toggle */}
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.comparison.enabled}
                                onChange={handleComparisonToggle}
                                className="sr-only"
                            />
                            <div className={`relative w-10 h-5 rounded-full transition-colors ${
                                filters.comparison.enabled ? 'bg-pure-primary' : 'bg-gray-600'
                            }`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                    filters.comparison.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </div>
                            <span className="ml-2 text-sm text-gray-400">Compare</span>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {isExpanded ? 'Less' : 'More'} Filters
                    </button>

                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-3 py-2 text-sm text-gray-400 hover:text-white"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Expanded Filters */}
            <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="mt-6 pt-6 border-t border-pure-dark space-y-6">
                    {/* Platform Filters */}
                    <div>
                        <h4 className="text-sm font-medium text-white mb-3">Platforms</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onFiltersChange({ ...filters, platforms: [] })}
                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                    filters.platforms.length === 0
                                        ? 'bg-pure-primary text-white border-pure-primary'
                                        : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
                                }`}
                            >
                                All Platforms
                            </button>
                            {availablePlatforms.map((platform) => (
                                <button
                                    key={platform.id}
                                    type="button"
                                    onClick={() => handlePlatformToggle(platform.id)}
                                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                        filters.platforms.includes(platform.id)
                                            ? 'bg-pure-primary text-white border-pure-primary'
                                            : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
                                    }`}
                                >
                                    {platform.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Campaign Filters */}
                    <div>
                        <h4 className="text-sm font-medium text-white mb-3">Campaigns</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onFiltersChange({ ...filters, campaigns: [] })}
                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                    filters.campaigns.length === 0
                                        ? 'bg-pure-primary text-white border-pure-primary'
                                        : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
                                }`}
                            >
                                All Campaigns
                            </button>
                            {availableCampaigns.map((campaign) => (
                                <button
                                    key={campaign.id}
                                    type="button"
                                    onClick={() => handleCampaignToggle(campaign.id)}
                                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                        filters.campaigns.includes(campaign.id)
                                            ? 'bg-pure-primary text-white border-pure-primary'
                                            : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
                                    }`}
                                >
                                    {campaign.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Metrics Selection */}
                    <div>
                        <h4 className="text-sm font-medium text-white mb-3">Metrics</h4>
                        <div className="space-y-4">
                            {Object.entries(metricsByCategory).map(([category, metrics]) => (
                                <div key={category}>
                                    <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                        {category}
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {metrics.map((metric) => (
                                            <button
                                                key={metric.id}
                                                type="button"
                                                onClick={() => handleMetricToggle(metric.id)}
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                    filters.metrics.includes(metric.id)
                                                        ? 'bg-pure-secondary text-white border-pure-secondary'
                                                        : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
                                                }`}
                                            >
                                                {metric.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Settings */}
                    {filters.comparison.enabled && (
                        <div>
                            <h4 className="text-sm font-medium text-white mb-3">Comparison Settings</h4>
                            <div className="space-y-4">
                                {/* Comparison Type */}
                                <div className="flex space-x-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="comparisonType"
                                            checked={filters.comparison.type === 'period'}
                                            onChange={() => handleComparisonTypeChange('period')}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                                            filters.comparison.type === 'period'
                                                ? 'border-pure-primary bg-pure-primary'
                                                : 'border-gray-600'
                                        }`}>
                                            {filters.comparison.type === 'period' && (
                                                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                            )}
                                        </div>
                                        <span className="text-sm text-white">Compare to previous period</span>
                                    </label>

                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="comparisonType"
                                            checked={filters.comparison.type === 'campaigns'}
                                            onChange={() => handleComparisonTypeChange('campaigns')}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                                            filters.comparison.type === 'campaigns'
                                                ? 'border-pure-primary bg-pure-primary'
                                                : 'border-gray-600'
                                        }`}>
                                            {filters.comparison.type === 'campaigns' && (
                                                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                            )}
                                        </div>
                                        <span className="text-sm text-white">Compare campaigns</span>
                                    </label>
                                </div>

                                {/* Campaign Comparison Selection */}
                                {filters.comparison.type === 'campaigns' && (
                                    <div>
                                        <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                            Select campaigns to compare
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {availableCampaigns.map((campaign) => (
                                                <button
                                                    key={campaign.id}
                                                    type="button"
                                                    onClick={() => handleCompareCampaignToggle(campaign.id)}
                                                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                        filters.comparison.compareCampaigns?.includes(campaign.id)
                                                            ? 'bg-pure-secondary text-white border-pure-secondary'
                                                            : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
                                                    }`}
                                                >
                                                    {campaign.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Active Filters Summary */}
            {(filters.platforms.length > 0 || filters.campaigns.length > 0 || filters.metrics.length > 0) && (
                <div className="mt-4 pt-4 border-t border-pure-dark">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>Active filters:</span>
                            <div className="flex items-center space-x-1">
                                {filters.platforms.length > 0 && (
                                    <span className="px-2 py-1 bg-pure-primary bg-opacity-20 text-pure-primary rounded text-xs">
                                        {filters.platforms.length} platform{filters.platforms.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {filters.campaigns.length > 0 && (
                                    <span className="px-2 py-1 bg-pure-secondary bg-opacity-20 text-pure-secondary rounded text-xs">
                                        {filters.campaigns.length} campaign{filters.campaigns.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {filters.metrics.length > 0 && (
                                    <span className="px-2 py-1 bg-green-600 bg-opacity-20 text-green-400 rounded text-xs">
                                        {filters.metrics.length} metric{filters.metrics.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsFilters;