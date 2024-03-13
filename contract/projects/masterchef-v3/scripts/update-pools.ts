/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable camelcase */
import { ethers, network } from "hardhat";
import { sleep } from "@moriswap/common/sleep";
import { MasterChefV3 } from "../typechain-types/contracts/MasterChefV3";
import { getAddress } from "ethers/lib/utils";
import { BigNumber } from "ethers";

const ONLY_FETCH = false;

type Rewarder = {
  poolAddress: string;
  rewardToken: string;
  duration: number;
  rewardPerSecond: BigNumber;
};

const rewarders = [
  {
    poolAddress: getAddress("0x90b63da86dd57eb61e6e022a487a5172c354f945"), // USDT-USDC
    rewardToken: getAddress("0x18cb9a524564cea5e8fad4dca9ad5dde6cf212e3"), // USDC
    duration: 86400 * 30,
    rewardPerSecond: perSecond(100, 6), // perDay(9.67) ~= (9.67 * 10^6 * 10^12) / 86400
  }
];

function perSecond(perDay: number, decimals: number) {
  return BigNumber.from((perDay * 10 ** 6).toFixed(0))
    .mul(BigNumber.from(10).pow(decimals + 6))
    .div(86400);
}

async function fetchRewarders(masterChefV3: MasterChefV3, rewarders: Rewarder[]) {
  let rewarderMap = new Map();
  for (const rewarder of rewarders) {
    const rewarderLength = await masterChefV3.getRewarderLength(rewarder.poolAddress);
    if (rewarderLength.eq(0)) {
      continue;
    }
    if (!rewarderMap.has(rewarder.poolAddress)) {
      rewarderMap.set(rewarder.poolAddress, new Map());
    }
    for (let i = 0; i < rewarderLength.toNumber(); i++) {
      const rewarderInfo = await masterChefV3.getRewarderInfo(rewarder.poolAddress, i);
      rewarderMap.get(rewarder.poolAddress).set(rewarderInfo.rewardToken, rewarderInfo);
    }
  }
  return rewarderMap;
}

async function main() {
  const networkName = network.name;
  const MasterChefV3 = await ethers.getContractFactory("MasterChefV3");
  const masterChefV3Contracts = await import(`@moriswap/masterchef-v3/deployments/${networkName}.json`);
  const masterChefV3 = MasterChefV3.attach(masterChefV3Contracts.MasterChefV3);

  if (ONLY_FETCH) {
    let rewarderMap = await fetchRewarders(masterChefV3, rewarders);

    for (let entrie of rewarderMap.entries()) {
      console.log(`${entrie[0]} rewarders`);
      console.log("------------------------------------------------------------------");
      for (let rewarderInfo of entrie[1].values()) {
        console.log(
          `rewardToken: ${rewarderInfo.rewardToken} rewardPerSecond: ${rewarderInfo.rewardPerSecond} endTime: ${rewarderInfo.endTime}`
        );
      }
      console.log("\n");
    }
    console.log(rewarders[0].rewardPerSecond.toString());
    return;
  }
  for (const rewarder of rewarders) {
    let rewarderMap = await fetchRewarders(masterChefV3, rewarders);

    // addPool
    if (!rewarderMap.has(rewarder.poolAddress)) {
      console.log("add pool: ", rewarder);
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
      console.log(`add pool tx: ${resp.transactionHash} status: ${resp.status}`);
      continue;
    }

    const pid = await masterChefV3.v3PoolAddressPid(rewarder.poolAddress);
    // addRewarder
    const poolRewarderMap = rewarderMap.get(rewarder.poolAddress);
    if (!poolRewarderMap.has(rewarder.rewardToken)) {
      console.log("add rewarder: ", rewarder);
      const tx = await masterChefV3.addRewarder(
        pid,
        rewarder.rewardToken,
        rewarder.rewardPerSecond.toString(),
        rewarder.duration,
        {
          gasLimit: 3000000,
        }
      );
      const resp = await tx.wait();
      await sleep(3000);
      console.log(rewarder);
      console.log(`add rewarder tx: ${resp.transactionHash} status: ${resp.status}`);
      continue;
    }

    // updateRewarder
    console.log("update rewarder: ", rewarder);
    const tx = await masterChefV3.updateRewarder(
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
    console.log(`update rewarder tx: ${resp.transactionHash} status: ${resp.status}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
