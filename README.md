# MoriSwap SDK
The sdk for moriswap on vection chain.

## 1. Smart Contract Address
### 1.1 Mainnet
#### v3-core
- **MoriV3Factory**: `0xD1A76A4F4ff2AD3f899438Ea0e919049fC0a21BF`
- **MoriV3PoolDeployer**: `0xe6b4808C58d7497B1A567c732e1289142b1624c3`

#### v3-periphery
- **SwapRouter**: `0x673DF37Bc1218d6a1fCa09CB1fDbD34803ec5230`
- **Quoter**: `0xA9Ea3cE7e3D7C52a386C424B1ee60F78383E637f`
- **TickLens**: `0xa4e771269f5a6aF2574051915088A8eba2aae25e`
- **NonfungibleTokenPositionDescriptor**: `0x09C31B28901c6423d84352Eae600F21b3d00c766`
- **NonfungiblePositionManager**: `0x45D60EEF52E19dD722CE726e10E06De2d472DA1A`
- **MoriInterfaceMulticall**: `0xE99A74b69FaFE4c0AefCFD52cFF46E72b5EA6cCA`

#### masterchef-v3
- **MasterChefV3**: `0xC254a8EdA0174c9015Ec5f0801eBbEEbb3B8E4a1`
- **Vault**: `0xf88A7F933e38E8248e935D9dA5a8d9a06cE2FE21`

#### v3-lm-pool
- **MoriV3LmPoolDeployer**: `0x0750de853Fdb6C346edD4F3aaF5Ab0cE70bb11bf`

### 1.2 Testnet
#### v3-core
- **MoriV3Factory**: `0xA997c0628e3412987815cfe6680eA2186979c768`
- **MoriV3PoolDeployer**: `0xe1d086909fb4901d1dBddEDacF09FC4a92DAc150`

#### v3-periphery
- **SwapRouter**: `0xdae864089505C526F1ac87B3D1c8A4d7c7210543`
- **Quoter**: `0xf89339E903480b89FFD41C9548EB07D6bE2FB6E1`
- **TickLens**: `0x33bF002f5c0c25a3Dddd755C30e8279faf986f19`
- **NonfungibleTokenPositionDescriptor**: `0xc12c6CBbc9c26D73399bc430fA9AD4365d523Ab4`
- **NonfungiblePositionManager**: `0x1f5119371Fe31280673Edc78Df45cd4805c8784d`
- **MoriInterfaceMulticall**: `0x3F8Bddd85b4e5B0CadEeAF52b5138ec07CabEccd`

#### masterchef-v3
- **MasterChefV3**: `0x0c2D93F58971e988a283FDF9aA1aE77D3e3Accea`
- **Vault**: `0x91481B6E6a1EeF13433D2C2C750AF4a350DD7fbE`

#### v3-lm-pool
- **MoriV3LmPoolDeployer**: `0xcACa6CAd095aE13Ced5Bea55E4093A448D908Bcc`


## 2. Contract Details
### 2.1 Smart Router V3
#### 2.1.1 Function Interface introduction
1. **exactInputSingle**
    - Contract Interface
    ```solidity
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another token
    /// @dev Setting `amountIn` to 0 will cause the contract to look up its own balance,
    /// and swap the entire amount, enabling contracts to send tokens before calling this function.
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
    ```
    - Param  Explanation
        - **tokenIn** (address): This is the contract address of the token that you are sending to the swap. It represents the "input" token in the trade.
        - **tokenOut** (address): This is the contract address of the token that you want to receive from the swap. This is the "output" token in the trade.
        - **fee** (uint24): This is the fee amount that will be paid for the swap, denoted in basis points. The fee is typically a small percentage of the trade amount, and it is paid to the liquidity providers of the pool.
        - **recipient** (address): This is the address that will receive the tokenOut after the swap is completed. It could be the address of the caller, or another address if the caller is performing the swap on behalf of someone else.
        - **amountIn** (uint256): This is the amount of tokenIn that you want to swap. If you set amountIn to 0, the contract will use its own balance of tokenIn as the amount to be swapped.
        - **amountOutMinimum** (uint256): This is the minimum amount of tokenOut that you are willing to accept for your swap. If the swap cannot satisfy this minimum, the transaction should fail. This protects against slippage or unfavorable price movements during the swap.
        - **sqrtPriceLimitX96** (uint160): This is a limit on the price to which the swap will occur. It's the square root of the price encoded in a fixed-point format. If the price exceeds this limit, the swap will not execute. This can be used to specify the worst exchange rate you are willing to accept for the swap, providing additional protection against slippage.

