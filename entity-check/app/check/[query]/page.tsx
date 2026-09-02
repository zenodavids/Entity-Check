"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import ResultPanel from "@/components/ResultPanel";
import MatchDetail from "@/components/MatchDetail";
import UnavailableState from "@/components/UnavailableState";
import SummaryStrip from "@/components/SummaryStrip";
import ThemeToggle from "@/components/ThemeToggle";
import { LeiRecord, VatResult, SanctionsMatch } from "@/lib/types";
import { detectInputType } from "@/lib/gleif";

export default function CheckPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = use(params);
  const decodedQuery = decodeURIComponent(query);

  const [leiStatus, setLeiStatus] = useState<"loading" | "found" | "not-found" | "error" | "unavailable">("loading");
  const [vatStatus, setVatStatus] = useState<"loading" | "found" | "not-found" | "error" | "unavailable">("loading");
  const [sanctionsStatus, setSanctionsStatus] = useState<"loading" | "found" | "not-found" | "error">("loading");
  const [leiData, setLeiData] = useState<LeiRecord | null>(null);
  const [vatData, setVatData] = useState<VatResult | null>(null);
  const [sanctionsData, setSanctionsData] = useState<SanctionsMatch[]>([]);

  const inputType = detectInputType(decodedQuery);

  const fetchLei = useCallback(async () => {
    setLeiStatus("loading");
    try {
      if (inputType === "lei") {
        const res = await fetch(`/api/lei?q=${encodeURIComponent(decodedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setLeiData(data.record);
          setLeiStatus("found");
        } else if (res.status === 404) {
          setLeiStatus("not-found");
        } else {
          setLeiStatus("error");
        }
      } else if (inputType === "name") {
        const res = await fetch(`/api/lei?q=${encodeURIComponent(decodedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.type === "search" && data.results?.length > 0) {
            const leiRes = await fetch(`/api/lei?q=${encodeURIComponent(data.results[0].lei)}`);
            if (leiRes.ok) {
              const leiJson = await leiRes.json();
              setLeiData(leiJson.record);
              setLeiStatus("found");
            } else {
              setLeiStatus("not-found");
            }
          } else {
            setLeiStatus("not-found");
          }
        } else {
          setLeiStatus("error");
        }
      } else {
        setLeiStatus("not-found");
      }
    } catch {
      setLeiStatus("error");
    }
  }, [decodedQuery, inputType]);

  const fetchVat = useCallback(async () => {
    setVatStatus("loading");
    if (inputType === "lei") {
      setVatStatus("not-found");
      return;
    }
    try {
      const res = await fetch(`/api/vat?q=${encodeURIComponent(decodedQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isValid === null) {
          setVatStatus("unavailable");
        } else {
          setVatData(data);
          setVatStatus("found");
        }
      } else {
        setVatStatus("error");
      }
    } catch {
      setVatStatus("error");
    }
  }, [decodedQuery, inputType]);

  const fetchSanctions = useCallback(async () => {
    setSanctionsStatus("loading");
    try {
      const res = await fetch(`/api/sanctions?q=${encodeURIComponent(decodedQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSanctionsData(data.matches || []);
        setSanctionsStatus(data.matches && data.matches.length > 0 ? "found" : "not-found");
      } else {
        setSanctionsStatus("error");
      }
    } catch {
      setSanctionsStatus("error");
    }
  }, [decodedQuery]);

  useEffect(() => {
    fetchLei();
    fetchVat();
    fetchSanctions();
  }, [fetchLei, fetchVat, fetchSanctions]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border-subtle bg-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <span className="text-[17px] font-bold text-text tracking-tight">Entity Check</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-5">
          <div className="flex items-center gap-3 animate-fade-in">
            <Link href="/" className="text-text-tertiary hover:text-text transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <span className="text-text font-mono text-sm bg-bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm">
              {decodedQuery}
            </span>
          </div>

          <SummaryStrip
            leiStatus={leiStatus}
            vatStatus={vatStatus}
            sanctionsCount={sanctionsData.length}
            sanctionsLoading={sanctionsStatus === "loading"}
          />

          <div className="space-y-4">
            <ResultPanel
              title="Sanctions Screening"
              index={0}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
              status={sanctionsStatus}
              source="OFAC SDN + UK Sanctions List"
              sourceUrl="https://www.treasury.gov/ofac"
              timestamp={sanctionsData.length > 0 ? sanctionsData[0].listVersion : undefined}
              badge={sanctionsData.length > 0 ? { label: "Review Required", variant: "dashed" } : undefined}
            >
              {sanctionsStatus === "not-found" && (
                <div className="flex items-center gap-2.5 text-sm text-success">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  No sanctions matches found
                </div>
              )}
              {sanctionsData.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[13px] text-warning leading-relaxed">
                    {sanctionsData.length} possible match{sanctionsData.length > 1 ? "es" : ""}. Fuzzy-string matches, not confirmed identifications.
                  </p>
                  {sanctionsData.map((match, i) => (
                    <MatchDetail
                      key={`${match.source}-${match.entry.uid}-${i}`}
                      matchedAlias={match.matchedAlias}
                      confidence={match.confidence}
                      source={match.source}
                    />
                  ))}
                </div>
              )}
              {sanctionsStatus === "error" && <div className="text-sm text-danger">Failed to check sanctions.</div>}
            </ResultPanel>

            <ResultPanel
              title="LEI Registration"
              index={1}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              }
              status={leiStatus}
              source="GLEIF"
              sourceUrl={leiData ? `https://search.gleif.org/#/record/${leiData.lei}` : "https://search.gleif.org"}
              timestamp={leiData?.lastUpdateTime}
              badge={leiData ? { label: leiData.registrationStatus, variant: "solid" } : undefined}
            >
              {leiStatus === "found" && leiData && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="Legal Name" value={leiData.legalName} />
                  <Field label="LEI" value={leiData.lei} mono />
                  <Field label="Jurisdiction" value={leiData.jurisdiction} />
                  <Field label="Status" value={leiData.entityStatus} />
                  {leiData.legalForm && <Field label="Legal Form" value={leiData.legalForm} />}
                </div>
              )}
              {leiStatus === "not-found" && (
                <p className="text-sm text-text-secondary">
                  {inputType === "vat" ? "VAT-only entities don't have LEI records." : "No LEI record found."}
                </p>
              )}
              {leiStatus === "error" && <p className="text-sm text-danger">Failed to look up LEI.</p>}
            </ResultPanel>

            <ResultPanel
              title="VAT Validity"
              index={2}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              }
              status={vatStatus}
              source="EU VIES"
              sourceUrl="https://ec.europa.eu/taxation_customs/vies"
              timestamp={vatData?.timestamp}
              badge={
                vatData?.isValid === true
                  ? { label: "Valid", variant: "solid" }
                  : vatData?.isValid === false
                    ? { label: "Invalid", variant: "dashed" }
                    : undefined
              }
            >
              {vatStatus === "found" && vatData && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="VAT Number" value={`${vatData.countryCode}${vatData.vatNumber}`} mono />
                  <Field
                    label="Valid"
                    value={vatData.isValid ? "Yes" : "No"}
                    valueClass={vatData.isValid ? "text-success" : "text-danger"}
                  />
                  {vatData.name && <Field label="Name" value={vatData.name} />}
                  {vatData.address && <Field label="Address" value={vatData.address} span />}
                </div>
              )}
              {vatStatus === "unavailable" && <UnavailableState source="EU VIES" />}
              {vatStatus === "not-found" && (
                <p className="text-sm text-text-secondary">
                  {inputType === "lei" ? "LEI-only entities don't have VAT numbers." : "No VAT record found."}
                </p>
              )}
              {vatStatus === "error" && <p className="text-sm text-danger">Failed to validate VAT.</p>}
            </ResultPanel>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  span,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  span?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <dt className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1">{label}</dt>
      <dd className={`text-text font-medium ${mono ? "font-mono text-xs" : "text-sm"} ${valueClass || ""}`}>
        {value}
      </dd>
    </div>
  );
}
