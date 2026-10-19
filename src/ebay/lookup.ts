import { productClassifier } from "./queries";
import type { ProductQuery } from "./queries";
import { searchItems, toRaw } from "./client";
import type { MarketplaceId } from "./client";
import { runPipeline } from "../pipeline/run";

/**
 * Busca no eBay para produtos que não estão no catálogo. O nome vem da leitura do print (a IA nunca recebe dados do eBay).
 * Sem os filtros feitos à mão para cada produto, o resultado é só uma referência: o app avisa que é pouco fiável.
 */
export interface LookupResult {
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
}

/** Limpa o texto de pesquisa: só letras, números e alguns símbolos comuns, até 80 caracteres. */
export function cleanLookupQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const q = raw.normalize("NFKC").replace(/[^\p{L}\p{N}\s\-+.'&/]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return q.length >= 3 ? q : null;
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

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** Intervalo entre quartis dividido pela mediana: acima disto os anúncios são demasiado diferentes entre si. */
export const MAX_SPREAD = 1.4;

const round = (n: number) => Math.round(n * 100) / 100;

/** Pesquisa o nome no eBay e calcula a faixa de preços com o mesmo pipeline do catálogo. Devolve null se há poucos anúncios válidos. */
export async function runLookup(token: string, site: MarketplaceId, q: string, fetchImpl: typeof fetch = fetch, minValid = 6): Promise<LookupResult | null> {
  const items = await searchItems(token, site, q, 100, fetchImpl, "USED");
  const query = lookupProductQuery(q);
  const r = await runPipeline(q, toRaw(items), productClassifier(query), "EUR");
  if (!r.stats || r.counts.final < minValid) return null;
  const sorted = [...r.prices].sort((a, b) => a - b);
  // Anúncios muito misturados (por exemplo peças e aparelhos juntos): melhor não mostrar um preço do que mostrar um errado.
  const spread = (quantile(sorted, 0.75) - quantile(sorted, 0.25)) / r.stats.median;
  if (spread > MAX_SPREAD) return null;
  return {
    query: q,
    site,
    currency: r.stats.currency,
    n: r.counts.final,
    captured: r.counts.captured,
    median: round(r.stats.median),
    low: round(quantile(sorted, 0.25)),
    high: round(quantile(sorted, 0.75)),
    min: round(r.stats.min),
    max: round(r.stats.max),
  };
}
