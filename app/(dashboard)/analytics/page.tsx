// app/(dashboard)/analytics/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PageContainer from '@/components/PageContainer';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import AnalyticsFilters, { AnalyticsFilters as AnalyticsFiltersType } from '@/components/analytics/AnalyticsFilters';
import { 
    transformTimeSeriesData, 
    transformPlatformComparisonData, 
    transformDistributionData,
    transformCampaignComparisonData,
    calculateKPIs,
    AnalyticsData,
    CampaignData,
    formatMetricValue,
    getMetricLabel
} from '@/lib/utils/chartDataUtils';
import { 
    exportToCSV, 
    exportToPDF, 
    chartToImageData, 
    scheduleReport,
    exportWithProgress,
    ExportOptions,
    ScheduleOptions
} from '@/lib/utils/exportUtils';

export default function Analytics() {
    // State management
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
    const [availablePlatforms, setAvailablePlatforms] = useState<Array<{ id: string; name: string }>>([]);
    const [availableCampaigns, setAvailableCampaigns] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // Chart refs for export functionality
    const timeSeriesChartRef = useRef<any>(null);
    const platformChartRef = useRef<any>(null);
    const distributionChartRef = useRef<any>(null);
    const campaignChartRef = useRef<any>(null);

    // Default filters
    const [filters, setFilters] = useState<AnalyticsFiltersType>({
        dateRange: {
            label: 'Last 30 days',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        },
        platforms: [],
        campaigns: [],
        metrics: ['impressions', 'clicks', 'conversions', 'cost'],
        groupBy: 'day',
        comparison: {
            enabled: false,
            type: 'period'
        }
    });

    // Fetch initial data
    useEffect(() => {
        fetchAvailableOptions();
    }, []);

    // Fetch analytics data when filters change
    useEffect(() => {
        if (filters.dateRange) {
            fetchAnalyticsData();
        }
    }, [filters]);

    // Fetch available platforms and campaigns
    const fetchAvailableOptions = async () => {
        try {
            const [platformsResponse, campaignsResponse] = await Promise.all([
                fetch('/api/platforms'),
                fetch('/api/campaigns')
            ]);

            if (platformsResponse.ok) {
                const platformsData = await platformsResponse.json();
                if (platformsData.success) {
                    setAvailablePlatforms(platformsData.data.map((p: any) => ({
                        id: p.name,
                        name: p.name === 'FACEBOOK' ? 'Facebook' : 'Instagram'
                    })));
                }
            }

            if (campaignsResponse.ok) {
                const campaignsData = await campaignsResponse.json();
                if (campaignsData.success) {
                    setAvailableCampaigns(campaignsData.data.map((c: any) => ({
                        id: c.id,
                        name: c.name
                    })));
                    setCampaigns(campaignsData.data);
                }
            }
        } catch (err) {
            console.error('Error fetching available options:', err);
        }
    };

    // Fetch analytics data
    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                startDate: filters.dateRange.startDate.toISOString().split('T')[0],
                endDate: filters.dateRange.endDate.toISOString().split('T')[0],
                platforms: filters.platforms.join(','),
                campaigns: filters.campaigns.join(','),
                metrics: filters.metrics.join(','),
                groupBy: filters.groupBy
            });

            const response = await fetch(`/api/analytics?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }

            const result = await response.json();

            if (result.success) {
                setAnalyticsData(result.data.analytics);
            } else {
                throw new Error(result.message || 'Failed to fetch analytics data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching analytics data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle export to CSV
    const handleExportCSV = async () => {
        const exportOptions: ExportOptions = {
            format: 'csv',
            dateRange: {
                startDate: filters.dateRange.startDate,
                endDate: filters.dateRange.endDate
            },
            filters: {
                platforms: filters.platforms,
                campaigns: filters.campaigns,
                metrics: filters.metrics
            }
        };

        await exportWithProgress(
            () => {
                exportToCSV(analyticsData, campaigns, exportOptions);
                return Promise.resolve();
            },
            (progress) => {
                setExportProgress(progress);
                setExportLoading(true);
            }
        );

        setExportLoading(false);
        setExportProgress(0);
    };

    // Handle export to PDF
    const handleExportPDF = async () => {
        setExportLoading(true);
        
        try {
            // Capture chart images
            const chartImages: { [key: string]: string } = {};
            
            if (timeSeriesChartRef.current) {
                chartImages['Performance Trends'] = chartToImageData(timeSeriesChartRef) || '';
            }
            if (platformChartRef.current) {
                chartImages['Platform Comparison'] = chartToImageData(platformChartRef) || '';
            }
            if (distributionChartRef.current) {
                chartImages['Traffic Distribution'] = chartToImageData(distributionChartRef) || '';
            }

            const exportOptions: ExportOptions = {
                format: 'pdf',
                includeCharts: true,
                dateRange: {
                    startDate: filters.dateRange.startDate,
                    endDate: filters.dateRange.endDate
                },
                filters: {
                    platforms: filters.platforms,
                    campaigns: filters.campaigns,
                    metrics: filters.metrics
                }
            };

            await exportToPDF(analyticsData, campaigns, chartImages, exportOptions);
        } catch (err) {
            console.error('Error exporting PDF:', err);
        } finally {
            setExportLoading(false);
        }
    };

    // Calculate KPIs
    const kpis = calculateKPIs(analyticsData);

    // Prepare chart data
    const timeSeriesData = transformTimeSeriesData(analyticsData, 'impressions', filters.groupBy);
    const platformComparisonData = transformPlatformComparisonData(analyticsData, 'clicks');
    const distributionData = transformDistributionData(analyticsData, 'platform', 'impressions', campaigns);
    const campaignComparisonData = transformCampaignComparisonData(campaigns, 'conversions');

    // KPI cards data
    const kpiCards = [
        { title: 'Total Impressions', value: kpis.totalImpressions, change: '+12.4%', icon: '👁️' },
        { title: 'Total Clicks', value: kpis.totalClicks, change: '+8.7%', icon: '👆' },
        { title: 'Total Conversions', value: kpis.totalConversions, change: '+5.2%', icon: '🎯' },
        { title: 'Average ROI', value: `${kpis.avgROI.toFixed(1)}%`, change: '+18.3%', icon: '📈' }
    ];

    return (
        <PageContainer title="Analytics Dashboard">
            {/* Filters */}
            <AnalyticsFilters
                filters={filters}
                onFiltersChange={setFilters}
                availablePlatforms={availablePlatforms}
                availableCampaigns={availableCampaigns}
                loading={loading}
            />

            {/* Export Controls */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-medium text-white">Performance Overview</h2>
                    {filters.comparison.enabled && (
                        <span className="px-3 py-1 bg-pure-secondary bg-opacity-20 text-pure-secondary rounded-full text-sm">
                            Comparison Mode
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {exportLoading && (
                        <div className="flex items-center space-x-2 text-pure-primary">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-pure-primary"></div>
                            <span className="text-sm">Exporting... {exportProgress}%</span>
                        </div>
                    )}
                    
                    <button
                        onClick={handleExportCSV}
                        disabled={exportLoading || analyticsData.length === 0}
                        className="flex items-center px-3 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                    </button>

                    <button
                        onClick={handleExportPDF}
                        disabled={exportLoading || analyticsData.length === 0}
                        className="flex items-center px-3 py-2 bg-pure-primary text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L13.414 3.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export PDF
                    </button>
                </div>
            </div>

            {error && (
                <motion.div
                    className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p>{error}</p>
                </motion.div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpiCards.map((kpi, index) => (
                    <motion.div
                        key={kpi.title}
                        className="bg-pure-light-dark rounded-lg p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">{kpi.title}</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                                </p>
                                <p className="text-green-400 text-sm mt-1">{kpi.change}</p>
                            </div>
                            <div className="text-2xl">{kpi.icon}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Time Series Chart */}
                <LineChart
                    ref={timeSeriesChartRef}
                    data={timeSeriesData}
                    height={300}
                    loading={loading}
                    error={error}
                    title="Performance Trends"
                    description={`${getMetricLabel('impressions')} over time by platform`}
                />

                {/* Platform Comparison */}
                <BarChart
                    ref={platformChartRef}
                    data={platformComparisonData}
                    height={300}
                    loading={loading}
                    error={error}
                    title="Platform Performance"
                    description={`${getMetricLabel('clicks')} comparison across platforms`}
                />

                {/* Traffic Distribution */}
                <PieChart
                    ref={distributionChartRef}
                    data={distributionData}
                    height={300}
                    loading={loading}
                    error={error}
                    title="Traffic Distribution"
                    description="Impression distribution by platform"
                    variant="doughnut"
                />

                {/* Campaign Comparison */}
                <BarChart
                    ref={campaignChartRef}
                    data={campaignComparisonData}
                    height={300}
                    loading={loading}
                    error={error}
                    title="Campaign Performance"
                    description={`${getMetricLabel('conversions')} by campaign`}
                    horizontal={true}
                />
            </div>

            {/* Detailed Data Table */}
            {analyticsData.length > 0 && (
                <div className="bg-pure-light-dark rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-pure-dark">
                        <h3 className="text-lg font-medium text-white">Detailed Analytics</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Showing {analyticsData.length} records from {filters.dateRange.startDate.toLocaleDateString()} to {filters.dateRange.endDate.toLocaleDateString()}
                        </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-pure-dark">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Campaign</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Platform</th>
                                    {filters.metrics.includes('impressions') && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Impressions</th>
                                    )}
                                    {filters.metrics.includes('clicks') && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clicks</th>
                                    )}
                                    {filters.metrics.includes('conversions') && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Conversions</th>
                                    )}
                                    {filters.metrics.includes('cost') && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                                    )}
                                    {filters.metrics.includes('ctr') && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">CTR</th>
                                    )}
                                    {filters.metrics.includes('roi') && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ROI</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pure-dark">
                                {analyticsData.slice(0, 50).map((item, index) => {
                                    const campaign = campaigns.find(c => c.id === item.campaignId);
                                    return (
                                        <motion.tr
                                            key={`${item.campaignId}-${item.platform}-${item.date}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.01 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {campaign?.name || 'Unknown Campaign'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    item.platform === 'FACEBOOK' ? 'bg-blue-900 text-blue-200' : 'bg-pink-900 text-pink-200'
                                                }`}>
                                                    {item.platform}
                                                </span>
                                            </td>
                                            {filters.metrics.includes('impressions') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.impressions.toLocaleString()}</td>
                                            )}
                                            {filters.metrics.includes('clicks') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.clicks.toLocaleString()}</td>
                                            )}
                                            {filters.metrics.includes('conversions') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.conversions.toLocaleString()}</td>
                                            )}
                                            {filters.metrics.includes('cost') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${item.cost.toFixed(2)}</td>
                                            )}
                                            {filters.metrics.includes('ctr') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.ctr.toFixed(2)}%</td>
                                            )}
                                            {filters.metrics.includes('roi') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">{item.roi.toFixed(2)}%</td>
                                            )}
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {analyticsData.length > 50 && (
                            <div className="p-4 text-center border-t border-pure-dark">
                                <p className="text-gray-400 text-sm">
                                    Showing first 50 of {analyticsData.length} records. Export to CSV for complete data.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* No Data State */}
            {!loading && analyticsData.length === 0 && (
                <motion.div
                    className="bg-pure-light-dark rounded-lg p-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">No Analytics Data</h3>
                    <p className="text-gray-400 mb-4">
                        No analytics data found for the selected date range and filters.
                    </p>
                    <p className="text-gray-400 text-sm">
                        Try adjusting your date range or removing some filters to see more data.
                    </p>
                </motion.div>
            )}
        </PageContainer>
    );
}