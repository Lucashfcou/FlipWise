import { productClassifier } from "./queries";
import type { Matcher, ProductQuery } from "./queries";
import { searchItems, suggestCategory, toRaw } from "./client";
import type { MarketplaceId } from "./client";
import { runPipeline } from "../pipeline/run";

/**
 * Busca no eBay para produtos que não estão no catálogo. O nome e as especificações vêm da leitura do print
 * (a IA nunca recebe dados do eBay). O resultado traz sempre uma conclusão, com a confiança e a base da comparação.
 */
export interface LookupResult {
  /** Nome efetivamente pesquisado (pode ser mais curto que o do print quando não havia anúncios do modelo exato). */
  searched?: string;
  query: string;
  site: string;
  currency: string;
  /** Anúncios usados no cálculo. */
  n: number;
  /** Anúncios devolvidos pelo eBay antes de limpar. */
  captured: number;
  median: number;
  low: number;
  high: number;
  min: number;
  max: number;
  /** Preços usados no cálculo, para o app calcular o veredito com os mesmos custos e margem do utilizador. */
  prices: number[];
  /** "specs": só anúncios com as mesmas especificações; "model": todas as versões do modelo. */
  basis: "specs" | "model" | "family";
  /** Categoria do eBay usada para deixar de fora peças e acessórios. */
  category?: string;
  /** Dispersão: intervalo entre quartis dividido pela mediana. */
  spread: number;
  reliability: "media" | "baixa";
}

/** Limpa o texto de pesquisa: só letras, números e alguns símbolos comuns, até 80 caracteres. */
export function cleanLookupQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const q = raw.normalize("NFKC").replace(/[^\p{L}\p{N}\s\-+.'&/]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return q.length >= 3 ? q : null;
}

/** Tipo de aparelho em uma ou duas palavras ("laptop", "headphones"): ajuda a achar a categoria certa no eBay. */
export function cleanDeviceType(raw: unknown): string {
  return typeof raw === "string" ? raw.normalize("NFKC").replace(/[^\p{L}\s-]/gu, "").trim().slice(0, 24) : "";
}

/** Especificações curtas ("i7", "8GB", "256GB"): até 5, só letras, números e . + - */
export function cleanSpecs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.replace(/\s+/g, "").slice(0, 14))
    .filter((x) => /^[\p{L}\p{N}.+-]{2,14}$/u.test(x))
    .slice(0, 5);
}

const compact = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Peças e acessórios que aparecem na pesquisa de um aparelho e puxam o preço para baixo (portátil -> carregador, teclado, ecrã...). */
const JUNK = /\b(cargador|charger|ladeger[aä]t|chargeur|caricatore|bater[ií]a|battery|akku|batterie|batteria|pantalla|screen|display|bildschirm|[eé]cran|teclado|keyboard|tastatur|clavier|tastiera|carcasa|carcassa|cover|funda|case|tasche|h[uü]lle|bisagra|hinge|scharnier|placa\s?base|motherboard|ventilador|fan|l[uü]fter|ventola|caddy|adaptador|adapter|cable|kabel|c[aâ]ble|cavo|altavoz|speaker|lautsprecher|repuesto|spare|ersatzteil|piezas|pieces|pi[eè]ces|for\s?parts|defekt|broken|averiad[oa]|roto|rota|sticker|pegatina|skin|protector|soporte|stand|halterung|mouse\s?pad|alfombrilla)\b/gi;

/** O título tem de conter todas as palavras do nome (sem espaços nem hífenes, para "WH-CH720N" casar com "WH CH720N"). */
export function lookupProductQuery(q: string): ProductQuery {
  const words = q.split(/\s+/).map(compact).filter((w) => w.length >= 2);
  const must = words.map((w) => ({ test: (title: string) => compact(title).includes(w) }));
  // Tira peças e acessórios, exceto quando o próprio nome pesquisado os inclui (ex.: "carregador MagSafe").
  const inQuery = new Set((q.match(JUNK) ?? []).map((w) => w.toLowerCase()));
  const mustNot = [{ test: (title: string) => (title.match(JUNK) ?? []).some((w) => !inQuery.has(w.toLowerCase())) }];
  return { q, must, mustNot };
}

