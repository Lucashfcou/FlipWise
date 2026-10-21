/**
 * Cliente da API Browse do eBay (anúncios ativos). Corre só em scripts ou no servidor: o Client Secret nunca vai para o telemóvel.
 * Escrito a partir da documentação pública; NÃO foi testado contra a API real (ainda não há chaves). Confirma os campos na
 * primeira corrida e ajusta se o eBay devolver outro formato.
 */

export const MARKETPLACES = {
  EBAY_ES: { label: "eBay.es", country: "ES" },
  EBAY_DE: { label: "eBay.de", country: "DE" },
  EBAY_FR: { label: "eBay.fr", country: "FR" },
  EBAY_IT: { label: "eBay.it", country: "IT" },
} as const;
export type MarketplaceId = keyof typeof MARKETPLACES;

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const SCOPE = "https://api.ebay.com/oauth/api_scope";

export interface EbayCredentials {
  clientId: string;
  clientSecret: string;
}

export interface EbayItem {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  itemWebUrl?: string;
  condition?: string;
}

export class EbayError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export async function getToken(creds: EbayCredentials, fetchImpl: typeof fetch = fetch): Promise<{ token: string; expiresIn: number }> {
  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(SCOPE)}`,
  });
  if (!res.ok) throw new EbayError(`eBay token ${res.status}: ${(await res.text()).slice(0, 200)}`, res.status);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new EbayError("Resposta do eBay sem access_token.");
  return { token: data.access_token, expiresIn: data.expires_in ?? 7200 };
}

/** USED = usados a funcionar; PARTS = "para peças ou sem funcionar" (código de condição 7000 do eBay). */
export type EbayCondition = "USED" | "PARTS";

export function buildSearchUrl(query: string, limit = 50, condition: EbayCondition = "USED", categoryId?: string): string {
  const params = new URLSearchParams({
    q: query,
    limit: String(Math.min(200, Math.max(1, limit))),
    filter: condition === "PARTS" ? "buyingOptions:{FIXED_PRICE},conditionIds:{7000}" : "buyingOptions:{FIXED_PRICE},conditions:{USED}",
  });
  if (categoryId && /^\d+$/.test(categoryId)) params.set("category_ids", categoryId);
  return `${SEARCH_URL}?${params.toString()}`;
}

export async function searchItems(
  token: string,
  marketplace: MarketplaceId,
  query: string,
  limit = 50,
  fetchImpl: typeof fetch = fetch,
  condition: EbayCondition = "USED",
  categoryId?: string,
): Promise<EbayItem[]> {
  const res = await fetchImpl(buildSearchUrl(query, limit, condition, categoryId), {
    headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": marketplace },
  });
  if (!res.ok) throw new EbayError(`eBay search ${res.status}: ${(await res.text()).slice(0, 200)}`, res.status);
  const data = (await res.json()) as { itemSummaries?: EbayItem[] };
  return Array.isArray(data.itemSummaries) ? data.itemSummaries : [];
}

/** Converte os resultados para o JSON bruto que o pipeline (sanitize) espera. */
export function toRaw(items: EbayItem[]): unknown[] {
  return items.map((i) => ({
    id: i.itemId,
    title: i.title,
    price: i.price ? { value: i.price.value, currency: i.price.currency } : undefined,
    url: i.itemWebUrl,
    // O estado declarado pelo vendedor ajuda o classificador a apanhar "para peças" escondido.
    description: i.condition ?? "",
  }));
}

const treeIds = new Map<string, string>();

/**
 * Categoria folha mais provável para um texto (Taxonomy API do eBay). Serve para a pesquisa ficar só nos aparelhos
 * (ex.: "Portáteis") e deixar de fora carregadores, ecrãs e outras peças que aparecem na pesquisa por texto.
 */
export async function suggestCategory(token: string, marketplace: MarketplaceId, query: string, fetchImpl: typeof fetch = fetch, hint = ""): Promise<{ id: string; name: string } | null> {
  const headers = { Authorization: `Bearer ${token}` };
  let tree = treeIds.get(marketplace);
  if (!tree) {
    const r = await fetchImpl(`https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${marketplace}`, { headers });
    if (!r.ok) return null;
    const d = (await r.json()) as { categoryTreeId?: string };
    if (!d.categoryTreeId) return null;
    tree = d.categoryTreeId;
    treeIds.set(marketplace, tree);
  }
  const generic = /\b(otros?|other|varios|various|miscellaneous|sonstige|altri|autres?|diversos)\b/i;
  const parts = /(bater[ií]a|battery|cargador|charger|funda|case|bolsa|bag|accesorio|accessor|repuesto|spare|pieza|part|cable|adaptador|soporte|protector|pantalla|screen|teclado|keyboard)/i;
  const DEVICE: Record<string, RegExp> = {
    laptop: /(port[aá]til|laptop|notebook|netbook)/i,
    headphones: /(auricular|headphone|earbud|headset|cascos)/i,
    earbuds: /(auricular|headphone|earbud|headset|cascos)/i,
    smartphone: /(m[oó]vil|smartphone|cell\s?phone|tel[eé]fono)/i,
    tablet: /(tablet|ipad|ebook)/i,
    smartwatch: /(reloj|watch|wearable|smartband)/i,
    camera: /(c[aá]mara|camera)/i,
    console: /(consola|console)/i,
    speaker: /(altavoz|speaker)/i,
    "graphics card": /(gr[aá]fica|graphics|video\s?card)/i,
    cpu: /(cpu|procesador|processor)/i,
    processor: /(cpu|procesador|processor)/i,
    ssd: /(disco|ssd|hdd|drive|almacenamiento)/i,
    "hard drive": /(disco|ssd|hdd|drive|almacenamiento)/i,
    ram: /(memoria|\bram\b)/i,
    monitor: /monitor/i,
    motherboard: /(placa\s?base|motherboard)/i,
  };
  const wanted = DEVICE[hint.toLowerCase().trim()];
  // Tipo de aparelho desconhecido: sem categoria (uma categoria errada esconde os anúncios certos).
  if (!wanted) return null;
  const brand = query.split(/\s+/)[0] ?? "";
  for (const text of [`${hint} ${query}`.trim(), `${hint} ${brand}`.trim(), hint]) {
    const r = await fetchImpl(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${tree}/get_category_suggestions?q=${encodeURIComponent(text)}`, { headers });
    if (!r.ok) continue;
    const d = (await r.json()) as { categorySuggestions?: { category?: { categoryId?: string; categoryName?: string } }[] };
    const cats = (d.categorySuggestions ?? []).map((x) => x.category).filter((x): x is { categoryId?: string; categoryName?: string } => Boolean(x?.categoryId));
    const pick = cats.find((x) => wanted.test(x.categoryName ?? "") && !parts.test(x.categoryName ?? "") && !generic.test(x.categoryName ?? ""));
    if (pick?.categoryId) return { id: pick.categoryId, name: pick.categoryName ?? "" };
  }
  return null;
}
