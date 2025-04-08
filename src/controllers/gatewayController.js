const { GoogleAdsController } = require('./googleAdsController');
const { logger } = require('../utils/logger');

class GatewayController {
  constructor() {
    this.googleAdsController = new GoogleAdsController();
    this.execute = this.execute.bind(this);
  }

  async execute(req, res) {
    try {
      const { action } = req.body;
      logger.info(`Gateway execute called with action: ${action}`);
      
      // Mapeamento de ações para funções de controller
      const actionMap = {
        // Bid and Budget Control
        'updateBidAndBudget': async () => {
          const { campaignId, newBid, newBudget } = req.body.parameters || {};
          const mockReq = { body: { campaignId, newBid, newBudget } };
          await this.googleAdsController.updateBidAndBudget(mockReq, res);
        },
        
        'getBidAndBudgetStatus': async () => {
          const { campaignId } = req.body.parameters || {};
          const mockReq = { query: { campaignId } };
          await this.googleAdsController.getBidAndBudgetStatus(mockReq, res);
        },
        
        // Campaign Performance
        'getCampaignPerformance': async () => {
          const { campaignId, dateRange } = req.body.parameters || {};
          const mockReq = { query: { campaignId, dateRange } };
          await this.googleAdsController.getCampaignPerformance(mockReq, res);
        },
        
        'getCampaignMetrics': async () => {
          const { campaignId, metrics } = req.body.parameters || {};
          const mockReq = { query: { campaignId, metrics } };
          await this.googleAdsController.getCampaignMetrics(mockReq, res);
        },
        
        // Creative Performance
        'getCreativePerformance': async () => {
          const { creativeId, dateRange } = req.body.parameters || {};
          const mockReq = { query: { creativeId, dateRange } };
          await this.googleAdsController.getCreativePerformance(mockReq, res);
        },
        
        'getCreativeMetrics': async () => {
          const { creativeId, metrics } = req.body.parameters || {};
          const mockReq = { query: { creativeId, metrics } };
          await this.googleAdsController.getCreativeMetrics(mockReq, res);
        },
        
        // Client Account Management
        'listClientAccounts': async () => {
          const { includeAllStatuses } = req.body.parameters || {};
          const mockReq = { query: { includeAllStatuses } };
          await this.googleAdsController.listClientAccounts(mockReq, res);
        },
        
        'listCampaigns': async () => {
          const { status, accountId } = req.body.parameters || {};
          const mockReq = { query: { status, accountId } };
          await this.googleAdsController.listCampaigns(mockReq, res);
        },
        
        'listAllCampaigns': async () => {
          const { status } = req.body.parameters || {};
          const mockReq = { query: { status } };
          await this.googleAdsController.listAllCampaigns(mockReq, res);
        },
        
        // Health Check
        'healthCheck': async () => {
          res.status(200).json({ status: 'healthy' });
        },
        
        // Meta information
        'listAvailableActions': async () => {
          res.status(200).json({
            availableActions: Object.keys(actionMap),
            documentation: {
              updateBidAndBudget: {
                description: "Atualiza lance e orçamento de uma campanha",
                parameters: {
                  campaignId: "ID da campanha (obrigatório)",
                  newBid: "Novo valor de lance em sua moeda local",
                  newBudget: "Novo valor de orçamento em sua moeda local"
                }
              },
              getBidAndBudgetStatus: {
                description: "Obtém o status atual de lance e orçamento",
                parameters: {
                  campaignId: "ID da campanha (obrigatório)"
                }
              },
              getCampaignPerformance: {
                description: "Obtém métricas de desempenho da campanha",
                parameters: {
                  campaignId: "ID da campanha (obrigatório)",
                  dateRange: "Intervalo de datas (ex: LAST_30_DAYS, TODAY)"
                }
              },
              getCampaignMetrics: {
                description: "Obtém métricas específicas da campanha",
                parameters: {
                  campaignId: "ID da campanha (obrigatório)",
                  metrics: "Lista de métricas separadas por vírgula"
                }
              },
              getCreativePerformance: {
                description: "Obtém métricas de desempenho do anúncio criativo",
                parameters: {
                  creativeId: "ID do anúncio criativo (obrigatório)",
                  dateRange: "Intervalo de datas (ex: LAST_30_DAYS, TODAY)"
                }
              },
              getCreativeMetrics: {
                description: "Obtém métricas específicas do anúncio criativo",
                parameters: {
                  creativeId: "ID do anúncio criativo (obrigatório)",
                  metrics: "Lista de métricas separadas por vírgula"
                }
              },
              listClientAccounts: {
                description: "Lista contas de clientes disponíveis",
                parameters: {
                  includeAllStatuses: "Se deve incluir contas com todos os status (padrão: true)"
                }
              },
              listCampaigns: {
                description: "Lista campanhas de uma conta específica",
                parameters: {
                  accountId: "ID da conta (opcional)",
                  status: "Status da campanha (padrão: ENABLED)"
                }
              },
              listAllCampaigns: {
                description: "Lista todas as campanhas de todas as contas",
                parameters: {
                  status: "Status da campanha (padrão: ENABLED)"
                }
              },
              healthCheck: {
                description: "Verifica se o MCP está funcionando corretamente",
                parameters: {}
              },
              listAvailableActions: {
                description: "Lista todas as ações disponíveis com documentação",
                parameters: {}
              }
            }
          });
        }
      };
      
      // Verificar se a ação é válida
      if (!actionMap[action]) {
        logger.warn(`Invalid action requested: ${action}`);
        return res.status(400).json({ 
          error: 'Invalid action', 
          message: `Action '${action}' not found`,
          hint: "Use action 'listAvailableActions' to see all available actions",
          validActions: Object.keys(actionMap) 
        });
      }
      
      // Executar a função correspondente
      logger.info(`Executing action: ${action}`);
      await actionMap[action]();
      
    } catch (error) {
      logger.error(`Error in gateway execute: ${error.message}`, error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = { GatewayController }; 