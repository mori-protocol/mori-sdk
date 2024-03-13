import { SwapRouter } from '../src/swapRouter'
import { SwapQuoter } from '../src/quoter'
import { Token, TradeType } from '../src/constants'
import { Percent } from '../src/fractions/percent'
import { buildtContracConfig, buildtToken, currPublicClient, sendMulticall } from './data/init_test_data'

describe('SwapRouter', () => {
    const contractConfig = buildtContracConfig()
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60000)

    const USDT = buildtToken("USDT")
    const USDC = buildtToken("USDC")

    it('1 sigle-hop exact input', async () => {
        const swapQuoter = new SwapQuoter(currPublicClient, contractConfig.Quoter)
        const res = await swapQuoter.quoteCallParameters(
            USDC,
            USDT,
            TradeType.EXACT_INPUT,
            '100',
            "100",
        )

        console.log('res####', res)
        //20150305434n
        //20150305434n
    })

    it('sigle-hop exact input', async () => {
        const slippage = new Percent(15, 10000)
        const params = SwapRouter.swapCallParameters(
            USDT,
            USDC,
            '100',
            '0x0CcfeFb7197c9f23f845656eEd8e53BF549b7F75',
            deadline.toString(),
            TradeType.EXACT_INPUT,
            '100000000',
            '0',
            slippage
        )

        const response = await sendMulticall(params, contractConfig.SwapRouter, false)

        console.log('res####', response)

    })

})