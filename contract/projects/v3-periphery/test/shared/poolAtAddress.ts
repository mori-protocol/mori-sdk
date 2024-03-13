import { abi as POOL_ABI } from '@moriswap/v3-core/artifacts/contracts/MoriV3Pool.sol/MoriV3Pool.json'
import { Contract, Wallet } from 'ethers'
import { IMoriV3Pool } from '../../typechain-types'

export default function poolAtAddress(address: string, wallet: Wallet): IMoriV3Pool {
  return new Contract(address, POOL_ABI, wallet) as IMoriV3Pool
}