2. **exactInput**
  - Contract Interface
  ```solidity
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another along the specified path
    /// @dev Setting `amountIn` to 0 will cause the contract to look up its own balance,
    /// and swap the entire amount, enabling contracts to send tokens before calling this function.
    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactInputParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
  ```

- Param  Explanation
    - **path** (bytes): This is an encoded byte array that represents the swap path you want to take. It includes the sequence of token addresses that you will swap through and the fees for each pool in the path. The path must start with the address of the token you are giving and end with the address of the token you want to receive.
    - **recipient** (address): This is the address that will receive the output token once the swap is complete. This can be the address of the person or contract that is initiating the swap, or it could be a different address if you are conducting the swap on someone else's behalf.
    - **amountIn** (uint256): This is the amount of the initial token that you are willing to swap. If you set this to 0, the contract will use the balance of the token that it holds at the time of the swap as the input amount, which allows for a pattern where tokens are sent to the contract before the swap is executed.
    - **amountOutMinimum** (uint256): This is the minimum amount of the final token in the swap path that you are willing to accept for your initial tokens. If the swap cannot achieve this minimum amount due to price changes or slippage, the transaction should revert. This parameter helps to manage slippage risk and ensures that you receive at least this amount or the transaction fails.

3. **exactOutputSingle**
 - Contract Interface
    ```
    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Swaps as little as possible of one token for `amountOut` of another token
    /// that may remain in the router after the swap.
    /// @param params The parameters necessary for the swap, encoded as `ExactOutputSingleParams` in calldata
    /// @return amountIn The amount of the input token
    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn);
    ```

  - Param  Explanation
    - **tokenIn** (address): The contract address of the token you are providing in the swap. This is what you are swapping away.
    - **tokenOut** (address): The contract address of the token you want to receive from the swap. This is what you are swapping for.
    - **fee** (uint24): The fee associated with the pool from which you're swapping your tokens, represented in basis points. This fee is paid to liquidity providers of the pool.
    - **recipient** (address): The address that will receive the tokenOut after the swap has been completed. This could be your own address or the address of someone else if you're performing the swap on their behalf.
    - **amountOut** (uint256): The exact amount of tokenOut that you wish to receive from the swap.
    - **amountInMaximum** (uint256): The maximum amount of tokenIn that you are willing to spend to receive the amountOut. This acts as a cap to protect you from spending too much in case of unfavorable price movements or slippage.
    - **sqrtPriceLimitX96** (uint160): A price limit in the form of the square root of the price, encoded in a fixed-point format. The swap will not occur if the price is worse than this price limit, which means you cannot be forced to accept a swap at an unfavorable rate.

