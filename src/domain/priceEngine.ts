import type { Confidence, Observation, PriceEstimate } from "./types";

export interface Costs {
  shipping: number;
  promo: number;
  margin: number;
}

/** Peso de cada tipo de observação no preço típico entre pessoas. Recompra, recondicionado e novo ficam de fora: são piso e teto. */
const KIND_WEIGHT = { sold: 1, ask: 0.5 } as const;

/** Preço pedido costuma ficar acima do preço pago. Valor a calibrar com as vendas reais dos utilizadores. */
export const ASK_DISCOUNT = 0.9;
/**
 * Sem vendas nem anúncios, a revenda entre pessoas fica numa faixa entre o piso (o que a loja paga) e o teto
 * (o que a loja vende), em fração do caminho. Calibrado a olho com o PS5 na Vinted (450 a 500) e com os anúncios do
 * eBay.es para PS4 Slim 500 GB. Continua a ser estimativa até haver vendas reais.
 */
export const DERIVED_LOW = 0.2;
export const DERIVED_POSITION = 0.3;
export const DERIVED_HIGH = 0.4;
/** Margem mínima abaixo do piso para a "compra segura": se tudo correr mal, vendes à loja e ainda ganhas. */
export const SAFE_MARGIN = 0.08;

const HALF_LIFE_DAYS = 60;
const RECENT_DAYS = 90;
const DAY_MS = 86_400_000;

/**
 * Oferta sempre redonda e para baixo (24 -> 20, 77 -> 75): números fáceis de propor e uma folga a favor de quem compra.
 * Abaixo de 10 € arredonda ao euro; até 100 € ao múltiplo de 5; até 500 € ao de 10; acima, ao de 25.
 */
export function friendlyDown(n: number): number {
  if (n <= 0) return 0;
  const step = n < 10 ? 1 : n < 100 ? 5 : n < 500 ? 10 : 25;
  return Math.floor(n / step) * step;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function ageDays(date: string, today: Date): number {
  return Math.max(0, (today.getTime() - new Date(date).getTime()) / DAY_MS);
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function weightedPercentile(items: { value: number; weight: number }[], p: number): number {
  const s = [...items].sort((a, b) => a.value - b.value);
  const total = s.reduce((acc, i) => acc + i.weight, 0);
  let cum = 0;
  for (const i of s) {
    cum += i.weight;
    if (cum / total >= p) return i.value;
  }
  return s[s.length - 1].value;
}

function dedupe(list: Observation[]): Observation[] {
  const seen = new Set<string>();
  return list.filter((o) => {
    const key = `${o.source}|${o.kind}|${o.value}|${o.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const EMPTY: PriceEstimate = {
  low: 0, typical: 0, high: 0, maxBuy: 0, firm: false, confidence: "baixa", count: 0, derived: false,
};

export function estimate(observations: Observation[], costs: Costs, today = new Date()): PriceEstimate {
  const all = dedupe(observations);
  const buyback = all.filter((o) => o.kind === "buyback").map((o) => o.value);
  const retail = all.filter((o) => o.kind === "refurb").map((o) => o.value);
  const newPrices = all.filter((o) => o.kind === "new").map((o) => o.value);

  const floor = buyback.length ? median(buyback) : undefined;
  const ceiling = retail.length ? median(retail) : newPrices.length ? median(newPrices) : undefined;

  const peer = all
    .filter((o) => o.kind === "sold" || o.kind === "ask")
    .map((o) => ({ ...o, adjusted: o.kind === "ask" ? o.value * ASK_DISCOUNT : o.value }));

  let low = 0;
  let typical = 0;
  let high = 0;
  let count = 0;
  let confidence: Confidence = "baixa";
  let derived = false;

  if (peer.length > 0) {
    const rough = median(peer.map((o) => o.adjusted));
    const kept = peer.filter((o) => o.adjusted >= rough * 0.3 && o.adjusted <= rough * 3);
    const weighted = kept.map((o) => ({
      value: o.adjusted,
      weight: KIND_WEIGHT[o.kind as "sold" | "ask"] * Math.pow(0.5, ageDays(o.date, today) / HALF_LIFE_DAYS),
    }));
    low = weightedPercentile(weighted, 0.25);
    typical = weightedPercentile(weighted, 0.5);
    high = weightedPercentile(weighted, 0.75);
    count = kept.length;

    const recent = kept.filter((o) => ageDays(o.date, today) <= RECENT_DAYS);
    if (recent.length >= 10 && recent.some((o) => o.kind === "sold")) confidence = "alta";
    else if (kept.length >= 4) confidence = "media";
  } else if (floor !== undefined && ceiling !== undefined && ceiling > floor) {
    const spread = ceiling - floor;
    low = floor + DERIVED_LOW * spread;
    typical = floor + DERIVED_POSITION * spread;
    high = floor + DERIVED_HIGH * spread;
    count = buyback.length + retail.length;
    derived = true;
  } else {
    return EMPTY;
  }

  // A revenda entre pessoas nunca fica abaixo do que a loja paga: há sempre a saída de vender à loja.
  // Se os anúncios dizem menos, o mais provável é dado contaminado (outro modelo), e o piso protege o resultado.
  if (floor !== undefined) {
    low = Math.max(low, floor);
    typical = Math.max(typical, floor);
    high = Math.max(high, floor);
  }

  if (ceiling !== undefined) {
    low = Math.min(low, ceiling);
    typical = Math.min(typical, ceiling);
    high = Math.min(high, ceiling);
  }

  const maxBuy = Math.max(0, typical - costs.shipping - costs.promo - typical * costs.margin);

  return {
    low: round2(low),
    typical: round2(typical),
    high: round2(high),
    maxBuy: friendlyDown(maxBuy),
    firm: confidence !== "baixa",
    confidence,
    count,
    derived,
    safeBuy: floor === undefined ? undefined : friendlyDown(floor * (1 - SAFE_MARGIN)),
    floor: floor === undefined ? undefined : round2(floor),
    ceiling: ceiling === undefined ? undefined : round2(ceiling),
  };
}
