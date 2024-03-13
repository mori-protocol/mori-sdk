import { TickMath } from './tickMath'
import { Price } from '../fractions/Price'
import { encodeSqrtRatioX96, isDirect } from './utils'
import { nearestUsableTick } from './nearestUsableTick'
import { tryParsePrice } from './v3'
import { Q192, type Token } from '../constants'

/**
 * Returns a price object corresponding to the input tick and the base/quote token
 * Inputs must be tokens because the address order is used to interpret the price represented by the tick
 * @param baseToken the base token of the price
 * @param quoteToken the quote token of the price
 * @param tick the tick for which to return the price
 */
export function tickToPrice(baseToken: Token, quoteToken: Token, tick: number): Price<Token, Token> {
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick)

  const ratioX192 = sqrtRatioX96 * sqrtRatioX96

  return isDirect(baseToken.id, quoteToken.id)
    ? new Price(baseToken, quoteToken, Q192, ratioX192)
    : new Price(baseToken, quoteToken, ratioX192, Q192)
}

/**
 * Converts a price to the closest tick that is a multiple of the tickSpacing
 * @param price The price for two tokens
 * @param tickSpacing The spacing of the pool
 * @returns The closest tick that is a multiple of the tickSpacing
 */
export function priceToTick(price: Price<Token, Token>, tickSpacing: number): number {

  let tick: number

  // check price is within min/max bounds, if outside return min/max
  const sorted = isDirect(price.baseToken.id, price.quoteToken.id)

  const sqrtRatioX96 = sorted
    ? encodeSqrtRatioX96(price.numerator, price.denominator)
    : encodeSqrtRatioX96(price.denominator, price.numerator)

  if (sqrtRatioX96 >= TickMath.MAX_SQRT_RATIO) {
    tick = TickMath.MAX_TICK
  } else if (sqrtRatioX96 <= TickMath.MIN_SQRT_RATIO) {
    tick = TickMath.MIN_TICK
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price)
  }

  return nearestUsableTick(tick, tickSpacing)
}

/**
 * Converts a price to a ratioX96
 * @param baseToken The base token
 * @param quoteToken The quote token
 * @param value The value to convert
 * @returns The ratioX96
 */
export function priceToRatioX96(baseToken: Token, quoteToken: Token, value: string): bigint {

  const price = tryParsePrice(baseToken, quoteToken, value)!

  const sorted = isDirect(price.baseToken.id, price.quoteToken.id)

  const sqrtRatioX96 = sorted
    ? encodeSqrtRatioX96(price.numerator, price.denominator)
    : encodeSqrtRatioX96(price.denominator, price.numerator)

  if (sqrtRatioX96 >= TickMath.MAX_SQRT_RATIO) {
    return TickMath.MAX_SQRT_RATIO
  } else if (sqrtRatioX96 <= TickMath.MIN_SQRT_RATIO) {
    return TickMath.MIN_SQRT_RATIO
  } else {
    return sqrtRatioX96
  }
}


/**
 * Returns the first tick for which the given price is greater than or equal to the tick price
 * @param price for which to return the closest tick that represents a price less than or equal to the input price,
 * i.e. the price of the returned tick is less than or equal to the input price
 * @returns the closest tick that represents a price less than or equal to the input price
 */
export function priceToClosestTick(price: Price<Token, Token>): number {
  const sorted = isDirect(price.baseToken.id, price.quoteToken.id)

  const sqrtRatioX96 = sorted
    ? encodeSqrtRatioX96(price.numerator, price.denominator)
    : encodeSqrtRatioX96(price.denominator, price.numerator)

  let tick = TickMath.getTickAtSqrtRatio(sqrtRatioX96)

  const nextTickPrice = tickToPrice(price.baseToken, price.quoteToken, tick + 1)
  if (sorted) {
    if (!price.lessThan(nextTickPrice)) {
      tick++
    }
  } else if (!price.greaterThan(nextTickPrice)) {
    tick++
  }
  return tick
}
