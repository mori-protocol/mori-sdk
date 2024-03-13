import { ethers, network } from "hardhat";
import { configs } from "@moriswap/common/config";
import fs from "fs";
import { sleep } from "@moriswap/common/sleep";

async function main() {
  // Remember to update the init code hash in SC for different chains before deploying
  const networkName = network.name;
  const config = configs[networkName as keyof typeof configs];
  if (!config) {
    throw new Error(`No config found for network ${networkName}`);
  }

  const MCV3DeployedContracts = await import(
    `@moriswap/masterchef-v3/deployments/Viction.json`
  );

  const MoriV3LmPoolDeployer = await ethers.getContractFactory(
    "MoriV3LmPoolDeployer"
  );
  console.log(MCV3DeployedContracts.MasterChefV3);
  const moriV3LmPoolDeployer = await MoriV3LmPoolDeployer.deploy(
    MCV3DeployedContracts.MasterChefV3
  );
  console.log(
    "moriV3LmPoolDeployer deployed to:",
    moriV3LmPoolDeployer.address
  );
  await sleep(5000);

  const contracts = {
    MoriV3LmPoolDeployer: moriV3LmPoolDeployer.address,
  };
  fs.writeFileSync(
    `./deployments/${networkName}.json`,
    JSON.stringify(contracts, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
