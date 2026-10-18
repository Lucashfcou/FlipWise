import { sanitize } from "./sanitize";
import { iqrFilter, summarize } from "./stats";
import type { Classifier, Listing, PipelineResult } from "./types";

/**
 * Pipeline completo: JSON bruto -> sanitização -> classificação -> filtro de moeda -> IQR -> estatística.
 * A classificação decide o que entra; todas as contas são feitas aqui, em código.
 */
export async function runPipeline(
  query: string,
  rawItems: unknown,
  classifier: Classifier,
  defaultCurrency = "EUR",
): Promise<PipelineResult> {
  const listings = sanitize(rawItems, defaultCurrency);
  const verdicts = await classifier.classify(query, listings);
  const verdictById = new Map(verdicts.map((v) => [v.id, v]));

  const rejected: PipelineResult["rejected"] = [];
  const valid: (Listing & { price: number })[] = [];
  for (const l of listings) {
    const v = verdictById.get(l.id);
    if (v?.valid && l.price !== null) valid.push({ ...l, price: l.price });
    else rejected.push({ id: l.id, title: l.title, reason: v?.reason || "sem classificação" });
  }

  // Preços em moedas diferentes não se misturam: usa-se a moeda com mais anúncios válidos.
  const counts = new Map<string, number>();
  valid.forEach((l) => counts.set(l.currency, (counts.get(l.currency) ?? 0) + 1));
  const currency = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? defaultCurrency;
  const inCurrency = valid.filter((l) => {
    if (l.currency === currency) return true;
    rejected.push({ id: l.id, title: l.title, reason: `moeda ${l.currency} diferente de ${currency}` });
    return false;
  });

  const filter = iqrFilter(inCurrency.map((l) => l.price));
  const outliers = inCurrency
    .filter((l) => filter.applied && (l.price < filter.lower || l.price > filter.upper))
    .map((l) => ({ id: l.id, title: l.title, price: l.price }));
  const stats = summarize(filter.kept);

  return {
    query,
    classifier: classifier.name,
    counts: { captured: listings.length, validated: valid.length, final: filter.kept.length },
    stats: stats ? { ...stats, currency } : null,
    prices: filter.kept,
    iqr: filter.applied
      ? { q1: filter.q1, q3: filter.q3, lower: filter.lower, upper: filter.upper, applied: true }
      : { q1: NaN, q3: NaN, lower: NaN, upper: NaN, applied: false },
    rejected,
    outliers,
  };
}
