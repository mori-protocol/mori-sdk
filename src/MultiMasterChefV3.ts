import { type Hex, type PublicClient, encodeFunctionData, getContract, toHex, type Address } from 'viem'
import Decimal from 'decimal.js-light'
import { MasterChefV3, PRECISION_FACTOR, type MasterChef } from './MasterChefV3'
import { validateAndParseAddress } from './utils/utils'
import { Multicall } from './Multicall'
import { MoriV3Token } from './MoriV3Token'
import { MoriV3Pool, type Slot } from './MoriV3Pool'
import { sdkCacheMap } from './utils/cache'
import invariant from 'tiny-invariant'
import { MAX_UINT128, type BigintIsh, ZERO } from './constants/internalConstant'
import { MultiMasterChefV3ABI } from './abi/MultiMasterChefV3ABI'
import { sdkConfigInfo, type CollectOptions, type FarmAddCallOptions, type FarmRemoveCallOptions, type HarvestOptions, type IncreaseSpecificOptions, type MethodParameters, type RemoveSpecificOptions, type WidthDrawOptions } from './constants'

export type PoolRewarderInfo = {
  rewardToken: Address
  rewardPerSecond: bigint
  endTime: number
}

export type MultiMasterPool = {
  v3Pool: Address
  token0: Address
  token1: Address
  fee: number
  pid: bigint
  latestAccumulateTime: number
  totalLiquidity: bigint
  totalBoostLiquidity: bigint
  rewarders: PoolRewarderInfo[]
  slot?: Slot
}


export type FramFormatPool = {
  id: string
  pid: number
  symbol: string
  feeTier: string
  IsLive: boolean
  tick: string
  isForward: boolean
  rewarderUSD: {
    address: string
    amountSecond: string
    logoURI: string
    name: string
    symbol: string
    decimals: number
  }[],
  token0: {
    id: string
    balance: string
    logoURI: string
    name: string
    symbol: string
    decimals: number
  }
  token1: {
    id: string
    balance: string
    logoURI: string
    name: string
    symbol: string
    decimals: number
  }
}

export type MultiChefV3Position = {
  liquidity: BigintIsh
  boostLiquidity: BigintIsh
  tickLower: number
  tickUpper: number
  user: Address
  pid: bigint
  tokenId: bigint
  boostMultiplier: BigintIsh
  poolAddress: string
  rewards: bigint[]
  fee_amount0: bigint
  fee_amount1: bigint
}

export class MultiMasterChefV3 {
  public static ABI = MultiMasterChefV3ABI

  public readonly publicClient: PublicClient
  public readonly contractAddress: Address
  public masterChefData?: MasterChef
  private readonly masterChefV3: MasterChefV3

  public constructor(publicClient: PublicClient, contractAddress: Address) {
    this.publicClient = publicClient
    this.contractAddress = contractAddress
    this.masterChefV3 = new MasterChefV3(publicClient, contractAddress)
  }

  private buildContractClinet() {
    return getContract({
      address: this.contractAddress,
      abi: MultiMasterChefV3.ABI,
      client: this.publicClient,
    })
  }

  private async buildTokenBalance(tokenAddress: Address, owner: Address) {
    const moriToken = new MoriV3Token(this.publicClient, tokenAddress)
    const balance = await moriToken.getTokenBalance(owner)
    return balance
  }

  /**
   * Get the pool data
   * @param pid
   * @returns
   */
  public async buildMasterPoolData(pid: bigint, showSlot: boolean = false): Promise<MultiMasterPool | undefined> {
    const contract = this.buildContractClinet()

    let pool = sdkCacheMap.getFramsPool(pid.toString())
    if (pool === undefined) {
      const [v3Pool, token0, token1, fee, totalLiquidity, totalBoostLiquidity, latestAccumulateTime] =
        await contract.read.poolInfo([pid])
      pool = {
        v3Pool,
        token0,
        token1,
        pid,
        fee,
        latestAccumulateTime,
        totalLiquidity,
        totalBoostLiquidity,
        rewarders: [],
      }
    }
    if (showSlot) {
      const [rewarderInfoList, slot] = await Promise.all([this.getPoolRewarderInfo(pool.v3Pool), new MoriV3Pool(this.publicClient, pool.v3Pool).getSlot0()])
      pool.rewarders = rewarderInfoList
      pool.slot = slot
    } else {
      const rewarderInfoList = await this.getPoolRewarderInfo(pool.v3Pool)
      pool.rewarders = rewarderInfoList
    }

    sdkCacheMap.setFramsPool(pool.pid.toString(), pool)
    return pool
  }

