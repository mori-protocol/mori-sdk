import { Price } from "../fractions/Price"
import { encodeSqrtRatioX96 } from "./utils"
import { TickMath } from "./tickMath"
import { nearestUsableTick } from "./nearestUsableTick"
import { priceToClosestTick } from "./priceTickConversions"
import type { Token } from "../constants"

/**
 * Tries to parse a price from a base token, quote token and a value
 * @param baseToken The base token
 * @param quoteToken The quote token
 * @param value The value to parse
 * @returns 
 */
export function tryParsePrice(baseToken?: Token, quoteToken?: Token, value?: string) {
  if (!baseToken || !quoteToken || !value) {
    return undefined
  }

  if (!value.match(/^\d*\.?\d+$/)) {
    return undefined
  }

  const [whole, fraction] = value.split('.')

  const decimals = fraction?.length ?? 0
  const withoutDecimals = BigInt((whole ?? '') + (fraction ?? ''))

  return new Price(
    baseToken,
    quoteToken,
    BigInt(10 ** decimals) * BigInt(10 ** baseToken.decimals),
    withoutDecimals * BigInt(10 ** quoteToken.decimals)
  )
}

/**
 * Tries to parse a tick from a base token, quote token, tick spacing and a value
 * @param baseToken The base token
 * @param quoteToken The quote token
 * @param tickSpacing The tick spacing
 * @param value The value to parse
 * @returns 
 */
export function tryParseTick(baseToken?: Token, quoteToken?: Token, tickSpacing?: number, value?: string): number | undefined {
  if (!baseToken || !quoteToken || !tickSpacing || !value) {
    return undefined
  }

  const price = tryParsePrice(baseToken, quoteToken, value)

  if (!price) {
    return undefined
  }

  let tick: number

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)

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


