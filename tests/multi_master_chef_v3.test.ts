import { account, buildtContracConfig, buildtToken, currPublicClient, sendMulticall } from './data/init_test_data'
import { MultiMasterChefV3 } from '../src/MultiMasterChefV3';
import { Percent } from '../src/fractions/percent';
import { NonfungiblePositionManager } from '../src/NonfungiblePositionManager';
import { CollectOptions, IncreaseSpecificOptions, RemoveSpecificOptions } from '../src/constants/type';
import { MoriV3Pool } from '../src/MoriV3Pool';


describe('multi_master_chef_v3', () => {
    const contractConfig = buildtContracConfig()

    const poolAddress = '0x254dd746614f98b1259adc6395f2a14d0c8ed44c'
    const tokenId = 54n

    const token0 = buildtToken("VIC")
    const token1 = buildtToken("USDC")
    const recipient = account.address
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60000)
    const pool = new MoriV3Pool(currPublicClient, poolAddress)
    const masterChefV3 = new MultiMasterChefV3(currPublicClient, contractConfig.MasterChefV3)


    test('1 buildMasterPoolList', async () => {
        const poolList = await masterChefV3.buildMasterPoolList()
        console.log("poolList: ", poolList);
        poolList.forEach((item: any) => {
            console.log('item###', item)
            console.log('item###rewarderUSD####', item?.rewarderUSD)
        })
    })

    test('1 buildFormatPoolList', async () => {
        const poolList = await masterChefV3.buildFormatPoolList()
        console.log("poolList: ", poolList);
    })


    test('buildMasterPoolData', async () => {
        const data = await masterChefV3.buildMasterPoolData(1n)
        console.log("data: ", data);
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
        const tokenIds = await masterChefV3.getOwnerPositions("0xaD7F2538D44f6D9a5eA8dFEaB033FC419240E473")
        console.log("tokenIds: ", tokenIds);
    })

    test('getPoolRewarderInfo', async () => {
        const rewarderInfo = await masterChefV3.getPoolRewarderInfo(poolAddress)
        console.log("rewarderInfo: ", rewarderInfo);
    })


    test('calculateFarmingReward', async () => {
        const reward = await masterChefV3.calculateFarmingReward([122n], "0xaD7F2538D44f6D9a5eA8dFEaB033FC419240E473")
        console.log("reward: ", reward);
    })

    test('formatRewardPerSecond', async () => {
        console.log("formatRewardPerSecond: ", MultiMasterChefV3.formatRewardPerSecond(100000000000000000n, 6));

    })

    test('calculatePositionFee', async () => {
        const fees = await masterChefV3.calculatePositionFee(
            [54n],
            account.address
        )
        console.log("fees: ", fees);
    })

    test('batchHarvestCallParameters', async () => {
        const parameters = MultiMasterChefV3.batchHarvestCallParameters([{
            tokenId: tokenId,
            to: recipient
        }])

        const respone = await sendMulticall(parameters, contractConfig.MasterChefV3, true)
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
        const amount = "10000000000000000"
        const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96)
        const liquidityResult = NonfungiblePositionManager.calculateLiquidityByAmount(sqrtPriceX96, low_tick, high_tick, amount, fix_amount_0, percent, false)

        const addLiquidity: IncreaseSpecificOptions = {
            tokenId,
            ...liquidityResult,
            deadline
        }
        console.log({ addLiquidity });

        const feeResult = (await masterChefV3.calculatePositionFee([tokenId], recipient))[tokenId.toString()]
        const collect: CollectOptions = {
            tokenId,
            recipient,
            amount0Max: feeResult.amount0,
            amount1Max: feeResult.amount1,
            token0: token0.id,
            token1: token1.id
        }
        console.log({ collect });

        let warpNativeAmount
        if (token0.isNative || token1.isNative) {
            warpNativeAmount = token0.isNative ? liquidityResult.amount0Desired : liquidityResult.amount1Desired
        }

        const parameters = MultiMasterChefV3.addCallParameters({
            addLiquidity,
            recipient,
            collect,
            warpNativeAmount,
        })

        const respone = await sendMulticall(parameters, contractConfig.MasterChefV3, true)
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
        // const liquidity = BigInt(10000)
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
            token0: token0.id,
            token1: token1.id
        }
        console.log({ collect });

        const parameters = MultiMasterChefV3.removeCallParameters({
            removeLiquidity,
            collect,
            useBurn: true,
            recipient,
            unStake: false
        })

        const respone = await sendMulticall(parameters, contractConfig.MasterChefV3, true)
        console.log("respone: ", respone);
    })

    test('withdraw', async () => {
        const parameters = MultiMasterChefV3.withdrawCallParameters({
            tokenId,
            to: recipient
        })

        const respone = await sendMulticall(parameters, contractConfig.MasterChefV3)
        console.log("respone: ", respone);
    })

    test('burnCallParameters', async () => {
        const parameters = MultiMasterChefV3.burnCallParameters(tokenId
        )

        const respone = await sendMulticall(parameters, contractConfig.MasterChefV3)
        console.log("respone: ", respone);
    })
})
