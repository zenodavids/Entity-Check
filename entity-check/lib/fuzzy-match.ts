function jaroDistance(s1: string, s2: string): number {
  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchWindow = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);

  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const low = Math.max(0, i - matchWindow);
    const high = Math.min(i + matchWindow + 1, len2);

    for (let j = low; j < high; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) /
    3
  );
}

export function jaroWinkler(s1: string, s2: string, prefixScale = 0.1): number {
  const jaro = jaroDistance(s1, s2);

  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * prefixScale * (1 - jaro);
}

export function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function findFuzzyMatches(
  query: string,
  candidates: Array<{ name: string; id: string; extra?: string }>,
  threshold = 0.75
): Array<{ id: string; name: string; confidence: number; extra?: string }> {
  const normalizedQuery = normalizeString(query);
  const matches: Array<{
    id: string;
    name: string;
    confidence: number;
    extra?: string;
  }> = [];

  for (const candidate of candidates) {
    const normalizedName = normalizeString(candidate.name);
    const score = jaroWinkler(normalizedQuery, normalizedName);

    if (score >= threshold) {
      matches.push({
        id: candidate.id,
        name: candidate.name,
        confidence: Math.round(score * 100),
        extra: candidate.extra,
      });
    }

    if (candidate.extra) {
      const aliases = candidate.extra.split(";").map((a) => a.trim());
      for (const alias of aliases) {
        if (!alias) continue;
        const normalizedAlias = normalizeString(alias);
        const aliasScore = jaroWinkler(normalizedQuery, normalizedAlias);
        if (aliasScore >= threshold) {
          matches.push({
            id: candidate.id,
            name: candidate.name,
            confidence: Math.round(aliasScore * 100),
            extra: alias,
          });
        }
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}
