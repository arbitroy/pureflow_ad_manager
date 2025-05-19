'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/PageContainer';
import CampaignForm from '@/components/campaign/CampaignForm';
import { CampaignFormState } from '@/contexts/CampaignFormContext';
import { Campaign } from '@/types/models';
import { use } from 'react';

interface EditCampaignPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditCampaign({ params }: EditCampaignPageProps) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<Campaign | null>(null);

    // Fetch campaign data
    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const response = await fetch(`/api/campaigns/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch campaign');
                }

                const result = await response.json();

                if (result.success && result.data) {
                    // Convert dates to Date objects
                    const campaignData = result.data;
                    if (campaignData.startDate) {
                        campaignData.startDate = new Date(campaignData.startDate);
                    }
                    if (campaignData.endDate) {
                        campaignData.endDate = new Date(campaignData.endDate);
                    }

                    setCampaign(campaignData);
                } else {
                    throw new Error(result.message || 'Campaign not found');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error('Error fetching campaign:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [id]);

    const handleSubmit = async (data: CampaignFormState) => {
        try {
            const response = await fetch(`/api/campaigns/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update campaign');
            }

            // Handle successful update
            const result = await response.json();

            // Redirect to campaigns page
            router.push('/campaigns');

            // Show success message (could use a toast notification in a real app)
            console.log('Campaign updated successfully:', result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error updating campaign:', err);
        }
    };

    if (loading) {
        return (
            <PageContainer title="Edit Campaign">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pure-primary"></div>
                </div>
            </PageContainer>
        );
    }

    if (error || !campaign) {
        return (
            <PageContainer title="Edit Campaign">
                <div className="p-6 bg-red-900 bg-opacity-50 text-red-200 rounded-lg">
                    {error || 'Campaign not found'}
                </div>
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => router.push('/campaigns')}
                        className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80 transition-colors"
                    >
                        Back to Campaigns
                    </button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title={`Edit Campaign: ${campaign.name}`}>
            {error && (
                <div className="mb-6 p-4 bg-red-900 bg-opacity-50 text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            <CampaignForm
                initialData={campaign as CampaignFormState}
                onSubmit={handleSubmit}
            />
        </PageContainer>
    );
} 