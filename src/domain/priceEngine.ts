import type { Confidence, Observation, ObservationKind, PriceEstimate } from "./types";

export interface Costs {
  shipping: number;
  promo: number;
  margin: number;
}

const KIND_WEIGHT: Record<ObservationKind, number> = {
  sold: 1,
  buyback: 0.8,
  refurb: 0.7,
  ask: 0.5,
  new: 0,
};

const ASK_DISCOUNT = 0.9;
const HALF_LIFE_DAYS = 60;
const RECENT_DAYS = 90;
const DAY_MS = 86_400_000;

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

export function estimate(observations: Observation[], costs: Costs, today = new Date()): PriceEstimate {
  const newPrices = observations.filter((o) => o.kind === "new").map((o) => o.value);

  const seen = new Set<string>();
  const used = observations
    .filter((o) => o.kind !== "new")
    .filter((o) => {
      const key = `${o.source}|${o.kind}|${o.value}|${o.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((o) => ({ ...o, adjusted: o.kind === "ask" ? o.value * ASK_DISCOUNT : o.value }));

  if (used.length === 0) {
    return { low: 0, typical: 0, high: 0, maxBuy: 0, firm: false, confidence: "baixa", count: 0 };
  }

  const rough = median(used.map((o) => o.adjusted));
  const kept = used.filter((o) => o.adjusted >= rough * 0.3 && o.adjusted <= rough * 3);

  const weighted = kept.map((o) => ({
    value: o.adjusted,
    weight: KIND_WEIGHT[o.kind] * Math.pow(0.5, ageDays(o.date, today) / HALF_LIFE_DAYS),
  }));

  let low = weightedPercentile(weighted, 0.25);
  let typical = weightedPercentile(weighted, 0.5);
  let high = weightedPercentile(weighted, 0.75);

  if (newPrices.length > 0) {
    const cap = median(newPrices);
    low = Math.min(low, cap);
    typical = Math.min(typical, cap);
    high = Math.min(high, cap);
  }

  const recent = kept.filter((o) => ageDays(o.date, today) <= RECENT_DAYS);
  const hasSold = recent.some((o) => o.kind === "sold");
  let confidence: Confidence = "baixa";
  if (recent.length >= 10 && hasSold) confidence = "alta";
  else if (kept.length >= 4) confidence = "media";

  const maxBuy = Math.max(0, typical - costs.shipping - costs.promo - typical * costs.margin);

  return {
    low: round2(low),
    typical: round2(typical),
    high: round2(high),
    maxBuy: round2(maxBuy),
    firm: confidence !== "baixa",
    confidence,
    count: kept.length,
  };
}
