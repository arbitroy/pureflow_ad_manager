'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { LoadScript } from '@react-google-maps/api';

interface MapsContextType {
    isLoaded: boolean;
}

const MapsContext = createContext<MapsContextType>({ isLoaded: false });

export const useMapsContext = () => useContext(MapsContext);

const libraries = ['drawing', 'geometry', 'places'];

interface MapsProviderProps {
    children: ReactNode;
}

export const MapsProvider: React.FC<MapsProviderProps> = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <MapsContext.Provider value={{ isLoaded }}>
            <LoadScript
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                libraries={libraries as any}
                onLoad={handleLoad}
                loadingElement={<div>Loading Google Maps...</div>}
            >
                {children}
            </LoadScript>
        </MapsContext.Provider>
    );
};