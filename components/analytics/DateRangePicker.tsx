'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DateRange {
    startDate: Date;
    endDate: Date;
    label: string;
}

interface DateRangePickerProps {
    value: DateRange;
    onChange: (dateRange: DateRange) => void;
    className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    value,
    onChange,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Predefined date ranges
    const presetRanges: DateRange[] = [
        {
            label: 'Last 7 days',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        },
        {
            label: 'Last 14 days',
            startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        },
        {
            label: 'Last 30 days',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        },
        {
            label: 'Last 90 days',
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        },
        {
            label: 'This month',
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            endDate: new Date()
        },
        {
            label: 'Last month',
            startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
        },
        {
            label: 'This quarter',
            startDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1),
            endDate: new Date()
        },
        {
            label: 'This year',
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date()
        }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Format date for display
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format date for input
    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // Handle preset selection
    const handlePresetSelect = (preset: DateRange) => {
        onChange(preset);
        setIsOpen(false);
    };

    // Handle custom date range
    const handleCustomDateRange = () => {
        if (!customStartDate || !customEndDate) return;

        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);

        if (startDate > endDate) {
            alert('Start date must be before end date');
            return;
        }

        const customRange: DateRange = {
            label: `${formatDate(startDate)} - ${formatDate(endDate)}`,
            startDate,
            endDate
        };

        onChange(customRange);
        setIsOpen(false);
    };

    // Initialize custom dates when opening custom tab
    useEffect(() => {
        if (activeTab === 'custom') {
            setCustomStartDate(formatDateForInput(value.startDate));
            setCustomEndDate(formatDateForInput(value.endDate));
        }
    }, [activeTab, value]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-pure-primary"
            >
                <div className="flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span className="text-sm">{value.label}</span>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-80 bg-pure-light-dark rounded-lg shadow-xl border border-pure-dark overflow-hidden"
                        style={{ minWidth: '320px' }}
                    >
                        {/* Tab Headers */}
                        <div className="flex border-b border-pure-dark">
                            <button
                                type="button"
                                onClick={() => setActiveTab('presets')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${
                                    activeTab === 'presets'
                                        ? 'text-pure-primary border-b-2 border-pure-primary bg-pure-primary bg-opacity-10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Quick Select
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('custom')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${
                                    activeTab === 'custom'
                                        ? 'text-pure-primary border-b-2 border-pure-primary bg-pure-primary bg-opacity-10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Custom Range
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4">
                            {activeTab === 'presets' && (
                                <div className="space-y-1">
                                    {presetRanges.map((preset, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-pure-dark transition-colors ${
                                                preset.label === value.label
                                                    ? 'bg-pure-primary bg-opacity-20 text-pure-primary'
                                                    : 'text-white'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{preset.label}</span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(preset.startDate)} - {formatDate(preset.endDate)}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'custom' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full bg-pure-dark text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                            max={formatDateForInput(new Date())}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full bg-pure-dark text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                            min={customStartDate}
                                            max={formatDateForInput(new Date())}
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="px-3 py-2 text-sm text-gray-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCustomDateRange}
                                            disabled={!customStartDate || !customEndDate}
                                            className="px-4 py-2 bg-pure-primary text-white text-sm rounded-md hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DateRangePicker;