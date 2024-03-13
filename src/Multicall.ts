import { type Address, type Hex, encodeFunctionData } from 'viem'
import { validateAndParseAddress } from './utils/utils'

const IMulticall = [
  {
    inputs: [
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
    ],
    name: 'multicall',
    outputs: [
      {
        internalType: 'bytes[]',
        name: 'results',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

export abstract class Multicall {
  public static ABI = IMulticall

  /**
   * Cannot be constructed.
   */
  private constructor() { }


  public static encodeMulticall(calldatas: Hex | Hex[]): Hex {
    if (!Array.isArray(calldatas)) {
      calldatas = [calldatas]
    }

    return calldatas.length === 1
      ? calldatas[0]
      : encodeFunctionData({ abi: Multicall.ABI, functionName: 'multicall', args: [calldatas] })
  }

  /**
   * ETH -> WETH
   * @returns 
   */
  public static encodeDepositETH() {
    return encodeFunctionData({
      abi: [
        { type: 'function', stateMutability: 'payable', outputs: [], name: 'deposit', inputs: [] }
      ],
      functionName: 'deposit',
    })
  }

  /**
   * WETH->eth
   * @returns 
   */
  public static encodeWithdrawETH(amount: bigint) {
    return encodeFunctionData({
      abi: [
        {
          type: 'function',
          stateMutability: 'nonpayable',
          outputs: [],
          name: 'withdraw',
          inputs: [{ type: 'uint256', name: 'amount', internalType: 'uint256' }],
        },
      ],
      functionName: 'withdraw',
      args: [amount],
    })
  }

  public static encodeRefundETH() {
    return encodeFunctionData({
      abi: [
        {
          inputs: [],
          name: 'refundETH',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'refundETH',
    })
  }

  public static encodeUnwrapWETH9(amountMinimum: bigint, recipient: Address) {
    recipient = validateAndParseAddress(recipient)

    return encodeFunctionData({
      abi: [
        {
          inputs: [
            { internalType: 'uint256', name: 'amountMinimum', type: 'uint256' },
            { internalType: 'address', name: 'recipient', type: 'address' },
          ],
          name: 'unwrapWETH9',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'unwrapWETH9',
      args: [amountMinimum, recipient],
    })
  }

  public static encodeSweepToken(tokenAddress: Address, amountMinimum: bigint, recipient: Address): `0x${string}` {
    recipient = validateAndParseAddress(recipient)
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amountMinimum', type: 'uint256' },
            { internalType: 'address', name: 'recipient', type: 'address' },
          ],
          name: 'sweepToken',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'sweepToken',
      args: [tokenAddress, amountMinimum, recipient],
    })
  }
}
