const { Wallet, Provider, ContractFactory } = require("zksync-web3");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Chainlink Price Feed Addresses for zkSync Sepolia Testnet
const CHAINLINK_ADDRESSES = {
  ETH_USD: "0xfEefF7c3fB57d18C5C6Cdd71e45D2D0b4F9377bF",
  BTC_USD: "0x95Bc57e794aeb02E4a16eff406147f3ce2531F83",
  USDT_USD: "0x07F05C2aFeb54b68Ea425CAbCcbF53E2d5605d76",
  USDC_USD: "0x1844478CA634f3a762a2E71E3386837Bd50C947F",
  DAI_USD: "0x3aE81863E2F4cdea95b0c96E9C3C71cf1e10EFFE",
  LINK_USD: "0x894423C43cD7230Cd22a47B329E96097e6355292",
  LINK_ETH: "0x77167bC91489B60a831d77e7E845e610f0d7D215"
};

async function main() {
  console.log("🚀 Deploying contracts with Chainlink Oracle integration");
  console.log("📡 Using real Chainlink price feeds on zkSync Sepolia");
  
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

  // Load ChainlinkPriceFeed artifact
  const chainlinkPriceFeedArtifact = require("../artifacts-zk/contracts/ChainlinkPriceFeed.sol/ChainlinkPriceFeed.json");
  console.log("✅ ChainlinkPriceFeed artifact loaded");

  // Load PawnSystem artifact
  const pawnSystemArtifact = require("../artifacts-zk/contracts/PawnSystem.sol/PawnSystem.json");
  console.log("✅ PawnSystem artifact loaded");

  console.log("🔨 Deploying MockUSDT...");
  const mockUSDTFactory = new ContractFactory(
    mockUSDTArtifact.abi,
    mockUSDTArtifact.bytecode,
    wallet
  );
  
  const mockUSDT = await mockUSDTFactory.deploy();
  await mockUSDT.deployed();
  console.log("✅ MockUSDT deployed at:", mockUSDT.address);

  console.log("🔨 Deploying ChainlinkPriceFeed wrapper...");
  const chainlinkPriceFeedFactory = new ContractFactory(
    chainlinkPriceFeedArtifact.abi,
    chainlinkPriceFeedArtifact.bytecode,
    wallet
  );
  
  // Deploy with ETH/USD price feed address
  const chainlinkPriceFeed = await chainlinkPriceFeedFactory.deploy(CHAINLINK_ADDRESSES.ETH_USD);
  await chainlinkPriceFeed.deployed();
  console.log("✅ ChainlinkPriceFeed deployed at:", chainlinkPriceFeed.address);
  console.log("   Using Chainlink ETH/USD feed:", CHAINLINK_ADDRESSES.ETH_USD);

  // Test the price feed
  console.log("🧪 Testing price feed...");
  try {
    const latestPrice = await chainlinkPriceFeed.getLatestPrice();
    const priceInUSD = ethers.utils.formatUnits(latestPrice, 8);
    console.log("✅ Current ETH price from Chainlink:", priceInUSD, "USD");
    
    const isHealthy = await chainlinkPriceFeed.isPriceFeedHealthy();
    console.log("✅ Price feed health status:", isHealthy ? "HEALTHY" : "UNHEALTHY");
  } catch (error) {
    console.log("⚠️  Warning: Could not fetch price from Chainlink:", error.message);
  }

  console.log("🔨 Deploying PawnSystem with Chainlink Oracle...");
  const pawnSystemFactory = new ContractFactory(
    pawnSystemArtifact.abi,
    pawnSystemArtifact.bytecode,
    wallet
  );
  
  const pawnSystem = await pawnSystemFactory.deploy(mockUSDT.address, chainlinkPriceFeed.address);
  await pawnSystem.deployed();
  console.log("✅ PawnSystem deployed at:", pawnSystem.address);

  console.log("🎉 Deployment completed successfully!");
  console.log("📋 Contract addresses:");
  console.log("MockUSDT:", mockUSDT.address);
  console.log("ChainlinkPriceFeed:", chainlinkPriceFeed.address);
  console.log("PawnSystem:", pawnSystem.address);
  console.log("Chainlink ETH/USD Feed:", CHAINLINK_ADDRESSES.ETH_USD);

  // Update .env file
  const envPath = path.join(__dirname, '../../.env');
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/PAWN_CONTRACT_ADDRESS=.*/, `PAWN_CONTRACT_ADDRESS=${pawnSystem.address}`);
    envContent = envContent.replace(/USDT_CONTRACT_ADDRESS=.*/, `USDT_CONTRACT_ADDRESS=${mockUSDT.address}`);
    envContent = envContent.replace(/ORACLE_CONTRACT_ADDRESS=.*/, `ORACLE_CONTRACT_ADDRESS=${chainlinkPriceFeed.address}`);
    envContent = envContent.replace(/CHAINLINK_ETH_USD_FEED=.*/, `CHAINLINK_ETH_USD_FEED=${CHAINLINK_ADDRESSES.ETH_USD}`);
    fs.writeFileSync(envPath, envContent);
    console.log("📝 Updated .env file with contract addresses");
  }

  console.log("🎯 Deployment Summary:");
  console.log("MockUSDT Contract:", mockUSDT.address);
  console.log("ChainlinkPriceFeed Contract:", chainlinkPriceFeed.address);
  console.log("PawnSystem Contract:", pawnSystem.address);
  console.log("✅ Real Chainlink oracle integration complete!");
  console.log("💡 This uses live Chainlink price feeds on zkSync Sepolia testnet");
  console.log("🔗 Chainlink ETH/USD Feed:", CHAINLINK_ADDRESSES.ETH_USD);
  
  // Additional price feed information
  console.log("\n📊 Available Chainlink Price Feeds on zkSync Sepolia:");
  Object.entries(CHAINLINK_ADDRESSES).forEach(([pair, address]) => {
    console.log(`   ${pair}: ${address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
