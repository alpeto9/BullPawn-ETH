import { register, Counter, Histogram, Gauge } from 'prom-client';

// Create custom metrics
export const pawnCreationsTotal = new Counter({
  name: 'bullpawn_pawn_creations_total',
  help: 'Total number of pawn positions created',
  labelNames: ['status'] // success, failure
});

export const pawnRedemptionsTotal = new Counter({
  name: 'bullpawn_pawn_redemptions_total',
  help: 'Total number of pawn positions redeemed',
  labelNames: ['status'] // success, failure
});

export const activePawnsGauge = new Gauge({
  name: 'bullpawn_active_pawns',
  help: 'Current number of active pawn positions'
});

export const pawnCreationDuration = new Histogram({
  name: 'bullpawn_pawn_creation_duration_seconds',
  help: 'Duration of pawn creation operations',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const pawnRedemptionDuration = new Histogram({
  name: 'bullpawn_pawn_redemption_duration_seconds',
  help: 'Duration of pawn redemption operations',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const ethPriceRequestsTotal = new Counter({
  name: 'bullpawn_eth_price_requests_total',
  help: 'Total number of ETH price requests',
  labelNames: ['status'] // success, failure
});

export const blockchainTransactionsTotal = new Counter({
  name: 'bullpawn_blockchain_transactions_total',
  help: 'Total number of blockchain transactions',
  labelNames: ['type', 'status'] // type: create, redeem, etc. status: success, failure
});

// Default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

export class MetricsService {
  static incrementPawnCreations(status: 'success' | 'failure') {
    pawnCreationsTotal.inc({ status });
  }

  static incrementPawnRedemptions(status: 'success' | 'failure') {
    pawnRedemptionsTotal.inc({ status });
  }

  static setActivePawns(count: number) {
    activePawnsGauge.set(count);
  }

  static async getActivePawnsCount(): Promise<number> {
    // Get the current value from the gauge
    const metric = await activePawnsGauge.get();
    return metric.values[0]?.value || 0;
  }

  static async updateActivePawnsFromBlockchain(): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { BlockchainService } = await import('./blockchain');
      const blockchainService = new BlockchainService();
      const realCount = await blockchainService.getActivePawnsCount();
      activePawnsGauge.set(realCount);
      console.log('Updated active pawns from blockchain:', realCount);
    } catch (error) {
      console.error('Error updating active pawns from blockchain:', error);
    }
  }

  static startPawnCreationTimer() {
    return pawnCreationDuration.startTimer();
  }

  static startPawnRedemptionTimer() {
    return pawnRedemptionDuration.startTimer();
  }

  static incrementEthPriceRequests(status: 'success' | 'failure') {
    ethPriceRequestsTotal.inc({ status });
  }

  static incrementBlockchainTransactions(type: string, status: 'success' | 'failure') {
    blockchainTransactionsTotal.inc({ type, status });
  }

  static async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
