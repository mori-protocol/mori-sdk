import { ethers, upgrades } from 'hardhat'

import NftDescriptorOffchainArtifact from '../artifacts/contracts/NonfungibleTokenPositionDescriptorOffChain.sol/NonfungibleTokenPositionDescriptorOffChain.json'

async function main() {
  const [owner] = await ethers.getSigners()
  console.log('owner', owner.address)

  const network = await ethers.provider.getNetwork()

  const NonfungibleTokenPositionDescriptor = await ethers.getContractFactoryFromArtifact(NftDescriptorOffchainArtifact)
  const baseTokenUri = `https://nft.moriprotocol.io/v3/${network.chainId}/`
  console.log(baseTokenUri)
  const nonfungibleTokenPositionDescriptor = await upgrades.upgradeProxy(
    process.env.NFT_DESC_OFFCHAIN_ADDRESS!,
    NonfungibleTokenPositionDescriptor,
    {
      call: {
        fn: 'initialize',
        args: [baseTokenUri],
      },
    }
  )
  console.log('NonfungibleTokenPositionDescriptor upgraded at', nonfungibleTokenPositionDescriptor.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
