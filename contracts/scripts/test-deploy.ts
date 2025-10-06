import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet, utils, Provider } from "zksync-web3";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("=== TEST DEPLOYMENT START ===");
  
  try {
    console.log("1. Checking private key...");
    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === 'your_private_key_here') {
      throw new Error("PRIVATE_KEY not set");
    }
    console.log("✅ Private key found");

    console.log("2. Creating provider...");
    const provider = new Provider("https://sepolia.era.zksync.dev");
    console.log("✅ Provider created");

    console.log("3. Creating wallet...");
    const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
    console.log("✅ Wallet created:", wallet.address);

    console.log("4. Checking balance...");
    const balance = await wallet.getBalance();
    console.log("✅ Balance:", utils.formatEther(balance), "ETH");

    console.log("5. Creating deployer...");
    const deployer = new Deployer(hre, wallet);
    console.log("✅ Deployer created");

    console.log("6. Loading MockUSDT artifact...");
    const mockUSDTArtifact = await deployer.loadArtifact("MockUSDT");
    console.log("✅ MockUSDT artifact loaded");

    console.log("7. Deploying MockUSDT...");
    const mockUSDT = await deployer.deploy(mockUSDTArtifact, []);
    console.log("✅ MockUSDT deployed at:", mockUSDT.address);

    console.log("8. Loading PawnSystem artifact...");
    const pawnSystemArtifact = await deployer.loadArtifact("PawnSystem");
    console.log("✅ PawnSystem artifact loaded");

    console.log("9. Deploying PawnSystem...");
    const pawnSystem = await deployer.deploy(pawnSystemArtifact, [mockUSDT.address]);
    console.log("✅ PawnSystem deployed at:", pawnSystem.address);

    console.log("=== DEPLOYMENT SUCCESS ===");
    console.log("MockUSDT:", mockUSDT.address);
    console.log("PawnSystem:", pawnSystem.address);

  } catch (error) {
    console.log("=== DEPLOYMENT FAILED ===");
    console.error("Error:", error);
    throw error;
  }
}
