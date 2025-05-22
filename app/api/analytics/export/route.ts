import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
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

        const body = await request.json();
        const { 
            startDate, 
            endDate, 
            platforms = [], 
            campaigns = [], 
            metrics = [], 
            format = 'csv',
            includeCharts = false
        } = body;

        // Validate required parameters
        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        // Build query for export data
        let query = `
            SELECT 
                a.*,
                c.name as campaign_name,
                c.status as campaign_status,
                DATE(a.date) as export_date
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
        const exportData = rows as any[];

        if (exportData.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No data available for export with the selected filters' },
                { status: 404 }
            );
        }

        // Generate export based on format
        let exportContent: string;
        let contentType: string;
        let fileName: string;

        switch (format) {
            case 'csv':
                ({ content: exportContent, contentType, fileName } = generateCSVExport(exportData, metrics, startDate, endDate));
                break;
            case 'json':
                ({ content: exportContent, contentType, fileName } = generateJSONExport(exportData, startDate, endDate));
                break;
            default:
                return NextResponse.json(
                    { success: false, message: 'Unsupported export format' },
                    { status: 400 }
                );
        }

        // Return file as response
        const response = new NextResponse(exportContent, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'no-cache'
            }
        });

        return response;

    } catch (error) {
        console.error('Error exporting analytics data:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to export analytics data' },
            { status: 500 }
        );
    }
}

// Generate CSV export
function generateCSVExport(data: any[], selectedMetrics: string[], startDate: string, endDate: string) {
    // Define all available columns
    const allColumns = [
        { key: 'export_date', label: 'Date' },
        { key: 'campaign_name', label: 'Campaign' },
        { key: 'platform', label: 'Platform' },
        { key: 'impressions', label: 'Impressions', metric: true },
        { key: 'clicks', label: 'Clicks', metric: true },
        { key: 'conversions', label: 'Conversions', metric: true },
        { key: 'cost', label: 'Cost', metric: true },
        { key: 'ctr', label: 'CTR (%)', metric: true },
        { key: 'conversion_rate', label: 'Conversion Rate (%)', metric: true },
        { key: 'cpc', label: 'CPC', metric: true },
        { key: 'cpa', label: 'CPA', metric: true },
        { key: 'roi', label: 'ROI (%)', metric: true }
    ];

    // Filter columns based on selected metrics
    const columns = allColumns.filter(col => 
        !col.metric || selectedMetrics.length === 0 || selectedMetrics.some(metric => 
            metric.toLowerCase().replace(/[^a-z]/g, '') === col.key.toLowerCase().replace(/[^a-z]/g, '')
        )
    );

    // Generate CSV headers
    const headers = columns.map(col => col.label);

    // Generate CSV rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key];
            
            // Format specific columns
            switch (col.key) {
                case 'export_date':
                    value = new Date(value).toLocaleDateString();
                    break;
                case 'cost':
                case 'cpc':
                case 'cpa':
                    value = parseFloat(value || 0).toFixed(2);
                    break;
                case 'ctr':
                case 'conversion_rate':
                case 'roi':
                    value = parseFloat(value || 0).toFixed(2);
                    break;
                default:
                    value = value || 0;
            }
            
            return `"${value}"`;
        });
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const fileName = `analytics_export_${startDate}_to_${endDate}_${new Date().toISOString().split('T')[0]}.csv`;

    return {
        content: csvContent,
        contentType: 'text/csv',
        fileName
    };
}

// Generate JSON export
function generateJSONExport(data: any[], startDate: string, endDate: string) {
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            dateRange: {
                startDate,
                endDate
            },
            recordCount: data.length
        },
        data: data.map(item => ({
            date: item.export_date,
            campaign: {
                id: item.campaign_id,
                name: item.campaign_name,
                status: item.campaign_status
            },
            platform: item.platform,
            metrics: {
                impressions: item.impressions || 0,
                clicks: item.clicks || 0,
                conversions: item.conversions || 0,
                cost: parseFloat(item.cost || 0),
                ctr: parseFloat(item.ctr || 0),
                conversionRate: parseFloat(item.conversion_rate || 0),
                cpc: parseFloat(item.cpc || 0),
                cpa: parseFloat(item.cpa || 0),
                roi: parseFloat(item.roi || 0)
            }
        }))
    };

    const fileName = `analytics_export_${startDate}_to_${endDate}_${new Date().toISOString().split('T')[0]}.json`;

    return {
        content: JSON.stringify(exportData, null, 2),
        contentType: 'application/json',
        fileName
    };
}