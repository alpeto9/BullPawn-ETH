import { ethers } from 'ethers';
import { Provider, Contract } from 'zksync-web3';
import SimplePawnSystemABI from '../abis/SimplePawnSystem.json';

// Contract addresses - from environment variables
const CONTRACT_ADDRESSES = {
  SIMPLE_PAWN_SYSTEM: process.env.REACT_APP_PAWN_CONTRACT_ADDRESS || '0x386ab82DF4Fb449cF16f9a42E13e7Bc25Cfe0010',
  MOCK_USDT: process.env.REACT_APP_USDT_CONTRACT_ADDRESS || '0x0b491BBbe8D998a1ed986daf539DE3D765626e68',
  MOCK_PRICE_FEED: process.env.REACT_APP_ETH_PRICE_FEED_ADDRESS || '0xaC92601017E3F753Ea7bE9De64fcC786c8FB0230'
};

export class FrontendBlockchainService {
  private provider: ethers.providers.Web3Provider;
  private zkProvider: Provider;
  private signer: ethers.Signer;
  private pawnContract: ethers.Contract;
  private usdtContract: ethers.Contract;
  private priceFeedContract: ethers.Contract;

  constructor(provider: ethers.providers.Web3Provider, zkProvider: Provider) {
    this.provider = provider;
    this.zkProvider = zkProvider;
    this.signer = provider.getSigner();
    
    // Initialize contracts with the correct ABIs
    this.pawnContract = new ethers.Contract(
      CONTRACT_ADDRESSES.SIMPLE_PAWN_SYSTEM,
      SimplePawnSystemABI.abi,
      this.signer
    );
    
    this.usdtContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_USDT,
      [
        {
          "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
          ],
          "name": "approve",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "address", "name": "spender", "type": "address"}
          ],
          "name": "allowance",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      this.signer
    );
    
    this.priceFeedContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_PRICE_FEED,
      [
        {
          "inputs": [],
          "name": "getLatestPrice",
          "outputs": [{"internalType": "int256", "name": "", "type": "int256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      this.signer
    );
  }

  async getETHPrice(): Promise<number> {
    try {
      const price = await this.priceFeedContract.getLatestPrice();
      return Number(price) / 100; // Convert from 8 decimals to 6 decimals
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      return 2000; // Fallback price
    }
  }

  async getTotalPawns(): Promise<number> {
    try {
      const total = await this.pawnContract.getTotalPawns();
      return total.toNumber();
    } catch (error) {
      console.error('Error fetching total pawns:', error);
      throw error;
    }
  }

  async getNextPositionId(): Promise<number> {
    try {
      const nextId = await this.pawnContract.nextPositionId();
      return nextId.toNumber();
    } catch (error) {
      console.error('Error fetching next position ID:', error);
      throw error;
    }
  }

  async getUserPositions(userAddress: string): Promise<number[]> {
    try {
      const positions = await this.pawnContract.getUserPositions(userAddress);
      return positions.map((pos: any) => pos.toNumber());
    } catch (error) {
      console.error('Error fetching user positions:', error);
      throw error;
    }
  }

  async getPosition(positionId: number): Promise<any> {
    try {
      const position = await this.pawnContract.getPosition(positionId);
      return {
        user: position.user,
        amount: position.amount.toString(),
        collateralValue: position.collateralValue.toString(),
        timestamp: position.timestamp.toNumber(),
        isActive: position.isActive
      };
    } catch (error) {
      console.error('Error fetching position:', error);
      throw error;
    }
  }

  async createPawn(ethAmount: number): Promise<string> {
    try {
      // Convert ETH amount to wei
      const ethValue = ethers.utils.parseEther(ethAmount.toString());
      
      // Call createPawn with ETH value (payable function)
      const tx = await this.pawnContract.createPawn({
        value: ethValue
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error creating pawn:', error);
      throw error;
    }
  }

  async redeemPawn(positionId: number): Promise<string> {
    try {
      const userAddress = await this.signer.getAddress();
      
      // Get the position to calculate repayment amount
      const position = await this.getPosition(positionId);
      const repaymentAmount = position.amount;
      
      // Check current allowance
      const currentAllowance = await this.usdtContract.allowance(userAddress, CONTRACT_ADDRESSES.PAWN_SYSTEM);
      
      // If allowance is insufficient, approve the contract
      if (currentAllowance.lt(repaymentAmount)) {
        const approveTx = await this.usdtContract.approve(
          CONTRACT_ADDRESSES.PAWN_SYSTEM,
          repaymentAmount
        );
        await approveTx.wait();
      }
      
      // Redeem the pawn
      const tx = await this.pawnContract.redeemPawn(positionId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error redeeming pawn:', error);
      throw error;
    }
  }

  async getUSDTBalance(userAddress: string): Promise<number> {
    try {
      const balance = await this.usdtContract.balanceOf(userAddress);
      return balance.toNumber();
    } catch (error) {
      console.error('Error fetching USDT balance:', error);
      throw error;
    }
  }

  async getUSDTAllowance(userAddress: string, spender: string): Promise<number> {
    try {
      const allowance = await this.usdtContract.allowance(userAddress, spender);
      return allowance.toNumber();
    } catch (error) {
      console.error('Error fetching USDT allowance:', error);
      throw error;
    }
  }

  async approveUSDT(spender: string, amount: number): Promise<string> {
    try {
      const tx = await this.usdtContract.approve(spender, amount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error approving USDT:', error);
      throw error;
    }
  }
}