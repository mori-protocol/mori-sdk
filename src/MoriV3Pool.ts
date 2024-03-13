import { type PublicClient, getContract, type Address } from 'viem'
import { type BigintIsh } from './constants'
import { parseProtocolFees } from './utils/utils'
import { Percent } from './fractions/percent'
import { moriV3PoolABI } from './abi/MoriV3PoolABI'

export type Slot = {
  sqrtPriceX96: BigintIsh
  tick: number
  token0ProtocolFee: Percent
  token1ProtocolFee: Percent
}

export type Pool = {
  fee: BigintIsh
  tickSpacing: number,
  liquidity: BigintIsh
  token0: Address
  token1: Address
  slot: Slot
}

export class MoriV3Pool {
  public static ABI = moriV3PoolABI
  public readonly publicClient: PublicClient
  public readonly poolAddress: Address

  public pool?: Pool

  public constructor(publicClient: PublicClient, poolAddress: Address) {
    this.poolAddress = poolAddress
    this.publicClient = publicClient
  }

  private buildContractClinet() {
    return getContract({
      address: this.poolAddress,
      abi: MoriV3Pool.ABI,
      client: this.publicClient,
    })
  }

  public async getSlot0(): Promise<Slot> {
    const [sqrtPriceX96, tick, , , , feeProtocol] = await this.buildContractClinet().read.slot0()
    const [token0ProtocolFee, token1ProtocolFee] = parseProtocolFees(feeProtocol)
    return {
      sqrtPriceX96,
      tick,
      token0ProtocolFee,
      token1ProtocolFee,
    }
  }

  public async getLiquidity(): Promise<BigintIsh> {
    const liquidity = await this.buildContractClinet().read.liquidity()
    return liquidity
  }

  public async buildPool(): Promise<Pool> {
    const contract = this.buildContractClinet()

    const [token0, token1, fee, tickSpacing, liquidity, slot] = await Promise.all([
      contract.read.token0(),
      contract.read.token1(),
      contract.read.fee(),
      contract.read.tickSpacing(),
      this.getLiquidity(),
      this.getSlot0()
    ])
    return {
      token0,
      token1,
      fee,
      tickSpacing,
      liquidity,
      slot,
    }
  }

}
