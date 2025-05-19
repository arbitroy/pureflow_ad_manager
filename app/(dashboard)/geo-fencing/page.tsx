'use client';

import PageContainer from '@/components/PageContainer';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function GeoFencing() {
    const [activeTab, setActiveTab] = useState('map');
    const [savedZones, setSavedZones] = useState([
        { id: 1, name: 'Downtown', type: 'Circle', radius: '2.5 km', campaigns: 2 },
        { id: 2, name: 'Shopping District', type: 'Polygon', points: 6, campaigns: 1 },
        { id: 3, name: 'University Area', type: 'Circle', radius: '1.8 km', campaigns: 0 },
    ]);

    return (
        <PageContainer title="Geo-Fencing">
            <div className="flex mb-6">
                <button
                    onClick={() => setActiveTab('map')}
                    className={`px-4 py-2 rounded-tl-lg rounded-bl-lg ${activeTab === 'map' ? 'bg-pure-primary text-white' : 'bg-pure-light-dark text-gray-300'
                        }`}
                >
                    Map View
                </button>
                <button
                    onClick={() => setActiveTab('zones')}
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
                                <h3 className="text-lg font-medium">Create Geo-Fence</h3>
                                <div className="flex space-x-2">
                                    <button className="bg-pure-dark px-3 py-1 rounded-md text-sm">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 inline mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12a3 3 0 100-6 3 3 0 000 6z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12v-1m0 0V9m0 0h1m-1 0H9m11 3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Circle
                                    </button>
                                    <button className="bg-pure-dark px-3 py-1 rounded-md text-sm">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 inline mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 6h16M4 12h16m-7 6h7"
                                            />
                                        </svg>
                                        Polygon
                                    </button>
                                </div>
                            </div>
                            <div className="h-72 bg-pure-dark rounded-lg flex items-center justify-center text-gray-500">
                                Google Maps implementation here
                            </div>
                        </div>
                    </div>

                    <div className="card h-96">
                        <h3 className="text-lg font-medium mb-4">Zone Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Zone Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                    placeholder="Enter a name for this zone"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Zone Type</label>
                                <select className="w-full bg-pure-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pure-primary">
                                    <option>Circle</option>
                                    <option>Polygon</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Radius (for Circle)</label>
                                <div className="flex">
                                    <input
                                        type="number"
                                        className="flex-1 bg-pure-dark text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-pure-primary"
                                        placeholder="Enter radius"
                                    />
                                    <select className="bg-pure-dark text-white px-4 py-2 rounded-r-lg border-l border-gray-700 focus:outline-none focus:ring-2 focus:ring-pure-primary">
                                        <option>km</option>
                                        <option>miles</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-6">
                                <button className="btn-primary w-full">Save Zone</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-pure-light-dark rounded-lg overflow-hidden">
                    <div className="p-4 flex justify-between items-center">
                        <h3 className="text-lg font-medium">Your Saved Zones</h3>
                        <button className="btn-primary">
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
                                                className={`px-2 py-1 text-xs rounded-full ${zone.type === 'Circle' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
                                                    }`}
                                            >
                                                {zone.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {zone.type === 'Circle' ? zone.radius : `${zone.points} points`}
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
                                            <button className="text-pure-primary hover:text-pure-secondary mr-4">Edit</button>
                                            <button className="text-red-400 hover:text-red-300">Delete</button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}