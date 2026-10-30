import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying RawMaterialTraceability with account:", deployer.address);

  const RawMaterialTraceability = await ethers.getContractFactory("RawMaterialTraceability");
  const contract = await RawMaterialTraceability.deploy(deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("RawMaterialTraceability deployed successfully to:", contractAddress);

  // Read ABI from Hardhat artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/RawMaterialTraceability.sol/RawMaterialTraceability.json"
  );

  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifact.abi;
  }

  const exportData = {
    address: contractAddress,
    deployer: deployer.address,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    abi: abi,
  };

  // Write to local blockchain folder
  const localOut = path.join(__dirname, "../deployedAddress.json");
  fs.writeFileSync(localOut, JSON.stringify(exportData, null, 2));

  // Write to backend configuration folder if it exists
  const backendConfigDir = path.join(__dirname, "../../backend/src/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  const backendOut = path.join(backendConfigDir, "contractArtifact.json");
  fs.writeFileSync(backendOut, JSON.stringify(exportData, null, 2));

  console.log("Contract details saved to:", localOut, "and", backendOut);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
