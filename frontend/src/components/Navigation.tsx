import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper, Box } from '@mui/material';
import { Dashboard, Add, List } from '@mui/icons-material';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/create':
        return 1;
      case '/positions':
        return 2;
      default:
        return 0;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(26, 26, 26, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        overflow: 'hidden',
        width: 'calc(100% - 40px)',
        maxWidth: '400px',
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
      <BottomNavigation
        value={getCurrentTab()}
        onChange={(event, newValue) => {
          switch (newValue) {
            case 0:
              navigate('/');
              break;
            case 1:
              navigate('/create');
              break;
            case 2:
              navigate('/positions');
              break;
          }
        }}
        sx={{
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255, 255, 255, 0.5)',
            minWidth: 'auto',
            padding: '6px 12px',
            '&.Mui-selected': {
              color: '#7877C6',
              '& .MuiSvgIcon-root': {
                transform: 'scale(1.1)',
              },
            },
            '& .MuiSvgIcon-root': {
              transition: 'transform 0.3s ease',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 600,
              opacity: 1, // Always show labels
              '&.Mui-selected': {
                fontSize: '0.75rem',
                opacity: 1,
              },
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<Dashboard />}
        />
        <BottomNavigationAction
          label="Create"
          icon={<Add />}
        />
        <BottomNavigationAction
          label="Positions"
          icon={<List />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;
