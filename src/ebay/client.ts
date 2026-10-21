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

/** Nomes de categoria (em ES, EN, FR, DE, IT) por tipo de aparelho, para escolher a categoria certa em cada país. */
const DEVICE: Record<string, RegExp> = (() => {
  const laptop = /(port[aá]til|laptop|notebook|netbook|ordinateur|portatili|\bpc\b)/i;
  const phone = /(m[oó]vil|smartphone|cell\s?phone|t[eé]l[eé]phone|handy|cellulari|telefon)/i;
  const headphones = /(auricular|headphone|earbud|headset|cascos|casque|kopfh|cuffie|[eé]couteur|ohrh)/i;
  const storage = /(disco|ssd|hdd|drive|almacenamiento|disque|festplatte|hard\s?disk|speicher|storage|memoria)/i;
  const cpu = /(cpu|procesador|processor|processeur|prozessor|processori)/i;
  const gpu = /(gr[aá]fica|graphics|video\s?card|carte\s?graphique|grafikkarte|schede\s?video|video)/i;
  return {
    laptop, notebook: laptop,
    smartphone: phone, phone, "mobile phone": phone,
    tablet: /(tablet|ipad|ebook|liseuse|e-?reader)/i,
    smartwatch: /(reloj|watch|montre|uhr|orologi|wearable|smartband)/i,
    camera: /(c[aá]mara|camera|appareil\s?photo|fotocamer|kamera)/i,
    "game console": /(consola|console|konsole)/i, console: /(consola|console|konsole)/i,
    controller: /(mando|controller|manette|gamepad|joystick)/i,
    speaker: /(altavoz|speaker|enceinte|lautsprecher|casse)/i,
    headphones, earbuds: headphones, headset: headphones,
    "graphics card": gpu, gpu,
    cpu, processor: cpu,
    ssd: storage, "hard drive": storage, hdd: storage,
    ram: /(memoria|\bram\b|m[eé]moire|arbeitsspeicher|speicher)/i,
    monitor: /(monitor|[eé]cran|bildschirm|schermo)/i,
    motherboard: /(placa\s?base|motherboard|carte\s?m[eè]re|mainboard|scheda\s?madre)/i,
    keyboard: /(teclado|keyboard|clavier|tastatur|tastiera)/i,
    mouse: /(rat[oó]n|mouse|souris|maus)/i,
  };
})();

/** Há categoria própria para este tipo de aparelho? Se sim, a pesquisa deve ficar nela (sem categoria só entram peças e lixo). */
export const hasDeviceCategory = (hint: string) => Boolean(DEVICE[hint.toLowerCase().trim()]);

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
  const generic = /\b(otros?|other|varios|various|miscellaneous|sonstige[rn]?|altr[oie]|autres?|diversos|divers)\b/i;
  const parts = /(bater[ií]a|battery|batterie|batteria|akku|cargador|charger|chargeur|caricabatterie|ladeger|funda|case|h[uü]lle|custodia|coque|housse|bolsa|bag|tasche|borsa|accesorio|accessor|zubeh|repuesto|ricambi|ricambio|spare|ersatz|pi[eè]ces?|pieza|part|cable|kabel|c[aâ]ble|cavo|adaptador|adapter|soporte|protector|pantalla|screen|[eé]cran|schermo|display|teclado|keyboard|clavier|tastatur|tastiera|r[eé]paration|riparazione|reparatur|defekt|adattator|caricator|alimentat|netzteil|adaptateur|alimentation|\bpara\b|\bper\b|\bpour\b|f[uü]r\b|\bfor\b)/i;
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
