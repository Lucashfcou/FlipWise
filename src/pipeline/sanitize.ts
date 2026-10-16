import type { Listing } from "./types";

type Raw = Record<string, unknown>;

const MAX_DESCRIPTION = 400;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&euro;": "€",
};

/** Tira HTML, CSS, scripts e URLs de um texto, deixando só o que uma pessoa leria. */
export function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|euro|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\S+\.(?:jpe?g|png|webp|gif|svg)\S*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(raw: Raw, keys: string[]): unknown {
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

const CURRENCY_SYMBOLS: [RegExp, string][] = [
  [/R\$|BRL/i, "BRL"],
  [/€|EUR/i, "EUR"],
  [/£|GBP/i, "GBP"],
  [/US\$|USD|\$/i, "USD"],
];

function detectCurrency(text: string): string | undefined {
  return CURRENCY_SYMBOLS.find(([re]) => re.test(text))?.[1];
}

/** "1.299,00", "1,299.00", "389,00", "€ 12" -> número. Sem dígitos (ex.: "A combinar") -> null. */
export function parseAmount(text: string): number | null {
  const m = text.match(/\d[\d.,\s]*/);
  if (!m) return null;
  let s = m[0].replace(/\s/g, "").replace(/[.,]+$/, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot > -1 && !/\.\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function readPrice(raw: Raw, defaultCurrency: string): { price: number | null; currency: string } {
  const p = pick(raw, ["price", "preco", "preço", "amount", "valor"]);
  let currency = String(pick(raw, ["currency", "moeda", "currency_code"]) ?? "").toUpperCase();

  if (p && typeof p === "object") {
    const o = p as Raw;
    const v = pick(o, ["value", "amount", "valor"]);
    currency = currency || String(pick(o, ["currency", "currency_code", "moeda"]) ?? "").toUpperCase();
    return { price: v === undefined ? null : readNumber(v), currency: currency || defaultCurrency };
  }
  if (typeof p === "number") return { price: Number.isFinite(p) ? p : null, currency: currency || defaultCurrency };
  if (typeof p === "string") {
    return { price: parseAmount(p), currency: currency || detectCurrency(p) || defaultCurrency };
  }
  return { price: null, currency: currency || defaultCurrency };
}

function readNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") return parseAmount(v);
  return null;
}

/**
 * Normaliza o JSON bruto de qualquer plataforma para o schema leve.
 * Tudo o que não for id, título, preço, moeda, descrição e URL do anúncio é descartado
 * (imagens, CSS, metadados de layout).
 */
export function sanitize(rawItems: unknown, defaultCurrency = "EUR"): Listing[] {
  if (!Array.isArray(rawItems)) return [];
  const out: Listing[] = [];
  rawItems.forEach((item, idx) => {
    if (!item || typeof item !== "object") return;
    const raw = item as Raw;
    const title = cleanText(pick(raw, ["title", "titulo", "título", "name", "titolo"]));
    if (!title) return;
    const { price, currency } = readPrice(raw, defaultCurrency);
    const url = pick(raw, ["url", "link", "href", "permalink"]);
    out.push({
      id: String(pick(raw, ["id", "ad_id", "itemId", "item_id"]) ?? `item-${idx + 1}`),
      title,
      price,
      currency,
      description: cleanText(pick(raw, ["description", "descricao", "descrição", "body", "text"])).slice(0, MAX_DESCRIPTION),
      url: typeof url === "string" ? url.trim() : "",
    });
  });
  return out;
}
