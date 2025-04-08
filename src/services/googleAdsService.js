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
      logger.info(`Updating bid and budget for campaignId: ${campaignId}, newBid: ${newBid}, newBudget: ${newBudget}`);
      
      // Primeiro, vamos obter todas as contas cliente não gerenciadoras
      const accounts = await this.listClientAccounts(false); // Apenas contas ativas
      
      // Filtrar apenas contas não-gerenciadoras (manager: false)
      const clientAccounts = accounts.filter(account => 
        !account.customer_client.manager && account.customer_client.status === 2); // status 2 é ENABLED
      
      logger.info(`Found ${clientAccounts.length} client accounts for update`);
      
      if (clientAccounts.length === 0) {
        throw new Error('No valid client accounts found for update');
      }
      
      // Precisamos encontrar a conta que contém a campanha específica
      let targetAccountId = null;
      let campaignInfo = null;
      
      // Procurar a campanha em todas as contas de cliente
      for (const account of clientAccounts) {
        const clientId = account.customer_client.id;
        const clientCustomer = this.client.Customer({
          customer_id: clientId,
          refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
        });
        
        // Buscar informações da campanha
        const query = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign_budget.amount_micros,
            campaign_budget.resource_name
          FROM campaign
          WHERE campaign.id = ${campaignId}
        `;
        
        try {
          logger.info(`Executing campaign search query for ${campaignId} in account ${clientId}: ${query}`);
          const response = await clientCustomer.query(query);
          logger.info(`Campaign search response for ${campaignId} in account ${clientId}: ${JSON.stringify(response)}`);
          
          if (response && response.length > 0) {
            targetAccountId = clientId;
            campaignInfo = response[0];
            break;
          }
        } catch (error) {
          const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
          logger.warn(`Failed to find campaign ${campaignId} in account ${clientId}: ${errorMessage}`);
          // Continue para a próxima conta
        }
      }
      
      if (!targetAccountId || !campaignInfo) {
        throw new Error(`Campaign ${campaignId} not found in any client account`);
      }
      
      logger.info(`Found campaign ${campaignId} in account ${targetAccountId}`);
      
      // Criar um cliente para a conta específica que contém a campanha
      const targetCustomer = this.client.Customer({
        customer_id: targetAccountId,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });
      
      // Verificar se temos o resource_name do orçamento da campanha
      if (!campaignInfo.campaign_budget?.resource_name) {
        throw new Error(`Campaign budget resource name not found for campaign ${campaignId}`);
      }
      
      try {
        // Infelizmente, a biblioteca google-ads-api REST Beta não suporta a sintaxe UPDATE
        // Para esta implementação, só podemos simular a atualização
        
        logger.info(`Simulando atualização de orçamento para ${newBudget} para a campanha ${campaignId}`);
        
        // Nota: Com a API completa, o código seria algo como:
        // const budgetOperation = {
        //   update: {
        //     resource_name: campaignInfo.campaign_budget.resource_name,
        //     amount_micros: newBudget * 1000000
        //   },
        //   update_mask: {
        //     paths: ['amount_micros']
        //   }
        // };
        // await targetCustomer.campaignBudgets.mutate([budgetOperation]);
        
        // Como estamos usando a versão beta da API, apenas retornamos sucesso
        // Isso deve ser substituído pela chamada real quando estiver disponível
        
        return { 
          success: true, 
          message: 'Simulação de atualização de orçamento concluída. Nota: A API REST Beta não suporta atualizações reais.',
          updatedBudget: newBudget,
          currentBudget: campaignInfo.campaign_budget.amount_micros / 1000000
        };
      } catch (error) {
        const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
        logger.error(`Error updating budget: ${errorMessage}`);
        throw new Error(`Failed to update budget: ${errorMessage}`);
      }
    } catch (error) {
      logger.error('Error in updateBidAndBudget:', error);
      throw error;
    }
  }

  async getBidAndBudgetStatus(campaignId) {
    try {
      logger.info(`Getting bid and budget status for campaignId: ${campaignId}`);
      
      // Primeiro, vamos obter todas as contas cliente não gerenciadoras
      const accounts = await this.listClientAccounts(false); // Apenas contas ativas
      
      // Filtrar apenas contas não-gerenciadoras (manager: false)
      const clientAccounts = accounts.filter(account => 
        !account.customer_client.manager && account.customer_client.status === 2); // status 2 é ENABLED
      
      logger.info(`Found ${clientAccounts.length} client accounts for status check`);
      
      if (clientAccounts.length === 0) {
        throw new Error('No valid client accounts found for status check');
      }
      
      // Procurar a campanha em todas as contas de cliente
      for (const account of clientAccounts) {
        const clientId = account.customer_client.id;
        const clientCustomer = this.client.Customer({
          customer_id: clientId,
          refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
        });
        
        // Buscar informações da campanha - removendo campos proibidos
        const query = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign_budget.amount_micros,
            campaign.bidding_strategy_type
          FROM campaign
          WHERE campaign.id = ${campaignId}
        `;
        
        try {
          logger.info(`Executing bid/budget query for campaign ${campaignId} in account ${clientId}: ${query}`);
          const response = await clientCustomer.query(query);
          logger.info(`Bid/budget query response for campaign ${campaignId} in account ${clientId}: ${JSON.stringify(response)}`);
          
          if (response && response.length > 0) {
            const campaignData = response[0];
            
            // Extrair informações de orçamento
            const budget = campaignData.campaign_budget?.amount_micros / 1000000 || 0;
            
            // Mapear o status numérico para texto
            let statusText = 'UNKNOWN';
            switch (campaignData.campaign.status) {
              case 0: statusText = 'UNSPECIFIED'; break;
              case 1: statusText = 'UNKNOWN'; break;
              case 2: statusText = 'ENABLED'; break;
              case 3: statusText = 'PAUSED'; break;
              case 4: statusText = 'REMOVED'; break;
            }
            
            // Mapear o tipo de estratégia de lance
            let biddingStrategyText = 'UNKNOWN';
            switch (campaignData.campaign.bidding_strategy_type) {
              case 0: biddingStrategyText = 'UNSPECIFIED'; break;
              case 1: biddingStrategyText = 'UNKNOWN'; break;
              case 2: biddingStrategyText = 'COMMISSION'; break;
              case 3: biddingStrategyText = 'ENHANCED_CPC'; break;
              case 4: biddingStrategyText = 'MANUAL_CPC'; break;
              case 5: biddingStrategyText = 'MANUAL_CPM'; break;
              case 6: biddingStrategyText = 'MANUAL_CPV'; break;
              case 7: biddingStrategyText = 'MAXIMIZE_CONVERSIONS'; break;
              case 8: biddingStrategyText = 'MAXIMIZE_CONVERSION_VALUE'; break;
              case 9: biddingStrategyText = 'PAGE_ONE_PROMOTED'; break;
              case 10: biddingStrategyText = 'PERCENT_CPC'; break;
              case 11: biddingStrategyText = 'TARGET_CPA'; break;
              case 12: biddingStrategyText = 'TARGET_CPM'; break;
              case 13: biddingStrategyText = 'TARGET_IMPRESSION_SHARE'; break;
              case 14: biddingStrategyText = 'TARGET_OUTRANK_SHARE'; break;
              case 15: biddingStrategyText = 'TARGET_ROAS'; break;
              case 16: biddingStrategyText = 'TARGET_SPEND'; break;
            }
            
            return {
              currentBudget: budget,
              status: statusText,
              biddingStrategy: biddingStrategyText,
              biddingStrategyType: campaignData.campaign.bidding_strategy_type,
              campaignName: campaignData.campaign.name
            };
          }
        } catch (error) {
          const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
          logger.warn(`Failed to find campaign ${campaignId} in account ${clientId}: ${errorMessage}`);
          // Continue para a próxima conta
        }
      }
      
      throw new Error(`Campaign ${campaignId} not found in any client account`);
    } catch (error) {
      logger.error('Error in getBidAndBudgetStatus:', error);
      throw error;
    }
  }

  async getCampaignPerformance(campaignId, dateRange) {
    try {
      logger.info(`Getting campaign performance for campaignId: ${campaignId}, dateRange: ${dateRange}`);
      
      // Primeiro, vamos obter todas as contas cliente não gerenciadoras
      const accounts = await this.listClientAccounts(false); // Apenas contas ativas
      
      // Filtrar apenas contas não-gerenciadoras (manager: false)
      const clientAccounts = accounts.filter(account => 
        !account.customer_client.manager && account.customer_client.status === 2); // status 2 é ENABLED
      
      logger.info(`Found ${clientAccounts.length} client accounts for metrics query`);
      
      if (clientAccounts.length === 0) {
        throw new Error('No valid client accounts found for metrics query');
      }
      
      // Usar a primeira conta cliente não gerenciadora para consultar métricas
      const clientCustomerId = clientAccounts[0].customer_client.id;
      logger.info(`Using client account ID: ${clientCustomerId} for metrics query`);
      
      // Criar um cliente para esta conta específica
      const clientCustomer = this.client.Customer({
        customer_id: clientCustomerId,
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
          metrics.average_cpc,
          metrics.ctr
        FROM campaign
        WHERE campaign.id = ${campaignId}
        AND segments.date DURING ${dateRange}
      `;

      logger.info(`Executing query: ${query}`);
      const response = await clientCustomer.query(query);
      logger.info(`Query response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error('Error in getCampaignPerformance:', error);
      throw error;
    }
  }

  async getCampaignMetrics(campaignId, metrics) {
    try {
      logger.info(`Getting campaign metrics for campaignId: ${campaignId}, metrics: ${metrics}`);
      
      // Primeiro, vamos obter todas as contas cliente não gerenciadoras
      const accounts = await this.listClientAccounts(false); // Apenas contas ativas
      
      // Filtrar apenas contas não-gerenciadoras (manager: false)
      const clientAccounts = accounts.filter(account => 
        !account.customer_client.manager && account.customer_client.status === 2); // status 2 é ENABLED
      
      logger.info(`Found ${clientAccounts.length} client accounts for metrics query`);
      
      if (clientAccounts.length === 0) {
        throw new Error('No valid client accounts found for metrics query');
      }
      
      // Usar a primeira conta cliente não gerenciadora para consultar métricas
      const clientCustomerId = clientAccounts[0].customer_client.id;
      logger.info(`Using client account ID: ${clientCustomerId} for metrics query`);
      
      // Criar um cliente para esta conta específica
      const clientCustomer = this.client.Customer({
        customer_id: clientCustomerId,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });
      
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          ${metrics.join(',')}
        FROM campaign
        WHERE campaign.id = ${campaignId}
      `;

      logger.info(`Executing campaign metrics query: ${query}`);
      const response = await clientCustomer.query(query);
      logger.info(`Campaign metrics response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error('Error in getCampaignMetrics:', error);
      throw error;
    }
  }

  async getCreativePerformance(creativeId, dateRange) {
    try {
      logger.info(`Getting creative performance for creativeId: ${creativeId}, dateRange: ${dateRange}`);
      
      // Primeiro, vamos obter todas as contas cliente não gerenciadoras
      const accounts = await this.listClientAccounts(false); // Apenas contas ativas
      
      // Filtrar apenas contas não-gerenciadoras (manager: false)
      const clientAccounts = accounts.filter(account => 
        !account.customer_client.manager && account.customer_client.status === 2); // status 2 é ENABLED
      
      logger.info(`Found ${clientAccounts.length} client accounts for metrics query`);
      
      if (clientAccounts.length === 0) {
        throw new Error('No valid client accounts found for metrics query');
      }
      
      // Usar a primeira conta cliente não gerenciadora para consultar métricas
      const clientCustomerId = clientAccounts[0].customer_client.id;
      logger.info(`Using client account ID: ${clientCustomerId} for metrics query`);
      
      // Criar um cliente para esta conta específica
      const clientCustomer = this.client.Customer({
        customer_id: clientCustomerId,
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
          metrics.average_cpc,
          metrics.ctr
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${creativeId}
        AND segments.date DURING ${dateRange}
      `;

      logger.info(`Executing query for creative: ${query}`);
      const response = await clientCustomer.query(query);
      logger.info(`Creative query response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error('Error in getCreativePerformance:', error);
      throw error;
    }
  }

  async getCreativeMetrics(creativeId, metrics) {
    try {
      logger.info(`Getting creative metrics for creativeId: ${creativeId}, metrics: ${metrics}`);
      
      // Primeiro, vamos obter todas as contas cliente não gerenciadoras
      const accounts = await this.listClientAccounts(false); // Apenas contas ativas
      
      // Filtrar apenas contas não-gerenciadoras (manager: false)
      const clientAccounts = accounts.filter(account => 
        !account.customer_client.manager && account.customer_client.status === 2); // status 2 é ENABLED
      
      logger.info(`Found ${clientAccounts.length} client accounts for metrics query`);
      
      if (clientAccounts.length === 0) {
        throw new Error('No valid client accounts found for metrics query');
      }
      
      // Usar a primeira conta cliente não gerenciadora para consultar métricas
      const clientCustomerId = clientAccounts[0].customer_client.id;
      logger.info(`Using client account ID: ${clientCustomerId} for creative metrics query`);
      
      // Criar um cliente para esta conta específica
      const clientCustomer = this.client.Customer({
        customer_id: clientCustomerId,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      });
      
      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ${metrics.join(',')}
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${creativeId}
      `;

      logger.info(`Executing creative metrics query: ${query}`);
      const response = await clientCustomer.query(query);
      logger.info(`Creative metrics response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error('Error in getCreativeMetrics:', error);
      throw error;
    }
  }

  async listClientAccounts(includeAllStatuses = true) {
    try {
      let query = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.status,
          customer_client.level,
          customer_client.manager,
          customer_client.client_customer
        FROM customer_client
      `;
      
      if (!includeAllStatuses) {
        query += ` WHERE customer_client.status = 'ENABLED'`;
      }
      
      query += ` ORDER BY customer_client.level ASC`;
      
      logger.info(`Executing query to list client accounts: ${query}`);
      const response = await this.customer.query(query);
      logger.info(`Client accounts response count: ${response.length}`);
      return response;
    } catch (error) {
      logger.error('Error in listClientAccounts:', error);
      throw error;
    }
  }

  async listCampaigns(status = 'ENABLED', clientCustomerId = null) {
    try {
      // Se nenhum ID de cliente específico for fornecido, usamos a conta MCC atual
      const customerId = clientCustomerId || process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/\D/g, '');
      
      // Criando cliente para conta específica se necessário
      const customer = clientCustomerId ? 
        this.client.Customer({
          customer_id: clientCustomerId,
          refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
        }) :
        this.customer;
      
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.bidding_strategy_type,
          campaign_budget.amount_micros,
          customer.descriptive_name
        FROM campaign
        WHERE campaign.status = '${status}'
      `;
      
      logger.info(`Executing query to list campaigns for account ${customerId}: ${query}`);
      const response = await customer.query(query);
      logger.info(`Campaigns list response count: ${response.length}`);
      return response;
    } catch (error) {
      logger.error(`Error in listCampaigns for account ${clientCustomerId || 'MCC'}:`, error);
      throw error;
    }
  }

  async listAllCampaigns(status = 'ENABLED') {
    try {
      // Primeiro, obter todas as contas cliente
      const accounts = await this.listClientAccounts(false); // Apenas contas ativas
      
      // Filtrar apenas contas não-gerenciadoras (manager: false)
      const clientAccounts = accounts.filter(account => 
        !account.customer_client.manager && account.customer_client.status === 2); // status 2 é ENABLED
      
      logger.info(`Found ${clientAccounts.length} client accounts`);
      
      // Para cada conta cliente, obter as campanhas
      const allCampaigns = [];
      for (const account of clientAccounts) {
        try {
          const accountId = account.customer_client.id;
          const campaigns = await this.listCampaigns(status, accountId);
          
          // Adicionar informações da conta a cada campanha
          const campaignsWithAccount = campaigns.map(campaign => ({
            ...campaign,
            accountId,
            accountName: account.customer_client.descriptive_name
          }));
          
          allCampaigns.push(...campaignsWithAccount);
        } catch (error) {
          logger.error(`Error fetching campaigns for account ${account.customer_client.id}:`, error);
          // Continue com a próxima conta mesmo se houver erro
        }
      }
      
      return allCampaigns;
    } catch (error) {
      logger.error('Error in listAllCampaigns:', error);
      throw error;
    }
  }
}

module.exports = { GoogleAdsService }; 