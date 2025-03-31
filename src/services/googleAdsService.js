const { GoogleAdsApi } = require('google-ads-api');
const { logger } = require('../utils/logger');

class GoogleAdsService {
  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });
  }

  async updateBidAndBudget(campaignId, newBid, newBudget) {
    try {
      const customer = this.client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });

      const campaign = await customer.campaigns.get(campaignId);
      await campaign.update({
        bidding_strategy: {
          manual_cpc: {
            max_cpc_bid_micros: newBid * 1000000 // Convert to micros
          }
        },
        campaign_budget: newBudget
      });

      return { success: true, message: 'Bid and budget updated successfully' };
    } catch (error) {
      logger.error('Error in updateBidAndBudget:', error);
      throw error;
    }
  }

  async getBidAndBudgetStatus(campaignId) {
    try {
      const customer = this.client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });

      const campaign = await customer.campaigns.get(campaignId);
      return {
        currentBid: campaign.bidding_strategy.manual_cpc.max_cpc_bid_micros / 1000000,
        currentBudget: campaign.campaign_budget,
        status: campaign.status
      };
    } catch (error) {
      logger.error('Error in getBidAndBudgetStatus:', error);
      throw error;
    }
  }

  async getCampaignPerformance(campaignId, dateRange) {
    try {
      const customer = this.client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });

      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM campaign
        WHERE campaign.id = ${campaignId}
        AND segments.date DURING ${dateRange}
      `;

      const response = await customer.query(query);
      return response;
    } catch (error) {
      logger.error('Error in getCampaignPerformance:', error);
      throw error;
    }
  }

  async getCampaignMetrics(campaignId, metrics) {
    try {
      const customer = this.client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });

      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          ${metrics.join(', ')}
        FROM campaign
        WHERE campaign.id = ${campaignId}
      `;

      const response = await customer.query(query);
      return response;
    } catch (error) {
      logger.error('Error in getCampaignMetrics:', error);
      throw error;
    }
  }

  async getCreativePerformance(creativeId, dateRange) {
    try {
      const customer = this.client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });

      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${creativeId}
        AND segments.date DURING ${dateRange}
      `;

      const response = await customer.query(query);
      return response;
    } catch (error) {
      logger.error('Error in getCreativePerformance:', error);
      throw error;
    }
  }

  async getCreativeMetrics(creativeId, metrics) {
    try {
      const customer = this.client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });

      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ${metrics.join(', ')}
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${creativeId}
      `;

      const response = await customer.query(query);
      return response;
    } catch (error) {
      logger.error('Error in getCreativeMetrics:', error);
      throw error;
    }
  }
}

module.exports = { GoogleAdsService }; 