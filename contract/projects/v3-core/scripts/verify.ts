import { verifyContract } from '@moriswap/common/verify'
import { sleep } from '@moriswap/common/sleep'
import { network } from 'hardhat'

async function main() {
  const networkName = network.name
  const deployedContracts = await import(`@moriswap/v3-core/deployments/${networkName}.json`)

  // Verify MoriV3PoolDeployer
  console.log('Verify MoriV3PoolDeployer at: ', deployedContracts.MoriV3PoolDeployer)
  await verifyContract(deployedContracts.MoriV3PoolDeployer)
  await sleep(10000)

  // Verify pancakeV3Factory
  console.log('Verify MoriV3Factory at: ', deployedContracts.MoriV3Factory)
  await verifyContract(deployedContracts.MoriV3Factory, [deployedContracts.MoriV3PoolDeployer])
  await sleep(10000)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
