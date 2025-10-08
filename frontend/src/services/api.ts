import axios from 'axios';

// Function to get API base URL at runtime
const getApiBaseUrl = async (): Promise<string> => {
  try {
    // Try to fetch config from a runtime config file
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = await response.json();
      return config.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    }
  } catch (error) {
    console.warn('Failed to load runtime config, using fallback:', error);
  }
  
  // Fallback to environment variable (for development)
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
};

// Create API instance with dynamic base URL
const createApiInstance = async () => {
  const baseURL = await getApiBaseUrl();
  return axios.create({
    baseURL: `${baseURL}/api/pawn`,
    timeout: 30000,
  });
};

export const apiService = {
  // Get ETH price
  getETHPrice: async () => {
    const api = await createApiInstance();
    const response = await api.get('/price/eth');
    return response.data;
  },

  // Create a new pawn position
  createPawn: async (ethAmount: string) => {
    const api = await createApiInstance();
    const response = await api.post('/create', { ethAmount });
    return response.data;
  },

  // Redeem a pawn position
  redeemPawn: async (positionId: number, usdtAmount: string) => {
    const api = await createApiInstance();
    const response = await api.post('/redeem', { positionId, usdtAmount });
    return response.data;
  },

  // Liquidate a pawn position
  liquidatePawn: async (positionId: number) => {
    const api = await createApiInstance();
    const response = await api.post(`/liquidate/${positionId}`);
    return response.data;
  },

  // Get position details
  getPosition: async (positionId: number) => {
    const api = await createApiInstance();
    const response = await api.get(`/position/${positionId}`);
    return response.data;
  },

  // Get user positions
  getUserPositions: async (userAddress: string) => {
    const api = await createApiInstance();
    const response = await api.get(`/user/${userAddress}`);
    return response.data;
  },

  // Check if position should be liquidated
  shouldLiquidate: async (positionId: number) => {
    const api = await createApiInstance();
    const response = await api.get(`/liquidate/${positionId}/check`);
    return response.data;
  },

  // Get user balances
  getBalances: async (userAddress: string) => {
    const api = await createApiInstance();
    const response = await api.get(`/balances/${userAddress}`);
    return response.data;
  },

  // Get USDT from faucet
  faucetUSDT: async (userAddress: string) => {
    const api = await createApiInstance();
    const response = await api.post('/faucet/usdt', { userAddress });
    return response.data;
  },
};
