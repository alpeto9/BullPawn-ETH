import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the PawnSystem contract`);

  // Initialize the wallet.
  const wallet = new hre.zksyncEthers.Wallet(process.env.PRIVATE_KEY || "");

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);

  // Deploy MockUSDT first
  const mockUSDTArtifact = await deployer.loadArtifact("MockUSDT");
  const mockUSDT = await deployer.deploy(mockUSDTArtifact, []);

  console.log(`MockUSDT contract address: ${mockUSDT.address}`);

  // Deploy PawnSystem
  const pawnSystemArtifact = await deployer.loadArtifact("PawnSystem");
  const pawnSystem = await deployer.deploy(pawnSystemArtifact, [mockUSDT.address]);

  console.log(`PawnSystem contract address: ${pawnSystem.address}`);

  // Note: Contract verification removed for simplicity
  // You can verify contracts manually on zkSync explorer if needed

  console.log("Deployment completed!");
  console.log("Contract addresses:");
  console.log(`MockUSDT: ${mockUSDT.address}`);
  console.log(`PawnSystem: ${pawnSystem.address}`);
}
