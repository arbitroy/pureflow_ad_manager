'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/PageContainer';
import CampaignForm from '@/components/campaign/CampaignForm';
import { CampaignFormState } from '@/contexts/CampaignFormContext';

export default function NewCampaign() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: CampaignFormState) => {
        try {
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create campaign');
            }

            // Handle successful creation
            const result = await response.json();

            // Redirect to campaigns page
            router.push('/campaigns');

            // Show success message (could use a toast notification in a real app)
            console.log('Campaign created successfully:', result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error creating campaign:', err);
        }
    };

    return (
        <PageContainer title="Create New Campaign">
            {error && (
                <div className="mb-6 p-4 bg-red-900 bg-opacity-50 text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            <CampaignForm onSubmit={handleSubmit} />
        </PageContainer>
    );
}