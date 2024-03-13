export const SwapRouterABI = [
    {
        "type": "constructor",
        "stateMutability": "nonpayable",
        "inputs": [
            { "type": "address", "name": "_deployer", "internalType": "address" },
            { "type": "address", "name": "_factory", "internalType": "address" },
            { "type": "address", "name": "_WETH9", "internalType": "address" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{ "type": "address", "name": "", "internalType": "address" }],
        "name": "WETH9",
        "inputs": []
    },
    {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{ "type": "address", "name": "", "internalType": "address" }],
        "name": "deployer",
        "inputs": []
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [{ "type": "uint256", "name": "amountOut", "internalType": "uint256" }],
        "name": "exactInput",
        "inputs": [
            {
                "type": "tuple",
                "name": "params",
                "internalType": "struct ISwapRouter.ExactInputParams",
                "components": [
                    { "type": "bytes", "name": "path", "internalType": "bytes" },
                    { "type": "address", "name": "recipient", "internalType": "address" },
                    { "type": "uint256", "name": "deadline", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountIn", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountOutMinimum", "internalType": "uint256" }
                ]
            }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [{ "type": "uint256", "name": "amountOut", "internalType": "uint256" }],
        "name": "exactInputSingle",
        "inputs": [
            {
                "type": "tuple",
                "name": "params",
                "internalType": "struct ISwapRouter.ExactInputSingleParams",
                "components": [
                    { "type": "address", "name": "tokenIn", "internalType": "address" },
                    { "type": "address", "name": "tokenOut", "internalType": "address" },
                    { "type": "uint24", "name": "fee", "internalType": "uint24" },
                    { "type": "address", "name": "recipient", "internalType": "address" },
                    { "type": "uint256", "name": "deadline", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountIn", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountOutMinimum", "internalType": "uint256" },
                    { "type": "uint160", "name": "sqrtPriceLimitX96", "internalType": "uint160" }
                ]
            }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [{ "type": "uint256", "name": "amountIn", "internalType": "uint256" }],
        "name": "exactOutput",
        "inputs": [
            {
                "type": "tuple",
                "name": "params",
                "internalType": "struct ISwapRouter.ExactOutputParams",
                "components": [
                    { "type": "bytes", "name": "path", "internalType": "bytes" },
                    { "type": "address", "name": "recipient", "internalType": "address" },
                    { "type": "uint256", "name": "deadline", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountOut", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountInMaximum", "internalType": "uint256" }
                ]
            }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [{ "type": "uint256", "name": "amountIn", "internalType": "uint256" }],
        "name": "exactOutputSingle",
        "inputs": [
            {
                "type": "tuple",
                "name": "params",
                "internalType": "struct ISwapRouter.ExactOutputSingleParams",
                "components": [
                    { "type": "address", "name": "tokenIn", "internalType": "address" },
                    { "type": "address", "name": "tokenOut", "internalType": "address" },
                    { "type": "uint24", "name": "fee", "internalType": "uint24" },
                    { "type": "address", "name": "recipient", "internalType": "address" },
                    { "type": "uint256", "name": "deadline", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountOut", "internalType": "uint256" },
                    { "type": "uint256", "name": "amountInMaximum", "internalType": "uint256" },
                    { "type": "uint160", "name": "sqrtPriceLimitX96", "internalType": "uint160" }
                ]
            }
        ]
    },
    {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{ "type": "address", "name": "", "internalType": "address" }],
        "name": "factory",
        "inputs": []
    },
    {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "moriV3SwapCallback",
        "inputs": [
            { "type": "int256", "name": "amount0Delta", "internalType": "int256" },
            { "type": "int256", "name": "amount1Delta", "internalType": "int256" },
            { "type": "bytes", "name": "_data", "internalType": "bytes" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [{ "type": "bytes[]", "name": "results", "internalType": "bytes[]" }],
        "name": "multicall",
        "inputs": [{ "type": "bytes[]", "name": "data", "internalType": "bytes[]" }]
    },
    { "type": "function", "stateMutability": "payable", "outputs": [], "name": "refundETH", "inputs": [] },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "selfPermit",
        "inputs": [
            { "type": "address", "name": "token", "internalType": "address" },
            { "type": "uint256", "name": "value", "internalType": "uint256" },
            { "type": "uint256", "name": "deadline", "internalType": "uint256" },
            { "type": "uint8", "name": "v", "internalType": "uint8" },
            { "type": "bytes32", "name": "r", "internalType": "bytes32" },
            { "type": "bytes32", "name": "s", "internalType": "bytes32" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "selfPermitAllowed",
        "inputs": [
            { "type": "address", "name": "token", "internalType": "address" },
            { "type": "uint256", "name": "nonce", "internalType": "uint256" },
            { "type": "uint256", "name": "expiry", "internalType": "uint256" },
            { "type": "uint8", "name": "v", "internalType": "uint8" },
            { "type": "bytes32", "name": "r", "internalType": "bytes32" },
            { "type": "bytes32", "name": "s", "internalType": "bytes32" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "selfPermitAllowedIfNecessary",
        "inputs": [
            { "type": "address", "name": "token", "internalType": "address" },
            { "type": "uint256", "name": "nonce", "internalType": "uint256" },
            { "type": "uint256", "name": "expiry", "internalType": "uint256" },
            { "type": "uint8", "name": "v", "internalType": "uint8" },
            { "type": "bytes32", "name": "r", "internalType": "bytes32" },
            { "type": "bytes32", "name": "s", "internalType": "bytes32" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "selfPermitIfNecessary",
        "inputs": [
            { "type": "address", "name": "token", "internalType": "address" },
            { "type": "uint256", "name": "value", "internalType": "uint256" },
            { "type": "uint256", "name": "deadline", "internalType": "uint256" },
            { "type": "uint8", "name": "v", "internalType": "uint8" },
            { "type": "bytes32", "name": "r", "internalType": "bytes32" },
            { "type": "bytes32", "name": "s", "internalType": "bytes32" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "sweepToken",
        "inputs": [
            { "type": "address", "name": "token", "internalType": "address" },
            { "type": "uint256", "name": "amountMinimum", "internalType": "uint256" },
            { "type": "address", "name": "recipient", "internalType": "address" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "sweepTokenWithFee",
        "inputs": [
            { "type": "address", "name": "token", "internalType": "address" },
            { "type": "uint256", "name": "amountMinimum", "internalType": "uint256" },
            { "type": "address", "name": "recipient", "internalType": "address" },
            { "type": "uint256", "name": "feeBips", "internalType": "uint256" },
            { "type": "address", "name": "feeRecipient", "internalType": "address" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "unwrapWETH9",
        "inputs": [
            { "type": "uint256", "name": "amountMinimum", "internalType": "uint256" },
            { "type": "address", "name": "recipient", "internalType": "address" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "payable",
        "outputs": [],
        "name": "unwrapWETH9WithFee",
        "inputs": [
            { "type": "uint256", "name": "amountMinimum", "internalType": "uint256" },
            { "type": "address", "name": "recipient", "internalType": "address" },
            { "type": "uint256", "name": "feeBips", "internalType": "uint256" },
            { "type": "address", "name": "feeRecipient", "internalType": "address" }
        ]
    },
    { "type": "receive", "stateMutability": "payable" }
]
