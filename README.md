# Google Ads MCP

A Message Control Protocol (MCP) for Google Ads integration with n8n. This MCP provides endpoints for controlling bids and budgets, and analyzing campaign and creative performance.

## Features

- Bid and Budget Control
- Campaign Performance Analysis
- Creative Performance Analysis

## Prerequisites

- Node.js (v14 or higher)
- Google Ads API access
- Google Ads Developer Token
- Google Ads API credentials (Client ID and Client Secret)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/freelasuper/google-ads-mcp.git
cd google-ads-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
PORT=3000
```

## Usage

Start the MCP server:
```bash
npm start
```

## API Endpoints

### Bid and Budget Control

#### Update Bid and Budget
```
POST /api/v1/bid-budget/update
Content-Type: application/json

{
  "campaignId": "123456789",
  "newBid": 1.50,
  "newBudget": 1000
}
```

#### Get Bid and Budget Status
```
GET /api/v1/bid-budget/status?campaignId=123456789
```

### Campaign Performance

#### Get Campaign Performance
```
GET /api/v1/campaign/performance?campaignId=123456789&dateRange=LAST_30_DAYS
```

#### Get Campaign Metrics
```
GET /api/v1/campaign/metrics?campaignId=123456789&metrics=metrics.impressions,metrics.clicks,metrics.cost_micros
```

### Creative Performance

#### Get Creative Performance
```
GET /api/v1/creative/performance?creativeId=123456789&dateRange=LAST_30_DAYS
```

#### Get Creative Metrics
```
GET /api/v1/creative/metrics?creativeId=123456789&metrics=metrics.impressions,metrics.clicks,metrics.cost_micros
```

## n8n Integration

To integrate this MCP with n8n:

1. Install the n8n-mcp-nodes package in your n8n instance
2. Configure the MCP node with your MCP server URL
3. Use the available operations to interact with your Google Ads account

## Error Handling

The MCP includes comprehensive error handling and logging. All errors are logged to both console and files:
- `error.log`: Contains only error-level logs
- `combined.log`: Contains all logs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
