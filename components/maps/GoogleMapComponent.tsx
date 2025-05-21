'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, DrawingManager, Circle, Polygon } from '@react-google-maps/api';
import { GeoZone, GeoPoint, GeoZoneType } from '@/types/models';

const libraries = ['drawing', 'geometry', 'places'];

interface GoogleMapComponentProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    onZoneCreated?: (zone: Partial<GeoZone>) => void;
    savedZones?: GeoZone[];
    onEditZone?: (zone: GeoZone) => void;
    drawingMode?: string | null;
    setDrawingMode?: (mode: string | null) => void;
    readOnly?: boolean;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
    center = { lat: 40.7128, lng: -74.0060 }, // Default to New York
    zoom = 12,
    onZoneCreated,
    savedZones = [],
    onEditZone,
    drawingMode,
    setDrawingMode,
    readOnly = false
}) => {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedZone, setSelectedZone] = useState<GeoZone | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
        setMap(null);
    }, []);

    const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
        drawingManagerRef.current = drawingManager;
    }, []);

    const onCircleComplete = useCallback((circle: google.maps.Circle) => {
        if (!onZoneCreated) return;

        const center = circle.getCenter();
        const radius = circle.getRadius() / 1000; // Convert to kilometers

        if (center) {
            onZoneCreated({
                type: GeoZoneType.CIRCLE,
                centerLat: center.lat(),
                centerLng: center.lng(),
                radiusKm: radius
            });
        }

        // Remove the circle from the map, we'll use our own Circle component
        circle.setMap(null);

        // Reset drawing mode
        if (drawingManagerRef.current && setDrawingMode) {
            drawingManagerRef.current.setDrawingMode(null);
            setDrawingMode(null);
        }
    }, [onZoneCreated, setDrawingMode]);

    const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
        if (!onZoneCreated) return;

        const path = polygon.getPath();
        const points: GeoPoint[] = [];

        for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            points.push({
                lat: point.lat(),
                lng: point.lng()
            });
        }

        onZoneCreated({
            type: GeoZoneType.POLYGON,
            points
        });

        // Remove the polygon from the map, we'll use our own Polygon component
        polygon.setMap(null);

        // Reset drawing mode
        if (drawingManagerRef.current && setDrawingMode) {
            drawingManagerRef.current.setDrawingMode(null);
            setDrawingMode(null);
        }
    }, [onZoneCreated, setDrawingMode]);

    // Update drawing mode when it changes
    useEffect(() => {
        if (drawingManagerRef.current) {
            const mode = drawingMode === 'circle'
                ? google.maps.drawing.OverlayType.CIRCLE
                : drawingMode === 'polygon'
                    ? google.maps.drawing.OverlayType.POLYGON
                    : null;

            drawingManagerRef.current.setDrawingMode(mode);
        }
    }, [drawingMode]);

    const handleZoneClick = (zone: GeoZone) => {
        if (readOnly) return;

        setSelectedZone(zone);
        if (onEditZone) {
            onEditZone(zone);
        }
    };

    const containerStyle = {
        width: '100%',
        height: '100%',
        minHeight: '400px'
    };

    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            libraries={libraries as any}
        >
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: true,
                    styles: [
                        {
                            featureType: 'all',
                            elementType: 'all',
                            stylers: [{
                                saturation: -50
                            }]
                        }
                    ]
                }}
            >
                {/* Drawing Manager - only shown when not in read-only mode */}
                {!readOnly && (
                    <DrawingManager
                        onLoad={onDrawingManagerLoad}
                        onCircleComplete={onCircleComplete}
                        onPolygonComplete={onPolygonComplete}
                        options={{
                            drawingControl: false, // We'll use our own UI controls
                            circleOptions: {
                                fillColor: '#3e91ff',
                                fillOpacity: 0.2,
                                strokeColor: '#3e91ff',
                                strokeWeight: 2,
                                editable: true,
                                draggable: true,
                                zIndex: 1
                            },
                            polygonOptions: {
                                fillColor: '#3e91ff',
                                fillOpacity: 0.2,
                                strokeColor: '#3e91ff',
                                strokeWeight: 2,
                                editable: true,
                                draggable: true,
                                zIndex: 1
                            }
                        }}
                    />
                )}

                {/* Render saved zones */}
                {savedZones.map((zone) => {
                    if (zone.type === GeoZoneType.CIRCLE && zone.centerLat && zone.centerLng && zone.radiusKm) {
                        return (
                            <Circle
                                key={zone.id}
                                center={{ lat: zone.centerLat, lng: zone.centerLng }}
                                radius={zone.radiusKm * 1000} // Convert km to meters
                                options={{
                                    fillColor: selectedZone?.id === zone.id ? '#ff762e' : '#3e91ff',
                                    fillOpacity: 0.2,
                                    strokeColor: selectedZone?.id === zone.id ? '#ff762e' : '#3e91ff',
                                    strokeWeight: 2,
                                    zIndex: selectedZone?.id === zone.id ? 2 : 1,
                                    editable: !readOnly && selectedZone?.id === zone.id,
                                    draggable: !readOnly && selectedZone?.id === zone.id
                                }}
                                onClick={() => handleZoneClick(zone)}
                            />
                        );
                    } else if (zone.type === GeoZoneType.POLYGON && zone.points && zone.points.length > 0) {
                        return (
                            <Polygon
                                key={zone.id}
                                paths={zone.points}
                                options={{
                                    fillColor: selectedZone?.id === zone.id ? '#ff762e' : '#3e91ff',
                                    fillOpacity: 0.2,
                                    strokeColor: selectedZone?.id === zone.id ? '#ff762e' : '#3e91ff',
                                    strokeWeight: 2,
                                    zIndex: selectedZone?.id === zone.id ? 2 : 1,
                                    editable: !readOnly && selectedZone?.id === zone.id,
                                    draggable: !readOnly && selectedZone?.id === zone.id
                                }}
                                onClick={() => handleZoneClick(zone)}
                            />
                        );
                    }
                    return null;
                })}
            </GoogleMap>
        </LoadScript>
    );
};

export default GoogleMapComponent;