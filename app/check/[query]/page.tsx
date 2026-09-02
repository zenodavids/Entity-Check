"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ResultPanel from "@/components/ResultPanel";
import MatchDetail from "@/components/MatchDetail";
import UnavailableState from "@/components/UnavailableState";
import SummaryStrip from "@/components/SummaryStrip";
import SearchBar from "@/components/SearchBar";
import Header from "@/components/Header";

interface LeiData {
  found: boolean;
  record?: {
    lei: string;
    legalName: string;
    status: string;
    registrationAuthority?: string;
    legalJurisdiction?: string;
    entityStatus?: string;
    headquartersAddress?: { country?: string };
    modificationDate?: string;
    nextRenewalDate?: string;
  };
  results?: Array<{
    lei: string;
    legalName: string;
    status: string;
    legalJurisdiction?: string;
  }>;
}

interface SanctionsData {
  matches: Array<{
    source: string;
    matchedName: string;
    score: number;
    entryType?: string;
    programs?: string[];
    remarks?: string;
    country?: string;
  }>;
  note?: string;
}

interface VatData {
  valid: boolean;
  countryCode?: string;
  vatNumber?: string;
  companyName?: string;
  companyAddress?: string;
  consultationNumber?: string;
  date?: string;
  timedOut?: boolean;
  error?: string;
}

