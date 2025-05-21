'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageContainer from '@/components/PageContainer';
import GoogleMapComponent from '@/components/maps/GoogleMapComponent';
import DrawingTools from '@/components/maps/DrawingTools';
import ZoneForm from '@/components/maps/ZoneForm';
import ZoneUsageStats from '@/components/maps/ZoneUsageStats';
import { GeoZone, GeoZoneType } from '@/types/models';

export default function GeoFencing() {
    const [activeTab, setActiveTab] = useState('map');
    const [savedZones, setSavedZones] = useState<GeoZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [drawingMode, setDrawingMode] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<GeoZone | null>(null);
    const [editZone, setEditZone] = useState<GeoZone | null>(null);
    const [newZoneData, setNewZoneData] = useState<Partial<GeoZone>>({
        name: '',
        type: GeoZoneType.CIRCLE
    });

    // Fetch saved zones on component mount
    useEffect(() => {
        fetchZones();
    }, []);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [successMessage]);

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
                setSavedZones(data.data);
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

    const handleZoneCreated = (zone: Partial<GeoZone>) => {
        setNewZoneData({
            ...newZoneData,
            ...zone
        });
    };

    const handleSaveZone = async (data: Partial<GeoZone>) => {
        try {
            setFormLoading(true);
            setError(null);

            const response = await fetch('/api/geo-zones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create geo zone');
            }

            const responseData = await response.json();

            // Add new zone to list
            setSavedZones([responseData.data, ...savedZones]);

            // Reset form
            setNewZoneData({
                name: '',
                type: GeoZoneType.CIRCLE
            });

            setSuccessMessage('Geo zone created successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while saving the zone');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateZone = async (data: Partial<GeoZone>) => {
        if (!editZone?.id) return;

        try {
            setFormLoading(true);
            setError(null);

            const response = await fetch(`/api/geo-zones/${editZone.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update geo zone');
            }

            // Refresh zones
            await fetchZones();

            // Reset edit mode
            setEditZone(null);

            setSuccessMessage('Geo zone updated successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while updating the zone');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteZone = async (zoneId: string) => {
        if (!window.confirm('Are you sure you want to delete this zone?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/geo-zones/${zoneId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete geo zone');
            }

            // Remove zone from list
            setSavedZones(savedZones.filter(zone => zone.id !== zoneId));

            setSuccessMessage('Geo zone deleted successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while deleting the zone');
        } finally {
            setLoading(false);
        }
    };

    const handleEditZone = (zone: GeoZone) => {
        setEditZone(zone);
        setActiveTab('map');
    };

    // Helper function to format radius for display
    const formatRadius = (radiusKm?: number) => {
        if (!radiusKm) return 'N/A';
        return `${radiusKm} km`;
    };

    // Helper function to format polygon points for display
    const formatPoints = (points?: { lat: number; lng: number }[]) => {
        if (!points) return 'N/A';
        return `${points.length} points`;
    };

    return (
        <PageContainer title="Geo-Fencing">
            {/* Success and error messages */}
            {successMessage && (
                <motion.div
                    className="bg-green-900 bg-opacity-50 text-green-200 p-4 rounded-lg mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p>{successMessage}</p>
                </motion.div>
            )}

            {error && (
                <motion.div
                    className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p>{error}</p>
                    <button
                        className="text-red-200 underline mt-2"
                        onClick={() => setError(null)}
                    >
                        Dismiss
                    </button>
                </motion.div>
            )}

            <div className="flex mb-6">
                <button
                    onClick={() => setActiveTab('map')}
                    className={`px-4 py-2 rounded-tl-lg rounded-bl-lg ${activeTab === 'map' ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                        }`}
                >
                    Map View
                </button>
                <button
                    onClick={() => {
                        setActiveTab('zones');
                        setEditZone(null);
                    }}
                    className={`px-4 py-2 rounded-tr-lg rounded-br-lg ${activeTab === 'zones' ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                        }`}
                >
                    Saved Zones
                </button>
            </div>

            {activeTab === 'map' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="card h-96">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium">
                                    {editZone ? `Edit Zone: ${editZone.name}` : 'Create Geo-Fence'}
                                </h3>
                                {!editZone && <DrawingTools drawingMode={drawingMode} setDrawingMode={setDrawingMode} />}
                            </div>
                            <div className="h-72 bg-pure-dark rounded-lg">
                                <GoogleMapComponent
                                    onZoneCreated={handleZoneCreated}
                                    savedZones={savedZones}
                                    onEditZone={setSelectedZone}
                                    drawingMode={drawingMode}
                                    setDrawingMode={setDrawingMode}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card h-auto">
                        <h3 className="text-lg font-medium mb-4">Zone Settings</h3>
                        {editZone ? (
                            <>
                                <ZoneForm
                                    zoneData={editZone}
                                    onSubmit={handleUpdateZone}
                                    isLoading={formLoading}
                                    onCancel={() => setEditZone(null)}
                                    isEdit={true}
                                />

                                {editZone.id && editZone.campaigns && editZone.campaigns > 0 && (
                                    <div className="mt-6 pt-6 border-t border-pure-dark">
                                        <ZoneUsageStats zoneId={editZone.id} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <ZoneForm
                                zoneData={newZoneData}
                                onSubmit={handleSaveZone}
                                isLoading={formLoading}
                                onCancel={() => {
                                    setNewZoneData({
                                        name: '',
                                        type: GeoZoneType.CIRCLE
                                    });
                                    setDrawingMode(null);
                                }}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-pure-light-dark rounded-lg overflow-hidden">
                    <div className="p-4 flex justify-between items-center">
                        <h3 className="text-lg font-medium">Your Saved Zones</h3>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setActiveTab('map');
                                setEditZone(null);
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 inline"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            New Zone
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pure-primary"></div>
                        </div>
                    ) : savedZones.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            No saved zones found. Create your first zone using the map view.
                        </div>
                    ) : (
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Linked Campaigns
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-pure-dark">
                                    {savedZones.map((zone, index) => (
                                        <motion.tr
                                            key={zone.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">{zone.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${zone.type === GeoZoneType.CIRCLE ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
                                                        }`}
                                                >
                                                    {zone.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {zone.type === GeoZoneType.CIRCLE ? formatRadius(zone.radiusKm) : formatPoints(zone.points)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {zone.campaigns > 0 ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-200">
                                                        {zone.campaigns} {zone.campaigns === 1 ? 'campaign' : 'campaigns'}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">None</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    className="text-pure-primary hover:text-pure-secondary mr-4"
                                                    onClick={() => handleEditZone(zone)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="text-red-400 hover:text-red-300"
                                                    onClick={() => zone.id && handleDeleteZone(zone.id)}
                                                    disabled={loading || (zone.campaigns && zone.campaigns > 0)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}