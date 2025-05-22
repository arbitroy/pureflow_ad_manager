import { AnalyticsData, CampaignData, formatMetricValue, getMetricLabel } from './chartDataUtils';

export interface ExportOptions {
    format: 'csv' | 'pdf' | 'excel';
    includeCharts?: boolean;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    filters: {
        platforms: string[];
        campaigns: string[];
        metrics: string[];
    };
}

/**
 * Export analytics data to CSV format
 */
export function exportToCSV(
    analyticsData: AnalyticsData[],
    campaigns: CampaignData[],
    options: ExportOptions
): void {
    // Prepare headers
    const headers = [
        'Date',
        'Campaign',
        'Platform',
        'Impressions',
        'Clicks',
        'Conversions',
        'Cost',
        'CTR (%)',
        'Conversion Rate (%)',
        'CPC',
        'CPA',
        'ROI (%)'
    ];

    // Filter headers based on selected metrics
    const filteredHeaders = headers.filter((header, index) => {
        if (index < 3) return true; // Always include Date, Campaign, Platform
        const metricKey = header.toLowerCase().replace(/[^a-z]/g, '');
        return options.filters.metrics.some(metric => 
            metric.toLowerCase().replace(/[^a-z]/g, '') === metricKey
        );
    });

    // Prepare data rows
    const rows = analyticsData.map(item => {
        const campaign = campaigns.find(c => c.id === item.campaignId);
        const row = [
            new Date(item.date).toLocaleDateString(),
            campaign?.name || 'Unknown Campaign',
            item.platform,
            item.impressions.toString(),
            item.clicks.toString(),
            item.conversions.toString(),
            item.cost.toFixed(2),
            item.ctr.toFixed(2),
            item.conversionRate.toFixed(2),
            item.cpc.toFixed(2),
            item.cpa.toFixed(2),
            item.roi.toFixed(2)
        ];

        // Filter row data based on selected metrics
        return row.filter((_, index) => {
            if (index < 3) return true; // Always include Date, Campaign, Platform
            const metricKey = headers[index].toLowerCase().replace(/[^a-z]/g, '');
            return options.filters.metrics.some(metric => 
                metric.toLowerCase().replace(/[^a-z]/g, '') === metricKey
            );
        });
    });

    // Create CSV content
    const csvContent = [
        filteredHeaders.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', generateFileName('csv', options));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export analytics data to PDF format
 */
export async function exportToPDF(
    analyticsData: AnalyticsData[],
    campaigns: CampaignData[],
    chartImages: { [key: string]: string },
    options: ExportOptions
): Promise<void> {
    // This would require a PDF generation library like jsPDF or Puppeteer
    // For now, we'll create a simplified HTML report and use the browser's print functionality
    
    const reportHTML = generatePDFReport(analyticsData, campaigns, chartImages, options);
    
    // Create a new window with the report
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
            reportWindow.print();
        }, 1000);
    }
}

/**
 * Generate HTML report for PDF export
 */
