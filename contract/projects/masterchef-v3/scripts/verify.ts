/* eslint-disable no-console */
import { verifyContract } from "@moriswap/common/verify";
import { sleep } from "@moriswap/common/sleep";
import { configs } from "@moriswap/common/config";
import { network } from "hardhat";

async function main() {
  const networkName = network.name;
  const config = configs[networkName as keyof typeof configs];

  if (!config) {
    throw new Error(`No config found for network ${networkName}`);
  }
  const deployedContractsMasterchefV3 = await import(`@moriswap/masterchef-v3/deployments/${networkName}.json`);
  const deployedContractsV3Periphery = await import(`@moriswap/v3-periphery/deployments/${networkName}.json`);

  // Verify masterChefV3
  console.log("Verify masterChefV3");
  await verifyContract(deployedContractsMasterchefV3.MasterChefV3, [
    deployedContractsV3Periphery.NonfungiblePositionManager,
    config.WNATIVE,
  ]);
  await sleep(10000);

  console.log("Verify vault");
  await verifyContract(deployedContractsMasterchefV3.Vault, [
    deployedContractsMasterchefV3.MasterChefV3,
    config.WNATIVE,
  ]);
  await sleep(10000);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
