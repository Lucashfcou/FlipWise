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

/** O título tem de conter todas as palavras do nome (sem espaços nem hífenes, para "WH-CH720N" casar com "WH CH720N"). */
export function lookupProductQuery(q: string): ProductQuery {
  const words = q.split(/\s+/).map(compact).filter((w) => w.length >= 2);
  const must = words.map((w) => ({ test: (title: string) => compact(title).includes(w) }));
  return { q, must, mustNot: [] };
}

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Pesquisa o nome no eBay e calcula a faixa de preços com o mesmo pipeline do catálogo. Devolve null se há poucos anúncios válidos. */
export async function runLookup(token: string, site: MarketplaceId, q: string, fetchImpl: typeof fetch = fetch, minValid = 6): Promise<LookupResult | null> {
  const items = await searchItems(token, site, q, 100, fetchImpl, "USED");
  const query = lookupProductQuery(q);
  const r = await runPipeline(q, toRaw(items), productClassifier(query), "EUR");
  if (!r.stats || r.counts.final < minValid) return null;
  const sorted = [...r.prices].sort((a, b) => a - b);
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