4. **exactOutput**
 - Contract Interface
 ```solidity
    struct ExactOutputParams {
        bytes path;
        address recipient;
        uint256 amountOut;
        uint256 amountInMaximum;
    }

    /// @notice Swaps as little as possible of one token for `amountOut` of another along the specified path (reversed)
    /// that may remain in the router after the swap.
    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactOutputParams` in calldata
    /// @return amountIn The amount of the input token
    function exactOutput(ExactOutputParams calldata params) external payable returns (uint256 amountIn);
 ```
  - Param  Explanation
    - **path** (bytes): This is an encoded byte array specifying the path of tokens to swap through, reversed from the final token to the initial token. It includes the sequence of token addresses and pool fees for each intermediate swap.
    - **recipient** (address): The address that will receive the final output token once the swap is completed. This can be your own address or another address if you are executing the swap on behalf of someone else.
    - **amountOut** (uint256): The exact amount of the final token that you want to receive. This is the target amount that dictates the swap's execution.
    - **amountInMaximum** (uint256): The maximum amount of the initial token that you are willing to spend to obtain the amountOut. This parameter sets the upper limit on what you are prepared to trade away, providing protection against high slippage or unfavorable price changes.

#### 2.1.2 Transaction Hash Example
1. exactInput
https://www.vicscan.xyz/tx/0x298c8726f52c859a323ca30a63f654bc808f1213d5266d160f70519c84c3abae
2. exactOutput
https://www.vicscan.xyz/tx/0x2c61cf77d8e46293675e2ce14eb81a5efc006f20cef76a9c4a1a0e9f694658d0
3. exactInputSingle(use multicall)
https://www.vicscan.xyz/tx/0xb5b3f6db4053a065b57ee2e2e811f0fe1d587873457878ad494d64285de711fd
4. exactOutputSingle(use multicall)
https://www.vicscan.xyz/tx/0x44751c1cb46df4b7a699ee0e8bffe079715baea50773b4a142e1594c93060a91

### 2.2 Quoter
#### 2.2.1 Function Interface introduction
1. **exactInput**
  - Contract Interface
```solidity
function quoteExactInput(bytes memory path, uint256 amountIn)        
    external            
    returns (            
        uint256 amountOut,
        uint160[] memory sqrtPriceX96AfterList,
        uint32[] memory initializedTicksCrossedList,
        uint256 gasEstimate
    );
