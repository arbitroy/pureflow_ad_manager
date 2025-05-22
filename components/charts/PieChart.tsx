'use client';

import { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
    data: ChartData<'pie' | 'doughnut'>;
    options?: Partial<ChartOptions<'pie' | 'doughnut'>>;
    height?: number;
    loading?: boolean;
    error?: string | null;
    title?: string;
    description?: string;
    variant?: 'pie' | 'doughnut';
    showLegend?: boolean;
    showValues?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({
    data,
    options = {},
    height = 300,
    loading = false,
    error = null,
    title,
    description,
    variant = 'pie',
    showLegend = true,
    showValues = true
}) => {
    const chartRef = useRef<ChartJS<'pie' | 'doughnut'> | null>(null);

    // Calculate total for percentage calculations
    const total = data.datasets[0]?.data?.reduce((sum, value) => sum + (value as number), 0) || 0;

    // Default chart options
    const defaultOptions: ChartOptions<'pie' | 'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showLegend,
                position: 'right' as const,
                labels: {
                    color: '#ffffff',
                    font: {
                        size: 12
                    },
                    usePointStyle: true,
                    padding: 20,
                    generateLabels: function(chart) {
                        const data = chart.data;
                        if (data.labels && data.datasets.length) {
                            const dataset = data.datasets[0];
                            return data.labels.map((label, i) => {
                                const value = dataset.data[i] as number;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                                
                                return {
                                    text: showValues ? `${label}: ${percentage}%` : label as string,
                                    fillStyle: Array.isArray(dataset.backgroundColor) 
                                        ? dataset.backgroundColor[i] as string
                                        : dataset.backgroundColor as string,
                                    strokeStyle: Array.isArray(dataset.borderColor)
                                        ? dataset.borderColor[i] as string
                                        : dataset.borderColor as string,
                                    lineWidth: dataset.borderWidth as number,
                                    hidden: isNaN(value) || value === 0,
                                    index: i,
                                    pointStyle: 'circle'
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                backgroundColor: '#1a192c',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#3e91ff',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                        
                        // Format based on data type - assume it's always a count/percentage for pie charts
                        return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        },
        cutout: variant === 'doughnut' ? '50%' : undefined,
        elements: {
            arc: {
                borderWidth: 2,
                borderColor: '#121025'
            }
        }
    };

    // Merge default options with provided options
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
            ...defaultOptions.plugins,
            ...options.plugins
        }
    };

    // Cleanup chart on unmount
    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="bg-pure-light-dark rounded-lg p-6">
                {title && (
                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-white">{title}</h3>
                        {description && (
                            <p className="text-sm text-gray-400 mt-1">{description}</p>
                        )}
                    </div>
                )}
                <div className="flex items-center justify-center" style={{ height }}>
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pure-primary"></div>
                        <p className="text-gray-400">Loading chart data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-pure-light-dark rounded-lg p-6">
                {title && (
                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-white">{title}</h3>
                        {description && (
                            <p className="text-sm text-gray-400 mt-1">{description}</p>
                        )}
                    </div>
                )}
                <div className="flex items-center justify-center" style={{ height }}>
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="mt-2 text-red-400">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Check if we have data to display
    const hasData = data.datasets[0]?.data?.some(value => (value as number) > 0);

    if (!hasData) {
        return (
            <div className="bg-pure-light-dark rounded-lg p-6">
                {title && (
                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-white">{title}</h3>
                        {description && (
                            <p className="text-sm text-gray-400 mt-1">{description}</p>
                        )}
                    </div>
                )}
                <div className="flex items-center justify-center" style={{ height }}>
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="mt-2 text-gray-400">No data available</p>
                    </div>
                </div>
            </div>
        );
    }

    const ChartComponent = variant === 'doughnut' ? Doughnut : Pie;

    return (
        <motion.div
            className="bg-pure-light-dark rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {title && (
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                    {description && (
                        <p className="text-sm text-gray-400 mt-1">{description}</p>
                    )}
                </div>
            )}
            <div style={{ height }}>
                <ChartComponent
                    ref={chartRef}
                    data={data}
                    options={mergedOptions}
                />
            </div>
            
            {/* Center text for doughnut charts */}
            {variant === 'doughnut' && total > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{total.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Total</div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default PieChart;