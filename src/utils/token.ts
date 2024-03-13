import type { Token } from "../constants"
import { tokens } from "../token_list"


export function buildToken(symbol: string): Token {
    const list = tokens.filter((item) => {
        return item.symbol.toLocaleLowerCase() === symbol.toLocaleLowerCase()
    })
    return list[0]
}
