import { ethers } from 'hardhat'
import MoriV3PoolArtifact from '../artifacts/contracts/MoriV3Pool.sol/MoriV3Pool.json'

const hash = ethers.utils.keccak256(MoriV3PoolArtifact.bytecode)
console.log(hash)
