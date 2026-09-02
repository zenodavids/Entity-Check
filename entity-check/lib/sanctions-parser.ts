import { SanctionsMatch, SdnEntry } from "./types";
import {
  cache,
  SANCTIONS_CACHE_KEY,
  SANCTIONS_CACHE_TTL,
  CachedSanctionsData,
} from "./cache";
import { findFuzzyMatches } from "./fuzzy-match";

const OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const UK_SANCTIONS_URL =
  "https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv";

function parseOfacXml(xml: string): SdnEntry[] {
  const entries: SdnEntry[] = [];
  const sdnBlocks = xml.split("<sdnEntry ");

  for (let i = 1; i < sdnBlocks.length; i++) {
    const block = sdnBlocks[i];
    const uidMatch = block.match(/<uid>(\d+)<\/uid>/);
    const firstNameMatch = block.match(/<firstName>([^<]*)<\/firstName>/);
    const lastNameMatch = block.match(/<lastName>(^$[^<]*<\/lastName>|<\/lastName>)/);
    const typeMatch = block.match(/<sdnType>([^<]*)<\/sdnType>/);

    if (!uidMatch || !firstNameMatch) continue;

    const firstName = firstNameMatch[1].trim();
    let lastName = "";
    if (lastNameMatch && lastNameMatch[1] !== "") {
      lastName = lastNameMatch[1].replace(/<\/lastName>/, "").trim();
    }

    const aliases: string[] = [];
    const aliasBlocks = block.split("<aka ");
    for (let j = 1; j < aliasBlocks.length; j++) {
      const aliasBlock = aliasBlocks[j];
      const aliasFirst = aliasBlock.match(/<firstName>([^<]*)<\/firstName>/);
      const aliasLast = aliasBlock.match(/<lastName>(^$[^<]*<\/lastName>|<\/lastName>)/);
      if (aliasFirst) {
        let aFirst = aliasFirst[1].trim();
        let aLast = "";
        if (aliasLast && aliasLast[1] !== "") {
          aLast = aliasLast[1].replace(/<\/lastName>/, "").trim();
        }
        const fullAlias = [aFirst, aLast].filter(Boolean).join(" ").trim();
        if (fullAlias) aliases.push(fullAlias);
      }
    }

    entries.push({
      uid: uidMatch[1],
      firstName,
      lastName,
      sdnType: typeMatch ? typeMatch[1].trim() : "Entity",
      aliases,
    });
  }

  return entries;
}

function parseUkCsv(csv: string): SdnEntry[] {
  const entries: SdnEntry[] = [];
  const lines = csv.split("\n");
  if (lines.length < 2) return entries;

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const nameIdx = header.findIndex((h) => h.includes("name"));
  const typeIdx = header.findIndex(
    (h) => h.includes("type") || h.includes("designation")
  );
  const aliasIdx = header.findIndex(
    (h) => h.includes("alias") || h.includes("also")
  );

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = nameIdx >= 0 ? cols[nameIdx] || "" : "";
    if (!name) continue;

    const parts = name.split(" ").filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");

    const aliases: string[] = [];
    if (aliasIdx >= 0 && cols[aliasIdx]) {
      aliases.push(
        ...cols[aliasIdx]
          .split(";")
          .map((a) => a.trim())
          .filter(Boolean)
      );
    }

    entries.push({
      uid: `UK-${i}`,
      firstName,
      lastName,
      sdnType: typeIdx >= 0 ? cols[typeIdx] || "Entity" : "Entity",
      aliases,
    });
  }

  return entries;
}

export async function refreshSanctionsData(): Promise<CachedSanctionsData> {
  const now = new Date().toISOString();

  let ofacXml = "";
  let ukCsv = "";

  try {
    const ofacRes = await fetch(OFAC_SDN_URL);
    if (ofacRes.ok) ofacXml = await ofacRes.text();
  } catch {}

  try {
    const ukRes = await fetch(UK_SANCTIONS_URL);
    if (ukRes.ok) ukCsv = await ukRes.text();
  } catch {}

  const ofacEntries = ofacXml ? parseOfacXml(ofacXml) : [];
  const ukEntries = ukCsv ? parseUkCsv(ukCsv) : [];

  const data: CachedSanctionsData = {
    ofacEntries,
    ukEntries,
    ofacVersion: now,
    ukVersion: now,
    lastRefresh: now,
  };

  cache.set(SANCTIONS_CACHE_KEY, data, SANCTIONS_CACHE_TTL);
  return data;
}

export async function getSanctionsData(): Promise<CachedSanctionsData> {
  const cached = cache.get<CachedSanctionsData>(SANCTIONS_CACHE_KEY);
  if (cached) return cached;
  return refreshSanctionsData();
}

export async function searchSanctions(
  query: string
): Promise<SanctionsMatch[]> {
  const data = await getSanctionsData();
  const matches: SanctionsMatch[] = [];

  const ofacCandidates = data.ofacEntries.map((e) => ({
    id: e.uid,
    name: `${e.firstName} ${e.lastName}`.trim(),
    extra: e.aliases.join("; "),
  }));

  const ofacMatches = findFuzzyMatches(query, ofacCandidates);
  for (const m of ofacMatches) {
    const entry = data.ofacEntries.find((e) => e.uid === m.id);
    if (entry) {
      matches.push({
        source: "OFAC SDN",
        entry,
        matchedAlias: m.extra || m.name,
        confidence: m.confidence,
        listVersion: data.ofacVersion,
        listUrl: OFAC_SDN_URL,
      });
    }
  }

  const ukCandidates = data.ukEntries.map((e) => ({
    id: e.uid,
    name: `${e.firstName} ${e.lastName}`.trim(),
    extra: e.aliases.join("; "),
  }));

  const ukMatches = findFuzzyMatches(query, ukCandidates);
  for (const m of ukMatches) {
    const entry = data.ukEntries.find((e) => e.uid === m.id);
    if (entry) {
      matches.push({
        source: "UK Sanctions List",
        entry,
        matchedAlias: m.extra || m.name,
        confidence: m.confidence,
        listVersion: data.ukVersion,
        listUrl: UK_SANCTIONS_URL,
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}
