export async function invokeWithCache<T, Args extends any[]>(
    kv: KVNamespace,
    cacheKey: string,
    invoke: (...args: Args) => Promise<T>,
    args: Args
): Promise<T> {
    // Generate a cache key based on the arguments. This simplistic approach may need refinement for complex objects.
    let results: T;
    const cacheResult = await kv.get(cacheKey);
    if (cacheResult) {
        console.debug("Cache hit for args:", args);
        results = JSON.parse(cacheResult);
    } else {
        results = await invoke(...args);
        await kv.put(cacheKey, JSON.stringify(results), {
            expirationTtl: 24 * 3600, // 24 hours
        });
    }
    return results;
}
