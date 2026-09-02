import { LeiRecord, LeiSearchResult } from "./types";
import { cache, LEI_CACHE_TTL } from "./cache";

const GLEIF_BASE = "https://api.gleif.org/api/v1";

export function detectInputType(query: string): "lei" | "vat" | "name" {
  const cleaned = query.replace(/[\s\-]/g, "").toUpperCase();
  if (/^[0-9A-Z]{20}$/.test(cleaned)) return "lei";
  const vatPatterns = [
    /^[A-Z]{2}\d{8,12}$/,
    /^[A-Z]{2}\d{[A-Z0-9]{2,14}}$/,
  ];
  if (vatPatterns.some((p) => p.test(query.replace(/\s/g, "").toUpperCase()))) {
    return "vat";
  }
  return "name";
}

export async function lookupLei(lei: string): Promise<LeiRecord | null> {
  const cacheKey = `lei:${lei}`;
  const cached = cache.get<LeiRecord>(cacheKey);
  if (cached) return cached;

  const cleaned = lei.replace(/[\s\-]/g, "").toUpperCase();
  const url = `${GLEIF_BASE}/lei-records/${cleaned}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.api+json" },
      next: { revalidate: LEI_CACHE_TTL / 1000 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const attrs = json.data?.attributes;
    if (!attrs) return null;

    const record: LeiRecord = {
      lei: attrs.lei,
      legalName: attrs.entity?.legalName?.name || "Unknown",
      entityStatus: attrs.entity?.status || "UNKNOWN",
      registrationStatus: attrs.registration?.status || "UNKNOWN",
      jurisdiction: attrs.entity?.jurisdiction || "UNKNOWN",
      legalAddress: formatAddress(attrs.entity?.legalAddress),
      headquartersAddress: formatAddress(attrs.entity?.headquartersAddress),
      entityCategory: attrs.entity?.category,
      legalForm: attrs.entity?.legalForm,
      entityCreationDate: attrs.entity?.creationDate,
      lastUpdateTime: attrs.registration?.lastUpdateDate || new Date().toISOString(),
      source: "GLEIF",
      sourceUrl: `https://search.gleif.org/#/record/${attrs.lei}`,
    };

    cache.set(cacheKey, record, LEI_CACHE_TTL);
    return record;
  } catch {
    return null;
  }
}

export async function searchLeiByName(
  name: string
): Promise<LeiSearchResult[]> {
  const cacheKey = `lei-search:${name.toLowerCase()}`;
  const cached = cache.get<LeiSearchResult[]>(cacheKey);
  if (cached) return cached;

  const url = `${GLEIF_BASE}/lei-records?filter[entity.legalName]=${encodeURIComponent(name)}&page[size]=10`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.api+json" },
    });

    if (!res.ok) return [];

    const json = await res.json();
    const results: LeiSearchResult[] = (json.data || []).map(
      (item: Record<string, unknown>) => {
        const attrs = item.attributes as Record<string, unknown>;
        const entity = attrs?.entity as Record<string, unknown> | undefined;
        const legalName = entity?.legalName as Record<string, unknown> | undefined;
        return {
          lei: attrs?.lei as string,
          legalName: (legalName?.name as string) || "Unknown",
          jurisdiction: (entity?.jurisdiction as string) || "UNKNOWN",
          entityStatus: (entity?.status as string) || "UNKNOWN",
        };
      }
    );

    cache.set(cacheKey, results, LEI_CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}

function formatAddress(addr: Record<string, unknown> | undefined): string | undefined {
  if (!addr) return undefined;
  const parts: string[] = [];
  if (addr.addressLines && Array.isArray(addr.addressLines)) {
    parts.push(...(addr.addressLines as string[]));
  }
  if (addr.city) parts.push(addr.city as string);
  if (addr.region) parts.push(addr.region as string);
  if (addr.country) parts.push(addr.country as string);
  if (addr.postalCode) parts.push(addr.postalCode as string);
  return parts.length > 0 ? parts.join(", ") : undefined;
}
