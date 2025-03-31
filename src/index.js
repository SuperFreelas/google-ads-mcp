const express = require('express');
const dotenv = require('dotenv');
const { GoogleAdsController } = require('./controllers/googleAdsController');
const { logger } = require('./utils/logger');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Ads Controller
const googleAdsController = new GoogleAdsController();

// Routes for bid and budget control
app.post('/api/v1/bid-budget/update', googleAdsController.updateBidAndBudget);
app.get('/api/v1/bid-budget/status', googleAdsController.getBidAndBudgetStatus);

// Routes for campaign performance analysis
app.get('/api/v1/campaign/performance', googleAdsController.getCampaignPerformance);
app.get('/api/v1/campaign/metrics', googleAdsController.getCampaignMetrics);

// Routes for creative performance analysis
app.get('/api/v1/creative/performance', googleAdsController.getCreativePerformance);
app.get('/api/v1/creative/metrics', googleAdsController.getCreativeMetrics);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, () => {
  logger.info(`Google Ads MCP server running on port ${port}`);
}); 