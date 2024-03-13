import { buildtContracConfig, currPublicClient } from './data/init_test_data'
import { Address } from 'viem';
import { EventType } from '../src/constants';
import { MasterChefV3AddPoolEventABI } from '../src/abi/EventABI';
import { MoriV3Event } from '../src/MoriV3Event';

describe('Event Record', () => {
    const contractConfig = buildtContracConfig()
    const moriV3Event = new MoriV3Event(currPublicClient)
    const pools: Address[] = ["0x200DA8F420Aec8223BB1cA57F80A0B132286FCF8"]

    test('DecreaseLiquidity getEventRecords', async () => {
        const datas = await moriV3Event.getEventRecords(pools, EventType.DecreaseLiquidity)
        console.log('datas: ', datas, datas.length)
    })

    test('IncreaseLiquidity getEventRecords', async () => {
        const datas = await moriV3Event.getEventRecords(pools, EventType.IncreaseLiquidity)
        console.log('datas: ', datas, datas.length)
    })

    test('Swap getEventRecords', async () => {
        const datas = await moriV3Event.getEventRecords(pools, EventType.Swap)
        console.log('datas: ', datas, datas.length)
    })

    test('MasterChefV3_AddPool getEventRecords', async () => {
        const datas = await moriV3Event.getEventRecords([contractConfig.MasterChefV3], EventType.MasterChefV3_AddPool, 0n)
        console.log('datas: ', datas, datas.length)
    })

    test('getLogs', async () => {
        const toBlock = await currPublicClient.getBlockNumber()
        //  const fromBlock = toBlock - 3000n

        const logs = await currPublicClient.getLogs({
            address: ["0x232675fC4587E13Ad9e9E50bFd0a3f6C00d5814c"],
            events: [MasterChefV3AddPoolEventABI],
            fromBlock: 3000n,
            toBlock: 6100n,
        })
        console.log("logs: ", logs);
    })
})
