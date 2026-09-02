import { VatResult } from "./types";
import { cache, VAT_CACHE_TTL } from "./cache";

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";
const VIES_TIMEOUT_MS = 8000;

const COUNTRY_CODES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR",
  "DE","EL","HU","IE","IT","LV","LT","LU","MT","NL",
  "PL","PT","RO","SK","SI","ES","SE","GB",
]);

function parseVatInput(input: string): { countryCode: string; vatNumber: string } | null {
  const cleaned = input.replace(/\s/g, "").toUpperCase();
  if (cleaned.length < 4) return null;

  const countryCode = cleaned.slice(0, 2);
  if (!COUNTRY_CODES.has(countryCode)) return null;

  const vatNumber = cleaned.slice(2);
  if (vatNumber.length < 4 || vatNumber.length > 15) return null;

  return { countryCode, vatNumber };
}

function buildSoapEnvelope(countryCode: string, vatNumber: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tns1="http://ec.europa.eu/taxation_customs/vies/services"
  xmlns:tns2="http://ec.europa.eu/taxation_customs/vies/services/types">
  <soapenv:Header/>
  <soapenv:Body>
    <tns1:checkVat>
      <tns2:countryCode>${countryCode}</tns2:countryCode>
      <tns2:vatNumber>${vatNumber}</tns2:vatNumber>
    </tns1:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function parseSoapResponse(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const fields = [
    "valid",
    "requestDate",
    "countryCode",
    "vatNumber",
    "requestIdentifier",
    "name",
    "address",
    "identifier",
  ];

  for (const field of fields) {
    const regex = new RegExp(
      `<tns2:${field}>([^<]*)</tns2:${field}>|<${field}>([^<]*)</${field}>`,
      "i"
    );
    const match = xml.match(regex);
    if (match) {
      result[field] = (match[1] || match[2] || "").trim();
    }
  }

  return result;
}

export async function checkVat(vatInput: string): Promise<VatResult> {
  const cacheKey = `vat:${vatInput.toLowerCase()}`;
  const cached = cache.get<VatResult>(cacheKey);
  if (cached) return cached;

  const parsed = parseVatInput(vatInput);
  if (!parsed) {
    return {
      isValid: null,
      countryCode: vatInput.slice(0, 2).toUpperCase(),
      vatNumber: vatInput,
      source: "EU VIES",
      sourceUrl: VIES_URL,
      timestamp: new Date().toISOString(),
    };
  }

  const { countryCode, vatNumber } = parsed;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VIES_TIMEOUT_MS);

  try {
    const envelope = buildSoapEnvelope(countryCode, vatNumber);
    const res = await fetch(VIES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "",
      },
      body: envelope,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        isValid: null,
        countryCode,
        vatNumber,
        source: "EU VIES",
        sourceUrl: VIES_URL,
        timestamp: new Date().toISOString(),
      };
    }

    const xml = await res.text();
    const parsed_response = parseSoapResponse(xml);

    const result: VatResult = {
      isValid: parsed_response.valid === "true" ? true :
               parsed_response.valid === "false" ? false : null,
      countryCode,
      vatNumber,
      requesterNumber: parsed_response.requestIdentifier,
      name: parsed_response.name,
      address: parsed_response.address,
      identifier: parsed_response.identifier,
      source: "EU VIES",
      sourceUrl: VIES_URL,
      timestamp: parsed_response.requestDate || new Date().toISOString(),
    };

    cache.set(cacheKey, result, VAT_CACHE_TTL);
    return result;
  } catch {
    clearTimeout(timeout);
    return {
      isValid: null,
      countryCode,
      vatNumber,
      source: "EU VIES",
      sourceUrl: VIES_URL,
      timestamp: new Date().toISOString(),
    };
  }
}
