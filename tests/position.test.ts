import { NonfungiblePositionManager } from '../src/NonfungiblePositionManager'
import { Percent } from '../src/fractions/percent'
import { account, buildtContracConfig, buildtToken, currPublicClient, sendMulticall } from './data/init_test_data'
import { CollectOptions, CreatePoolOptions, IncreaseSpecificOptions, MintOptions, RemoveSpecificOptions } from '../src/constants/type';
import { nearestUsableTick, priceToRatioX96, priceToTick, tryParsePrice } from '../src/utils';
import { MoriV3Pool } from '../src';

describe('Position', () => {
    const contractConfig = buildtContracConfig()

    // USDT-USDC-100
    const poolAddress = '0x0421ec0eede8ece97b27aa4a22d4197e11ce0c8e'
    const tokenId = 4n
    const token0 = buildtToken("USDT")
    const token1 = buildtToken("USDC")

    console.log(token0, token1)
    const recipient = account.address
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60000)
    const moriV3Pool = new MoriV3Pool(currPublicClient, poolAddress)
    const positionManager = new NonfungiblePositionManager(currPublicClient, contractConfig.NonfungiblePositionManager)

    test('getPosition', async () => {
        const position = await positionManager.getPosition(26n)
        console.log("position: ", position);
    })

    test('getOwnerTokenIds', async () => {
        const tokenIds = await positionManager.getOwnerTokenIds(account.address)
        console.log("tokenIds: ", tokenIds);
    })

    test('getOwnerPositions', async () => {
        const tokenIds = await positionManager.getOwnerPositions(account.address)
        console.log("tokenIds: ", tokenIds);
    })

    test('getOwnerOf', async () => {
        const res = await positionManager.getOwnerOf(185n)
        console.log('res: ', res)
    })

    test('only create ', async () => {
        const fee = 2500
        const price = "1.1"
        tryParsePrice(token0, token1,)
        const sqrtPriceX96 = priceToRatioX96(token0, token1, price)

        //createPool
        const createPool: CreatePoolOptions = {
            token0: token0.id,
            token1: token1.id,
            fee,
            sqrtPriceX96
        }

        const parameters = NonfungiblePositionManager.addCallParameters({
            createPool,
        })

        const respone = await sendMulticall(parameters, contractConfig.NonfungiblePositionManager, true)

        console.log("respone: ", respone);
    })


    test('calculateLiquidityByAmount ', async () => {
        const fee = 2500
        const tick_spacing = 50
        const price = "0.000625" // 1 usdt =  0.000625 eth
        const sqrtPriceX96 = priceToRatioX96(token0, token1, price)
        //createPool
        const createPool: CreatePoolOptions = {
            token0: token0.id,
            token1: token1.id,
            fee,
            sqrtPriceX96
        }
        console.log("createPool: ", createPool);
        // mint
        const curr_tick = priceToTick(tryParsePrice(token0, token1, price)!, tick_spacing)
        console.log("curr_tick: ", curr_tick);
        // const low_tick = 281000 
        // const high_tick = 285100 
        const low_tick = curr_tick - tick_spacing * 10
        const high_tick = curr_tick + tick_spacing * 10
        const percent = new Percent(1, 100)
        const fix_amount_0 = true
        const amount = "1000000"

        const mintResult = NonfungiblePositionManager.calculateLiquidityByAmount(sqrtPriceX96, low_tick, high_tick, amount, fix_amount_0, percent, false)
        console.log("mint: ", mintResult);
    })


    test('create and mint ', async () => {
        const fee = 500
        const tick_spacing = 10
        const price = "1"
        const sqrtPriceX96 = priceToRatioX96(token0, token1, price)
        //createPool
        const createPool: CreatePoolOptions = {
            token0: token0.id,
            token1: token1.id,
            fee,
            sqrtPriceX96
        }
        console.log("createPool: ", createPool);
        // mint
        const curr_tick = priceToTick(tryParsePrice(token0, token1, price)!, tick_spacing)
        // const low_tick = 281000 
        // const high_tick = 285100 
        const low_tick = nearestUsableTick(curr_tick - tick_spacing * 1000, tick_spacing)
        const high_tick = nearestUsableTick(curr_tick + tick_spacing * 1000, tick_spacing)
        const percent = new Percent(1, 100)
        const fix_amount_0 = false
        const amount = "100000"

        const mintResult = NonfungiblePositionManager.calculateLiquidityByAmount(sqrtPriceX96, low_tick, high_tick, amount, fix_amount_0, percent, false)

        const mint: MintOptions = {
            token0: token0.id,
            token1: token1.id,
            fee,
            tickLower: low_tick,
            tickUpper: high_tick,
            recipient,
            ...mintResult,
            deadline
        }
        console.log("mint: ", mint);
        let warpNativeAmount
        if (token0.isNative || token1.isNative) {
            warpNativeAmount = token0.isNative ? mintResult.amount0Desired : mintResult.amount1Desired
        }

        const parameters = NonfungiblePositionManager.addCallParameters({
            createPool,
            // mint,
            warpNativeAmount
        })

        console.log({ parameters })

        const respone = await sendMulticall(parameters, contractConfig.NonfungiblePositionManager, false)

        console.log("respone: ", respone);
    })


    test('mint', async () => {
        const pool = await moriV3Pool.buildPool()
        console.log("pool: ", pool);

        const tick_spacing = pool.tickSpacing
        // mint
        const curr_tick = pool.slot.tick
        const low_tick = nearestUsableTick(curr_tick + tick_spacing * 10, tick_spacing)
        const high_tick = nearestUsableTick(curr_tick + tick_spacing * 100, tick_spacing)
        const percent = new Percent(1, 100)
        const fix_amount_0 = true
        const amount = "1000000"

        const mintResult = NonfungiblePositionManager.calculateLiquidityByAmount(BigInt(pool.slot.sqrtPriceX96), low_tick, high_tick, amount, fix_amount_0, percent, false)

        const mint: MintOptions = {
            token0: token0.id,
            token1: token1.id,
            fee: Number(pool.fee),
            tickLower: low_tick,
            tickUpper: high_tick,
            recipient,
            ...mintResult,
            deadline
        }
        console.log("mint: ", mint);
        let warpNativeAmount
        if (token0.isNative || token1.isNative) {
            warpNativeAmount = token0.isNative ? mintResult.amount0Desired : mintResult.amount1Desired
        }

        const parameters = NonfungiblePositionManager.addCallParameters({
            mint,
            warpNativeAmount
        })

        console.log({ parameters })

        const respone = await sendMulticall(parameters, contractConfig.NonfungiblePositionManager)

        console.log("respone: ", respone);
    })




    test('increaseLiquidity', async () => {
        const slot0 = await moriV3Pool.getSlot0()
        console.log("slot0: ", slot0);
        const position = await positionManager.getPosition(tokenId)
        console.log("position: ", position);

        const low_tick = position.tickLower
        const high_tick = position.tickUpper
        const percent = new Percent(15, 1000)
        const fix_amount_0 = true
        const amount = "1000000"
        const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96)
        const liquidityResult = NonfungiblePositionManager.calculateLiquidityByAmount(sqrtPriceX96, low_tick, high_tick, amount, fix_amount_0, percent, false)

        const addLiquidity: IncreaseSpecificOptions = {
            tokenId,
            ...liquidityResult,
            deadline
        }
        console.log({ addLiquidity });

        let warpNativeAmount
        if (token0.isNative || token1.isNative) {
            warpNativeAmount = token0.isNative ? liquidityResult.amount0Desired : liquidityResult.amount1Desired
        }

        const parameters = NonfungiblePositionManager.addCallParameters({
            addLiquidity,
            warpNativeAmount
        })

        const respone = await sendMulticall(parameters, contractConfig.NonfungiblePositionManager)
        console.log("respone: ", respone);

    })


    test('decreaseLiquidity', async () => {
        const slot0 = await moriV3Pool.getSlot0()
        console.log("slot0: ", slot0);
        const position = await positionManager.getPosition(tokenId)
        console.log("position: ", position);
        const low_tick = position.tickLower
        const high_tick = position.tickUpper
        const percent = new Percent(15, 100)
        const liquidity = BigInt(position.liquidity)
        const liquidityResult = NonfungiblePositionManager.calculateAmountsByLiquidity(BigInt(slot0.sqrtPriceX96), low_tick, high_tick, liquidity, percent, false)

        const removeLiquidity: RemoveSpecificOptions = {
            liquidity,
            tokenId,
            deadline,
            amount0Min: liquidityResult.amount0Min,
            amount1Min: liquidityResult.amount1Min
        }
        console.log({ removeLiquidity });

        const feeResult = await positionManager.calculatePositionFee(tokenId, recipient)
        const collect: CollectOptions = {
            tokenId,
            recipient,
            amount0Max: feeResult.amount0,
            amount1Max: feeResult.amount1,
            token0: token0.id,
            token1: token1.id
        }
        console.log({ collect });

        const parameters = NonfungiblePositionManager.removeCallParameters({
            removeLiquidity,
            collect,
            useBurn: liquidity === position.liquidity
        })

        const respone = await sendMulticall(parameters, contractConfig.NonfungiblePositionManager)
        console.log("respone: ", respone);
    })

    test('collect', async () => {
        const feeResult = await positionManager.calculatePositionFee(tokenId, recipient)
        console.log("feeResult: ", feeResult);
        const collect: CollectOptions = {
            tokenId,
            recipient,
            amount0Max: feeResult.amount0,
            amount1Max: feeResult.amount1,
            token0: token0.id,
            token1: token1.id
        }

        const parameters = NonfungiblePositionManager.collectCallParameters(collect)

        const respone = await sendMulticall(parameters, contractConfig.NonfungiblePositionManager, true)
        console.log("respone: ", respone);
    })

    test('stake', async () => {
        const res = NonfungiblePositionManager.stakeCallParameters({
            sender: recipient,
            recipient: contractConfig.MasterChefV3,
            tokenId: 81n
        })

        const respone = await sendMulticall(res, contractConfig.NonfungiblePositionManager, false)
        console.log("respone: ", respone);
    })
})
