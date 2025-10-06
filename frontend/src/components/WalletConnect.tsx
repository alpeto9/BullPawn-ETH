import React from 'react';
import { Button, Box, Typography, Chip, Avatar } from '@mui/material';
import { AccountBalanceWallet, Logout, CheckCircle } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';

const WalletConnect: React.FC = () => {
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          label="Sepolia zkSync"
          sx={{
            background: 'rgba(255, 119, 198, 0.2)',
            border: '1px solid rgba(255, 119, 198, 0.3)',
            color: '#FF77C6',
            fontWeight: 600,
            fontSize: '0.75rem',
            '& .MuiChip-label': {
              px: 2
            }
          }}
        />
        <Chip
          avatar={
            <Avatar sx={{ 
              background: 'linear-gradient(45deg, #7877C6, #FF77C6)',
              width: 24,
              height: 24
            }}>
              <CheckCircle sx={{ fontSize: 16, color: 'white' }} />
            </Avatar>
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
              {formatAddress(account)}
            </Typography>
          }
          sx={{
            background: 'rgba(120, 119, 198, 0.2)',
            border: '1px solid rgba(120, 119, 198, 0.3)',
            '& .MuiChip-label': {
              px: 2
            }
          }}
        />
        <Button
          variant="outlined"
          startIcon={<Logout />}
          onClick={disconnectWallet}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              borderColor: 'rgba(255, 119, 198, 0.5)',
              color: '#FF77C6',
              background: 'rgba(255, 119, 198, 0.1)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Disconnect
        </Button>
      </Box>
    );
  }

  return (
    <Button
      variant="contained"
      startIcon={<AccountBalanceWallet />}
      onClick={connectWallet}
      sx={{
        background: 'linear-gradient(45deg, #7877C6, #FF77C6)',
        borderRadius: '16px',
        px: 4,
        py: 1.5,
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'none',
        boxShadow: '0 8px 32px rgba(120, 119, 198, 0.3)',
        '&:hover': {
          background: 'linear-gradient(45deg, #6B6BB8, #E666B8)',
          boxShadow: '0 12px 40px rgba(120, 119, 198, 0.4)',
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.3s ease',
      }}
    >
      Connect Wallet
    </Button>
  );
};

export default WalletConnect;
