const { GoogleAdsService } = require('../services/googleAdsService');
const { logger } = require('../utils/logger');

class GoogleAdsController {
  constructor() {
    this.googleAdsService = new GoogleAdsService();
  }

  async updateBidAndBudget(req, res) {
    try {
      const { campaignId, newBid, newBudget } = req.body;
      const result = await this.googleAdsService.updateBidAndBudget(campaignId, newBid, newBudget);
      res.json(result);
    } catch (error) {
      logger.error('Error updating bid and budget:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getBidAndBudgetStatus(req, res) {
    try {
      const { campaignId } = req.query;
      const status = await this.googleAdsService.getBidAndBudgetStatus(campaignId);
      res.json(status);
    } catch (error) {
      logger.error('Error getting bid and budget status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCampaignPerformance(req, res) {
    try {
      const { campaignId, dateRange } = req.query;
      const performance = await this.googleAdsService.getCampaignPerformance(campaignId, dateRange);
      res.json(performance);
    } catch (error) {
      logger.error('Error getting campaign performance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCampaignMetrics(req, res) {
    try {
      const { campaignId, metrics } = req.query;
      const campaignMetrics = await this.googleAdsService.getCampaignMetrics(campaignId, metrics);
      res.json(campaignMetrics);
    } catch (error) {
      logger.error('Error getting campaign metrics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCreativePerformance(req, res) {
    try {
      const { creativeId, dateRange } = req.query;
      const performance = await this.googleAdsService.getCreativePerformance(creativeId, dateRange);
      res.json(performance);
    } catch (error) {
      logger.error('Error getting creative performance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCreativeMetrics(req, res) {
    try {
      const { creativeId, metrics } = req.query;
      const creativeMetrics = await this.googleAdsService.getCreativeMetrics(creativeId, metrics);
      res.json(creativeMetrics);
    } catch (error) {
      logger.error('Error getting creative metrics:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = { GoogleAdsController }; 