import { ethers, network } from "hardhat";
import { configs } from "@moriswap/common/config";
import fs from "fs";
import { abi as masterChefABI } from "@moriswap/masterchef-v3/artifacts/contracts/MasterChefV3.sol/MasterChefV3.json";
import { abi as v3FactoryABI } from "@moriswap/v3-core/artifacts/contracts/MoriV3Factory.sol/MoriV3Factory.json";
import { sleep } from "@moriswap/common/sleep";

async function main() {
  const [owner] = await ethers.getSigners();
  // Remember to update the init code hash in SC for different chains before deploying
  const networkName = network.name;
  const config = configs[networkName as keyof typeof configs];
  if (!config) {
    throw new Error(`No config found for network ${networkName}`);
  }

  const v3DeployedContracts = await import(
    `@moriswap/v3-core/deployments/${networkName}.json`
  );
  const MCV3DeployedContracts = await import(
    `@moriswap/masterchef-v3/deployments/${networkName}.json`
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

  const moriV3Factory_address = v3DeployedContracts.MoriV3Factory;
  const moriV3Factory = new ethers.Contract(
    moriV3Factory_address,
    v3FactoryABI,
    owner
  );
  await moriV3Factory.setLmPoolDeployer(moriV3LmPoolDeployer.address);
  console.log(
    "moriV3Factory setLmPoolDeployer to:",
    moriV3LmPoolDeployer.address
  );
  await sleep(5000);

  const masterchefv3 = new ethers.Contract(
    MCV3DeployedContracts.MasterChefV3,
    masterChefABI,
    owner
  );
  await masterchefv3.setLMPoolDeployer(moriV3LmPoolDeployer.address);
  console.log(
    "masterchefv3 setLMPoolDeployer to:",
    moriV3LmPoolDeployer.address
  );

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
