import { Abi, Address, createPublicClient, createWalletClient, defineChain, getContract, hexToBigInt, http, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { calculateGasMargin } from '../../src/utils/utils'
import { MethodParameters, Token } from '../../src/constants'
import { ContractConfig, bsquareHabitatTestnetConfig } from './contract_config'

export const tokens: Token[] = [
    {
        "name": "VICTION",
        "symbol": "VIC",
        "id": "0xC054751BdBD24Ae713BA3Dc9Bd9434aBe2abc1ce",
        "chainId": 88,
        "decimals": 18,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0xC054751BdBD24Ae713BA3Dc9Bd9434aBe2abc1ce.png",
        "isNative": true,
        "type": "vrc25",
        "labels": [],
        "wrapId": "0xC054751BdBD24Ae713BA3Dc9Bd9434aBe2abc1ce"
    },
    {
        "name": "Wrapped VICTION",
        "symbol": "WVIC",
        "id": "0xC054751BdBD24Ae713BA3Dc9Bd9434aBe2abc1ce",
        "wrapId": "0x0000000000000000000000000000000000000001",
        "chainId": 88,
        "decimals": 18,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0x0000000000000000000000000000000000000001.png",
        "isNative": false,
        "type": "vrc25",
        "labels": []
    },
    {
        "name": "Coin98",
        "symbol": "C98",
        "id": "0x0Fd0288AAAE91eaF935e2eC14b23486f86516c8C",
        "chainId": 88,
        "decimals": 18,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0x0Fd0288AAAE91eaF935e2eC14b23486f86516c8C.png",
        "isNative": false,
        "type": "vrc25",
        "labels": [],
        "wrapId": "0x0Fd0288AAAE91eaF935e2eC14b23486f86516c8C"
    },
    {
        "name": "Coin98 Dollar",
        "symbol": "CUSD",
        "id": "0xb3008E7156Ae2312b49B5200C3E1C3e80E529feb",
        "chainId": 88,
        "decimals": 6,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0xb3008E7156Ae2312b49B5200C3E1C3e80E529feb.png",
        "isNative": false,
        "type": "vrc25",
        "labels": [
            "Stablecoins"
        ],
        "wrapId": "0xb3008E7156Ae2312b49B5200C3E1C3e80E529feb"
    },
    {
        "name": "Bridged USDT (Arken)",
        "symbol": "USDT",
        "id": "0xBBbfAB9DcC27771d21D027F37f36B67cc4A25db0",
        "chainId": 88,
        "decimals": 18,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0xBBbfAB9DcC27771d21D027F37f36B67cc4A25db0.png",
        "isNative": false,
        "type": "vrc25",
        "labels": [
            "Stablecoins"
        ],
        "wrapId": "0xBBbfAB9DcC27771d21D027F37f36B67cc4A25db0"
    },
    {
        "name": "Bridged USDC (Arken)",
        "symbol": "USDC",
        "id": "0x20cC4574f263C54eb7aD630c9AC6d4d9068Cf127",
        "chainId": 88,
        "decimals": 6,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0x20cC4574f263C54eb7aD630c9AC6d4d9068Cf127.png",
        "isNative": false,
        "type": "vrc20",
        "labels": [
            "Stablecoins"
        ],
        "wrapId": "0x20cC4574f263C54eb7aD630c9AC6d4d9068Cf127"
    },
    {
        "name": "USDV",
        "symbol": "USDV",
        "id": "0x323665443CEf804A3b5206103304BD4872EA4253",
        "chainId": 88,
        "decimals": 6,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0x323665443CEf804A3b5206103304BD4872EA4253.png",
        "isNative": false,
        "type": "vrc20",
        "labels": [
            "Stablecoins"
        ],
        "wrapId": "0x323665443CEf804A3b5206103304BD4872EA4253"
    },
    {
        "name": "Arken Token",
        "symbol": "ARKEN",
        "id": "0x8998F9289757b7E0D3eA77581bb7D4630b4158bB",
        "chainId": 88,
        "decimals": 18,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0x8998F9289757b7E0D3eA77581bb7D4630b4158bB.png",
        "isNative": false,
        "type": "vrc25",
        "labels": [],
        "wrapId": "0x8998F9289757b7E0D3eA77581bb7D4630b4158bB"
    },
    {
        "name": "Bridged WETH (Arken)",
        "symbol": "WETH",
        "id": "0x9EDe19edE2baf93d25FBA4C8F58577E008b8F963",
        "chainId": 88,
        "decimals": 18,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0x9EDe19edE2baf93d25FBA4C8F58577E008b8F963.png",
        "isNative": false,
        "type": "vrc25",
        "labels": [],
        "wrapId": "0x9EDe19edE2baf93d25FBA4C8F58577E008b8F963"
    },
    {
        "name": "Saros",
        "symbol": "SAROS",
        "id": "0xB786D9c8120D311b948cF1e5Aa48D8fBacf477E2",
        "chainId": 88,
        "decimals": 18,
        "logoURI": "https://tokenlist.dojoswap.xyz/images/0xB786D9c8120D311b948cF1e5Aa48D8fBacf477E2.png",
        "isNative": false,
        "type": "vrc25",
        "labels": [],
        "wrapId": "0xB786D9c8120D311b948cF1e5Aa48D8fBacf477E2"
    }
]


export const bsquaredHabitatTestnet = defineChain({
    id: 89,
    name: 'Viction Testnet',
    network: 'Viction Testnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ["https://rpc-testnet.viction.xyz"],
        },
        public: {
            http: ["https://rpc-testnet.viction.xyz"],
        },
    },
    blockExplorers: {
        default: {
            name: 'Viction Testnet Explorers',
            url: "https://testnet.vicscan.xyz"
        },
    },
})

export const currPublicClient = createPublicClient({
    chain: bsquaredHabitatTestnet,
    transport: http()
})

export const currWalletClient = createWalletClient({
    chain: bsquaredHabitatTestnet,
    transport: http()
})

export const account = privateKeyToAccount('0x7656dea46927d34e85d4a4f75c11e5cd25e0aeba91829a2240125f0cf40ac22a')
// export const account = privateKeyToAccount('0x37740bb9c75495dcf596e2a0ecbe7d85647f34c12f67d5c739139b7744d23d6e')

export function buildtContractClient(abi: Abi, address: Address) {
    const contract = getContract({
        address,
        abi,
        client: currPublicClient,
    })
    return contract
}

export function buildtToken(symbol: string): Token {

    const list = tokens.filter((item) => {
        return item.symbol.toLocaleLowerCase() === symbol.toLocaleLowerCase()
    })
    return list[0]
}

export async function sendMulticall(
    parameters: MethodParameters,
    contractAddress: Address,
    onlyEstimateGas: boolean = false
) {
    console.log({ calldata: parameters.calldata, value: hexToBigInt(parameters.value) })

    const gasLimit = await currPublicClient.estimateGas({
        account,
        to: contractAddress,
        data: parameters.calldata,
        value: hexToBigInt(parameters.value),
    })
    console.log("gasLimit ", gasLimit);

    const fee = calculateGasMargin(gasLimit)
    if (!onlyEstimateGas) {
        const hex = await currWalletClient.sendTransaction({
            account,
            to: contractAddress,
            data: parameters.calldata,
            value: hexToBigInt(parameters.value),
            gas: fee,
        })
        return { hex }
    } else {
        return { fee }
    }
}

export function buildtContracConfig(): ContractConfig {
    return bsquareHabitatTestnetConfig
}

