import { buildtToken } from './data/init_test_data'
import { priceToClosestTick, priceToRatioX96, priceToTick, tickToPrice } from '../src/utils/priceTickConversions';
import { TickMath } from '../src/utils';
import { Price } from '../src/fractions/Price';

const token0 = buildtToken("USDT")
const token1 = buildtToken("USDC")
const token2 = buildtToken("WBTC")


describe('tickToPrice', () => {

    test('1800 t0/1 t1', async () => {
        const price = tickToPrice(token1, token0, -74959)
        console.log({ price });
        const tick = priceToClosestTick(price)
        console.log({ tick });
        const tick2 = TickMath.getTickAtSqrtRatio(priceToRatioX96(price.baseToken, price.quoteToken, "1800"))
        console.log({ tick2 });
    })

})


describe('priceToTick', () => {
    test('1800 t0/1 t1', async () => {
        const price = new Price(token1, token0, 1, 1800)
        console.log({ price: price.toSignificant(5) });
        const tick = priceToTick(price, 1)
        console.log({ tick });
    })

    test('t', async () => {
        const text = "0.2d"
        const str = text.replace(/[^\d.]+|(\..*)\./g, '$1');
        console.log({ str });
    })
})
