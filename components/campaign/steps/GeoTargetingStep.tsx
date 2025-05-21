'use client';

import { useCampaignForm } from '@/contexts/CampaignFormContext';
import FormNavigation from '../FormNavigation';
import ZoneSelector from '@/components/campaign/ZoneSelector';

const GeoTargetingStep: React.FC = () => {
    const { formState, setField } = useCampaignForm();

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-6">Geo-Targeting</h2>

            <div className="space-y-6">
                <p className="text-gray-400">
                    Select geographic areas where you want your campaign to be shown.
                    You can choose from your saved zones or create new ones.
                </p>

                <ZoneSelector 
                    selectedZones={formState.geoZones}
                    onZoneSelectionChange={(zones) => setField('geoZones', zones)}
                />
            </div>

            <FormNavigation />
        </div>
    );
};

export default GeoTargetingStep;