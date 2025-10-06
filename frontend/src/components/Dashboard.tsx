import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, Security } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { apiService } from '../services/api';

interface DashboardStats {
  ethPrice: number;
  ethBalance: string;
  usdtBalance: string;
  totalPositions: number;
  activePositions: number;
}

const Dashboard: React.FC = () => {
  const { account } = useWeb3();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account) {
      loadDashboardData();
    }
  }, [account]);

  const loadDashboardData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const [ethPrice, balances] = await Promise.all([
        apiService.getETHPrice(),
        apiService.getBalances(account),
      ]);

      // Get user positions to calculate stats
      const positions = await apiService.getUserPositions(account);

      setStats({
        ethPrice: ethPrice.price,
        ethBalance: balances.eth,
        usdtBalance: balances.usdt,
        totalPositions: positions.positions.length,
        activePositions: positions.positions.length, // Simplified for now
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* ETH Price Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: '#4caf50', mr: 1 }} />
                <Typography variant="h6">ETH Price</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {stats?.ethPrice ? `$${stats.ethPrice.toFixed(2)}` : 'Loading...'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ETH Balance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ color: '#ff9800', mr: 1 }} />
                <Typography variant="h6">ETH Balance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {parseFloat(stats?.ethBalance || '0').toFixed(4)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* USDT Balance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6">USDT Balance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {parseFloat(stats?.usdtBalance || '0').toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Positions Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown sx={{ color: '#f44336', mr: 1 }} />
                <Typography variant="h6">Active Positions</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {stats?.activePositions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => window.location.href = '/create'}
                  sx={{ backgroundColor: '#1976d2' }}
                >
                  Create New Pawn
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => apiService.faucetUSDT(account!)}
                  sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                >
                  Get USDT Faucet
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/positions'}
                  sx={{ borderColor: '#ff9800', color: '#ff9800' }}
                >
                  View My Positions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Info */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="zkSync Testnet" color="primary" />
                <Chip label="70% LTV" color="secondary" />
                <Chip label="10% Interest" color="default" />
                <Chip label="1 Year Term" color="default" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
