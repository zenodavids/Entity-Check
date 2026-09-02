export interface SdnEntry {
  uid: string;
  firstName: string;
  lastName: string;
  sdnType: string;
  remarks?: string;
  aliases: string[];
}

export interface SanctionsMatch {
  source: "OFAC SDN" | "UK Sanctions List";
  entry: SdnEntry;
  matchedAlias: string;
  confidence: number;
  listVersion: string;
  listUrl: string;
}

export interface LeiRecord {
  lei: string;
  legalName: string;
  entityStatus: string;
  registrationStatus: string;
  jurisdiction: string;
  legalAddress?: string;
  headquartersAddress?: string;
  entityCategory?: string;
  legalForm?: string;
  entityCreationDate?: string;
  lastUpdateTime: string;
  source: string;
  sourceUrl: string;
}

export interface LeiSearchResult {
  lei: string;
  legalName: string;
  jurisdiction: string;
  entityStatus: string;
}

export interface VatResult {
  isValid: boolean | null;
  countryCode: string;
  vatNumber: string;
  requesterNumber?: string;
  name?: string;
  address?: string;
  identifier?: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
}

export interface CheckResult {
  query: string;
  queryType: "lei" | "vat" | "name";
  lei?: LeiRecord | null;
  vat?: VatResult | null;
  sanctions?: SanctionsMatch[];
  timestamp: string;
}

export interface BatchItem {
  query: string;
  status: "pending" | "complete" | "error";
  result?: CheckResult;
  error?: string;
}