/** Tamanhos de armazenamento que os vendedores escrevem de formas diferentes (240 e 256 GB são o mesmo disco). */
const STORAGE_EQUIV: Record<string, string[]> = {
  "120": ["120", "128"], "128": ["120", "128"], "240": ["240", "256"], "256": ["240", "256"],
  "480": ["480", "512"], "512": ["480", "512"], "960": ["960", "1000", "1024"], "1tb": ["960", "1000", "1024", "1tb"],
};

/** Um critério de especificação: "8GB" não pode casar com "128GB"; "256GB" aceita "240 GB" e "256GB". */
export function specMatcher(spec: string): Matcher {
  const s = spec.toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d+)(gb|tb)$/);
  const alts = m && m[2] === "gb" ? (STORAGE_EQUIV[m[1]] ?? [m[1]]).map((n) => `${n}\\s?gb`) : [s.replace(/[.+-]/g, (c) => `\\${c}`).replace(/(\d)([a-z])/g, "$1\\s?$2")];
  const re = new RegExp(`(?<![a-z0-9])(${alts.join("|")})(?![a-z0-9])`, "i");
  return { test: (title: string) => re.test(title.normalize("NFD").replace(/[̀-ͯ]/g, "")) };
}

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Pesquisa o nome no eBay (na categoria certa, com as mesmas especificações quando há anúncios suficientes) e calcula a
 * faixa de preços com o mesmo pipeline do catálogo. Só devolve null se quase não há anúncios.
 */
export async function runLookup(
  token: string,
  site: MarketplaceId,
  q: string,
  opts: { specs?: string[]; deviceType?: string; fetchImpl?: typeof fetch; minValid?: number } = {},
): Promise<LookupResult | null> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const minValid = opts.minValid ?? 5;
  const specs = cleanSpecs(opts.specs ?? []);

  let category: { id: string; name: string } | null = null;
  try {
    category = await suggestCategory(token, site, q, fetchImpl, cleanDeviceType(opts.deviceType));
  } catch {
    category = null;
  }

  // Degraus: 1) nome completo; 2) sem a última palavra (ex.: sem o código da versão); 3) marca + série. Os dois últimos são "família".
  const words = q.split(/\s+/);
  const tiers: string[] = [q];
  if (words.length >= 3) tiers.push(words.slice(0, -1).join(" "));
  if (words.length >= 3) tiers.push(words.slice(0, 2).join(" "));
  const seen = new Set<string>();

  for (const [ti, name] of tiers.entries()) {
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const items = await searchItems(token, site, name, 100, fetchImpl, "USED", category?.id);
    const raw = toRaw(items);
    const base = lookupProductQuery(name);
    const attempts: { basis: "specs" | "model" | "family"; query: ProductQuery; needed: number }[] = [];
    if (specs.length > 0) attempts.push({ basis: ti === 0 ? "specs" : "family", query: { ...base, must: [...base.must, ...specs.map(specMatcher)] }, needed: Math.max(minValid, 6) });
    attempts.push({ basis: ti === 0 ? "model" : "family", query: base, needed: ti === 0 ? minValid : Math.max(minValid, 8) });

    for (const att of attempts) {
      const r = await runPipeline(name, raw, productClassifier(att.query), "EUR");
      if (!r.stats || r.counts.final < att.needed) continue;
      const sorted = [...r.prices].sort((x, y) => x - y);
      const low = quantile(sorted, 0.25);
      const high = quantile(sorted, 0.75);
      const spread = r.stats.median > 0 ? (high - low) / r.stats.median : 99;
      const reliability = att.basis === "specs" ? (spread <= 1.0 ? "media" : "baixa") : att.basis === "model" && r.counts.final >= 15 && spread <= 0.6 ? "media" : "baixa";
      return {
        query: q,
        searched: name,
        site,
        currency: r.stats.currency,
        n: r.counts.final,
        captured: r.counts.captured,
        median: round(r.stats.median),
        low: round(low),
        high: round(high),
        min: round(r.stats.min),
        max: round(r.stats.max),
        prices: sorted.map(round),
        basis: att.basis,
        category: category?.name,
        spread: round(spread),
        reliability,
      };
    }
  }
  return null;
}
