
// constants used internally but not expected to be used externally
export const NEGATIVE_ONE = BigInt(-1)

// used in liquidity amount math
export const Q96 = 2n ** 96n
export const Q192 = Q96 ** 2n

// used in fee calculation
export const MAX_FEE = 10n ** 6n
export const Q128 = 2n ** 128n

// exports for external consumption
export type BigintIsh = bigint | number | string

export const MAX_UINT128 = 2n ** 128n - 1n

export enum TradeType {
    EXACT_INPUT,
    EXACT_OUTPUT,
}

export enum Rounding {
    ROUND_DOWN,
    ROUND_HALF_UP,
    ROUND_UP,
}

export const MINIMUM_LIQUIDITY = 1000n

// exports for internal consumption
export const ZERO = 0n
export const ONE = 1n
export const TWO = 2n
export const THREE = 3n
export const FIVE = 5n
export const TEN = 10n
export const _100 = 100n
export const _9975 = 9975n
export const _10000 = 10000n

export const MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

export enum VMType {
    uint8 = 'uint8',
    uint256 = 'uint256',
}

export const VM_TYPE_MAXIMA = {
    [VMType.uint8]: BigInt('0xff'),
    [VMType.uint256]: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
}
