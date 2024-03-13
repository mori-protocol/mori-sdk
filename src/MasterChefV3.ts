import { validateAndParseAddress } from './utils/utils'
import { type Hex, type PublicClient, encodeFunctionData, getContract, toHex, type Address } from 'viem'
import { Multicall } from './Multicall'

import { NonfungiblePositionManager } from './NonfungiblePositionManager'
import Decimal from 'decimal.js-light'
import { MAX_UINT128, type BigintIsh, type FarmAddCallOptions, type FarmRemoveCallOptions, type MethodParameters, type CollectOptions, type WidthDrawOptions, type HarvestOptions } from './constants'
import { MasterChefV3ABI } from './abi/MasterChefV3ABI'

export const PRECISION_FACTOR = '1000000000000' // 1e12
export type ChefV3Position = {
  liquidity: BigintIsh
  boostLiquidity: BigintIsh
  tickLower: number
  tickUpper: number
  rewardGrowthInside: BigintIsh
  reward: BigintIsh
  user: Address
  pid: bigint
  tokenId: bigint
  boostMultiplier: BigintIsh
  poolAddress: string
  fee_amount0: bigint
  fee_amount1: bigint
}

export type MasterChef = {
  latestPeriodNumber: bigint
  latestPeriodStartTime: bigint,
  latestPeriodEndTime: bigint
  latestPeriodRewardPerSecond: bigint
  totalAllocPoint: bigint
  rewaedCoin: string
  poolLength: bigint
}

export type MasterPool = {
  allocPoint: bigint
  v3Pool: string,
  token0: string
  token1: string
  fee: number
  totalLiquidity: bigint
  totalBoostLiquidity: bigint
}


export class MasterChefV3 {
  public static ABI = MasterChefV3ABI
  public readonly publicClient: PublicClient
  public readonly contractAddress: Address
  public masterChefData?: MasterChef
  private pidsMap: Record<string, bigint> = {}

  public constructor(publicClient: PublicClient, contractAddress: Address) {
    this.publicClient = publicClient
    this.contractAddress = contractAddress
  }

  private buildContractClinet() {
    return getContract({
      address: this.contractAddress,
      abi: MasterChefV3.ABI,
      client: this.publicClient,
    })
  }

  public async buildMasterChefData(): Promise<MasterChef> {
    const contract = this.buildContractClinet()
    const requests = await Promise.all([
      contract.read.latestPeriodNumber(),
      contract.read.latestPeriodStartTime(),
      contract.read.latestPeriodEndTime(),
      contract.read.latestPeriodRewardPerSecond(),
      contract.read.totalAllocPoint(),
      contract.read.REWARD(),
      contract.read.poolLength()
    ])

    const data: MasterChef = {
      latestPeriodNumber: requests[0],
      latestPeriodStartTime: requests[1],
      latestPeriodEndTime: requests[2],
      latestPeriodRewardPerSecond: requests[3],
      totalAllocPoint: requests[4],
      rewaedCoin: requests[5],
      poolLength: requests[6]
    }

    this.masterChefData = data
    return data
  }

  /**
   * Build MasterChef pool data
   * @param pid The pool id
   * @returns 
   */
  public async buildMasterPoolData(pid: bigint): Promise<MasterPool> {
    const contract = this.buildContractClinet()
    const [allocPoint, v3Pool, token0, token1, fee, totalLiquidity, totalBoostLiquidity] = await contract.read.poolInfo([pid])

    const data: MasterPool = {
      allocPoint,
      v3Pool,
      token0,
      token1,
      fee,
      totalLiquidity,
      totalBoostLiquidity
    }

    return data
  }

  /**
   * Return MasterChef pool list
   * @returns 
   */
  public async buildMasterPoolList(): Promise<MasterPool[]> {
    const contract = this.buildContractClinet()
    const poolLength = await contract.read.poolLength()
    const requestMap: any[] = []
    for (let i: bigint = 1n; i <= poolLength; i++) {
      requestMap.push(this.buildMasterPoolData(i))
    }

    const responsList = await Promise.all(requestMap)
    return responsList.map((item) => {
      const data: MasterPool = {
        ...item
      }
      return data
    })
  }

  /**
   * Get the number of tokens owned by the owner
   * @param owner 
   * @returns 
   */
  public async getOwnerTokenIds(owner: Address): Promise<bigint[]> {
    const contract = this.buildContractClinet()

    const tokenCount = await contract.read.balanceOf([owner])
    const requests = []
    for (let i = 0; i < tokenCount; i++) {
      requests.push(contract.read.tokenOfOwnerByIndex([owner, BigInt(i)]))
    }
    const ids = await Promise.all(requests)
    return ids
  }

