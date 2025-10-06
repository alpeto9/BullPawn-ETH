import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet, utils, Provider } from "zksync-web3";
import * as fs from 'fs';
import * as path from 'path';

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting contract deployment...");
  
  // Check if private key is set
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === 'your_private_key_here') {
    throw new Error("PRIVATE_KEY not set in environment variables");
  }

  console.log("📝 Initializing wallet...");
  const provider = new Provider("https://sepolia.era.zksync.dev");
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  console.log("📍 Wallet address: " + wallet.address);

  // Check balance
  const balance = await wallet.getBalance();
  console.log("💰 Wallet balance: " + utils.formatEther(balance) + " ETH");

  if (balance.lt(utils.parseEther("0.01"))) {
    throw new Error("Insufficient balance. Need at least 0.01 ETH for deployment");
  }

  console.log("🔨 Creating deployer...");
  const deployer = new Deployer(hre, wallet);

  console.log("📦 Deploying MockUSDT...");
  const mockUSDTArtifact = await deployer.loadArtifact("MockUSDT");
  const mockUSDT = await deployer.deploy(mockUSDTArtifact, []);
  console.log("✅ MockUSDT deployed at: " + mockUSDT.address);

  console.log("📦 Deploying PawnSystem...");
  const pawnSystemArtifact = await deployer.loadArtifact("PawnSystem");
  const pawnSystem = await deployer.deploy(pawnSystemArtifact, [mockUSDT.address]);
  console.log("✅ PawnSystem deployed at: " + pawnSystem.address);

  console.log("🎉 Deployment completed successfully!");
  console.log("📋 Contract addresses:");
  console.log("MockUSDT: " + mockUSDT.address);
  console.log("PawnSystem: " + pawnSystem.address);

  // Update .env file
  const envPath = path.join(__dirname, '../../.env');
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/PAWN_CONTRACT_ADDRESS=.*/, `PAWN_CONTRACT_ADDRESS=${pawnSystem.address}`);
    envContent = envContent.replace(/USDT_CONTRACT_ADDRESS=.*/, `USDT_CONTRACT_ADDRESS=${mockUSDT.address}`);
    fs.writeFileSync(envPath, envContent);
    console.log("📝 Updated .env file with contract addresses");
  }

  console.log("🎯 Deployment Summary:");
  console.log("MockUSDT Contract: " + mockUSDT.address);
  console.log("PawnSystem Contract: " + pawnSystem.address);
  console.log("✅ All done! Your contracts are deployed and .env is updated.");
}
