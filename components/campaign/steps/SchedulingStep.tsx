'use client';

import { useState } from 'react';
import { useCampaignForm } from '@/contexts/CampaignFormContext';
import FormNavigation from '../FormNavigation';

const SchedulingStep: React.FC = () => {
    const { formState, setField, errors } = useCampaignForm();
    const [scheduleType, setScheduleType] = useState(
        formState.startDate && formState.endDate ? 'scheduled' : 'draft'
    );

    // Format date for input
    const formatDateForInput = (date: Date | null | undefined) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const handleScheduleTypeChange = (type: string) => {
        setScheduleType(type);

        if (type === 'draft') {
            // If draft, clear dates
            setField('startDate', null);
            setField('endDate', null);
        } else if (type === 'scheduled' && !formState.startDate) {
            // If scheduled but no start date, set default dates
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1); // Tomorrow

            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 15); // Two weeks later

            setField('startDate', startDate);
            setField('endDate', endDate);
        }
    };

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-6">Campaign Scheduling</h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-4">
                        Schedule Type
                    </label>

                    <div className="flex space-x-4">
                        <div
                            className={`p-4 border rounded-lg cursor-pointer flex-1 ${scheduleType === 'draft'
                                    ? 'border-pure-primary bg-pure-primary bg-opacity-10'
                                    : 'border-pure-dark'
                                }`}
                            onClick={() => handleScheduleTypeChange('draft')}
                        >
                            <h3 className="font-medium text-white">Save as Draft</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Save your campaign without scheduling it. You can set dates later.
                            </p>
                        </div>

                        <div
                            className={`p-4 border rounded-lg cursor-pointer flex-1 ${scheduleType === 'scheduled'
                                    ? 'border-pure-primary bg-pure-primary bg-opacity-10'
                                    : 'border-pure-dark'
                                }`}
                            onClick={() => handleScheduleTypeChange('scheduled')}
                        >
                            <h3 className="font-medium text-white">Schedule Campaign</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Set start and end dates for your campaign to run automatically.
                            </p>
                        </div>
                    </div>
                </div>

                {scheduleType === 'scheduled' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-2">
                                    Start Date
                                </label>
                                <input
                                    id="startDate"
                                    type="date"
                                    value={formatDateForInput(formState.startDate)}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : null;
                                        setField('startDate', date);
                                    }}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    min={formatDateForInput(new Date())}
                                />
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-2">
                                    End Date
                                </label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={formatDateForInput(formState.endDate)}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : null;
                                        setField('endDate', date);
                                    }}
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    min={formatDateForInput(formState.startDate || new Date())}
                                />
                            </div>
                        </div>

                        {errors.dateRange && (
                            <div className="p-3 bg-red-900 bg-opacity-50 text-red-200 rounded">
                                {errors.dateRange}
                            </div>
                        )}

                        <div className="p-4 bg-pure-dark rounded-lg">
                            <h3 className="font-medium text-white mb-2">Time Targeting Options</h3>
                            <p className="text-sm text-gray-400">
                                Optimize your campaign by running ads at specific times of the day when your audience is most active.
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="flex items-center">
                                    <input
                                        id="allHours"
                                        type="radio"
                                        name="timeTargeting"
                                        checked={true}
                                        className="h-4 w-4 text-pure-primary"
                                    />
                                    <label htmlFor="allHours" className="ml-2 text-sm text-white">
                                        Run all hours
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="specific"
                                        type="radio"
                                        name="timeTargeting"
                                        disabled
                                        className="h-4 w-4 text-pure-primary"
                                    />
                                    <label htmlFor="specific" className="ml-2 text-sm text-white opacity-50">
                                        Specific hours (coming soon)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <FormNavigation />
        </div>
    );
};

export default SchedulingStep;