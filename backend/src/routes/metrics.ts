import { Router, Request, Response } from 'express';
import { MetricsService } from '../services/metrics';

const router = Router();

// Metrics endpoint for Prometheus scraping
router.get('/', async (req: Request, res: Response) => {
  try {
    const metrics = await MetricsService.getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

export default router;
