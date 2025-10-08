import { Provider, Wallet, Contract, utils } from 'zksync-web3';
import { ethers } from 'ethers';
import PawnSystemABI from '../abis/PawnSystem.json';
import MockUSDTABI from '../abis/MockUSDT.json';
import ChainlinkPriceFeedABI from '../abis/ChainlinkPriceFeed.json';

export class BlockchainService {
  private provider: Provider;
  private wallet?: Wallet;
  private pawnContract?: Contract;
  private usdtContract?: Contract;
  private oracleContract?: Contract;

  constructor() {
    this.provider = new Provider(process.env.ZKSYNC_RPC_URL || 'https://sepolia.era.zksync.dev');

    // Only create wallet if private key is provided
    if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') {
      this.wallet = new Wallet(process.env.PRIVATE_KEY, this.provider);
    }
    
    const pawnAddress = process.env.PAWN_CONTRACT_ADDRESS;
    const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
    const oracleAddress = process.env.ORACLE_CONTRACT_ADDRESS;
    
    // Only create contracts if addresses are provided
    if (pawnAddress && usdtAddress && this.wallet) {
      this.pawnContract = new Contract(pawnAddress, PawnSystemABI, this.wallet);
      this.usdtContract = new Contract(usdtAddress, MockUSDTABI, this.wallet);
    }
    
