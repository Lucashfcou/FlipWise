import { money } from "../format";
import { t } from "../i18n";
import { findProduct, productLabel } from "./catalog";
import type { Condition, PriceEstimate, Settings } from "./types";

export interface BundleLine {
  productId: string;
  condition: Condition;
  qty: number;
  /** Artigo fora do catálogo, já com preço (busca no eBay): usa este preço e este nome em vez do catálogo. */
  custom?: { label: string; price: PriceEstimate };
}

/** Vender tudo junto costuma obrigar a um desconto. Hipótese a calibrar com vendas reais. */
export const BUNDLE_DISCOUNT = 0.9;

export interface BundleItem {
  line: BundleLine;
  price: PriceEstimate;
  found: boolean;
  label: string;
}

export interface BundleResult {
  items: BundleItem[];
  totalUnits: number;
  /** Unidades com preço no catálogo. As outras ficam de fora das somas. */
  pricedUnits: number;
  missingUnits: number;
  sumTypical: number;
  sumSafe: number;
  separate: { net: number; maxBuy: number; sales: number };
  together: { net: number; maxBuy: number; sales: number };
  best: "separado" | "junto";
  maxBuy: number;
  decision: { light: "go" | "maybe" | "stop"; title: string; text: string } | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;


export function evaluateBundle(
  lines: BundleLine[],
  priceFor: (productId: string, condition: Condition) => PriceEstimate,
  settings: Pick<Settings, "targetMargin" | "shipping" | "promo">,
  asked: number | null,
  /** Unidades do anúncio sem preço que nem entram nas linhas (jogos e acessórios lidos do print). */
  extraUnpriced = 0,
): BundleResult {
  const items: BundleItem[] = lines.map((line) => {
    if (line.custom) return { line, price: line.custom.price, found: line.custom.price.count > 0, label: line.custom.label };
    const price = priceFor(line.productId, line.condition);
    const p = findProduct(line.productId);
    return { line, price, found: price.count > 0, label: p ? productLabel(p) : line.productId };
  });

  let totalUnits = 0;
  let pricedUnits = 0;
  let sumTypical = 0;
  let sumSafe = 0;
  for (const it of items) {
    const q = Math.max(1, Math.round(it.line.qty));
    totalUnits += q;
    if (!it.found) continue;
    pricedUnits += q;
    sumTypical += it.price.typical * q;
    sumSafe += (it.price.safeBuy ?? it.price.maxBuy) * q;
  }

  const perSale = settings.shipping + settings.promo;
  const sepNet = sumTypical - pricedUnits * perSale;
  const sepMax = Math.max(0, sepNet - settings.targetMargin * sumTypical);
  const togNet = sumTypical * BUNDLE_DISCOUNT - (pricedUnits > 0 ? perSale : 0);
  const togMax = Math.max(0, togNet - settings.targetMargin * sumTypical * BUNDLE_DISCOUNT);

  const best = togMax > sepMax ? "junto" : "separado";
  const maxBuy = Math.max(sepMax, togMax);

  let decision: BundleResult["decision"] = null;
  if (asked !== null && Number.isFinite(asked) && asked > 0 && pricedUnits > 0) {
    const unpriced = totalUnits - pricedUnits + extraUnpriced;
    if (asked > maxBuy && asked > sumSafe && unpriced > 0) {
      // Só parte das peças tem preço: não se pode dizer "deixa" nem "negoceia" comparando o total pedido com uma parte do lote.
      decision = {
        light: "maybe",
        title: t("lot.partialTitle"),
        text: t("lot.partialText", { priced: pricedUnits, total: pricedUnits + unpriced, worth: money(sumTypical), asked: money(asked) }),
      };
    } else if (asked <= maxBuy) {
      decision = {
        light: "go",
        title: t("lot.buyTitle"),
        text: t("lot.buyText", { amount: money(maxBuy - asked), how: best === "junto" ? t("lot.buyTogether") : t("lot.buyApart") }),
      };
    } else if (asked <= sumSafe) {
      decision = { light: "maybe", title: t("decide.thin"), text: t("lot.thinText") };
    } else if (asked <= sumTypical) {
      decision = { light: "maybe", title: t("decide.negotiate"), text: t("lot.negText", { price: money(Math.max(maxBuy, sumSafe)) }) };
    } else {
      decision = { light: "stop", title: t("decide.pass"), text: t("lot.passText", { amount: money(asked - sumTypical) }) };
    }
  }

  return {
    items,
    totalUnits,
    pricedUnits,
    missingUnits: totalUnits - pricedUnits,
    sumTypical: r2(sumTypical),
    sumSafe: r2(sumSafe),
    separate: { net: r2(sepNet), maxBuy: r2(sepMax), sales: pricedUnits },
    together: { net: r2(togNet), maxBuy: r2(togMax), sales: pricedUnits > 0 ? 1 : 0 },
    best,
    maxBuy: r2(maxBuy),
    decision,
  };
}

/** Reparte o custo do lote pelas peças, proporcional ao valor típico (peças sem preço pesam a média). */
export function allocateCost(lines: BundleLine[], items: BundleItem[], totalCost: number): number[] {
  const units: { idx: number; weight: number }[] = [];
  const known = items.filter((i) => i.found).map((i) => i.price.typical);
  const avg = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 1;
  items.forEach((it, idx) => {
    const q = Math.max(1, Math.round(lines[idx].qty));
    for (let k = 0; k < q; k++) units.push({ idx, weight: it.found ? it.price.typical : avg });
  });
  const total = units.reduce((a, u) => a + u.weight, 0) || 1;
  return units.map((u) => r2((totalCost * u.weight) / total));
}