  /**
   * Get the list of pools
   * @returns
   */
  public async buildMasterPoolList(showSlot: boolean = false): Promise<MultiMasterPool[]> {
    const contract = this.buildContractClinet()
    const poolLength = await contract.read.poolLength()
    const requestMap: any[] = []
    for (let i: bigint = 1n; i <= poolLength; i++) {
      requestMap.push(this.buildMasterPoolData(i, showSlot))
    }

    const responsList = await Promise.all(requestMap)
    return responsList.map((item) => {
      const data: MultiMasterPool = {
        ...item,
      }
      sdkCacheMap.setFramsPool(data.pid.toString(), data)
      return data
    })
  }

  /**
   * Get the pool reward configuration information
   */
  public async getPoolRewarderInfo(v3Pool: Address): Promise<PoolRewarderInfo[]> {
    const contract = this.buildContractClinet()
    const rewarderLength = await contract.read.getRewarderLength([v3Pool])
    const requests = []
    for (let i = 0; i < rewarderLength; i++) {
      requests.push(contract.read.getRewarderInfo([v3Pool, BigInt(i)]))
    }
    const rewarderInfoList = await Promise.all(requests)
    return rewarderInfoList
  }

  /**
   * Get the tokenId data held
   * @param owner
   * @returns
   */
  public async getOwnerTokenIds(owner: Address): Promise<bigint[]> {
    return await this.masterChefV3.getOwnerTokenIds(owner)
  }

