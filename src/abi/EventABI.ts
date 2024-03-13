export const increaseLiquidityEventABI = {
    anonymous: false,
    inputs: [
        { indexed: false, internalType: 'address', name: 'sender', type: 'address' },
        { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
        { indexed: true, internalType: 'int24', name: 'tickLower', type: 'int24' },
        { indexed: true, internalType: 'int24', name: 'tickUpper', type: 'int24' },
        { indexed: false, internalType: 'uint128', name: 'amount', type: 'uint128' },
        { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    name: 'Mint',
    type: 'event',
} as const

export const decreaseLiquidityEventABI = {
    anonymous: false,
    inputs: [
        { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
        { indexed: true, internalType: 'int24', name: 'tickLower', type: 'int24' },
        { indexed: true, internalType: 'int24', name: 'tickUpper', type: 'int24' },
        { indexed: false, internalType: 'uint128', name: 'amount', type: 'uint128' },
        { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    name: 'Burn',
    type: 'event',
} as const


export const swapEventABI = {
    anonymous: false,
    inputs: [
        { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
        { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
        { indexed: false, internalType: 'int256', name: 'amount0', type: 'int256' },
        { indexed: false, internalType: 'int256', name: 'amount1', type: 'int256' },
        { indexed: false, internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
        { indexed: false, internalType: 'uint128', name: 'liquidity', type: 'uint128' },
        { indexed: false, internalType: 'int24', name: 'tick', type: 'int24' },
        { indexed: false, internalType: 'uint128', name: 'protocolFeesToken0', type: 'uint128' },
        { indexed: false, internalType: 'uint128', name: 'protocolFeesToken1', type: 'uint128' },
    ],
    name: 'Swap',
    type: 'event',
}

export const MasterChefV3AddPoolEventABI = {
    type: 'event',
    name: 'AddPool',
    inputs: [
        { type: 'uint256', name: 'pid', internalType: 'uint256', indexed: true },
        { type: 'uint256', name: 'allocPoint', internalType: 'uint256', indexed: false },
        { type: 'address', name: 'v3Pool', internalType: 'contract IMoriV3Pool', indexed: true },
        { type: 'address', name: 'lmPool', internalType: 'contract ILMPool', indexed: true },
    ],
    anonymous: false,
}