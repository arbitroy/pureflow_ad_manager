'use client';

import { useState } from 'react';
import { CampaignStatus } from '@/types/models';

interface StatusMenuProps {
    campaignId: string | number;
    currentStatus: CampaignStatus;
    onStatusChange: (campaignId: string | number, newStatus: CampaignStatus) => Promise<void>;
}

const StatusMenu: React.FC<StatusMenuProps> = ({ campaignId, currentStatus, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusChange = async (newStatus: CampaignStatus) => {
        if (newStatus === currentStatus) {
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            await onStatusChange(campaignId, newStatus);
        } catch (error) {
            console.error('Error changing status:', error);
        } finally {
            setIsLoading(false);
            setIsOpen(false);
        }
    };

    // Get status badge color
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
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(currentStatus)}`}
                disabled={isLoading}
            >
                {isLoading ? 'Updating...' : currentStatus}
            </button>

            {isOpen && (
                <div className="absolute z-10 right-0 mt-2 w-48 rounded-md shadow-lg bg-pure-light-dark ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {Object.values(CampaignStatus).map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`block w-full text-left px-4 py-2 text-sm ${status === currentStatus
                                        ? `${getStatusColor(status)} font-bold`
                                        : 'text-white hover:bg-pure-dark'
                                    }`}
                                disabled={status === currentStatus}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusMenu;