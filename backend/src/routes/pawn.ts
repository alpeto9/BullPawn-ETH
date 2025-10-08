import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { MetricsService } from '../services/metrics';
import { validateCreatePawn, validateRedeemPawn } from '../middleware/validation';

const router = Router();
const blockchainService = new BlockchainService();

// Get ETH price
router.get('/price/eth', async (req: Request, res: Response) => {
  try {
    const price = await blockchainService.getETHPrice();
    MetricsService.incrementEthPriceRequests('success');
    res.json({ price });
  } catch (error) {
    MetricsService.incrementEthPriceRequests('failure');
    res.status(500).json({ error: 'Failed to get ETH price' });
  }
});

// Create a new pawn position
router.post('/create', validateCreatePawn, async (req: Request, res: Response) => {
  const timer = MetricsService.startPawnCreationTimer();
  try {
    const { ethAmount } = req.body;
    console.log('Creating pawn with ETH amount:', ethAmount);
    const result = await blockchainService.createPawn(ethAmount);
    MetricsService.incrementPawnCreations('success');
    MetricsService.incrementBlockchainTransactions('create', 'success');
    
    // Update active pawns count (increment by 1)
    const currentActivePawns = await MetricsService.getActivePawnsCount();
    MetricsService.setActivePawns(currentActivePawns + 1);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error creating pawn position:', error);
    MetricsService.incrementPawnCreations('failure');
    MetricsService.incrementBlockchainTransactions('create', 'failure');
    res.status(500).json({ error: 'Failed to create pawn position', details: error.message });
  } finally {
    timer();
  }
});

// Redeem a pawn position
router.post('/redeem', validateRedeemPawn, async (req: Request, res: Response) => {
  const timer = MetricsService.startPawnRedemptionTimer();
  try {
    const { positionId, usdtAmount } = req.body;
    const txHash = await blockchainService.redeemPawn(positionId, usdtAmount);
    MetricsService.incrementPawnRedemptions('success');
    MetricsService.incrementBlockchainTransactions('redeem', 'success');
    
    // Update active pawns count (decrement by 1)
    const currentActivePawns = await MetricsService.getActivePawnsCount();
    MetricsService.setActivePawns(Math.max(0, currentActivePawns - 1));
    
    res.json({ txHash });
  } catch (error) {
    MetricsService.incrementPawnRedemptions('failure');
    MetricsService.incrementBlockchainTransactions('redeem', 'failure');
    res.status(500).json({ error: 'Failed to redeem pawn position' });
  } finally {
    timer();
  }
});

// Liquidate a pawn position
router.post('/liquidate/:positionId', async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const txHash = await blockchainService.liquidatePawn(parseInt(positionId));
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to liquidate pawn position' });
  }
});

// Get position details
router.get('/position/:positionId', async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const position = await blockchainService.getPosition(parseInt(positionId));
    res.json(position);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get position details' });
  }
});

// Get user positions
router.get('/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const positions = await blockchainService.getUserPositions(address);
    
    // Update active pawns count from blockchain when getting positions
    await MetricsService.updateActivePawnsFromBlockchain();
    
    res.json({ positions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user positions' });
  }
});

// Check if position should be liquidated
router.get('/liquidate/:positionId/check', async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const shouldLiquidate = await blockchainService.shouldLiquidate(parseInt(positionId));
    res.json({ shouldLiquidate });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check liquidation status' });
  }
});

// Get user balances
router.get('/balances/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const [ethBalance, usdtBalance] = await Promise.all([
      blockchainService.getETHBalance(address),
      blockchainService.getUSDTBalance(address)
    ]);
    
    res.json({
      eth: ethBalance,
      usdt: usdtBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balances' });
  }
});

// Get USDT from faucet
router.post('/faucet/usdt', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const txHash = await blockchainService.faucetUSDT(userAddress);
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get USDT from faucet' });
  }
});

export { router as pawnRoutes };
