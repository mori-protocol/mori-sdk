import { account, buildtContracConfig, buildtToken, currPublicClient, sendMulticall } from './data/init_test_data'
import { calculatePriceStep } from '../src/utils/utils';
import { getMinimumDigit } from '../src/utils/format';
import { Rounding, Token } from '../src/constants';
import { tryParsePrice, tryParseTick } from '../src/utils/v3';
import { tickToPrice } from '../src/utils/priceTickConversions';
import { MoriV3Token } from '../src';

describe('Token', () => {
    const contractConfig = buildtContracConfig()
    const USDT = buildtToken("USDT")
    const moriV3Token = new MoriV3Token(currPublicClient, USDT.id)

    test('ensureSufficientAndApproveCallParameters', async () => {
        const res = await moriV3Token.ensureSufficientAndApproveCallParameters(account.address, contractConfig.MasterChefV3, 1000000000000000000n)
        if (res) {
            const respone = await sendMulticall(res, moriV3Token.address)
            console.log("respone: ", respone);
        } else {
            console.log("balance enough");
        }
    })

    test('getAllowance', async () => {
        const currtAllowance = await moriV3Token.getAllowance(account.address, contractConfig.NonfungiblePositionManager)
        console.log("currtAllowance", currtAllowance);
    })

    test('approveCallParameters', async () => {

        const res = MoriV3Token.approveCallParameters(contractConfig.NonfungiblePositionManager, 200000000000000000n)
        const respone = await sendMulticall(res, moriV3Token.address)
        console.log("respone: ", respone);

    })

    test('faucet', async () => {

        const res: any = MoriV3Token.faucetCallParameters(account.address)

        const respone = await sendMulticall(res, moriV3Token.address)
        console.log("respone: ", respone);
    })


    test('readToken', async () => {
        const res = await moriV3Token.readToken()
        console.log("args: ", res);
    })

    test('getTokenBalance', async () => {
        const balance = await moriV3Token.getTokenBalance(account.address)
        console.log("balance: ", balance);
    })

    test('getBalance', async () => {
        const balance = await moriV3Token.getBalance(account.address)
        console.log("balance: ", balance);
    })




    const token0: Token = buildtToken("WBTC")
    const token1: Token = buildtToken("USDC")

    test('test calculatePriceStep', async () => {
        const step = calculatePriceStep(tryParsePrice(token0, token1, "0.2")!, 50)
        console.log("step: ", step);
    })

    test('test tickToPrice', async () => {
        const price = tickToPrice(token0, token1, -86)
        console.log("price: ", price.toSignificant(28));
    })


    test('test tryParseTick', async () => {
        const price = tickToPrice(token0, token1, 3).toSignificant(5, undefined, Rounding.ROUND_UP)
        const fixPrice = Number(price) + getMinimumDigit(BigInt(token1.decimals))
        console.log("price: ", fixPrice);

        const tick = tryParseTick(token0, token1, 50, fixPrice.toString())!
        console.log("tick: ", tick);
    })
})
