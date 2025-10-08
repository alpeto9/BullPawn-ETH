import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Redeem, Warning, CheckCircle } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { apiService } from '../services/api';
import { format } from 'date-fns';

interface Position {
  user: string;
  ethAmount: string;
  usdtAmount: string;
  timestamp: number;
  maturityDate: number;
  isActive: boolean;
  isLiquidated: boolean;
}

const MyPositions: React.FC = () => {
  const { account } = useWeb3();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeemDialog, setRedeemDialog] = useState<{ open: boolean; positionId: number | null; usdtAmount?: string }>({
    open: false,
    positionId: null,
  });
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null);

  useEffect(() => {
    if (account) {
      loadPositions();
    }
  }, [account]);

  const loadPositions = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const response = await apiService.getUserPositions(account);
      
      // Load detailed information for each position
      const positionDetails = await Promise.all(
        response.positions.map(async (positionId: number) => {
          const position = await apiService.getPosition(positionId);
          return { ...position, positionId };
        })
      );

      setPositions(positionDetails);
    } catch (error) {
      console.error('Error loading positions:', error);
      setError('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemDialog.positionId || !redeemAmount) return;

    try {
      setRedeemLoading(true);
      setRedeemResult(null);
      const result = await apiService.redeemPawn(redeemDialog.positionId, redeemAmount);
      
      setError('');
      setRedeemResult({
        success: true,
        message: 'Position redeemed successfully!',
        txHash: result.txHash
      });
      
      loadPositions(); // Refresh positions
    } catch (error: any) {
      setRedeemResult({
        success: false,
        message: error.message || 'Failed to redeem position'
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const getPositionStatus = (position: Position) => {
    if (position.isLiquidated) {
      return <Chip label="Liquidated" color="error" size="small" />;
    }
    if (!position.isActive) {
      return <Chip label="Redeemed" color="success" size="small" />;
    }
    if (Date.now() > position.maturityDate * 1000) {
      return <Chip label="Overdue" color="warning" size="small" />;
    }
    return <Chip label="Active" color="primary" size="small" />;
  };

  const getRepaymentAmount = (usdtAmount: string) => {
    return (parseFloat(usdtAmount) * 1.1).toFixed(2);
  };

  const closeRedeemDialog = () => {
    setRedeemDialog({ open: false, positionId: null, usdtAmount: undefined });
    setRedeemAmount('');
    setRedeemResult(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Pawn Positions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {positions.length === 0 ? (
        <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No pawn positions found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Create your first pawn position to get started
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => window.location.href = '/create'}
            >
              Create Pawn Position
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Position ID</TableCell>
                <TableCell>ETH Amount</TableCell>
                <TableCell>USDT Loan</TableCell>
                <TableCell>Repayment Amount</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Maturity Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.map((position, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{parseFloat(position.ethAmount).toFixed(4)} ETH</TableCell>
                  <TableCell>{parseFloat(position.usdtAmount).toFixed(2)} USDT</TableCell>
                  <TableCell>{getRepaymentAmount(position.usdtAmount)} USDT</TableCell>
                  <TableCell>
                    {format(new Date(position.timestamp * 1000), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(position.maturityDate * 1000), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{getPositionStatus(position)}</TableCell>
                  <TableCell>
                    {position.isActive && !position.isLiquidated && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Redeem />}
                        onClick={() => {
                          setRedeemDialog({ open: true, positionId: position.positionId, usdtAmount: position.usdtAmount });
                          setRedeemAmount(getRepaymentAmount(position.usdtAmount));
                        }}
                        sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                      >
                        Redeem
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Redeem Dialog */}
      <Dialog
        open={redeemDialog.open}
        onClose={closeRedeemDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Redeem Pawn Position</DialogTitle>
        <DialogContent>
          {!redeemResult ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the repayment amount to redeem your ETH collateral.
              </Typography>
              <TextField
                fullWidth
                label="Repayment Amount (USDT)"
                type="number"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                sx={{ mt: 1 }}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                You need to repay 110% of the original loan amount to recover your ETH.
                {redeemDialog.usdtAmount && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Original loan: {redeemDialog.usdtAmount} USDT<br/>
                    Required repayment: {getRepaymentAmount(redeemDialog.usdtAmount)} USDT
                  </Typography>
                )}
              </Alert>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {redeemResult.success ? (
                <>
                  <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
                  <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                    {redeemResult.message}
                  </Typography>
                  {redeemResult.txHash && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#1a1a1a', borderRadius: 1, border: '1px solid #333' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Transaction Hash:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          wordBreak: 'break-all',
                          color: '#4caf50'
                        }}
                      >
                        {redeemResult.txHash}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <>
                  <Warning sx={{ fontSize: 48, color: '#f44336', mb: 2 }} />
                  <Typography variant="h6" color="error.main" sx={{ mb: 2 }}>
                    {redeemResult.message}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRedeemDialog}>
            {redeemResult ? 'Close' : 'Cancel'}
          </Button>
          {!redeemResult && (
            <Button
              onClick={handleRedeem}
              variant="contained"
              disabled={redeemLoading}
              startIcon={redeemLoading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {redeemLoading ? 'Processing...' : 'Redeem'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyPositions;
