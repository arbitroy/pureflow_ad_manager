// app/api/analytics/route.ts
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { getAnalyticsCache, setAnalyticsCache } from '@/lib/db-migration-analytics';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('auth_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const platforms = searchParams.get('platforms')?.split(',').filter(Boolean) || [];
        const campaigns = searchParams.get('campaigns')?.split(',').filter(Boolean) || [];
        const metrics = searchParams.get('metrics')?.split(',').filter(Boolean) || ['impressions', 'clicks', 'conversions', 'cost'];
        const groupBy = searchParams.get('groupBy') || 'day';

        // Validate date range
        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        // Create cache key
        const cacheKey = `analytics_${tokenData.userId}_${startDate}_${endDate}_${platforms.join(',')}_${campaigns.join(',')}_${metrics.join(',')}_${groupBy}`;

        // Try to get from cache first
        const cachedData = await getAnalyticsCache(cacheKey, tokenData.userId);
        if (cachedData) {
            return NextResponse.json({
                success: true,
                data: cachedData,
                cached: true
            });
        }

        // Build the base query
        let query = `
            SELECT 
                a.*,
                c.name as campaign_name,
                c.status as campaign_status,
                c.budget as campaign_budget,
                DATE(a.date) as analytics_date
            FROM analytics a
            JOIN campaigns c ON a.campaign_id = c.id
            WHERE c.created_by = ?
            AND a.date BETWEEN ? AND ?
        `;

        const queryParams: any[] = [tokenData.userId, startDate, endDate];

        // Add platform filter
        if (platforms.length > 0) {
            query += ` AND a.platform IN (${platforms.map(() => '?').join(',')})`;
            queryParams.push(...platforms);
        }

        // Add campaign filter
        if (campaigns.length > 0) {
            query += ` AND a.campaign_id IN (${campaigns.map(() => '?').join(',')})`;
            queryParams.push(...campaigns);
        }

        query += ` ORDER BY a.date DESC, c.name, a.platform`;

        // Execute query
        const [rows] = await pool.query(query, queryParams);
        const analyticsData = rows as any[];

        // Transform data based on groupBy parameter
        const transformedData = transformAnalyticsData(analyticsData, groupBy, metrics);

        // Calculate summary statistics
        const summary = calculateSummaryStats(analyticsData, metrics);

        // Get campaign and platform lists for the filtered data
        const [campaignList, platformList] = await Promise.all([
            getCampaignList(tokenData.userId, campaigns),
            getPlatformList(tokenData.userId, platforms)
        ]);

        // Calculate performance trends
        const trends = calculateTrends(transformedData, groupBy);

        // Get top performing campaigns and platforms
        const topPerformers = getTopPerformers(analyticsData);

        const responseData = {
            analytics: transformedData,
            summary,
            campaigns: campaignList,
            platforms: platformList,
            trends,
            topPerformers,
            dateRange: { startDate, endDate },
            groupBy,
            metrics,
            totalRecords: analyticsData.length
        };

        // Cache the results for 15 minutes
        await setAnalyticsCache(cacheKey, tokenData.userId, responseData, {
            startDate,
            endDate,
            platforms,
            campaigns,
            metrics,
            groupBy
        }, 15);

        return NextResponse.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}

// Transform analytics data based on groupBy parameter
function transformAnalyticsData(data: any[], groupBy: string, metrics: string[]) {
    const grouped = data.reduce((acc, item) => {
        let dateKey: string;
        const date = new Date(item.date);

        switch (groupBy) {
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                dateKey = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
                break;
            default: // day
                dateKey = date.toISOString().split('T')[0];
                break;
        }

        const key = `${dateKey}-${item.platform}-${item.campaign_id}`;

        if (!acc[key]) {
            acc[key] = {
                date: dateKey,
                platform: item.platform,
                campaignId: item.campaign_id,
                campaignName: item.campaign_name,
                campaignStatus: item.campaign_status,
                campaignBudget: parseFloat(item.campaign_budget || 0),
                impressions: 0,
                clicks: 0,
                conversions: 0,
                cost: 0,
                ctr: 0,
                conversionRate: 0,
                cpc: 0,
                cpa: 0,
                roi: 0,
                records: 0
            };
        }

        // Aggregate metrics
        acc[key].impressions += item.impressions || 0;
        acc[key].clicks += item.clicks || 0;
        acc[key].conversions += item.conversions || 0;
        acc[key].cost += parseFloat(item.cost) || 0;
        acc[key].records += 1;

        return acc;
    }, {});

    // Calculate derived metrics
    Object.values(grouped).forEach((item: any) => {
        item.ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
        item.conversionRate = item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0;
        item.cpc = item.clicks > 0 ? item.cost / item.clicks : 0;
        item.cpa = item.conversions > 0 ? item.cost / item.conversions : 0;
        
        // ROI calculation (assuming average order value of $100)
        const avgOrderValue = 100;
        const revenue = item.conversions * avgOrderValue;
        item.roi = item.cost > 0 ? ((revenue - item.cost) / item.cost) * 100 : 0;
        
        // Round decimal values
        item.ctr = Math.round(item.ctr * 100) / 100;
        item.conversionRate = Math.round(item.conversionRate * 100) / 100;
        item.cpc = Math.round(item.cpc * 100) / 100;
        item.cpa = Math.round(item.cpa * 100) / 100;
        item.roi = Math.round(item.roi * 100) / 100;
        item.cost = Math.round(item.cost * 100) / 100;
    });

    return Object.values(grouped);
}

