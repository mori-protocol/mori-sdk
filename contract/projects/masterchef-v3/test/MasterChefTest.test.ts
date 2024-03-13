/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, network } from "hardhat";
import { reset, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import V3PoolArtifact from "@moriswap/v3-core/artifacts/contracts/MoriV3Pool.sol/MoriV3Pool.json";
import V3PoolDeployerArtifact from "@moriswap/v3-core/artifacts/contracts/MoriV3PoolDeployer.sol/MoriV3PoolDeployer.json";
import V3FactoryArtifact from "@moriswap/v3-core/artifacts/contracts/MoriV3Factory.sol/MoriV3Factory.json";
import SwapRouterArtifact from "@moriswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import NonfungiblePositionManagerArtifact from "@moriswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import V3LmPoolDeployerArtifact from "@moriswap/v3-lm-pool/artifacts/contracts/MoriV3LmPoolDeployer.sol/MoriV3LmPoolDeployer.json";
import ERC20MockArtifact from "./Token.json";
import WVICEArtifact from "./WVIC.json";
import MultiCallArtifact from "@moriswap/v3-periphery/artifacts/contracts/lens/MoriInterfaceMulticall.sol/MoriInterfaceMulticall.json";

// const WNATIVE = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

describe("MasterChef", function () {
  let admin: any;
  let alice: any;
  let bob: any;
  let WNATIVE;

  before(async function () {
    [admin, alice, bob] = await ethers.getSigners();
  });

  beforeEach(async function () {
    reset();
    const TokenMock = await ethers.getContractFactoryFromArtifact(ERC20MockArtifact);
    const WVICMock = await ethers.getContractFactoryFromArtifact(WVICEArtifact);
    this.wvic = await WVICMock.deploy();
    this.usdc = await TokenMock.deploy("USDC", "USDC", 6, 1000000000);
    this.usdt = await TokenMock.deploy("USDT", "USDT", 6, 1000000000);
    this.krm = await TokenMock.deploy("KRM", "KRM", 6, 1000000000);
    this.rwd = await TokenMock.deploy("RWD", "RWD", 6, 1000000000);

    WNATIVE = this.wvic.address;

    const V3PoolDeployer = await ethers.getContractFactoryFromArtifact(V3PoolDeployerArtifact);
    this.v3PoolDeployer = await V3PoolDeployer.deploy();

    const V3Factory = await ethers.getContractFactoryFromArtifact(V3FactoryArtifact);
    this.v3Factory = await V3Factory.deploy(this.v3PoolDeployer.address);

    const MultiCall = await ethers.getContractFactoryFromArtifact(MultiCallArtifact);
    this.multiCall = await MultiCall.deploy();

    await this.v3PoolDeployer.setFactoryAddress(this.v3Factory.address);

    const SwapRouter = await ethers.getContractFactoryFromArtifact(SwapRouterArtifact);
    this.swapRouter = await SwapRouter.deploy(this.v3PoolDeployer.address, this.v3Factory.address, WNATIVE);

    const NonfungiblePositionManager = await ethers.getContractFactoryFromArtifact(NonfungiblePositionManagerArtifact);
    this.nonfungiblePositionManager = await NonfungiblePositionManager.deploy(
      this.v3PoolDeployer.address,
      this.v3Factory.address,
      WNATIVE,
      ethers.constants.AddressZero
    );

    const MasterChef = await ethers.getContractFactory("MasterChefV3");
    this.masterChef = await MasterChef.deploy(this.nonfungiblePositionManager.address, WNATIVE);

    const Vault = await ethers.getContractFactory("Vault");
    this.vault = await Vault.deploy(this.masterChef.address, WNATIVE);

    const V3LmPoolDeployer = await ethers.getContractFactoryFromArtifact(V3LmPoolDeployerArtifact);
    this.v3LmPoolDeployer = await V3LmPoolDeployer.deploy(this.masterChef.address);

    this.masterChef.setVault(this.vault.address);
    this.masterChef.setLMPoolDeployer(this.v3LmPoolDeployer.address);
    this.v3Factory.setLmPoolDeployer(this.v3LmPoolDeployer.address);

    this.V3Pool = await ethers.getContractFactoryFromArtifact(V3PoolArtifact);

    // Create pools
    const pools = [
      {
        token0: this.usdc.address < this.usdt.address ? this.usdc.address : this.usdt.address,
        token1: this.usdt.address > this.usdc.address ? this.usdt.address : this.usdc.address,
        fee: 500,
        initSqrtPriceX96: ethers.BigNumber.from("2").pow(96),
      },
      {
        token0: this.usdc.address < this.krm.address ? this.usdc.address : this.krm.address,
        token1: this.krm.address > this.usdc.address ? this.krm.address : this.usdc.address,
        fee: 500,
        initSqrtPriceX96: ethers.BigNumber.from("2").pow(96),
      },
      {
        token0: this.usdc.address < this.wvic.address ? this.usdc.address : this.wvic.address,
        token1: this.wvic.address > this.usdc.address ? this.wvic.address : this.usdc.address,
        fee: 500,
        initSqrtPriceX96: ethers.BigNumber.from("2").pow(96),
      },
    ];
    this.pools = pools;
    const poolAddresses = await Promise.all(
      pools.map(async (p) => {
        const receipt = await (
          await this.nonfungiblePositionManager.createAndInitializePoolIfNecessary(
            p.token0,
            p.token1,
            p.fee,
            p.initSqrtPriceX96
          )
        ).wait();
        const [, address] = ethers.utils.defaultAbiCoder.decode(["int24", "address"], receipt.logs[0].data);
        return address;
      })
    );
    this.poolAddresses = poolAddresses;

    await this.usdc.mint(alice.address, 1000000000000);
    await this.usdt.mint(alice.address, 1000000000000);
    await this.krm.mint(alice.address, 1000000000000);

    await this.usdc.mint(bob.address, 1000000000000);
    await this.usdt.mint(bob.address, 1000000000000);
    await this.krm.mint(bob.address, 1000000000000);

    await this.usdc.mint(admin.address, 1000000000000);
    await this.usdt.mint(admin.address, 1000000000000);
    await this.krm.mint(admin.address, 1000000000000);
    await this.rwd.mint(admin.address, 1000000000000);

    await this.wvic.connect(alice).deposit({ value: ethers.utils.parseEther("10") });
    await this.wvic.connect(bob).deposit({ value: ethers.utils.parseEther("10") });
    await this.wvic.connect(admin).deposit({ value: ethers.utils.parseEther("10") });

    // Approve tokens for nonfungiblePositionManager
    await this.usdc.connect(alice).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);
    await this.usdt.connect(alice).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);
    await this.krm.connect(alice).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);
    await this.wvic.connect(alice).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);

    await this.usdc.connect(bob).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);
    await this.usdt.connect(bob).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);
    await this.krm.connect(bob).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);
    await this.wvic.connect(bob).approve(this.nonfungiblePositionManager.address, ethers.constants.MaxUint256);

    // Approve tokens for masterChef
    await this.usdc.connect(alice).approve(this.masterChef.address, ethers.constants.MaxUint256);
    await this.usdt.connect(alice).approve(this.masterChef.address, ethers.constants.MaxUint256);
    await this.krm.connect(alice).approve(this.masterChef.address, ethers.constants.MaxUint256);
    await this.wvic.connect(alice).approve(this.masterChef.address, ethers.constants.MaxUint256);

    await this.usdc.connect(alice).approve(this.multiCall.address, ethers.constants.MaxUint256);
    await this.usdt.connect(alice).approve(this.multiCall.address, ethers.constants.MaxUint256);
    await this.krm.connect(alice).approve(this.multiCall.address, ethers.constants.MaxUint256);
    await this.wvic.connect(alice).approve(this.multiCall.address, ethers.constants.MaxUint256);

    await this.usdc.connect(bob).approve(this.masterChef.address, ethers.constants.MaxUint256);
    await this.usdt.connect(bob).approve(this.masterChef.address, ethers.constants.MaxUint256);
    await this.krm.connect(bob).approve(this.masterChef.address, ethers.constants.MaxUint256);
    await this.wvic.connect(bob).approve(this.masterChef.address, ethers.constants.MaxUint256);

    // Approve tokens for swapRouter
    await this.usdc.connect(admin).approve(this.swapRouter.address, ethers.constants.MaxUint256);
    await this.usdt.connect(admin).approve(this.swapRouter.address, ethers.constants.MaxUint256);

    await network.provider.send("evm_setAutomine", [false]);
  });

  afterEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
  });

  describe("Test MasterChef with one rewarder one position", function () {
    it("one rewarder base test", async function () {
      // Create position
      await time.increase(1);
      await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[0].token0,
        token1: this.pools[0].token1,
        fee: this.pools[0].fee,
        tickLower: -100,
        tickUpper: 100,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);

      // Add rewarder, 1000 KRM(decimal) per second
      console.log("");
      console.log("       @1 add rewarder ---------------------------------------------------");
      await time.increase(1);
      await this.masterChef.addPool(this.poolAddresses[0], this.krm.address, 1000 * 1e12, 86400);
      await time.increase(1);
      const poolLength = await this.masterChef.poolLength();
      expect(poolLength).to.equal(1);
      let poolInfo = await this.masterChef.poolInfo(1);
      expect(poolInfo.v3Pool).to.equal(this.poolAddresses[0]);
      expect(poolInfo.totalLiquidity).to.equal(0);
      const rewardLength = await this.masterChef.getRewarderLength(this.poolAddresses[0]);
      expect(rewardLength).to.equal(1);
      let rewarderInfo = await this.masterChef.getRewarderInfo(this.poolAddresses[0], 0);
      expect(rewarderInfo.rewardToken).to.equal(this.krm.address);
      expect(rewarderInfo.rewardPerSecond).to.equal(1000 * 1e12);

      // Deposit reward
      console.log("");
      console.log("       @2 deposit reward -------------------------------------------------");
      await this.krm.transfer(this.vault.address, 10000000000);
      await time.increase(1);
      expect(await this.krm.balanceOf(this.vault.address)).to.equal(10000000000);

      // Stake position
      console.log("");
      console.log("       @3 stake position -------------------------------------------------");
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 1);
      await time.increase(1);
      let position = await this.masterChef.userPositionInfos(1);
      expect(position.user.toString()).to.equal(alice.address);

      // Get pending reward
      console.log("");
      console.log("       @4 get pending reward ---------------------------------------------");
      await time.increase(20);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      const rewardAmount = (await this.masterChef.pendingRewards(1))[0];
      rewarderInfo = await this.masterChef.getRewarderInfo(this.poolAddresses[0], 0);
      expect(rewardAmount.toString()).to.equal("20999");
      expect(rewarderInfo.releasedAmount.div(1e12)).to.equal("23000");
      expect(rewarderInfo.harvestedAmount).to.equal("0");

      // Increase liquidity
      console.log("");
      console.log("       @5 increase liquidity ---------------------------------------------");
      poolInfo = await this.masterChef.poolInfo(1);
      await time.increase(1);
      await this.masterChef.connect(alice).increaseLiquidity({
        tokenId: 1,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      poolInfo = await this.masterChef.poolInfo(1);
      position = await this.masterChef.userPositionInfos(1);
      expect(poolInfo.totalLiquidity.toString()).to.equal("4010208");
      expect(position.liquidity.toString()).to.equal("4010208");

      // Decrease liquidity
      console.log("");
      console.log("       @6 decrease liquidity ---------------------------------------------");
      await this.masterChef.connect(alice).decreaseLiquidity({
        tokenId: 1,
        liquidity: poolInfo.totalLiquidity.div(2),
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      const pos = await this.nonfungiblePositionManager.positions(1);
      expect(pos.tokensOwed0.toString()).to.equal("9999");
      expect(pos.tokensOwed1.toString()).to.equal("9999");
      poolInfo = await this.masterChef.poolInfo(1);
      position = await this.masterChef.userPositionInfos(1);
      expect(poolInfo.totalLiquidity.toString()).to.equal("2005104");

      // Collect
      console.log("");
      console.log("       @7 collect --------------------------------------------------------");
      // collect to alice
      let beforeBalance0 = await this.usdc.balanceOf(alice.address);
      let beforeBalance1 = await this.usdt.balanceOf(alice.address);
      await this.masterChef.connect(alice).collect({
        tokenId: 1,
        recipient: alice.address,
        amount0Max: "5000",
        amount1Max: "5000",
      });
      await time.increase(1);
      let afterBalance0 = await this.usdc.balanceOf(alice.address);
      let afterBalance1 = await this.usdt.balanceOf(alice.address);
      expect(afterBalance0.sub(beforeBalance0).toString()).to.equal("5000");
      expect(afterBalance1.sub(beforeBalance1).toString()).to.equal("5000");
      // collect to bob
      beforeBalance0 = await this.usdc.balanceOf(bob.address);
      beforeBalance1 = await this.usdt.balanceOf(bob.address);
      await this.masterChef.connect(alice).collect({
        tokenId: 1,
        recipient: bob.address,
        amount0Max: "5000",
        amount1Max: "5000",
      });
      await time.increase(1);
      afterBalance0 = await this.usdc.balanceOf(bob.address);
      afterBalance1 = await this.usdt.balanceOf(bob.address);
      expect(afterBalance0.sub(beforeBalance0).toString()).to.equal("4999");
      expect(afterBalance1.sub(beforeBalance1).toString()).to.equal("4999");

      // Havrest
      console.log("");
      console.log("       @8 harvest --------------------------------------------------------");
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      let amount = (await this.masterChef.pendingRewards(1))[0];
      expect(amount.toString()).to.equal("26997");
      let beforeBalanceKrm = await this.krm.balanceOf(alice.address);
      await this.masterChef.connect(alice).harvest(1, alice.address);
      await time.increase(1);
      let afterBalanceKrm = await this.krm.balanceOf(alice.address);
      expect(afterBalanceKrm.sub(beforeBalanceKrm).toString()).to.equal("27997");
      rewarderInfo = await this.masterChef.getRewarderInfo(this.poolAddresses[0], 0);
      expect(rewarderInfo.releasedAmount.div(1e12)).to.equal("30000");
      expect(rewarderInfo.harvestedAmount).to.equal("27997");

      // Update rewarder perSecond
      console.log("");
      console.log("       @9 update rewarder perSecond --------------------------------------");
      const pid = await this.masterChef.v3PoolAddressPid(this.poolAddresses[0]);
      await this.masterChef.updateRewarder(pid, this.krm.address, 10 * 1e12, 86400);
      await time.increase(1);
      rewarderInfo = await this.masterChef.getRewarderInfo(this.poolAddresses[0], 0);
      expect(rewarderInfo.rewardPerSecond.div(1e12)).to.equal("10");
      await time.increase(86400);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      amount = (await this.masterChef.pendingRewards(1))[0];
      expect(amount.toString()).to.equal("864999");
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      await time.increase(86400);
      amount = (await this.masterChef.pendingRewards(1))[0];
      expect(amount.toString()).to.equal("864999");

      // Withdraw
      console.log("");
      console.log("       @10 withdraw ------------------------------------------------------");
      beforeBalanceKrm = await this.krm.balanceOf(alice.address);
      await this.masterChef.connect(alice).withdraw(1, alice.address);
      await time.increase(1);
      const afterOwner = await this.nonfungiblePositionManager.ownerOf(1);
      expect(alice.address).to.equal(afterOwner);
      afterBalanceKrm = await this.krm.balanceOf(alice.address);
      expect(afterBalanceKrm.sub(beforeBalanceKrm).toString()).to.equal("864999");

      // Burn
      console.log("");
      console.log("       @11 burn ----------------------------------------------------------");
      beforeBalance0 = await this.usdc.balanceOf(alice.address);
      beforeBalance1 = await this.usdt.balanceOf(alice.address);
      beforeBalanceKrm = await this.krm.balanceOf(alice.address);
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 1);
      await time.increase(1);
      const positionInfo = await this.masterChef.userPositionInfos(1);
      await this.masterChef.connect(alice).decreaseLiquidity({
        tokenId: 1,
        liquidity: positionInfo.liquidity,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      await this.masterChef.connect(alice).collect({
        tokenId: 1,
        recipient: alice.address,
        amount0Max: "1000000",
        amount1Max: "1000000",
      });
      await time.increase(1);
      await this.masterChef.connect(alice).harvest(1, alice.address);
      await time.increase(1);
      afterBalance0 = await this.usdc.balanceOf(alice.address);
      afterBalance1 = await this.usdt.balanceOf(alice.address);
      afterBalanceKrm = await this.krm.balanceOf(alice.address);
      await this.masterChef.connect(alice).burn(1);
      expect(afterBalance0.sub(beforeBalance0).toString()).to.equal("9999");
      expect(afterBalance1.sub(beforeBalance1).toString()).to.equal("9999");
      expect(afterBalanceKrm.sub(beforeBalanceKrm).toString()).to.equal("0");
    });
  });

  describe("Test MasterChef with two rewarder one position", function () {
    it("two rewarder base test", async function () {
      // Create position
      await time.increase(1);
      await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[0].token0,
        token1: this.pools[0].token1,
        fee: this.pools[0].fee,
        tickLower: -100,
        tickUpper: 100,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);

      // Add two rewarder
      console.log("");
      console.log("       @1 add two rewarder -----------------------------------------------");
      await this.masterChef.addPool(this.poolAddresses[0], this.krm.address, 1000 * 1e12, 86400);
      await time.increase(1);
      const pid = await this.masterChef.v3PoolAddressPid(this.poolAddresses[0]);
      await this.masterChef.addRewarder(pid, this.rwd.address, 1000 * 1e12, 86400);
      await time.increase(1);
      const rewarderLength = await this.masterChef.getRewarderLength(this.poolAddresses[0]);
      expect(rewarderLength).to.equal(2);
      const rewarderKrm = await this.masterChef.getRewarderInfo(this.poolAddresses[0], 0);
      expect(rewarderKrm.rewardToken).to.equal(this.krm.address);
      const rewarderRwd = await this.masterChef.getRewarderInfo(this.poolAddresses[0], 1);
      expect(rewarderRwd.rewardToken).to.equal(this.rwd.address);
      await this.krm.transfer(this.vault.address, 1e10);
      await this.rwd.transfer(this.vault.address, 1e10);

      // Stake position
      console.log("");
      console.log("       @2 stake position -------------------------------------------------");
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 1);
      await time.increase(1);
      const position = await this.masterChef.userPositionInfos(1);
      expect(position.user.toString()).to.equal(alice.address);

      // get pending reward
      console.log("");
      console.log("       @3 get pending reward ---------------------------------------------");
      await time.increase(20);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      const rewards = await this.masterChef.pendingRewards(1);
      expect(rewards[0]).to.equal(20999);
      expect(rewards[1]).to.equal(20999);

      // increase liquidity
      console.log("");
      console.log("       @4 increase liquidity ---------------------------------------------");
      await this.masterChef.connect(alice).increaseLiquidity({
        tokenId: 1,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      let pos = await this.masterChef.userPositionInfos(1);
      expect(pos.liquidity).to.equal(4010208);

      // decrease liquidity
      console.log("");
      console.log("       @5 decrease liquidity ---------------------------------------------");
      await this.masterChef.connect(alice).decreaseLiquidity({
        tokenId: 1,
        liquidity: pos.liquidity.div(2),
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      pos = await this.masterChef.userPositionInfos(1);
      expect(pos.liquidity).to.equal(2005104);

      // collect
      console.log("");
      console.log("       @6 collect --------------------------------------------------------");
      let balanceBefore0 = await this.usdc.balanceOf(alice.address);
      let balanceBefore1 = await this.usdt.balanceOf(alice.address);
      await this.masterChef.connect(alice).collect({
        tokenId: 1,
        recipient: alice.address,
        amount0Max: "10000",
        amount1Max: "10000",
      });
      await time.increase(1);
      let balanceAfter0 = await this.usdc.balanceOf(alice.address);
      let balanceAfter1 = await this.usdt.balanceOf(alice.address);
      expect(balanceAfter0.sub(balanceBefore0)).to.equal(9999);
      expect(balanceAfter1.sub(balanceBefore1)).to.equal(9999);

      // harvest
      console.log("");
      console.log("       @7 harvest --------------------------------------------------------");
      let beforeBalanceKrm = await this.krm.balanceOf(alice.address);
      let beforeBalanceRwd = await this.rwd.balanceOf(alice.address);
      await this.masterChef.connect(alice).harvest(1, alice.address);
      await time.increase(1);
      let afterBalanceKrm = await this.krm.balanceOf(alice.address);
      let afterBalanceRwd = await this.rwd.balanceOf(alice.address);
      expect(afterBalanceKrm.sub(beforeBalanceKrm)).to.equal(24997);
      expect(afterBalanceRwd.sub(beforeBalanceRwd)).to.equal(24997);

      // withdraw
      console.log("");
      console.log("       @8 withdraw -------------------------------------------------------");
      beforeBalanceKrm = await this.krm.balanceOf(alice.address);
      beforeBalanceRwd = await this.rwd.balanceOf(alice.address);
      await this.masterChef.connect(alice).withdraw(1, alice.address);
      await time.increase(1);
      afterBalanceKrm = await this.krm.balanceOf(alice.address);
      afterBalanceRwd = await this.rwd.balanceOf(alice.address);
      const owner = await this.nonfungiblePositionManager.ownerOf(1);
      expect(owner).to.equal(alice.address);
      expect(afterBalanceKrm.sub(beforeBalanceKrm)).to.equal(999);
      expect(afterBalanceRwd.sub(beforeBalanceRwd)).to.equal(999);

      // burn
      console.log("");
      console.log("       @9 burn -----------------------------------------------------------");
      balanceBefore0 = await this.usdc.balanceOf(alice.address);
      balanceBefore1 = await this.usdt.balanceOf(alice.address);
      beforeBalanceKrm = await this.krm.balanceOf(alice.address);
      beforeBalanceRwd = await this.rwd.balanceOf(alice.address);
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 1);
      await time.increase(1);
      const positionInfo = await this.masterChef.userPositionInfos(1);
      await this.masterChef.connect(alice).decreaseLiquidity({
        tokenId: 1,
        liquidity: positionInfo.liquidity,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      await this.masterChef.connect(alice).collect({
        tokenId: 1,
        recipient: alice.address,
        amount0Max: "1000000",
        amount1Max: "1000000",
      });
      await time.increase(1);
      await this.masterChef.connect(alice).harvest(1, alice.address);
      await time.increase(1);
      balanceAfter0 = await this.usdc.balanceOf(alice.address);
      balanceAfter1 = await this.usdt.balanceOf(alice.address);
      afterBalanceKrm = await this.krm.balanceOf(alice.address);
      afterBalanceRwd = await this.rwd.balanceOf(alice.address);
      await this.masterChef.connect(alice).burn(1);
      expect(balanceAfter0.sub(balanceBefore0)).to.equal(9999);
      expect(balanceAfter1.sub(balanceBefore1)).to.equal(9999);
      expect(afterBalanceKrm.sub(beforeBalanceKrm)).to.equal(999);
      expect(afterBalanceRwd.sub(beforeBalanceRwd)).to.equal(999);
    });
  });

  describe("Test MasterChef with multi rewarder and multi position", function () {
    it("multi rewarder positions and with swap test", async function () {
      // Create position
      await time.increase(1);
      await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[0].token0,
        token1: this.pools[0].token1,
        fee: this.pools[0].fee,
        tickLower: -100,
        tickUpper: 100,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);

      // Add two rewarder
      console.log("");
      console.log("       @1 add first rewarder ---------------------------------------------");
      await this.masterChef.addPool(this.poolAddresses[0], this.krm.address, 1000 * 1e12, 86400);
      await time.increase(1);
      await this.krm.transfer(this.vault.address, 1e10);
      await time.increase(1);
      let rewarderInfo = await this.masterChef.getRewarderInfo(this.poolAddresses[0], 0);
      expect(rewarderInfo.rewardToken).to.equal(this.krm.address);
      expect(rewarderInfo.rewardPerSecond).to.equal(1000 * 1e12);

      console.log("");
      console.log("       @2 stake position 1 --------------------------------------------------");
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 1);
      await time.increase(1);
      await this.rwd.transfer(this.vault.address, 1e10);
      await time.increase(1);
      await time.increase(10);

      console.log("");
      console.log("       @3 add second rewarder -----------------------------------------------");
      const pid = await this.masterChef.v3PoolAddressPid(this.poolAddresses[0]);
      await this.masterChef.addRewarder(pid, this.rwd.address, 1000 * 1e12, 86400);
      await time.increase(1);
      await time.increase(10);

      console.log("");
      console.log("       @4 get pending reward ------------------------------------------------");
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      let rewards = await this.masterChef.pendingRewards(1);
      expect(rewards[0]).to.equal(22999);
      expect(rewards[1]).to.equal(10999);
      await time.increase(10);
      this.masterChef.updatePools([1]);
      await time.increase(1);
      rewards = await this.masterChef.pendingRewards(1);
      expect(rewards[0]).to.equal(33999);
      expect(rewards[1]).to.equal(21999);

      console.log("");
      console.log("       @5 add second position ------------------------------------------------");
      await this.nonfungiblePositionManager.connect(bob).mint({
        token0: this.pools[0].token0,
        token1: this.pools[0].token1,
        fee: this.pools[0].fee,
        tickLower: -200,
        tickUpper: 200,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);

      console.log("");
      console.log("       @6 stake position 2 --------------------------------------------------");
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 2);
      await time.increase(1);
      let position1 = await this.nonfungiblePositionManager.positions(1);
      let position2 = await this.nonfungiblePositionManager.positions(2);
      let poolInfo = await this.masterChef.poolInfo(1);
      expect(poolInfo.totalLiquidity).to.equal(position1.liquidity.add(position2.liquidity));

      console.log("");
      console.log("       @7 get pending reward ------------------------------------------------");
      let beforeRewards1 = await this.masterChef.pendingRewards(1);
      let beforeRewards2 = await this.masterChef.pendingRewards(2);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      await time.increase(10);
      let afterRewards1 = await this.masterChef.pendingRewards(1);
      let afterRewards2 = await this.masterChef.pendingRewards(2);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(667);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(667);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(333);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(333);

      console.log("");
      console.log("       @8 left cross position1 tick lower and get pending reward ------------");
      let solt0Before = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      await this.swapRouter.exactInputSingle({
        tokenIn: this.pools[0].token0,
        tokenOut: this.pools[0].token1,
        fee: this.pools[0].fee,
        amountIn: 16000,
        amountOutMinimum: ethers.constants.Zero,
        sqrtPriceLimitX96: ethers.constants.Zero,
        recipient: admin.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      let solt0After = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      console.log(
        "         ->  pool_tick: [%d -> %d] position1: [-100, 100] position2: [-200, 200]",
        solt0Before.tick,
        solt0After.tick
      );
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(0);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(0);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(11000);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(11000);

      console.log("");
      console.log("       @9 right cross position2 tick lower and get pending reward -----------");
      solt0Before = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      await this.swapRouter.exactInputSingle({
        tokenIn: this.pools[0].token1,
        tokenOut: this.pools[0].token0,
        fee: this.pools[0].fee,
        amountIn: 16000,
        amountOutMinimum: ethers.constants.Zero,
        sqrtPriceLimitX96: ethers.constants.Zero,
        recipient: admin.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      solt0After = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      console.log(
        "         ->  pool_tick: [%d -> %d] position1: [-100, 100] position2: [-200, 200]",
        solt0Before.tick,
        solt0After.tick
      );
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(7327);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(7327);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(3673);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(3673);

      console.log("");
      console.log("       @10 right cross position1 tick upper and get pending reward ----------");
      await this.masterChef.updateRewarder(pid, this.rwd.address, 2000 * 1e12, 86400);
      await time.increase(1);
      solt0Before = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      await this.swapRouter.exactInputSingle({
        tokenIn: this.pools[0].token1,
        tokenOut: this.pools[0].token0,
        fee: this.pools[0].fee,
        amountIn: 16000,
        amountOutMinimum: ethers.constants.Zero,
        sqrtPriceLimitX96: ethers.constants.Zero,
        recipient: admin.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      solt0After = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      console.log(
        "         ->  pool_tick: [%d -> %d] position1: [-100, 100] position2: [-200, 200]",
        solt0Before.tick,
        solt0After.tick
      );
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(0);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(0);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(11000);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(22000);

      console.log("");
      console.log("       @11 left cross position2 tick upper and get pending reward ----------");
      solt0Before = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      await this.swapRouter.exactInputSingle({
        tokenIn: this.pools[0].token0,
        tokenOut: this.pools[0].token1,
        fee: this.pools[0].fee,
        amountIn: 16000,
        amountOutMinimum: ethers.constants.Zero,
        sqrtPriceLimitX96: ethers.constants.Zero,
        recipient: admin.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      solt0After = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      console.log(
        "         ->  pool_tick: [%d -> %d] position1: [-100, 100] position2: [-200, 200]",
        solt0Before.tick,
        solt0After.tick
      );
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(7328);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(14655);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(3672);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(7345);

      console.log("");
      console.log("       @12 add and stake position3 and get pending reward ----------");
      await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[0].token0,
        token1: this.pools[0].token1,
        fee: this.pools[0].fee,
        tickLower: 300,
        tickUpper: 600,
        amount0Desired: 20000,
        amount1Desired: 20000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 3);
      await time.increase(1);
      console.log("         ->  add position3: [300, 600]");
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      let beforeRewards3 = await this.masterChef.pendingRewards(3);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      let afterRewards3 = await this.masterChef.pendingRewards(3);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(7327);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(14655);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(3673);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(7345);
      expect(afterRewards3[0].sub(beforeRewards3[0])).to.equal(0);
      expect(afterRewards3[1].sub(beforeRewards3[1])).to.equal(0);

      console.log("");
      console.log("       @13 left cross position3 tick lower and get pending reward ----------");
      solt0Before = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      await this.swapRouter.exactInputSingle({
        tokenIn: this.pools[0].token1,
        tokenOut: this.pools[0].token0,
        fee: this.pools[0].fee,
        amountIn: 26000,
        amountOutMinimum: ethers.constants.Zero,
        sqrtPriceLimitX96: ethers.constants.Zero,
        recipient: admin.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      solt0After = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      console.log(
        "         ->  pool_tick: [%d -> %d] position1: [-100, 100] position2: [-200, 200] position3: [300, 600]",
        solt0Before.tick,
        solt0After.tick
      );
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      beforeRewards3 = await this.masterChef.pendingRewards(3);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      afterRewards3 = await this.masterChef.pendingRewards(3);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(0);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(0);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(0);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(0);
      expect(afterRewards3[0].sub(beforeRewards3[0])).to.equal(10999);
      expect(afterRewards3[1].sub(beforeRewards3[1])).to.equal(21999);

      console.log("");
      console.log("       @14 add and stake position4 and get pending reward ----------");
      await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[0].token0,
        token1: this.pools[0].token1,
        fee: this.pools[0].fee,
        tickLower: -800,
        tickUpper: 800,
        amount0Desired: 20000,
        amount1Desired: 20000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 4);
      await time.increase(1);
      console.log("         ->  add position4: [-800, 800]");
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      beforeRewards3 = await this.masterChef.pendingRewards(3);
      let beforeRewards4 = await this.masterChef.pendingRewards(4);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      afterRewards3 = await this.masterChef.pendingRewards(3);
      let afterRewards4 = await this.masterChef.pendingRewards(4);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(0);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(0);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(0);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(0);
      expect(afterRewards3[0].sub(beforeRewards3[0])).to.equal(8799);
      expect(afterRewards3[1].sub(beforeRewards3[1])).to.equal(17597);
      expect(afterRewards4[0].sub(beforeRewards4[0])).to.equal(2201);
      expect(afterRewards4[1].sub(beforeRewards4[1])).to.equal(4403);

      console.log("");
      console.log("       @15 add and stake position5 and get pending reward ----------");
      await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[0].token0,
        token1: this.pools[0].token1,
        fee: this.pools[0].fee,
        tickLower: 200,
        tickUpper: 300,
        amount0Desired: 20000,
        amount1Desired: 20000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 5);
      await time.increase(1);
      console.log("         ->  add position5: [200, 300]");
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      beforeRewards3 = await this.masterChef.pendingRewards(3);
      beforeRewards4 = await this.masterChef.pendingRewards(4);
      let beforeRewards5 = await this.masterChef.pendingRewards(5);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      afterRewards3 = await this.masterChef.pendingRewards(3);
      afterRewards4 = await this.masterChef.pendingRewards(4);
      let afterRewards5 = await this.masterChef.pendingRewards(5);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(0);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(0);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(0);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(0);
      expect(afterRewards3[0].sub(beforeRewards3[0])).to.equal(8798);
      expect(afterRewards3[1].sub(beforeRewards3[1])).to.equal(17596);
      expect(afterRewards4[0].sub(beforeRewards4[0])).to.equal(2202);
      expect(afterRewards4[1].sub(beforeRewards4[1])).to.equal(4404);
      expect(afterRewards5[0].sub(beforeRewards5[0])).to.equal(0);
      expect(afterRewards5[1].sub(beforeRewards5[1])).to.equal(0);

      console.log("");
      console.log("       @16 left cross position5 tick upper and get pending reward ----------");
      solt0Before = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      await this.swapRouter.exactInputSingle({
        tokenIn: this.pools[0].token0,
        tokenOut: this.pools[0].token1,
        fee: this.pools[0].fee,
        amountIn: 20000,
        amountOutMinimum: ethers.constants.Zero,
        sqrtPriceLimitX96: ethers.constants.Zero,
        recipient: admin.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      solt0After = await this.V3Pool.attach(this.poolAddresses[0]).slot0();
      console.log(
        "         ->  pool_tick: [%d -> %d] position1: [-100, 100] position2: [-200, 200] position3: [300, 600] position4: [-800, 800] position5: [200, 300]",
        solt0Before.tick,
        solt0After.tick
      );
      beforeRewards1 = await this.masterChef.pendingRewards(1);
      beforeRewards2 = await this.masterChef.pendingRewards(2);
      beforeRewards3 = await this.masterChef.pendingRewards(3);
      beforeRewards4 = await this.masterChef.pendingRewards(4);
      beforeRewards5 = await this.masterChef.pendingRewards(5);
      await time.increase(10);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      afterRewards1 = await this.masterChef.pendingRewards(1);
      afterRewards2 = await this.masterChef.pendingRewards(2);
      afterRewards3 = await this.masterChef.pendingRewards(3);
      afterRewards4 = await this.masterChef.pendingRewards(4);
      afterRewards5 = await this.masterChef.pendingRewards(5);
      expect(afterRewards1[0].sub(beforeRewards1[0])).to.equal(0);
      expect(afterRewards1[1].sub(beforeRewards1[1])).to.equal(0);
      expect(afterRewards2[0].sub(beforeRewards2[0])).to.equal(0);
      expect(afterRewards2[1].sub(beforeRewards2[1])).to.equal(0);
      expect(afterRewards3[0].sub(beforeRewards3[0])).to.equal(0);
      expect(afterRewards3[1].sub(beforeRewards3[1])).to.equal(0);
      expect(afterRewards4[0].sub(beforeRewards4[0])).to.equal(875);
      expect(afterRewards4[1].sub(beforeRewards4[1])).to.equal(1750);
      expect(afterRewards5[0].sub(beforeRewards5[0])).to.equal(10125);
      expect(afterRewards5[1].sub(beforeRewards5[1])).to.equal(20250);
      // console.log(
      //   "position1 ",
      //   afterRewards1[0].sub(beforeRewards1[0]).toString(),
      //   afterRewards1[1].sub(beforeRewards1[1]).toString()
      // );
      // console.log(
      //   "position2 ",
      //   afterRewards2[0].sub(beforeRewards2[0]).toString(),
      //   afterRewards2[1].sub(beforeRewards2[1]).toString()
      // );
      // console.log(
      //   "position3 ",
      //   afterRewards3[0].sub(beforeRewards3[0]).toString(),
      //   afterRewards3[1].sub(beforeRewards3[1]).toString()
      // );
      // console.log(
      //   "position4 ",
      //   afterRewards4[0].sub(beforeRewards4[0]).toString(),
      //   afterRewards4[1].sub(beforeRewards4[1]).toString()
      // );
      // console.log(
      //   "position5 ",
      //   afterRewards5[0].sub(beforeRewards5[0]).toString(),
      //   afterRewards5[1].sub(beforeRewards5[1]).toString()
      // );
      //
      console.log("");
      console.log("       @17 Emergency withdraw ----------------------------------------------------");
      const beforeKrmBalance = await this.krm.balanceOf(alice.address);
      const vaultKrmBalance = await this.krm.balanceOf(this.vault.address);
      let tx = await this.vault.connect(admin).emergencyWithdraw(this.krm.address, alice.address);
      time.increase(1);
      let resp = await tx.wait();
      expect(resp.status).to.equal(1);
      const afterKrmBalance = await this.krm.balanceOf(alice.address);
      expect(afterKrmBalance.sub(beforeKrmBalance)).to.equal(vaultKrmBalance);

      console.log("");
      console.log("       @18 Emergency withdraw ETH ------------------------------------------------");
      await alice.sendTransaction({ to: this.vault.address, value: ethers.utils.parseEther("1") });
      await time.increase(1);
      const beforeEthBalance = await ethers.provider.getBalance(alice.address);
      tx = await this.vault.connect(admin).emergencyWithdrawETH(alice.address);
      await time.increase(1);
      resp = await tx.wait();
      expect(resp.status).to.equal(1);
      const afterEthBalance = await ethers.provider.getBalance(alice.address);
      expect(afterEthBalance.sub(beforeEthBalance)).to.equal(ethers.utils.parseEther("1"));
    });
  });

  describe("Test MasterChef with WVIC pool and VIC reward", function () {
    it("use WIVC pool and VIC reward", async function () {
      await time.increase(1);
      let tx = await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[2].token0,
        token1: this.pools[2].token1,
        fee: this.pools[0].fee,
        tickLower: -100,
        tickUpper: 100,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      let resp = await tx.wait();
      expect(resp.status).to.equal(1);

      // Add rewarder, 1000 KRM(decimal) per second
      console.log("");
      console.log("       @1 add rewarder ---------------------------------------------------");
      await time.increase(1);
      await this.masterChef.addPool(this.poolAddresses[2], this.krm.address, 1000 * 1e12, 86400);
      await time.increase(1);
      const pid = await this.masterChef.v3PoolAddressPid(this.poolAddresses[2]);
      await this.masterChef.addRewarder(pid, this.wvic.address, 1000 * 1e12, 86400);
      await time.increase(1);

      // Deposit reward
      console.log("");
      console.log("       @2 deposit reward -------------------------------------------------");
      await this.krm.transfer(this.vault.address, 10000000000);
      await time.increase(1);
      expect(await this.krm.balanceOf(this.vault.address)).to.equal(10000000000);
      console.log("         -> deposit VIC");
      await admin.sendTransaction({ to: this.vault.address, value: 100000000000 });
      console.log("         -> deposit VIC Done");

      // Stake position
      console.log("");
      console.log("       @3 stake position -------------------------------------------------");
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 1);
      await time.increase(1);
      let position = await this.masterChef.userPositionInfos(1);
      expect(position.user.toString()).to.equal(alice.address);

      // Increase liquidity
      console.log("");
      console.log("       @4 increase liquidity ---------------------------------------------");
      let poolInfo = await this.masterChef.poolInfo(1);
      await time.increase(1);
      await this.masterChef.connect(alice).increaseLiquidity({
        tokenId: 1,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      poolInfo = await this.masterChef.poolInfo(1);
      position = await this.masterChef.userPositionInfos(1);
      expect(poolInfo.totalLiquidity.toString()).to.equal("4010208");
      expect(position.liquidity.toString()).to.equal("4010208");

      // Decrease liquidity
      console.log("");
      console.log("       @5 decrease liquidity ---------------------------------------------");
      poolInfo = await this.masterChef.poolInfo(1);
      await this.masterChef.connect(alice).decreaseLiquidity({
        tokenId: 1,
        liquidity: poolInfo.totalLiquidity.div(2),
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);

      // Collect
      console.log("");
      console.log("       @6 collect --------------------------------------------------------");
      // collect to alice
      let beforeBalance0 = await this.usdc.balanceOf(bob.address);
      let beforeBalance1 = await ethers.provider.getBalance(bob.address);
      await this.masterChef.connect(alice).collect({
        tokenId: 1,
        recipient: bob.address,
        amount0Max: "5000",
        amount1Max: "5000",
      });
      await time.increase(1);
      let afterBalance0 = await this.usdc.balanceOf(bob.address);
      let afterBalance1 = await ethers.provider.getBalance(bob.address);
      expect(afterBalance0.sub(beforeBalance0).toString()).to.equal("5000");
      expect(afterBalance1.sub(beforeBalance1).toString()).to.equal("5000");

      // Havrest
      console.log("");
      console.log("       @8 harvest --------------------------------------------------------");
      await time.increase(3);
      await this.masterChef.updatePools([1]);
      await time.increase(1);
      let beforeReward0Balance = await this.krm.balanceOf(alice.address);
      let beforeReward1Balance = await ethers.provider.getBalance(alice.address);
      let reward0 = (await this.masterChef.pendingRewards(1))[0];
      let reward1 = (await this.masterChef.pendingRewards(1))[0];
      console.log(`         rewards: ${reward0} ${reward1}`);

      tx = await this.masterChef.connect(alice).harvest(1, alice.address);
      await time.increase(1);
      resp = await tx.wait();
      let afterReward0Balance = await this.krm.balanceOf(alice.address);
      let afterReward1Balance = await ethers.provider.getBalance(alice.address);
      let gas = resp.gasUsed.mul(resp.effectiveGasPrice);
      let harvested0 = afterReward0Balance.sub(beforeReward0Balance);
      let harvested1 = afterReward1Balance.sub(beforeReward1Balance).add(gas);
      expect(harvested0.toString()).to.equal("8997");
      expect(harvested1.toString()).to.equal("8997");
    });
  });

  describe("Test MasterChef with multicall", function () {
    it("use WIVC pool and VIC reward", async function () {
      await time.increase(1);
      let tx = await this.nonfungiblePositionManager.connect(alice).mint({
        token0: this.pools[2].token0,
        token1: this.pools[2].token1,
        fee: this.pools[0].fee,
        tickLower: -100,
        tickUpper: 100,
        amount0Desired: 10000,
        amount1Desired: 10000,
        amount0Min: ethers.constants.Zero,
        amount1Min: ethers.constants.Zero,
        recipient: alice.address,
        deadline: (await time.latest()) + 1,
      });
      await time.increase(1);
      let resp = await tx.wait();
      expect(resp.status).to.equal(1);

      // Add rewarder, 1000 KRM(decimal) per second
      console.log("");
      console.log("       @1 add rewarder ---------------------------------------------------");
      await time.increase(1);
      await this.masterChef.addPool(this.poolAddresses[2], this.krm.address, 1000 * 1e12, 86400);
      await time.increase(1);
      await this.masterChef.addPool(this.poolAddresses[2], this.wvic.address, 1000 * 1e12, 86400);
      await time.increase(1);

      // Deposit reward
      console.log("");
      console.log("       @2 deposit reward -------------------------------------------------");
      await this.krm.transfer(this.vault.address, 10000000000);
      await time.increase(1);
      expect(await this.krm.balanceOf(this.vault.address)).to.equal(10000000000);

      // Stake position
      console.log("");
      console.log("       @3 stake position -------------------------------------------------");
      await this.nonfungiblePositionManager
        .connect(alice)
      ["safeTransferFrom(address,address,uint256)"](alice.address, this.masterChef.address, 1);
      await time.increase(1);
      let position = await this.masterChef.userPositionInfos(1);
      expect(position.user.toString()).to.equal(alice.address);
      let poolInfo = await this.masterChef.poolInfo(1);
      // If one of token is WVIC, can't use multicall to call increaseLiquidity and other function together.
      // const increaseLiquidityData = this.masterChef.interface.encodeFunctionData("increaseLiquidity", [
      //   {
      //     tokenId: 1,
      //     amount0Desired: 10000,
      //     amount1Desired: 10000,
      //     amount0Min: ethers.constants.Zero,
      //     amount1Min: ethers.constants.Zero,
      //     deadline: (await time.latest()) + 10,
      //   },
      // ]);
      const collectData = this.masterChef.interface.encodeFunctionData("collect", [
        {
          tokenId: 1,
          recipient: alice.address,
          amount0Max: "5000",
          amount1Max: "5000",
        },
      ]);
      const decreaseLiquidityData = this.masterChef.interface.encodeFunctionData("decreaseLiquidity", [
        {
          tokenId: 1,
          liquidity: poolInfo.totalLiquidity.div(2),
          amount0Min: ethers.constants.Zero,
          amount1Min: ethers.constants.Zero,
          deadline: (await time.latest()) + 1,
        },
      ]);
      const harvestData = this.masterChef.interface.encodeFunctionData("harvest", [1, alice.address]);

      const value = 0;
      tx = await this.masterChef.connect(alice).multicall([decreaseLiquidityData, collectData, harvestData], { value });
      await time.increase(1);
      resp = await tx.wait();
      expect(resp.status).to.equal(1);
    });
  });
});
