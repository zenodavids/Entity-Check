import { SdnEntry } from "./types";

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, fetchedAt: Date.now(), ttlMs });
}

const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const SIX_HOURS = 6 * ONE_HOUR;

export const SANCTIONS_TTL = SIX_HOURS;
export const LEI_TTL = ONE_HOUR;
export const VAT_TTL = FIVE_MIN;

const sdnEntries = new Map<string, SdnEntry[]>();
let sdnLastRefresh = 0;
let ukEntries: string[][] = [];
let ukLastRefresh = 0;

export function getSdnEntries() { return sdnEntries; }
export function setSdnEntries(entries: Map<string, SdnEntry[]>) {
  sdnEntries.clear();
  entries.forEach((v, k) => sdnEntries.set(k, v));
  sdnLastRefresh = Date.now();
}
export function getSdnLastRefresh() { return sdnLastRefresh; }

export function getUkEntries() { return ukEntries; }
export function setUkEntries(entries: string[][]) {
  ukEntries = entries;
  ukLastRefresh = Date.now();
}
export function getUkLastRefresh() { return ukLastRefresh; }

export function isSanctionsStale(): boolean {
  const maxAge = SANCTIONS_TTL;
  return (
    Date.now() - sdnLastRefresh > maxAge ||
    (ukEntries.length > 0 && Date.now() - ukLastRefresh > maxAge) ||
    sdnEntries.size === 0
  );
}
