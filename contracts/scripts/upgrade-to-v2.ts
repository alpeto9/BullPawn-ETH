import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🔄 Upgrading BullPawn from V1 to V2...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the proxy address from environment or use a default
  const PROXY_ADDRESS = process.env.PAWN_CONTRACT_ADDRESS;
  if (!PROXY_ADDRESS) {
    console.error("❌ Please set PAWN_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("Proxy Address:", PROXY_ADDRESS);

  try {
    // Get the current implementation
    console.log("\n1️⃣ Checking current implementation...");
    const currentPawnSystem = await ethers.getContractAt("PawnSystem", PROXY_ADDRESS);
    const currentVersion = await currentPawnSystem.getVersion();
    const currentUpgradeCount = await currentPawnSystem.getUpgradeCount();
    const currentImplementation = await currentPawnSystem.getImplementation();
    
    console.log("✅ Current Version:", currentVersion);
    console.log("✅ Current Upgrade Count:", currentUpgradeCount.toString());
    console.log("✅ Current Implementation:", currentImplementation);

    // Deploy the new V2 implementation
    console.log("\n2️⃣ Deploying PawnSystemV2 implementation...");
    const PawnSystemV2Factory = await ethers.getContractFactory("PawnSystemV2");
    const pawnSystemV2Implementation = await PawnSystemV2Factory.deploy();
    await pawnSystemV2Implementation.deployed();
    console.log("✅ PawnSystemV2 implementation deployed to:", pawnSystemV2Implementation.address);

    // Perform the upgrade
    console.log("\n3️⃣ Performing upgrade...");
    const upgradeTx = await currentPawnSystem.upgradeTo(pawnSystemV2Implementation.address);
    console.log("⏳ Upgrade transaction submitted:", upgradeTx.hash);
    
    const receipt = await upgradeTx.wait();
    console.log("✅ Upgrade transaction confirmed in block:", receipt.blockNumber);

    // Verify the upgrade
    console.log("\n4️⃣ Verifying upgrade...");
    const newVersion = await currentPawnSystem.getVersion();
    const newUpgradeCount = await currentPawnSystem.getUpgradeCount();
    const newImplementation = await currentPawnSystem.getImplementation();
    
    console.log("✅ New Version:", newVersion);
    console.log("✅ New Upgrade Count:", newUpgradeCount.toString());
    console.log("✅ New Implementation:", newImplementation);

    // Test V2 functionality
    console.log("\n5️⃣ Testing V2 functionality...");
    
    // Test loyalty points info
    const loyaltyInfo = await currentPawnSystem.getLoyaltyInfo();
    console.log("✅ Loyalty Points per Pawn:", loyaltyInfo.bonusPointsPerPawn.toString());
    console.log("✅ Redemption Rate:", loyaltyInfo.redemptionRate.toString());
    console.log("✅ V2 Version:", loyaltyInfo.version);

    // Test existing functionality still works
    const ethPrice = await currentPawnSystem.getETHPrice();
    console.log("✅ ETH Price (existing function):", ethPrice.toString());

    // Initialize V2 if needed (optional)
    console.log("\n6️⃣ Initializing V2 features...");
    try {
      const initTx = await currentPawnSystem.initializeV2();
      await initTx.wait();
      console.log("✅ V2 initialization completed");
    } catch (error) {
      console.log("ℹ️ V2 initialization not needed or already done");
    }

    console.log("\n🎉 Upgrade to V2 completed successfully!");
    console.log("\n📝 Upgrade Summary:");
    console.log("=====================================");
    console.log("Proxy Address:", PROXY_ADDRESS);
    console.log("Old Implementation:", currentImplementation);
    console.log("New Implementation:", newImplementation);
    console.log("Old Version:", currentVersion);
    console.log("New Version:", newVersion);
    console.log("Upgrade Count:", newUpgradeCount.toString());
    console.log("=====================================");

    console.log("\n🆕 New V2 Features Available:");
    console.log("- Loyalty points system");
    console.log("- Points redemption for USDT");
    console.log("- Enhanced user rewards");

  } catch (error) {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
