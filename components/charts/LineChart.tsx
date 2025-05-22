'use client';

import { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartOptions,
    ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface LineChartProps {
    data: ChartData<'line'>;
    options?: Partial<ChartOptions<'line'>>;
    height?: number;
    loading?: boolean;
    error?: string | null;
    title?: string;
    description?: string;
}

const LineChart: React.FC<LineChartProps> = ({
    data,
    options = {},
    height = 300,
    loading = false,
    error = null,
    title,
    description
}) => {
    const chartRef = useRef<ChartJS<'line'> | null>(null);

    // Default chart options
    const defaultOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#ffffff',
                    font: {
                        size: 12
                    },
                    usePointStyle: true,
                    padding: 20
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
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        
                        // Format based on data type
                        if (label.toLowerCase().includes('cost') || label.toLowerCase().includes('budget')) {
                            return `${label}: $${value.toLocaleString()}`;
                        } else if (label.toLowerCase().includes('rate') || label.toLowerCase().includes('roi')) {
                            return `${label}: ${value.toFixed(2)}%`;
                        } else {
                            return `${label}: ${value.toLocaleString()}`;
                        }
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11
                    }
                },
                grid: {
                    color: '#374151',
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11
                    },
                    callback: function(value) {
                        // Format y-axis labels based on scale
                        const numValue = Number(value);
                        if (numValue >= 1000000) {
                            return (numValue / 1000000).toFixed(1) + 'M';
                        } else if (numValue >= 1000) {
                            return (numValue / 1000).toFixed(1) + 'K';
                        }
                        return numValue.toString();
                    }
                },
                grid: {
                    color: '#374151',
                    drawBorder: false
                },
                beginAtZero: true
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        elements: {
            line: {
                tension: 0.4,
                borderWidth: 2
            },
            point: {
                radius: 4,
                hoverRadius: 8,
                borderWidth: 2,
                backgroundColor: '#ffffff'
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    };

    // Merge default options with provided options
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
            ...defaultOptions.plugins,
            ...options.plugins
        },
        scales: {
            ...defaultOptions.scales,
            ...options.scales
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
                <Line
                    ref={chartRef}
                    data={data}
                    options={mergedOptions}
                />
            </div>
        </motion.div>
    );
};

export default LineChart;