import { type BigintIsh, MaxUint256, ZERO } from '../constants'
import { maxLiquidityForAmounts } from './maxLiquidityForAmounts'
import { SqrtPriceMath } from './sqrtPriceMath'
import { TickMath } from './tickMath'
/**
 * Get the amount of token0 received for a given amount of liquidity
 * @param sqrtPriceX96 the current price
 * @param tickLower the lower tick boundary
 * @param tickUpper the upper tick boundary
 * @param liquidity the liquidity amount
 * @returns 
 */
function getToken0Amount(sqrtPriceX96: bigint, tickLower: number, tickUpper: number, liquidity: bigint): BigintIsh {
  const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtPriceX96)
  if (tickCurrent < tickLower) {
    return SqrtPriceMath.getAmount0Delta(
      TickMath.getSqrtRatioAtTick(tickLower),
      TickMath.getSqrtRatioAtTick(tickUpper),
      liquidity,
      true
    )
  }
  if (tickCurrent < tickUpper) {
    return SqrtPriceMath.getAmount0Delta(
      sqrtPriceX96,
      TickMath.getSqrtRatioAtTick(tickUpper),
      liquidity,
      true
    )
  }
  return ZERO
}

/**
 * Get the amount of token1 received for a given amount of liquidity
 * @param sqrtPriceX96 the current price
 * @param tickLower the lower tick boundary
 * @param tickUpper the upper tick boundary
 * @param liquidity the liquidity amount
 * @returns 
 */
function getToken1Amount(sqrtPriceX96: bigint, tickLower: number, tickUpper: number, liquidity: bigint): BigintIsh {
  const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtPriceX96)
  if (tickCurrent < tickLower) {
    return ZERO
  }
  if (tickCurrent < tickUpper) {
    return SqrtPriceMath.getAmount1Delta(
      TickMath.getSqrtRatioAtTick(tickLower),
      sqrtPriceX96,
      liquidity,
      true
    )
  }
  return SqrtPriceMath.getAmount1Delta(
    TickMath.getSqrtRatioAtTick(tickLower),
    TickMath.getSqrtRatioAtTick(tickUpper),
    liquidity,
    true
  )
}


/**
 * The amount of token0 and token1 received for a given amount of liquidity
 * @param sqrtPriceX96 The current price
 * @param tickLower The lower tick boundary
 * @param tickUpper The upper tick boundary
 * @param liquidity The liquidity amount
 * @returns The amount of token0 and token1 received
 */
function getTokenAmountsFromLiquidity(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  liquidity: bigint
): { token0Amount: BigintIsh; token1Amount: BigintIsh } {
  return {
    token0Amount: getToken0Amount(sqrtPriceX96, tickLower, tickUpper, liquidity),
    token1Amount: getToken1Amount(sqrtPriceX96, tickLower, tickUpper, liquidity),
  }
}

/**
 * Get the liquidity amount for a given amount of token0
 * @param sqrtPriceX96 The current price
 * @param tickLower The lower tick boundary
 * @param tickUpper The upper tick boundary
 * @param amount0 The token0 amount
 * @returns 
 */
function getLiquidityFromTokenAmount0(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  amount0: BigintIsh
): { liquidity: bigint; token1Amount: BigintIsh } {

  const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
  const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)


  const liquidity = maxLiquidityForAmounts(
    sqrtPriceX96,
    sqrtRatioAX96,
    sqrtRatioBX96,
    amount0,
    MaxUint256,
    true
  )

  return {
    liquidity,
    token1Amount: getToken1Amount(sqrtPriceX96, tickLower, tickUpper, liquidity),
  }
}

/**
 * Get the liquidity amount for a given amount of token1
 * @param sqrtPriceX96 The current price
 * @param tickLower The lower tick boundary
 * @param tickUpper The upper tick boundary
 * @param amount1 The token1 amount
 * @returns The liquidity amount for two tokens.
 */
function getLiquidityFromTokenAmount1(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  amount1: BigintIsh
): { liquidity: bigint; token0Amount: BigintIsh } {

  const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
  const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)

  const liquidity = maxLiquidityForAmounts(
    sqrtPriceX96,
    sqrtRatioAX96,
    sqrtRatioBX96,
    MaxUint256,
    amount1,
    false
  )

  return {
    liquidity,
    token0Amount: getToken0Amount(sqrtPriceX96, tickLower, tickUpper, liquidity),
  }
}

/**
 * Get the liquidity amount for a given amount of token0 and token1
 * @param sqrtPriceX96 The current price
 * @param tickLower The lower tick boundary
 * @param tickUpper The upper tick boundary
 * @param amount0 The token0 amount
 * @param amount1 The token1 amount
 * @returns 
 */
function getLiquidityFromTokenAmounts(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  amount0: BigintIsh,
  amount1: BigintIsh
): bigint {

  const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
  const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)

  const liquidity = maxLiquidityForAmounts(
    sqrtPriceX96,
    sqrtRatioAX96,
    sqrtRatioBX96,
    amount0,
    amount1,
    false
  )

  return liquidity
}

export const PositionMath = {
  getToken0Amount,
  getToken1Amount,
  getTokenAmountsFromLiquidity,
  getLiquidityFromTokenAmount0,
  getLiquidityFromTokenAmount1,
  getLiquidityFromTokenAmounts
}
