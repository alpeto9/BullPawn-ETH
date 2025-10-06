import React from 'react';
import { Box } from '@mui/material';
import bullLogo from '../bulllogo.png';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'text';
  color?: 'primary' | 'white' | 'gradient';
}

const BullIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Box
    component="img"
    src={bullLogo}
    alt="BullPawn Logo"
    sx={{
      width: size,
      height: size,
      objectFit: 'contain',
      backgroundColor: 'transparent',
    }}
  />
);

const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  variant = 'full', 
  color = 'gradient' 
}) => {
  const getColor = () => {
    switch (color) {
      case 'white':
        return 'white';
      case 'primary':
        return '#7877C6';
      case 'gradient':
      default:
        return 'url(#bullGradient)';
    }
  };

  if (variant === 'icon') {
    return <BullIcon size={size} color={getColor()} />;
  }

  if (variant === 'text') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BullIcon size={size} color={getColor()} />
        <Box sx={{ ml: 1 }}>
          <Box
            sx={{
              fontSize: size * 0.4,
              fontWeight: 800,
              background: 'linear-gradient(45deg, #7877C6, #FF77C6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            BullPawn
          </Box>
        </Box>
      </Box>
    );
  }

  // Full variant (default)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <BullIcon size={size} color={getColor()} />
      <Box sx={{ ml: 2 }}>
        <Box
          sx={{
            fontSize: size * 0.5,
            fontWeight: 800,
            background: 'linear-gradient(45deg, #7877C6, #FF77C6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          BullPawn
        </Box>
        <Box
          sx={{
            fontSize: size * 0.2,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Sepolia zkSync Pawn System
        </Box>
      </Box>
    </Box>
  );
};

export default Logo;
