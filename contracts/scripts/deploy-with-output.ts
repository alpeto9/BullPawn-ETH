import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet, utils, Provider } from "zksync-web3";
import * as fs from 'fs';
import * as path from 'path';

export default async function (hre: HardhatRuntimeEnvironment) {
  const output: string[] = [];
  
  function log(message: string) {
    console.log(message);
    output.push(message);
  }
  
  try {
    log("🚀 Starting contract deployment...");
    
    // Check if private key is set
    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === 'your_private_key_here') {
      throw new Error("PRIVATE_KEY not set in environment variables");
    }

    log("📝 Initializing wallet...");
    const provider = new Provider("https://sepolia.era.zksync.dev");
    const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
    log("📍 Wallet address: " + wallet.address);

    // Check balance
    const balance = await wallet.getBalance();
    log("💰 Wallet balance: " + utils.formatEther(balance) + " ETH");

    if (balance.lt(utils.parseEther("0.01"))) {
      throw new Error("Insufficient balance. Need at least 0.01 ETH for deployment");
    }

    log("🔨 Creating deployer...");
    const deployer = new Deployer(hre, wallet);

    log("📦 Deploying MockUSDT...");
    const mockUSDTArtifact = await deployer.loadArtifact("MockUSDT");
    const mockUSDT = await deployer.deploy(mockUSDTArtifact, []);
    log("✅ MockUSDT deployed at: " + mockUSDT.address);

    log("📦 Deploying PawnSystem...");
    const pawnSystemArtifact = await deployer.loadArtifact("PawnSystem");
    const pawnSystem = await deployer.deploy(pawnSystemArtifact, [mockUSDT.address]);
    log("✅ PawnSystem deployed at: " + pawnSystem.address);

    log("🎉 Deployment completed successfully!");
    log("📋 Contract addresses:");
    log("MockUSDT: " + mockUSDT.address);
    log("PawnSystem: " + pawnSystem.address);

    // Write output to file
    const outputPath = path.join(__dirname, '../../deploy-output.txt');
    fs.writeFileSync(outputPath, output.join('\n'));
    log("📝 Output written to deploy-output.txt");

    // Update .env file
    const envPath = path.join(__dirname, '../../.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/PAWN_CONTRACT_ADDRESS=.*/, `PAWN_CONTRACT_ADDRESS=${pawnSystem.address}`);
      envContent = envContent.replace(/USDT_CONTRACT_ADDRESS=.*/, `USDT_CONTRACT_ADDRESS=${mockUSDT.address}`);
      fs.writeFileSync(envPath, envContent);
      log("📝 Updated .env file with contract addresses");
    }

  } catch (error) {
    const errorMsg = "❌ Deployment failed: " + error;
    log(errorMsg);
    console.error(errorMsg);
    throw error;
  }
}
