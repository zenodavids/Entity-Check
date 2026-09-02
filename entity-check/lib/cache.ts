interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new MemoryCache();

export const SANCTIONS_CACHE_KEY = "sanctions-data";
export const SANCTIONS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export const LEI_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
export const VAT_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export interface CachedSanctionsData {
  ofacEntries: Array<{
    uid: string;
    firstName: string;
    lastName: string;
    sdnType: string;
    remarks?: string;
    aliases: string[];
  }>;
  ukEntries: Array<{
    uid: string;
    firstName: string;
    lastName: string;
    sdnType: string;
    remarks?: string;
    aliases: string[];
  }>;
  ofacVersion: string;
  ukVersion: string;
  lastRefresh: string;
}
