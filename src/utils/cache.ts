import type { MultiMasterPool } from "src/MultiMasterChefV3";
import type { Token } from "src/constants";

export class CacheMap<T> {
    private readonly _cacheMap: Record<string, T> = {};

    set(key: string, value: T): void {
        this._cacheMap[key.toLocaleLowerCase()] = value;
    }

    get(key: string): T | undefined {
        return this._cacheMap[key.toLocaleLowerCase()];
    }

    getAllValues(): T[] {
        return Object.values(this._cacheMap);
    }
}


class MoriCacheMap {
    private readonly _tokenCache = new CacheMap<Token>()
    private readonly _FramsPoolCache = new CacheMap<MultiMasterPool>()

    setToken(key: string, value: Token): void {
        this._tokenCache.set(key, value)
    }

    getToken(key: string): Token | undefined {
        return this._tokenCache.get(key)
    }


    setFramsPool(key: string, value: MultiMasterPool): void {
        this._FramsPoolCache.set(key, value)
    }

    getFramsPool(key: string): MultiMasterPool | undefined {
        return this._FramsPoolCache.get(key)
    }

}


export const sdkCacheMap = new MoriCacheMap()
