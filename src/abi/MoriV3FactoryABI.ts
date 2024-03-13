export const moriV3FactoryABI = [
    {
        type: 'constructor',
        stateMutability: 'nonpayable',
        inputs: [{ type: 'address', name: '_poolDeployer', internalType: 'address' }],
    },
    {
        type: 'event',
        name: 'FeeAmountEnabled',
        inputs: [
            { type: 'uint24', name: 'fee', internalType: 'uint24', indexed: true },
            { type: 'int24', name: 'tickSpacing', internalType: 'int24', indexed: true },
        ],
        anonymous: false,
    },
    {
        type: 'event',
        name: 'FeeAmountExtraInfoUpdated',
        inputs: [
            { type: 'uint24', name: 'fee', internalType: 'uint24', indexed: true },
            { type: 'bool', name: 'whitelistRequested', internalType: 'bool', indexed: false },
            { type: 'bool', name: 'enabled', internalType: 'bool', indexed: false },
        ],
        anonymous: false,
    },
    {
        type: 'event',
        name: 'OwnerChanged',
        inputs: [
            { type: 'address', name: 'oldOwner', internalType: 'address', indexed: true },
            { type: 'address', name: 'newOwner', internalType: 'address', indexed: true },
        ],
        anonymous: false,
    },
    {
        type: 'event',
        name: 'PoolCreated',
        inputs: [
            { type: 'address', name: 'token0', internalType: 'address', indexed: true },
            { type: 'address', name: 'token1', internalType: 'address', indexed: true },
            { type: 'uint24', name: 'fee', internalType: 'uint24', indexed: true },
            { type: 'int24', name: 'tickSpacing', internalType: 'int24', indexed: false },
            { type: 'address', name: 'pool', internalType: 'address', indexed: false },
        ],
        anonymous: false,
    },
    {
        type: 'event',
        name: 'SetLmPoolDeployer',
        inputs: [{ type: 'address', name: 'lmPoolDeployer', internalType: 'address', indexed: true }],
        anonymous: false,
    },
    {
        type: 'event',
        name: 'WhiteListAdded',
        inputs: [
            { type: 'address', name: 'user', internalType: 'address', indexed: true },
            { type: 'bool', name: 'verified', internalType: 'bool', indexed: false },
        ],
        anonymous: false,
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [
            { type: 'uint128', name: 'amount0', internalType: 'uint128' },
            { type: 'uint128', name: 'amount1', internalType: 'uint128' },
        ],
        name: 'collectProtocol',
        inputs: [
            { type: 'address', name: 'pool', internalType: 'address' },
            { type: 'address', name: 'recipient', internalType: 'address' },
            { type: 'uint128', name: 'amount0Requested', internalType: 'uint128' },
            { type: 'uint128', name: 'amount1Requested', internalType: 'uint128' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [{ type: 'address', name: 'pool', internalType: 'address' }],
        name: 'createPool',
        inputs: [
            { type: 'address', name: 'tokenA', internalType: 'address' },
            { type: 'address', name: 'tokenB', internalType: 'address' },
            { type: 'uint24', name: 'fee', internalType: 'uint24' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [],
        name: 'enableFeeAmount',
        inputs: [
            { type: 'uint24', name: 'fee', internalType: 'uint24' },
            { type: 'int24', name: 'tickSpacing', internalType: 'int24' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'view',
        outputs: [{ type: 'int24', name: '', internalType: 'int24' }],
        name: 'feeAmountTickSpacing',
        inputs: [{ type: 'uint24', name: '', internalType: 'uint24' }],
    },
    {
        type: 'function',
        stateMutability: 'view',
        outputs: [
            { type: 'bool', name: 'whitelistRequested', internalType: 'bool' },
            { type: 'bool', name: 'enabled', internalType: 'bool' },
        ],
        name: 'feeAmountTickSpacingExtraInfo',
        inputs: [{ type: 'uint24', name: '', internalType: 'uint24' }],
    },
    {
        type: 'function',
        stateMutability: 'view',
        outputs: [{ type: 'address', name: '', internalType: 'address' }],
        name: 'getPool',
        inputs: [
            { type: 'address', name: '', internalType: 'address' },
            { type: 'address', name: '', internalType: 'address' },
            { type: 'uint24', name: '', internalType: 'uint24' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'view',
        outputs: [{ type: 'address', name: '', internalType: 'address' }],
        name: 'lmPoolDeployer',
        inputs: [],
    },
    {
        type: 'function',
        stateMutability: 'view',
        outputs: [{ type: 'address', name: '', internalType: 'address' }],
        name: 'owner',
        inputs: [],
    },
    {
        type: 'function',
        stateMutability: 'view',
        outputs: [{ type: 'address', name: '', internalType: 'address' }],
        name: 'poolDeployer',
        inputs: [],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [],
        name: 'setFeeAmountExtraInfo',
        inputs: [
            { type: 'uint24', name: 'fee', internalType: 'uint24' },
            { type: 'bool', name: 'whitelistRequested', internalType: 'bool' },
            { type: 'bool', name: 'enabled', internalType: 'bool' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [],
        name: 'setFeeProtocol',
        inputs: [
            { type: 'address', name: 'pool', internalType: 'address' },
            { type: 'uint32', name: 'feeProtocol0', internalType: 'uint32' },
            { type: 'uint32', name: 'feeProtocol1', internalType: 'uint32' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [],
        name: 'setLmPool',
        inputs: [
            { type: 'address', name: 'pool', internalType: 'address' },
            { type: 'address', name: 'lmPool', internalType: 'address' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [],
        name: 'setLmPoolDeployer',
        inputs: [{ type: 'address', name: '_lmPoolDeployer', internalType: 'address' }],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [],
        name: 'setOwner',
        inputs: [{ type: 'address', name: '_owner', internalType: 'address' }],
    },
    {
        type: 'function',
        stateMutability: 'nonpayable',
        outputs: [],
        name: 'setWhiteListAddress',
        inputs: [
            { type: 'address', name: 'user', internalType: 'address' },
            { type: 'bool', name: 'verified', internalType: 'bool' },
        ],
    },
] as const
