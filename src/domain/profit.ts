import type { StockItem } from "./types";

const DAY_MS = 86_400_000;

export function itemProfit(item: StockItem): { profit: number; margin: number } | null {
  if (!item.sale) return null;
  const invested = item.cost + item.extraCosts;
  const profit = item.sale.price - invested - item.sale.shipping;
  return { profit, margin: invested > 0 ? profit / invested : 0 };
}

export function daysHeld(item: StockItem, today = new Date()): number {
  const end = item.sale ? new Date(item.sale.date) : today;
  return Math.max(0, Math.floor((end.getTime() - new Date(item.boughtDate).getTime()) / DAY_MS));
}

export interface MonthSummary {
  sold: number;
  unsold: number;
  revenue: number;
  profit: number;
  avgDays: number;
}

export function monthlySummary(items: StockItem[], month: string): MonthSummary {
  const sold = items.filter((i) => i.sale && i.sale.date.startsWith(month));
  const profit = sold.reduce((acc, i) => acc + (itemProfit(i)?.profit ?? 0), 0);
  const revenue = sold.reduce((acc, i) => acc + (i.sale?.price ?? 0), 0);
  const days = sold.reduce((acc, i) => acc + daysHeld(i), 0);
  return {
    sold: sold.length,
    unsold: items.filter((i) => !i.sale).length,
    revenue,
    profit,
    avgDays: sold.length ? Math.round(days / sold.length) : 0,
  };
}
