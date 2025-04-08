const express = require('express');
const dotenv = require('dotenv');
const { GoogleAdsController } = require('./controllers/googleAdsController');
const { logger } = require('./utils/logger');

// Load environment variables
dotenv.config();

// Log environment variables (without sensitive data)
logger.info('Environment loaded:', {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  hasClientId: !!process.env.GOOGLE_ADS_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
  hasDeveloperToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  hasCustomerId: !!process.env.GOOGLE_ADS_CUSTOMER_ID,
  hasRefreshToken: !!process.env.GOOGLE_ADS_REFRESH_TOKEN
});

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

// Route for listing client accounts
app.get('/api/v1/accounts', googleAdsController.listClientAccounts);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, () => {
  logger.info(`Google Ads MCP server running on port ${port}`);
}); 