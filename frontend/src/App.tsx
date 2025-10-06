import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, useTheme } from '@mui/material';
import { useWeb3 } from './contexts/Web3Context';
import Dashboard from './components/Dashboard';
import CreatePawn from './components/CreatePawn';
import MyPositions from './components/MyPositions';
import WalletConnect from './components/WalletConnect';
import Navigation from './components/Navigation';
import Logo from './components/Logo';

function App() {
  const { account, isConnected } = useWeb3();
  const theme = useTheme();

  return (
    <Router>
      <Box sx={{ 
        flexGrow: 1, 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}>
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            backgroundColor: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, rgba(120, 119, 198, 0.1) 0%, rgba(255, 119, 198, 0.1) 100%)',
              opacity: 0.3,
            }
          }}
        >
          <Toolbar sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Logo size={48} variant="text" />
            </Box>
            <WalletConnect />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
          {!isConnected ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center',
                background: 'rgba(26, 26, 26, 0.6)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                p: 6,
                position: 'relative',
                overflow: 'hidden',
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
              <Box sx={{ mb: 4 }}>
                <Logo size={120} variant="full" />
              </Box>
              <Typography 
                variant="h2" 
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
                Welcome to BullPawn
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  color: 'rgba(255, 255, 255, 0.7)',
                  maxWidth: '600px',
                  lineHeight: 1.6
                }}
              >
                Connect your wallet to start using the decentralized pawn platform. 
                Get instant liquidity by pledging your ETH and receiving USDT.
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 6, 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.875rem'
                }}
              >
                Author: <a href="https://github.com/alpeto9" target="_blank" rel="noopener noreferrer" style={{ color: '#7877C6', textDecoration: 'none' }}>@alpeto9</a>
              </Typography>
              <WalletConnect />
            </Box>
          ) : (
            <>
              <Navigation />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create" element={<CreatePawn />} />
                <Route path="/positions" element={<MyPositions />} />
              </Routes>
            </>
          )}
        </Container>
        
        {/* Author Credit Footer */}
        <Box sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          textAlign: 'center', 
          py: 1,
          backgroundColor: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1000
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem'
            }}
          >
            Author: <a href="https://github.com/alpeto9" target="_blank" rel="noopener noreferrer" style={{ color: '#7877C6', textDecoration: 'none' }}>@alpeto9</a>
          </Typography>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
