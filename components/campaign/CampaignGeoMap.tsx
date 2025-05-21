'use client';

import { useState } from 'react';
import { GeoZone } from '@/types/models';
import GoogleMapComponent from '@/components/maps/GoogleMapComponent';

interface CampaignGeoMapProps {
    geoZones: GeoZone[];
}

const CampaignGeoMap: React.FC<CampaignGeoMapProps> = ({ geoZones }) => {
    const [showMap, setShowMap] = useState(false);

    if (geoZones.length === 0) {
        return (
            <div className="card p-6">
                <p className="text-center text-gray-400">
                    No geographic targeting specified for this campaign.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Geographic Targeting</h2>
                <button
                    onClick={() => setShowMap(!showMap)}
                    className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                >
                    {showMap ? 'Hide Map' : 'Show Map'}
                </button>
            </div>

            {showMap && (
                <div className="card h-96 overflow-hidden">
                    <GoogleMapComponent savedZones={geoZones} readOnly={true} />
                </div>
            )}

            <div className="bg-pure-light-dark rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-pure-dark">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Zone Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Size
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pure-dark">
                            {geoZones.map((zone, index) => (
                                <tr key={zone.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{zone.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${zone.type === 'CIRCLE' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
                                                }`}
                                        >
                                            {zone.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {zone.type === 'CIRCLE'
                                            ? `${zone.radiusKm} km radius`
                                            : `${zone.points?.length || 0} points polygon`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CampaignGeoMap;