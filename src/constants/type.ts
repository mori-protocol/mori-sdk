import type { Address, Hex } from 'viem'
import type { BigintIsh } from './internalConstant'


export type Token = {
    name: string
    id: Address
    wrapId: Address
    symbol: string
    decimals: number
    logoURI: string
    isNative: boolean
} & Record<string, any>

export type Position = {
    tokenId: BigintIsh
    token0: Address
    token1: Address
    fee: BigintIsh
    tickLower: number
    tickUpper: number
    liquidity: BigintIsh
    tokensOwed0: BigintIsh
    tokensOwed1: BigintIsh
}

export type CommonAddLiquidityOptions = {
    amount0Desired: bigint
    amount1Desired: bigint
    amount0Min: bigint
    amount1Min: bigint
    deadline: bigint
}

export type IncreaseSpecificOptions = {
    /**
     * Indicates the ID of the position to increase liquidity for.
     */
    tokenId: bigint
} & CommonAddLiquidityOptions


export type MintOptions = {
    token0: Address
    token1: Address
    fee: number
    tickLower: number,
    tickUpper: number
    /**
     * The account that should receive the minted NFT.
     */
    recipient: Address
} & CommonAddLiquidityOptions



export type CreatePoolOptions = {
    token0: Address
    token1: Address
    fee: number
    sqrtPriceX96: bigint
}


export type RemoveSpecificOptions = {
    liquidity: bigint
    tokenId: bigint
    amount0Min: bigint
    amount1Min: bigint
    deadline: bigint
}

export type AddCallOptions = {
    /**
     * the number of eth, if not eth then no pass
     */
    warpNativeAmount?: bigint
    /**
     * add liquidity
     */
    addLiquidity?: IncreaseSpecificOptions
    /**
     * collect position fee, just valid when add liquidity
     */
    collect?: CollectOptions
    /**
     * open position
     */
    mint?: MintOptions
    /**
     * create pool
     */
    createPool?: CreatePoolOptions
}

export type RemoveCallOptions = {
    /**
     * remove liquidity
     */
    removeLiquidity: RemoveSpecificOptions
    /**
     * collect position fee
     */
    collect?: CollectOptions
    /**
     * burn token. if true, must pass all liquidity to remove and collect farming reward, and unStake is false
     */
    useBurn: boolean
}

export type FarmRemoveCallOptions = {
    /**
     * unstake. if true, must pass all liquidity to remove and collect farming reward, and useBurn is false
     */
    unStake: boolean
    /**
     * recipient of farming reward or unstake
     */
    recipient?: Address
} & RemoveCallOptions

export type FarmAddCallOptions = {
    /**
     * the number of eth, if not eth then no pass
     */
    warpNativeAmount?: bigint
    /**
     * add liquidity
     */
    addLiquidity: IncreaseSpecificOptions
    /**
     * the recipient of farming reward
     */
    recipient?: Address
    /**
     * collect position fee
     */
    collect?: CollectOptions
}

export type CollectOptions = {
    tokenId: bigint
    recipient: Address,
    amount0Max: bigint,
    amount1Max: bigint
    token0: Address
    token1: Address
    useNative?: Address
}

export type StakeOptions = {
    sender: Address,
    recipient: Address,
    tokenId: bigint
}


export type HarvestOptions = {
    tokenId: bigint
    to: Address
}

export type WidthDrawOptions = {
    tokenId: bigint
    to: Address
}


/**
 * Generated method parameters for executing a call.
 */
export interface MethodParameters {
    /**
     * The hex encoded calldata to perform the given operation
     */
    calldata: Hex
    /**
     * The amount of ether (wei) to send in hex.
     */
    value: Hex
}