function generatePDFReport(
    analyticsData: AnalyticsData[],
    campaigns: CampaignData[],
    chartImages: { [key: string]: string },
    options: ExportOptions
): string {
    const summary = calculateSummaryForReport(analyticsData);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Analytics Report - ${options.dateRange.startDate.toLocaleDateString()} to ${options.dateRange.endDate.toLocaleDateString()}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #3e91ff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #3e91ff;
                    margin: 0;
                }
                .date-range {
                    color: #666;
                    margin-top: 10px;
                }
                .summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .summary-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                }
                .summary-card h3 {
                    margin: 0 0 10px 0;
                    color: #666;
                    font-size: 14px;
                }
                .summary-card .value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #3e91ff;
                }
                .charts {
                    margin: 30px 0;
                }
                .chart {
                    margin-bottom: 30px;
                    text-align: center;
                }
                .chart img {
                    max-width: 100%;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                }
                .data-table th,
                .data-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .data-table th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                }
                .data-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                @media print {
                    body { margin: 0; }
                    .chart { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Analytics Report</h1>
                <div class="date-range">
                    ${options.dateRange.startDate.toLocaleDateString()} - ${options.dateRange.endDate.toLocaleDateString()}
                </div>
            </div>

            <div class="summary">
                <div class="summary-card">
                    <h3>Total Impressions</h3>
                    <div class="value">${summary.totalImpressions.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                    <h3>Total Clicks</h3>
                    <div class="value">${summary.totalClicks.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                    <h3>Total Conversions</h3>
                    <div class="value">${summary.totalConversions.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                    <h3>Total Cost</h3>
                    <div class="value">${summary.totalCost.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                    <h3>Average CTR</h3>
                    <div class="value">${summary.avgCTR.toFixed(2)}%</div>
                </div>
                <div class="summary-card">
                    <h3>Average ROI</h3>
                    <div class="value">${summary.avgROI.toFixed(2)}%</div>
                </div>
            </div>

            ${options.includeCharts && Object.keys(chartImages).length > 0 ? `
                <div class="charts">
                    <h2>Performance Charts</h2>
                    ${Object.entries(chartImages).map(([title, imageData]) => `
                        <div class="chart">
                            <h3>${title}</h3>
                            <img src="${imageData}" alt="${title}" />
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Campaign</th>
                        <th>Platform</th>
                        ${options.filters.metrics.includes('impressions') ? '<th>Impressions</th>' : ''}
                        ${options.filters.metrics.includes('clicks') ? '<th>Clicks</th>' : ''}
                        ${options.filters.metrics.includes('conversions') ? '<th>Conversions</th>' : ''}
                        ${options.filters.metrics.includes('cost') ? '<th>Cost</th>' : ''}
                        ${options.filters.metrics.includes('ctr') ? '<th>CTR (%)</th>' : ''}
                        ${options.filters.metrics.includes('roi') ? '<th>ROI (%)</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${analyticsData.map(item => {
                        const campaign = campaigns.find(c => c.id === item.campaignId);
                        return `
                            <tr>
                                <td>${new Date(item.date).toLocaleDateString()}</td>
                                <td>${campaign?.name || 'Unknown Campaign'}</td>
                                <td>${item.platform}</td>
                                ${options.filters.metrics.includes('impressions') ? `<td>${item.impressions.toLocaleString()}</td>` : ''}
                                ${options.filters.metrics.includes('clicks') ? `<td>${item.clicks.toLocaleString()}</td>` : ''}
                                ${options.filters.metrics.includes('conversions') ? `<td>${item.conversions.toLocaleString()}</td>` : ''}
                                ${options.filters.metrics.includes('cost') ? `<td>${item.cost.toFixed(2)}</td>` : ''}
                                ${options.filters.metrics.includes('ctr') ? `<td>${item.ctr.toFixed(2)}%</td>` : ''}
                                ${options.filters.metrics.includes('roi') ? `<td>${item.roi.toFixed(2)}%</td>` : ''}
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

/**
 * Calculate summary statistics for report
 */
function calculateSummaryForReport(analyticsData: AnalyticsData[]) {
    const totals = analyticsData.reduce((acc, item) => {
        acc.impressions += item.impressions || 0;
        acc.clicks += item.clicks || 0;
        acc.conversions += item.conversions || 0;
        acc.cost += item.cost || 0;
        return acc;
    }, { impressions: 0, clicks: 0, conversions: 0, cost: 0 });

    return {
        totalImpressions: totals.impressions,
        totalClicks: totals.clicks,
        totalConversions: totals.conversions,
        totalCost: totals.cost,
        avgCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        avgConversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
        avgCPC: totals.clicks > 0 ? totals.cost / totals.clicks : 0,
        avgCPA: totals.conversions > 0 ? totals.cost / totals.conversions : 0,
        avgROI: totals.cost > 0 ? ((totals.conversions * 100) - totals.cost) / totals.cost * 100 : 0
    };
}

/**
 * Generate filename for export
 */
function generateFileName(format: string, options: ExportOptions): string {
    const startDate = options.dateRange.startDate.toISOString().split('T')[0];
    const endDate = options.dateRange.endDate.toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    return `analytics-report_${startDate}_to_${endDate}_${timestamp}.${format}`;
}

/**
 * Convert chart canvas to image data URL
 */
export function chartToImageData(chartRef: any): string | null {
    if (chartRef && chartRef.current) {
        return chartRef.current.toBase64Image();
    }
    return null;
}

/**
 * Schedule report delivery (would integrate with email service)
 */
export interface ScheduleOptions {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'csv' | 'pdf';
    includeCharts: boolean;
    filters: {
        platforms: string[];
        campaigns: string[];
        metrics: string[];
    };
}

export function scheduleReport(options: ScheduleOptions): Promise<{ success: boolean; scheduleId?: string }> {
    // This would integrate with a job scheduler or email service
    // For now, we'll return a mock response
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                scheduleId: `schedule_${Date.now()}`
            });
        }, 1000);
    });
}

/**
 * Export data with loading state management
 */
export async function exportWithProgress(
    exportFunction: () => Promise<void>,
    onProgress?: (progress: number) => void
): Promise<void> {
    const steps = [
        { message: 'Gathering data...', progress: 25 },
        { message: 'Processing metrics...', progress: 50 },
        { message: 'Generating export...', progress: 75 },
        { message: 'Finalizing...', progress: 100 }
    ];

    for (const step of steps) {
        if (onProgress) {
            onProgress(step.progress);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    await exportFunction();
}