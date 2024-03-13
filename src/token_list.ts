import type { Token } from "./constants"

export const tokens: Token[] = [
    {
        "name": "Bitcoin",
        "symbol": "BTC",
        "id": "0x74c0d1DaB4E34339c7704C80A00651AfAd1fBd8f",
        "chainId": 1103,
        "decimals": 18,
        "logoURI": "https://bsquared-token.netlify.app/images/mori-habitat-test/0x74c0d1DaB4E34339c7704C80A00651AfAd1fBd8f.png",
        "isNative": true,
        "type": "erc-20",
        "labels": [],
        "wrapId": "0x74c0d1DaB4E34339c7704C80A00651AfAd1fBd8f"
    },
    {
        "name": "Wrapped BTC",
        "symbol": "WBTC",
        "id": "0x74c0d1DaB4E34339c7704C80A00651AfAd1fBd8f",
        "wrapId": "0x0000000000000000000000000000000000000001",
        "chainId": 1103,
        "decimals": 18,
        "logoURI": "https://bsquared-token.netlify.app/images/mori-habitat-test/0x0000000000000000000000000000000000000001.png",
        "isNative": false,
        "type": "erc-20",
        "labels": []
    },
    {
        "name": "USD Coin",
        "symbol": "USDC",
        "id": "0x18CB9a524564CeA5e8faD4dCa9Ad5DDe6cF212e3",
        "chainId": 1103,
        "decimals": 6,
        "logoURI": "https://bsquared-token.netlify.app/images/mori-habitat-test/0x18CB9a524564CeA5e8faD4dCa9Ad5DDe6cF212e3.png",
        "type": "erc-20",
        "labels": [
            "Stablecoins"
        ],
        "isNative": false,
        "wrapId": "0x18CB9a524564CeA5e8faD4dCa9Ad5DDe6cF212e3"
    },
    {
        "name": "ETH",
        "symbol": "WETH",
        "id": "0x17459858c5bAD5e97E48Eb831fa8B1096964b0d7",
        "chainId": 1103,
        "decimals": 18,
        "logoURI": "https://bsquared-token.netlify.app/images/mori-habitat-test/0x17459858c5bAD5e97E48Eb831fa8B1096964b0d7.png",
        "type": "erc-20",
        "labels": [],
        "isNative": false,
        "wrapId": "0x17459858c5bAD5e97E48Eb831fa8B1096964b0d7"
    },
    {
        "name": "Tether",
        "symbol": "USDT",
        "id": "0xe454776c60E63F987f287b97172884E4B1FB890a",
        "chainId": 1103,
        "decimals": 6,
        "logoURI": "https://bsquared-token.netlify.app/images/mori-habitat-test/0xe454776c60E63F987f287b97172884E4B1FB890a.png",
        "type": "erc-20",
        "labels": [
            "Stablecoins"
        ],
        "isNative": false,
        "wrapId": "0xe454776c60E63F987f287b97172884E4B1FB890a"
    }
]