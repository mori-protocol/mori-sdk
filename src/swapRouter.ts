import { SwapRouterABI } from './abi/SwapRouter'
import { TradeType, ONE, type Token, type MethodParameters } from './constants'
import { Fraction } from './fractions/fraction'
import { Percent } from './fractions/percent'
import { encodeFunctionData, toHex } from 'viem'

export abstract class SwapRouter {
  public static ABI = SwapRouterABI

  public static swapCallParameters(
    tokenA: Token,
    tokenB: Token,
    fee: string,
    recipient: string,
    deadline: string,
    tradeType: TradeType,
    inputAmount: string,
    outputAmount: string,
    slippage: Percent
  ): MethodParameters {
    const amountIn = tradeType === TradeType.EXACT_INPUT ? inputAmount : new Fraction(ONE).add(slippage).multiply(inputAmount).quotient.toString()
    const amountOut = tradeType === TradeType.EXACT_OUTPUT ? outputAmount : new Fraction(ONE).add(slippage).invert().multiply(outputAmount).quotient.toString()
    let result: any
    if (tradeType === TradeType.EXACT_INPUT) {
      result = {
        abi: this.ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn: tokenA.id,
          tokenOut: tokenB.id,
          fee,
          recipient,
          deadline,
          amountIn,
          amountOutMinimum: amountOut,
          sqrtPriceLimitX96: '0'
        }]
      }
    } else {
      result = {
        abi: this.ABI,
        functionName: 'exactOutputSingle',
        args: [{
          tokenIn: tokenA.id,
          tokenOut: tokenB.id,
          fee,
          recipient,
          deadline,
          amountOut,
          amountOutMinimum: amountIn,
          sqrtPriceLimitX96: '0'
        }]
      }
    }

    return {
      calldata: encodeFunctionData(result),
      value: toHex(0),
    }
  }
}