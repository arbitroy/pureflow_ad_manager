import { Platform, Campaign, CampaignStatus } from '@/types/models';
import { fetchCampaignInsights } from './meta';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Interface for Meta campaign metadata
interface MetaCampaignMetadata {
    metaCampaignId: string;
    metaAdSetId: string;
    metaAdId: string;
    platform: string;
}

// Function to update campaign status
export async function updateCampaignStatus(campaignId: string, newStatus: CampaignStatus): Promise<boolean> {
    try {
        await pool.query(
            'UPDATE campaigns SET status = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, campaignId]
        );
        return true;
    } catch (error) {
        console.error('Error updating campaign status:', error);
        return false;
    }
}

// Function to store Meta campaign metadata
export async function storeMetaCampaignMetadata(
    campaignId: string,
    metadata: MetaCampaignMetadata
): Promise<boolean> {
    try {
        // First check if metadata already exists
        const [existingRows] = await pool.query(
            'SELECT id FROM meta_campaign_metadata WHERE campaign_id = ? AND platform = ?',
            [campaignId, metadata.platform]
        );

        if ((existingRows as any[]).length > 0) {
            // Update existing record
            await pool.query(
                `UPDATE meta_campaign_metadata 
         SET meta_campaign_id = ?, meta_adset_id = ?, meta_ad_id = ?, updated_at = NOW()
         WHERE campaign_id = ? AND platform = ?`,
                [
                    metadata.metaCampaignId,
                    metadata.metaAdSetId,
                    metadata.metaAdId,
                    campaignId,
                    metadata.platform
                ]
            );
        } else {
            // Insert new record
            await pool.query(
                `INSERT INTO meta_campaign_metadata 
         (id, campaign_id, meta_campaign_id, meta_adset_id, meta_ad_id, platform, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    uuidv4(),
                    campaignId,
                    metadata.metaCampaignId,
                    metadata.metaAdSetId,
                    metadata.metaAdId,
                    metadata.platform,
                    new Date(),
                    new Date()
                ]
            );
        }

        return true;
    } catch (error) {
        console.error('Error storing Meta campaign metadata:', error);
        return false;
    }
}

// Function to sync campaign metrics
export async function syncCampaignMetrics(campaign: Campaign): Promise<boolean> {
    try {
        // Get connected platforms for this campaign
        const platforms = campaign.platforms || [];

        // For each platform, fetch and store metrics
        for (const platform of platforms) {
            // Get Meta campaign metadata
            const [metadataRows] = await pool.query(
                'SELECT * FROM meta_campaign_metadata WHERE campaign_id = ? AND platform = ?',
                [campaign.id, platform.name]
            );

            const metadataList = metadataRows as any[];

            if (metadataList.length === 0) {
                console.warn(`No Meta metadata found for campaign ${campaign.id} on platform ${platform.name}`);
                continue;
            }

            const metadata = metadataList[0];

            // Fetch insights from Meta API
            const insights = await fetchCampaignInsights(platform, metadata.meta_campaign_id);

            // Store insights in database
            for (const insight of insights) {
                const analyticsId = uuidv4();

                await pool.query(
                    `INSERT INTO analytics 
           (id, campaign_id, platform, impressions, clicks, conversions, cost, roi, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           impressions = ?, clicks = ?, conversions = ?, cost = ?, roi = ?`,
                    [
                        analyticsId,
                        campaign.id,
                        platform.name,
                        parseInt(insight.impressions) || 0,
                        parseInt(insight.clicks) || 0,
                        parseInt(insight.conversions) || 0,
                        parseFloat(insight.spend) || 0,
                        calculateROI(parseFloat(insight.spend), parseInt(insight.conversions)),
                        insight.date_start,

                        // For the ON DUPLICATE KEY UPDATE part
                        parseInt(insight.impressions) || 0,
                        parseInt(insight.clicks) || 0,
                        parseInt(insight.conversions) || 0,
                        parseFloat(insight.spend) || 0,
                        calculateROI(parseFloat(insight.spend), parseInt(insight.conversions))
                    ]
                );
            }
        }

        return true;
    } catch (error) {
        console.error('Error syncing campaign metrics:', error);
        return false;
    }
}

// Helper function to calculate ROI
function calculateROI(spend: number, conversions: number, valuePerConversion = 100): number {
    if (spend <= 0) return 0;

    const revenue = conversions * valuePerConversion;
    const roi = ((revenue - spend) / spend) * 100;

    return Math.max(0, roi); // Ensure ROI is not negative
}

// Function to sync all active campaigns
export async function syncAllActiveCampaigns(): Promise<void> {
    try {
        // Get all active campaigns
        const [campaignRows] = await pool.query(
            'SELECT * FROM campaigns WHERE status = ?',
            [CampaignStatus.ACTIVE]
        );

        const campaigns = campaignRows as any[];

        // For each campaign, get platforms and sync metrics
        for (const campaignData of campaigns) {
            const campaign: Campaign = {
                id: campaignData.id,
                name: campaignData.name,
                description: campaignData.description,
                status: campaignData.status,
                budget: campaignData.budget,
                startDate: campaignData.start_date ? new Date(campaignData.start_date) : undefined,
                endDate: campaignData.end_date ? new Date(campaignData.end_date) : undefined,
                platforms: [],
                geoZones: [],
                createdAt: new Date(campaignData.created_at),
                updatedAt: new Date(campaignData.updated_at),
                createdBy: campaignData.created_by
            };

            // Get platforms for this campaign
            const [platformRows] = await pool.query(
                `SELECT p.* FROM platforms p
         JOIN campaign_platforms cp ON p.id = cp.platform_id
         WHERE cp.campaign_id = ?`,
                [campaign.id]
            );

            campaign.platforms = (platformRows as any[]).map(p => ({
                id: p.id,
                name: p.name,
                accountId: p.account_id,
                accessToken: p.access_token,
                refreshToken: p.refresh_token,
                tokenExpiry: p.token_expiry ? new Date(p.token_expiry) : undefined,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at)
            }));

            // Sync metrics for this campaign
            await syncCampaignMetrics(campaign);
        }
    } catch (error) {
        console.error('Error syncing all active campaigns:', error);
    }
}