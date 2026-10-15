// ISO 4217 numeric minor units, SIX List One published 2026-09-17.
// https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
// Snapshot SHA256: 33139b438657d1cee116ba737807ea71d19d6de4b90f799a09c56f0cc6a1b0ff
// Codes without numeric minor units and withdrawn codes (e.g. ANG/SLL/VEF)
// remain unsupported. Intl is used for presentation only, never for the scale.
const exponentGroups: ReadonlyArray<readonly [number, string]> = [
  [0, "BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF"],
  [2, "AED AFN ALL AMD AOA ARS AUD AWG AZN BAM BBD BDT BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CNY COP COU CRC CUP CVE CZK DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GTQ GYD HKD HNL HTG HUF IDR ILS INR IRR JMD KES KGS KHR KPW KYD KZT LAK LBP LKR LRD LSL MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD PAB PEN PGK PHP PKR PLN QAR RON RSD RUB SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TOP TRY TTD TWD TZS UAH USD USN UYU UZS VED VES WST XAD XCD XCG YER ZAR ZMW ZWG"],
  [3, "BHD IQD JOD KWD LYD OMR TND"],
  [4, "CLF UYW"],
];
const exponents = new Map(exponentGroups.flatMap(([digits, codes]) =>
  codes.split(" ").map((code) => [code, digits] as const)));

export function normalizePaymentCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return exponents.has(code) ? code : null;
}

export function getPaymentCurrencyExponent(value: unknown): number | null {
  const currency = normalizePaymentCurrency(value);
  return currency ? exponents.get(currency) ?? null : null;
}

function canonicalInteger(value: unknown, maximumDigits: number): string | null {
  let text: string;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    text = String(value);
  } else if (typeof value === "bigint") {
    if (value < BigInt(0)) return null;
    text = value.toString();
  } else if (typeof value === "string") {
    text = value;
  } else return null;
  return text.length <= maximumDigits && /^(?:0|[1-9][0-9]*)$/.test(text) ? text : null;
}

/** A bounded, exact, JSON-safe per-payment fact. Never coerce unsafe numbers. */
export function normalizePaymentAmountMinor(value: unknown): string | null {
  return canonicalInteger(value, 64);
}

/** Exact decimal projection; the higher bound also permits aggregate totals. */
export function minorUnitsToDecimal(minor: unknown, currency: unknown): string | null {
  const text = canonicalInteger(minor, 4096);
  const digits = getPaymentCurrencyExponent(currency);
  if (text === null || digits === null) return null;
  if (digits === 0) return text;
  const padded = text.padStart(digits + 1, "0");
  return `${padded.slice(0, -digits)}.${padded.slice(-digits)}`;
}

/** Convenience only: canonical strings remain authoritative over this float. */
export function minorUnitsToMajor(minor: unknown, currency: unknown): number | null {
  const text = canonicalInteger(minor, 4096);
  if (text === null) return null;
  // Zero is a known amount even when its unit cannot be established.
  if (text === "0") return 0;
  const decimal = minorUnitsToDecimal(text, currency);
  const digits = getPaymentCurrencyExponent(currency);
  if (decimal === null || digits === null || !Number.isSafeInteger(Number(text))) return null;
  const value = Number(decimal);
  return Number.isFinite(value) && value.toFixed(digits) === decimal ? value : null;
}

/** Exact ISO-code display. No conversion through Number or default Intl digits. */
export function formatPaymentAmount(minor: unknown, currency: unknown, locale = "es"): string | null {
  const code = normalizePaymentCurrency(currency);
  const decimal = minorUnitsToDecimal(minor, code);
  const digits = getPaymentCurrencyExponent(code);
  if (code === null || decimal === null || digits === null) return null;
  const [whole, fraction] = decimal.split(".");
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency", currency: code, currencyDisplay: "code",
      minimumFractionDigits: digits, maximumFractionDigits: digits,
    });
    return formatter.formatToParts(BigInt(whole)).map((part) =>
      part.type === "fraction" ? fraction : part.value).join("");
  } catch {
    return null;
  }
}