  /**
   * Get the position information of the owner
   * @param owner 
   * @param tokenIds 
   * @returns 
   */
  public async getOwnerPositions(owner: Address, tokenIds: bigint[] = []): Promise<ChefV3Position[]> {
    if (tokenIds.length === 0) {
      tokenIds = await this.getOwnerTokenIds(owner)
    }

    const requests = []
    for (let i = 0; i < tokenIds.length; i++) {
      requests.push(this.getPosition(tokenIds[i]))
    }
    const positions = await Promise.all(requests)

    const feesMap = await this.calculatePositionFee(tokenIds, owner)
    const rewardMap = await this.calculateFarmingReward(tokenIds, owner)

    positions.forEach((item) => {
      const fees = feesMap[item.tokenId.toString()]
      if (fees) {
        item.fee_amount0 = fees.amount0
        item.fee_amount1 = fees.amount1
      }

      const reward = rewardMap[item.tokenId.toString()]
      if (reward) {
        item.reward = reward
      }
    })

    return positions
  }

  /**
   * Get the position information of the owner
   * @param tokenId 
   * @returns 
   */
  public async getPosition(tokenId: bigint): Promise<ChefV3Position> {
    const contract = this.buildContractClinet()

    const res = await contract.read.userPositionInfos([tokenId])

    const [liquidity, boostLiquidity, tickLower, tickUpper, rewardGrowthInside, reward, user, pid, boostMultiplier] =
      res
    const position: ChefV3Position = {
      tokenId,
      liquidity,
      boostLiquidity,
      rewardGrowthInside,
      tickLower,
      tickUpper,
      reward,
      user,
      pid,
      boostMultiplier: new Decimal(boostMultiplier.toString()).div(PRECISION_FACTOR).toString(),
      poolAddress: '',
      fee_amount0: 0n,
      fee_amount1: 0n,
    }
    return position
  }

  /**
   * Get the position information of the owner
   * @param owner 
   * @param pid 
   * @param calculateFarmingReward 
   * @returns 
   */
  public async getOwnerPositionsByPid(owner: Address, pid: bigint, calculateFarmingReward = true): Promise<ChefV3Position[]> {
    const tokenIds = await this.getOwnerTokenIds(owner)

    const requests = []
    for (let i = 0; i < tokenIds.length; i++) {
      requests.push(this.getPosition(tokenIds[i]))
    }
    const positions = (await Promise.all(requests)).filter((pos) => pos.pid === pid)

    const feesMap = await this.calculatePositionFee(tokenIds, owner)

    if (calculateFarmingReward) {
      const rewardMap = await this.calculateFarmingReward(tokenIds, owner)
      positions.forEach((item) => {
        const reward = rewardMap[item.tokenId.toString()]
        if (reward) {
          item.reward = reward
        }
      })
    }

    positions.forEach((item) => {
      const fees = feesMap[item.tokenId.toString()]
      if (fees) {
        item.fee_amount0 = fees.amount0
        item.fee_amount1 = fees.amount1
      }
    })

    return positions
  }

  /**
   * Get the position information of the owner by pool id.
   * @param owner 
   * @param poolAddress 
   * @param calculateFarmingReward 
   * @returns 
   */
  public async getOwnerPositionsByPool(owner: Address, poolAddress: Address, calculateFarmingReward = true): Promise<ChefV3Position[]> {
    const pid = await this.getV3PoolAddressPid(poolAddress)
    if (pid === undefined) {
      return []
    }
    return (await this.getOwnerPositionsByPid(owner, pid, calculateFarmingReward)).map((item) => {
      item.poolAddress = poolAddress
      return item
    })
  }

  /**
   * Get the pid of the v3 pool
   * @param poolAddress
   * @returns
   */
  public async getV3PoolAddressPid(poolAddress: Address): Promise<bigint | undefined> {
    const cachePid = this.pidsMap[poolAddress]
    if (cachePid) {
      return cachePid
    }
    const contract = this.buildContractClinet()
    try {
      const pid = await contract.read.v3PoolAddressPid([poolAddress])
      this.pidsMap[poolAddress] = pid
      return pid
    } catch (error) {
      console.log(error)
      return undefined
    }
  }


  /**
   * Get the address of the reward token
   * @returns 
   */
  public async getRewardCoin(): Promise<string | undefined> {
    const contract = this.buildContractClinet()
    try {
      const address = await contract.read.REWARD()
      return address
    } catch (error) {
      console.log(error)
    }
    return undefined
  }
  /**
   * Calculate position fee
   * @param tokenId
   * @param recipient
   * @returns
   */
  public async calculatePositionFee(
    tokenIds: bigint[],
    recipient: Address
  ): Promise<
    Record<
      string,
      {
        amount0: bigint
        amount1: bigint
      }
    >
  > {
    const contract = this.buildContractClinet()
    const recordMap: Record<
      string,
      {
        amount0: bigint
        amount1: bigint
      }
    > = {}
    try {
      const requestMap = tokenIds.map((tokenId) =>
        contract.simulate.collect(
          [
            {
              tokenId,
              recipient,
              amount0Max: MAX_UINT128,
              amount1Max: MAX_UINT128,
            },
          ],
          { account: recipient }
        )
      )
      const results = await Promise.all(requestMap)
      results.forEach((fees) => {
        recordMap[fees.request.args[0].tokenId.toString()] = {
          amount0: fees.result[0],
          amount1: fees.result[1],
        }
      })
    } catch (error) {
      console.log(error)
    }

    return recordMap
  }

