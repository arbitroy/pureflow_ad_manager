'use client';

import { useEffect, useState } from 'react';
import { useCampaignForm } from '@/contexts/CampaignFormContext';
import FormNavigation from '../FormNavigation';
import { GeoZone, GeoZoneType } from '@/types/models';
import { motion } from 'framer-motion';

const GeoTargetingStep: React.FC = () => {
    const { formState, setField } = useCampaignForm();
    const [savedZones, setSavedZones] = useState<GeoZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);

    // Fetch saved geo zones on component mount
    useEffect(() => {
        const fetchGeoZones = async () => {
            setIsLoading(true);
            try {
                // In a real app, we would fetch from the API
                // For now, use mock data with a delay to simulate loading
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockGeoZones: GeoZone[] = [
                    {
                        id: '1',
                        name: 'Downtown',
                        type: GeoZoneType.CIRCLE,
                        centerLat: 40.7128,
                        centerLng: -74.0060,
                        radiusKm: 2.5,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: '1'
                    },
                    {
                        id: '2',
                        name: 'Shopping District',
                        type: GeoZoneType.POLYGON,
                        points: [
                            { lat: 40.7400, lng: -73.9900 },
                            { lat: 40.7450, lng: -73.9850 },
                            { lat: 40.7400, lng: -73.9800 },
                            { lat: 40.7350, lng: -73.9850 }
                        ],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: '1'
                    },
                    {
                        id: '3',
                        name: 'University Area',
                        type: GeoZoneType.CIRCLE,
                        centerLat: 40.7282,
                        centerLng: -73.9942,
                        radiusKm: 1.8,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: '1'
                    }
                ];

                setSavedZones(mockGeoZones);
            } catch (error) {
                console.error('Error fetching geo zones:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGeoZones();
    }, []);

    const toggleZoneSelection = (zone: GeoZone) => {
        const zoneIndex = formState.geoZones.findIndex(z => z.id === zone.id);

        if (zoneIndex === -1) {
            // Add zone
            setField('geoZones', [...formState.geoZones, zone]);
        } else {
            // Remove zone
            const updatedZones = [...formState.geoZones];
            updatedZones.splice(zoneIndex, 1);
            setField('geoZones', updatedZones);
        }
    };

    const isZoneSelected = (zoneId: string) => {
        return formState.geoZones.some(z => z.id === zoneId);
    };

    // Format radius for display
    const formatRadius = (radiusKm?: number) => {
        if (!radiusKm) return 'N/A';
        return `${radiusKm} km`;
    };

    // Format polygon points for display
    const formatPoints = (points?: { lat: number; lng: number }[]) => {
        if (!points) return 'N/A';
        return `${points.length} points`;
    };

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-6">Geo-Targeting</h2>

            <div className="space-y-6">
                <p className="text-gray-400">
                    Select geographic areas where you want your campaign to be shown.
                    You can choose from your saved zones or create new ones.
                </p>

                <div className="flex justify-between">
                    <button
                        type="button"
                        className={`px-4 py-2 rounded-lg ${!showMap ? 'bg-pure-primary text-white' : 'bg-pure-dark text-gray-300'
                            }`}
                        onClick={() => setShowMap(false)}
                    >
                        Saved Zones
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 rounded-lg ${showMap ? 'bg-pure-primary text-white' : 'bg-pure-dark text-gray-300'
                            }`}
                        onClick={() => setShowMap(true)}
                    >
                        Create New Zone
                    </button>
                </div>

                {showMap ? (
                    <div className="h-96 bg-pure-dark rounded-lg flex flex-col items-center justify-center">
                        <p className="text-gray-400 mb-4">Google Maps would be integrated here.</p>
                        <p className="text-gray-400 text-sm">
                            Draw a circle or polygon on the map to create a new geo-targeting zone.
                        </p>
                    </div>
                ) : (
                    <div>
                        {isLoading ? (
                            <div className="h-52 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pure-primary"></div>
                            </div>
                        ) : (
                            <>
                                {savedZones.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-gray-400">No saved zones found. Create a new zone to get started.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {savedZones.map(zone => (
                                            <ZoneCard
                                                key={zone.id}
                                                zone={zone}
                                                isSelected={isZoneSelected(zone.id)}
                                                onToggle={() => toggleZoneSelection(zone)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div className="px-4 py-3 bg-pure-dark rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-white font-medium">
                                {formState.geoZones.length} {formState.geoZones.length === 1 ? 'zone' : 'zones'} selected
                            </span>
                        </div>

                        {formState.geoZones.length > 0 && (
                            <button
                                type="button"
                                className="text-red-400 hover:text-red-300 text-sm"
                                onClick={() => setField('geoZones', [])}
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <FormNavigation />
        </div>
    );
};

interface ZoneCardProps {
    zone: GeoZone;
    isSelected: boolean;
    onToggle: () => void;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, isSelected, onToggle }) => {
    return (
        <motion.div
            className={`p-4 border rounded-lg cursor-pointer ${isSelected ? 'border-pure-primary bg-pure-primary bg-opacity-10' : 'border-pure-dark'
                }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onToggle}
        >
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-medium text-white">{zone.name}</h3>
                    <div className="flex space-x-3 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${zone.type === GeoZoneType.CIRCLE
                                ? 'bg-blue-900 text-blue-200'
                                : 'bg-purple-900 text-purple-200'
                            }`}>
                            {zone.type}
                        </span>
                        <span className="text-sm text-gray-400">
                            {zone.type === GeoZoneType.CIRCLE
                                ? `Radius: ${zone.radiusKm} km`
                                : `${zone.points?.length || 0} points`}
                        </span>
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }} // Handling in the outer div click
                        className="h-5 w-5 text-pure-primary bg-pure-dark border-gray-600 rounded"
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default GeoTargetingStep;