```
  - Param Explanation
    - **path**(bytes): A byte array encoding the token swap path and any additional data needed for the swap. This typically includes the addresses of the tokens in the swap path and may include other data specific to the swap routing.
    - **amountIn**(uint256): This is the amount of the initial token that you are willing to swap. If you set this to 0, the contract will use the balance of the token that it holds at the time of the swap as the input amount, which allows for a pattern where tokens are sent to the contract before the swap is executed.

2. **quoteExactInputSingle**
  - Contract Interface
    ```solidity
    struct QuoteExactInputSingleParams {
            address tokenIn;
            address tokenOut;
            uint256 amountIn;
            uint24 fee;
            uint160 sqrtPriceLimitX96;
        }

    /// @notice Returns the amount out received for a given exact input but for a swap of a single pool
    /// @param params The params for the quote, encoded as `QuoteExactInputSingleParams`
    /// tokenIn The token being swapped in
    /// tokenOut The token being swapped out
    /// fee The fee of the token pool to consider for the pair
    /// amountIn The desired input amount
    /// sqrtPriceLimitX96 The price limit of the pool that cannot be exceeded by the swap
    /// @return amountOut The amount of `tokenOut` that would be received
    /// @return sqrtPriceX96After The sqrt price of the pool after the swap
    /// @return initializedTicksCrossed The number of initialized ticks that the swap crossed
    /// @return gasEstimate The estimate of the gas that the swap consumes
    function quoteExactInputSingle(QuoteExactInputSingleParams memory params)
        external
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );
    ```
- Param Explanation
    - tokenIn (address): This is the contract address of the token that you are sending to the swap. It represents the "input" token in the trade.
    - tokenOut (address): This is the contract address of the token that you want to receive from the swap. This is the "output" token in the trade.
    - fee (uint24): This is the fee amount that will be paid for the swap, denoted in basis points. The fee is typically a small percentage of the trade amount, and it is paid to the liquidity providers of the pool.
    - amountIn (uint256): This is the amount of tokenIn that you want to swap. If you set amountIn to 0, the contract will use its own balance of tokenIn as the amount to be swapped.
    - sqrtPriceLimitX96 (uint160): This is a limit on the price to which the swap will occur. It's the square root of the price encoded in a fixed-point format. If the price exceeds this limit, the swap will not execute. This can be used to specify the worst exchange rate you are willing to accept for the swap, providing additional protection against slippage.

3. **quoteExactOutput**
  - Contract Interface
    ```solidity
    /// @notice Returns the amount in required for a given exact output swap without executing the swap
    /// @param path The path of the swap, i.e. each token pair and the pool fee. Path must be provided in reverse order
    /// @param amountOut The amount of the last token to receive
    /// @return amountIn The amount of first token required to be paid
    /// @return sqrtPriceX96AfterList List of the sqrt price after the swap for each pool in the path
    /// @return initializedTicksCrossedList List of the initialized ticks that the swap crossed for each pool in the path
    /// @return gasEstimate The estimate of the gas that the swap consumes
    function quoteExactOutput(bytes memory path, uint256 amountOut)
        external
        returns (
            uint256 amountIn,
            uint160[] memory sqrtPriceX96AfterList,
            uint32[] memory initializedTicksCrossedList,
            uint256 gasEstimate
        );

    ```
- Param Explanation
  - path(bytes): A byte array encoding the token swap path and any additional data needed for the swap. This typically includes the addresses of the tokens in the swap path and may include other data specific to the swap routing.
  - amountOut (uint256): The exact amount of the final token that you want to receive. This is the target amount that dictates the swap's execution.

4. **quoteExactOutputSingle**
  - Contract Interface
  ```solidity
    struct QuoteExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amount;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Returns the amount in required to receive the given exact output amount but for a swap of a single pool
    /// @param params The params for the quote, encoded as `QuoteExactOutputSingleParams`
    /// tokenIn The token being swapped in
    /// tokenOut The token being swapped out
    /// fee The fee of the token pool to consider for the pair
    /// amountOut The desired output amount
    /// sqrtPriceLimitX96 The price limit of the pool that cannot be exceeded by the swap
    /// @return amountIn The amount required as the input for the swap in order to receive `amountOut`
    /// @return sqrtPriceX96After The sqrt price of the pool after the swap
    /// @return initializedTicksCrossed The number of initialized ticks that the swap crossed
    /// @return gasEstimate The estimate of the gas that the swap consumes
    function quoteExactOutputSingle(QuoteExactOutputSingleParams memory params)
        external
        returns (
            uint256 amountIn,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );
  ```
  - Param  Explanation
    - tokenIn (address): The contract address of the token you are providing in the swap. This is what you are swapping away.
    - tokenOut (address): The contract address of the token you want to receive from the swap. This is what you are swapping for.
    - fee (uint24): The fee associated with the pool from which you're swapping your tokens, represented in basis points. This fee is paid to liquidity providers of the pool.
    - amountOut (uint256): The exact amount of tokenOut that you wish to receive from the swap.
    - sqrtPriceLimitX96 (uint160): A price limit in the form of the square root of the price, encoded in a fixed-point format. The swap will not occur if the price is worse than this price limit, which means you cannot be forced to accept a swap at an unfavorable rate.

#### 2.2.2 Transaction Hash
Quoter is used to do pre-swap, so just do simulation, so no transaction hash exists.

### 2.3 Position
#### 2.3.1 Function Interface introduction
1. Increase Liquidity
  - Contract Interface
  ```solidity
    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    /// @notice Increases the amount of liquidity in a position, with tokens paid by the `msg.sender`
    /// @param params tokenId The ID of the token for which liquidity is being increased,
    /// amount0Desired The desired amount of token0 to be spent,
    /// amount1Desired The desired amount of token1 to be spent,
    /// amount0Min The minimum amount of token0 to spend, which serves as a slippage check,
    /// amount1Min The minimum amount of token1 to spend, which serves as a slippage check,
    /// deadline The time by which the transaction must be included to effect the change
    /// @return liquidity The new liquidity amount as a result of the increase
    /// @return amount0 The amount of token0 to acheive resulting liquidity
    /// @return amount1 The amount of token1 to acheive resulting liquidity
    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        returns (
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );
  ```
- Param  Explanation
    - tokenId (uint256): Identifier of the token position for which liquidity is being increased. This ID is unique to the position within the liquidity pool and is used to track and manage the corresponding liquidity.
    - amount0Desired (uint256): The desired amount of token0 that the caller wishes to contribute to the liquidity pool. This value represents how much of token0 the caller is willing to spend to increase liquidity.
    - amount1Desired (uint256): Similar to amount0Desired, this is the desired amount of token1 that the caller is willing to contribute to the pool.
    - amount0Min (uint256): The minimum acceptable amount of token0 that must be spent to prevent significant price slippage. This parameter is crucial for ensuring that the caller does not experience unfavorable trade conditions due to market volatility.
    - amount1Min (uint256): The minimum acceptable amount of token1 that must be spent, serving the same purpose as amount0Min for token1.
    - deadline (uint256): A UNIX timestamp specifying the latest time by which the transaction must be mined for the liquidity increase to take effect. This safeguard prevents the transaction from being executed under possibly changed market conditions

2. Mint(Open Position)
  - Contract Interface
    ```solidity
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    /// @notice Creates a new position wrapped in a NFT
    /// @dev Call this when the pool does exist and is initialized. Note that if the pool is created but not initialized
    /// a method does not exist, i.e. the pool is assumed to be initialized.
    /// @param params The params necessary to mint a position, encoded as `MintParams` in calldata
    /// @return tokenId The ID of the token that represents the minted position
    /// @return liquidity The amount of liquidity for this position
    /// @return amount0 The amount of token0
    /// @return amount1 The amount of token1
    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );
    ```
  - Param  Explanation
    - token0 (address): The contract address of the first token in the token pair for which liquidity is being provided.
    - token1 (address): The contract address of the second token in the pair.
    - fee (uint24): The fee tier of the pool to which liquidity is being added. Fees are typically specified in basis points (e.g., 500 for a 0.05% fee).
    - tickLower (int24): The lower bound of the desired price range for the position. In the Uniswap v3 context, ticks are used to define price ranges within which liquidity is active.
    - tickUpper (int24): The upper bound of the price range.
    - amount0Desired (uint256): The desired amount of token0 to be contributed to the pool.
    - amount1Desired (uint256): The desired amount of token1 to be contributed.
    - amount0Min (uint256): The minimum amount of token0 that must be contributed, serving as a protection against slippage.
    - amount1Min (uint256): The minimum amount of token1 that must be contributed, similarly serving as slippage protection.
    - recipient (address): The address that will receive the NFT representing the liquidity position.
    - deadline (uint256): A UNIX timestamp indicating the latest time by which the transaction must be executed.

3. Decrease Liquidity 
  - Contract Interface
    ```solidity
    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    /// @notice Decreases the amount of liquidity in a position and accounts it to the position
    /// @param params tokenId The ID of the token for which liquidity is being decreased,
    /// amount The amount by which liquidity will be decreased,
    /// amount0Min The minimum amount of token0 that should be accounted for the burned liquidity,
    /// amount1Min The minimum amount of token1 that should be accounted for the burned liquidity,
    /// deadline The time by which the transaction must be included to effect the change
    /// @return amount0 The amount of token0 accounted to the position's tokens owed
    /// @return amount1 The amount of token1 accounted to the position's tokens owed
    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);
    ```
  - Param  Explanation
    - tokenId (uint256): The identifier of the token position from which liquidity is being withdrawn. This unique ID is associated with a specific liquidity provision within the pool.
    - liquidity (uint128): The magnitude of liquidity to be removed from the position. This value dictates how much of the position's current liquidity will be decreased.
    - amount0Min (uint256): The minimum amount of token0 that must be received for the liquidity being removed. This serves as a safeguard against slippage, ensuring that the liquidity provider does not receive less than this threshold.
    - amount1Min (uint256): Similar to amount0Min, this is the minimum amount of token1 that must be accounted for when the specified liquidity is removed from the pool.
    - deadline (uint256): A UNIX timestamp indicating the latest time by which the transaction must be executed to apply the liquidity decrease. This parameter is crucial for timing the operation according to market conditions and the liquidity provider's strategy.
4. Collect Fee
  - Contract Interface
    ```solidity
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    /// @notice Collects up to a maximum amount of fees owed to a specific position to the recipient
    /// @param params tokenId The ID of the NFT for which tokens are being collected,
    /// recipient The account that should receive the tokens,
    /// amount0Max The maximum amount of token0 to collect,
    /// amount1Max The maximum amount of token1 to collect
    /// @return amount0 The amount of fees collected in token0
    /// @return amount1 The amount of fees collected in token1
    function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1);
    ```
  - Param  Explanation
    - tokenId (uint256): The identifier of the NFT representing the liquidity position from which fees are being collected. This NFT ID is unique and directly correlates with a specific liquidity provision within the pool.
    - recipient (address): The address to which the collected fees will be sent. This allows the fees to potentially be directed to a different account than the one executing the transaction.
    - amount0Max (uint128): The maximum amount of the first token (token0) in the pair that should be collected as fees. This acts as a cap to prevent accidental collection of unexpected amounts.
    - amount1Max (uint128): Similar to amount0Max, this is the maximum amount of the second token (token1) that should be collected as fees.
5. Close position （burn）
  - Contract Interface
    ```solidity
    /// @notice Burns a token ID, which deletes it from the NFT contract. The token must have 0 liquidity and all tokens    
    /// must be collected first.    
    /// @param tokenId The ID of the token that is being burned    
    function burn(uint256 tokenId) external payable;
    ```
- Param  Explanation
    - tokenId (uint256): The unique identifier of the NFT that is to be burned. This ID corresponds to a specific liquidity position or other forms of representation within the NFT contract.

6. Stake
  Use safe_transfer_from to finish stake.
    - Contract Interface
    ```solidity
        function safeTransferFrom(
            address from,
            address to,
            uint256 tokenId
        ) internal {
        }
    ```
  -  Param Explannation
    - from(address): The address of user.
    - to(address): The contract address of MasterChefV3.
    - tokenId(address):  The unique identifier of the NFT that is to be staked. This ID corresponds to a specific liquidity position or other forms of representation within the NFT contract.

7. Collect Reward
  - Contract Interface
    ```solidity
    function harvest(uint256 _tokenId, address _to) external returns (uint256 reward)
    ```
  -  Param Explannation
    - _to(address): The address of user.
    - _tokenId(uint256):  The unique identifier of the NFT that is to collect reward. This ID corresponds to a specific liquidity position or other forms of representation within the NFT contract.
8. Unstake
  - Contract Interface
  ```solidity
  function withdraw(uint256 _tokenId, address _to) external returns (uint256 reward)
  ```
  -  Param Explannation
    - _tokenId(uint256):  The unique identifier of the NFT that is to unstake. This ID corresponds to a specific liquidity position or other forms of representation within the NFT contract.
    - _to(address): The address of user.

### 2.4 Pool
#### 2.4.1 Function Interface introduction
1. Create Pool
  - Contract Interface
  ```solidity
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external override returns (address pool) {
        require(tokenA != tokenB);
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0));
        int24 tickSpacing = feeAmountTickSpacing[fee];
        TickSpacingExtraInfo memory info = feeAmountTickSpacingExtraInfo[fee];
        require(tickSpacing != 0 && info.enabled, 'fee is not available yet');
        if (info.whitelistRequested) {
            require(_whiteListAddresses[msg.sender], 'user should be in the white list for this fee tier');
        }
        require(getPool[token0][token1][fee] == address(0));
        pool = IKuramaV3PoolDeployer(poolDeployer).deploy(address(this), token0, token1, fee, tickSpacing);
        getPool[token0][token1][fee] = pool;
        // populate mapping in the reverse direction, deliberate choice to avoid the cost of comparing addresses
        getPool[token1][token0][fee] = pool;
        emit PoolCreated(token0, token1, fee, tickSpacing, pool);
    }
  ```
  - Param  Explanation
    - tokenA (address): The contract address of the first token in the token pair for which liquidity is being provided.
    - tokenB(address): The contract address of the second token in the pair.
    - fee (uint24): The fee tier of the pool to which liquidity is being added. Fees are typically specified in basis points (e.g., 500 for a 0.05% fee).

## 4. Test Example
All tests example in ```/tests/**.test.ts```

## 3. Addition data
ABI files all in ```/src/abi/**.ts```