    // Create oracle contract (read-only, no wallet needed)
    if (oracleAddress) {
      this.oracleContract = new Contract(oracleAddress, ChainlinkPriceFeedABI as any, this.provider);
    }
  }

  async getETHPrice(): Promise<number> {
    try {
      // First try to get price from Chainlink oracle
      if (this.oracleContract) {
        try {
          const price = await this.oracleContract.getLatestPrice();
          const priceInUSD = parseFloat(ethers.utils.formatUnits(price, 8));
          console.log('Chainlink oracle price:', priceInUSD, 'USD');
          return priceInUSD;
        } catch (oracleError) {
          console.warn('Chainlink oracle failed, falling back to API:', oracleError);
        }
      }
      
      // Fallback to CoinGecko API if oracle is not available
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as any;
      console.log('CoinGecko API response:', data);
      
      // Check if the response has the expected structure
      if (data && data.ethereum && typeof data.ethereum.usd === 'number') {
        return data.ethereum.usd;
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      // Fallback to a reasonable price if all methods fail
      return 2000; // $2000 per ETH as fallback
    }
  }

  async getActivePawnsCount(): Promise<number> {
    if (!this.pawnContract) {
      throw new Error('Pawn contract not initialized');
    }
    
    try {
      // Get the total number of pawns created
      const totalPawns = await this.pawnContract.getTotalPawns();
      console.log('Total pawns from contract:', totalPawns.toString());
      
      // For now, we'll use total pawns as active pawns
      // In a real implementation, you'd need to track which ones are redeemed
      return parseInt(totalPawns.toString());
    } catch (error) {
      console.error('Error fetching active pawns count:', error);
      return 0;
    }
  }

  async createPawn(ethAmount: string): Promise<{ txHash: string; positionId: number }> {
    if (!this.pawnContract) {
      throw new Error('Pawn contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const tx = await this.pawnContract.createPawn({
        value: ethers.utils.parseEther(ethAmount)
      });

      const receipt = await tx.wait();
      
      // Parse the PawnCreated event to get position ID
      const event = receipt.events?.find((e: any) => e.event === 'PawnCreated');
      const positionId = event?.args?.positionId?.toNumber();

      return {
        txHash: receipt.transactionHash,
        positionId: positionId || 0
      };
    } catch (error: any) {
      console.error('Error creating pawn:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      console.error('Error reason:', error.reason);
      throw new Error(`Failed to create pawn position: ${error.message}`);
    }
  }

  async redeemPawn(positionId: number, usdtAmount: string): Promise<string> {
    if (!this.pawnContract || !this.usdtContract) {
      throw new Error('Contracts not deployed yet. Please deploy contracts first.');
    }
    
    try {
      console.log(`Redeeming pawn ${positionId} with ${usdtAmount} USDT`);
      
      // Check if wallet has enough USDT balance
      const usdtBalance = await this.usdtContract.balanceOf(this.wallet!.address);
      const requiredAmount = ethers.utils.parseUnits(usdtAmount, 6);
      console.log(`USDT Balance: ${ethers.utils.formatUnits(usdtBalance, 6)}, Required: ${usdtAmount}`);
      
      if (usdtBalance.lt(requiredAmount)) {
        throw new Error(`Insufficient USDT balance. Have: ${ethers.utils.formatUnits(usdtBalance, 6)}, Need: ${usdtAmount}`);
      }
      
      // First approve USDT spending
      console.log('Approving USDT spending...');
      const approveTx = await this.usdtContract.approve(
        process.env.PAWN_CONTRACT_ADDRESS,
        requiredAmount
      );
      await approveTx.wait();
      console.log('USDT approval successful');

      // Then redeem the pawn
      console.log('Redeeming pawn...');
      const tx = await this.pawnContract.redeemPawn(positionId);
      const receipt = await tx.wait();
      console.log('Pawn redemption successful');

      return receipt.transactionHash;
    } catch (error) {
      console.error('Error redeeming pawn:', error);
      throw new Error(`Failed to redeem pawn position: ${error.message}`);
    }
  }

  async liquidatePawn(positionId: number): Promise<string> {
    if (!this.pawnContract) {
      throw new Error('Pawn contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const tx = await this.pawnContract.liquidatePawn(positionId);
      const receipt = await tx.wait();

      return receipt.transactionHash;
    } catch (error) {
      console.error('Error liquidating pawn:', error);
      throw new Error('Failed to liquidate pawn position');
    }
  }

  async getPosition(positionId: number): Promise<any> {
    if (!this.pawnContract) {
      throw new Error('Pawn contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const position = await this.pawnContract.getPosition(positionId);
      return {
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
      throw new Error('Failed to get position details');
    }
  }

  async getUserPositions(userAddress: string): Promise<number[]> {
    if (!this.pawnContract) {
      throw new Error('Pawn contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const positions = await this.pawnContract.getUserPositions(userAddress);
      return positions.map((pos: any) => pos.toNumber());
    } catch (error) {
      console.error('Error getting user positions:', error);
      throw new Error('Failed to get user positions');
    }
  }

  async shouldLiquidate(positionId: number): Promise<boolean> {
    if (!this.pawnContract) {
      throw new Error('Pawn contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      return await this.pawnContract.shouldLiquidate(positionId);
    } catch (error) {
      console.error('Error checking liquidation status:', error);
      throw new Error('Failed to check liquidation status');
    }
  }

  async getUSDTBalance(address: string): Promise<string> {
    if (!this.usdtContract) {
      throw new Error('USDT contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const balance = await this.usdtContract.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6);
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      throw new Error('Failed to get USDT balance');
    }
  }

  async getETHBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      throw new Error('Failed to get ETH balance');
    }
  }

  async faucetUSDT(userAddress: string): Promise<string> {
    if (!this.usdtContract) {
      throw new Error('USDT contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const tx = await this.usdtContract.faucet();
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error getting USDT faucet:', error);
      throw new Error('Failed to get USDT from faucet');
    }
  }

  // Oracle-related methods
  async getOraclePrice(): Promise<number> {
    if (!this.oracleContract) {
      throw new Error('Oracle contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const price = await this.oracleContract.getLatestPrice();
      return parseFloat(ethers.utils.formatUnits(price, 8));
    } catch (error) {
      console.error('Error getting oracle price:', error);
      throw new Error('Failed to get oracle price');
    }
  }

  async isOracleHealthy(): Promise<boolean> {
    if (!this.oracleContract) {
      return false;
    }
    
    try {
      return await this.oracleContract.isPriceFeedHealthy();
    } catch (error) {
      console.error('Error checking oracle health:', error);
      return false;
    }
  }

  async getOracleInfo(): Promise<{
    description: string;
    decimals: number;
    version: number;
    roundId: number;
    phaseId: number;
  }> {
    if (!this.oracleContract) {
      throw new Error('Oracle contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const [description, decimals, priceFeedInfo] = await Promise.all([
        this.oracleContract.description(),
        this.oracleContract.decimals(),
        this.oracleContract.getPriceFeedInfo()
      ]);

      return {
        description,
        decimals: decimals,
        version: priceFeedInfo.version.toNumber(),
        roundId: priceFeedInfo.roundId.toNumber(),
        phaseId: priceFeedInfo.phaseId.toNumber()
      };
    } catch (error) {
      console.error('Error getting oracle info:', error);
      throw new Error('Failed to get oracle information');
    }
  }

  async getLatestRoundData(): Promise<{
    roundId: number;
    answer: number;
    startedAt: number;
    updatedAt: number;
    answeredInRound: number;
  }> {
    if (!this.oracleContract) {
      throw new Error('Oracle contract not deployed yet. Please deploy contracts first.');
    }
    
    try {
      const roundData = await this.oracleContract.latestRoundData();
      return {
        roundId: roundData.roundId.toNumber(),
        answer: parseFloat(ethers.utils.formatUnits(roundData.answer, 8)),
        startedAt: roundData.startedAt.toNumber(),
        updatedAt: roundData.updatedAt.toNumber(),
        answeredInRound: roundData.answeredInRound.toNumber()
      };
    } catch (error) {
      console.error('Error getting latest round data:', error);
      throw new Error('Failed to get latest round data');
    }
  }
}
