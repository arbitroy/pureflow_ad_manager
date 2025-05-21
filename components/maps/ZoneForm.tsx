'use client';

import { useState, useEffect } from 'react';
import { GeoZone, GeoZoneType } from '@/types/models';

interface ZoneFormProps {
    zoneData: Partial<GeoZone>;
    onSubmit: (data: Partial<GeoZone>) => Promise<void>;
    isLoading: boolean;
    onCancel: () => void;
    isEdit?: boolean;
}

const ZoneForm: React.FC<ZoneFormProps> = ({
    zoneData,
    onSubmit,
    isLoading,
    onCancel,
    isEdit = false
}) => {
    const [zoneName, setZoneName] = useState('');
    const [zoneType, setZoneType] = useState<GeoZoneType>(GeoZoneType.CIRCLE);
    const [centerLat, setCenterLat] = useState<number | undefined>(undefined);
    const [centerLng, setCenterLng] = useState<number | undefined>(undefined);
    const [radiusKm, setRadiusKm] = useState<number | undefined>(undefined);
    const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Initialize form with provided zone data
    useEffect(() => {
        if (zoneData) {
            setZoneName(zoneData.name || '');

            if (zoneData.type) {
                setZoneType(zoneData.type);
            }

            setCenterLat(zoneData.centerLat);
            setCenterLng(zoneData.centerLng);
            setRadiusKm(zoneData.radiusKm);

            if (zoneData.points && zoneData.points.length > 0) {
                setPoints(zoneData.points);
            }
        }
    }, [zoneData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate form
        if (!zoneName.trim()) {
            setError('Zone name is required');
            return;
        }

        if (zoneType === GeoZoneType.CIRCLE) {
            if (!centerLat || !centerLng || !radiusKm) {
                setError('Center coordinates and radius are required for circle zones');
                return;
            }

            if (radiusKm <= 0) {
                setError('Radius must be greater than 0');
                return;
            }
        } else if (zoneType === GeoZoneType.POLYGON) {
            if (!points || points.length < 3) {
                setError('At least 3 points are required for polygon zones');
                return;
            }
        }

        // Prepare data for submission
        const data: Partial<GeoZone> = {
            ...zoneData,
            name: zoneName,
            type: zoneType,
            centerLat: zoneType === GeoZoneType.CIRCLE ? centerLat : undefined,
            centerLng: zoneType === GeoZoneType.CIRCLE ? centerLng : undefined,
            radiusKm: zoneType === GeoZoneType.CIRCLE ? radiusKm : undefined,
            points: zoneType === GeoZoneType.POLYGON ? points : []
        };

        try {
            await onSubmit(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while saving the zone');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-900 bg-opacity-50 text-red-200 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Zone Name
                </label>
                <input
                    type="text"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                    placeholder="Enter a name for this zone"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Zone Type
                </label>
                <select
                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value as GeoZoneType)}
                    disabled={isEdit} // Can't change type when editing
                >
                    <option value={GeoZoneType.CIRCLE}>Circle</option>
                    <option value={GeoZoneType.POLYGON}>Polygon</option>
                </select>
            </div>

            {zoneType === GeoZoneType.CIRCLE && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Center Latitude
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={centerLat !== undefined ? centerLat : ''}
                                onChange={(e) => setCenterLat(parseFloat(e.target.value) || undefined)}
                                className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                placeholder="e.g., 40.7128"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Center Longitude
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={centerLng !== undefined ? centerLng : ''}
                                onChange={(e) => setCenterLng(parseFloat(e.target.value) || undefined)}
                                className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                placeholder="e.g., -74.0060"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Radius (km)
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={radiusKm !== undefined ? radiusKm : ''}
                                onChange={(e) => setRadiusKm(parseFloat(e.target.value) || undefined)}
                                className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                placeholder="Enter radius in kilometers"
                            />
                        </div>
                    </div>
                </>
            )}

            {zoneType === GeoZoneType.POLYGON && (
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Polygon Points ({points.length} points)
                    </label>
                    <div className="bg-pure-dark p-3 rounded-lg text-gray-400 text-sm">
                        {points.length < 3 ? (
                            <p>Draw a polygon on the map to set points.</p>
                        ) : (
                            <p>{points.length} points are set for this polygon.</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-pure-dark text-white rounded-lg hover:bg-opacity-80"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : isEdit ? 'Update Zone' : 'Save Zone'}
                </button>
            </div>
        </form>
    );
};

export default ZoneForm;