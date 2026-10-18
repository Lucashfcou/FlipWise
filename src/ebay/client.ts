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

export function buildSearchUrl(query: string, limit = 50): string {
  const params = new URLSearchParams({
    q: query,
    limit: String(Math.min(200, Math.max(1, limit))),
    filter: "buyingOptions:{FIXED_PRICE},conditions:{USED}",
  });
  return `${SEARCH_URL}?${params.toString()}`;
}

export async function searchItems(
  token: string,
  marketplace: MarketplaceId,
  query: string,
  limit = 50,
  fetchImpl: typeof fetch = fetch,
): Promise<EbayItem[]> {
  const res = await fetchImpl(buildSearchUrl(query, limit), {
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
  }));
}
