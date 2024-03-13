import { Contract, ContractFactory } from 'ethers'
import { ethers, network } from 'hardhat'
import fs from 'fs'
import { sleep } from '@moriswap/common/sleep'

type ContractJson = { abi: any; bytecode: string }
const artifacts: { [name: string]: ContractJson } = {
  MoriV3PoolDeployer: require('../artifacts/contracts/MoriV3PoolDeployer.sol/MoriV3PoolDeployer.json'),
  MoriV3Factory: require('../artifacts/contracts/MoriV3Factory.sol/MoriV3Factory.json'),
}

async function main() {
  const [owner] = await ethers.getSigners()
  const networkName = network.name
  // console.log(`Owner :${owner.address} Deploying to ${networkName} network`)

  let moriV3PoolDeployer_address = ''
  let moriV3PoolDeployer: Contract
  const MoriV3PoolDeployer = new ContractFactory(
    artifacts.MoriV3PoolDeployer.abi,
    artifacts.MoriV3PoolDeployer.bytecode,
    owner
  )
  console.log('Deploying MoriV3PoolDeployer...')
  if (!moriV3PoolDeployer_address) {
    moriV3PoolDeployer = await MoriV3PoolDeployer.deploy()

    moriV3PoolDeployer_address = moriV3PoolDeployer.address
    console.log('moriV3PoolDeployer deployed at:', moriV3PoolDeployer_address)
    await sleep(10000)
  } else {
    moriV3PoolDeployer = new ethers.Contract(moriV3PoolDeployer_address, artifacts.MoriV3PoolDeployer.abi, owner)
  }

  let moriV3Factory_address = ''
  let moriV3Factory: Contract
  if (!moriV3Factory_address) {
    const MoriV3Factory = new ContractFactory(artifacts.MoriV3Factory.abi, artifacts.MoriV3Factory.bytecode, owner)
    moriV3Factory = await MoriV3Factory.deploy(moriV3PoolDeployer_address)

    moriV3Factory_address = moriV3Factory.address
    console.log('moriV3Factory deployed at:', moriV3Factory_address)
    await sleep(10000)
  } else {
    moriV3Factory = new ethers.Contract(moriV3Factory_address, artifacts.MoriV3Factory.abi, owner)
  }

  // Set FactoryAddress for moriV3PoolDeployer.
  await moriV3PoolDeployer.setFactoryAddress(moriV3Factory_address)
  console.log('moriV3PoolDeployer.setFactoryAddress done')

  const contracts = {
    MoriV3Factory: moriV3Factory_address,
    MoriV3PoolDeployer: moriV3PoolDeployer_address,
  }

  fs.writeFileSync(`./deployments/${networkName}.json`, JSON.stringify(contracts, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