  /**
   * Calculate farming rewards
   * @param options
   * @returns
   */
  public async calculateFarmingReward(tokenIds: bigint[], recipient: Address): Promise<Record<string, bigint>> {
    const contract = this.buildContractClinet()
    const recordMap: Record<string, bigint> = {}
    try {
      const requestMap = tokenIds.map((tokenId) =>
        contract.simulate.harvest([tokenId, recipient], { account: recipient })
      )
      const results = await Promise.all(requestMap)
      results.forEach((reward) => {
        recordMap[reward.request.args[0].toString()] = reward.result
      })
    } catch (error) {
      console.log(error)
    }
    return recordMap
  }

  /**
   * Add liquidity
   * @param options
   * @returns
   */
  public static addCallParameters(options: FarmAddCallOptions) {
    const calldatas: Hex[] = []
    // add
    calldatas.push(NonfungiblePositionManager.encodeIncreaseLiquidity(options.addLiquidity))

    // collect
    if (options.collect) {
      calldatas.push(...NonfungiblePositionManager.encodeCollect(options.collect))
    }

    if (options.recipient) {
      //collect farming reward
      calldatas.push(
        this.encodeHarvest({
          tokenId: options.addLiquidity.tokenId,
          to: options.recipient,
        })
      )
    }

    let value: Hex = toHex(0)
    if (options.warpNativeAmount && options.warpNativeAmount > 0n) {
      value = toHex(options.warpNativeAmount)
    }

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value,
    }
  }

  /**
   * Remove liquidity
   * @param options
   * @param warpNativeAmount
   * @returns
   */
  public static removeCallParameters(options: FarmRemoveCallOptions): MethodParameters {
    const calldatas: Hex[] = []
    // decreaseLiquidity
    calldatas.push(NonfungiblePositionManager.encodeDecreaseLiquidity(options.removeLiquidity))

    // collect
    if (options.collect) {
      const amount0Max = options.collect.amount0Max + options.removeLiquidity.amount0Min
      const amount1Max = options.collect.amount1Max + options.removeLiquidity.amount1Min
      calldatas.push(
        ...NonfungiblePositionManager.encodeCollect({
          ...options.collect,
          amount0Max,
          amount1Max,
        })
      )
    }

    if (options.recipient) {
      if (options.unStake) {
        // withdraw
        calldatas.push(
          this.encodeWithdraw({
            tokenId: options.removeLiquidity.tokenId,
            to: options.recipient,
          })
        )
      } else {
        // collect farming reward
        calldatas.push(
          this.encodeHarvest({
            tokenId: options.removeLiquidity.tokenId,
            to: options.recipient,
          })
        )
      }
    }

    //burn
    if (options.useBurn) {
      calldatas.push(NonfungiblePositionManager.encodeburn(options.removeLiquidity.tokenId))
    }

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value: toHex(0),
    }
  }
  /**
   * Collect rewards and fees
   * @param options
   * @returns
   */
  public static claimCallParameters(collectOptions: CollectOptions, recipient: Address): MethodParameters {
    const calldatas: Hex[] = []
    calldatas.push(...NonfungiblePositionManager.encodeCollect(collectOptions))
    // collect farming reward
    calldatas.push(
      this.encodeHarvest({
        tokenId: collectOptions.tokenId,
        to: recipient,
      })
    )
    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value: toHex(0),
    }
  }

  /**
   * Collect position fees
   * @param options
   * @returns
   */
  public static collectCallParameters(options: CollectOptions): MethodParameters {
    return NonfungiblePositionManager.collectCallParameters(options)
  }

  /**
   * Withdraw liquidity
   * @param sender
   * @param recipient
   * @param tokenId
   * @returns
   */
  public static withdrawCallParameters(options: WidthDrawOptions): MethodParameters {
    const calldatas: Hex[] = []
    calldatas.push(this.encodeWithdraw(options))
    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value: toHex(0),
    }
  }

  /**
   * Collect Farming Rewards
   * @param options
   * @returns
   */
  public static batchHarvestCallParameters(options: HarvestOptions[]): MethodParameters {
    const calldatas: Hex[] = options.map((option) => this.encodeHarvest(option)).flat()

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value: toHex(0),
    }
  }

  /**
   * Encode harvest
   * @param options 
   * @returns 
   */
  public static encodeHarvest(options: HarvestOptions): Hex {
    const { tokenId, to } = options

    return encodeFunctionData({
      abi: MasterChefV3.ABI,
      functionName: 'harvest',
      args: [BigInt(tokenId), validateAndParseAddress(to)],
    })
  }

  /**
   * Encode withdraw
   * @param options 
   * @returns 
   */
  private static encodeWithdraw(options: WidthDrawOptions): Hex {
    const { tokenId, to } = options
    return encodeFunctionData({
      abi: MasterChefV3.ABI,
      functionName: 'withdraw',
      args: [BigInt(tokenId), validateAndParseAddress(to)],
    })
  }
}
