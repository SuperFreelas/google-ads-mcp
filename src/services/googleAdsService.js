const { GoogleAdsApi } = require('google-ads-api');
const { logger } = require('../utils/logger');

class GoogleAdsService {
  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });

    // Ensure customer ID is in the correct format (remove any non-numeric characters)
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/\D/g, '');
    logger.info(`Using customer ID: ${customerId}`);

    this.customer = this.client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });
  }

  async updateBidAndBudget(campaignId, newBid, newBudget) {
    try {
      const campaign = await this.customer.campaigns.get(campaignId);
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
      const campaign = await this.customer.campaigns.get(campaignId);
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
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.ctr
        FROM campaign
        WHERE campaign.id = ${campaignId}
        AND segments.date DURING ${dateRange}
      `;

      logger.info(`Executing query: ${query}`);
      const response = await this.customer.query(query);
      logger.info(`Query response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error('Error in getCampaignPerformance:', error);
      throw error;
    }
  }

  async getCampaignMetrics(campaignId, metrics) {
    try {
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          ${metrics.join(',')}
        FROM campaign
        WHERE campaign.id = ${campaignId}
      `;

      const response = await this.customer.query(query);
      return response;
    } catch (error) {
      logger.error('Error in getCampaignMetrics:', error);
      throw error;
    }
  }

  async getCreativePerformance(creativeId, dateRange) {
    try {
      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.ctr
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${creativeId}
        AND segments.date DURING ${dateRange}
      `;

      const response = await this.customer.query(query);
      return response;
    } catch (error) {
      logger.error('Error in getCreativePerformance:', error);
      throw error;
    }
  }

  async getCreativeMetrics(creativeId, metrics) {
    try {
      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ${metrics.join(',')}
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${creativeId}
      `;

      const response = await this.customer.query(query);
      return response;
    } catch (error) {
      logger.error('Error in getCreativeMetrics:', error);
      throw error;
    }
  }

  async listClientAccounts() {
    try {
      const query = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.status
        FROM customer_client
        WHERE customer_client.status = 'ENABLED'
      `;
      
      logger.info(`Executing query to list client accounts: ${query}`);
      const response = await this.customer.query(query);
      logger.info(`Client accounts response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error('Error in listClientAccounts:', error);
      throw error;
    }
  }
}

module.exports = { GoogleAdsService }; 