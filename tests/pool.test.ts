import { account, buildtContracConfig, currPublicClient, currWalletClient, buildtToken } from './data/init_test_data';
import { zeroAddress } from 'viem';
import { MoriV3Factory, MoriV3Pool } from '../src'

describe('Pool', () => {
    const contractConfig = buildtContracConfig()
    const USDT = buildtToken("USDT")
    const USDC = buildtToken("USDC")
    const moriV3Factory = new MoriV3Factory(currPublicClient, contractConfig.MoriV3Factory)

    test('getPoolAddress', async () => {
        const poolAddress = await moriV3Factory.getPoolAddress(USDT.id, USDC.id, 100)

        console.log("poolAddress: ", poolAddress);
    })

    test('createPoolCallParameters', async () => {
        const fee = 2500
        const poolAddress = await moriV3Factory.getPoolAddress(USDT.id, USDC.id, fee)
        if (poolAddress !== zeroAddress) {
            throw Error(`the Pool has created , the pool address is ${poolAddress}`)
        }

        const res: any = MoriV3Factory.createPoolCallParameters(USDT, USDC, fee)
        console.log("args: ", res);

        const respone = await currWalletClient.writeContract({
            address: contractConfig.MoriV3Factory,
            ...res,
            account,
        })

        console.log("respone: ", respone);
    })

    test('getSlot0', async () => {
        const moriV3Pool = new MoriV3Pool(currPublicClient, "0x254dd746614f98b1259adc6395f2a14d0c8ed44c")
        const slot = await moriV3Pool.getSlot0()
        console.log("slot: ", slot);
    })

    test('buildPool', async () => {
        const moriV3Pool = new MoriV3Pool(currPublicClient, "0x254dd746614f98b1259adc6395f2a14d0c8ed44c")
        const pool = await moriV3Pool.buildPool()
        console.log("pool: ", pool);
    })
})
