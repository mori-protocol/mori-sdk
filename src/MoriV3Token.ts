import { type Hex, type PublicClient, encodeFunctionData, getContract, toHex, type Address } from 'viem'
import { erc20ABI } from './abi/Erc20ABI'
import { Multicall } from './Multicall'
import { sdkCacheMap } from './utils/cache'
import type { MethodParameters, Token } from './constants'

export class MoriV3Token {
  public static ABI = erc20ABI
  public readonly publicClient: PublicClient
  public readonly address: Address

  public constructor(publicClient: PublicClient, address: Address) {
    this.address = address
    this.publicClient = publicClient

  }

  /**
   * Read token information
   * @returns 
   */
  public async readToken(): Promise<Token> {
    const cacheToken = sdkCacheMap.getToken(this.address)
    if (cacheToken) {
      return cacheToken
    }
    const contract = getContract({
      address: this.address,
      abi: MoriV3Token.ABI,
      client: this.publicClient,
    })

    const [symbol, decimals, name] = await Promise.all([
      contract.read.symbol(),
      contract.read.decimals(),
      contract.read.name(),
    ])
    const token: Token = {
      name,
      id: this.address,
      wrapId: this.address,
      symbol,
      decimals,
      logoURI: "",
      isNative: false
    }
    sdkCacheMap.setToken(this.address, token)
    return token
  }

  /**
   * Get token balance
   * @param address The address of the account
   * @returns 
   */
  public async getTokenBalance(address: Address): Promise<bigint> {
    const contract = getContract({
      address: this.address,
      abi: MoriV3Token.ABI,
      client: this.publicClient,
    })
    this.publicClient.getBalance({ address: address })
    const balance = await contract.read.balanceOf([address])
    return balance
  }

  public async getBalance(address: Address): Promise<bigint> {
    const balance = await this.publicClient.getBalance({ address: address })
    return balance
  }

  /**
   * Verify and approve token transfer
   * @param owner 
   * @param spender 
   * @param amount 
   * @returns 
   */
  public async ensureSufficientAndApproveCallParameters(owner: Address, spender: Address, amount: bigint): Promise<MethodParameters | undefined> {
    const currtAllowance = await this.getAllowance(owner, spender)
    if (currtAllowance > amount) {
      return undefined
    }
    return MoriV3Token.approveCallParameters(spender, amount)
  }


  /**
   * Encode approve token transfer
   * @param owner 
   * @param spender 
   * @param amount 
   * @returns 
   */
  public async encodeEnsureSufficientAndApprove(owner: Address, spender: Address, amount: bigint): Promise<Hex | undefined> {
    const currtAllowance = await this.getAllowance(owner, spender)
    if (currtAllowance > amount) {
      return undefined
    }
    return MoriV3Token.encodeApprove(spender, amount)
  }


  /**
   * Get token allowance
   * @param owner 
   * @param spender 
   * @returns 
   */
  public async getAllowance(owner: Address, spender: Address): Promise<bigint> {
    const contract = getContract({
      address: this.address,
      abi: MoriV3Token.ABI,
      client: this.publicClient,
    })

    const allowanceAmount = await contract.read.allowance([owner, spender])
    return allowanceAmount
  }

  /**
   * Approve multicall parameters
   * @param spender 
   * @param amount 
   * @returns 
   */
  public static approveCallParameters(spender: Address, amount: bigint): MethodParameters {
    return {
      calldata: Multicall.encodeMulticall(MoriV3Token.encodeApprove(spender, amount)),
      value: toHex(0),
    }
  }

  /**
   * Encode approve token transfer
   * @param spender 
   * @param amount 
   * @returns 
   */
  public static encodeApprove(spender: Address, amount: bigint) {
    const hex = encodeFunctionData({
      abi: [
        {
          type: 'function',
          stateMutability: 'nonpayable',
          outputs: [{ type: 'bool', name: '', internalType: 'bool' }],
          name: 'approve',
          inputs: [
            { type: 'address', name: 'spender', internalType: 'address' },
            { type: 'uint256', name: 'amount', internalType: 'uint256' },
          ],
        }
      ],
      functionName: 'approve',
      args: [
        spender, amount
      ],
    })
    return hex
  }

  /**
   * Faucet multicall parameters
   * @param to
   * @returns 
   */
  public static faucetCallParameters(to: Address): MethodParameters {
    const hex = encodeFunctionData({
      abi: MoriV3Token.ABI,
      functionName: 'faucet',
      args: [to],
    })
    return {
      calldata: Multicall.encodeMulticall(hex),
      value: toHex(0),
    }
  }
}
