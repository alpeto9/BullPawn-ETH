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
  availableWallets: string[];
  selectedWallet: string | null;
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
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Function to detect available wallets
  const detectWallets = () => {
    const wallets: string[] = [];
    
    // Check for MetaMask
    if (window.ethereum?.isMetaMask) {
      wallets.push('MetaMask');
    }
    
    // Check for other common wallets
    if (window.ethereum?.isCoinbaseWallet) {
      wallets.push('Coinbase Wallet');
    }
    
    if (window.ethereum?.isRabby) {
      wallets.push('Rabby');
    }
    
    if (window.ethereum?.isBraveWallet) {
      wallets.push('Brave Wallet');
    }
    
    // If no specific wallet detected but ethereum exists, assume generic
    if (window.ethereum && wallets.length === 0) {
      wallets.push('Web3 Wallet');
    }
    
    setAvailableWallets(wallets);
    return wallets;
  };

  // Function to get the ethereum provider safely
  const getEthereumProvider = () => {
    if (typeof window === 'undefined') return null;
    
    // Try to access ethereum safely
    try {
      return window.ethereum;
    } catch (error) {
      console.warn('Error accessing window.ethereum:', error);
      return null;
    }
  };

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumProvider();
      
      if (!ethereum) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      // Detect available wallets first
      detectWallets();

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const web3Provider = new ethers.providers.Web3Provider(ethereum);
        const zkSyncProvider = new Provider(process.env.REACT_APP_ZKSYNC_RPC_URL || 'https://sepolia.era.zksync.dev');
        
        setAccount(accounts[0]);
        setProvider(web3Provider);
        setZkProvider(zkSyncProvider);
        setSigner(web3Provider.getSigner());
        setIsConnected(true);

        // Set selected wallet
        if (ethereum.isMetaMask) {
          setSelectedWallet('MetaMask');
        } else if (ethereum.isCoinbaseWallet) {
          setSelectedWallet('Coinbase Wallet');
        } else if (ethereum.isRabby) {
          setSelectedWallet('Rabby');
        } else if (ethereum.isBraveWallet) {
          setSelectedWallet('Brave Wallet');
        } else {
          setSelectedWallet('Web3 Wallet');
        }

        // Listen for account changes
        ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            setAccount(newAccounts[0]);
          } else {
            disconnectWallet();
          }
        });

        // Listen for network changes
        ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Handle specific error cases
      if (error.code === 4001) {
        alert('Connection rejected by user');
      } else if (error.code === -32002) {
        alert('Connection request already pending. Please check your wallet.');
      } else {
        alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setZkProvider(null);
    setSigner(null);
    setIsConnected(false);
    setSelectedWallet(null);
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      const ethereum = getEthereumProvider();
      
      if (ethereum) {
        try {
          // Detect available wallets
          detectWallets();
          
          const accounts = await ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const web3Provider = new ethers.providers.Web3Provider(ethereum);
            const zkSyncProvider = new Provider(process.env.REACT_APP_ZKSYNC_RPC_URL || 'https://sepolia.era.zksync.dev');
            
            setAccount(accounts[0]);
            setProvider(web3Provider);
            setZkProvider(zkSyncProvider);
            setSigner(web3Provider.getSigner());
            setIsConnected(true);

            // Set selected wallet
            if (ethereum.isMetaMask) {
              setSelectedWallet('MetaMask');
            } else if (ethereum.isCoinbaseWallet) {
              setSelectedWallet('Coinbase Wallet');
            } else if (ethereum.isRabby) {
              setSelectedWallet('Rabby');
            } else if (ethereum.isBraveWallet) {
              setSelectedWallet('Brave Wallet');
            } else {
              setSelectedWallet('Web3 Wallet');
            }
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
    availableWallets,
    selectedWallet,
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
