import { getContract, type Address, type PublicClient } from 'viem'
import { moriV3FactoryABI } from './abi'
import type { Token } from './constants'

export class MoriV3Factory {
    public static ABI = moriV3FactoryABI
    public readonly publicClient: PublicClient
    public readonly contractAddress: Address

    public constructor(publicClient: PublicClient, contractAddress: Address) {
        this.publicClient = publicClient
        this.contractAddress = contractAddress
    }

    private buildContractClient() {
        return getContract({
            address: this.contractAddress,
            abi: MoriV3Factory.ABI,
            client: this.publicClient,
        })
    }

    public getPoolAddress(addressA: Address, addressB: Address, fee: number) {
        const poolAddress = this.buildContractClient().read.getPool([addressA, addressB, fee])
        return poolAddress
    }

    public static createPoolCallParameters(tokenA: Token, tokenB: Token, fee: number) {
        let result = {
            abi: this.ABI,
            functionName: 'createPool',
            args: [tokenA.address, tokenB.address, fee.toString()],
        }
        return result
    }
}


