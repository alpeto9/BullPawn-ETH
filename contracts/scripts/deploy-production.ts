import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { Wallet } from "zksync-ethers";

interface SystemConfig {
  loanToValueRatio: number; // Basis points (7000 = 70%)
  interestRate: number; // Basis points (1000 = 10%)
  liquidationThreshold: number; // Basis points (7000 = 70%)
  liquidationBonus: number; // Basis points (500 = 5%)
  loanDuration: number; // Seconds
  minLoanAmount: string; // Minimum loan amount in USDT
  maxLoanAmount: string; // Maximum loan amount in USDT
  reserveRatio: number; // Basis points (1000 = 10%)
}

async function main() {
  console.log("🚀 Deploying BullPawn Production-Ready Contracts...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Contract addresses (you'll need to deploy these first or use existing ones)
  const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS || "0x82D09b4a1e444b65D0f4218648de07d02a566a25";
  const CHAINLINK_ETH_USD = process.env.CHAINLINK_ETH_USD || "0xfEefF7c3fB57d18C5C6Cdd71e45D2D0b4F9377bF";
  const CHAINLINK_BTC_USD = process.env.CHAINLINK_BTC_USD || "0x95Bc57e794aeb02E4a16eff406147f3ce2531F83";

  console.log("\n📋 Configuration:");
  console.log("USDT Address:", USDT_ADDRESS);
  console.log("Chainlink ETH/USD:", CHAINLINK_ETH_USD);
  console.log("Chainlink BTC/USD:", CHAINLINK_BTC_USD);

  try {
    // 1. Deploy Multi-Oracle Price Feed
    console.log("\n1️⃣ Deploying Multi-Oracle Price Feed...");
    const MultiOracleFactory = await ethers.getContractFactory("MultiOraclePriceFeed");
    const fallbackPrice = ethers.utils.parseUnits("2000", 8); // $2000 fallback
    const multiOracle = await MultiOracleFactory.deploy(fallbackPrice);
    await multiOracle.deployed();
    console.log("✅ Multi-Oracle deployed to:", multiOracle.address);

    // 2. Deploy individual Chainlink price feeds
    console.log("\n2️⃣ Deploying Chainlink Price Feeds...");
    const ChainlinkFactory = await ethers.getContractFactory("ChainlinkPriceFeed");
    
    const ethPriceFeed = await ChainlinkFactory.deploy(CHAINLINK_ETH_USD);
    await ethPriceFeed.deployed();
    console.log("✅ ETH/USD Price Feed deployed to:", ethPriceFeed.address);
    
    const btcPriceFeed = await ChainlinkFactory.deploy(CHAINLINK_BTC_USD);
    await btcPriceFeed.deployed();
    console.log("✅ BTC/USD Price Feed deployed to:", btcPriceFeed.address);

    // 3. Configure Multi-Oracle with individual feeds
    console.log("\n3️⃣ Configuring Multi-Oracle...");
    
    // Add ETH/USD oracle with 80% weight
    await multiOracle.addOracle(ethPriceFeed.address, 80);
    console.log("✅ Added ETH/USD oracle with 80% weight");
    
    // Add BTC/USD oracle with 20% weight (for correlation)
    await multiOracle.addOracle(btcPriceFeed.address, 20);
    console.log("✅ Added BTC/USD oracle with 20% weight");

    // 4. Deploy PawnSystem Production implementation
    console.log("\n4️⃣ Deploying PawnSystem Production implementation...");
    const PawnSystemFactory = await ethers.getContractFactory("PawnSystemProduction");
    const pawnSystemImplementation = await PawnSystemFactory.deploy();
    await pawnSystemImplementation.deployed();
    console.log("✅ PawnSystem Production implementation deployed to:", pawnSystemImplementation.address);

    // 5. Configure system parameters
    const systemConfig: SystemConfig = {
      loanToValueRatio: 7000, // 70%
      interestRate: 1000, // 10%
      liquidationThreshold: 7000, // 70%
      liquidationBonus: 500, // 5%
      loanDuration: 365 * 24 * 60 * 60, // 1 year
      minLoanAmount: ethers.utils.parseUnits("100", 6).toString(), // 100 USDT
      maxLoanAmount: ethers.utils.parseUnits("100000", 6).toString(), // 100,000 USDT
      reserveRatio: 1000 // 10%
    };

    // 6. Deploy the UUPS proxy
    console.log("\n5️⃣ Deploying UUPS Proxy...");
    const ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
    const initData = PawnSystemFactory.interface.encodeFunctionData("initialize", [
      USDT_ADDRESS,
      deployer.address, // Admin
      systemConfig
    ]);
    
    const proxy = await ProxyFactory.deploy(pawnSystemImplementation.address, initData);
    await proxy.deployed();
    console.log("✅ UUPS Proxy deployed to:", proxy.address);

    // 7. Create contract instance and configure
    const pawnSystem = PawnSystemFactory.attach(proxy.address);

    // 8. Add the multi-oracle to the pawn system
    console.log("\n6️⃣ Configuring PawnSystem with Multi-Oracle...");
    await pawnSystem.addOracle(multiOracle.address, 100);
    console.log("✅ Added Multi-Oracle to PawnSystem");

    // 9. Add deployer as liquidator
    console.log("\n7️⃣ Setting up roles...");
    await pawnSystem.addLiquidator(deployer.address);
    console.log("✅ Added deployer as liquidator");

    // 10. Verify deployment
    console.log("\n8️⃣ Verifying deployment...");
    const version = await pawnSystem.getVersion();
    const owner = await pawnSystem.hasRole(await pawnSystem.DEFAULT_ADMIN_ROLE(), deployer.address);
    const liquidator = await pawnSystem.hasRole(await pawnSystem.LIQUIDATOR_ROLE(), deployer.address);
    const config = await pawnSystem.config();
    const systemHealth = await pawnSystem.getSystemHealth();

    console.log("✅ Contract Version:", version);
    console.log("✅ Deployer is Admin:", owner);
    console.log("✅ Deployer is Liquidator:", liquidator);
    console.log("✅ LTV Ratio:", config.loanToValueRatio.toString(), "basis points");
    console.log("✅ Interest Rate:", config.interestRate.toString(), "basis points");
    console.log("✅ Liquidation Threshold:", config.liquidationThreshold.toString(), "basis points");
    console.log("✅ System Healthy:", systemHealth.isHealthy);

    // 11. Test oracle functionality
    console.log("\n9️⃣ Testing oracle functionality...");
    try {
      const ethPrice = await pawnSystem.getValidatedETHPrice();
      console.log("✅ ETH Price from Multi-Oracle:", ethers.utils.formatUnits(ethPrice, 6), "USDT");
    } catch (error) {
      console.log("⚠️ Oracle test failed (expected on testnet):", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
      network: "zkSync Sepolia Testnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        pawnSystemImplementation: pawnSystemImplementation.address,
        pawnSystemProxy: proxy.address,
        multiOracle: multiOracle.address,
        ethPriceFeed: ethPriceFeed.address,
        btcPriceFeed: btcPriceFeed.address,
        usdtToken: USDT_ADDRESS
      },
      configuration: systemConfig,
      version: version
    };

    console.log("\n📄 Production Deployment Summary:");
    console.log("=====================================");
    console.log("Network:", deploymentInfo.network);
    console.log("Deployer:", deploymentInfo.deployer);
    console.log("Implementation:", deploymentInfo.contracts.pawnSystemImplementation);
    console.log("Proxy (Use this address):", deploymentInfo.contracts.pawnSystemProxy);
    console.log("Multi-Oracle:", deploymentInfo.contracts.multiOracle);
    console.log("ETH Price Feed:", deploymentInfo.contracts.ethPriceFeed);
    console.log("BTC Price Feed:", deploymentInfo.contracts.btcPriceFeed);
    console.log("USDT Token:", deploymentInfo.contracts.usdtToken);
    console.log("Version:", deploymentInfo.version);
    console.log("=====================================");

    console.log("\n🎉 Production-ready deployment completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log("1. Update your .env file with the proxy address:");
    console.log(`   PAWN_CONTRACT_ADDRESS=${proxy.address}`);
    console.log("2. Add USDT liquidity to the contract");
    console.log("3. Test the contract functionality");
    console.log("4. Monitor oracle health regularly");
    console.log("5. Set up liquidator monitoring");

    console.log("\n🛡️ Security Features Implemented:");
    console.log("✅ Multi-oracle price aggregation");
    console.log("✅ Role-based access control");
    console.log("✅ Emergency controls");
    console.log("✅ Liquidation incentives");
    console.log("✅ Reserve requirements");
    console.log("✅ Configurable parameters");
    console.log("✅ UUPS upgradeable pattern");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
