import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main() {
  console.log("🚀 Deploying BullPawn with UUPS Proxy Pattern...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Contract addresses (you'll need to deploy these first or use existing ones)
  const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS || "0x82D09b4a1e444b65D0f4218648de07d02a566a25";
  const PRICE_FEED_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS || "0x8919fcde20c0f5AC26A61ca6f9DB5008880c8B92";

  console.log("\n📋 Configuration:");
  console.log("USDT Address:", USDT_ADDRESS);
  console.log("Price Feed Address:", PRICE_FEED_ADDRESS);

  try {
    // Deploy the implementation contract (PawnSystem)
    console.log("\n1️⃣ Deploying PawnSystem implementation...");
    const PawnSystemFactory = await ethers.getContractFactory("PawnSystem");
    const pawnSystemImplementation = await PawnSystemFactory.deploy();
    await pawnSystemImplementation.deployed();
    console.log("✅ PawnSystem implementation deployed to:", pawnSystemImplementation.address);

    // Deploy the UUPS proxy
    console.log("\n2️⃣ Deploying UUPS Proxy...");
    const ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
    const initData = PawnSystemFactory.interface.encodeFunctionData("initialize", [
      USDT_ADDRESS,
      PRICE_FEED_ADDRESS
    ]);
    
    const proxy = await ProxyFactory.deploy(pawnSystemImplementation.address, initData);
    await proxy.deployed();
    console.log("✅ UUPS Proxy deployed to:", proxy.address);

    // Create a contract instance pointing to the proxy
    const pawnSystem = PawnSystemFactory.attach(proxy.address);

    // Verify the deployment
    console.log("\n3️⃣ Verifying deployment...");
    const version = await pawnSystem.getVersion();
    const owner = await pawnSystem.owner();
    const usdtToken = await pawnSystem.usdtToken();
    const priceFeed = await pawnSystem.priceFeed();
    const upgradeCount = await pawnSystem.getUpgradeCount();

    console.log("✅ Contract Version:", version);
    console.log("✅ Owner:", owner);
    console.log("✅ USDT Token:", usdtToken);
    console.log("✅ Price Feed:", priceFeed);
    console.log("✅ Upgrade Count:", upgradeCount.toString());

    // Test basic functionality
    console.log("\n4️⃣ Testing basic functionality...");
    const ethPrice = await pawnSystem.getETHPrice();
    console.log("✅ Current ETH Price:", ethPrice.toString());

    // Save deployment info
    const deploymentInfo = {
      network: "zkSync Sepolia Testnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        pawnSystemImplementation: pawnSystemImplementation.address,
        pawnSystemProxy: proxy.address,
        usdtToken: USDT_ADDRESS,
        priceFeed: PRICE_FEED_ADDRESS
      },
      version: version,
      upgradeCount: upgradeCount.toString()
    };

    console.log("\n📄 Deployment Summary:");
    console.log("=====================================");
    console.log("Network:", deploymentInfo.network);
    console.log("Deployer:", deploymentInfo.deployer);
    console.log("Implementation:", deploymentInfo.contracts.pawnSystemImplementation);
    console.log("Proxy (Use this address):", deploymentInfo.contracts.pawnSystemProxy);
    console.log("USDT Token:", deploymentInfo.contracts.usdtToken);
    console.log("Price Feed:", deploymentInfo.contracts.priceFeed);
    console.log("Version:", deploymentInfo.version);
    console.log("=====================================");

    console.log("\n🎉 UUPS Proxy deployment completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log("1. Update your .env file with the proxy address:");
    console.log(`   PAWN_CONTRACT_ADDRESS=${proxy.address}`);
    console.log("2. Test the contract functionality");
    console.log("3. When ready to upgrade, deploy PawnSystemV2 and call upgradeTo()");

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
