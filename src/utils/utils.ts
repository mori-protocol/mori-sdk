import { type Address, getAddress } from 'viem'
import invariant from 'tiny-invariant'
import warning from 'tiny-warning'
import { Percent } from '../fractions/percent'
import { Fraction } from '../fractions/fraction'
import Decimal from 'decimal.js-light'
import { type BigintIsh, Q192, ZERO, THREE, TWO, ONE, type Token, } from '../constants'
import { Price } from '../fractions/Price'
import { priceToTick, tickToPrice } from './priceTickConversions';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

// warns if addresses are not checksummed
// eslint-disable-next-line consistent-return
export function validateAndParseAddress(address: string): Address {
  try {
    const checksummedAddress = getAddress(address)
    warning(address === checksummedAddress, `${address} is not checksummed.`)
    return checksummedAddress
  } catch (error) {
    invariant(false, `${address} is not a valid address.`)
  }
}

export type TokenAmounts = {
  token0Amount: BigintIsh
  token1Amount: BigintIsh
}

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param n The numerator amount i.e., the amount of token1
 * @param {numerator, denominator} The Percent
 * @param adjustUp The rounding direction
 * @returns 
 */
export function adjustForSlippage(n: BigintIsh, { numerator, denominator }: Percent, adjustUp: boolean): bigint {
  if (adjustUp) {
    return new Fraction(n).multiply(new Fraction(denominator).add(numerator)).divide(denominator).quotient
  }
  return new Fraction(n).multiply(new Fraction(denominator).subtract(numerator)).divide(denominator).quotient
}

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param tokenAmount The token amounts
 * @param slippage The slippage
 * @param adjustUp The rounding direction
 * @returns 
 */
export function adjustForTokenSlippage(tokenAmount: TokenAmounts, slippage: Percent, adjustUp: boolean) {
  return {
    tokenLimit0: adjustForSlippage(tokenAmount.token0Amount, slippage, adjustUp),
    tokenLimit1: adjustForSlippage(tokenAmount.token1Amount, slippage, adjustUp),
  }
}

const FEE_BASE = 10n ** 4n

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param feeProtocol The fee protocol
 * @returns 
 */
export function parseProtocolFees(feeProtocol: number | string) {
  const packed = Number(feeProtocol)
  if (Number.isNaN(packed)) {
    throw new Error(`Invalid fee protocol ${feeProtocol}`)
  }

  const token0ProtocolFee = packed % 2 ** 16
  const token1ProtocolFee = packed >> 16
  return [new Percent(token0ProtocolFee, FEE_BASE), new Percent(token1ProtocolFee, FEE_BASE)]
}

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param amount1 The numerator amount i.e., the amount of token1
 * @param amount0 The denominator amount i.e., the amount of token0
 * @returns The sqrt ratio
 */
export function encodeSqrtRatioX96(amount1: BigintIsh, amount0: BigintIsh): bigint {
  const numerator = BigInt(amount1) << 192n
  const denominator = BigInt(amount0)
  const ratioX192 = numerator / denominator
  return sqrt(ratioX192)
}

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param sqrtRatioX96 The sqrt ratio
 * @returns Two amounts for token0 and token1
 */
export function decodeSqrtRatioX96(sqrtRatioX96: bigint): [bigint, bigint] {
  const ratioX192 = sqrtRatioX96 * sqrtRatioX96
  const amount1 = Q192
  const amount0 = ratioX192

  return [amount1, amount0]
}

/**
 * Calculate the price step
 * @param sqrtRatioX96 The sqrt ratio
 * @returns The price
 */
export function calculatePriceStep(
  price: Price<Token, Token>,
  tickSpacing: number
): string {
  const currTick = priceToTick(price, tickSpacing)

  const nextPrice = tickToPrice(price.baseToken, price.quoteToken, currTick + tickSpacing)
  return new Decimal(nextPrice.toSignificant(18)).sub(price.toSignificant(18)).toString()
}


/**
 * Return the direction of the token0 to token1
 * @param address0 
 * @param address1 
 * @returns 
 */
export function isDirect(address0: string, address1: string): boolean {
  return address0.toLocaleLowerCase() < address1.toLocaleLowerCase()
}

/**
 * Sqrt function
 * @param y 
 * @returns 
 */
export function sqrt(y: bigint): bigint {
  invariant(y >= ZERO, 'NEGATIVE')

  let z: bigint = ZERO
  let x: bigint
  if (y > THREE) {
    z = y
    x = y / TWO + ONE
    while (x < z) {
      z = x
      x = (y / x + x) / TWO
    }
  } else if (y !== ZERO) {
    z = ONE
  }
  return z
}

// add 10%
export function calculateGasMargin(value: bigint, margin = 1000n): bigint {
  return (value * (10000n + margin)) / 10000n
}
