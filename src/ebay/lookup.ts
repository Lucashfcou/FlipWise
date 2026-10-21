import { productClassifier } from "./queries";
import { cleanDeviceType, cleanSpecs, isDistinctive, lookupProductQuery, specMatcher } from "./titleMatch";
import type { ProductQuery } from "./titleMatch";

export { cleanDeviceType, cleanLookupQuery, cleanSpecs, lookupProductQuery, specMatcher } from "./titleMatch";
import { hasDeviceCategory, searchItems, suggestCategory, toRaw } from "./client";
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

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

const round = (n: number) => Math.round(n * 100) / 100;


/** Boa o bastante para mostrar sem pedir segunda opinião à IA. */
export function lookupConfident(r: LookupResult | null): boolean {
  if (!r) return false;
  return r.reliability === "media" || (r.basis === "specs" && r.n >= 6) || (r.basis === "model" && r.n >= 10 && r.spread <= 0.8);
}

/** Para escolher o melhor entre vários nomes candidatos. */
export function lookupScore(r: LookupResult | null): number {
  if (!r) return -1;
  const basis = r.basis === "specs" ? 3000 : r.basis === "model" ? 2000 : 0;
  return basis + (r.reliability === "media" ? 500 : 0) + Math.min(r.n, 50) * 10 - Math.min(r.spread, 3) * 10;
}

/**
 * Pesquisa o nome no eBay e calcula a faixa de preços com o mesmo pipeline do catálogo. Primeiro o nome completo (com as
 * mesmas especificações quando há anúncios suficientes), depois variantes que mantêm o código do modelo. Só quando o nome
 * não tem código de modelo (ou o aparelho é um portátil) comparam-se modelos parecidos, sempre marcado como "família".
 */
export async function runLookup(
  token: string,
  site: MarketplaceId,
  q: string,
  opts: { specs?: string[]; deviceType?: string; fetchImpl?: typeof fetch; minValid?: number } = {},
): Promise<LookupResult | null> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const minValid = opts.minValid ?? 8;
  const specs = cleanSpecs(opts.specs ?? []);
  const type = cleanDeviceType(opts.deviceType);

  let category: { id: string; name: string } | null = null;
  try {
    category = await suggestCategory(token, site, q, fetchImpl, type);
  } catch {
    category = null;
  }

  const words = q.split(/\s+/);
  const hasCode = words.some(isDistinctive);
  const tiers: { name: string; family: boolean }[] = [{ name: q, family: false }];
  // Sem a marca (muitos títulos escrevem só "Ryzen 7 5700X").
  if (hasCode && words.length >= 3 && /^[a-z]+$/i.test(words[0])) tiers.push({ name: words.slice(1).join(" "), family: false });
  // Só o código do modelo, mais a palavra que o antecede.
  const ci = words.findIndex(isDistinctive);
  if (ci > 0) tiers.push({ name: words.slice(Math.max(0, ci - 1)).join(" "), family: false });
  // Modelos parecidos: só quando não há código de modelo, ou em portáteis (que existem em muitas configurações).
  if (words.length >= 3 && (!hasCode || /laptop|notebook/i.test(type))) {
    tiers.push({ name: words.slice(0, -1).join(" "), family: true });
    tiers.push({ name: words.slice(0, 2).join(" "), family: true });
  }
  // Último recurso (armazenamento, memória...): marca + tipo + capacidade.
  if (type && specs.length > 0) tiers.push({ name: `${words[0]} ${type} ${specs[0]}`, family: true });
  // Tipo de aparelho com categoria própria: pesquisa só nessa categoria (e salta o país onde ela não existe).
  // Tipo desconhecido: pesquisa sem categoria.
  const catChoices = category ? [category] : hasDeviceCategory(type) ? [] : [null];
  for (const cat of catChoices) {
  const seen = new Set<string>();

  for (const tier of tiers) {
    const key = tier.name.toLowerCase();
    if (seen.has(key) || tier.name.length < 3) continue;
    seen.add(key);
    const base = lookupProductQuery(tier.name);
    {
      const items = await searchItems(token, site, tier.name, 100, fetchImpl, "USED", cat?.id);
      const raw = toRaw(items);
      const attempts: { basis: "specs" | "model" | "family"; query: ProductQuery; needed: number }[] = [];
      if (specs.length > 0) attempts.push({ basis: tier.family ? "family" : "specs", query: { ...base, must: [...base.must, ...specs.map(specMatcher)] }, needed: Math.max(minValid, 6) });
      attempts.push({ basis: tier.family ? "family" : "model", query: base, needed: tier.family ? Math.max(minValid, 8) : minValid });

      for (const att of attempts) {
        const r = await runPipeline(tier.name, raw, productClassifier(att.query), "EUR");
        if (!r.stats || r.counts.final < att.needed) continue;
        const sorted = [...r.prices].sort((x, y) => x - y);
        const low = quantile(sorted, 0.25);
        const high = quantile(sorted, 0.75);
        const spread = r.stats.median > 0 ? (high - low) / r.stats.median : 99;
        const reliability = att.basis === "specs" ? (spread <= 1.0 ? "media" : "baixa") : att.basis === "model" && r.counts.final >= 15 && spread <= 0.6 ? "media" : "baixa";
        return {
          query: q,
          searched: tier.name,
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
          category: cat?.name,
          spread: round(spread),
          reliability,
        };
      }
    }
  }
  }
  return null;
}
