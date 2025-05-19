// User types
export interface User {
    password(password: any, password1: any): unknown;
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    MARKETING = 'MARKETING',
}

// Campaign types
export interface Campaign {
    id: string;
    name: string;
    description?: string;
    platforms: Platform[];
    status: CampaignStatus;
    budget: number;
    startDate?: Date;
    endDate?: Date;
    geoZones: GeoZone[];
    analytics?: Analytics;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string; // User ID
}

export enum CampaignStatus {
    DRAFT = 'DRAFT',
    SCHEDULED = 'SCHEDULED',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
}

// Platform types
export interface Platform {
    id: string;
    name: PlatformName;
    accountId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export enum PlatformName {
    FACEBOOK = 'FACEBOOK',
    INSTAGRAM = 'INSTAGRAM',
}

// GeoZone types
export interface GeoZone {
    id: string;
    name: string;
    type: GeoZoneType;
    // For circle
    centerLat?: number;
    centerLng?: number;
    radiusKm?: number;
    // For polygon
    points?: GeoPoint[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string; // User ID
}

export interface GeoPoint {
    lat: number;
    lng: number;
}

export enum GeoZoneType {
    CIRCLE = 'CIRCLE',
    POLYGON = 'POLYGON',
}

// Analytics types
export interface Analytics {
    id: string;
    campaignId: string;
    platform: PlatformName;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    // Derived metrics
    ctr: number; // Click-through rate
    conversionRate: number;
    cpc: number; // Cost per click
    cpa: number; // Cost per acquisition
    roi: number; // Return on investment
    date: Date;
}