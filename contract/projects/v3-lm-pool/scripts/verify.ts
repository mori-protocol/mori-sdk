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
  const deployedContractsMasterchefV3 = await import(
    `@moriswap/masterchef-v3/deployments/${networkName}.json`
  );
  const deployedContractsV3LmPool = await import(
    `@moriswap/v3-lm-pool/deployments/${networkName}.json`
  );

  // Verify moriV3LmPoolDeployer
  console.log("Verify MoriV3LmPoolDeployer");
  await verifyContract(deployedContractsV3LmPool.MoriV3LmPoolDeployer, [
    deployedContractsMasterchefV3.MasterChefV3,
  ]);
  await sleep(10000);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
