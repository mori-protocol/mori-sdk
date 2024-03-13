/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable camelcase */
import { ethers } from "hardhat";

async function main() {
  const MasterChefV3 = await ethers.getContractFactory("MasterChefV3");
  const masterChefV3 = MasterChefV3.attach("0xCF60ac0F7cd5F681A46da6657609780cbb8d18ef");
  let emergency = await masterChefV3.emergency();
  console.log(`emergency: ${emergency}`);
  const tx = await masterChefV3.setEmergency(true);
  const resp = await tx.wait();
  console.log(`setEmergency tx: ${resp.transactionHash} status: ${resp.status}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