// Calculate summary statistics
function calculateSummaryStats(data: any[], metrics: string[]) {
    if (data.length === 0) {
        return {
            totalImpressions: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalCost: 0,
            avgCTR: 0,
            avgConversionRate: 0,
            avgCPC: 0,
            avgCPA: 0,
            avgROI: 0,
            totalCampaigns: 0,
            totalPlatforms: 0,
            dateRange: 0
        };
    }

    const totals = data.reduce((acc, item) => {
        acc.impressions += item.impressions || 0;
        acc.clicks += item.clicks || 0;
        acc.conversions += item.conversions || 0;
        acc.cost += parseFloat(item.cost) || 0;
        return acc;
    }, { impressions: 0, clicks: 0, conversions: 0, cost: 0 });

    // Get unique counts
    const uniqueCampaigns = new Set(data.map(item => item.campaign_id));
    const uniquePlatforms = new Set(data.map(item => item.platform));
    const uniqueDates = new Set(data.map(item => item.analytics_date));

    // Calculate ROI with assumed average order value
    const avgOrderValue = 100;
    const totalRevenue = totals.conversions * avgOrderValue;
    const totalROI = totals.cost > 0 ? ((totalRevenue - totals.cost) / totals.cost) * 100 : 0;

    const summary = {
        totalImpressions: totals.impressions,
        totalClicks: totals.clicks,
        totalConversions: totals.conversions,
        totalCost: Math.round(totals.cost * 100) / 100,
        avgCTR: totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 10000) / 100 : 0,
        avgConversionRate: totals.clicks > 0 ? Math.round((totals.conversions / totals.clicks) * 10000) / 100 : 0,
        avgCPC: totals.clicks > 0 ? Math.round((totals.cost / totals.clicks) * 100) / 100 : 0,
        avgCPA: totals.conversions > 0 ? Math.round((totals.cost / totals.conversions) * 100) / 100 : 0,
        avgROI: Math.round(totalROI * 100) / 100,
        totalCampaigns: uniqueCampaigns.size,
        totalPlatforms: uniquePlatforms.size,
        dateRange: uniqueDates.size
    };

    return summary;
}

// Calculate performance trends
function calculateTrends(transformedData: any[], groupBy: string) {
    if (transformedData.length < 2) {
        return {
            impressionsTrend: 0,
            clicksTrend: 0,
            conversionsTrend: 0,
            costTrend: 0,
            roiTrend: 0
        };
    }

    // Sort by date
    const sortedData = transformedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Split into two halves for comparison
    const midpoint = Math.floor(sortedData.length / 2);
    const firstHalf = sortedData.slice(0, midpoint);
    const secondHalf = sortedData.slice(midpoint);

    const firstHalfTotals = firstHalf.reduce((acc, item) => ({
        impressions: acc.impressions + item.impressions,
        clicks: acc.clicks + item.clicks,
        conversions: acc.conversions + item.conversions,
        cost: acc.cost + item.cost,
        roi: acc.roi + item.roi
    }), { impressions: 0, clicks: 0, conversions: 0, cost: 0, roi: 0 });

    const secondHalfTotals = secondHalf.reduce((acc, item) => ({
        impressions: acc.impressions + item.impressions,
        clicks: acc.clicks + item.clicks,
        conversions: acc.conversions + item.conversions,
        cost: acc.cost + item.cost,
        roi: acc.roi + item.roi
    }), { impressions: 0, clicks: 0, conversions: 0, cost: 0, roi: 0 });

    // Calculate percentage changes
    const calculateTrend = (first: number, second: number) => {
        if (first === 0) return second > 0 ? 100 : 0;
        return Math.round(((second - first) / first) * 10000) / 100;
    };

    return {
        impressionsTrend: calculateTrend(firstHalfTotals.impressions, secondHalfTotals.impressions),
        clicksTrend: calculateTrend(firstHalfTotals.clicks, secondHalfTotals.clicks),
        conversionsTrend: calculateTrend(firstHalfTotals.conversions, secondHalfTotals.conversions),
        costTrend: calculateTrend(firstHalfTotals.cost, secondHalfTotals.cost),
        roiTrend: calculateTrend(firstHalfTotals.roi / firstHalf.length, secondHalfTotals.roi / secondHalf.length)
    };
}

