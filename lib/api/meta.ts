import { Campaign, GeoZone, GeoZoneType, Platform, PlatformName } from '@/types/models';

// Meta API configuration
const META_API_VERSION = 'v22.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Types for Meta API
export interface MetaAuthResult {
    accessToken: string;
    expiresIn: number;
    platformAccountId: string;
    platformName: PlatformName;
}

export interface MetaAdCreative {
    title: string;
    body: string;
    imageUrl?: string;
    videoUrl?: string;
    callToAction?: {
        type: string;
        value: {
            link: string;
        };
    };
}

export interface MetaCampaignResult {
    id: string;
    name: string;
    status: string;
    objective: string;
    created_time: string;
}

export interface MetaAdSetResult {
    id: string;
    name: string;
    campaign_id: string;
    targeting: any;
    status: string;
    daily_budget: number;
    start_time: string;
    end_time?: string;
}

export interface MetaAdResult {
    id: string;
    name: string;
    adset_id: string;
    creative: any;
    status: string;
}

export interface MetaAdsInsightsResult {
    impressions: string;
    clicks: string;
    reach: string;
    spend: string;
    cpc: string;
    ctr: string;
    conversions: string;
    date_start: string;
    date_stop: string;
}

// Campaign objectives mapping
const CAMPAIGN_OBJECTIVES: Record<string, string> = {
    AWARENESS: 'BRAND_AWARENESS',
    CONSIDERATION: 'TRAFFIC',
    CONVERSION: 'CONVERSIONS',
};

