const { GoogleAdsService } = require('../services/googleAdsService');
const { logger } = require('../utils/logger');

class GoogleAdsController {
  constructor() {
    this.googleAdsService = new GoogleAdsService();
    // Bind methods to maintain context
    this.updateBidAndBudget = this.updateBidAndBudget.bind(this);
    this.getBidAndBudgetStatus = this.getBidAndBudgetStatus.bind(this);
    this.getCampaignPerformance = this.getCampaignPerformance.bind(this);
    this.getCampaignMetrics = this.getCampaignMetrics.bind(this);
    this.getCreativePerformance = this.getCreativePerformance.bind(this);
    this.getCreativeMetrics = this.getCreativeMetrics.bind(this);
    this.listClientAccounts = this.listClientAccounts.bind(this);
  }

  updateBidAndBudget = async (req, res) => {
    try {
      const { campaignId, newBid, newBudget } = req.body;
      const result = await this.googleAdsService.updateBidAndBudget(campaignId, newBid, newBudget);
      res.json(result);
    } catch (error) {
      logger.error('Error updating bid and budget:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getBidAndBudgetStatus = async (req, res) => {
    try {
      const { campaignId } = req.query;
      const status = await this.googleAdsService.getBidAndBudgetStatus(campaignId);
      res.json(status);
    } catch (error) {
      logger.error('Error getting bid and budget status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getCampaignPerformance = async (req, res) => {
    try {
      const { campaignId, dateRange } = req.query;
      const performance = await this.googleAdsService.getCampaignPerformance(campaignId, dateRange);
      res.json(performance);
    } catch (error) {
      logger.error('Error getting campaign performance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getCampaignMetrics = async (req, res) => {
    try {
      const { campaignId, metrics } = req.query;
      const campaignMetrics = await this.googleAdsService.getCampaignMetrics(campaignId, metrics);
      res.json(campaignMetrics);
    } catch (error) {
      logger.error('Error getting campaign metrics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getCreativePerformance = async (req, res) => {
    try {
      const { creativeId, dateRange } = req.query;
      const performance = await this.googleAdsService.getCreativePerformance(creativeId, dateRange);
      res.json(performance);
    } catch (error) {
      logger.error('Error getting creative performance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getCreativeMetrics = async (req, res) => {
    try {
      const { creativeId, metrics } = req.query;
      const creativeMetrics = await this.googleAdsService.getCreativeMetrics(creativeId, metrics);
      res.json(creativeMetrics);
    } catch (error) {
      logger.error('Error getting creative metrics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  listClientAccounts = async (req, res) => {
    try {
      const accounts = await this.googleAdsService.listClientAccounts();
      res.json(accounts);
    } catch (error) {
      logger.error('Error listing client accounts:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = { GoogleAdsController }; 