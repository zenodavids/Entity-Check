export interface VatResult {
  countryCode: string;
  vatNumber: string;
  valid: boolean;
  requesterNumber?: string;
  companyName?: string;
  companyAddress?: string;
  consultationNumber?: string;
  date?: string;
  timedOut?: boolean;
  error?: string;
}

const VIES_URL =
  "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";

function buildSoap(countryCode: string, vatNumber: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:typ="http://ec.europa.eu/taxation_customs/vies/types">
  <soap:Body>
    <typ:checkVat>
      <typ:countryCode>${countryCode}</typ:countryCode>
      <typ:vatNumber>${vatNumber}</typ:vatNumber>
    </typ:checkVat>
  </soap:Body>
</soap:Envelope>`;
}

function parseSoapResponse(
  xml: string,
): Pick<
  VatResult,
  | "valid"
  | "requesterNumber"
  | "companyName"
  | "companyAddress"
  | "consultationNumber"
  | "date"
> {
  const get = (tag: string): string | undefined => {
    const match = xml.match(
      new RegExp(`<typ:${tag}[^>]*>([^<]*)</typ:${tag}>`),
    );
    return match?.[1]?.trim() || undefined;
  };

  const validStr = get("valid");
  return {
    valid: validStr === "true",
    requesterNumber: get("requesterNumber"),
    companyName: get("name"),
    companyAddress: get("address"),
    consultationNumber: get("consulationNumber"),
    date: get("date"),
  };
}

function parseFault(xml: string): string | undefined {
  const faultMatch = xml.match(/<faultstring>([^<]*)<\/faultstring>/i);
  if (faultMatch) return faultMatch[1].trim();
  const detailMatch = xml.match(/<detail[^>]*>([\s\S]*?)<\/detail>/i);
  if (detailMatch) {
    const inner = detailMatch[1].match(/<[^>]*>([^<]*)<\/[^>]*>/);
    if (inner) return inner[1].trim();
  }
  return undefined;
}

export async function checkVat(fullVat: string): Promise<VatResult> {
  const match = fullVat.match(/^([A-Z]{2})(\d{2,12})$/i);
  if (!match) {
    return {
      countryCode: "",
      vatNumber: fullVat,
      valid: false,
      error:
        "Invalid VAT format. Expected country code (2 letters) followed by digits.",
    };
  }

  const countryCode = match[1].toUpperCase();
  const vatNumber = match[2];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(VIES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "",
      },
      body: buildSoap(countryCode, vatNumber),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        countryCode,
        vatNumber,
        valid: false,
        error: `VIES returned HTTP ${res.status}`,
        timedOut: false,
      };
    }

    const xml = await res.text();
    const fault = parseFault(xml);
    if (fault) {
      return {
        countryCode,
        vatNumber,
        valid: false,
        error: fault,
      };
    }

    const parsed = parseSoapResponse(xml);
    return {
      countryCode,
      vatNumber,
      ...parsed,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    return {
      countryCode,
      vatNumber,
      valid: false,
      timedOut: isTimeout,
      error: isTimeout
        ? "VIES request timed out, the service may be temporarily unavailable"
        : `VIES check failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}
