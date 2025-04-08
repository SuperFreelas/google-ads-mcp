# Google Ads MCP

A Message Control Protocol (MCP) for Google Ads integration with n8n. This MCP provides endpoints for controlling bids and budgets, and analyzing campaign and creative performance.

## Features

- Bid and Budget Control
- Campaign Performance Analysis
- Creative Performance Analysis
- Client Account Management
- Support for both manager (MCC) and client accounts

## Prerequisites

- Node.js (v14 or higher)
- Google Ads API access
- Google Ads Developer Token with at least Basic Access level
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

3. Create a `.env` file in the root directory with the following variables (use `.env.example` as a template):
```
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
PORT=3000
```

> **Note:** For `GOOGLE_ADS_CUSTOMER_ID`, you can use either a manager account ID (MCC) or a specific client account ID. The application is designed to handle both scenarios and will automatically use client accounts for metrics queries.

## Usage

Start the MCP server:
```bash
npm start
```

For production deployment, it's recommended to use a process manager like PM2:
```bash
npm install -g pm2
pm2 start src/index.js --name google-ads-mcp
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
> **Note:** Due to limitations in the Google Ads API REST Beta, bid updates are currently simulated. Only budget updates would work with the full API implementation.

#### Get Bid and Budget Status
```
GET /api/v1/bid-budget/status?campaignId=123456789
```

### Campaign Performance

#### Get Campaign Performance
```
GET /api/v1/campaign/performance?campaignId=123456789&dateRange=LAST_30_DAYS
```
> Supported date ranges: TODAY, YESTERDAY, LAST_7_DAYS, LAST_14_DAYS, LAST_30_DAYS, LAST_BUSINESS_WEEK, etc.

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

### Client Account Management

#### List Client Accounts
```
GET /api/v1/accounts
```
This endpoint returns the list of available client accounts if you're using a manager account (MCC).

#### List Campaigns for a Specific Account
```
GET /api/v1/campaigns?accountId=1234567890
```

#### List All Campaigns Across All Client Accounts
```
GET /api/v1/campaigns/all
```

## Implementation Details

### Manager Account Handling

When using a manager account (MCC), metrics cannot be directly requested from it. The MCP automatically:
1. Identifies client accounts under the manager account
2. Filters for non-manager active accounts
3. Uses those accounts to query for campaign metrics and performance data

### Google Ads API REST Beta Limitations

This MCP uses the `google-ads-api` library version 19.0.2-rest-beta which has certain limitations:
- UPDATE operations via GAQL are not supported
- Some fields (`campaign.manual_cpc`, `campaign.target_roas`) cannot be used in SELECT clauses
- Mutate API calls for updating budgets and bids require different implementation

These limitations are handled by:
- Using appropriate field selections in queries
- Implementing workarounds for updating operations
- Providing detailed error messages for diagnosis

## Google Ads API Access Levels

This MCP supports different Google Ads API access levels:

- **Test Account Access**: Limited to test accounts only
- **Basic Access**: Can access real client accounts with limited quota
- **Standard Access**: Full access with higher quota limits

For production use, we recommend applying for at least Basic Access through the Google Ads API Center.

## n8n Integration

To integrate this MCP with n8n:

1. Install the n8n-mcp-nodes package in your n8n instance
2. Configure the MCP node with your MCP server URL
3. Use the available operations to interact with your Google Ads account

## Error Handling

The MCP includes comprehensive error handling and logging. All errors are logged to provide better visibility:
- Query failures are logged with detailed error messages
- API connectivity issues are clearly reported
- Client account discovery failures are tracked

## Troubleshooting

### Common Issues

1. **"Metrics cannot be requested for a manager account"**
   - This is handled automatically by the MCP which will find and use appropriate client accounts.

2. **"PROHIBITED_FIELD_IN_SELECT_CLAUSE"**
   - Certain fields cannot be used in queries. The MCP is designed to avoid these fields.

3. **"EXPECTED_SELECT" when updating**
   - The REST Beta API doesn't support UPDATE operations directly. The application simulates updates.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
