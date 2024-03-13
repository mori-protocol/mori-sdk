export const MultiMasterChefV3ABI = [
    {
        inputs: [
            {
                internalType: 'contract INonfungiblePositionManager',
                name: '_nonfungiblePositionManager',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_WETH',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
        ],
        name: 'DuplicatedPool',
        type: 'error',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                internalType: 'contract IERC20',
                name: 'rewardToken',
                type: 'address',
            },
        ],
        name: 'DuplicatedRewarder',
        type: 'error',
    },
    {
        inputs: [],
        name: 'InconsistentAmount',
        type: 'error',
    },
    {
        inputs: [],
        name: 'InvalidNFT',
        type: 'error',
    },
    {
        inputs: [],
        name: 'InvalidPeriodDuration',
        type: 'error',
    },
    {
        inputs: [],
        name: 'InvalidPid',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NoLMPool',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NoLiquidity',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NotDojoNFT',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NotEmergency',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NotEmpty',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NotOwner',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NotOwnerOrOperator',
        type: 'error',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'rewardToken',
                type: 'address',
            },
        ],
        name: 'RewarderNotExist',
        type: 'error',
    },
    {
        inputs: [],
        name: 'WrongReceiver',
        type: 'error',
    },
    {
        inputs: [],
        name: 'ZeroAddress',
        type: 'error',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'contract IDojoV3Pool',
                name: 'v3Pool',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'contract ILMPool',
                name: 'lmPool',
                type: 'address',
            },
        ],
        name: 'AddPool',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'rewardToken',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'rewardPerSecond',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
        ],
        name: 'AddRewarder',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'liquidity',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'int24',
                name: 'tickLower',
                type: 'int24',
            },
            {
                indexed: false,
                internalType: 'int24',
                name: 'tickUpper',
                type: 'int24',
            },
        ],
        name: 'Deposit',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
        ],
        name: 'EmergencyWithdraw',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'sender',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'rewardToken',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'reward',
                type: 'uint256',
            },
        ],
        name: 'Harvest',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'deployer',
                type: 'address',
            },
        ],
        name: 'NewLMPoolDeployerAddress',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'operator',
                type: 'address',
            },
        ],
        name: 'NewOperatorAddress',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'vault',
                type: 'address',
            },
        ],
        name: 'NewVaultAddress',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'bool',
                name: 'emergency',
                type: 'bool',
            },
        ],
        name: 'SetEmergency',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'farmBoostContract',
                type: 'address',
            },
        ],
        name: 'UpdateFarmBoostContract',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'int128',
                name: 'liquidity',
                type: 'int128',
            },
            {
                indexed: false,
                internalType: 'int24',
                name: 'tickLower',
                type: 'int24',
            },
            {
                indexed: false,
                internalType: 'int24',
                name: 'tickUpper',
                type: 'int24',
            },
        ],
        name: 'UpdateLiquidity',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'rewardToken',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'rewardPerSecond',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
        ],
        name: 'UpdateRewarder',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
        ],
        name: 'Withdraw',
        type: 'event',
    },
    {
        inputs: [],
        name: 'BOOST_PRECISION',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'FARM_BOOSTER',
        outputs: [
            {
                internalType: 'contract IFarmBooster',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'LMPoolDeployer',
        outputs: [
            {
                internalType: 'contract ILMPoolDeployer',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_BOOST_PRECISION',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_DURATION',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MIN_DURATION',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'REWARD_PRECISION',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'WETH',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract IDojoV3Pool',
                name: '_v3Pool',
                type: 'address',
            },
            {
                internalType: 'contract IERC20',
                name: '_rewardToken',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_rewardPerSecond',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_duration',
                type: 'uint256',
            },
        ],
        name: 'addPool',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_pid',
                type: 'uint256',
            },
            {
                internalType: 'contract IERC20',
                name: '_rewardToken',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_rewardPerSecond',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_duration',
                type: 'uint256',
            },
        ],
        name: 'addRewarder',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        name: 'balanceOf',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
        ],
        name: 'burn',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'tokenId',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address',
                        name: 'recipient',
                        type: 'address',
                    },
                    {
                        internalType: 'uint128',
                        name: 'amount0Max',
                        type: 'uint128',
                    },
                    {
                        internalType: 'uint128',
                        name: 'amount1Max',
                        type: 'uint128',
                    },
                ],
                internalType: 'struct INonfungiblePositionManagerStruct.CollectParams',
                name: 'params',
                type: 'tuple',
            },
        ],
        name: 'collect',
        outputs: [
            {
                internalType: 'uint256',
                name: 'amount0',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount1',
                type: 'uint256',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'tokenId',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint128',
                        name: 'liquidity',
                        type: 'uint128',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount0Min',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount1Min',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'deadline',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct INonfungiblePositionManagerStruct.DecreaseLiquidityParams',
                name: 'params',
                type: 'tuple',
            },
        ],
        name: 'decreaseLiquidity',
        outputs: [
            {
                internalType: 'uint256',
                name: 'amount0',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount1',
                type: 'uint256',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'emergency',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: '_to',
                type: 'address',
            },
        ],
        name: 'emergencyWithdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_v3Pool',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_rewardToken',
                type: 'address',
            },
        ],
        name: 'getLatestPeriodInfo',
        outputs: [
            {
                internalType: 'uint256',
                name: 'rewardPerSecond',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_pid',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: '_rewardToken',
                type: 'address',
            },
        ],
        name: 'getLatestPeriodInfoByPid',
        outputs: [
            {
                internalType: 'uint256',
                name: 'rewardPerSecond',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract IDojoV3Pool',
                name: '_v3Pool',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'index',
                type: 'uint256',
            },
        ],
        name: 'getRewarderInfo',
        outputs: [
            {
                components: [
                    {
                        internalType: 'contract IERC20',
                        name: 'rewardToken',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'rewardPerSecond',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint32',
                        name: 'endTime',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint256',
                        name: 'releasedAmount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'harvestedAmount',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct MasterChefV3.PoolRewarderInfo',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_pid',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'index',
                type: 'uint256',
            },
        ],
        name: 'getRewarderInfoByPid',
        outputs: [
            {
                components: [
                    {
                        internalType: 'contract IERC20',
                        name: 'rewardToken',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'rewardPerSecond',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint32',
                        name: 'endTime',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint256',
                        name: 'releasedAmount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'harvestedAmount',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct MasterChefV3.PoolRewarderInfo',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract IDojoV3Pool',
                name: '_v3Pool',
                type: 'address',
            },
        ],
        name: 'getRewarderLength',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: '_to',
                type: 'address',
            },
        ],
        name: 'harvest',
        outputs: [
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'tokenId',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount0Desired',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount1Desired',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount0Min',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount1Min',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'deadline',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct INonfungiblePositionManagerStruct.IncreaseLiquidityParams',
                name: 'params',
                type: 'tuple',
            },
        ],
        name: 'increaseLiquidity',
        outputs: [
            {
                internalType: 'uint128',
                name: 'liquidity',
                type: 'uint128',
            },
            {
                internalType: 'uint256',
                name: 'amount0',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount1',
                type: 'uint256',
            },
        ],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes[]',
                name: 'data',
                type: 'bytes[]',
            },
        ],
        name: 'multicall',
        outputs: [
            {
                internalType: 'bytes[]',
                name: 'results',
                type: 'bytes[]',
            },
        ],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'nonfungiblePositionManager',
        outputs: [
            {
                internalType: 'contract INonfungiblePositionManager',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_from',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        name: 'onERC721Received',
        outputs: [
            {
                internalType: 'bytes4',
                name: '',
                type: 'bytes4',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'operatorAddress',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
        ],
        name: 'pendingRewards',
        outputs: [
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'poolInfo',
        outputs: [
            {
                internalType: 'contract IDojoV3Pool',
                name: 'v3Pool',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'token0',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'token1',
                type: 'address',
            },
            {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
            },
            {
                internalType: 'uint256',
                name: 'totalLiquidity',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalBoostLiquidity',
                type: 'uint256',
            },
            {
                internalType: 'uint32',
                name: 'latestAccumulateTime',
                type: 'uint32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'poolLength',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'poolRewarderIndex',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bool',
                name: '_emergency',
                type: 'bool',
            },
        ],
        name: 'setEmergency',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ILMPoolDeployer',
                name: '_LMPoolDeployer',
                type: 'address',
            },
        ],
        name: 'setLMPoolDeployer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_operatorAddress',
                type: 'address',
            },
        ],
        name: 'setOperator',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract IVault',
                name: '_vault',
                type: 'address',
            },
        ],
        name: 'setVault',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'index',
                type: 'uint256',
            },
        ],
        name: 'tokenOfOwnerByIndex',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_newFarmBoostContract',
                type: 'address',
            },
        ],
        name: 'updateFarmBoostContract',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
        ],
        name: 'updateLiquidity',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256[]',
                name: '_pids',
                type: 'uint256[]',
            },
        ],
        name: 'updatePools',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_pid',
                type: 'uint256',
            },
            {
                internalType: 'contract IERC20',
                name: '_rewardToken',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_rewardPerSecond',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_duration',
                type: 'uint256',
            },
        ],
        name: 'updateRewarder',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'userPositionInfos',
        outputs: [
            {
                internalType: 'uint128',
                name: 'liquidity',
                type: 'uint128',
            },
            {
                internalType: 'uint128',
                name: 'boostLiquidity',
                type: 'uint128',
            },
            {
                internalType: 'int24',
                name: 'tickLower',
                type: 'int24',
            },
            {
                internalType: 'int24',
                name: 'tickUpper',
                type: 'int24',
            },
            {
                internalType: 'address',
                name: 'user',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'pid',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'boostMultiplier',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'v3PoolAddressPid',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'vault',
        outputs: [
            {
                internalType: 'contract IVault',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: '_to',
                type: 'address',
            },
        ],
        name: 'withdraw',
        outputs: [
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        stateMutability: 'payable',
        type: 'receive',
    },
] as const
