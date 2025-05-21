'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GeoZone, GeoZoneType } from '@/types/models';
import GoogleMapComponent from '@/components/maps/GoogleMapComponent';

interface ZoneSelectorProps {
    selectedZones: GeoZone[];
    onZoneSelectionChange: (zones: GeoZone[]) => void;
}

const ZoneSelector: React.FC<ZoneSelectorProps> = ({
    selectedZones,
    onZoneSelectionChange
}) => {
    const [zones, setZones] = useState<GeoZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);

    // Fetch zones on component mount
    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/geo-zones');

            if (!response.ok) {
                throw new Error('Failed to fetch geo zones');
            }

            const data = await response.json();

            if (data.success) {
                setZones(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch geo zones');
            }
        } catch (err) {
            console.error('Error fetching geo zones:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching zones');
        } finally {
            setLoading(false);
        }
    };

    const toggleZoneSelection = (zone: GeoZone) => {
        const isSelected = selectedZones.some(z => z.id === zone.id);

        if (isSelected) {
            // Remove zone
            onZoneSelectionChange(selectedZones.filter(z => z.id !== zone.id));
        } else {
            // Add zone
            onZoneSelectionChange([...selectedZones, zone]);
        }
    };

    const isZoneSelected = (zoneId: string) => {
        return selectedZones.some(zone => zone.id === zoneId);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Geographic Targeting</h3>
                <button
                    type="button"
                    className="text-pure-primary hover:text-pure-secondary text-sm"
                    onClick={() => setShowMap(!showMap)}
                >
                    {showMap ? 'Hide Map' : 'Show Map'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-900 bg-opacity-50 text-red-200 rounded">
                    <p>{error}</p>
                </div>
            )}

            {showMap && (
                <div className="h-64 bg-pure-dark rounded-lg overflow-hidden">
                    <GoogleMapComponent
                        savedZones={zones}
                        readOnly={true}
                    />
                </div>
            )}

            {loading ? (
                <div className="h-52 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pure-primary"></div>
                </div>
            ) : zones.length === 0 ? (
                <div className="p-8 text-center">
                    <p className="text-gray-400 mb-3">No saved zones found.</p>
                    <Link
                        href="/geo-fencing"
                        className="px-4 py-2 bg-pure-primary text-white rounded-lg hover:bg-opacity-80"
                    >
                        Create New Zone
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zones.map(zone => (
                        <motion.div
                            key={zone.id}
                            className={`p-4 border rounded-lg cursor-pointer ${isZoneSelected(zone.id)
                                    ? 'border-pure-primary bg-pure-primary bg-opacity-10'
                                    : 'border-pure-dark'
                                }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => toggleZoneSelection(zone)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium text-white">{zone.name}</h4>
                                    <div className="flex space-x-3 mt-1">
                                        <span className={`px-2 py-1 text-xs rounded-full ${zone.type === GeoZoneType.CIRCLE
                                                ? 'bg-blue-900 text-blue-200'
                                                : 'bg-purple-900 text-purple-200'
                                            }`}>
                                            {zone.type}
                                        </span>
                                        <span className="text-sm text-gray-400">
                                            {zone.type === GeoZoneType.CIRCLE
                                                ? `Radius: ${formatRadius(zone.radiusKm)}`
                                                : `${formatPoints(zone.points)} points`
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isZoneSelected(zone.id)}
                                        onChange={() => { }} // Handling in the outer div click
                                        className="h-5 w-5 text-pure-primary bg-pure-dark border-gray-600 rounded"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="px-4 py-3 bg-pure-dark rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-white font-medium">
                            {selectedZones.length} {selectedZones.length === 1 ? 'zone' : 'zones'} selected
                        </span>
                    </div>

                    {selectedZones.length > 0 && (
                        <button
                            type="button"
                            className="text-red-400 hover:text-red-300 text-sm"
                            onClick={() => onZoneSelectionChange([])}
                        >
                            Clear Selection
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ZoneSelector;