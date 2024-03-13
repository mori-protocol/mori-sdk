import { account, buildtContracConfig, buildtToken, currPublicClient, sendMulticall } from './data/init_test_data'
import { MasterChefV3 } from '../src/MasterChefV3';
import { Percent } from '../src/fractions/percent';
import { NonfungiblePositionManager } from '../src/NonfungiblePositionManager';
import { CollectOptions, IncreaseSpecificOptions, RemoveSpecificOptions } from '../src/constants/type';
import { MoriV3Pool } from '../src';


describe('master_chef_v3', () => {
    const contractConfig = buildtContracConfig()
    const poolAddress = '0x254dd746614f98b1259adc6395f2a14d0c8ed44c'
    const tokenId = 10n
    const USDT = buildtToken("USDT")
    const USDC = buildtToken("USDC")
    const recipient = account.address
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60000)
    const pool = new MoriV3Pool(currPublicClient, poolAddress)
    const masterChefV3 = new MasterChefV3(currPublicClient, contractConfig.MasterChefV3)


    test('buildMasterChefData', async () => {
        const data = await masterChefV3.buildMasterChefData()
        console.log("data: ", data);
    })

    test('buildMasterPoolData', async () => {
        const data = await masterChefV3.buildMasterPoolData(1n)
        console.log("data: ", data);
    })

    test('1 buildMasterPoolList', async () => {
        const poolList = await masterChefV3.buildMasterPoolList()
        console.log("poolList: ", poolList);
    })


    test('getPosition', async () => {
        const position = await masterChefV3.getPosition(tokenId)
        console.log("position: ", position);
    })

    test('getOwnerTokenIds', async () => {
        const tokenIds = await masterChefV3.getOwnerTokenIds(account.address)
        console.log("tokenIds: ", tokenIds);
    })

    test('getOwnerPositions', async () => {
        const tokenIds = await masterChefV3.getOwnerPositions(account.address)
        console.log("tokenIds: ", tokenIds);
    })

    test('calculateFarmingReward', async () => {
        const amount = await masterChefV3.calculateFarmingReward(
            [tokenId],
            account.address
        )
        console.log("amount: ", amount);
    })

    test('calculatePositionFee', async () => {
        const fees = await masterChefV3.calculatePositionFee(
            [tokenId],
            account.address
        )
        console.log("fees: ", fees);
    })

    test('1  getOwnerPositionsByPool', async () => {
        const posList = await masterChefV3.getOwnerPositionsByPool(account.address, poolAddress)
        console.log("posList: ", posList);
    })


    test('getRewardCoin', async () => {
        const coin = await masterChefV3.getRewardCoin()
        console.log("coin: ", coin);
    })



    test('batchHarvestCallParameters', async () => {
        const parameters = MasterChefV3.batchHarvestCallParameters([{
            tokenId: tokenId,
            to: recipient
        }])

        const respone = await sendMulticall(parameters, contractConfig.MasterChefV3)
        console.log({ respone })
    })


    test('increaseLiquidity', async () => {
        const slot0 = await pool.getSlot0()
        console.log("slot0: ", slot0);

        const position = await masterChefV3.getPosition(tokenId)
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
        if (USDT.isNative || USDC.isNative) {
            warpNativeAmount = USDT.isNative ? liquidityResult.amount0Desired : liquidityResult.amount1Desired
        }

        const parameters = MasterChefV3.addCallParameters({
            addLiquidity,
            warpNativeAmount,
        })

        const respone = await sendMulticall(parameters, contractConfig.MasterChefV3)
        console.log({ respone })
    })

    test('decreaseLiquidity', async () => {
        const slot0 = await pool.getSlot0()
        console.log("slot0: ", slot0);
        const position = await masterChefV3.getPosition(tokenId)
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

        const feeResult = (await masterChefV3.calculatePositionFee([tokenId], recipient))[tokenId.toString()]
        const collect: CollectOptions = {
            tokenId,
            recipient,
            amount0Max: feeResult.amount0,
            amount1Max: feeResult.amount1,
            token0: USDT.id,
            token1: USDC.id
        }
        console.log({ collect });

        const parameters = MasterChefV3.removeCallParameters({
            removeLiquidity,
            collect,
            useBurn: liquidity === position.liquidity,
            unStake: false
        })

        const respone = await sendMulticall(parameters, contractConfig.NonfungiblePositionManager)
        console.log("respone: ", respone);
    })
})
