import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { Provider, Wallet } from 'zksync-web3';

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  zkProvider: Provider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signer: ethers.Signer | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [zkProvider, setZkProvider] = useState<Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length > 0) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const zkSyncProvider = new Provider(process.env.REACT_APP_ZKSYNC_RPC_URL || 'https://sepolia.era.zksync.dev');
          
          setAccount(accounts[0]);
          setProvider(web3Provider);
          setZkProvider(zkSyncProvider);
          setSigner(web3Provider.getSigner());
          setIsConnected(true);

          // Listen for account changes
          window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
            if (newAccounts.length > 0) {
              setAccount(newAccounts[0]);
            } else {
              disconnectWallet();
            }
          });

          // Listen for network changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setZkProvider(null);
    setSigner(null);
    setIsConnected(false);
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const zkSyncProvider = new Provider(process.env.REACT_APP_ZKSYNC_RPC_URL || 'https://sepolia.era.zksync.dev');
            
            setAccount(accounts[0]);
            setProvider(web3Provider);
            setZkProvider(zkSyncProvider);
            setSigner(web3Provider.getSigner());
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  const value: Web3ContextType = {
    account,
    isConnected,
    provider,
    zkProvider,
    connectWallet,
    disconnectWallet,
    signer,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
