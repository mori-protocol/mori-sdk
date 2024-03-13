import { ADDRESS_ZERO, adjustForTokenSlippage, validateAndParseAddress } from './utils/utils'
import { PositionMath } from './utils/positionMath'
import { Percent } from './fractions/percent'
import { type Hex, type PublicClient, encodeFunctionData, getContract, toHex, type Address } from 'viem'
import { TickMath } from './utils'
import { Multicall } from './Multicall'
import invariant from 'tiny-invariant'
import { MAX_UINT128, type BigintIsh, ZERO } from './constants'
import {
  type AddCallOptions,
  type CollectOptions,
  type CreatePoolOptions,
  type IncreaseSpecificOptions,
  type MethodParameters,
  type MintOptions,
  type Position,
  type RemoveCallOptions,
  type RemoveSpecificOptions,
  type StakeOptions,
} from './constants/type'
import { nonfungiblePositionManagerABI } from './abi/NonfugiblePositionManagerABI'


export class NonfungiblePositionManager {
  public static ABI = nonfungiblePositionManagerABI
  public readonly publicClient: PublicClient
  public readonly contractAddress: Address

  public constructor(publicClient: PublicClient, contractAddress: Address) {
    this.publicClient = publicClient
    this.contractAddress = contractAddress
  }

  private buildContractClinet() {
    return getContract({
      address: this.contractAddress,
      abi: NonfungiblePositionManager.ABI,
      client: this.publicClient,
    })
  }

  public async getOwnerOf(tokenId: BigintIsh) {
    const contract = this.buildContractClinet()
    const res = await contract.read.ownerOf([BigInt(tokenId)])
    return res
  }

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

  public async getOwnerPositions(owner: Address, tokenIds: BigintIsh[] = []): Promise<Position[]> {
    if (tokenIds.length === 0) {
      tokenIds = await this.getOwnerTokenIds(owner)
    }

    const requests = []
    for (let i = 0; i < tokenIds.length; i++) {
      requests.push(this.getPosition(tokenIds[i]))
    }
    const positions = await Promise.all(requests)
    return positions
  }

  public async getPosition(tokenId: BigintIsh): Promise<Position> {
    const contract = this.buildContractClinet()

    const res = await contract.read.positions([BigInt(tokenId)])
    console.log('getPosition###res###', res)

    const [, , token0, token1, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = res
    const position: Position = {
      tokenId,
      token0,
      token1,
      fee,
      tickLower,
      tickUpper,
      liquidity,
      tokensOwed0,
      tokensOwed1,
    }
    return position
  }

  public async calculatePositionFee(tokenId: bigint, recipient: Address) {
    const contract = this.buildContractClinet()

    const results = await contract.simulate.collect(
      [
        {
          tokenId,
          recipient,
          amount0Max: MAX_UINT128,
          amount1Max: MAX_UINT128,
        },
      ],
      { account: recipient, value: 0n }
    )
    const [amount0, amount1] = results.result

    return {
      amount0,
      amount1,
    }
  }

  public static calculateLiquidityByAmount(
    sqrtPriceX96: bigint,
    tickLower: number,
    tickUpper: number,
    amount: BigintIsh,
    fix_amount_0: boolean,
    slippage: Percent,
    round_up: boolean
  ) {
    let amount0Desired
    let amount1Desired
    let liquidity

    const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtPriceX96)

    if (tickCurrent < tickLower) {
      if (!fix_amount_0) {
        throw new Error('lower tick cannot calculate liquidity by coin1')
      }
    } else if (tickCurrent > tickUpper) {
      if (fix_amount_0) {
        throw new Error('upper tick cannot calculate liquidity by coin0')
      }
    }

    if (fix_amount_0) {
      const result = PositionMath.getLiquidityFromTokenAmount0(sqrtPriceX96, tickLower, tickUpper, amount)
      amount0Desired = amount
      amount1Desired = result.token1Amount
      liquidity = result.liquidity
    } else {
      const result = PositionMath.getLiquidityFromTokenAmount1(sqrtPriceX96, tickLower, tickUpper, amount)
      amount0Desired = result.token0Amount
      amount1Desired = amount
      liquidity = result.liquidity
    }

    liquidity = PositionMath.getLiquidityFromTokenAmounts(
      sqrtPriceX96,
      tickLower,
      tickUpper,
      BigInt(amount0Desired),
      BigInt(amount1Desired)
    )
    const { token0Amount, token1Amount } = PositionMath.getTokenAmountsFromLiquidity(
      sqrtPriceX96,
      tickLower,
      tickUpper,
      liquidity
    )

    const minimumAmounts = adjustForTokenSlippage(
      {
        token0Amount: token0Amount,
        token1Amount: token1Amount,
      },
      slippage,
      round_up
    )

    const amount0Min = minimumAmounts.tokenLimit0
    const amount1Min = minimumAmounts.tokenLimit1

    return {
      liquidity,
      amount0Desired: BigInt(amount0Desired),
      amount1Desired: BigInt(amount1Desired),
      amount0Min: BigInt(amount0Min),
      amount1Min: BigInt(amount1Min),
    }
  }

