import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import { Send, Calculate, TrendingUp, Security, Schedule } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { apiService } from '../services/api';
import { FrontendBlockchainService } from '../services/blockchain';

const CreatePawn: React.FC = () => {
  const { account, provider, zkProvider } = useWeb3();
  const [ethAmount, setEthAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ethPrice, setEthPrice] = useState(0);
  const [calculatedLoan, setCalculatedLoan] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);

  useEffect(() => {
    if (provider && zkProvider) {
      loadETHPrice();
    }
  }, [provider, zkProvider]);

  useEffect(() => {
    if (ethAmount && ethPrice && ethPrice > 0) {
      const ethValue = parseFloat(ethAmount) * ethPrice;
      const loanAmount = (ethValue * 70) / 100; // 70% LTV
      setCalculatedLoan(loanAmount);
    } else {
      setCalculatedLoan(0);
    }
  }, [ethAmount, ethPrice]);

  const loadETHPrice = async () => {
    if (!provider || !zkProvider) return;
    
    try {
      setPriceLoading(true);
      const blockchainService = new FrontendBlockchainService(provider, zkProvider);
      const price = await blockchainService.getETHPrice();
      setEthPrice(price);
    } catch (error) {
      console.error('Error loading ETH price:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleCreatePawn = async () => {
    if (!account || !provider || !zkProvider) {
      setError('Please connect your wallet first');
      return;
    }

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setError('Please enter a valid ETH amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Create blockchain service instance
      const blockchainService = new FrontendBlockchainService(provider, zkProvider);
      
      // Create the pawn position using user's wallet
      const ethValue = parseFloat(ethAmount) * ethPrice;
      const loanAmount = (ethValue * 70) / 100; // 70% LTV
      const result = await blockchainService.createPawn(loanAmount, ethValue);

      setSuccess(`Pawn position created successfully! Transaction: ${result}`);
      setEthAmount('');
      setCalculatedLoan(0);
    } catch (error: any) {
      setError(error.message || 'Failed to create pawn position');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          gutterBottom
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(45deg, #7877C6, #FF77C6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Create New Position
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: '600px', mx: 'auto' }}>
          Pledge your ETH to get instant USDT liquidity with competitive rates on BullPawn
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(120, 119, 198, 0.1) 0%, rgba(255, 119, 198, 0.1) 100%)',
                opacity: 0.3,
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUp sx={{ mr: 2, color: '#7877C6' }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Position Details
                </Typography>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    background: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    borderRadius: '12px'
                  }}
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: '12px'
                  }}
                >
                  {success}
                </Alert>
              )}

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  ETH Amount to Pledge
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  placeholder="0.0"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      '& fieldset': {
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        border: '2px solid rgba(120, 119, 198, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        border: '2px solid #7877C6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <Chip 
                        label="ETH" 
                        sx={{ 
                          background: 'linear-gradient(45deg, #7877C6, #FF77C6)',
                          color: 'white',
                          fontWeight: 600
                        }} 
                      />
                    ),
                  }}
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current ETH Price
                  </Typography>
                  <Chip 
                    icon={<TrendingUp />}
                    label={`$${ethPrice.toFixed(2)}`}
                    sx={{ 
                      background: 'rgba(120, 119, 198, 0.2)',
                      color: '#7877C6',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCreatePawn}
                disabled={loading || !ethAmount || parseFloat(ethAmount) <= 0}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <Send />}
                sx={{
                  background: 'linear-gradient(45deg, #7877C6, #FF77C6)',
                  borderRadius: '16px',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(120, 119, 198, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #6B6BB8, #E666B8)',
                    boxShadow: '0 12px 40px rgba(120, 119, 198, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? 'Creating Position...' : 'Create Position'}
              </Button>
            </CardContent>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              mb: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(120, 119, 198, 0.1) 0%, rgba(255, 119, 198, 0.1) 100%)',
                opacity: 0.3,
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Calculate sx={{ mr: 2, color: '#FF77C6' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Loan Calculation
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    ETH Value
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {priceLoading ? 'Loading...' : `$${ethAmount ? (parseFloat(ethAmount) * ethPrice).toFixed(2) : '0.00'}`}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loan Amount (70% LTV)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#7877C6' }}>
                    {priceLoading ? 'Loading...' : `$${calculatedLoan.toFixed(2)} USDT`}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Repayment (10% interest)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#FF77C6' }}>
                    {priceLoading ? 'Loading...' : `$${(calculatedLoan * 1.1).toFixed(2)} USDT`}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Loan Term
                </Typography>
                <Chip 
                  icon={<Schedule />}
                  label="1 Year"
                  sx={{ 
                    background: 'rgba(255, 119, 198, 0.2)',
                    color: '#FF77C6',
                    fontWeight: 600
                  }}
                />
              </Box>
            </CardContent>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(120, 119, 198, 0.1) 0%, rgba(255, 119, 198, 0.1) 100%)',
                opacity: 0.3,
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Security sx={{ mr: 2, color: '#7877C6' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Important Notes
                </Typography>
              </Box>
              
              <Box sx={{ '& > *': { mb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: '#7877C6', 
                    mt: 1, 
                    mr: 2, 
                    flexShrink: 0 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    You will receive 70% of your ETH value in USDT
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: '#FF77C6', 
                    mt: 1, 
                    mr: 2, 
                    flexShrink: 0 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    Repay 110% of the loan amount to recover your ETH
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: '#7877C6', 
                    mt: 1, 
                    mr: 2, 
                    flexShrink: 0 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    Position will be liquidated if ETH drops to 70% of original value
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: '#FF77C6', 
                    mt: 1, 
                    mr: 2, 
                    flexShrink: 0 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    Loan term is 1 year from creation date
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreatePawn;
