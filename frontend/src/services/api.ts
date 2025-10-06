import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/pawn`,
  timeout: 30000,
});

export const apiService = {
  // Get ETH price
  getETHPrice: async () => {
    const response = await api.get('/price/eth');
    return response.data;
  },

  // Create a new pawn position
  createPawn: async (ethAmount: string) => {
    const response = await api.post('/create', { ethAmount });
    return response.data;
  },

  // Redeem a pawn position
  redeemPawn: async (positionId: number, usdtAmount: string) => {
    const response = await api.post('/redeem', { positionId, usdtAmount });
    return response.data;
  },

  // Liquidate a pawn position
  liquidatePawn: async (positionId: number) => {
    const response = await api.post(`/liquidate/${positionId}`);
    return response.data;
  },

  // Get position details
  getPosition: async (positionId: number) => {
    const response = await api.get(`/position/${positionId}`);
    return response.data;
  },

  // Get user positions
  getUserPositions: async (userAddress: string) => {
    const response = await api.get(`/user/${userAddress}`);
    return response.data;
  },

  // Check if position should be liquidated
  shouldLiquidate: async (positionId: number) => {
    const response = await api.get(`/liquidate/${positionId}/check`);
    return response.data;
  },

  // Get user balances
  getBalances: async (userAddress: string) => {
    const response = await api.get(`/balances/${userAddress}`);
    return response.data;
  },

  // Get USDT from faucet
  faucetUSDT: async (userAddress: string) => {
    const response = await api.post('/faucet/usdt', { userAddress });
    return response.data;
  },
};
