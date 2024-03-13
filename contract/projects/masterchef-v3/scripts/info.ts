/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable camelcase */
import { ethers, network } from "hardhat";

async function main() {
  const networkName = network.name;
  const MasterChefV3 = await ethers.getContractFactory("MasterChefV3");
  const masterChefV3Contracts = await import(`@moriswap/masterchef-v3/deployments/${networkName}.json`);
  const masterChefV3 = MasterChefV3.attach(masterChefV3Contracts.MasterChefV3);

  console.log(`MasterChefV3: ${masterChefV3.address}`);
  let emergency = await masterChefV3.emergency();
  console.log(`emergency: ${emergency}`);
  let WETH = await masterChefV3.WETH();
  console.log(`WETH: ${WETH}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
