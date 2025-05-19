'use client';

import { useCampaignForm } from '@/contexts/CampaignFormContext';
import FormNavigation from '../FormNavigation';
import { CampaignStatus } from '@/types/models';

const PreviewStep: React.FC = () => {
    const { formState, isEdit, setField } = useCampaignForm();

    // Format date for display
    const formatDate = (date: Date | null | undefined) => {
        if (!date) return 'Not scheduled';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Set campaign status based on scheduling
    const getCampaignStatus = () => {
        if (isEdit && formState.status !== CampaignStatus.DRAFT) {
            // For edit mode, use existing status
            return formState.status;
        }

        // For new campaigns or drafts
        if (formState.startDate && formState.endDate) {
            const now = new Date();
            const startDate = new Date(formState.startDate);

            if (startDate <= now) {
                // If start date is today or in the past, set as ACTIVE
                return CampaignStatus.ACTIVE;
            } else {
                // If start date is in the future, set as SCHEDULED
                return CampaignStatus.SCHEDULED;
            }
        }

        // Default to DRAFT if no dates are set
        return CampaignStatus.DRAFT;
    };

    // Update status in form state
    const campaignStatus = getCampaignStatus();
    if (formState.status !== campaignStatus) {
        setField('status', campaignStatus);
    }

    // Get budget in formatted currency
    const getFormattedBudget = (budget: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(budget);
    };

    // Status badge color
    const getStatusColor = (status: CampaignStatus) => {
        switch (status) {
            case CampaignStatus.ACTIVE:
                return 'bg-green-900 text-green-200';
            case CampaignStatus.SCHEDULED:
                return 'bg-yellow-900 text-yellow-200';
            case CampaignStatus.PAUSED:
                return 'bg-orange-900 text-orange-200';
            case CampaignStatus.COMPLETED:
                return 'bg-blue-900 text-blue-200';
            default:
                return 'bg-gray-700 text-gray-300';
        }
    };

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-6">Campaign Preview</h2>

            <div className="space-y-8">
                <p className="text-gray-400">
                    Review your campaign details before {isEdit ? 'updating' : 'creating'} it.
                    You can go back to any previous step to make changes.
                </p>

                <div className="bg-pure-dark rounded-lg p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white">{formState.name}</h3>
                            <div className="mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(formState.status)}`}>
                                    {formState.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Total Budget</div>
                            <div className="text-xl font-bold text-white">{getFormattedBudget(formState.budget)}</div>
                        </div>
                    </div>

                    {formState.description && (
                        <div className="mt-4 border-t border-gray-700 pt-4">
                            <div className="text-sm text-gray-400 mb-1">Description</div>
                            <p className="text-white">{formState.description}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-pure-dark rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Platforms</h3>
                        {formState.platforms.length === 0 ? (
                            <p className="text-gray-400">No platforms selected</p>
                        ) : (
                            <div className="space-y-3">
                                {formState.platforms.map(platform => (
                                    <div key={platform.id} className="flex items-center">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${platform.name === 'FACEBOOK' ? 'bg-blue-900' : 'bg-pink-900'
                                            }`}>
                                            {platform.name === 'FACEBOOK' ? (
                                                <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-pink-200" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.04 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.04.058 2.67 0 2.986-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.04 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.058-4.04-.058zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.466a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.669a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-white">{platform.name}</span>
                                            <div className="text-xs text-gray-400">Account ID: {platform.accountId}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-pure-dark rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Schedule</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-400">Start Date</div>
                                <div className="text-white">{formatDate(formState.startDate)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">End Date</div>
                                <div className="text-white">{formatDate(formState.endDate)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Time Targeting</div>
                                <div className="text-white">All hours</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-pure-dark rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Geo-Targeting</h3>
                    {formState.geoZones.length === 0 ? (
                        <p className="text-gray-400">No geo-targeting zones selected</p>
                    ) : (
                        <div className="space-y-3">
                            {formState.geoZones.map(zone => (
                                <div key={zone.id} className="flex items-center">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${zone.type === 'CIRCLE' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
                                        }`}>
                                        {zone.type === 'CIRCLE' ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M21.63 16.27l-8.18-14c-.8-1.34-2.76-1.34-3.54 0l-8.18 14c-.82 1.34.16 3.01 1.74 3.01h16.37c1.58 0 2.56-1.67 1.79-3.01z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-white">{zone.name}</span>
                                        <div className="text-xs text-gray-400">
                                            {zone.type === 'CIRCLE'
                                                ? `Radius: ${zone.radiusKm} km`
                                                : `Polygon: ${zone.points?.length || 0} points`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <FormNavigation showSubmit={true} />
        </div>
    );
};

export default PreviewStep;