export default function CheckPage() {
  const params = useParams();
  const query = decodeURIComponent(params.query as string);

  const [leiStatus, setLeiStatus] = useState<
    "loading" | "found" | "not-found" | "error"
  >("loading");
  const [leiData, setLeiData] = useState<LeiData | null>(null);
  const [sanctionsStatus, setSanctionsStatus] = useState<
    "loading" | "found" | "not-found" | "error"
  >("loading");
  const [sanctionsData, setSanctionsData] = useState<SanctionsData | null>(
    null,
  );
  const [vatStatus, setVatStatus] = useState<
    "loading" | "found" | "not-found" | "error" | "unavailable"
  >("loading");
  const [vatData, setVatData] = useState<VatData | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeiStatus("loading");
    setSanctionsStatus("loading");
    setVatStatus("loading");
    setLeiData(null);
    setSanctionsData(null);
    setVatData(null);

    const leiReq = fetch(`/api/lei?q=${encodeURIComponent(query)}`);
    const sanctionsReq = fetch(`/api/sanctions?q=${encodeURIComponent(query)}`);

    const isVat = /^[A-Z]{2}\d{2,12}$/i.test(query.trim());
    const vatReq = isVat
      ? fetch(`/api/vat?q=${encodeURIComponent(query)}`)
      : null;

    if (!isVat) {
      setVatStatus("not-found");
    }

    leiReq
      .then((r) => r.json())
      .then((data) => {
        setLeiData(data);
        setLeiStatus(data.found ? "found" : "not-found");
      })
      .catch(() => setLeiStatus("error"));

    sanctionsReq
      .then((r) => r.json())
      .then((data) => {
        setSanctionsData(data);
        setSanctionsStatus(data.matches.length > 0 ? "found" : "not-found");
      })
      .catch(() => setSanctionsStatus("error"));

    if (vatReq) {
      vatReq
        .then((r) => r.json())
        .then((data) => {
          setVatData(data);
          if (data.timedOut) {
            setVatStatus("unavailable");
          } else if (data.error && !data.companyName) {
            setVatStatus("error");
          } else {
            setVatStatus(
              data.valid || data.companyName ? "found" : "not-found",
            );
          }
        })
        .catch(() => setVatStatus("error"));
    }
  }, [query]);

  const timestamp = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-ink text-ivory">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10 max-w-xl">
          <SearchBar />
        </div>

        <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl text-ivory mb-1.5">{query}</h1>
            <p className="text-xs text-faint font-mono">Checked {timestamp}</p>
          </div>
          <SummaryStrip
            leiFound={leiStatus === "found"}
            vatFound={vatStatus === "found"}
            sanctionsCount={sanctionsData?.matches.length || 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 border border-hairline rounded-sm overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-hairline">
          <ResultPanel
            title="Sanctions"
            status={sanctionsStatus}
            polarity="inverse"
            sourceLabel="OFAC SDN + UK Sanctions List"
            sourceUrl="https://sanctionssearch.ofac.treas.gov/"
            asOf={timestamp}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.3}
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            }
          >
            {sanctionsData && sanctionsData.matches.length > 0 ? (
              <div>
                {sanctionsData.matches.map((m, i) => (
                  <MatchDetail
                    key={i}
                    match={{
                      source: m.source as "OFAC SDN" | "UK Sanctions List",
                      matchedName: m.matchedName,
                      score: m.score,
                      entryType: m.entryType,
                      programs: m.programs,
                      remarks: m.remarks,
                      country: m.country,
                    }}
                  />
                ))}
                {sanctionsData.note && (
                  <p className="mt-3 text-[11px] text-faint italic">
                    {sanctionsData.note}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted">
                  No matches found in OFAC SDN or UK Sanctions List.
                </p>
                {sanctionsData?.note && (
                  <p className="mt-2 text-[11px] text-faint italic">
                    {sanctionsData.note}
                  </p>
                )}
              </div>
            )}
          </ResultPanel>

          <ResultPanel
            title="LEI registration"
            status={leiStatus}
            sourceLabel="GLEIF"
            sourceUrl="https://search.gleif.org/"
            asOf={leiData?.record?.modificationDate || timestamp}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.3}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            }
          >
            {leiData?.record ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-faint">Legal name</span>
                  <p className="text-sm text-ivory">
                    {leiData.record.legalName}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-faint">LEI</span>
                  <p className="text-sm text-ivory font-mono">
                    {leiData.record.lei}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-faint">
                      Registration status
                    </span>
                    <p className="text-sm text-clear">
                      {leiData.record.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-faint">Entity status</span>
                    <p className="text-sm text-muted">
                      {leiData.record.entityStatus || "—"}
                    </p>
                  </div>
                </div>
                {leiData.record.legalJurisdiction && (
                  <div>
                    <span className="text-xs text-faint">Jurisdiction</span>
                    <p className="text-sm text-muted">
                      {leiData.record.legalJurisdiction}
                    </p>
                  </div>
                )}
                {leiData.record.headquartersAddress?.country && (
                  <div>
                    <span className="text-xs text-faint">HQ country</span>
                    <p className="text-sm text-muted">
                      {leiData.record.headquartersAddress.country}
                    </p>
                  </div>
                )}
                {leiData.record.modificationDate && (
                  <div>
                    <span className="text-xs text-faint">Last updated</span>
                    <p className="text-sm text-muted">
                      {leiData.record.modificationDate}
                    </p>
                  </div>
                )}
              </div>
            ) : leiData?.results && leiData.results.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-faint mb-2">
                  Showing top {leiData.results.length} matches:
                </p>
                {leiData.results.map((r, i) => (
                  <div
                    key={i}
                    className="border border-hairline rounded-sm p-2.5"
                  >
                    <p className="text-sm text-ivory">{r.legalName}</p>
                    <p className="text-xs text-faint font-mono">
                      {r.lei} · {r.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                No LEI record found for this query.
              </p>
            )}
          </ResultPanel>

          <ResultPanel
            title="VAT validity"
            status={vatStatus}
            sourceLabel="EU VIES"
            sourceUrl="https://ec.europa.eu/taxation_customs/vies/"
            asOf={vatData?.date || timestamp}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.3}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            }
            error={vatData?.error}
          >
            {vatData ? (
              <div className="space-y-3">
                {vatData.companyName && (
                  <div>
                    <span className="text-xs text-faint">Company name</span>
                    <p className="text-sm text-ivory">{vatData.companyName}</p>
                  </div>
                )}
                {vatData.companyAddress && (
                  <div>
                    <span className="text-xs text-faint">Address</span>
                    <p className="text-sm text-muted">
                      {vatData.companyAddress}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-faint">Valid</span>
                    <p
                      className={`text-sm font-medium ${vatData.valid ? "text-clear" : "text-flag"}`}
                    >
                      {vatData.valid ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-faint">Country</span>
                    <p className="text-sm text-muted">{vatData.countryCode}</p>
                  </div>
                </div>
                {vatData.consultationNumber && (
                  <div>
                    <span className="text-xs text-faint">Consultation #</span>
                    <p className="text-sm text-muted font-mono">
                      {vatData.consultationNumber}
                    </p>
                  </div>
                )}
                {vatData.date && (
                  <div>
                    <span className="text-xs text-faint">Date</span>
                    <p className="text-sm text-muted">{vatData.date}</p>
                  </div>
                )}
                {vatData.timedOut && (
                  <UnavailableState reason="VIES service timed out. The number could not be verified right now." />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Enter a VAT number (e.g., DE123456789) to check validity.
              </p>
            )}
          </ResultPanel>
        </div>
      </main>
    </div>
  );
}
