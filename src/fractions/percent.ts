import type { BigintIsh, Rounding } from '../constants/internalConstant'
import { Fraction } from './fraction'


/**
 * Converts a fraction to a percent
 * @param fraction the fraction to convert
 */
function toPercent(fraction: Fraction): Percent {
    return new Percent(fraction.numerator, fraction.denominator)
}

export class Percent extends Fraction {
    /**
     * This boolean prevents a fraction from being interpreted as a Percent
     */
    public readonly isPercent = true as const

    add(other: Fraction | BigintIsh): Percent {
        return toPercent(super.add(other))
    }

    subtract(other: Fraction | BigintIsh): Percent {
        return toPercent(super.subtract(other))
    }

    multiply(other: Fraction | BigintIsh): Percent {
        return toPercent(super.multiply(other))
    }

    divide(other: Fraction | BigintIsh): Percent {
        return toPercent(super.divide(other))
    }

    public toSignificant(significantDigits = 5, format?: object, rounding?: Rounding): string {
        return super.multiply("100").toSignificant(significantDigits, format, rounding)
    }

    public toFixed(decimalPlaces = 2, format?: object, rounding?: Rounding): string {
        return super.multiply("100").toFixed(decimalPlaces, format, rounding)
    }
}
