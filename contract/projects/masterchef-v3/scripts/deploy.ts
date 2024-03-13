/* eslint-disable no-console */
/* eslint-disable camelcase */
import { writeFileSync } from "fs";
import { ethers, run, network } from "hardhat";
import { configs } from "@moriswap/common/config";
import { sleep } from "@moriswap/common/sleep";

async function main() {
  // Get network data from Hardhat config (see hardhat.config.ts).
  const networkName = network.name;
  // Check if the network is supported.
  console.log(`Deploying to ${networkName} network...`);

  // Compile contracts.
  await run("compile");
  console.log("Compiled contracts...");

  const config = configs[networkName as keyof typeof configs];
  if (!config) {
    throw new Error(`No config found for network ${networkName}`);
  }

  const v3PeripheryDeployedContracts = await import(`@moriswap/v3-periphery/deployments/${networkName}.json`);
  const positionManager_address = v3PeripheryDeployedContracts.NonfungiblePositionManager;

  const MasterChefV3 = await ethers.getContractFactory("MasterChefV3");
  const masterChefV3 = await MasterChefV3.deploy(positionManager_address, config.WNATIVE);
  console.log("masterChefV3 deployed to:", masterChefV3.address);
  await sleep(3000);

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(masterChefV3.address, config.WNATIVE);
  console.log("vault deployed to:", vault.address);
  await sleep(3000);

  await masterChefV3.setVault(vault.address);
  console.log("vault set to masterChefV3 done");

  // Write the address to a file.
  writeFileSync(
    `./deployments/${networkName}.json`,
    JSON.stringify(
      {
        MasterChefV3: masterChefV3.address,
        Vault: vault.address,
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
