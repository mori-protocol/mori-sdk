import { type Token, TradeType } from './constants'
import { amountToBN } from './utils/format'
import { QuoterABI } from './abi/QuoterABI'
import { type Address, type PublicClient, getContract } from 'viem'

export class SwapQuoter {
  public static ABI = QuoterABI
  public readonly publicClient: PublicClient
  public readonly contractAddress: Address

  public constructor(publicClient: PublicClient, contractAddress: Address) {
    this.publicClient = publicClient
    this.contractAddress = contractAddress
  }

  private buildContractClinet() {
    return getContract({
      address: this.contractAddress,
      abi: SwapQuoter.ABI,
      client: this.publicClient,
    })
  }

  public async quoteCallParameters(tokenA: Token,
    tokenB: Token,
    tradeType: TradeType,
    amount: string,
    fee: string) {

    const amountIn = amountToBN(amount, BigInt(tradeType === TradeType.EXACT_INPUT ? tokenA.decimals : tokenB.decimals))

    try {
      const contract = getContract({
        address: this.contractAddress,
        abi: SwapQuoter.ABI,
        client: this.publicClient,
      })
      let res
      if (tradeType === TradeType.EXACT_INPUT) {
        res = await contract.simulate.quoteExactInputSingle(
          [
            {
              tokenIn: tokenA.id,
              tokenOut: tokenB.id,
              amountIn: amountIn,
              fee: Number(fee),
              sqrtPriceLimitX96: BigInt(0)
            },
          ],
        )
      } else {
        res = await contract.simulate.quoteExactOutputSingle(
          [
            {
              tokenIn: tokenA.id,
              tokenOut: tokenB.id,
              amount: amountIn,
              fee: Number(fee),
              sqrtPriceLimitX96: BigInt(0)
            },
          ],
        )
      }

      return res.result
    } catch (error) {
      console.log("quoteCallParameters error: ", { error, amount, fee, contractAddress: this.contractAddress, abi: SwapQuoter.ABI });

    }

    return undefined
  }

  public static quoteCallParameters(
    tokenA: Token,
    tokenB: Token,
    tradeType: TradeType,
    amount: string,
    fee: string,
  ) {
    const amountIn = amountToBN(amount, BigInt(tradeType === TradeType.EXACT_INPUT ? tokenA.decimals : tokenB.decimals))
    const functionName = tradeType === TradeType.EXACT_INPUT ? 'quoteExactInputSingle' : 'quoteExactOutputSingle'

    const result = {
      abi: QuoterABI,
      functionName,
      args: [
        {
          tokenIn: tokenA.address,
          tokenOut: tokenB.address,
          amount: amountIn,
          fee: BigInt.asUintN(24, BigInt(fee)),
          sqrtPriceLimitX96: '0'
        }
      ]
    }
    return result
  }
}