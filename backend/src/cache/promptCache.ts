// Simple in‑memory cache for starter prompts
interface CacheEntry {
  response: any;
  timestamp: number;
}

export class PromptCache {
  private cache = new Map<string, CacheEntry>();
  private ttl = 5 * 60 * 1000; // 5 minutes TTL (optional)

  get(key: string) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.response;
    }
    this.cache.delete(key);
    return undefined;
  }

  set(key: string, response: any) {
    this.cache.set(key, { response, timestamp: Date.now() });
  }
}

// Export a singleton instance used by the chat route
export const promptCache = new PromptCache();
