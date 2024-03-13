export const QuoterABI = [
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
        "stateMutability": "view",
        "outputs": [{ "type": "address", "name": "", "internalType": "address" }],
        "name": "factory",
        "inputs": []
    },
    {
        "type": "function",
        "stateMutability": "view",
        "outputs": [],
        "name": "moriV3SwapCallback",
        "inputs": [
            { "type": "int256", "name": "amount0Delta", "internalType": "int256" },
            { "type": "int256", "name": "amount1Delta", "internalType": "int256" },
            { "type": "bytes", "name": "path", "internalType": "bytes" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [
            { "type": "uint256", "name": "amountOut", "internalType": "uint256" },
            { "type": "uint160[]", "name": "sqrtPriceX96AfterList", "internalType": "uint160[]" },
            { "type": "uint32[]", "name": "initializedTicksCrossedList", "internalType": "uint32[]" },
            { "type": "uint256", "name": "gasEstimate", "internalType": "uint256" }
        ],
        "name": "quoteExactInput",
        "inputs": [
            { "type": "bytes", "name": "path", "internalType": "bytes" },
            { "type": "uint256", "name": "amountIn", "internalType": "uint256" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [
            { "type": "uint256", "name": "amountOut", "internalType": "uint256" },
            { "type": "uint160", "name": "sqrtPriceX96After", "internalType": "uint160" },
            { "type": "uint32", "name": "initializedTicksCrossed", "internalType": "uint32" },
            { "type": "uint256", "name": "gasEstimate", "internalType": "uint256" }
        ],
        "name": "quoteExactInputSingle",
        "inputs": [
            {
                "type": "tuple",
                "name": "params",
                "internalType": "struct IQuoter.QuoteExactInputSingleParams",
                "components": [
                    { "type": "address", "name": "tokenIn", "internalType": "address" },
                    { "type": "address", "name": "tokenOut", "internalType": "address" },
                    { "type": "uint256", "name": "amountIn", "internalType": "uint256" },
                    { "type": "uint24", "name": "fee", "internalType": "uint24" },
                    { "type": "uint160", "name": "sqrtPriceLimitX96", "internalType": "uint160" }
                ]
            }
        ]
    },
    {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [
            { "type": "uint256", "name": "amountIn", "internalType": "uint256" },
            { "type": "uint160[]", "name": "sqrtPriceX96AfterList", "internalType": "uint160[]" },
            { "type": "uint32[]", "name": "initializedTicksCrossedList", "internalType": "uint32[]" },
            { "type": "uint256", "name": "gasEstimate", "internalType": "uint256" }
        ],
        "name": "quoteExactOutput",
        "inputs": [
            { "type": "bytes", "name": "path", "internalType": "bytes" },
            { "type": "uint256", "name": "amountOut", "internalType": "uint256" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [
            { "type": "uint256", "name": "amountIn", "internalType": "uint256" },
            { "type": "uint160", "name": "sqrtPriceX96After", "internalType": "uint160" },
            { "type": "uint32", "name": "initializedTicksCrossed", "internalType": "uint32" },
            { "type": "uint256", "name": "gasEstimate", "internalType": "uint256" }
        ],
        "name": "quoteExactOutputSingle",
        "inputs": [
            {
                "type": "tuple",
                "name": "params",
                "internalType": "struct IQuoter.QuoteExactOutputSingleParams",
                "components": [
                    { "type": "address", "name": "tokenIn", "internalType": "address" },
                    { "type": "address", "name": "tokenOut", "internalType": "address" },
                    { "type": "uint256", "name": "amount", "internalType": "uint256" },
                    { "type": "uint24", "name": "fee", "internalType": "uint24" },
                    { "type": "uint160", "name": "sqrtPriceLimitX96", "internalType": "uint160" }
                ]
            }
        ]
    }
] as const
