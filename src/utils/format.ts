import Decimal from "decimal.js-light"
import { parseUnits } from "ethers"

export function sanitizeNumericalString(numStr: string) {
  return numStr.replace(/[^0-9.]|\.(?=.*\.)/g, "")
}
export function maxDecimals(amount: string, decimals: bigint = BigInt(18)) {
  const sanitizedAmount = sanitizeNumericalString(amount)
  const indexOfDecimal = sanitizedAmount.indexOf(".")
  if (indexOfDecimal === -1) {
    return sanitizedAmount
  }

  const wholeAmountStr = sanitizedAmount.slice(0, indexOfDecimal) || "0"
  const wholeAmount = BigInt(wholeAmountStr).toString()

  const fractionalAmount = sanitizedAmount.slice(indexOfDecimal + 1)
  const decimalAmount = decimals !== BigInt(0) ? `.${fractionalAmount.slice(0, Number(decimals))}` : ""

  return `${wholeAmount}${decimalAmount}`
}

export function fixedDecimals(amount: string, decimals: bigint = BigInt(18)) {
  if (amount === "") {
    return amount
  }
  const mdAmount = maxDecimals(amount, decimals)
  return mdAmount
}

export function amountToBN(amount: string | number | undefined, decimals: bigint = BigInt(18)): bigint {
  try {
    const fixedAmount = fixedDecimals(amount ? amount.toString() : "", decimals)
    return parseUnits(fixedAmount || "0", decimals)
  } catch (e) {
    return BigInt(0)
  }
}

export function fixedPrice(amount: string, decimals: bigint = BigInt(18)) {
  if (amount === "") {
    return amount
  }
  amount = new Decimal(amount).toFixed(Number(decimals) + 1)
  const mdAmount = maxDecimals(amount, decimals)
  if (Number(mdAmount) === 0) {
    return getMinimumDigit(decimals).toFixed(Number(decimals))
  }
  return mdAmount.replace(/\.?0+$/, '')
}


export function getMinimumDigit(precision: bigint): number {
  if (precision <= 0) {
    throw 0;
  }

  const minimumDigit = 1 / Math.pow(10, Number(precision));

  return minimumDigit;
}