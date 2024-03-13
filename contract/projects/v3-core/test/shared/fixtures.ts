import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { MockTimeMoriV3Pool } from '../../typechain-types/contracts/test/MockTimeMoriV3Pool'
import { TestERC20 } from '../../typechain-types/contracts/test/TestERC20'
import { MoriV3Factory } from '../../typechain-types/contracts/MoriV3Factory'
import { MoriV3PoolDeployer } from '../../typechain-types/contracts/MoriV3PoolDeployer'
import { TestMoriV3Callee } from '../../typechain-types/contracts/test/TestMoriV3Callee'
import { TestMoriV3Router } from '../../typechain-types/contracts/test/TestMoriV3Router'
import { MockTimeMoriV3PoolDeployer } from '../../typechain-types/contracts/test/MockTimeMoriV3PoolDeployer'
import MoriV3LmPoolArtifact from '@moriswap/v3-lm-pool/artifacts/contracts/MoriV3LmPool.sol/MoriV3LmPool.json'

import { Fixture } from 'ethereum-waffle'

interface FactoryFixture {
  factory: MoriV3Factory
}

interface DeployerFixture {
  deployer: MoriV3PoolDeployer
}

async function factoryFixture(): Promise<FactoryFixture> {
  const { deployer } = await deployerFixture()
  const factoryFactory = await ethers.getContractFactory('MoriV3Factory')
  const factory = (await factoryFactory.deploy(deployer.address)) as MoriV3Factory
  return { factory }
}
async function deployerFixture(): Promise<DeployerFixture> {
  const deployerFactory = await ethers.getContractFactory('MoriV3PoolDeployer')
  const deployer = (await deployerFactory.deploy()) as MoriV3PoolDeployer
  return { deployer }
}

interface TokensFixture {
  token0: TestERC20
  token1: TestERC20
  token2: TestERC20
}

async function tokensFixture(): Promise<TokensFixture> {
  const tokenFactory = await ethers.getContractFactory('TestERC20')
  const tokenA = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenB = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenC = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20

  const [token0, token1, token2] = [tokenA, tokenB, tokenC].sort((tokenA, tokenB) =>
    tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? -1 : 1
  )

  return { token0, token1, token2 }
}

type TokensAndFactoryFixture = FactoryFixture & TokensFixture

interface PoolFixture extends TokensAndFactoryFixture {
  swapTargetCallee: TestMoriV3Callee
  swapTargetRouter: TestMoriV3Router
  createPool(
    fee: number,
    tickSpacing: number,
    firstToken?: TestERC20,
    secondToken?: TestERC20
  ): Promise<MockTimeMoriV3Pool>
}

// Monday, October 5, 2020 9:00:00 AM GMT-05:00
export const TEST_POOL_START_TIME = 1601906400

export const poolFixture: Fixture<PoolFixture> = async function (): Promise<PoolFixture> {
  const { factory } = await factoryFixture()
  const { token0, token1, token2 } = await tokensFixture()

  const MockTimeMoriV3PoolDeployerFactory = await ethers.getContractFactory('MockTimeMoriV3PoolDeployer')
  const MockTimeMoriV3PoolFactory = await ethers.getContractFactory('MockTimeMoriV3Pool')

  const calleeContractFactory = await ethers.getContractFactory('TestMoriV3Callee')
  const routerContractFactory = await ethers.getContractFactory('TestMoriV3Router')

  const swapTargetCallee = (await calleeContractFactory.deploy()) as TestMoriV3Callee
  const swapTargetRouter = (await routerContractFactory.deploy()) as TestMoriV3Router

  const MoriV3LmPoolFactory = await ethers.getContractFactoryFromArtifact(MoriV3LmPoolArtifact)

  return {
    token0,
    token1,
    token2,
    factory,
    swapTargetCallee,
    swapTargetRouter,
    createPool: async (fee, tickSpacing, firstToken = token0, secondToken = token1) => {
      const mockTimePoolDeployer =
        (await MockTimeMoriV3PoolDeployerFactory.deploy()) as MockTimeMoriV3PoolDeployer
      const tx = await mockTimePoolDeployer.deploy(
        factory.address,
        firstToken.address,
        secondToken.address,
        fee,
        tickSpacing
      )

      const receipt = await tx.wait()
      const poolAddress = receipt.events?.[0].args?.pool as string

      const mockTimeMoriV3Pool = MockTimeMoriV3PoolFactory.attach(poolAddress) as MockTimeMoriV3Pool

      await (
        await factory.setLmPool(
          poolAddress,
          (
            await MoriV3LmPoolFactory.deploy(
              poolAddress,
              ethers.constants.AddressZero,
              Math.floor(Date.now() / 1000)
            )
          ).address
        )
      ).wait()

      return mockTimeMoriV3Pool
    },
  }
}
