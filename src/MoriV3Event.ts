import {
    MasterChefV3AddPoolEventABI,
    decreaseLiquidityEventABI,
    increaseLiquidityEventABI,
    swapEventABI,
} from './abi/EventABI'
import type { Address, PublicClient } from 'viem'
import { EventType, type EventInfo, isSwapArg } from './constants/event'

export class MoriV3Event {
    public readonly publicClient: PublicClient
    private timeCache: Record<string, bigint> = {}

    public constructor(publicClient: PublicClient) {
        this.publicClient = publicClient
    }

    public async getEventRecords(
        address: Address[],
        type: EventType,
        fromBlock?: bigint,
        toBlock?: bigint
    ): Promise<EventInfo[]> {
        toBlock = toBlock !== undefined ? toBlock - 1n : await this.publicClient.getBlockNumber()

        let events = [increaseLiquidityEventABI, decreaseLiquidityEventABI, swapEventABI]

        if (fromBlock === undefined) {
            fromBlock = toBlock - 150000n
            if (fromBlock < 0n) {
                fromBlock = 0n
            }
        }

        switch (type) {
            case EventType.Swap:
                events = [swapEventABI]
                break
            case EventType.IncreaseLiquidity:
                events = [increaseLiquidityEventABI]
                break
            case EventType.DecreaseLiquidity:
                events = [decreaseLiquidityEventABI]
                break
            case EventType.MasterChefV3_AddPool:
                events = [MasterChefV3AddPoolEventABI]
                break
        }

        const logs = await this.publicClient.getLogs({
            address: address,
            events: events,
            fromBlock: fromBlock,
            toBlock: toBlock,
            strict: false
        })
        const list = (logs as unknown as EventInfo[]).sort((a, b) => Number(b.blockNumber - a.blockNumber))
        await this.verifyEventInfo(list)
        return list
    }

    public async getTimestampForBlock(blockNumber: bigint) {
        const block = await this.publicClient.getBlock({ blockNumber })
        return block.timestamp
    }

    private async verifyEventInfo(lists: EventInfo[]) {
        const requestTimePromiseList: { info: EventInfo; request: any }[] = []

        lists.forEach((item) => {
            if (isSwapArg(item.args)) {
                item.args.swap_a2b = BigInt(item.args.protocolFeesToken0) > 0n
            }
            const time = this.timeCache[item.blockNumber.toString()]
            if (time) {
                item.timestamp = time
            }
            requestTimePromiseList.push({
                info: item,
                request: this.getTimestampForBlock(item.blockNumber),
            })
        })
        const timeList = await Promise.all([...requestTimePromiseList.map((item) => item.request)])

        requestTimePromiseList.map((item, index) => {
            item.info.timestamp = timeList[index]
            this.timeCache[item.info.blockNumber.toString()] = item.info.timestamp
            return item
        })
    }
}
