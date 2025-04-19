from typing import List, Dict, Any, Optional
import logging
import os
import ssl
import aiohttp
from fastapi import HTTPException

# Setup logger
logger = logging.getLogger(__name__)

class GoogleAdsService:
    def __init__(self):
        # Load environment variables
        self.client_id = os.getenv("GOOGLE_ADS_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_ADS_CLIENT_SECRET")
        self.refresh_token = os.getenv("GOOGLE_ADS_REFRESH_TOKEN")
        self.developer_token = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN")
        self.login_customer_id = os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID")
        
        # Base API URL
        self.base_url = "https://googleads.googleapis.com/v17"
        
        # Access token (will be obtained on first request)
        self.access_token = None
        
        # Validate required fields
        if not all([self.client_id, self.client_secret, self.refresh_token, self.developer_token, self.login_customer_id]):
            logger.error("Missing required Google Ads API credentials")
            raise ValueError("Missing required Google Ads API credentials")

        # API version
        self.api_version = 17
        
    async def _get_access_token(self) -> str:
        """Get access token using refresh token"""
        logger.info("Getting access token")
        
        token_url = "https://oauth2.googleapis.com/token"
        
        # Create SSL context that doesn't verify certificates for development
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Create a client session with the SSL context
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
            payload = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token"
            }
            
            try:
                async with session.post(token_url, data=payload) as response:
                    response_json = await response.json()
                    if "access_token" not in response_json:
                        logger.error(f"Failed to get access token: {response_json}")
                        raise HTTPException(status_code=500, detail="Failed to authenticate with Google Ads API")
                        
                    return response_json["access_token"]
            except Exception as e:
                logger.error(f"Error getting access token: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error authenticating: {str(e)}")
    
    async def _make_request(self, endpoint: str, method: str = "GET", data: Dict = None, query_params: Dict = None) -> Dict:
        """Make a request to the Google Ads API."""
        try:
            # Ensure we have a valid access token
            if not self.access_token:
                self.access_token = await self._get_access_token()
            
            # Base API URL
            if endpoint.startswith("http"):
                base_url = ""  # If endpoint is already a full URL
            else:
                base_url = f"https://googleads.googleapis.com/v17/"
            
            # Construct full URL
            full_url = f"{base_url}{endpoint}"
            
            # Add query parameters if provided
            if query_params:
                query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
                full_url = f"{full_url}?{query_string}"
            
            # Prepare headers
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "developer-token": self.developer_token,
                "login-customer-id": str(self.login_customer_id)
            }
            
            # Make the request
            async with aiohttp.ClientSession() as session:
                if method == "GET":
                    async with session.get(full_url, headers=headers) as response:
                        if response.status == 401:  # Token expired
                            logger.info("Access token expired, refreshing...")
                            self.access_token = await self._get_access_token()
                            headers["Authorization"] = f"Bearer {self.access_token}"
                            async with session.get(full_url, headers=headers) as new_response:
                                if new_response.status != 200:
                                    error_text = await new_response.text()
                                    logger.error(f"Error {new_response.status}: {error_text}")
                                    raise HTTPException(status_code=new_response.status, detail=f"Google Ads API error: {error_text}")
                                return await new_response.json()
                        elif response.status != 200:
                            error_text = await response.text()
                            logger.error(f"Error {response.status}: {error_text}")
                            raise HTTPException(status_code=response.status, detail=f"Google Ads API error: {error_text}")
                        return await response.json()
                elif method == "POST":
                    async with session.post(full_url, headers=headers, json=data) as response:
                        if response.status == 401:  # Token expired
                            logger.info("Access token expired, refreshing...")
                            self.access_token = await self._get_access_token()
                            headers["Authorization"] = f"Bearer {self.access_token}"
                            async with session.post(full_url, headers=headers, json=data) as new_response:
                                if new_response.status != 200:
                                    error_text = await new_response.text()
                                    logger.error(f"Error {new_response.status}: {error_text}")
                                    raise HTTPException(status_code=new_response.status, detail=f"Google Ads API error: {error_text}")
                                return await new_response.json()
                        elif response.status != 200:
                            error_text = await response.text()
                            logger.error(f"Error {response.status}: {error_text}")
                            raise HTTPException(status_code=response.status, detail=f"Google Ads API error: {error_text}")
                        return await response.json()
                elif method == "PATCH":
                    async with session.patch(full_url, headers=headers, json=data) as response:
                        if response.status == 401:  # Token expired
                            logger.info("Access token expired, refreshing...")
                            self.access_token = await self._get_access_token()
                            headers["Authorization"] = f"Bearer {self.access_token}"
                            async with session.patch(full_url, headers=headers, json=data) as new_response:
                                if new_response.status != 200:
                                    error_text = await new_response.text()
                                    logger.error(f"Error {new_response.status}: {error_text}")
                                    raise HTTPException(status_code=new_response.status, detail=f"Google Ads API error: {error_text}")
                                return await new_response.json()
                        elif response.status != 200:
                            error_text = await response.text()
                            logger.error(f"Error {response.status}: {error_text}")
                            raise HTTPException(status_code=response.status, detail=f"Google Ads API error: {error_text}")
                        return await response.json()
                else:
                    raise ValueError(f"Unsupported method: {method}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error making request: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error communicating with Google Ads API: {str(e)}")
    
    async def list_client_accounts(self) -> List[Dict]:
        """
        List all available client accounts
        
        Returns:
            List[Dict]: Client accounts information
        """
        logger.info("Listing client accounts")
        
        try:
            # Endpoint para listar contas de gerenciamento
            endpoint = f"customers/{self.login_customer_id}/googleAds:search"
            
            # Query GAQL para obter contas de clientes
            data = {
                "query": """
                    SELECT
                        customer_client.client_customer,
                        customer_client.level,
                        customer_client.currency_code,
                        customer_client.descriptive_name,
                        customer_client.status
                    FROM customer_client
                    WHERE customer_client.manager = FALSE
                """
            }
            
            # Fazer a requisição real
            result = await self._make_request(endpoint, method="POST", data=data)
            
            # Processar o resultado
            accounts = []
            if "results" in result:
                for item in result["results"]:
                    client_data = item.get("customerClient", {})
                    accounts.append({
                        "accountId": client_data.get("clientCustomer", "").split('/')[-1],
                        "accountName": client_data.get("descriptiveName", ""),
                        "currencyCode": client_data.get("currencyCode", ""),
                        "status": client_data.get("status", "")
                    })
            
            logger.info(f"Successfully listed {len(accounts)} client accounts")
            return accounts
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error listing client accounts: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error listing client accounts: {str(e)}")
    
    async def list_campaigns(self, customer_id: str, status_filter: Optional[str] = None) -> List[Dict]:
        """
        List campaigns for a specific customer account
        
        Args:
            customer_id: The customer ID to list campaigns for
            status_filter: Optional filter for campaign status (ENABLED, PAUSED, REMOVED)
            
        Returns:
            List[Dict]: Campaign information
        """
        logger.info(f"Listing campaigns for customer ID: {customer_id}")
        
        try:
            # Endpoint para listar campanhas
            endpoint = f"customers/{customer_id}/googleAds:search"
            
            # Query GAQL base - Modificada para incluir budget.amount_micros
            query = """
                SELECT
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    campaign.advertising_channel_type,
                    campaign.bidding_strategy_type,
                    campaign_budget.amount_micros,
                    campaign.campaign_budget
                FROM campaign
            """
            
            # Adicionar filtro por status, se fornecido
            if status_filter:
                query += f" WHERE campaign.status = '{status_filter}'"
            
            data = {"query": query}
            
            # Fazer a requisição
            result = await self._make_request(endpoint, method="POST", data=data)
            
            # Mapeamento de códigos de estratégia de lances para strings descritivas
            bid_strategy_map = {
                "0": "UNSPECIFIED",
                "1": "UNKNOWN",
                "2": "COMMISSION",
                "3": "ENHANCED_CPC",
                "4": "MANUAL_CPC",
                "5": "MANUAL_CPM",
                "6": "MANUAL_CPV",
                "7": "MAXIMIZE_CONVERSIONS",
                "8": "MAXIMIZE_CONVERSION_VALUE",
                "9": "PAGE_ONE_PROMOTED",
                "10": "PERCENT_CPC",
                "11": "TARGET_CPA",
                "12": "TARGET_CPM",
                "13": "TARGET_IMPRESSION_SHARE",
                "14": "TARGET_OUTRANK_SHARE",
                "15": "TARGET_ROAS",
                "16": "TARGET_SPEND",
                7: "MAXIMIZE_CONVERSIONS",
                8: "MAXIMIZE_CONVERSION_VALUE",
                16: "MAXIMIZE_CLICKS",
                4: "MANUAL_CPC",
                5: "MANUAL_CPM",
                6: "MANUAL_CPV",
                11: "TARGET_CPA",
                15: "TARGET_ROAS",
                13: "TARGET_IMPRESSION_SHARE"
            }
            
            # Processar o resultado
            campaigns = []
            if "results" in result:
                for item in result["results"]:
                    campaign_data = item.get("campaign", {})
                    campaign_budget = item.get("campaignBudget", {})
                    
                    # Extrair o valor do orçamento em micros e converter para a unidade monetária normal
                    budget_micros = campaign_budget.get("amountMicros", 0)
                    budget = float(budget_micros) / 1_000_000 if budget_micros else 0.0
                    
                    # Interpretar a estratégia de lances
                    bid_strategy_type = campaign_data.get("biddingStrategyType", "")
                    bid_strategy_name = bid_strategy_map.get(bid_strategy_type, str(bid_strategy_type))
                    
                    # Log para depuração
                    logger.debug(f"Campaign ID: {campaign_data.get('id', '')}, Budget Micros: {budget_micros}, Budget: {budget}")
                    
                    campaigns.append({
                        "campaignId": campaign_data.get("id", ""),
                        "campaignName": campaign_data.get("name", ""),
                        "status": campaign_data.get("status", ""),
                        "type": campaign_data.get("advertisingChannelType", ""),
                        "biddingStrategy": bid_strategy_name,
                        "budget": budget  # Valor convertido de micros
                    })
            
            logger.info(f"Successfully listed {len(campaigns)} campaigns for customer ID: {customer_id}")
            return campaigns
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error listing campaigns: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error listing campaigns: {str(e)}")
    
    async def update_bid_and_budget(self, customer_id: str, campaign_id: str, new_budget: float = None, new_bid: float = None) -> Dict:
        """
        Update campaign budget and/or bid modifier
        
        Args:
            customer_id: The customer ID that owns the campaign
            campaign_id: The campaign ID to update
            new_budget: New budget amount (in the account's currency)
            new_bid: New bid modifier (as a multiplier, e.g., 1.1 for +10%)
            
        Returns:
            Dict: Update status
        """
        logger.info(f"Updating bid/budget for campaign {campaign_id} in account {customer_id}")
        
        try:
            if not new_budget and not new_bid:
                raise HTTPException(status_code=400, detail="Either new budget or new bid must be provided")
                
            # Get campaign info to check current values and get resource names
            campaign_info = await self._get_campaign_info(customer_id, campaign_id)
            logger.info(f"Campaign info: {campaign_info}")
            
            response = {
                "success": True,
                "message": "Budget update initiated",
                "update_details": {
                    "customer_id": customer_id,
                    "campaign_id": campaign_id,
                    "campaign_name": campaign_info.get("name", ""),
                    "updates": []
                }
            }
            
            # If we need to update the budget
            if new_budget:
                # Get the campaign budget resource name
                budget_resource = campaign_info.get("campaignBudget", "")
                if not budget_resource:
                    raise HTTPException(status_code=400, detail="Campaign budget resource not found")
                
                # Convert currency to micros (Google Ads API uses micros)
                budget_micros = int(new_budget * 1_000_000)
                
                # Create mutation for updating budget
                endpoint = f"customers/{customer_id}/campaignBudgets:mutate"
                
                # Build the mutation data
                budget_id = budget_resource.split('/')[-1]  # Extract ID from resource name
                data = {
                    "operations": [
                        {
                            "updateMask": "amountMicros",
                            "update": {
                                "resourceName": budget_resource,
                                "amountMicros": str(budget_micros)
                            }
                        }
                    ]
                }
                
                # Make the API call to update the budget
                try:
                    update_result = await self._make_request(endpoint, method="POST", data=data)
                    logger.info(f"Budget update result: {update_result}")
                    
                    response["update_details"]["updates"].append({
                        "type": "budget",
                        "previous_value": "Unknown",
                        "new_value": new_budget,
                        "new_value_micros": budget_micros,
                        "status": "success"
                    })
                except Exception as e:
                    logger.error(f"Error updating budget: {str(e)}")
                    response["success"] = False
                    response["message"] = f"Error updating budget: {str(e)}"
                    response["update_details"]["updates"].append({
                        "type": "budget",
                        "new_value": new_budget,
                        "status": "failed",
                        "error": str(e)
                    })
            
            # If we need to update the bid
            if new_bid:
                # This would be implemented similar to the budget update
                # For now, just add to the response
                response["update_details"]["updates"].append({
                    "type": "bid",
                    "previous_value": "Unknown",
                    "new_value": new_bid,
                    "status": "not_implemented"
                })
                response["message"] += ", bid update not implemented yet"
            
            return response
            
        except HTTPException as e:
            logger.error(f"Error in update_bid_and_budget: {e.detail}")
            raise
        except Exception as e:
            error_msg = f"Error updating campaign: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
    
    async def _get_campaign_info(self, customer_id: str, campaign_id: str) -> Dict:
        """
        Get detailed information about a specific campaign
        
        Args:
            customer_id: The customer ID that owns the campaign
            campaign_id: The campaign ID to get info for
            
        Returns:
            Dict: Campaign information
        """
        endpoint = f"customers/{customer_id}/googleAds:search"
        
        query = f"""
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.bidding_strategy_type,
                campaign.campaign_budget
            FROM campaign
            WHERE campaign.id = {campaign_id}
        """
        
        result = await self._make_request(endpoint, method="POST", data={"query": query})
        
        if "results" in result and len(result["results"]) > 0:
            return result["results"][0].get("campaign", {})
        else:
            raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    
    async def get_campaign_performance(self, customer_id: str, campaign_ids: List[str] = None, date_range: str = "LAST_30_DAYS") -> List[Dict]:
        """
        Get performance metrics for campaigns
        
        Args:
            customer_id: The customer ID to get campaign performance for
            campaign_ids: Optional list of campaign IDs to filter by
            date_range: Time period for the report (e.g., LAST_7_DAYS, LAST_30_DAYS)
            
        Returns:
            List[Dict]: Campaign performance metrics
        """
        logger.info(f"Getting campaign performance for customer ID: {customer_id}")
        
        try:
            endpoint = f"customers/{customer_id}/googleAds:search"
            
            query = f"""
                SELECT
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.cost_micros,
                    metrics.conversions,
                    metrics.average_cpc
                FROM campaign
                WHERE segments.date DURING {date_range}
            """
            
            # Add campaign filter if specified
            if campaign_ids and len(campaign_ids) > 0:
                campaign_ids_str = ", ".join(campaign_ids)
                query += f" AND campaign.id IN ({campaign_ids_str})"
            
            data = {"query": query}
            
            # Make the request
            result = await self._make_request(endpoint, method="POST", data=data)
            
            # Process the results
            performance_data = []
            if "results" in result:
                for item in result["results"]:
                    campaign = item.get("campaign", {})
                    metrics = item.get("metrics", {})
                    
                    # Convert micros to regular currency units
                    cost = float(metrics.get("costMicros", 0)) / 1_000_000 if "costMicros" in metrics else 0
                    avg_cpc = float(metrics.get("averageCpc", 0)) / 1_000_000 if "averageCpc" in metrics else 0
                    
                    performance_data.append({
                        "campaignId": campaign.get("id", ""),
                        "campaignName": campaign.get("name", ""),
                        "status": campaign.get("status", ""),
                        "impressions": int(metrics.get("impressions", 0)),
                        "clicks": int(metrics.get("clicks", 0)),
                        "cost": cost,
                        "conversions": float(metrics.get("conversions", 0)),
                        "averageCpc": avg_cpc
                    })
            
            logger.info(f"Successfully retrieved performance data for {len(performance_data)} campaigns")
            return performance_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting campaign performance: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error getting campaign performance: {str(e)}")
    
    async def update_bid_strategy(self, customer_id: str, campaign_id: str, new_bid_strategy: str) -> Dict:
        """Update the bidding strategy for a campaign."""
        logger.info(f"Updating bidding strategy for campaign {campaign_id} in account {customer_id}")
        
        # Initialize response
        response = {
            "success": True,
            "message": "Bidding strategy update initiated",
            "update_details": {
                "customer_id": customer_id,
                "campaign_id": campaign_id,
                "campaign_name": "Unknown",
                "updates": []
            }
        }
        
        try:
            # Get campaign details first
            campaign_details = await self.get_campaign_details(customer_id, campaign_id)
            campaign_name = campaign_details.get("campaignName", "Unknown")
            response["update_details"]["campaign_name"] = campaign_name
            
            # Map the string bidding strategy to the appropriate enum value
            # See: https://developers.google.com/google-ads/api/reference/rpc/v17/BiddingStrategyTypeEnum.BiddingStrategyType
            bid_strategy_map = {
                "MAXIMIZE_CONVERSIONS": 7,  # Numeric enum value
                "MAXIMIZE_CONVERSION_VALUE": 8,
                "MAXIMIZE_CLICKS": 16,
                "MANUAL_CPC": 4,
                "MANUAL_CPM": 5,
                "MANUAL_CPV": 6,
                "TARGET_CPA": 11,
                "TARGET_ROAS": 15,
                "TARGET_SPEND": 16,
                "TARGET_IMPRESSION_SHARE": 13
            }
            
            # Check if the requested strategy is valid
            if new_bid_strategy not in bid_strategy_map:
                valid_strategies = ", ".join(bid_strategy_map.keys())
                raise ValueError(f"Invalid bidding strategy: {new_bid_strategy}. Valid strategies are: {valid_strategies}")
            
            # Create a mutate operation to update the campaign
            endpoint = f"customers/{customer_id}/googleAds:searchStream"
            
            # Prepare GAQL query to get campaign resource name
            query = f"""
                SELECT campaign.resource_name, campaign.bidding_strategy_type
                FROM campaign
                WHERE campaign.id = {campaign_id}
            """
            
            # Execute the query to get the resource name
            try:
                query_data = {"query": query}
                result = await self._make_request(f"customers/{customer_id}/googleAds:search", method="POST", data=query_data)
                
                if not result or "results" not in result or not result["results"]:
                    raise ValueError(f"Campaign {campaign_id} not found")
                
                resource_name = result["results"][0]["campaign"]["resourceName"]
                current_bid_strategy = result["results"][0]["campaign"].get("biddingStrategyType", "Unknown")
                
                # Prepare mutate request
                mutate_endpoint = f"customers/{customer_id}/campaigns:mutate"
                
                mutate_data = {
                    "operations": [
                        {
                            "update": {
                                "resourceName": resource_name,
                                "biddingStrategyType": bid_strategy_map[new_bid_strategy]
                            },
                            "updateMask": "bidding_strategy_type"
                        }
                    ]
                }
                
                # Execute the mutate request
                update_result = await self._make_request(mutate_endpoint, method="POST", data=mutate_data)
                logger.info(f"Bidding strategy update result: {update_result}")
                
                response["update_details"]["updates"].append({
                    "type": "bidding_strategy",
                    "previous_value": current_bid_strategy,
                    "new_value": new_bid_strategy,
                    "new_value_enum": bid_strategy_map[new_bid_strategy],
                    "status": "success"
                })
                
            except Exception as e:
                logger.error(f"Error updating bidding strategy: {str(e)}")
                response["success"] = False
                response["message"] = f"Error updating bidding strategy: {str(e)}"
                response["update_details"]["updates"].append({
                    "type": "bidding_strategy",
                    "new_value": new_bid_strategy,
                    "status": "failed",
                    "error": str(e)
                })
            
            return response
            
        except Exception as e:
            logger.error(f"Error in update_bid_strategy: {str(e)}")
            raise
    
    async def get_campaign_details(self, customer_id: str, campaign_id: str) -> Dict:
        """Get basic campaign details."""
        try:
            logger.info(f"Getting campaign details for campaign {campaign_id} in account {customer_id}")
            
            # Build GAQL query
            query = f"""
                SELECT
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    campaign.bidding_strategy_type
                FROM campaign
                WHERE campaign.id = {campaign_id}
            """
            
            # Make query request
            endpoint = f"customers/{customer_id}/googleAds:search"
            data = {"query": query}
            
            result = await self._make_request(endpoint, method="POST", data=data)
            
            # Process results
            if "results" not in result or not result["results"]:
                logger.warning(f"No campaign found with ID {campaign_id}")
                raise ValueError(f"Campaign with ID {campaign_id} not found")
            
            campaign = result["results"][0]
            
            # Return campaign details
            return {
                "campaignId": campaign_id,
                "campaignName": campaign.get("campaign", {}).get("name", ""),
                "status": campaign.get("campaign", {}).get("status", ""),
                "biddingStrategy": campaign.get("campaign", {}).get("biddingStrategyType", "")
            }
        except Exception as e:
            logger.error(f"Failed to get campaign details: {str(e)}")
            raise 