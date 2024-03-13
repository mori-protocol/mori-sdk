import { Address } from "viem"

export type ContractConfig = {
    MoriV3Factory: Address,
    MoriV3PoolDeployer: Address,
    SwapRouter: Address,
    NonfungibleTokenPositionDescriptor: Address,
    NonfungiblePositionManager: Address,
    MoriInterfaceMulticall: Address,
    V3Migrator: Address,
    TickLens: Address
    Quoter: Address
    MasterChefV3: Address
}

export const victionTestnetConfig: ContractConfig = {
    MoriV3Factory: "0xA997c0628e3412987815cfe6680eA2186979c768",
    MoriV3PoolDeployer: "0xe1d086909fb4901d1dBddEDacF09FC4a92DAc150",
    SwapRouter: "0xdae864089505C526F1ac87B3D1c8A4d7c7210543",
    NonfungibleTokenPositionDescriptor: "0xc12c6CBbc9c26D73399bc430fA9AD4365d523Ab4",
    NonfungiblePositionManager: "0x1f5119371Fe31280673Edc78Df45cd4805c8784d",
    MoriInterfaceMulticall: "0x3F8Bddd85b4e5B0CadEeAF52b5138ec07CabEccd",
    V3Migrator: "0x",
    TickLens: "0x",
    Quoter: "0xf89339E903480b89FFD41C9548EB07D6bE2FB6E1",
    MasterChefV3: "0x0c2D93F58971e988a283FDF9aA1aE77D3e3Accea"
}