// Auth functions
export async function authenticateWithMeta(code: string, redirectUri: string): Promise<MetaAuthResult> {
    try {
        // Exchange code for access token
        const tokenResponse = await fetch(`${META_BASE_URL}/oauth/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: redirectUri,
                code,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error(`Failed to authenticate with Meta: ${await tokenResponse.text()}`);
        }

        const tokenData = await tokenResponse.json();

        // Get user accounts (ad accounts)
        const accountsResponse = await fetch(`${META_BASE_URL}/me/adaccounts?access_token=${tokenData.access_token}`);

        if (!accountsResponse.ok) {
            throw new Error(`Failed to fetch ad accounts: ${await accountsResponse.text()}`);
        }

        const accountsData = await accountsResponse.json();

        if (!accountsData.data || accountsData.data.length === 0) {
            throw new Error('No ad accounts found for this user');
        }

        // Use the first ad account
        const adAccountId = accountsData.data[0].id;

        return {
            accessToken: tokenData.access_token,
            expiresIn: tokenData.expires_in,
            platformAccountId: adAccountId,
            platformName: PlatformName.FACEBOOK, // Default to Facebook, can be updated later
        };
    } catch (error) {
        console.error('Meta authentication error:', error);
        throw error;
    }
}

// Campaign creation functions
export async function createMetaCampaign(
    platform: Platform,
    campaign: Campaign,
    objective: string = 'CONSIDERATION'
): Promise<MetaCampaignResult> {
    try {
        const response = await fetch(`${META_BASE_URL}/${platform.accountId}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: campaign.name,
                objective: CAMPAIGN_OBJECTIVES[objective] || CAMPAIGN_OBJECTIVES.CONSIDERATION,
                status: campaign.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
                special_ad_categories: [],
                access_token: platform.accessToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create Meta campaign: ${await response.text()}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Meta campaign creation error:', error);
        throw error;
    }
}

// Ad Set creation (targeting)
export async function createMetaAdSet(
    platform: Platform,
    campaignId: string,
    campaign: Campaign,
    geoZones: GeoZone[] = []
): Promise<MetaAdSetResult> {
    try {
        // Prepare start and end dates
        const startDate = campaign.startDate ? new Date(campaign.startDate) : new Date();
        const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

        // Format dates for Meta API
        const startTime = startDate.toISOString();
        const endTime = endDate ? endDate.toISOString() : null;

        // Prepare geographic targeting based on geo zones
        const geoTargeting = prepareGeoTargeting(geoZones);

        // Convert budget to cents (Meta API accepts budget in cents)
        const dailyBudget = Math.round(campaign.budget * 100);

        const response = await fetch(`${META_BASE_URL}/${platform.accountId}/adsets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: `${campaign.name} - Ad Set`,
                campaign_id: campaignId,
                billing_event: 'IMPRESSIONS',
                optimization_goal: 'REACH',
                bid_amount: 2, // Default bid amount
                daily_budget: dailyBudget,
                targeting: geoTargeting,
                status: campaign.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
                start_time: startTime,
                end_time: endTime,
                access_token: platform.accessToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create Meta ad set: ${await response.text()}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Meta ad set creation error:', error);
        throw error;
    }
}

// Ad creative creation
export async function createMetaAdCreative(
    platform: Platform,
    campaign: Campaign,
    creative: MetaAdCreative
): Promise<any> {
    try {
        const response = await fetch(`${META_BASE_URL}/${platform.accountId}/adcreatives`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: `${campaign.name} - Creative`,
                object_story_spec: {
                    page_id: platform.accountId,
                    link_data: {
                        message: creative.body,
                        link: creative.callToAction?.value.link || 'https://example.com',
                        name: creative.title,
                        image_hash: creative.imageUrl ? await uploadImageToMeta(platform, creative.imageUrl) : undefined,
                        call_to_action: creative.callToAction ? {
                            type: creative.callToAction.type,
                            value: creative.callToAction.value
                        } : undefined,
                    },
                },
                access_token: platform.accessToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create Meta ad creative: ${await response.text()}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Meta ad creative creation error:', error);
        throw error;
    }
}

// Ad creation
export async function createMetaAd(
    platform: Platform,
    campaign: Campaign,
    adSetId: string,
    creativeId: string
): Promise<MetaAdResult> {
    try {
        const response = await fetch(`${META_BASE_URL}/${platform.accountId}/ads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: `${campaign.name} - Ad`,
                adset_id: adSetId,
                creative: { creative_id: creativeId },
                status: campaign.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
                access_token: platform.accessToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create Meta ad: ${await response.text()}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Meta ad creation error:', error);
        throw error;
    }
}

// Helper function to upload image to Meta
async function uploadImageToMeta(platform: Platform, imageUrl: string): Promise<string> {
    try {
        // Download the image first (if it's a remote URL)
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();

        // Upload to Meta
        const formData = new FormData();
        formData.append('access_token', platform.accessToken);
        formData.append('image', new Blob([imageBuffer]));

        const response = await fetch(`${META_BASE_URL}/${platform.accountId}/adimages`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload image to Meta: ${await response.text()}`);
        }

        const data = await response.json();

        // Return the image hash
        return data.images.bytes ? Object.keys(data.images.bytes)[0] : '';
    } catch (error) {
        console.error('Meta image upload error:', error);
        throw error;
    }
}

// Helper function to prepare geo targeting from geo zones
function prepareGeoTargeting(geoZones: GeoZone[]): any {
    if (!geoZones || geoZones.length === 0) {
        return {}; // No geo targeting
    }

    const locations: any[] = [];

    geoZones.forEach(zone => {
        if (zone.type === GeoZoneType.CIRCLE && zone.centerLat && zone.centerLng && zone.radiusKm) {
            // For circle type geo zones
            locations.push({
                latitude: zone.centerLat,
                longitude: zone.centerLng,
                radius: zone.radiusKm * 1000, // Convert km to meters
                distance_unit: 'meter',
            });
        } else if (zone.type === GeoZoneType.POLYGON && zone.points && zone.points.length > 0) {
            // For polygon type geo zones - Meta doesn't directly support polygons,
            // so we need to convert to a collection of points or use geo_markets
            const polygonPoints = zone.points.map(point => ({
                latitude: point.lat,
                longitude: point.lng,
                radius: 1000, // 1km radius around each point
                distance_unit: 'meter',
            }));

            locations.push(...polygonPoints);
        }
    });

    return {
        geo_locations: {
            custom_locations: locations,
        },
    };
}

// Campaign metrics fetching
export async function fetchCampaignInsights(
    platform: Platform,
    campaignId: string,
    timeRange: { since: string; until: string } = { since: '7d', until: 'yesterday' }
): Promise<MetaAdsInsightsResult[]> {
    try {
        const response = await fetch(
            `${META_BASE_URL}/${campaignId}/insights?time_range={"since":"${timeRange.since}","until":"${timeRange.until}"}&fields=impressions,clicks,reach,spend,cpc,ctr,conversions&access_token=${platform.accessToken}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch campaign insights: ${await response.text()}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Meta insights fetching error:', error);
        throw error;
    }
}