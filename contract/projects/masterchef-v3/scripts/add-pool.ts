/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable camelcase */
import { ethers, network } from "hardhat";
import { sleep } from "@moriswap/common/sleep";

async function main() {
  const networkName = network.name;
  const MasterChefV3 = await ethers.getContractFactory("MasterChefV3");
  const masterChefV3Contracts = await import(`@moriswap/masterchef-v3/deployments/${networkName}.json`);
  const masterChefV3 = MasterChefV3.attach(masterChefV3Contracts.MasterChefV3);

  const rewarders = [
    {
      isInit: true,
      poolAddress: "0x4E09f49bA46cCF48446dBF3796282cd97c369731",
      rewardToken: "0x9085DC4819cdf4cD45fa0e139395D95f5bE38e72",
      duration: 86400 * 2,
      rewardPerSecond: "10000000000000000",
    },
    {
      isInit: true,
      poolAddress: "0x98AEf5ab0af1e1F7Ddd375f0E85A192C9e74EFEb",
      rewardToken: "0x9085DC4819cdf4cD45fa0e139395D95f5bE38e72",
      duration: 86400 * 2,
      rewardPerSecond: "10000000000000000",
    },
    {
      isInit: false,
      poolAddress: "0x98AEf5ab0af1e1F7Ddd375f0E85A192C9e74EFEb",
      rewardToken: "0xeD36ca79cD08332553ad11f5905aE759DA008Bc5",
      duration: 86400 * 2,
      rewardPerSecond: "10000000000000000000000000",
    },
  ];

  for (const rewarder of rewarders) {
    if (rewarder.isInit) {
      const tx = await masterChefV3.addPool(
        rewarder.poolAddress,
        rewarder.rewardToken,
        rewarder.rewardPerSecond,
        rewarder.duration,
        {
          gasLimit: 3000000,
        }
      );
      const resp = await tx.wait();
      await sleep(3000);
      console.log(rewarder);
      console.log(`add rewarder tx: ${resp.transactionHash} status: ${resp.status}`);
    } else {
      const pid = await masterChefV3.v3PoolAddressPid(rewarder.poolAddress);
      console.log("pid", pid);
      const tx = await masterChefV3.addRewarder(
        pid,
        rewarder.rewardToken,
        rewarder.rewardPerSecond,
        rewarder.duration,
        {
          gasLimit: 3000000,
        }
      );
      const resp = await tx.wait();
      await sleep(3000);
      console.log(rewarder);
      console.log(`add rewarder tx: ${resp.transactionHash} status: ${resp.status}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