  public static calculateAmountsByLiquidity(
    sqrtPriceX96: bigint,
    tickLower: number,
    tickUpper: number,
    liquidity: bigint,
    slippage: Percent,
    round_up: boolean
  ) {
    const { token0Amount, token1Amount } = PositionMath.getTokenAmountsFromLiquidity(
      sqrtPriceX96,
      tickLower,
      tickUpper,
      BigInt(liquidity)
    )

    const minimumAmounts = adjustForTokenSlippage(
      {
        token0Amount,
        token1Amount,
      },
      slippage,
      round_up
    )

    const amount0Min = minimumAmounts.tokenLimit0
    const amount1Min = minimumAmounts.tokenLimit1

    return {
      token0Amount,
      token1Amount,
      amount0Min,
      amount1Min,
    }
  }

  public static addCallParameters(options: AddCallOptions): MethodParameters {
    const calldatas: Hex[] = []

    // create pool if needed
    if (options.createPool) {
      calldatas.push(this.encodeCreate(options.createPool))
    }
    // mint
    if (options.mint) {
      calldatas.push(this.encodeMint(options.mint))
    }
    // increase
    if (options.addLiquidity) {
      calldatas.push(this.encodeIncreaseLiquidity(options.addLiquidity))
      //collect
      if (options.collect) {
        calldatas.push(...this.encodeCollect(options.collect))
      }
    }

    let value: Hex = toHex(0)
    if (options.warpNativeAmount && options.warpNativeAmount > 0n) {
      calldatas.push(Multicall.encodeRefundETH())
      console.log("value: ", options.warpNativeAmount)
      value = toHex(options.warpNativeAmount)
    }

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value,
    }
  }


  public static removeCallParameters(options: RemoveCallOptions): MethodParameters {

    const calldatas: Hex[] = []
    // decreaseLiquidity
    calldatas.push(NonfungiblePositionManager.encodeDecreaseLiquidity(options.removeLiquidity))
    // collect
    if (options.collect) {
      const amount0Max = options.collect.amount0Max + options.removeLiquidity.amount0Min
      const amount1Max = options.collect.amount1Max + options.removeLiquidity.amount1Min
      calldatas.push(...NonfungiblePositionManager.encodeCollect({
        ...options.collect,
        amount0Max,
        amount1Max
      }))
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

  private static encodeMint(options: MintOptions): Hex {
    const recipient = validateAndParseAddress(options.recipient)
    const {
      token0,
      token1,
      fee,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      deadline,
    } = options
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            {
              components: [
                { internalType: 'address', name: 'token0', type: 'address' },
                { internalType: 'address', name: 'token1', type: 'address' },
                { internalType: 'uint24', name: 'fee', type: 'uint24' },
                { internalType: 'int24', name: 'tickLower', type: 'int24' },
                { internalType: 'int24', name: 'tickUpper', type: 'int24' },
                { internalType: 'uint256', name: 'amount0Desired', type: 'uint256' },
                { internalType: 'uint256', name: 'amount1Desired', type: 'uint256' },
                { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
                { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
                { internalType: 'address', name: 'recipient', type: 'address' },
                { internalType: 'uint256', name: 'deadline', type: 'uint256' },
              ],
              internalType: 'struct INonfungiblePositionManager.MintParams',
              name: 'params',
              type: 'tuple',
            },
          ],
          name: 'mint',
          outputs: [
            { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
            { internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1', type: 'uint256' },
          ],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'mint',
      args: [
        {
          token0,
          token1,
          fee,
          tickLower,
          tickUpper,
          amount0Desired,
          amount1Desired,
          amount0Min,
          amount1Min,
          recipient,
          deadline,
        },
      ],
    })

  }

  public static encodeIncreaseLiquidity(options: IncreaseSpecificOptions): Hex {
    const { tokenId, amount0Desired, amount1Desired, amount0Min, amount1Min, deadline } = options
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            {
              components: [
                { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                { internalType: 'uint256', name: 'amount0Desired', type: 'uint256' },
                { internalType: 'uint256', name: 'amount1Desired', type: 'uint256' },
                { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
                { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
                { internalType: 'uint256', name: 'deadline', type: 'uint256' },
              ],
              internalType: 'struct INonfungiblePositionManager.IncreaseLiquidityParams',
              name: 'params',
              type: 'tuple',
            },
          ],
          name: 'increaseLiquidity',
          outputs: [
            { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
            { internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1', type: 'uint256' },
          ],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
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
      abi: [
        {
          inputs: [
            {
              components: [
                { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
                { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
                { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
                { internalType: 'uint256', name: 'deadline', type: 'uint256' },
              ],
              internalType: 'struct INonfungiblePositionManager.DecreaseLiquidityParams',
              name: 'params',
              type: 'tuple',
            },
          ],
          name: 'decreaseLiquidity',
          outputs: [
            { internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1', type: 'uint256' },
          ],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
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

  public static collectCallParameters(options: CollectOptions): MethodParameters {
    return {
      calldata: Multicall.encodeMulticall(NonfungiblePositionManager.encodeCollect(options)),
      value: toHex(0),
    }
  }


  public static encodeCollect(options: CollectOptions): Hex[] {
    const calldatas: Hex[] = []
    const { tokenId, recipient, amount0Max, amount1Max, token0, token1, useNative } = options

    calldatas.push(encodeFunctionData({
      abi: [
        {
          inputs: [
            {
              components: [
                { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                { internalType: 'address', name: 'recipient', type: 'address' },
                { internalType: 'uint128', name: 'amount0Max', type: 'uint128' },
                { internalType: 'uint128', name: 'amount1Max', type: 'uint128' },
              ],
              internalType: 'struct INonfungiblePositionManager.CollectParams',
              name: 'params',
              type: 'tuple',
            },
          ],
          name: 'collect',
          outputs: [
            { internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1', type: 'uint256' },
          ],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'collect',
      args: [
        {
          tokenId,
          recipient: useNative ? ADDRESS_ZERO : recipient,
          amount0Max: MAX_UINT128,
          amount1Max: MAX_UINT128,
        },
      ],
    }))

    if (useNative) {
      invariant(token0 === useNative || token1 === useNative, 'NO_WETH')
      let ethAmount
      let tokenAmount
      let token
      if (useNative === token0) {
        ethAmount = amount0Max
        tokenAmount = amount1Max
        token = token1
      } else {
        ethAmount = amount1Max
        tokenAmount = amount0Max
        token = token0
      }

      calldatas.push(Multicall.encodeUnwrapWETH9(BigInt(ethAmount), recipient))
      calldatas.push(Multicall.encodeSweepToken(token, BigInt(tokenAmount), recipient))
    }

    return calldatas
  }

  public static encodeburn(tokenId: bigint): Hex {
    return encodeFunctionData({
      abi: [
        {
          inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
          name: 'burn',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'burn',
      args: [tokenId],
    })
  }

  /**
   * Stake NFT
   * @param sender
   * @param recipient
   * @param tokenId
   * @returns
   */
  public static stakeCallParameters(options: StakeOptions): MethodParameters {
    const { sender, recipient, tokenId } = options
    return {
      calldata: Multicall.encodeMulticall(encodeFunctionData({
        abi: [
          {
            inputs: [
              { internalType: 'address', name: 'from', type: 'address' },
              { internalType: 'address', name: 'to', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            ],
            name: 'safeTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'safeTransferFrom',
        args: [sender, recipient, tokenId],
      })),
      value: toHex(0),
    }
  }

  private static encodeCreate(options: CreatePoolOptions): Hex {
    const { token0, token1, fee, sqrtPriceX96 } = options
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            { internalType: 'address', name: 'token0', type: 'address' },
            { internalType: 'address', name: 'token1', type: 'address' },
            { internalType: 'uint24', name: 'fee', type: 'uint24' },
            { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
          ],
          name: 'createAndInitializePoolIfNecessary',
          outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'createAndInitializePoolIfNecessary',
      args: [token0, token1, fee, sqrtPriceX96],
    })
  }
}
