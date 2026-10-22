// Mostra quantos produtos do catálogo têm preço fiável no estado normal e em peças.
import { PRODUCTS, CONDITIONS } from "../src/domain/catalog";
import { marketObservations } from "../src/data/market";
import { estimate } from "../src/domain/priceEngine";

const obs = marketObservations();
const costs = { shipping: 4, promo: 0, margin: 0.25 };
const rows = { none: [] as string[], low: [] as string[], ok: 0, partsNone: 0, partsLow: 0, partsOk: 0 };
const byCat: Record<string, { n: number; none: number; low: number }> = {};
for (const p of PRODUCTS) {
  const [main, parts] = CONDITIONS[p.category];
  const e = estimate(obs.filter((o) => o.productId === p.id && o.condition === main.id), costs);
  const c = (byCat[p.category] ??= { n: 0, none: 0, low: 0 });
  c.n++;
  if (e.count === 0) { rows.none.push(p.id); c.none++; }
  else if (e.confidence === "baixa") { rows.low.push(p.id); c.low++; }
  else rows.ok++;
  if (parts && p.category !== "game") {
    const ep = estimate(obs.filter((o) => o.productId === p.id && o.condition === parts.id), costs);
    if (ep.count === 0) rows.partsNone++;
    else if (ep.confidence === "baixa") rows.partsLow++;
    else rows.partsOk++;
  }
}
console.log({ total: PRODUCTS.length, ok: rows.ok, none: rows.none.length, low: rows.low.length, partsNone: rows.partsNone, partsLow: rows.partsLow, partsOk: rows.partsOk });
console.table(byCat);
if (process.argv.includes("--ids")) console.log([...rows.none, ...rows.low].join(","));
