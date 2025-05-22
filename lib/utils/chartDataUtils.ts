import { ChartData } from 'chart.js';

// Color palette for charts
export const CHART_COLORS = {
    primary: '#3e91ff',
    secondary: '#ff762e',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6',
    pink: '#ec4899',
    gradient: {
        blue: ['#3e91ff', '#1e40af'],
        orange: ['#ff762e', '#ea580c'],
        green: ['#10b981', '#047857'],
        purple: ['#8b5cf6', '#7c3aed'],
        pink: ['#ec4899', '#db2777']
    }
};

// Platform colors
export const PLATFORM_COLORS = {
    FACEBOOK: '#1877f2',
    INSTAGRAM: '#e4405f',
    TWITTER: '#1da1f2',
    LINKEDIN: '#0077b5'
};

// Analytics data interface
export interface AnalyticsData {
    id: string;
    campaignId: string;
    platform: string;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    ctr: number;
    conversionRate: number;
    cpc: number;
    cpa: number;
    roi: number;
    date: string;
}

// Campaign data interface
export interface CampaignData {
    id: string;
    name: string;
    status: string;
    budget: number;
    platforms: string[];
    analytics?: AnalyticsData[];
}

/**
 * Transform analytics data for time-series line chart
 */
export function transformTimeSeriesData(
    analyticsData: AnalyticsData[],
    metric: keyof Pick<AnalyticsData, 'impressions' | 'clicks' | 'conversions' | 'cost' | 'roi'>,
    groupBy: 'day' | 'week' | 'month' = 'day'
): ChartData<'line'> {
    // Group data by date and platform
    const groupedData = analyticsData.reduce((acc, item) => {
        const date = formatDateForGrouping(item.date, groupBy);
        const platform = item.platform;
        
        if (!acc[platform]) {
            acc[platform] = {};
        }
        
        if (!acc[platform][date]) {
            acc[platform][date] = 0;
        }
        
        acc[platform][date] += item[metric] as number;
        return acc;
    }, {} as Record<string, Record<string, number>>);

    // Get all unique dates and sort them
    const allDates = Array.from(
        new Set(
            analyticsData.map(item => formatDateForGrouping(item.date, groupBy))
        )
    ).sort();

    // Create datasets for each platform
    const datasets = Object.keys(groupedData).map((platform, index) => {
        const platformData = groupedData[platform];
        const data = allDates.map(date => platformData[date] || 0);
        
        return {
            label: platform,
            data,
            borderColor: PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || CHART_COLORS.primary,
            backgroundColor: `${PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || CHART_COLORS.primary}20`,
            fill: true,
            tension: 0.4
        };
    });

    return {
        labels: allDates,
        datasets
    };
}

/**
 * Transform analytics data for platform comparison bar chart
 */