// Get top performing campaigns and platforms
function getTopPerformers(data: any[]) {
    if (data.length === 0) {
        return {
            topCampaigns: [],
            topPlatforms: [],
            bestROI: [],
            highestConversions: []
        };
    }

    // Group by campaign
    const campaignPerformance = data.reduce((acc, item) => {
        const key = item.campaign_id;
        if (!acc[key]) {
            acc[key] = {
                id: item.campaign_id,
                name: item.campaign_name,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                cost: 0,
                roi: 0
            };
        }
        acc[key].impressions += item.impressions || 0;
        acc[key].clicks += item.clicks || 0;
        acc[key].conversions += item.conversions || 0;
        acc[key].cost += parseFloat(item.cost) || 0;
        return acc;
    }, {} as any);

    // Calculate ROI for campaigns
    Object.values(campaignPerformance).forEach((campaign: any) => {
        const avgOrderValue = 100;
        const revenue = campaign.conversions * avgOrderValue;
        campaign.roi = campaign.cost > 0 ? ((revenue - campaign.cost) / campaign.cost) * 100 : 0;
        campaign.roi = Math.round(campaign.roi * 100) / 100;
    });

    // Group by platform
    const platformPerformance = data.reduce((acc, item) => {
        const key = item.platform;
        if (!acc[key]) {
            acc[key] = {
                name: item.platform,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                cost: 0,
                roi: 0
            };
        }
        acc[key].impressions += item.impressions || 0;
        acc[key].clicks += item.clicks || 0;
        acc[key].conversions += item.conversions || 0;
        acc[key].cost += parseFloat(item.cost) || 0;
        return acc;
    }, {} as any);

    // Calculate ROI for platforms
    Object.values(platformPerformance).forEach((platform: any) => {
        const avgOrderValue = 100;
        const revenue = platform.conversions * avgOrderValue;
        platform.roi = platform.cost > 0 ? ((revenue - platform.cost) / platform.cost) * 100 : 0;
        platform.roi = Math.round(platform.roi * 100) / 100;
    });

    return {
        topCampaigns: Object.values(campaignPerformance)
            .sort((a: any, b: any) => b.impressions - a.impressions)
            .slice(0, 5),
        topPlatforms: Object.values(platformPerformance)
            .sort((a: any, b: any) => b.clicks - a.clicks)
            .slice(0, 3),
        bestROI: Object.values(campaignPerformance)
            .sort((a: any, b: any) => b.roi - a.roi)
            .slice(0, 5),
        highestConversions: Object.values(campaignPerformance)
            .sort((a: any, b: any) => b.conversions - a.conversions)
            .slice(0, 5)
    };
}

// Get campaign list
async function getCampaignList(userId: string, campaignFilter: string[]) {
    let query = `
        SELECT 
            id, name, status, budget, 
            start_date, end_date, created_at,
            (SELECT COUNT(*) FROM analytics WHERE campaign_id = campaigns.id) as analytics_count
        FROM campaigns 
        WHERE created_by = ?
    `;
    const params = [userId];

    if (campaignFilter.length > 0) {
        query += ` AND id IN (${campaignFilter.map(() => '?').join(',')})`;
        params.push(...campaignFilter);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    return (rows as any[]).map(campaign => ({
        ...campaign,
        budget: parseFloat(campaign.budget || 0),
        hasAnalytics: campaign.analytics_count > 0
    }));
}

// Get platform list
async function getPlatformList(userId: string, platformFilter: string[]) {
    let query = `
        SELECT DISTINCT 
            p.id, p.name, p.account_id,
            (SELECT COUNT(*) FROM analytics a 
             JOIN campaigns c ON a.campaign_id = c.id 
             WHERE a.platform = p.name AND c.created_by = ?) as analytics_count
        FROM platforms p
        JOIN user_platforms up ON p.id = up.platform_id
        WHERE up.user_id = ?
    `;
    const params = [userId, userId];

    if (platformFilter.length > 0) {
        query += ` AND p.name IN (${platformFilter.map(() => '?').join(',')})`;
        params.push(...platformFilter);
    }

    const [rows] = await pool.query(query, params);
    return (rows as any[]).map(platform => ({
        ...platform,
        displayName: platform.name === 'FACEBOOK' ? 'Facebook' : 'Instagram',
        hasAnalytics: platform.analytics_count > 0
    }));
}