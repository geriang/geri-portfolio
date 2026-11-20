"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptCache = exports.PromptCache = void 0;
class PromptCache {
    cache = new Map();
    ttl = 5 * 60 * 1000; // 5 minutes TTL (optional)
    get(key) {
        const entry = this.cache.get(key);
        if (entry && Date.now() - entry.timestamp < this.ttl) {
            return entry.response;
        }
        this.cache.delete(key);
        return undefined;
    }
    set(key, response) {
        this.cache.set(key, { response, timestamp: Date.now() });
    }
}
exports.PromptCache = PromptCache;
// Export a singleton instance used by the chat route
exports.promptCache = new PromptCache();