export function transformPlatformComparisonData(
    analyticsData: AnalyticsData[],
    metric: keyof Pick<AnalyticsData, 'impressions' | 'clicks' | 'conversions' | 'cost' | 'roi'>
): ChartData<'bar'> {
    // Group data by platform
    const platformData = analyticsData.reduce((acc, item) => {
        const platform = item.platform;
        if (!acc[platform]) {
            acc[platform] = 0;
        }
        acc[platform] += item[metric] as number;
        return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(platformData);
    const data = Object.values(platformData);
    
    // Generate colors based on platform
    const backgroundColor = labels.map(platform => 
        PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || CHART_COLORS.primary
    );

    return {
        labels,
        datasets: [
            {
                label: metric.charAt(0).toUpperCase() + metric.slice(1),
                data,
                backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1
            }
        ]
    };
}

/**
 * Transform analytics data for campaign comparison
 */
export function transformCampaignComparisonData(
    campaigns: CampaignData[],
    metric: keyof Pick<AnalyticsData, 'impressions' | 'clicks' | 'conversions' | 'cost' | 'roi'>
): ChartData<'bar'> {
    const campaignData = campaigns.map(campaign => {
        const totalMetric = campaign.analytics?.reduce((sum, analytics) => 
            sum + (analytics[metric] as number), 0) || 0;
        
        return {
            name: campaign.name,
            value: totalMetric
        };
    });

    const labels = campaignData.map(item => item.name);
    const data = campaignData.map(item => item.value);

    // Generate gradient colors
    const colors = campaignData.map((_, index) => {
        const colorKeys = Object.keys(CHART_COLORS.gradient);
        const colorKey = colorKeys[index % colorKeys.length] as keyof typeof CHART_COLORS.gradient;
        return CHART_COLORS.gradient[colorKey][0];
    });

    return {
        labels,
        datasets: [
            {
                label: metric.charAt(0).toUpperCase() + metric.slice(1),
                data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }
        ]
    };
}

/**
 * Transform analytics data for distribution pie chart
 */
export function transformDistributionData(
    analyticsData: AnalyticsData[],
    groupBy: 'platform' | 'campaign',
    metric: keyof Pick<AnalyticsData, 'impressions' | 'clicks' | 'conversions' | 'cost'>,
    campaigns?: CampaignData[]
): ChartData<'pie'> {
    let groupedData: Record<string, number>;

    if (groupBy === 'platform') {
        // Group by platform
        groupedData = analyticsData.reduce((acc, item) => {
            const platform = item.platform;
            if (!acc[platform]) {
                acc[platform] = 0;
            }
            acc[platform] += item[metric] as number;
            return acc;
        }, {} as Record<string, number>);
    } else {
        // Group by campaign
        groupedData = analyticsData.reduce((acc, item) => {
            const campaign = campaigns?.find(c => c.id === item.campaignId);
            const campaignName = campaign?.name || 'Unknown Campaign';
            
            if (!acc[campaignName]) {
                acc[campaignName] = 0;
            }
            acc[campaignName] += item[metric] as number;
            return acc;
        }, {} as Record<string, number>);
    }

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);

    // Generate colors
    const backgroundColor = labels.map((label, index) => {
        if (groupBy === 'platform') {
            return PLATFORM_COLORS[label as keyof typeof PLATFORM_COLORS] || CHART_COLORS.primary;
        } else {
            const colorKeys = Object.keys(CHART_COLORS.gradient);
            const colorKey = colorKeys[index % colorKeys.length] as keyof typeof CHART_COLORS.gradient;
            return CHART_COLORS.gradient[colorKey][0];
        }
    });

    return {
        labels,
        datasets: [
            {
                data,
                backgroundColor,
                borderColor: backgroundColor.map(color => color),
                borderWidth: 2
            }
        ]
    };
}

/**
 * Transform analytics data for ROI vs Spend scatter plot
 */
export function transformROISpendData(
    campaigns: CampaignData[]
): ChartData<'scatter'> {
    const scatterData = campaigns.map(campaign => {
        const totalSpend = campaign.analytics?.reduce((sum, analytics) => 
            sum + analytics.cost, 0) || 0;
        const avgROI = campaign.analytics?.length ? 
            campaign.analytics.reduce((sum, analytics) => sum + analytics.roi, 0) / campaign.analytics.length : 0;
        
        return {
            x: totalSpend,
            y: avgROI,
            campaignName: campaign.name
        };
    });

    return {
        datasets: [
            {
                label: 'ROI vs Spend',
                data: scatterData,
                backgroundColor: CHART_COLORS.primary,
                borderColor: CHART_COLORS.primary,
                pointRadius: 8,
                pointHoverRadius: 12
            }
        ]
    };
}

/**
 * Calculate key performance indicators
 */
export function calculateKPIs(analyticsData: AnalyticsData[]) {
    if (!analyticsData.length) {
        return {
            totalImpressions: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalCost: 0,
            avgCTR: 0,
            avgConversionRate: 0,
            avgCPC: 0,
            avgCPA: 0,
            avgROI: 0
        };
    }

    const totals = analyticsData.reduce((acc, item) => {
        acc.impressions += item.impressions;
        acc.clicks += item.clicks;
        acc.conversions += item.conversions;
        acc.cost += item.cost;
        return acc;
    }, { impressions: 0, clicks: 0, conversions: 0, cost: 0 });

    const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const avgConversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const avgCPA = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
    const avgROI = analyticsData.reduce((sum, item) => sum + item.roi, 0) / analyticsData.length;

    return {
        totalImpressions: totals.impressions,
        totalClicks: totals.clicks,
        totalConversions: totals.conversions,
        totalCost: totals.cost,
        avgCTR,
        avgConversionRate,
        avgCPC,
        avgCPA,
        avgROI
    };
}

/**
 * Format date for grouping
 */
function formatDateForGrouping(dateString: string, groupBy: 'day' | 'week' | 'month'): string {
    const date = new Date(dateString);
    
    switch (groupBy) {
        case 'day':
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
        case 'week':
            const week = getWeekNumber(date);
            return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
        case 'month':
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        default:
            return date.toISOString().split('T')[0];
    }
}

/**
 * Get week number from date
 */
function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Generate chart colors based on count
 */
export function generateChartColors(count: number): string[] {
    const baseColors = [
        CHART_COLORS.primary,
        CHART_COLORS.secondary,
        CHART_COLORS.success,
        CHART_COLORS.warning,
        CHART_COLORS.error,
        CHART_COLORS.info,
        CHART_COLORS.purple,
        CHART_COLORS.pink
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }

    return colors;
}

/**
 * Format metric value for display
 */
export function formatMetricValue(value: number, metric: string): string {
    switch (metric.toLowerCase()) {
        case 'cost':
        case 'cpc':
        case 'cpa':
            return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'ctr':
        case 'conversionrate':
        case 'roi':
            return `${value.toFixed(2)}%`;
        case 'impressions':
        case 'clicks':
        case 'conversions':
            return value.toLocaleString();
        default:
            return value.toLocaleString();
    }
}

/**
 * Get metric label for display
 */
export function getMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
        impressions: 'Impressions',
        clicks: 'Clicks',
        conversions: 'Conversions',
        cost: 'Cost',
        ctr: 'Click-Through Rate',
        conversionrate: 'Conversion Rate',
        cpc: 'Cost Per Click',
        cpa: 'Cost Per Acquisition',
        roi: 'Return on Investment'
    };

    return labels[metric.toLowerCase()] || metric;
}