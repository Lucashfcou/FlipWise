import { t } from "../i18n";
import { findProduct, productLabel } from "./catalog";
import { itemProfit } from "./profit";
import type { StockItem } from "./types";

/**
 * Referência informativa: regra europeia (DAC7) em que as plataformas comunicam ao fisco os vendedores
 * com 30 ou mais vendas, ou 2000 € ou mais, num ano. CONFIRMA os limites atuais e como se aplicam a ti
 * com um contabilista. Isto não é aconselhamento fiscal.
 */
export const THRESHOLDS = { count: 30, revenue: 2000 } as const;
const NEAR = 0.8;

export interface PlatformTotals {
  platform: string;
  count: number;
  revenue: number;
  countPct: number;
  revenuePct: number;
  status: "ok" | "perto" | "acima";
}

export interface TaxSummary {
  year: string;
  sales: number;
  revenue: number;
  invested: number;
  profit: number;
  platforms: PlatformTotals[];
}

export function taxSummary(items: StockItem[], year: string): TaxSummary {
  const sold = items.filter((i) => i.sale && i.sale.date.startsWith(year));
  const byPlatform = new Map<string, { count: number; revenue: number }>();
  let revenue = 0;
  let invested = 0;
  let profit = 0;
  for (const i of sold) {
    const s = i.sale!;
    revenue += s.price;
    invested += i.cost + i.extraCosts;
    profit += itemProfit(i)?.profit ?? 0;
    const cur = byPlatform.get(s.platform) ?? { count: 0, revenue: 0 };
    byPlatform.set(s.platform, { count: cur.count + 1, revenue: cur.revenue + s.price });
  }
  const platforms: PlatformTotals[] = [...byPlatform.entries()]
    .map(([platform, v]) => {
      const countPct = v.count / THRESHOLDS.count;
      const revenuePct = v.revenue / THRESHOLDS.revenue;
      const top = Math.max(countPct, revenuePct);
      return {
        platform,
        count: v.count,
        revenue: v.revenue,
        countPct,
        revenuePct,
        status: top >= 1 ? ("acima" as const) : top >= NEAR ? ("perto" as const) : ("ok" as const),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
  return { year, sales: sold.length, revenue, invested, profit, platforms };
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Vendas do ano em CSV, com ";" e vírgula decimal (abre direto no Excel em português). */
export function salesCsv(items: StockItem[], year: string): string {
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const header = t("tax.csv.header").split(";");
  const rows = items
    .filter((i) => i.sale && i.sale.date.startsWith(year))
    .sort((a, b) => a.sale!.date.localeCompare(b.sale!.date))
    .map((i) => {
      const p = findProduct(i.productId);
      const s = i.sale!;
      return [
        i.boughtDate, s.date, p ? productLabel(p) : i.productId, i.condition, i.boughtAt,
        s.platform, num(i.cost), num(i.extraCosts), num(s.price), num(s.shipping), num(itemProfit(i)?.profit ?? 0),
      ].map(csvCell).join(";");
    });
  return [header.join(";"), ...rows].join("\n");
}
