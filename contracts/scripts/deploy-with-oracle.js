const { Wallet, Provider, ContractFactory } = require("zksync-web3");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying contracts with Chainlink Oracle integration");
  
  // Check if private key is set
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === 'your_private_key_here') {
    throw new Error("PRIVATE_KEY not set in environment variables");
  }

  console.log("📝 Initializing provider and wallet...");
  const provider = new Provider("https://sepolia.era.zksync.dev");
  const wallet = new Wallet(privateKey, provider);
  
  console.log("📍 Wallet address:", wallet.address);

  // Check balance
  const balance = await wallet.getBalance();
  console.log("💰 Wallet balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    throw new Error("Insufficient balance. Need at least 0.01 ETH for deployment");
  }

  console.log("📦 Loading contract artifacts...");
  
  // Load MockUSDT artifact
  const mockUSDTArtifact = require("../artifacts-zk/contracts/MockUSDT.sol/MockUSDT.json");
  console.log("✅ MockUSDT artifact loaded");

  // Load PawnSystem artifact
  const pawnSystemArtifact = require("../artifacts-zk/contracts/PawnSystem.sol/PawnSystem.json");
  console.log("✅ PawnSystem artifact loaded");

  // Load MockPriceFeed artifact
  const mockPriceFeedArtifact = require("../artifacts-zk/contracts/MockPriceFeed.sol/MockPriceFeed.json");
  console.log("✅ MockPriceFeed artifact loaded");

  console.log("🔨 Deploying MockUSDT...");
  const mockUSDTFactory = new ContractFactory(
    mockUSDTArtifact.abi,
    mockUSDTArtifact.bytecode,
    wallet
  );
  
  const mockUSDT = await mockUSDTFactory.deploy();
  await mockUSDT.deployed();
  console.log("✅ MockUSDT deployed at:", mockUSDT.address);

  console.log("🔨 Deploying MockPriceFeed...");
  const mockPriceFeedFactory = new ContractFactory(
    mockPriceFeedArtifact.abi,
    mockPriceFeedArtifact.bytecode,
    wallet
  );
  
  // Deploy with initial price of $2000 (2000 * 10^8 for 8 decimals)
  const initialPrice = ethers.BigNumber.from("2000").mul(ethers.BigNumber.from("10").pow(8));
  const mockPriceFeed = await mockPriceFeedFactory.deploy(initialPrice);
  await mockPriceFeed.deployed();
  console.log("✅ MockPriceFeed deployed at:", mockPriceFeed.address);
  console.log("   Initial ETH price: $2000");

  console.log("🔨 Deploying PawnSystem with Oracle...");
  const pawnSystemFactory = new ContractFactory(
    pawnSystemArtifact.abi,
    pawnSystemArtifact.bytecode,
    wallet
  );
  
  const pawnSystem = await pawnSystemFactory.deploy(mockUSDT.address, mockPriceFeed.address);
  await pawnSystem.deployed();
  console.log("✅ PawnSystem deployed at:", pawnSystem.address);

  console.log("🎉 Deployment completed successfully!");
  console.log("📋 Contract addresses:");
  console.log("MockUSDT:", mockUSDT.address);
  console.log("MockPriceFeed:", mockPriceFeed.address);
  console.log("PawnSystem:", pawnSystem.address);

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
  console.log("MockUSDT Contract:", mockUSDT.address);
  console.log("MockPriceFeed Contract:", mockPriceFeed.address);
  console.log("PawnSystem Contract:", pawnSystem.address);
  console.log("✅ Oracle integration complete!");
  console.log("💡 For production: Replace MockPriceFeed with real Chainlink price feed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
