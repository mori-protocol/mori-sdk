export enum EventType {
    IncreaseLiquidity = "Mint",
    DecreaseLiquidity = "Burn",
    Swap = "Swap",
    MasterChefV3_AddPool = "MasterChefV3_AddPool"
}


export type EventInfo = {
    address: string
    blockNumber: bigint
    transactionHash: string
    blockHash: string
    removed: boolean
    eventName: EventType
    timestamp: bigint
    args: SwapEvent | DecreaseLiquidityEvent | IncreaseLiquidityyEvent
}

export type SwapEvent = {
    sender: string
    recipient: string
    amount0: string
    amount1: string
    sqrtPriceX96: string
    liquidity: string
    tick: number
    protocolFeesToken0: string,
    protocolFeesToken1: string,
    swap_a2b: boolean
}

export type DecreaseLiquidityEvent = {
    sender: string
    tickLower: string
    tickUpper: string
    amount: string
    amount0: string
    amount1: string
}

export type IncreaseLiquidityyEvent = {
    sender: string
    recipient: string
    tickLower: string
    tickUpper: string
    amount: string
    amount0: string
    amount1: string
}

export type MasterChefV3AddPoolEvent = {
    pid: string
    allocPoint: string
    v3Pool: string
    lmPool: string
}

export function isSwapArg(info: SwapEvent | DecreaseLiquidityEvent | IncreaseLiquidityyEvent): info is SwapEvent {
    return 'sqrtPriceX96' in info
}
