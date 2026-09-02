import { jaroWinkler, normalizeForMatch } from "./fuzzy-match";
import { SdnEntry } from "./types";
import {
  getSdnEntries,
  setSdnEntries,
  getUkEntries,
  setUkEntries,
  getSdnLastRefresh,
  getUkLastRefresh,
  SANCTIONS_TTL,
} from "./cache";

const SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const UK_URL = "https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv";

export interface SanctionMatch {
  source: "OFAC SDN" | "UK Sanctions List";
  matchedName: string;
  score: number;
  entryType?: string;
  programs?: string[];
  remarks?: string;
  country?: string;
}

export type { SdnEntry } from "./types";

function parseSdnXml(xml: string): SdnEntry[] {
  const entries: SdnEntry[] = [];
  const entryBlocks = xml.split("<sdnEntry>");

  for (let i = 1; i < entryBlocks.length; i++) {
    const block = entryBlocks[i].split("</sdnEntry>")[0];
    const firstName = extractTag(block, "firstName") || "";
    const lastName = extractTag(block, "lastName") || "";
    const sdnType = extractTag(block, "sdnType") || "";
    const remarks = extractTag(block, "remarks") || "";
    const title = extractTag(block, "title") || undefined;
    const dateOfBirth = extractTag(block, "dateOfBirth") || undefined;
    const nationality = extractTag(block, "nationality") || undefined;

    const programs: string[] = [];
    const progMatches = block.matchAll(/<program[^>]*>([^<]*)<\/program>/g);
    for (const m of progMatches) {
      if (m[1].trim()) programs.push(m[1].trim());
    }

    if (firstName || lastName) {
      entries.push({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        sdnType: sdnType.trim(),
        programs,
        remarks: remarks.trim(),
        title,
        dateOfBirth,
        nationality,
      });
    }
  }
  return entries;
}

function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return match?.[1] || undefined;
}

export function buildSdnIndex(entries: SdnEntry[]): Map<string, SdnEntry[]> {
  const index = new Map<string, SdnEntry[]>();
  for (const entry of entries) {
    const full = `${entry.firstName} ${entry.lastName}`.trim();
    const normalized = normalizeForMatch(full);
    const tokens = normalized.split(" ");
    for (const token of tokens) {
      if (token.length < 2) continue;
      const existing = index.get(token) || [];
      existing.push(entry);
      index.set(token, existing);
    }
    const combined = normalized.replace(/\s/g, "");
    if (combined.length >= 2) {
      const existing = index.get(combined) || [];
      existing.push(entry);
      index.set(combined, existing);
    }
  }
  return index;
}

async function fetchAndParseSdn(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(SDN_URL, {
      headers: { "User-Agent": "EntityCheck/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`OFAC SDN fetch failed: ${res.status}`);
    const xml = await res.text();
    const entries = parseSdnXml(xml);
    const index = buildSdnIndex(entries);
    setSdnEntries(index);
  } catch (err) {
    console.error("Failed to refresh OFAC SDN data:", err);
  }
}

function parseUkCsv(csv: string): string[][] {
  const lines: string[][] = [];
  let current = "";
  let inQuotes = false;
  const row: string[] = [];

  const rows: string[][] = [];
  let fields: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"' && csv[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else if (ch === "\n" || (ch === "\r" && csv[i + 1] === "\n")) {
        if (ch === "\r") i++;
        fields.push(current.trim());
        if (fields.length > 1) rows.push(fields);
        fields = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }
  if (current || fields.length > 0) {
    fields.push(current.trim());
    if (fields.length > 1) rows.push(fields);
  }

  return rows;
}

async function fetchAndParseUk(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(UK_URL, {
      headers: { "User-Agent": "EntityCheck/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`UK sanctions fetch failed: ${res.status}`);
    const csv = await res.text();
    const rows = parseUkCsv(csv);
    setUkEntries(rows);
  } catch (err) {
    console.error("Failed to refresh UK sanctions data:", err);
  }
}

export async function ensureSanctionsData(): Promise<void> {
  const sdnAge = Date.now() - getSdnLastRefresh();
  const ukAge = Date.now() - getUkLastRefresh();
  const stale = sdnAge > SANCTIONS_TTL || getSdnEntries().size === 0;
  const ukStale = ukAge > SANCTIONS_TTL || getUkEntries().length === 0;

  if (stale && ukStale) {
    await Promise.all([fetchAndParseSdn(), fetchAndParseUk()]);
  } else if (stale) {
    await fetchAndParseSdn();
  } else if (ukStale) {
    await fetchAndParseUk();
  }
}

export function matchSanctions(query: string): SanctionMatch[] {
  const normalized = normalizeForMatch(query);
  const matches: SanctionMatch[] = [];
  const seen = new Set<string>();

  const sdnIndex = getSdnEntries();
  const tokens = normalized.split(" ").filter((t) => t.length >= 2);

  const candidates = new Set<string>();
  for (const token of tokens) {
    for (const [key, entries] of sdnIndex) {
      if (key.includes(token) || token.includes(key)) {
        for (const entry of entries) {
          const fullName = `${entry.firstName} ${entry.lastName}`.trim();
          candidates.add(normalizeForMatch(fullName));
        }
      }
    }
  }

  if (candidates.size === 0) {
    for (const [key, entries] of sdnIndex) {
      for (const entry of entries) {
        const fullName = `${entry.firstName} ${entry.lastName}`.trim();
        candidates.add(normalizeForMatch(fullName));
      }
    }
  }

  for (const candidate of candidates) {
    const score = jaroWinkler(normalized, candidate);
    if (score >= 0.8) {
      const key = `sdn:${candidate}`;
      if (seen.has(key)) continue;
      seen.add(key);

      for (const [_, entries] of sdnIndex) {
        for (const entry of entries) {
          const fullName = `${entry.firstName} ${entry.lastName}`.trim();
          if (normalizeForMatch(fullName) === candidate) {
            matches.push({
              source: "OFAC SDN",
              matchedName: fullName,
              score,
              entryType: entry.sdnType,
              programs: entry.programs,
              remarks: entry.remarks,
              country: entry.nationality,
            });
            break;
          }
        }
      }
    }
  }

  const ukEntries = getUkEntries();
  for (const row of ukEntries) {
    if (row.length < 2) continue;
    const name = row[0] || row[1] || "";
    const normalizedName = normalizeForMatch(name);
    if (!normalizedName) continue;

    const score = jaroWinkler(normalized, normalizedName);
    if (score >= 0.8) {
      const key = `uk:${normalizedName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      matches.push({
        source: "UK Sanctions List",
        matchedName: name,
        score,
        entryType: row[2] || undefined,
        programs: row[3] ? [row[3]] : [],
        country: row[4] || undefined,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

export async function refreshSanctions(): Promise<{ refreshed: boolean }> {
  await Promise.all([fetchAndParseSdn(), fetchAndParseUk()]);
  return { refreshed: true };
}
