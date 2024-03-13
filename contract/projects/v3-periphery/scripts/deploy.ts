import bn from 'bignumber.js'
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'
import { ethers, upgrades, network } from 'hardhat'
import { linkLibraries } from '../util/linkLibraries'
import { configs } from '@moriswap/common/config'
import fs from 'fs'
import { sleep } from '@moriswap/common/sleep'

type ContractJson = { abi: any; bytecode: string }
const artifacts: { [name: string]: ContractJson } = {
  Quoter: require('../artifacts/contracts/lens/Quoter.sol/Quoter.json'),
  TickLens: require('../artifacts/contracts/lens/TickLens.sol/TickLens.json'),
  MoriInterfaceMulticall: require('../artifacts/contracts/lens/MoriInterfaceMulticall.sol/MoriInterfaceMulticall.json'),
  // eslint-disable-next-line global-require
  SwapRouter: require('../artifacts/contracts/SwapRouter.sol/SwapRouter.json'),
  // eslint-disable-next-line global-require
  NFTDescriptor: require('../artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'),
  // eslint-disable-next-line global-require
  NFTDescriptorEx: require('../artifacts/contracts/NFTDescriptorEx.sol/NFTDescriptorEx.json'),
  // eslint-disable-next-line global-require
  NonfungibleTokenPositionDescriptor: require('../artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'),
  // eslint-disable-next-line global-require
  NonfungibleTokenPositionDescriptorOffChain: require('../artifacts/contracts/NonfungibleTokenPositionDescriptorOffChain.sol/NonfungibleTokenPositionDescriptorOffChain.json'),
  // eslint-disable-next-line global-require
  NonfungiblePositionManager: require('../artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'),
}

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })
function encodePriceSqrt(reserve1: any, reserve0: any) {
  return BigNumber.from(
    // eslint-disable-next-line new-cap
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      // eslint-disable-next-line new-cap
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  )
}

function isAscii(str: string): boolean {
  return /^[\x00-\x7F]*$/.test(str)
}
function asciiStringToBytes32(str: string): string {
  if (str.length > 32 || !isAscii(str)) {
    throw new Error('Invalid label, must be less than 32 characters')
  }

  return '0x' + Buffer.from(str, 'ascii').toString('hex').padEnd(64, '0')
}

async function main() {
  const [owner] = await ethers.getSigners()
  const networkName = network.name
  console.log('owner', owner.address)

  const config = configs[networkName as keyof typeof configs]
  if (!config) {
    throw new Error(`No config found for network ${networkName}`)
  }

  const deployedContracts = await import(`@moriswap/v3-core/deployments/${networkName}.json`)
  const moriV3PoolDeployer_address = deployedContracts.MoriV3PoolDeployer
  const moriV3Factory_address = deployedContracts.MoriV3Factory

  console.log('WNATIVE:', config.WNATIVE)

  // SwapRouter
  const SwapRouter = new ContractFactory(artifacts.SwapRouter.abi, artifacts.SwapRouter.bytecode, owner)
  const swapRouter = await SwapRouter.deploy(moriV3PoolDeployer_address, moriV3Factory_address, config.WNATIVE)
  console.log('SwapRouter deployed at:', swapRouter.address)
  await sleep(10000)

  // NonfungibleTokenPositionDescriptor
  const NonfungibleTokenPositionDescriptor = new ContractFactory(
    artifacts.NonfungibleTokenPositionDescriptorOffChain.abi,
    artifacts.NonfungibleTokenPositionDescriptorOffChain.bytecode,
    owner
  )
  const baseTokenUri = 'https://nft.moriprotocol.io/v3/'
  const nonfungibleTokenPositionDescriptor = await upgrades.deployProxy(NonfungibleTokenPositionDescriptor, [
    baseTokenUri,
  ])
  await sleep(10000)
  await nonfungibleTokenPositionDescriptor.deployed()
  console.log('NonfungibleTokenPositionDescriptor deployed at:', nonfungibleTokenPositionDescriptor.address)
  await sleep(10000)

  // NonfungiblePositionManager
  const NonfungiblePositionManager = new ContractFactory(
    artifacts.NonfungiblePositionManager.abi,
    artifacts.NonfungiblePositionManager.bytecode,
    owner
  )
  await sleep(10000)
  const nonfungiblePositionManager = await NonfungiblePositionManager.deploy(
    moriV3PoolDeployer_address,
    moriV3Factory_address,
    config.WNATIVE,
    nonfungibleTokenPositionDescriptor.address
  )
  console.log('NonfungiblePositionManager deployed at:', nonfungiblePositionManager.address)
  await sleep(10000)

  // MoriInterfaceMulticall
  const MoriInterfaceMulticall = new ContractFactory(
    artifacts.MoriInterfaceMulticall.abi,
    artifacts.MoriInterfaceMulticall.bytecode,
    owner
  )

  const moriInterfaceMulticall = await MoriInterfaceMulticall.deploy()
  console.log('MoriInterfaceMulticall deployted at:', moriInterfaceMulticall.address)
  await sleep(10000)

  // TickLens
  const TickLens = new ContractFactory(artifacts.TickLens.abi, artifacts.TickLens.bytecode, owner)
  const tickLens = await TickLens.deploy()
  console.log('TickLens deployed at:', tickLens.address)
  await sleep(10000)

  // Quoter
  const Quoter = new ContractFactory(artifacts.Quoter.abi, artifacts.Quoter.bytecode, owner)
  const quoter = await Quoter.deploy(moriV3PoolDeployer_address, moriV3Factory_address, config.WNATIVE)
  console.log('Quoter deployed at:', quoter.address)
  await sleep(5000)

  const contracts = {
    SwapRouter: swapRouter.address,
    Quoter: quoter.address,
    TickLens: tickLens.address,
    // NFTDescriptor: nftDescriptor.address,
    // NFTDescriptorEx: nftDescriptorEx.address,
    NonfungibleTokenPositionDescriptor: nonfungibleTokenPositionDescriptor.address,
    NonfungiblePositionManager: nonfungiblePositionManager.address,
    MoriInterfaceMulticall: moriInterfaceMulticall.address,
  }

  fs.writeFileSync(`./deployments/${networkName}.json`, JSON.stringify(contracts, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
