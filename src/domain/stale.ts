import { daysHeld } from "./profit";
import type { PriceEstimate, Settings, StockItem } from "./types";

/** Quanto baixar por cada semana depois do limite de dias. */
export const STEP_DOWN = 0.05;

export interface StaleAdvice {
  days: number;
  stale: boolean;
  /** Preço sugerido para anunciar agora. */
  suggested: number;
  /** Lucro se vender ao preço sugerido (já com envio). */
  profit: number;
  /** true quando a baixa já chegou ao custo: não dá para baixar mais sem prejuízo. */
  atBreakEven: boolean;
}

const r0 = (n: number) => Math.round(n);

export function staleAdvice(
  item: StockItem,
  price: PriceEstimate,
  settings: Pick<Settings, "staleDays" | "shipping" | "promo">,
  today = new Date(),
): StaleAdvice {
  const days = daysHeld(item, today);
  const invested = item.cost + item.extraCosts;
  const breakEven = invested + settings.shipping + settings.promo;
  const base = price.count ? price.typical : invested * 1.3;
  const stale = !item.sale && days >= settings.staleDays;
  const steps = stale ? Math.floor((days - settings.staleDays) / 7) + 1 : 0;
  const target = base * (1 - STEP_DOWN * steps);
  const suggested = Math.max(target, breakEven);
  return {
    days,
    stale,
    suggested: r0(suggested),
    profit: r0(suggested - invested - settings.shipping),
    atBreakEven: target <= breakEven,
  };
}

export function parkedCapital(items: StockItem[]): { capital: number; count: number } {
  const open = items.filter((i) => !i.sale);
  return { capital: open.reduce((a, i) => a + i.cost + i.extraCosts, 0), count: open.length };
}
