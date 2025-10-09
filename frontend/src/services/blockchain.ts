import { ethers } from 'ethers';
import { Provider, Contract } from 'zksync-web3';

// Contract ABIs - using PawnSystem (working contract)
const PawnSystemABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdtToken",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ethAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "usdtAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maturityDate",
        "type": "uint256"
      }
    ],
    "name": "PawnCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ethAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "usdtAmount",
        "type": "uint256"
      }
    ],
    "name": "PawnRedeemed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ethAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "usdtAmount",
        "type": "uint256"
      }
    ],
    "name": "PawnLiquidated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "createPawn",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "positionId", "type": "uint256"}],
    "name": "redeemPawn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "positionId", "type": "uint256"}],
    "name": "pawnPositions",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "user", "type": "address"},
          {"internalType": "uint256", "name": "ethAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "usdtAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "uint256", "name": "maturityDate", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "bool", "name": "isLiquidated", "type": "bool"}
        ],
        "internalType": "struct SimplePawnSystem.PawnPosition",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalPawns",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserPositions",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getETHPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const MockUSDTABI = [
  {
    "inputs": [],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
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
  },
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const MockPriceFeedABI = [
  {
    "inputs": [],
    "name": "getLatestPrice",
    "outputs": [{"internalType": "int256", "name": "", "type": "int256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses - from environment variables
const CONTRACT_ADDRESSES = {
  PAWN_SYSTEM: process.env.REACT_APP_PAWN_CONTRACT_ADDRESS || '0xAc1415613608a3a55B727B502Fab768bEf089413',
  MOCK_USDT: process.env.REACT_APP_USDT_CONTRACT_ADDRESS || '0xEBD6A562FEb1dFf4a0bf606bdf8D9cd56480d473',
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

    // Initialize contracts
    this.pawnContract = new ethers.Contract(
      CONTRACT_ADDRESSES.PAWN_SYSTEM,
      PawnSystemABI,
      this.signer
    );

    this.usdtContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_USDT,
      MockUSDTABI,
      this.signer
    );

    this.priceFeedContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_PRICE_FEED,
      MockPriceFeedABI,
      this.signer
    );
  }

  async getETHPrice(): Promise<number> {
    try {
      const price = await this.priceFeedContract.getLatestPrice();
      return parseFloat(ethers.utils.formatUnits(price, 8));
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      throw error;
    }
  }

  async createPawn(ethAmount: string): Promise<{ txHash: string; positionId: number }> {
    try {
      console.log('Creating pawn with ETH amount:', ethAmount);
      
      const ethValue = ethers.utils.parseEther(ethAmount);
      console.log('Parsed ETH value:', ethValue.toString());

      // Get current total pawns to determine position ID
      const totalPawns = await this.pawnContract.getTotalPawns();
      const expectedPositionId = totalPawns.toNumber() + 1;

      console.log('Expected position ID:', expectedPositionId);

      // Create the pawn transaction
      const tx = await this.pawnContract.createPawn({
        value: ethValue
      });

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.transactionHash);

      return {
        txHash: receipt.transactionHash,
        positionId: expectedPositionId
      };
    } catch (error: any) {
      console.error('Error creating pawn:', error);
      throw new Error(`Failed to create pawn: ${error.message}`);
    }
  }

  async redeemPawn(positionId: number): Promise<string> {
    try {
      console.log(`Redeeming pawn position ${positionId}`);

      // Get position details
      const position = await this.pawnContract.pawnPositions(positionId);
      const usdtAmount = position.usdtAmount;
      
      // Calculate required repayment (110% of original loan)
      const INTEREST_RATE = 10;
      const repaymentAmount = usdtAmount.mul(100 + INTEREST_RATE).div(100);
      
      console.log('Original USDT amount:', ethers.utils.formatUnits(usdtAmount, 6));
      console.log('Required repayment:', ethers.utils.formatUnits(repaymentAmount, 6));

      // Check USDT balance
      const userAddress = await this.signer.getAddress();
      const usdtBalance = await this.usdtContract.balanceOf(userAddress);
      console.log('User USDT balance:', ethers.utils.formatUnits(usdtBalance, 6));

      if (usdtBalance.lt(repaymentAmount)) {
        // Try to get USDT from faucet
        console.log('Insufficient USDT balance, trying faucet...');
        const faucetTx = await this.usdtContract.faucet();
        await faucetTx.wait();
        console.log('Faucet transaction completed');
      }

      // Check allowance
        const currentAllowance = await this.usdtContract.allowance(userAddress, CONTRACT_ADDRESSES.PAWN_SYSTEM);
      console.log('Current allowance:', ethers.utils.formatUnits(currentAllowance, 6));

      if (currentAllowance.lt(repaymentAmount)) {
        console.log('Approving USDT spending...');
        const approveTx = await this.usdtContract.approve(
          CONTRACT_ADDRESSES.PAWN_SYSTEM,
          repaymentAmount
        );
        await approveTx.wait();
        console.log('USDT approval completed');
      }

      // Redeem the pawn
      console.log('Redeeming pawn...');
      const redeemTx = await this.pawnContract.redeemPawn(positionId);
      const receipt = await redeemTx.wait();
      console.log('Pawn redemption completed:', receipt.transactionHash);

      return receipt.transactionHash;
    } catch (error: any) {
      console.error('Error redeeming pawn:', error);
      throw new Error(`Failed to redeem pawn: ${error.message}`);
    }
  }

  async getPosition(positionId: number): Promise<any> {
    try {
      const position = await this.pawnContract.pawnPositions(positionId);
      return {
        positionId,
        user: position.user,
        ethAmount: ethers.utils.formatEther(position.ethAmount),
        usdtAmount: ethers.utils.formatUnits(position.usdtAmount, 6),
        timestamp: position.timestamp.toNumber(),
        maturityDate: position.maturityDate.toNumber(),
        isActive: position.isActive,
        isLiquidated: position.isLiquidated
      };
    } catch (error) {
      console.error('Error getting position:', error);
      throw error;
    }
  }

  async getUserPositions(userAddress: string): Promise<number[]> {
    try {
      const positions = await this.pawnContract.getUserPositions(userAddress);
      return positions.map((pos: any) => pos.toNumber());
    } catch (error) {
      console.error('Error getting user positions:', error);
      throw error;
    }
  }

  async getUSDTBalance(userAddress: string): Promise<string> {
    try {
      const balance = await this.usdtContract.balanceOf(userAddress);
      return ethers.utils.formatUnits(balance, 6);
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      throw error;
    }
  }
}
