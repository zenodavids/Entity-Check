const LEI_BASE = "https://api.gleif.org/api/v1";

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
export interface LeiRecord {
  lei: string;
  legalName: string;
  status: string;
  registrationAuthority?: string;
  legalJurisdiction?: string;
  entityStatus?: string;
  headquartersAddress?: { country?: string };
  modificationDate?: string;
  nextRenewalDate?: string;
}

interface GleifLeiRecord {
  id: string;
  attributes: {
    entity: {
      legalName: { name: string };
      status?: string;
      headquartersAddress?: { country?: string };
      legalJurisdiction?: string;
    };
    registration: {
      status: string;
      authority?: { name?: string };
      initialRegistrationDate?: string;
      lastUpdateDate?: string;
      nextRenewalDate?: string;
    };
  };
}

function mapRecord(r: GleifLeiRecord): LeiRecord {
  return {
    lei: r.id,
    legalName: r.attributes.entity.legalName.name,
    status: r.attributes.registration.status,
    registrationAuthority: r.attributes.registration.authority?.name,
    legalJurisdiction: r.attributes.entity.legalJurisdiction,
    entityStatus: r.attributes.entity.status,
    headquartersAddress: r.attributes.entity.headquartersAddress,
    modificationDate: r.attributes.registration.lastUpdateDate,
    nextRenewalDate: r.attributes.registration.nextRenewalDate,
  };
}

export async function lookupLei(lei: string): Promise<LeiRecord | null> {
  const clean = lei.replace(/\s/g, "");
  try {
    const res = await fetchWithTimeout(`${LEI_BASE}/lei-records/${clean}`, {
      headers: { Accept: "application/vnd.api+json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const record = json?.data;
    if (!record) return null;
    return mapRecord(record as GleifLeiRecord);
  } catch (err) {
    console.error("GLEIF lookupLei failed or timed out:", err);
    return null;
  }
}
export async function searchLeiByName(name: string): Promise<LeiRecord[]> {
  try {
    const res = await fetchWithTimeout(
      `${LEI_BASE}/lei-records?filter[entity.legalName]=${encodeURIComponent(name)}&page[size]=10`,
      { headers: { Accept: "application/vnd.api+json" } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const records = json?.data;
    if (!Array.isArray(records)) return [];
    return records.map(mapRecord);
  } catch (err) {
    console.error("GLEIF searchLeiByName failed or timed out:", err);
    return [];
  }
}

export function detectInputType(input: string): "lei" | "vat" | "name" {
  const trimmed = input.trim();
  if (/^[A-Z0-9]{20}$/i.test(trimmed)) return "lei";
  if (/^[A-Z]{2}\d{2,12}$/i.test(trimmed)) return "vat";
  return "name";
}