  /**
   * Get the position data held
   * @param owner
   * @returns
   */
  public async getOwnerPositions(owner: Address, tokenIds: bigint[] = []): Promise<MultiChefV3Position[]> {
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
      const rewards = rewardMap[item.tokenId.toString()]
      if (rewards) {
        item.rewards = rewards
      }
    })

    return positions
  }


  private async buildToken(tokenAddress: Address) {
    let token = sdkCacheMap.getToken(tokenAddress)
    if (token === undefined) {
      const moriToken = new MoriV3Token(this.publicClient, tokenAddress)
      token = await moriToken.readToken()
      token.isNative = sdkConfigInfo.nativeToken.toLocaleLowerCase() === token.id.toLocaleLowerCase()
      sdkCacheMap.setToken(tokenAddress, token)
    }
    return token
  }

  private compareTokens(t1: string, t2: string): boolean {
    const tokenPriority = sdkConfigInfo.tokenPriority
    const priorityMap: Record<string, number> = {}
    tokenPriority.forEach((address, index) => {
      priorityMap[address.toLocaleLowerCase()] = index
    })
    const priority1 = priorityMap[t1];
    const priority2 = priorityMap[t2];

    if (priority1 === undefined && priority2 === undefined) {
      return true;
    } else if (priority1 === undefined) {
      return true;
    } else if (priority2 === undefined) {

      return false;
    }
    return priority1 > priority2;
  }

  /**
  * Get pool list info
  * @returns 
  */
  public async buildFormatPoolList(): Promise<FramFormatPool[]> {
    const poolList = await this.buildMasterPoolList(true)
    const formatPoolList: FramFormatPool[] = []
    for (const pool of poolList) {
      const [token0, token1] = await Promise.all([this.buildToken(pool.token0), this.buildToken(pool.token1)])
      const rewarderTokenList = await Promise.all(pool.rewarders.map((item) => this.buildToken(item.rewardToken)))
      const [tokenBalance0, tokenBalance1] = await Promise.all([this.buildTokenBalance(pool.token0, pool.v3Pool), this.buildTokenBalance(pool.token1, pool.v3Pool)])

      const rewarderUSD = rewarderTokenList.map((token, index) => {
        const info = pool.rewarders[index]
        return {
          address: info.rewardToken,
          amountSecond: MultiMasterChefV3.formatRewardPerSecond(info.rewardPerSecond, token.decimals),
          ...token
        }
      })

      const formatPool: FramFormatPool = {
        id: pool.v3Pool,
        pid: Number(pool.pid),
        symbol: `${token0.symbol}-${token1.symbol}`,
        feeTier: pool.fee.toString(),
        IsLive: true,
        tick: pool.slot!.tick.toString(),
        isForward: this.compareTokens(token0.id.toLocaleLowerCase(), token1.id.toLocaleLowerCase()),
        rewarderUSD,
        token0: {
          balance: new Decimal(tokenBalance0.toString()).div(10 ** token0.decimals).toString(),
          ...token0
        },
        token1: {
          balance: new Decimal(tokenBalance1.toString()).div(10 ** token1.decimals).toString(),
          ...token1
        }
      }

      formatPoolList.push(formatPool)
    }

    return formatPoolList
  }

  /**
   * Get the position information
   * @param tokenId
   * @returns
   */
  public async getPosition(tokenId: bigint): Promise<MultiChefV3Position> {
    const contract = this.buildContractClinet()

    const res = await contract.read.userPositionInfos([tokenId])

    const [liquidity, boostLiquidity, tickLower, tickUpper, user, pid, boostMultiplier] =
      res
    const position: MultiChefV3Position = {
      tokenId,
      liquidity,
      boostLiquidity,
      tickLower,
      tickUpper,
      user,
      pid,
      boostMultiplier: new Decimal(boostMultiplier.toString()).div(PRECISION_FACTOR).toString(),
      poolAddress: '',
      fee_amount0: 0n,
      fee_amount1: 0n,
      rewards: []
    }
    return position
  }

  /**
   * Get the pid of the v3 pool
   * @param poolAddress
   * @returns
   */
  public async getV3PoolAddressPid(poolAddress: Address): Promise<bigint | undefined> {
    return await this.masterChefV3.getV3PoolAddressPid(poolAddress)
  }

  /**
   * Calculate the fee of the position
   * @param tokenIds
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
    return await this.masterChefV3.calculatePositionFee(tokenIds, recipient)
  }

  /**
   * Calculate farming rewards
   * @param options
   * @returns
   */
  public async calculateFarmingReward(tokenIds: bigint[], recipient: Address): Promise<Record<string, bigint[]>> {
    const contract = this.buildContractClinet()
    const recordMap: Record<string, bigint[]> = {}
    const errorIds: bigint[] = []
    try {
      const requestMap = tokenIds.map((tokenId) =>
        contract.simulate.harvest([tokenId, recipient], { account: recipient }).catch((error) => {
          console.error(`Error processing tokenId ${tokenId}:`, error);
          return null; // Handle the error for this specific tokenId operation
        })
      );
      const results = await Promise.all(requestMap)

      results.forEach((reward, index) => {
        if (reward) {
          const tokenId = reward.request.args[0].toString()
          recordMap[tokenId] = [...reward.result]
        } else {
          const tokenId = tokenIds[index].toString();
          console.error(`Operation for tokenId ${tokenId} failed or was rejected.`);
          errorIds.push(BigInt(tokenId))
        }

      })

      if (errorIds.length > 0) {
        const requestMap = errorIds.map((tokenId) =>
          contract.read.pendingRewards([tokenId]).catch((error) => {
            console.error(`Error processing tokenId ${tokenId}:`, error);
            return null;
          })
        );
        const results = await Promise.all(requestMap)
        results.forEach((reward, index) => {
          if (reward) {
            recordMap[errorIds[index].toString()] = [...reward]
          }
        })
      }

    } catch (error) {
      console.log('Unexpected error:', error)
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
    calldatas.push(this.encodeIncreaseLiquidity(options.addLiquidity))

    // collect
    if (options.collect) {
      calldatas.push(...this.encodeCollect(options.collect))
    }

    if (options.recipient) {
      // collect
      calldatas.push(
        this.encodeHarvest({
          tokenId: options.addLiquidity.tokenId,
          to: options.recipient,
        })
      )
    }

    let value: Hex = toHex(0)
    if (options.warpNativeAmount && options.warpNativeAmount > 0n) {
      // calldatas.push(Multicall.encodeRefundETH())
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
   * @returns
   */
  public static removeCallParameters(options: FarmRemoveCallOptions) {
    const calldatas: Hex[] = []

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
        // collect
        calldatas.push(
          this.encodeHarvest({
            tokenId: options.removeLiquidity.tokenId,
            to: options.recipient,
          })
        )
      }
    }

    // decreaseLiquidity
    calldatas.push(this.encodeDecreaseLiquidity(options.removeLiquidity))

    // collect
    if (options.collect) {
      const amount0Max = options.collect.amount0Max + options.removeLiquidity.amount0Min
      const amount1Max = options.collect.amount1Max + options.removeLiquidity.amount1Min
      calldatas.push(
        ...this.encodeCollect({
          ...options.collect,
          amount0Max,
          amount1Max,
        })
      )
    }

    //burn 
    if (options.useBurn) {
      calldatas.push(this.encodeburn(options.removeLiquidity.tokenId))
    }

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value: toHex(0),
    }
  }

  /**
  * Remove liquidity
  * When the token id corresponds to the fram reward is 0, this logic has a problem
  * @param options
  * @returns
  */
  public static removeCallParametersCopy(options: FarmRemoveCallOptions) {
    const calldatas: Hex[] = []
    // decreaseLiquidity
    calldatas.push(this.encodeDecreaseLiquidity(options.removeLiquidity))

    // collect
    if (options.collect) {
      const amount0Max = options.collect.amount0Max + options.removeLiquidity.amount0Min
      const amount1Max = options.collect.amount1Max + options.removeLiquidity.amount1Min
      calldatas.push(
        ...this.encodeCollect({
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
        // collect
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
      calldatas.push(this.encodeburn(options.removeLiquidity.tokenId))
    }

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value: toHex(0),
    }
  }

  public static encodeburn(tokenId: bigint): Hex {
    return encodeFunctionData({
      abi: MultiMasterChefV3.ABI,
      functionName: 'burn',
      args: [tokenId],
    })
  }

  public static burnCallParameters(tokenId: bigint) {
    return {
      calldata: Multicall.encodeMulticall(MultiMasterChefV3.encodeburn(tokenId)),
      value: toHex(0),
    }
  }

  /**
   * Collect rewards and fees
   * @param options
   * @returns
   */
  public static claimCallParameters(collectOptions: CollectOptions, recipient: Address) {
    const calldatas: Hex[] = []
    calldatas.push(...this.encodeCollect(collectOptions))
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
   * Collect rewards and fees
   * @param options
   * @returns
   */
  public static collectCallParameters(options: CollectOptions): MethodParameters {
    return {
      calldata: Multicall.encodeMulticall(this.encodeCollect(options)),
      value: toHex(0),
    }
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
   * Collect farming rewards
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
   * 100000000000000000/10^12 / 10^decamil
   * @param rewardPerSecond 
   * @param decimals
   * @returns 
   */
  public static formatRewardPerSecond(rewardPerSecond: bigint, decimals: number) {
    return new Decimal(rewardPerSecond.toString()).div(10 ** 12).div(10 ** decimals).toString()
  }

  public static encodeCollect(options: CollectOptions): Hex[] {
    const calldatas: Hex[] = []
    const { tokenId, recipient } = options

    calldatas.push(encodeFunctionData({
      abi: MultiMasterChefV3.ABI,
      functionName: 'collect',
      args: [
        {
          tokenId,
          recipient,
          amount0Max: MAX_UINT128,
          amount1Max: MAX_UINT128,
        },
      ],
    }))
    return calldatas
  }

  public static encodeIncreaseLiquidity(options: IncreaseSpecificOptions): Hex {
    const { tokenId, amount0Desired, amount1Desired, amount0Min, amount1Min, deadline } = options
    return encodeFunctionData({
      abi: MultiMasterChefV3.ABI,
      functionName: 'increaseLiquidity',
      args: [
        {
          tokenId,
          amount0Desired,
          amount1Desired,
          amount0Min,
          amount1Min,
          deadline,
        },
      ],
    })
  }

  public static encodeDecreaseLiquidity(
    options: RemoveSpecificOptions,
  ): Hex {
    const { tokenId, liquidity, amount0Min, amount1Min, deadline } = options

    invariant(BigInt(liquidity) > ZERO, 'ZERO_LIQUIDITY')

    return encodeFunctionData({
      abi: MultiMasterChefV3.ABI,
      functionName: 'decreaseLiquidity',
      args: [
        {
          tokenId,
          liquidity: BigInt(liquidity),
          amount0Min: BigInt(amount0Min),
          amount1Min: BigInt(amount1Min),
          deadline: BigInt(deadline),
        },
      ],
    })
  }

  public static encodeHarvest(options: HarvestOptions): Hex {
    const { tokenId, to } = options

    return encodeFunctionData({
      abi: MultiMasterChefV3.ABI,
      functionName: 'harvest',
      args: [BigInt(tokenId), validateAndParseAddress(to)],
    })
  }

  private static encodeWithdraw(options: WidthDrawOptions): Hex {
    const { tokenId, to } = options
    return encodeFunctionData({
      abi: MultiMasterChefV3.ABI,
      functionName: 'withdraw',
      args: [BigInt(tokenId), validateAndParseAddress(to)],
    })
  }
}
